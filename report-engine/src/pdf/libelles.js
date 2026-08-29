// ============================================================================
// Libellés de mise en page du rapport PDF.
//
// POURQUOI CE MODULE. Le contenu rédigé peut sortir en anglais — il suffit de
// le demander au modèle. Mais un rapport dont les paragraphes sont anglais et
// dont tous les titres, en-têtes de tableaux et légendes restent français est
// pire qu'un rapport entièrement français : il donne l'impression d'un travail
// bâclé, sur un document vendu.
//
// COMMENT LA LANGUE CIRCULE. Elle est attachée au DOCUMENT PDFKit, via
// `attacherLibelles(doc, langue)`, et relue avec `L(doc)`. Toutes les fonctions
// de rendu reçoivent déjà `doc` en premier argument : aucune signature ne
// change.
//
// Ce n'est pas une variable de module, et c'est délibéré : plusieurs rapports
// peuvent se générer en parallèle (voir `generationsEnCours`), et les appels au
// modèle de rédaction laissent le temps à deux générations de s'entrelacer. Une
// langue tenue dans le module serait écrasée par la génération voisine, et le
// rapport d'un client sortirait dans la langue commandée par un autre.
// ============================================================================

const fr = {
    // ── Titres de sections (sommaire et pages) ──
    sectionIntroduction: "Présentation générale du secteur",
    sectionChiffres: "Chiffres clés et graphiques",
    sectionTendances: "Analyse des tendances",
    sectionActeurs: "Acteurs principaux",
    sectionCadre: "Cadre réglementaire et fiscal",
    sectionZones: "Zones géographiques et zones franches",
    sectionOpportunites: "Opportunités identifiées",
    sectionRisques: "Analyse des risques",
    sectionBenchmarking: "Benchmarking régional",
    sectionRecommandations: "Recommandations investisseur",
    sectionPerspectives: "Perspectives 2025-2028",
    sectionSources: "Sources et méthodologie",

    // ── Page de garde ──
    marque: "InvestPlatform",
    baseline: "Tunisia Invest — Analyse sectorielle",
    rapportSectoriel: "RAPPORT SECTORIEL",
    apercuGratuit: "APERÇU GRATUIT",
    secteurParDefaut: "Secteur",
    badgeOfficiel: "DONNÉES OFFICIELLES · ANALYSE SECTORIELLE",
    ceRapportCouvre: "CE RAPPORT COUVRE",
    pages: "Pages",
    miseAJour: "Mise à jour",
    genereLe: "Généré le",
    confidentiel: "Document confidentiel — usage réservé au destinataire.",

    // ── Tableaux et graphiques ──
    colonneIndicateur: "INDICATEUR",
    colonneUnite: "UNITÉ",
    indicateur: "Indicateur",
    unite: "Unité",
    trajectoires: "Trajectoires",
    evolutionIndicateurs: "Évolution des indicateurs sectoriels",
    valeurObservee: "Valeur observée (source officielle)",
    estimationCalculee: "Estimation calculée",

    // ── Acteurs ──
    colonneType: "Type",
    colonneRole: "Rôle",
    sitesWeb: "SITES WEB : ",
    structureActeurs: "Structure du tissu d'acteurs",
    origineCapital: "Origine du capital",
    acteursNationaux: "Acteurs nationaux",
    acteursEtrangers: "Acteurs étrangers",
    chiffreAffaires: "Chiffre d'affaires",
    uniteActeurs: "acteurs",

    // ── Cadre réglementaire ──
    texteReglementaire: "Texte réglementaire",
    enVigueur: "En vigueur",
    historique: "Historique",
    avantages: "AVANTAGES",
    obligations: "OBLIGATIONS",

    // ── Zones ──
    zoneParDefaut: "Zone",
    vueEnsembleZones: "Vue d'ensemble des zones",
    repartitionParType: "Répartition par type",
    superficie: "Superficie",
    uniteZones: "zones",
    typeAutre: "Autre",

    // ── Benchmarking ──
    comparatifCoupDoeil: "Comparatif régional en un coup d'œil",
    comparatifChiffre: "Comparatif chiffré Tunisie – Maroc – Égypte",
    tunisie: "Tunisie",
    maroc: "Maroc",
    egypte: "Égypte",

    // ── Sources et méthodologie ──
    sourcesDonnees: "Sources des données sectorielles",
    methodologie: "Méthodologie",
    calculEstimations: "Calcul des estimations",
    creditsPhotos: "Crédits photographiques",
    avertissement: "Avertissement",

    // ── En-tête, pied de page, sommaire ──
    entetePetit: "Rapport Sectoriel",
    piedSecteur: (nom) => `Secteur : ${nom}`,
    piedConfidentiel: "Document confidentiel — usage réservé au destinataire",
    sommaire: "Sommaire",
    badgeAnalyse: "Analyse",
    badgeDonnees: "Données officielles",
    sourcesCouverture:
        "Sources officielles tunisiennes — INS, BCT, ONTT et administrations sectorielles.",
    donneesMisesAJour: (maj, gen) =>
        `Données mises à jour le ${maj} — Rapport généré le ${gen}.`,
    creditPhoto: "Photo : ",

    // ── Encart d'appel a l'action de l'apercu gratuit ──
    apercuTitre: (pages) => `Aperçu gratuit — 2 pages sur ${pages}`,
    apercuTexte: (sections) =>
        `Le rapport complet développe les ${sections} sections listées ci-dessus : `
        + "chiffres clés et graphiques, acteurs, cadre réglementaire, zones franches, "
        + "puis l'analyse rédigée (tendances, opportunités, risques, benchmarking "
        + "régional, recommandations et perspectives 2025-2028).",

    // ── Cartes d'indicateurs clés (table chiffres_cles) ──
    kpiPib: "Contribution au PIB",
    kpiCroissance: "Croissance annuelle",
    kpiEmplois: "Emplois générés",
    kpiExportations: "Exportations",
    kpiEntreprises: "Entreprises actives",
    kpiIde: "Investissements IDE",
    kpiPartMarche: "Part marché régional",
    noteEstimations:
        "Les estimations prolongent la tendance observée ; leur méthode de calcul est "
        + "détaillée en section 12.",

    // ── Types d'énumération (colonnes `type`, `type_texte`) ──
    // Ce sont des CODES en base (`zone_franche`, `loi`), comparés par le code
    // métier. Leur libellé se traduit ici, jamais en base : traduire le code
    // lui-même casserait les comparaisons qui s'appuient dessus.
    types: {
        agence_publique: "Agence publique",
        entreprise: "Entreprise",
        tour_operateur: "Tour-opérateur",
        zone_cotiere: "Zone côtière",
        zone_franche: "Zone franche",
        pole_industriel: "Pôle industriel",
        port: "Port",
        loi: "Loi",
        decret: "Décret",
        convention: "Convention",
    },

    // ── États vides ──
    sectionIndisponible: "Section non disponible dans cette édition du rapport.",
    aucuneSerie: "Aucune série statistique disponible pour ce secteur pour le moment.",
    aucuneDonneeTableau: "Aucune donnée disponible pour ce tableau.",
    aucunActeur: "Aucun acteur principal renseigné pour ce secteur pour le moment.",
    aucunTexteReglementaire: "Aucun texte réglementaire renseigné pour ce secteur pour le moment.",
    aucuneZone: "Aucune zone géographique renseignée pour ce secteur pour le moment.",
    donneesNonDisponibles: "Données non disponibles",
};

