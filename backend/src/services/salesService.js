// ============================================================================
// Achats et statistiques de vente (CDC §6 étape 2, §7).
// ----------------------------------------------------------------------------
// Le paiement PayPal réel n'est pas encore branché : createOrder/capturePayment
// simulent la transaction mais l'achat est bel et bien tracé en base, si bien
// que le branchement de PayPal ne changera que le contenu de capturePayment().
// ============================================================================

const { pool } = require("../config/db");

const DEVISE = "TND";

/**
 * Crée un achat « en attente » pour un secteur.
 * @returns {Promise<{achat: object, secteur: object}|null>}
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

/** Marque l'achat comme payé. À remplacer par la capture PayPal réelle. */
async function capturePayment(achatId) {
    const { rows } = await pool.query(
        `UPDATE achats SET statut_paiement = 'paye'
          WHERE id = $1 AND statut_paiement = 'en_attente'
      RETURNING id, id_secteur, montant`,
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
 * Les secteurs sans vente apparaissent à zéro grâce au LEFT JOIN — le tableau
 * admin liste ainsi toujours les 6 secteurs.
 */
async function getSalesStats() {
    const { rows } = await pool.query(`
        SELECT s.id,
               s.nom,
               s.slug,
               s.prix_rapport,
               COUNT(a.id) FILTER (WHERE a.statut_paiement = 'paye')::int AS nb_ventes,
               COALESCE(SUM(a.montant) FILTER (WHERE a.statut_paiement = 'paye'), 0)::float AS revenu,
               COUNT(r.id)::int AS nb_rapports_generes
          FROM secteurs s
          LEFT JOIN achats a ON a.id_secteur = s.id
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

    return { devise: DEVISE, parSecteur: rows, totaux };
}

/** Derniers rapports générés, pour le tableau de bord admin. */
async function listRecentReports(limit = 10) {
    const { rows } = await pool.query(
        `SELECT r.id, r.titre, r.chemin_fichier, r.statut, r.date_generation, s.nom AS secteur
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
       ORDER BY r.date_generation DESC NULLS LAST
          LIMIT $1`,
        [limit]
    );
    return rows;
}

module.exports = { createOrder, capturePayment, findAchat, getSalesStats, listRecentReports, DEVISE };
