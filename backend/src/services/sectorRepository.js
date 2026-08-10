// ============================================================================
// Accès aux données sectorielles stockées en base.
// ----------------------------------------------------------------------------
// C'est la seule porte d'entrée vers les tables métier (secteurs,
// chiffres_cles, donnees_statistiques, zones_geographiques,
// acteurs_principaux, cadre_reglementaire). Les routes et le générateur PDF
// ne font jamais de SQL directement.
//
// Note : les CSV de data/ ne sont PAS relus à l'exécution. Ils sont importés
// une fois pour toutes en base par sql/setup_investplatform.py ; la base est
// donc la source de vérité unique côté application.
// ============================================================================

const { pool } = require("../config/db");

/** Les 6 secteurs actifs, pour le catalogue public. */
async function listActiveSectors() {
    const { rows } = await pool.query(
        "SELECT * FROM secteurs WHERE est_actif = true ORDER BY id"
    );
    return rows;
}

/** Tous les secteurs, y compris désactivés (panneau admin). */
async function listAllSectors() {
    const { rows } = await pool.query("SELECT * FROM secteurs ORDER BY id");
    return rows;
}

async function findSectorById(id) {
    const { rows } = await pool.query("SELECT * FROM secteurs WHERE id = $1", [id]);
    return rows[0] || null;
}

async function updateSector(id, { nom, description, prix_rapport, est_actif }) {
    const { rows } = await pool.query(
        `UPDATE secteurs
            SET nom = COALESCE($1, nom),
                description = COALESCE($2, description),
                prix_rapport = COALESCE($3, prix_rapport),
                est_actif = COALESCE($4, est_actif),
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
      RETURNING *`,
        [nom, description, prix_rapport, est_actif, id]
    );
    return rows[0] || null;
}

/**
 * Agrège TOUTES les données d'un secteur en un seul objet.
 * Les clés correspondent exactement à ce qu'attendent le générateur PDF et
 * le constructeur de prompts — c'est le contrat commun entre les deux.
 */
async function getSectorData(sectorId) {
    const secteur = await findSectorById(sectorId);
    if (!secteur) return null;

    const [chiffres, stats, zones, acteurs, cadre, benchmarks] = await Promise.all([
        pool.query("SELECT * FROM chiffres_cles WHERE secteur_id = $1", [sectorId]),
        pool.query(
            "SELECT * FROM donnees_statistiques WHERE secteur_id = $1 ORDER BY indicateur",
            [sectorId]
        ),
        pool.query(
            "SELECT * FROM zones_geographiques WHERE secteur_id = $1 AND est_actif = true ORDER BY nom",
            [sectorId]
        ),
        pool.query(
            "SELECT * FROM acteurs_principaux WHERE secteur_id = $1 ORDER BY nom",
            [sectorId]
        ),
        pool.query(
            "SELECT * FROM cadre_reglementaire WHERE secteur_id = $1 AND est_en_vigueur = true ORDER BY annee DESC",
            [sectorId]
        ),
        pool.query(
            "SELECT * FROM benchmarks_regionaux WHERE secteur_id = $1 ORDER BY indicateur",
            [sectorId]
        ),
    ]);

    return {
        secteur,
        chiffresCles: chiffres.rows[0] || null,
        donneesStatistiques: stats.rows,
        zonesGeographiques: zones.rows,
        acteursPrincipaux: acteurs.rows,
        cadreReglementaire: cadre.rows,
        benchmarksRegionaux: benchmarks.rows,
    };
}

// ── Comparatif régional (CDC §4) ───────────────────────────────────────────

async function listBenchmarks(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM benchmarks_regionaux WHERE secteur_id = $1 ORDER BY indicateur",
        [sectorId]
    );
    return rows;
}

/** Champs modifiables d'une ligne de comparatif. */
const BENCHMARK_FIELDS = ["annee", "valeur_tunisie", "valeur_maroc", "valeur_egypte", "source", "commentaire"];

async function updateBenchmark(id, payload) {
    const valeurs = BENCHMARK_FIELDS.map((champ) => {
        const v = payload[champ];
        return v === "" || v === undefined ? null : v;
    });
    const affectations = BENCHMARK_FIELDS.map((champ, i) => `${champ} = $${i + 2}`).join(", ");

    const { rows } = await pool.query(
        `UPDATE benchmarks_regionaux SET ${affectations}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 RETURNING *`,
        [id, ...valeurs]
    );
    return rows[0] || null;
}

// ── Chiffres clés (panneau admin — CDC §7) ─────────────────────────────────

const CHIFFRES_FIELDS = [
    "contribution_pib_pct",
    "croissance_annuelle_pct",
    "nombre_emplois",
    "exportations_mdt",
    "nombre_entreprises",
    "investissements_ide_mdt",
    "part_marche_regional_pct",
];

