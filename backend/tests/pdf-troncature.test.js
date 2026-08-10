// ============================================================================
// Troncature des cellules de tableau du PDF.
// ----------------------------------------------------------------------------
// Ces tests figent le comportement corrigé après un défaut constaté : l'option
// `lineBreak: false` de PDFKit ne suffit PAS à empêcher le retour à la ligne,
// ce qui faisait se chevaucher des lignes de tableau à hauteur fixe et
// produisait des pages presque vides.
// ============================================================================

const test = require("node:test");
const assert = require("node:assert/strict");
const PDFDocument = require("pdfkit");

const { tronquer } = require("../src/pdf/theme");

function documentDeTest() {
    const doc = new PDFDocument({ size: "A4", margin: 60 });
    doc.font("Helvetica").fontSize(8.3);
    return doc;
}

test("un texte qui tient est rendu intact", () => {
    const doc = documentDeTest();
    assert.equal(tronquer(doc, "Tourisme", 200), "Tourisme");
});

test("un texte trop long est coupé et tient dans la largeur", () => {
    const doc = documentDeTest();
    const source = "Office National du Tourisme Tunisien  (O.N.T.T)";
    const largeur = 76;

    assert.ok(doc.widthOfString(source) > largeur, "le cas testé doit bien déborder");

    const resultat = tronquer(doc, source, largeur);
    assert.notEqual(resultat, source);
    assert.ok(resultat.endsWith("…"), "la coupure doit être visible");
    assert.ok(
        doc.widthOfString(resultat) <= largeur,
        `le résultat doit tenir dans ${largeur} pt (mesuré ${doc.widthOfString(resultat)})`
    );
});

test("une largeur nulle ou négative renvoie une chaîne vide", () => {
    const doc = documentDeTest();
    assert.equal(tronquer(doc, "Peu importe", 0), "");
    assert.equal(tronquer(doc, "Peu importe", -10), "");
});

test("les valeurs absentes ne font pas planter le rendu", () => {
    const doc = documentDeTest();
    assert.equal(tronquer(doc, null, 100), "");
    assert.equal(tronquer(doc, undefined, 100), "");
    assert.equal(tronquer(doc, 42, 100), "42");
});

test("une largeur minuscule renvoie au moins les points de suspension", () => {
    const doc = documentDeTest();
    const resultat = tronquer(doc, "Indicateur très long", 3);
    assert.equal(resultat, "…");
});

test("la troncature reste correcte sur des libellés accentués", () => {
    const doc = documentDeTest();
    const source = "Évolution des entrées des voyageurs non résidents par voie de transport";
    const resultat = tronquer(doc, source, 120);
    assert.ok(doc.widthOfString(resultat) <= 120);
    assert.ok(resultat.startsWith("Évolution"));
});