const en = {
    sectionIntroduction: "General overview of the sector",
    sectionChiffres: "Key figures and charts",
    sectionTendances: "Trend analysis",
    sectionActeurs: "Main players",
    sectionCadre: "Regulatory and tax framework",
    sectionZones: "Geographic zones and free zones",
    sectionOpportunites: "Opportunities identified",
    sectionRisques: "Risk analysis",
    sectionBenchmarking: "Regional benchmarking",
    sectionRecommandations: "Investor recommendations",
    sectionPerspectives: "2025-2028 outlook",
    sectionSources: "Sources and methodology",

    marque: "InvestPlatform",
    baseline: "Tunisia Invest — Sector analysis",
    rapportSectoriel: "SECTOR REPORT",
    apercuGratuit: "FREE PREVIEW",
    secteurParDefaut: "Sector",
    badgeOfficiel: "OFFICIAL DATA · SECTOR ANALYSIS",
    ceRapportCouvre: "THIS REPORT COVERS",
    pages: "Pages",
    miseAJour: "Updated",
    genereLe: "Generated on",
    confidentiel: "Confidential document — for the named recipient only.",

    colonneIndicateur: "INDICATOR",
    colonneUnite: "UNIT",
    indicateur: "Indicator",
    unite: "Unit",
    trajectoires: "Trajectories",
    evolutionIndicateurs: "Sector indicator trends",
    valeurObservee: "Observed value (official source)",
    estimationCalculee: "Calculated estimate",

    colonneType: "Type",
    colonneRole: "Role",
    sitesWeb: "WEBSITES: ",
    structureActeurs: "Structure of the sector's players",
    origineCapital: "Origin of capital",
    acteursNationaux: "Domestic players",
    acteursEtrangers: "Foreign players",
    chiffreAffaires: "Turnover",
    uniteActeurs: "players",

    texteReglementaire: "Regulatory text",
    enVigueur: "In force",
    historique: "Historical",
    avantages: "BENEFITS",
    obligations: "OBLIGATIONS",

    zoneParDefaut: "Zone",
    vueEnsembleZones: "Overview of zones",
    repartitionParType: "Breakdown by type",
    superficie: "Area",
    uniteZones: "zones",
    typeAutre: "Other",

    comparatifCoupDoeil: "Regional benchmark at a glance",
    comparatifChiffre: "Tunisia – Morocco – Egypt in figures",
    tunisie: "Tunisia",
    maroc: "Morocco",
    egypte: "Egypt",

    sourcesDonnees: "Sector data sources",
    methodologie: "Methodology",
    calculEstimations: "How the estimates are calculated",
    creditsPhotos: "Photo credits",
    avertissement: "Disclaimer",

    // ── En-tête, pied de page, sommaire ──
    entetePetit: "Sector Report",
    piedSecteur: (nom) => `Sector: ${nom}`,
    piedConfidentiel: "Confidential document — for the named recipient only",
    sommaire: "Contents",
    badgeAnalyse: "Analysis",
    badgeDonnees: "Official data",
    sourcesCouverture:
        "Official Tunisian sources — INS, BCT, ONTT and sector administrations.",
    donneesMisesAJour: (maj, gen) =>
        `Data updated on ${maj} — report generated on ${gen}.`,
    creditPhoto: "Photo: ",

    apercuTitre: (pages) => `Free preview — 2 pages out of ${pages}`,
    apercuTexte: (sections) =>
        `The full report develops the ${sections} sections listed above: key figures and `
        + "charts, main players, regulatory framework, free zones, then the written "
        + "analysis (trends, opportunities, risks, regional benchmarking, "
        + "recommendations and the 2025-2028 outlook).",

    kpiPib: "Contribution to GDP",
    kpiCroissance: "Annual growth",
    kpiEmplois: "Jobs generated",
    kpiExportations: "Exports",
    kpiEntreprises: "Active companies",
    kpiIde: "FDI investment",
    kpiPartMarche: "Regional market share",
    noteEstimations:
        "The estimates extend the observed trend; how they are calculated is set out in "
        + "section 12.",

    types: {
        agence_publique: "Public agency",
        entreprise: "Company",
        tour_operateur: "Tour operator",
        zone_cotiere: "Coastal zone",
        zone_franche: "Free zone",
        pole_industriel: "Industrial hub",
        port: "Port",
        loi: "Act",
        decret: "Decree",
        convention: "Agreement",
    },

    sectionIndisponible: "Section not available in this edition of the report.",
    aucuneSerie: "No statistical series available for this sector at present.",
    aucuneDonneeTableau: "No data available for this table.",
    aucunActeur: "No main players recorded for this sector at present.",
    aucunTexteReglementaire: "No regulatory texts recorded for this sector at present.",
    aucuneZone: "No geographic zones recorded for this sector at present.",
    donneesNonDisponibles: "Data not available",
};