async function getChiffresCles(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM chiffres_cles WHERE secteur_id = $1",
        [sectorId]
    );
    return rows[0] || null;
}

async function upsertChiffresCles(sectorId, payload) {
    const values = CHIFFRES_FIELDS.map((f) => (payload[f] === "" ? null : payload[f] ?? null));
    const columns = CHIFFRES_FIELDS.join(", ");
    const placeholders = CHIFFRES_FIELDS.map((_, i) => `$${i + 2}`).join(", ");
    const updates = CHIFFRES_FIELDS.map((f, i) => `${f} = $${i + 2}`).join(", ");

    const { rows } = await pool.query(
        `INSERT INTO chiffres_cles (secteur_id, ${columns})
              VALUES ($1, ${placeholders})
         ON CONFLICT (secteur_id) DO UPDATE
                 SET ${updates}, updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
        [sectorId, ...values]
    );

    // Le catalogue affiche « dernière mise à jour » : modifier les chiffres
    // du secteur doit rafraîchir cette date (CDC §3).
    await pool.query(
        "UPDATE secteurs SET date_maj = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
        [sectorId]
    );

    return rows[0];
}

// ── Séries statistiques, zones, acteurs, cadre (panneau admin) ─────────────

async function listStatistiques(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM donnees_statistiques WHERE secteur_id = $1 ORDER BY indicateur",
        [sectorId]
    );
    return rows;
}

async function updateStatistique(id, payload) {
    const years = [2020, 2021, 2022, 2023, 2024];
    const projections = [2025, 2026, 2027, 2028];
    const values = [
        ...years.map((y) => payload[`valeur_${y}`] ?? null),
        ...projections.map((y) => payload[`projection_${y}`] ?? null),
        payload.unite ?? null,
        payload.source ?? null,
        id,
    ];
    const { rows } = await pool.query(
        `UPDATE donnees_statistiques SET
            valeur_2020 = $1, valeur_2021 = $2, valeur_2022 = $3, valeur_2023 = $4, valeur_2024 = $5,
            projection_2025 = $6, projection_2026 = $7, projection_2027 = $8, projection_2028 = $9,
            unite = COALESCE($10, unite), source = COALESCE($11, source),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $12
      RETURNING *`,
        values
    );
    return rows[0] || null;
}

async function listZones(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM zones_geographiques WHERE secteur_id = $1 ORDER BY nom",
        [sectorId]
    );
    return rows;
}

async function createZone(sectorId, z) {
    const { rows } = await pool.query(
        `INSERT INTO zones_geographiques
            (secteur_id, nom, type, gouvernorat, superficie_km2, description, avantages)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [sectorId, z.nom, z.type, z.gouvernorat, z.superficie_km2, z.description, z.avantages]
    );
    return rows[0];
}

async function listActeurs(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM acteurs_principaux WHERE secteur_id = $1 ORDER BY nom",
        [sectorId]
    );
    return rows;
}

async function createActeur(sectorId, a) {
    const { rows } = await pool.query(
        `INSERT INTO acteurs_principaux
            (secteur_id, nom, type, role, description, site_web, chiffre_affaires, nombre_employes, est_national)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [sectorId, a.nom, a.type, a.role, a.description, a.site_web,
         a.chiffre_affaires, a.nombre_employes, a.est_national ?? true]
    );
    return rows[0];
}

async function listCadre(sectorId) {
    const { rows } = await pool.query(
        "SELECT * FROM cadre_reglementaire WHERE secteur_id = $1 ORDER BY annee DESC",
        [sectorId]
    );
    return rows;
}

async function createCadre(sectorId, c) {
    const { rows } = await pool.query(
        `INSERT INTO cadre_reglementaire
            (secteur_id, titre, annee, description, avantages, obligations, type_texte)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [sectorId, c.titre, c.annee, c.description, c.avantages, c.obligations, c.type_texte]
    );
    return rows[0];
}

/** Suppression générique sur les tables métier rattachées à un secteur. */
const DELETABLE_TABLES = {
    zones: "zones_geographiques",
    acteurs: "acteurs_principaux",
    cadre: "cadre_reglementaire",
};

async function deleteSectorItem(kind, id) {
    const table = DELETABLE_TABLES[kind];
    if (!table) return false;
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return rowCount > 0;
}

module.exports = {
    listActiveSectors,
    listAllSectors,
    findSectorById,
    updateSector,
    getSectorData,
    getChiffresCles,
    upsertChiffresCles,
    listStatistiques,
    updateStatistique,
    listZones,
    createZone,
    listActeurs,
    createActeur,
    listCadre,
    createCadre,
    deleteSectorItem,
    listBenchmarks,
    updateBenchmark,
    CHIFFRES_FIELDS,
    BENCHMARK_FIELDS,
};
