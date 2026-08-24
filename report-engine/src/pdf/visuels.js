// ============================================================================
// Visuels sectoriels du rapport PDF.
// ----------------------------------------------------------------------------
// UNE SEULE SOURCE : des PHOTOGRAPHIES RÉELLES du secteur en Tunisie, déposées
// dans `report-engine/assets/secteurs/` et décrites une par une dans
// `credits.json` (légende, auteur, licence, page d'origine).
//
// Il n'y a plus de motif « emblème » dessiné par le programme : une géométrie
// inventée n'apprend rien au lecteur d'un rapport vendu. Si une photographie
// manque, on pose un aplat sobre aux couleurs du secteur — jamais une image
// de remplacement empruntée à un autre sujet.
//
// DROITS : chaque fichier est accompagné de son auteur et de sa licence, repris
// sous l'image ET dans la section « Sources et méthodologie ». Les licences
// utilisées (CC BY, CC BY-SA, CC0, domaine public) autorisent l'usage
// commercial à condition de citer l'auteur : c'est exactement ce que fait le
// document. Toute image ajoutée ici doit l'être aux mêmes conditions.
// ============================================================================

const fs = require("fs");
const path = require("path");

const { COLORS } = require("./theme");

const DOSSIER_IMAGES = path.join(__dirname, "../../assets/secteurs");
const FICHIER_CREDITS = path.join(DOSSIER_IMAGES, "credits.json");

/** Teintes propres à chaque secteur, reprises de l'interface. */
const TEINTES = {
    tourisme: { principale: "#d97706", secondaire: "#fbbf24" },
    agriculture: { principale: "#15803d", secondaire: "#4ade80" },
    technologies: { principale: "#1d4ed8", secondaire: "#60a5fa" },
    energies: { principale: "#65a30d", secondaire: "#a3e635" },
    textile: { principale: "#a21caf", secondaire: "#e879f9" },
    logistique: { principale: "#0e7490", secondaire: "#22d3ee" },
};

function teinte(slug) {
    return TEINTES[slug] || { principale: COLORS.primary, secondaire: COLORS.primaryLight };
}

// ── Catalogue des photographies ─────────────────────────────────────────────

/**
 * Fichier de crédits, lu une seule fois par processus.
 *
 * Un fichier absent ou illisible ne doit pas empêcher un rapport payé de
 * sortir : on retombe alors sur un catalogue vide, donc sur les aplats.
 */
let creditsEnCache = null;

function chargerCredits() {
    if (creditsEnCache) return creditsEnCache;
    try {
        creditsEnCache = JSON.parse(fs.readFileSync(FICHIER_CREDITS, "utf8"));
    } catch (err) {
        console.warn("⚠️  Crédits photographiques illisibles :", err.message);
        creditsEnCache = {};
    }
    return creditsEnCache;
}

/**
 * Photographies RÉELLEMENT présentes sur le disque pour ce secteur, dans
 * l'ordre du fichier de crédits (la première sert de couverture).
 */
function photosSecteur(slug) {
    return (chargerCredits()[slug] || [])
        .map((entree) => ({ ...entree, chemin: path.join(DOSSIER_IMAGES, entree.fichier) }))
        .filter((entree) => fs.existsSync(entree.chemin));
}

/** Photographie de rang donné (1 = couverture), ou null. */
function photoSecteur(slug, rang = 1) {
    return photosSecteur(slug)[rang - 1] || null;
}

/**
 * Caractères que les polices standard du PDF savent réellement écrire.
 *
 * PDFKit encode Helvetica en WinAnsi : le latin-1 (U+0020 à U+00FF) plus une
 * poignée de signes typographiques (tiret cadratin, apostrophes courbes,
 * guillemets, puce…). Tout le reste — cyrillique, arabe, idéogrammes — sort en
 * octets illisibles.
 */
const RENDU_HELVETICA = new RegExp(
    "^[\u0020-\u00ff\u20ac\u201a\u0192\u201e\u2026\u2020\u2021\u02c6\u2030\u0160"
    + "\u2039\u0152\u017d\u2018\u2019\u201c\u201d\u2022\u2013\u2014\u02dc\u2122"
    + "\u0161\u203a\u0153\u017e\u0178]*$"
);

/**
 * Texte débarrassé de ce que le PDF ne sait pas écrire.
 *
 * Un nom d'auteur en charabia ne remplit pas l'obligation d'attribution : on
 * conserve les alphabets latins (accents compris, après décomposition) et on
 * écarte le reste plutôt que d'imprimer des octets au hasard.
 */
