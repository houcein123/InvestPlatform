// ============================================================================
// Mise au gabarit des caractères avant rendu PDF.
// ----------------------------------------------------------------------------
// CE QUE CES TESTS PROTÈGENT.
//
// Les polices intégrées de PDFKit encodent en WinAnsi, sur 8 bits. Un caractère
// hors de ce jeu n'est pas refusé : il est TRONQUÉ à son octet de poids faible.
//
// L'espace fine insécable U+202F — que les modèles insèrent spontanément dans
// « 2 500 » et avant « % », parce que c'est la typographie française correcte —
// a pour octet faible 0x2F, soit « / ». Des rapports ont donc été livrés avec
// « 2 /500 /MDT » et « +86 /% ».
//
// Ce bug est particulièrement traître : le texte reste lisible, donc personne
// ne le signale comme une panne. Il donne seulement au document l'air d'avoir
// été bâclé — sur un rapport vendu à un investisseur.
//
// D'où ces tests : la régression serait invisible en revue de code.
// ============================================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const { assainirPourPdf, caracteresHorsGabarit } = require("../src/pdf/assainir");
const { stripInlineMarkdown } = require("../src/pdf/theme");

/** Le caractère à l'origine du bug, écrit en échappement pour rester lisible. */
const ESPACE_FINE = " ";

test("l'espace fine insécable ne devient jamais une barre oblique", () => {
    const source = `2${ESPACE_FINE}500${ESPACE_FINE}MDT et +86${ESPACE_FINE}%`;
    const rendu = assainirPourPdf(source);

    assert.ok(!rendu.includes("/"), `une barre oblique subsiste : ${rendu}`);
    assert.ok(!rendu.includes(ESPACE_FINE), "l'espace fine n'a pas été substituée");
    // L'espace insécable ordinaire, elle, existe en WinAnsi : la typographie
    // voulue est préservée, seul le codet change.
    assert.ok(rendu.includes("2 500"), `séparateur perdu : ${rendu}`);
});

test("le texte narratif est assaini avant rendu", () => {
    // stripInlineMarkdown est le point de passage de TOUT texte rédigé.
    const rendu = stripInlineMarkdown(`**Total** : 1${ESPACE_FINE}008${ESPACE_FINE}MW`);
    assert.ok(!rendu.includes("/"), `barre oblique dans le texte narratif : ${rendu}`);
    assert.equal(rendu.includes("**"), false, "le gras markdown aurait dû être retiré");
});

test("les tirets et flèches hors gabarit sont convertis, pas tronqués", () => {
    const rendu = assainirPourPdf("parc‑eolien, tendance → hausse, seuil ≥ 10");
    assert.ok(rendu.includes("parc-eolien"), rendu);
    assert.ok(rendu.includes("->"), rendu);
    assert.ok(rendu.includes(">="), rendu);
});

test("la ponctuation française légitime est préservée", () => {
    // Ces caractères SONT rendables : les mutiler abîmerait un texte correct.
    const source = "L’investisseur — « en clair » — paie 50 €…";
    assert.equal(assainirPourPdf(source), source);
});

test("un caractère non rendable devient un point d'interrogation visible", () => {
    // Un idéogramme n'a pas d'équivalent WinAnsi. Le remplacer par « ? » le
    // rend visible à la relecture ; une troncature silencieuse ne se
    // découvrirait que dans le document du client.
    const rendu = assainirPourPdf("valeur 中文 finale");
    assert.ok(rendu.includes("?"), rendu);
    assert.ok(!rendu.includes("中"), rendu);
});

test("après assainissement, plus rien n'est hors gabarit", () => {
    const source = `1${ESPACE_FINE}200 → ≥ ‑ 中文   fin`;
    const restants = caracteresHorsGabarit(assainirPourPdf(source));
    assert.equal(restants.size, 0, `restants : ${[...restants.keys()].join(" ")}`);
});
