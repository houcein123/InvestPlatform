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
// `source` indique l'origine du contenu au sens du CDC §5 :
//   "ia"   → texte narratif produit par Groq (clé = clé de promptService)
//   "data" → contenu construit à partir des tables métier
// ============================================================================

const { AI_BADGE, DATA_BADGE } = require("./theme");

const SECTION_CATALOG = [
    { key: "introduction", title: "Présentation générale du secteur", source: "ia" },
    { key: "chiffres", title: "Chiffres clés et graphiques", source: "data" },
    { key: "tendances", title: "Analyse des tendances", source: "ia" },
    { key: "acteurs", title: "Acteurs principaux", source: "data" },
    { key: "cadre", title: "Cadre réglementaire et fiscal", source: "data" },
    { key: "zones", title: "Zones géographiques et zones franches", source: "data" },
    { key: "opportunites", title: "Opportunités identifiées", source: "ia" },
    { key: "risques", title: "Analyse des risques", source: "ia" },
    { key: "benchmarking", title: "Benchmarking régional", source: "ia" },
    { key: "recommandations", title: "Recommandations investisseur", source: "ia" },
    { key: "perspectives", title: "Perspectives 2025-2028", source: "ia" },
    { key: "sources", title: "Sources et méthodologie", source: "data" },
].map((s) => ({ ...s, badge: s.source === "ia" ? AI_BADGE : DATA_BADGE }));

const SECTION_TITLES = SECTION_CATALOG.map((s) => s.title);

/**
 * Nombre de pages annoncé dans le catalogue : couverture + sommaire + une
 * page minimum par section. Sert à garder `secteurs.nombre_pages` cohérent
 * avec ce que le générateur produit réellement.
 */
const MIN_PAGE_COUNT = SECTION_CATALOG.length + 2;

module.exports = { SECTION_CATALOG, SECTION_TITLES, MIN_PAGE_COUNT };