function texteLatin(valeur) {
    const source = String(valeur || "").normalize("NFC");
    if (RENDU_HELVETICA.test(source)) return source;

    return source.normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .split("")
        .filter((caractere) => RENDU_HELVETICA.test(caractere))
        .join("")
        .replace(/\s{2,}/g, " ")
        .trim();
}

/** Ligne de crédit affichée sous l'image : la licence l'exige, la lisibilité aussi. */
function ligneCredit(photo) {
    const auteur = texteLatin(photo.auteur) || "auteur non transcriptible";
    return `Photo : ${auteur} — ${photo.licence}, via Wikimedia Commons`;
}

// ── Bandeau de couverture ───────────────────────────────────────────────────

/**
 * Bandeau photographique de la couverture.
 *
 * Un voile sombre est posé sur l'image : le titre de couverture est blanc, et
 * un ciel clair rendrait ce titre illisible. Le crédit est glissé en bas à
 * droite du bandeau, assez discret pour ne pas concurrencer le titre, assez
 * lisible pour remplir l'obligation d'attribution.
 */
function dessinerBandeauCouverture(doc, secteur, { x, y, largeur, hauteur }) {
    const slug = secteur.slug;
    const { principale, secondaire } = teinte(slug);
    const photo = photoSecteur(slug, 1);

    doc.save();
    doc.roundedRect(x, y, largeur, hauteur, 10).clip();

    let photoUtilisee = false;
    if (photo) {
        try {
            doc.image(photo.chemin, x, y, { cover: [largeur, hauteur], align: "center", valign: "center" });
            doc.rect(x, y, largeur, hauteur).fillOpacity(0.55).fill("#0b1220").fillOpacity(1);
            photoUtilisee = true;
        } catch (err) {
            // Une image illisible ne doit pas faire échouer un rapport payé.
            console.warn(`⚠️  Photographie de couverture inutilisable (${slug}) :`, err.message);
        }
    }

    if (!photoUtilisee) {
        doc.rect(x, y, largeur, hauteur).fill("#0b1220");
        doc.rect(x, y, largeur, hauteur).fillOpacity(0.3).fill(principale).fillOpacity(1);
    }

    doc.restore();

    if (photoUtilisee) {
        doc.save();
        doc.opacity(0.75);
        doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.white)
            .text(ligneCredit(photo), x + 24, y + hauteur - 20, {
                width: largeur - 48, align: "right", lineBreak: false,
            });
        doc.opacity(1);
        doc.restore();
    }

    // Filet d'accent en pied de bandeau.
    doc.rect(x, y + hauteur - 3, largeur, 3).fill(secondaire);
    return { photoUtilisee };
}

// ── Illustration de section ─────────────────────────────────────────────────

/**
 * Photographie illustrant une section, posée à la position courante du
 * curseur, légende et crédit compris. Le curseur est avancé sous la légende.
 *
 * @param {number} rang  quelle photographie du secteur (2, 3, …)
 * @returns {boolean} true si une image a été posée
 */
function dessinerIllustrationSection(doc, secteur, { rang = 2, hauteur = 150 } = {}) {
    const photo = photoSecteur(secteur.slug, rang);
    if (!photo) return false;

    const x = doc.page.margins.left;
    const largeur = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const hauteurTotale = hauteur + 30;

    // Une image coupée en bas de page ne vaut rien : on la reporte entière.
    if (doc.y + hauteurTotale > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
    }

    const y = doc.y;
    doc.save();
    doc.roundedRect(x, y, largeur, hauteur, 8).clip();
    try {
        doc.image(photo.chemin, x, y, { cover: [largeur, hauteur], align: "center", valign: "center" });
    } catch (err) {
        doc.restore();
        console.warn(`⚠️  Photographie de section inutilisable (${photo.fichier}) :`, err.message);
        return false;
    }
    doc.restore();

    // Filet d'accent : rattache visuellement l'image à la charte du secteur.
    doc.rect(x, y + hauteur - 2.5, largeur, 2.5).fill(teinte(secteur.slug).secondaire);

    doc.y = y + hauteur + 7;
    doc.x = x;
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.textMuted)
        .text(texteLatin(photo.legende), x, doc.y, { width: largeur, lineBreak: false });
    doc.y += 11;
    doc.font("Helvetica").fontSize(7).fillColor(COLORS.textLight)
        .text(ligneCredit(photo), x, doc.y, { width: largeur, lineBreak: false });
    doc.y += 16;
    doc.x = x;

    return true;
}

module.exports = {
    TEINTES,
    texteLatin,
    teinte,
    photosSecteur,
    photoSecteur,
    ligneCredit,
    dessinerBandeauCouverture,
    dessinerIllustrationSection,
    DOSSIER_IMAGES,
};
