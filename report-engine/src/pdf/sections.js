// ============================================================================
// Catalogue des sections du rapport — SOURCE UNIQUE DE VÉRITÉ.
// ----------------------------------------------------------------------------
// Cette liste est consommée par :
//   - la page de couverture   (« ce rapport couvre »)
//   - le sommaire du rapport complet
//   - le sommaire de l'aperçu gratuit
//   - le corps du rapport     (une entrée = une section rendue)
// Toute section ajoutée ici apparaît partout, et il devient impossible que le
// sommaire annonce une section qui n'est pas réellement produite.
//
// `source` indique la nature du contenu au sens du CDC §5 :
//   "analyse" → section rédigée (le moyen de rédaction est documenté
//               uniquement dans « Sources et méthodologie »)
//   "data"    → contenu construit à partir des tables métier
// ============================================================================

const { ANALYSE_BADGE, DATA_BADGE } = require("./theme");

const SECTION_CATALOG = [
    { key: "introduction", title: "Présentation générale du secteur", source: "analyse" },
    { key: "chiffres", title: "Chiffres clés et graphiques", source: "data" },
    { key: "tendances", title: "Analyse des tendances", source: "analyse" },
    { key: "acteurs", title: "Acteurs principaux", source: "data" },
    { key: "cadre", title: "Cadre réglementaire et fiscal", source: "data" },
    { key: "zones", title: "Zones géographiques et zones franches", source: "data" },
    { key: "opportunites", title: "Opportunités identifiées", source: "analyse" },
    { key: "risques", title: "Analyse des risques", source: "analyse" },
    { key: "benchmarking", title: "Benchmarking régional", source: "analyse" },
    { key: "recommandations", title: "Recommandations investisseur", source: "analyse" },
    { key: "perspectives", title: "Perspectives 2025-2028", source: "analyse" },
    { key: "sources", title: "Sources et méthodologie", source: "data" },
].map((s) => ({ ...s, badge: s.source === "analyse" ? ANALYSE_BADGE : DATA_BADGE }));

const SECTION_TITLES = SECTION_CATALOG.map((s) => s.title);

/**
 * Plancher théorique du document : couverture + sommaire + une page par
 * section. Ce n'est PAS le nombre de pages annoncé : celui-ci est le décompte
 * réel du dernier rapport produit (voir `generateReportPDF`, qui le mesure, et
 * `synchroniserPagesSecteur`, qui le recale en base). Ce plancher ne sert plus
 * que de valeur de repli quand aucun rapport n'a encore été généré.
 */
const MIN_PAGE_COUNT = SECTION_CATALOG.length + 2;

module.exports = { SECTION_CATALOG, SECTION_TITLES, MIN_PAGE_COUNT };
