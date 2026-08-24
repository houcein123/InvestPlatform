// ============================================================================
// Projections statistiques — estimations 2024-2028
// ----------------------------------------------------------------------------
// Les séries publiées par l'INS s'arrêtent généralement en 2023. Pour qu'un
// rapport d'investissement ait de la valeur, il doit prolonger la tendance —
// mais sans jamais faire passer une estimation pour une donnée observée.
//
// Règle appliquée partout dans le projet :
//   • valeur_YYYY      → donnée publiée par la source officielle
//   • projection_YYYY  → estimation calculée ici, signalée comme telle
//
// Méthodes, de la plus fiable à la plus fruste :
//   • regression_lineaire : moindres carrés sur ≥ 4 points, avec R²
//   • tcam                : taux de croissance annuel moyen sur ≥ 3 points,
//                           préféré quand la série est nettement exponentielle
//   • tendance_courte     : droite passant par les 2 seuls points connus
// Une série d'un seul point ne donne lieu à aucune projection : mieux vaut une
// case vide qu'un chiffre inventé.
// ============================================================================

const { pool } = require("../config/db");

const ANNEES_OBSERVEES = [2020, 2021, 2022, 2023, 2024];
const ANNEES_PROJETEES = [2024, 2025, 2026, 2027, 2028];

/** En deçà, l'ajustement linéaire est jugé trop mauvais pour être publié. */
const R2_MINIMAL = 0.3;

/** Au-delà, la projection s'éloigne trop de l'observé pour rester crédible. */
const FACTEUR_MAX = 3;

const METHODES = {
    REGRESSION: "regression_lineaire",
    TCAM: "tcam",
    COURTE: "tendance_courte",
};

// ── Outils statistiques ────────────────────────────────────────────────────

/** Régression par moindres carrés : renvoie la pente, l'ordonnée et le R². */
function regressionLineaire(points) {
    const n = points.length;
    const moyenneX = points.reduce((s, p) => s + p.x, 0) / n;
    const moyenneY = points.reduce((s, p) => s + p.y, 0) / n;

    let covariance = 0;
    let varianceX = 0;
    for (const { x, y } of points) {
        covariance += (x - moyenneX) * (y - moyenneY);
        varianceX += (x - moyenneX) ** 2;
    }
    if (varianceX === 0) return null;

    const pente = covariance / varianceX;
    const ordonnee = moyenneY - pente * moyenneX;

    // R² = 1 - (somme des carrés résiduels / somme des carrés totaux)
    let residus = 0;
    let total = 0;
    for (const { x, y } of points) {
        residus += (y - (pente * x + ordonnee)) ** 2;
        total += (y - moyenneY) ** 2;
    }
    const r2 = total === 0 ? 1 : Math.max(0, 1 - residus / total);

    return { pente, ordonnee, r2, predire: (x) => pente * x + ordonnee };
}

/**
 * Taux de croissance annuel moyen.
 * Exige des valeurs strictement positives : une série qui passe par zéro ou
 * par des négatifs n'a pas de TCAM interprétable.
 */
function tauxCroissanceAnnuelMoyen(points) {
    const premier = points[0];
    const dernier = points[points.length - 1];
    const annees = dernier.x - premier.x;
    if (annees <= 0 || premier.y <= 0 || dernier.y <= 0) return null;

    const taux = (dernier.y / premier.y) ** (1 / annees) - 1;
    return {
        taux,
        predire: (x) => dernier.y * (1 + taux) ** (x - dernier.x),
    };
}

/** Qualité d'ajustement du TCAM sur l'historique, pour comparaison avec la régression. */
function r2DuModele(points, predire) {
    const moyenneY = points.reduce((s, p) => s + p.y, 0) / points.length;
    let residus = 0;
    let total = 0;
    for (const { x, y } of points) {
        residus += (y - predire(x)) ** 2;
        total += (y - moyenneY) ** 2;
    }
    return total === 0 ? 1 : Math.max(0, 1 - residus / total);
}

// ── Calcul pour une série ──────────────────────────────────────────────────

/** Points (année, valeur) réellement observés d'une ligne de donnees_statistiques. */
function extraireObservations(ligne) {
    return ANNEES_OBSERVEES
        .map((annee) => ({ x: annee, y: ligne[`valeur_${annee}`] }))
        .filter((p) => p.y !== null && p.y !== undefined && !isNaN(p.y))
        .map((p) => ({ x: p.x, y: Number(p.y) }));
}

/**
 * Choisit le meilleur modèle disponible pour une série.
 * @returns {{methode: string, r2: number, predire: function}|null}
 */
function choisirModele(points) {
    if (points.length < 2) return null;

    if (points.length === 2) {
        const droite = regressionLineaire(points);
        return droite ? { methode: METHODES.COURTE, r2: null, predire: droite.predire } : null;
    }

    const droite = regressionLineaire(points);
    const croissance = tauxCroissanceAnnuelMoyen(points);

    const candidats = [];
    if (droite) candidats.push({ methode: METHODES.REGRESSION, r2: droite.r2, predire: droite.predire });
    if (croissance) {
        candidats.push({
            methode: METHODES.TCAM,
            r2: r2DuModele(points, croissance.predire),
            predire: croissance.predire,
        });
    }
    if (candidats.length === 0) return null;

    // Le meilleur ajustement l'emporte ; à égalité, la régression est préférée
    // car sa lecture est plus simple à justifier dans le rapport.
    candidats.sort((a, b) => b.r2 - a.r2);
    const meilleur = candidats[0];

    return meilleur.r2 >= R2_MINIMAL ? meilleur : null;
}

/**
 * Calcule les projections d'une série.
 * @returns {{projections: object, methode: string, r2: number|null}|null}
 */
