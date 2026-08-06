// ============================================================================
// Construction des prompts — les 7 sections narratives du CDC §4.
// ----------------------------------------------------------------------------
// Point clé de l'approche hybride : le modèle ne rédige PAS dans le vide.
// buildDataContext() sérialise les données chiffrées réellement stockées en
// base (chiffres clés + séries statistiques + zones + acteurs + cadre) et ce
// bloc est injecté dans chaque prompt. L'analyse narrative commente donc les
// mêmes chiffres que ceux imprimés dans les sections « données » du PDF.
// ============================================================================

const YEARS = [2020, 2021, 2022, 2023, 2024];

const KPI_LABELS = {
    contribution_pib_pct: ["Contribution au PIB", "%"],
    croissance_annuelle_pct: ["Croissance annuelle", "%"],
    nombre_emplois: ["Emplois", ""],
    exportations_mdt: ["Exportations", "MDT"],
    nombre_entreprises: ["Entreprises actives", ""],
    investissements_ide_mdt: ["Investissements IDE", "MDT"],
    part_marche_regional_pct: ["Part de marché régionale", "%"],
};

/** Nombre maximal de séries transmises au modèle (contrôle la taille du prompt). */
const MAX_SERIES = 12;

function formatSeries(row) {
    const points = YEARS
        .map((y) => [y, row[`valeur_${y}`]])
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([y, v]) => `${y}: ${v}`);
    if (points.length === 0) return null;
    const unite = row.unite ? ` (${row.unite})` : "";
    return `- ${row.indicateur}${unite} → ${points.join(", ")}`;
}

/**
 * Résumé chiffré compact d'un secteur, injecté dans tous les prompts.
 * @param {object} data résultat de sectorRepository.getSectorData()
 */
function buildDataContext(data) {
    const lines = [];

    if (data.chiffresCles) {
        const kpis = Object.entries(KPI_LABELS)
            .map(([key, [label, unit]]) => {
                const v = data.chiffresCles[key];
                return v === null || v === undefined ? null : `${label} : ${v}${unit ? " " + unit : ""}`;
            })
            .filter(Boolean);
        if (kpis.length) lines.push("CHIFFRES CLÉS :\n" + kpis.map((k) => `- ${k}`).join("\n"));
    }

    const series = (data.donneesStatistiques || [])
        .map(formatSeries)
        .filter(Boolean)
        .slice(0, MAX_SERIES);
    if (series.length) {
        lines.push(`SÉRIES STATISTIQUES OFFICIELLES (${series.length} indicateurs) :\n` + series.join("\n"));
    }

    if (data.zonesGeographiques?.length) {
        lines.push(
            "ZONES GÉOGRAPHIQUES :\n" +
                data.zonesGeographiques
                    .map((z) => `- ${z.nom}${z.gouvernorat ? ` (${z.gouvernorat})` : ""} : ${z.description || z.type}`)
                    .join("\n")
        );
    }

    if (data.acteursPrincipaux?.length) {
        lines.push(
            "ACTEURS PRINCIPAUX :\n" +
                data.acteursPrincipaux.map((a) => `- ${a.nom} : ${a.role || a.type}`).join("\n")
        );
    }

    if (data.cadreReglementaire?.length) {
        lines.push(
            "CADRE RÉGLEMENTAIRE :\n" +
                data.cadreReglementaire
                    .map((c) => `- ${c.titre}${c.annee ? ` (${c.annee})` : ""} : ${c.description}`)
                    .join("\n")
        );
    }

    return lines.length
        ? lines.join("\n\n")
        : "Aucune donnée chiffrée n'est disponible en base pour ce secteur.";
}

/** En-tête commun : rôle, secteur, données. Évite de répéter 7 fois le même bloc. */
function header(secteur, contexte) {
    return `Tu es un expert en analyse économique et en investissement en Tunisie.

SECTEUR ANALYSÉ : ${secteur.nom}
DESCRIPTION : ${secteur.description || "—"}

DONNÉES OFFICIELLES DISPONIBLES :
${contexte}

CONSIGNES GÉNÉRALES :
- Rédige en français, dans un style professionnel destiné à un investisseur étranger.
- Appuie-toi explicitement sur les chiffres ci-dessus lorsqu'ils sont pertinents.
- N'invente aucune donnée chiffrée absente du bloc ci-dessus.
- N'ajoute ni titre de section, ni introduction méta du type « Voici l'analyse ».
`;
}

const prompts = {
    introduction: (s, ctx) => `${header(s, ctx)}
TÂCHE — Présentation générale du secteur (environ 300 mots, en paragraphes rédigés,
sans liste à puces) : taille et poids économique du secteur, place dans l'économie
tunisienne, dynamique récente.`,

    tendances: (s, ctx) => `${header(s, ctx)}
TÂCHE — Analyse des tendances sur les 5 dernières années (environ 350 mots) :
évolutions chiffrées observées dans les séries ci-dessus, ruptures notables,
mutations technologiques et réglementaires, dynamique de croissance.`,

    opportunites: (s, ctx) => `${header(s, ctx)}
TÂCHE — Les 5 principales opportunités d'investissement pour un investisseur
étranger. Une opportunité par point, chacune avec : intitulé, justification
chiffrée, horizon (court ou moyen terme) et régions concernées.`,

    risques: (s, ctx) => `${header(s, ctx)}
TÂCHE — Analyse des risques sectoriels (environ 300 mots), organisée en
quatre volets : risques économiques, politiques et réglementaires, financiers
et de change, opérationnels et environnementaux.`,

    benchmarking: (s, ctx) => `${header(s, ctx)}
TÂCHE — Benchmarking régional. Compare la Tunisie UNIQUEMENT avec le Maroc et
l'Égypte, en six points numérotés : 1. Position de la Tunisie, 2. Comparaison
avec le Maroc, 3. Comparaison avec l'Égypte, 4. Avantages compétitifs tunisiens,
5. Faiblesses, 6. Leviers d'amélioration. Ne cite aucun autre pays.`,

    recommandations: (s, ctx) => `${header(s, ctx)}
TÂCHE — 5 recommandations stratégiques concrètes et actionnables pour un
investisseur étranger : mode d'entrée sur le marché, localisation, partenariats,
dispositifs fiscaux à mobiliser, calendrier de déploiement.`,

    perspectives: (s, ctx) => `${header(s, ctx)}
TÂCHE — Perspectives 2025-2028 : évolution attendue, puis trois scénarios
chiffrés (optimiste, réaliste, pessimiste) avec leurs hypothèses, et les
principaux défis à surveiller.`,
};

/** Ordre de génération = ordre d'apparition dans le PDF. */
const SECTION_KEYS = [
    "introduction",
    "tendances",
    "opportunites",
    "risques",
    "benchmarking",
    "recommandations",
    "perspectives",
];

module.exports = { prompts, buildDataContext, SECTION_KEYS };