const DICTIONNAIRES = { fr, en };

/** Les langues dans lesquelles un rapport peut être produit. */
const LANGUES_RAPPORT = ["fr", "en"];

/** Langue par défaut : celle des sources citées, et celle qui fait foi. */
const LANGUE_DEFAUT = "fr";

/** Ramène une valeur quelconque à une langue supportée. */
function normaliserLangue(valeur) {
    const code = String(valeur || "").slice(0, 2).toLowerCase();
    return LANGUES_RAPPORT.includes(code) ? code : LANGUE_DEFAUT;
}

/**
 * Fixe la langue d'un document, une fois, à sa création.
 * Retourne la langue effectivement retenue.
 */
function attacherLibelles(doc, langue) {
    const code = normaliserLangue(langue);
    doc.__libelles = DICTIONNAIRES[code];
    doc.__langue = code;
    return code;
}

/**
 * Libellés du document.
 *
 * Le repli sur le français couvre le cas d'un document construit par un chemin
 * qui aurait oublié `attacherLibelles` : mieux vaut un titre français qu'un
 * `undefined` imprimé dans un PDF vendu.
 */
function L(doc) {
    return doc.__libelles || fr;
}

/**
 * Valeur d'un champ de base dans la langue du document.
 *
 * Les tables portent des colonnes jumelles — `indicateur` / `indicateur_en`
 * (migration 011). Ce sélecteur choisit la bonne, avec REPLI SUR LE FRANÇAIS
 * quand la traduction manque : un intitulé français dans un rapport anglais
 * reste lisible et traçable jusqu'à sa source ; une case vide, non.
 *
 *   champ(doc, serie, "indicateur")  →  "Tourist arrivals" ou l'original
 */
function champ(doc, ligne, nom) {
    if (!ligne) return "";
    const original = ligne[nom];
    if (langueDe(doc) !== "en") return original || "";
    const traduit = ligne[`${nom}_en`];
    return (typeof traduit === "string" && traduit.trim()) ? traduit : (original || "");
}

/** Code langue du document, pour le formatage des dates et des nombres. */
function langueDe(doc) {
    return doc.__langue || LANGUE_DEFAUT;
}

module.exports = {
    L, champ, langueDe, attacherLibelles, normaliserLangue,
    LANGUES_RAPPORT, LANGUE_DEFAUT, DICTIONNAIRES,
};
