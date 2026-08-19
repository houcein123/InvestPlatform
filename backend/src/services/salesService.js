// ============================================================================
// Achats, paiements et statistiques de vente (CDC §6 étape 2, §7).
// ----------------------------------------------------------------------------
// Un achat est créé « en attente » avant l'appel à PayPal, puis passé à
// « paye » à la capture. Le rapport n'est généré qu'à partir d'un achat payé :
// c'est cet enregistrement qui fait foi, pas une réponse du frontend.
// ============================================================================

const { pool } = require("../config/db");
const { config } = require("../config/env");

/**
 * Crée un achat en attente.
 * @param {number} sectorId
 * @param {number|null} utilisateurId rattache l'achat à l'espace du client connecté
 * @param {'simulation'|'paypal'} mode mémorisé sur l'achat : la capture s'y
 *        réfère ensuite, plutôt que de relire la configuration du serveur qui
 *        aurait pu changer entre la commande et sa validation.
 */
async function createOrder(sectorId, utilisateurId = null, mode = "paypal") {
    const { rows: secteurs } = await pool.query(
        "SELECT id, nom, prix_rapport FROM secteurs WHERE id = $1 AND est_actif = true",
        [sectorId]
    );
    if (secteurs.length === 0) return null;
    const secteur = secteurs[0];

    const { rows } = await pool.query(
        `INSERT INTO achats (id_utilisateur, id_secteur, montant, statut_paiement, mode_paiement)
         VALUES ($1,$2,$3,'en_attente',$4)
         RETURNING id, montant, statut_paiement, mode_paiement, date_achat`,
        [utilisateurId, secteur.id, secteur.prix_rapport, mode]
    );

    return { achat: rows[0], secteur };
}

/**
 * Enregistre la transaction rattachée à un achat.
 * `emailPayeur` identifie le compte PayPal ayant réglé — jamais de mot de passe.
 */
async function recordPayment({
    achatId, utilisateurId, montant, devise, methode,
    transactionId, statut, emailPayeur = null, nomPayeur = null,
}) {
    await pool.query(
        `INSERT INTO paiements
            (achat_id, utilisateur_id, montant, devise, methode, transaction_id,
             statut, email_payeur, nom_payeur, date_paiement)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, CURRENT_TIMESTAMP)`,
        [achatId, utilisateurId, montant, devise, methode || "paypal",
         transactionId, statut, emailPayeur, nomPayeur]
    );
}

/**
 * Marque l'achat comme payé.
 * La clause `statut_paiement = 'en_attente'` rend l'opération idempotente :
 * rejouer une capture ne crée pas un second encaissement.
 */
async function markPaid(achatId) {
    const { rows } = await pool.query(
        `UPDATE achats SET statut_paiement = 'paye'
          WHERE id = $1 AND statut_paiement = 'en_attente'
      RETURNING id, id_secteur, id_utilisateur, montant`,
        [achatId]
    );
    return rows[0] || null;
}

async function findAchat(achatId) {
    const { rows } = await pool.query("SELECT * FROM achats WHERE id = $1", [achatId]);
    return rows[0] || null;
}

/**
 * Statistiques de vente par secteur (CDC §7).
 *
 * Les ventes simulées sont comptées SÉPARÉMENT : les additionner au chiffre
 * d'affaires réel donnerait un tableau de bord mensonger. Le revenu affiché
 * ne provient donc que des transactions réellement encaissées.
 *
 * Le LEFT JOIN garantit que les 6 secteurs apparaissent, même sans vente.
 */
