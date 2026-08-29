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
//
// Le titre est désormais une CLÉ de libellé, résolue à la génération selon la
// langue du rapport : la `key` identifie la section partout ailleurs (base,
// corrections manuelles, ordre du PDF) et ne doit surtout pas bouger avec la
// langue, alors que le titre affiché, lui, doit suivre.
// ============================================================================

const { ANALYSE_BADGE, DATA_BADGE } = require("./theme");
const { L, DICTIONNAIRES, LANGUE_DEFAUT } = require("./libelles");

const SECTION_CATALOG = [
    { key: "introduction", cleTitre: "sectionIntroduction", source: "analyse" },
    { key: "chiffres", cleTitre: "sectionChiffres", source: "data" },
    { key: "tendances", cleTitre: "sectionTendances", source: "analyse" },
    { key: "acteurs", cleTitre: "sectionActeurs", source: "data" },
    { key: "cadre", cleTitre: "sectionCadre", source: "data" },
    { key: "zones", cleTitre: "sectionZones", source: "data" },
    { key: "opportunites", cleTitre: "sectionOpportunites", source: "analyse" },
    { key: "risques", cleTitre: "sectionRisques", source: "analyse" },
    { key: "benchmarking", cleTitre: "sectionBenchmarking", source: "analyse" },
    { key: "recommandations", cleTitre: "sectionRecommandations", source: "analyse" },
    { key: "perspectives", cleTitre: "sectionPerspectives", source: "analyse" },
    { key: "sources", cleTitre: "sectionSources", source: "data" },
].map((s) => ({ ...s, badge: s.source === "analyse" ? ANALYSE_BADGE : DATA_BADGE }));

/** Le catalogue, titres résolus dans la langue du document. */
function catalogueSections(doc) {
    const libelles = L(doc);
    return SECTION_CATALOG.map((s) => ({ ...s, title: libelles[s.cleTitre] }));
}

/** Intitulés des sections, pour un sommaire ou une page de couverture. */
function titresSections(doc) {
    return catalogueSections(doc).map((s) => s.title);
}

/**
 * Titres en français, sans document sous la main.
 *
 * Sert aux écrans d'administration et aux corrections manuelles, qui
 * travaillent toujours sur la version d'origine du rapport.
 */
const SECTION_TITLES = SECTION_CATALOG.map((s) => DICTIONNAIRES[LANGUE_DEFAUT][s.cleTitre]);

/**
 * Plancher théorique du document : couverture + sommaire + une page par
 * section. Ce n'est PAS le nombre de pages annoncé : celui-ci est le décompte
 * réel du dernier rapport produit (voir `generateReportPDF`, qui le mesure, et
 * `synchroniserPagesSecteur`, qui le recale en base). Ce plancher ne sert plus
 * que de valeur de repli quand aucun rapport n'a encore été généré.
 */
const MIN_PAGE_COUNT = SECTION_CATALOG.length + 2;

module.exports = {
    SECTION_CATALOG, SECTION_TITLES, MIN_PAGE_COUNT,
    catalogueSections, titresSections,
};
