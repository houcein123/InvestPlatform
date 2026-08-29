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

const ANNEES_PROJETEES = [2025, 2026, 2027, 2028];

function formatSeries(row) {
    const observes = YEARS
        .map((y) => [y, row[`valeur_${y}`]])
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([y, v]) => `${y}: ${v}`);
    if (observes.length === 0) return null;

    const unite = row.unite ? ` (${row.unite})` : "";
    let ligne = `- ${row.indicateur}${unite} → observé ${observes.join(", ")}`;

    // Les estimations sont transmises au modèle en étant explicitement
    // étiquetées : la section « Perspectives » doit s'appuyer dessus sans
    // jamais les présenter comme des chiffres officiels.
    const projetes = ANNEES_PROJETEES
        .map((y) => [y, row[`projection_${y}`]])
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([y, v]) => `${y}: ${v}`);
    if (projetes.length > 0) {
        ligne += ` | ESTIMÉ ${projetes.join(", ")}`;
    }

    return ligne;
}

/**
 * Bloc comparatif Tunisie / Maroc / Égypte destiné à la section benchmarking.
 *
 * Ne transmet que les lignes RÉELLEMENT renseignées. Quand aucune n'existe, le
 * bloc dit explicitement au modèle qu'il ne dispose d'aucun chiffre — c'est
 * cette phrase qui l'empêche d'en fabriquer.
 */
function buildBenchmarkContext(benchmarks) {
    const renseignes = (benchmarks || []).filter(
        (b) => b.valeur_tunisie !== null || b.valeur_maroc !== null || b.valeur_egypte !== null
    );

    if (renseignes.length === 0) {
        return "COMPARATIF RÉGIONAL : aucune donnée chiffrée comparative n'est "
            + "disponible en base pour le Maroc et l'Égypte.\n";
    }

    const lignes = renseignes.map((b) => {
        const valeur = (v) => (v === null || v === undefined ? "non disponible" : v);
        const unite = b.unite ? ` ${b.unite}` : "";
        const annee = b.annee ? ` [${b.annee}]` : "";
        const source = b.source ? ` (source : ${b.source})` : "";
        return `- ${b.indicateur}${annee} — Tunisie : ${valeur(b.valeur_tunisie)}${unite} | `
            + `Maroc : ${valeur(b.valeur_maroc)}${unite} | Égypte : ${valeur(b.valeur_egypte)}${unite}${source}`;
    });

    return `COMPARATIF RÉGIONAL (seules valeurs chiffrées autorisées) :\n${lignes.join("\n")}\n`;
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
/**
 * Consigne de langue de sortie.
 *
 * Elle est SÉPARÉE et placée en tête des consignes, pas glissée dans une liste :
 * une instruction de langue noyée au milieu d'autres règles est la première que
 * le modèle relâche sur une réponse longue, et une section qui repart en
 * français au milieu d'un rapport anglais ne se voit qu'à la relecture du PDF.
 *
 * Les consignes restent rédigées en français même pour une sortie anglaise :
 * elles s'adressent au modèle, pas au lecteur, et les prompts ont été réglés
 * dans cette langue. C'est la SORTIE qui change, pas l'instruction.
 */
function consigneLangue(langue) {
    if (langue === "en") {
        return "- RÉDIGE INTÉGRALEMENT EN ANGLAIS. Chaque phrase de ta réponse doit être en\n"
            + "  anglais, y compris les intitulés que tu introduis toi-même. Les noms propres\n"
            + "  d'institutions tunisiennes (INS, BCT, FIPA, APII) restent tels quels, suivis\n"
            + "  d'une traduction entre parenthèses à leur première occurrence.";
    }
    return "- Rédige en français, dans un style professionnel destiné à un investisseur étranger.";
}

function header(secteur, contexte, langue = "fr") {
    const nom = langue === "en" ? (secteur.nom_en || secteur.nom) : secteur.nom;
    const description = langue === "en"
        ? (secteur.description_en || secteur.description)
        : secteur.description;

    return `Tu es un expert en analyse économique et en investissement en Tunisie.

SECTEUR ANALYSÉ : ${nom}
DESCRIPTION : ${description || "—"}

DONNÉES OFFICIELLES DISPONIBLES :
${contexte}

CONSIGNES GÉNÉRALES :
${consigneLangue(langue)}
- Appuie-toi explicitement sur les chiffres ci-dessus lorsqu'ils sont pertinents.
- N'invente aucune donnée chiffrée absente du bloc ci-dessus.
- N'ajoute ni titre de section, ni introduction méta du type « Voici l'analyse ».
`;
}

const prompts = {
    introduction: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
TÂCHE — Présentation générale du secteur (environ 300 mots, en paragraphes rédigés,
sans liste à puces) : taille et poids économique du secteur, place dans l'économie
tunisienne, dynamique récente.`,

    tendances: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
TÂCHE — Analyse des tendances sur les 5 dernières années (environ 350 mots) :
évolutions chiffrées observées dans les séries ci-dessus, ruptures notables,
mutations technologiques et réglementaires, dynamique de croissance.`,

    opportunites: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
TÂCHE — Les 5 principales opportunités d'investissement pour un investisseur
étranger. Une opportunité par point, chacune avec : intitulé, justification
chiffrée, horizon (court ou moyen terme) et régions concernées.`,

    risques: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
TÂCHE — Analyse des risques sectoriels (environ 300 mots), organisée en
quatre volets : risques économiques, politiques et réglementaires, financiers
et de change, opérationnels et environnementaux.`,

    /**
     * Seule section qui parle de pays étrangers. Le contexte sectoriel ne
     * contient que des chiffres tunisiens : sans le bloc comparatif ci-dessous,
     * le modèle devait inventer toutes les valeurs marocaines et égyptiennes.
     * La consigne est donc explicite sur ce qu'il faut faire quand la donnée
     * manque — décrire sans chiffrer, plutôt que produire un chiffre plausible.
     */
    benchmarking: (s, ctx, comparatif, langue) => `${header(s, ctx, langue)}
${buildBenchmarkContext(comparatif)}
TÂCHE — Benchmarking régional. Compare la Tunisie UNIQUEMENT avec le Maroc et
l'Égypte, en six points numérotés : 1. Position de la Tunisie, 2. Comparaison
avec le Maroc, 3. Comparaison avec l'Égypte, 4. Avantages compétitifs tunisiens,
5. Faiblesses, 6. Leviers d'amélioration. Ne cite aucun autre pays.

RÈGLE ABSOLUE SUR LES CHIFFRES — n'avance AUCUNE valeur chiffrée concernant le
Maroc ou l'Égypte qui ne figure pas dans le comparatif ci-dessus. Si une
comparaison chiffrée n'est pas disponible, formule-la en termes qualitatifs
(« un marché sensiblement plus vaste », « une position comparable ») et indique
que le chiffre n'est pas disponible dans ce rapport. Un chiffre inventé
décrédibiliserait l'ensemble du document.`,

    recommandations: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
TÂCHE — 5 recommandations stratégiques concrètes et actionnables pour un
investisseur étranger : mode d'entrée sur le marché, localisation, partenariats,
dispositifs fiscaux à mobiliser, calendrier de déploiement.`,

    perspectives: (s, ctx, _b, langue) => `${header(s, ctx, langue)}
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

module.exports = { prompts, buildDataContext, buildBenchmarkContext, SECTION_KEYS, consigneLangue };