function projeterSerie(ligne) {
    const points = extraireObservations(ligne);
    const modele = choisirModele(points);
    if (!modele) return null;

    const observees = points.map((p) => p.y);
    const maxObserve = Math.max(...observees.map(Math.abs));
    const plafond = maxObserve * FACTEUR_MAX;
    const toutPositif = observees.every((v) => v >= 0);

    const projections = {};
    for (const annee of ANNEES_PROJETEES) {
        // 2024 n'est estimée que si la valeur réelle n'a pas été publiée.
        if (annee === 2024 && ligne.valeur_2024 !== null && ligne.valeur_2024 !== undefined) {
            projections[annee] = null;
            continue;
        }

        let valeur = modele.predire(annee);
        if (!isFinite(valeur)) { projections[annee] = null; continue; }

        // Une série historiquement positive (effectifs, capacités, recettes)
        // ne devient pas négative : on la borne à zéro.
        if (toutPositif && valeur < 0) valeur = 0;

        // Garde-fou contre les extrapolations aberrantes d'un modèle exponentiel.
        if (Math.abs(valeur) > plafond) valeur = Math.sign(valeur) * plafond;

        projections[annee] = Math.round(valeur * 100) / 100;
    }

    return {
        projections,
        methode: modele.methode,
        r2: modele.r2 === null ? null : Math.round(modele.r2 * 10000) / 10000,
    };
}

// ── Persistance ────────────────────────────────────────────────────────────

/**
 * Écrit toutes les projections d'un secteur en UNE requête.
 * Une centaine d'UPDATE séquentiels suffisait à faire tomber la connexion
 * Neon ; le passage par des tableaux `unnest` règle le problème et rend
 * l'opération atomique.
 */
async function enregistrerParLot(lignes) {
    if (lignes.length === 0) return;

    const colonnes = {
        id: [], p2024: [], p2025: [], p2026: [], p2027: [], p2028: [], methode: [], r2: [],
    };

    for (const { id, resultat } of lignes) {
        colonnes.id.push(id);
        colonnes.p2024.push(resultat?.projections[2024] ?? null);
        colonnes.p2025.push(resultat?.projections[2025] ?? null);
        colonnes.p2026.push(resultat?.projections[2026] ?? null);
        colonnes.p2027.push(resultat?.projections[2027] ?? null);
        colonnes.p2028.push(resultat?.projections[2028] ?? null);
        colonnes.methode.push(resultat?.methode ?? null);
        colonnes.r2.push(resultat?.r2 ?? null);
    }

    await pool.query(
        `UPDATE donnees_statistiques d SET
            projection_2024 = v.p2024,
            projection_2025 = v.p2025,
            projection_2026 = v.p2026,
            projection_2027 = v.p2027,
            projection_2028 = v.p2028,
            methode_projection = v.methode,
            fiabilite_r2 = v.r2,
            projections_calculees_le = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
           FROM (
                SELECT * FROM unnest(
                    $1::int[], $2::numeric[], $3::numeric[], $4::numeric[],
                    $5::numeric[], $6::numeric[], $7::varchar[], $8::numeric[]
                ) AS t(id, p2024, p2025, p2026, p2027, p2028, methode, r2)
           ) v
          WHERE d.id = v.id`,
        [colonnes.id, colonnes.p2024, colonnes.p2025, colonnes.p2026,
         colonnes.p2027, colonnes.p2028, colonnes.methode, colonnes.r2]
    );
}

/**
 * (Re)calcule les projections de toutes les séries d'un secteur.
 * @returns {Promise<{projetees: number, ignorees: number, parMethode: object}>}
 */
async function calculerPourSecteur(secteurId) {
    const { rows } = await pool.query(
        "SELECT * FROM donnees_statistiques WHERE secteur_id = $1",
        [secteurId]
    );

    let projetees = 0;
    let ignorees = 0;
    const parMethode = {};

    // Les séries sans modèle exploitable sont écrites avec des projections
    // nulles : un ancien calcul devenu caduc ne doit pas subsister.
    const aEcrire = rows.map((ligne) => {
        const resultat = projeterSerie(ligne);
        if (resultat) {
            projetees += 1;
            parMethode[resultat.methode] = (parMethode[resultat.methode] || 0) + 1;
        } else {
            ignorees += 1;
        }
        return { id: ligne.id, resultat };
    });

    await enregistrerParLot(aEcrire);

    return { secteurId, total: rows.length, projetees, ignorees, parMethode };
}

async function calculerPourTous() {
    const { rows } = await pool.query("SELECT id, nom FROM secteurs ORDER BY id");
    const details = [];
    for (const secteur of rows) {
        const resultat = await calculerPourSecteur(secteur.id);
        details.push({ ...resultat, nom: secteur.nom });
    }
    return {
        details,
        totaux: details.reduce(
            (acc, d) => ({
                total: acc.total + d.total,
                projetees: acc.projetees + d.projetees,
                ignorees: acc.ignorees + d.ignorees,
            }),
            { total: 0, projetees: 0, ignorees: 0 }
        ),
    };
}

/** Libellés lisibles, réutilisés par le PDF et l'interface. */
const LIBELLES_METHODE = {
    [METHODES.REGRESSION]: "régression linéaire sur l'historique observé",
    [METHODES.TCAM]: "taux de croissance annuel moyen",
    [METHODES.COURTE]: "prolongement de tendance sur deux points",
};

module.exports = {
    calculerPourSecteur,
    calculerPourTous,
    projeterSerie,
    regressionLineaire,
    ANNEES_PROJETEES,
    METHODES,
    LIBELLES_METHODE,
    R2_MINIMAL,
};