async function getSalesStats() {
    // ⚠️ NE JAMAIS agréger `achats` et `rapports` dans un même GROUP BY :
    // les deux se rattachent au secteur, la jointure produit donc un produit
    // cartésien et SUM(montant) compte chaque achat autant de fois qu'il
    // existe de rapports pour ce secteur. `COUNT(DISTINCT)` y résiste, pas
    // `SUM`. Le bug gonflait le chiffre d'affaires (664,85 au lieu de 324,93
    // sur un jeu de 7 achats). Chaque table est donc agrégée séparément.
    const { rows } = await pool.query(`
        SELECT s.id,
               s.nom,
               s.slug,
               s.prix_rapport,
               COALESCE(v.nb_ventes, 0)::int            AS nb_ventes,
               COALESCE(v.revenu, 0)::float             AS revenu,
               COALESCE(v.nb_ventes_simulees, 0)::int   AS nb_ventes_simulees,
               COALESCE(v.revenu_simule, 0)::float      AS revenu_simule,
               COALESCE(rp.nb_rapports, 0)::int         AS nb_rapports_generes
          FROM secteurs s
          LEFT JOIN (
                SELECT id_secteur,
                       COUNT(*)      FILTER (WHERE mode_paiement <> 'simulation') AS nb_ventes,
                       SUM(montant)  FILTER (WHERE mode_paiement <> 'simulation') AS revenu,
                       COUNT(*)      FILTER (WHERE mode_paiement = 'simulation')  AS nb_ventes_simulees,
                       SUM(montant)  FILTER (WHERE mode_paiement = 'simulation')  AS revenu_simule
                  FROM achats
                 WHERE statut_paiement = 'paye'
              GROUP BY id_secteur
          ) v ON v.id_secteur = s.id
          LEFT JOIN (
                SELECT secteur_id, COUNT(*) AS nb_rapports
                  FROM rapports
              GROUP BY secteur_id
          ) rp ON rp.secteur_id = s.id
         ORDER BY s.id
    `);

    // Le tableau de bord affiche le TOTAL des ventes : en mode démonstration,
    // n'afficher que le chiffre d'affaires réel laissait la page à zéro en
    // permanence et la rendait inutilisable. La part simulée reste distinguée
    // pour que le chiffre réel demeure lisible.
    const parSecteur = rows.map((r) => ({
        ...r,
        nb_ventes_total: r.nb_ventes + r.nb_ventes_simulees,
        revenu_total: Math.round((r.revenu + r.revenu_simule) * 100) / 100,
    }));

    const totaux = parSecteur.reduce(
        (acc, r) => ({
            nb_ventes: acc.nb_ventes + r.nb_ventes,
            revenu: Math.round((acc.revenu + r.revenu) * 100) / 100,
            nb_ventes_simulees: acc.nb_ventes_simulees + r.nb_ventes_simulees,
            revenu_simule: Math.round((acc.revenu_simule + r.revenu_simule) * 100) / 100,
            nb_ventes_total: acc.nb_ventes_total + r.nb_ventes_total,
            revenu_total: Math.round((acc.revenu_total + r.revenu_total) * 100) / 100,
            nb_rapports_generes: acc.nb_rapports_generes + r.nb_rapports_generes,
        }),
        {
            nb_ventes: 0, revenu: 0,
            nb_ventes_simulees: 0, revenu_simule: 0,
            nb_ventes_total: 0, revenu_total: 0,
            nb_rapports_generes: 0,
        }
    );

    return { devise: config.devise, mode: config.paiementMode, parSecteur, totaux };
}

/** Derniers rapports générés, tous clients confondus (panneau admin). */
async function listRecentReports(limit = 10) {
    // Le compte payeur remonte du dernier règlement abouti pour ce secteur et
    // ce client : c'est la trace comptable de la commande.
    const { rows } = await pool.query(
        `SELECT r.id, r.titre, r.chemin_fichier, r.statut, r.date_generation,
                s.nom AS secteur, u.email AS client,
                p.email_payeur, p.methode, p.montant AS montant_paye, p.devise
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
      LEFT JOIN utilisateurs u ON u.id = r.utilisateur_id
      LEFT JOIN LATERAL (
                SELECT pa.email_payeur, pa.methode, pa.montant, pa.devise
                  FROM paiements pa
                  JOIN achats a ON a.id = pa.achat_id
                 WHERE a.id_secteur = r.secteur_id
                   AND a.id_utilisateur IS NOT DISTINCT FROM r.utilisateur_id
                   AND pa.statut = 'complete'
              ORDER BY pa.date_paiement DESC
                 LIMIT 1
           ) p ON TRUE
       ORDER BY r.date_generation DESC NULLS LAST
          LIMIT $1`,
        [limit]
    );
    return rows;
}

/**
 * Espace client (CDC §6, étape 4).
 *
 * La liste part des ACHATS, pas des rapports : un achat payé dont la
 * génération a échoué doit rester visible, sans quoi le client ne verrait
 * nulle part ce qu'il a payé et n'aurait aucun moyen de relancer.
 */
async function listUserPurchases(utilisateurId) {
    const { rows } = await pool.query(
        `SELECT a.id            AS achat_id,
                a.montant,
                a.date_achat,
                a.mode_paiement,
                s.id            AS secteur_id,
                s.nom           AS secteur,
                r.id            AS rapport_id,
                r.chemin_fichier,
                r.date_generation
           FROM achats a
           JOIN secteurs s ON s.id = a.id_secteur
      LEFT JOIN LATERAL (
                SELECT id, chemin_fichier, date_generation
                  FROM rapports
                 WHERE secteur_id = a.id_secteur
                   AND utilisateur_id IS NOT DISTINCT FROM a.id_utilisateur
                   AND chemin_fichier IS NOT NULL
              ORDER BY date_generation DESC
                 LIMIT 1
           ) r ON TRUE
          WHERE a.id_utilisateur = $1
            AND a.statut_paiement = 'paye'
       ORDER BY a.date_achat DESC`,
        [utilisateurId]
    );
    return rows;
}

module.exports = {
    createOrder,
    recordPayment,
    markPaid,
    findAchat,
    getSalesStats,
    listRecentReports,
    listUserPurchases,
};
