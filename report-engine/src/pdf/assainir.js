// ============================================================================
// Mise au gabarit des polices PDF.
// ----------------------------------------------------------------------------
// CE BUG A ETE OBSERVE SUR DES RAPPORTS LIVRES, et il merite d'etre explique.
//
// Les polices integrees de PDFKit (Helvetica et consorts) encodent en WinAnsi,
// un jeu sur 8 bits. Un caractere hors de ce jeu n'est pas signale : il est
// TRONQUE A SON OCTET DE POIDS FAIBLE.
//
// L'espace fine insecable U+202F — que les modeles de redaction inserent
// spontanement dans « 2 500 » et avant « % », parce que c'est la typographie
// francaise correcte — a pour octet faible 0x2F, c'est-a-dire « / ». D'ou les
// « 2 /500 /MDT » et « +86 /% » apparus dans des rapports vendus. Le texte
// reste lisible, donc personne ne signale l'erreur : il a seulement l'air
// bacle.
//
// On substitue donc AVANT le rendu, plutot que d'esperer que le modele
// s'abstienne. Il ne s'abstiendra pas — et il a raison de ne pas s'abstenir.
// ============================================================================

/**
 * Remplacements explicites : un equivalent WinAnsi, choisi.
 *
 * Les motifs passent par `new RegExp` avec des sequences \uXXXX, jamais par des
 * litteraux contenant les caracteres eux-memes. Deux raisons : U+2028 et U+2029
 * sont des TERMINATEURS DE LIGNE pour l'analyseur JavaScript — un litteral qui
 * les contient est une erreur de syntaxe — et les autres sont invisibles, donc
 * impossibles a relire ou a modifier sans risque dans un editeur.
 */
const SUBSTITUTIONS = [
    // Espaces fines et insecables exotiques -> espace insecable, qui, elle,
    // existe en WinAnsi (0xA0) et preserve la typographie voulue.
    [new RegExp("[\\u202f\\u2007\\u2008\\u2009\\u200a\\u205f]", "g"), " "],
    // Espaces de largeur nulle : purement invisibles, on les supprime.
    [new RegExp("[\\u200b\\u200c\\u200d\\ufeff]", "g"), ""],
    // Traits d'union et tirets hors jeu -> tiret ASCII.
    [new RegExp("[\\u2010\\u2011\\u2012\\u2212]", "g"), "-"],
    // Fleches et comparateurs, courants dans les analyses chiffrees.
    [new RegExp("\\u2192", "g"), "->"],
    [new RegExp("\\u2190", "g"), "<-"],
    [new RegExp("\\u2264", "g"), "<="],
    [new RegExp("\\u2265", "g"), ">="],
    [new RegExp("\\u2260", "g"), "!="],
    [new RegExp("\\u00d7", "g"), "x"],
    // Barre de fraction typographique -> barre ASCII.
    [new RegExp("\\u2044", "g"), "/"],
    // Separateurs de ligne et de paragraphe Unicode : PDFKit ne les traite pas
    // comme des retours et les rendrait comme un caractere quelconque.
    [new RegExp("[\\u2028\\u2029]", "g"), " "],
    // Guillemets simples et doubles non couverts.
    [new RegExp("[\\u2032\\u2035]", "g"), "'"],
    [new RegExp("[\\u2033\\u2036]", "g"), "\""],
    // Points de suspension exotiques -> celui de WinAnsi.
    [new RegExp("\\u22ef", "g"), "…"],
];

/**
 * Caracteres au-dela de U+00FF que WinAnsi sait tout de meme rendre : ce sont
 * ceux qu'il place dans la plage 0x80-0x9F (guillemets courbes, tirets
 * cadratins, apostrophe typographique, euro...). Les conserver evite de mutiler
 * une ponctuation parfaitement legitime.
 */
const AUTORISES_HORS_LATIN1 =
    "\\u20ac\\u201a\\u0192\\u201e\\u2026\\u2020\\u2021\\u02c6\\u2030\\u0160"
    + "\\u2039\\u0152\\u017d\\u2018\\u2019\\u201c\\u201d\\u2022\\u2013\\u2014"
    + "\\u02dc\\u2122\\u0161\\u203a\\u0153\\u017e\\u0178";

/**
 * Filet de securite : tout caractere encore hors gabarit devient « ? ».
 *
 * Un point d'interrogation se voit a la relecture. Une troncature silencieuse,
 * elle, ne se decouvre que dans le document du client.
 */
const HORS_GABARIT = new RegExp("[^\\u0000-\\u00ff" + AUTORISES_HORS_LATIN1 + "]", "g");

/** Ramene un texte au jeu de caracteres que les polices du PDF savent rendre. */
function assainirPourPdf(valeur) {
    let texte = String(valeur === null || valeur === undefined ? "" : valeur);
    for (const [motif, remplacement] of SUBSTITUTIONS) {
        texte = texte.replace(motif, remplacement);
    }
    return texte.replace(HORS_GABARIT, "?");
}

/**
 * Diagnostic : compte les caracteres qu'un texte perdrait au rendu.
 * Sert aux tests, et a instruire un signalement client.
 */
function caracteresHorsGabarit(valeur) {
    const trouves = new Map();
    const detecteur = new RegExp(HORS_GABARIT.source);
    for (const caractere of String(valeur || "")) {
        if (detecteur.test(caractere)) {
            trouves.set(caractere, (trouves.get(caractere) || 0) + 1);
        }
    }
    return trouves;
}

module.exports = { assainirPourPdf, caracteresHorsGabarit };
