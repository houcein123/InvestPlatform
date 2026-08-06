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
 */
async function createOrder(sectorId, utilisateurId = null) {
    const { rows: secteurs } = await pool.query(
        "SELECT id, nom, prix_rapport FROM secteurs WHERE id = $1 AND est_actif = true",
        [sectorId]
    );
    if (secteurs.length === 0) return null;
    const secteur = secteurs[0];

    const { rows } = await pool.query(
        `INSERT INTO achats (id_utilisateur, id_secteur, montant, statut_paiement)
         VALUES ($1,$2,$3,'en_attente')
         RETURNING id, montant, statut_paiement, date_achat`,
        [utilisateurId, secteur.id, secteur.prix_rapport]
    );

    return { achat: rows[0], secteur };
}

/** Enregistre la transaction PayPal rattachée à un achat. */
async function recordPayment({ achatId, utilisateurId, montant, devise, transactionId, statut }) {
    await pool.query(
        `INSERT INTO paiements
            (achat_id, utilisateur_id, montant, devise, methode, transaction_id, statut, date_paiement)
         VALUES ($1,$2,$3,$4,'paypal',$5,$6, CURRENT_TIMESTAMP)`,
        [achatId, utilisateurId, montant, devise, transactionId, statut]
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
 * Le LEFT JOIN garantit que les 6 secteurs apparaissent, même sans vente.
 */
async function getSalesStats() {
    const { rows } = await pool.query(`
        SELECT s.id,
               s.nom,
               s.slug,
               s.prix_rapport,
               COUNT(DISTINCT a.id) FILTER (WHERE a.statut_paiement = 'paye')::int AS nb_ventes,
               COALESCE(SUM(a.montant) FILTER (WHERE a.statut_paiement = 'paye'), 0)::float AS revenu,
               COUNT(DISTINCT r.id)::int AS nb_rapports_generes
          FROM secteurs s
          LEFT JOIN achats a   ON a.id_secteur = s.id
          LEFT JOIN rapports r ON r.secteur_id = s.id
         GROUP BY s.id, s.nom, s.slug, s.prix_rapport
         ORDER BY s.id
    `);

    const totaux = rows.reduce(
        (acc, r) => ({
            nb_ventes: acc.nb_ventes + r.nb_ventes,
            revenu: acc.revenu + r.revenu,
            nb_rapports_generes: acc.nb_rapports_generes + r.nb_rapports_generes,
        }),
        { nb_ventes: 0, revenu: 0, nb_rapports_generes: 0 }
    );

    return { devise: config.devise, parSecteur: rows, totaux };
}

/** Derniers rapports générés, tous clients confondus (panneau admin). */
async function listRecentReports(limit = 10) {
    const { rows } = await pool.query(
        `SELECT r.id, r.titre, r.chemin_fichier, r.statut, r.date_generation,
                s.nom AS secteur, u.email AS client
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
      LEFT JOIN utilisateurs u ON u.id = r.utilisateur_id
       ORDER BY r.date_generation DESC NULLS LAST
          LIMIT $1`,
        [limit]
    );
    return rows;
}

/** Rapports d'un client — alimente son espace personnel (CDC §6, étape 4). */
async function listUserReports(utilisateurId) {
    const { rows } = await pool.query(
        `SELECT r.id, r.titre, r.chemin_fichier, r.statut, r.date_generation,
                s.nom AS secteur, s.slug, a.montant, a.date_achat
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
      LEFT JOIN achats a ON a.id_utilisateur = r.utilisateur_id AND a.id_secteur = r.secteur_id
          WHERE r.utilisateur_id = $1
       ORDER BY r.date_generation DESC NULLS LAST`,
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
    listUserReports,
};
