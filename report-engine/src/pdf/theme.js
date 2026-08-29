// ============================================================================
// Charte graphique et primitives de mise en page partagées par le rapport
// complet et l'aperçu gratuit — garantit que les deux documents se ressemblent.
// ============================================================================

const COLORS = {
    primary: "#1d4ed8",
    primaryDark: "#1e3a8a",
    primaryLight: "#93c5fd",
    primaryBg: "#eff6ff",

    ai: "#7c3aed",
    aiBg: "#f5f3ff",

    data: "#0f766e",
    dataBg: "#f0fdfa",

    gold: "#b45309",
    goldBg: "#fffbeb",

    green: "#059669",
    red: "#dc2626",

    text: "#111827",
    textMuted: "#64748b",
    textLight: "#94a3b8",
    border: "#e2e8f0",
    borderLight: "#f1f5f9",
    surface: "#f8fafc",
    white: "#ffffff",
};

const PAGE_MARGIN = 60;

// Les badges qualifient la NATURE du contenu (analyse rédigée vs données
// chiffrées sourcées), pas l'outil qui l'a produit. Le moyen de production de
// l'analyse est documenté à un seul endroit : la section « Sources et
// méthodologie », en fin de rapport.
// Le libellé est une CLÉ, résolue au rendu selon la langue du document.
// Le stocker en clair ici figerait le badge en français dans un rapport anglais.
const ANALYSE_BADGE = { cleTexte: "badgeAnalyse", color: COLORS.ai, bg: COLORS.aiBg };
const DATA_BADGE = { cleTexte: "badgeDonnees", color: COLORS.data, bg: COLORS.dataBg };

// Libellés lisibles pour les champs "type" libres saisis par l'admin en base
const TYPE_LABELS = {
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
};

// ── Formatage ──────────────────────────────────────────────────────────────

/**
 * Nombre formaté selon la langue du rapport.
 *
 * Un lecteur francophone lit « 2 500,0 », un anglophone « 2,500.0 ». Servir le
 * même séparateur aux deux fait douter du montant, et sur un document vendu à
 * un investisseur, un doute sur un chiffre coûte la confiance dans tous les
 * autres.
 */
function formatNumber(value, decimals = 0, langue = "fr") {
    if (value === null || value === undefined || value === "" || isNaN(value)) return "N/D";
    const fixed = Number(value).toFixed(decimals);
    const parts = fixed.split(".");
    const negative = parts[0].startsWith("-");
    let intPart = negative ? parts[0].slice(1) : parts[0];

    const anglais = langue === "en";
    const separateurMilliers = anglais ? "," : " ";
    const separateurDecimal = anglais ? "." : ",";

    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separateurMilliers);
    return (negative ? "-" : "") + intPart
        + (parts[1] ? separateurDecimal + parts[1] : "");
}

function formatPercent(value, decimals = 1, withSign = false, langue = "fr") {
    if (value === null || value === undefined || isNaN(value)) return "N/D";
    const num = Number(value);
    const sign = withSign && num > 0 ? "+" : "";
    // L'espace avant % est une règle typographique française ; l'anglais colle
    // le signe au nombre.
    const espace = langue === "en" ? "" : " ";
    return `${sign}${formatNumber(num, decimals, langue)}${espace}%`;
}

function formatMDT(value, langue = "fr") {
    if (value === null || value === undefined || isNaN(value)) return "N/D";
    return `${formatNumber(value, 1, langue)} MDT`;
}

/**
 * Date longue, dans la langue du rapport.
 *
 * Le nom reste `formatDateFR` — il est appelé depuis une trentaine d'endroits —
 * mais la fonction accepte désormais une locale. « 29 August 2026 » au milieu
 * d'un rapport anglais, contre « 29 août 2026 » : c'est le genre de détail qui
 * trahit une traduction faite à moitié.
 */
const { L } = require("./libelles");
const { assainirPourPdf } = require("./assainir");

function formatDateFR(input, langue = "fr") {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d.getTime())) return "N/D";
    const locale = langue === "en" ? "en-GB" : "fr-FR";
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function slugify(str) {
    return String(str || "rapport")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "rapport";
}

function stripInlineMarkdown(str) {
    return assainirPourPdf(str)
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
}

/**
 * Libellé lisible d'un code de type.
 *
 * `doc` est optionnel pour ne pas casser les appels existants ; fourni, le
 * libellé suit la langue du rapport. Un code inconnu est mis en forme de son
 * mieux plutôt que masqué : mieux vaut « Pole industriel » qu'une case vide.
 */
function humanizeType(raw, doc) {
    if (!raw) return "";
    const traduits = doc ? L(doc).types : null;
    if (traduits && traduits[raw]) return traduits[raw];
    if (TYPE_LABELS[raw]) return TYPE_LABELS[raw];
    return String(raw).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ── Mise en page ───────────────────────────────────────────────────────────

function contentWidth(doc) {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

/**
 * Raccourcit un texte pour qu'il tienne sur UNE ligne de `largeurMax` points.
 *
 * Indispensable pour toute cellule de tableau : contrairement à ce que sa
 * documentation laisse entendre, l'option `lineBreak: false` de PDFKit
 * n'empêche pas le retour à la ligne (mesuré : un libellé de 172 pt placé dans
 * une colonne de 76 pt occupe 28,8 pt de hauteur, soit trois lignes, avec ou
 * sans l'option). Des lignes de tableau à hauteur fixe se chevauchaient donc,
 * et un libellé long poussait le reste de la ligne sur la page suivante.
 *
 * On mesure et on coupe nous-mêmes : la hauteur d'une cellule devient
 * prévisible, et la pagination reste maîtrisée.
 */
function tronquer(doc, texte, largeurMax) {
    const chaine = String(texte ?? "");
    if (largeurMax <= 0) return "";
    if (doc.widthOfString(chaine) <= largeurMax) return chaine;

    const suffixe = "…";
    const largeurSuffixe = doc.widthOfString(suffixe);
    let coupe = chaine.length;

    // Recherche dichotomique : bien plus rapide qu'un retrait caractère par
    // caractère sur les libellés longs, nombreux dans les tableaux INS.
    let bas = 0;
    let haut = chaine.length;
    while (bas < haut) {
        const milieu = Math.ceil((bas + haut) / 2);
        if (doc.widthOfString(chaine.slice(0, milieu)) + largeurSuffixe <= largeurMax) {
            bas = milieu;
        } else {
            haut = milieu - 1;
        }
    }
    coupe = bas;

    return coupe <= 0 ? suffixe : chaine.slice(0, coupe).trimEnd() + suffixe;
}

/**
 * S'assure qu'il reste au moins `needed` points avant le bas de la zone de
 * contenu ; sinon crée une nouvelle page. Nécessaire pour tout élément
 * dessiné "à la main" (rectangles, graphiques) qui n'est pas soumis à la
 * pagination automatique de PDFKit (contrairement au texte fluide).
 */
function ensureSpace(doc, needed) {
    const bottom = doc.page.height - doc.page.margins.bottom;
    if (doc.y + needed > bottom) {
        doc.addPage();
    }
}

/**
 * Dessine dans la marge basse sans déclencher la pagination automatique.
 * Sans neutraliser temporairement `margins.bottom`, PDFKit interprète tout
 * texte proche du bord comme un débordement et insère une page — ce qui, dans
 * un handler `pageAdded`, produit une boucle infinie.
 */
function withoutBottomMargin(doc, draw) {
    const bottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    try {
        draw();
    } finally {
        doc.page.margins.bottom = bottomMargin;
    }
}

function drawHeaderFooter(doc, sector, pageNum) {
    doc.save();

    withoutBottomMargin(doc, () => {
        // En-tête
        doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.textMuted)
            .text("InvestPlatform", PAGE_MARGIN, 28, { lineBreak: false });
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textLight)
            .text(L(doc).entetePetit, PAGE_MARGIN + 68, 28, { lineBreak: false });
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textLight)
            .text(String(pageNum), 0, 28, { width: doc.page.width - PAGE_MARGIN, align: "right", lineBreak: false });
        doc.moveTo(PAGE_MARGIN, 44).lineTo(doc.page.width - PAGE_MARGIN, 44)
            .strokeColor(COLORS.border).lineWidth(1).stroke();

        // Pied de page
        doc.moveTo(PAGE_MARGIN, 810).lineTo(doc.page.width - PAGE_MARGIN, 810)
            .strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text(L(doc).piedSecteur(sector), PAGE_MARGIN, 818, { lineBreak: false });
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text(L(doc).piedConfidentiel, 0, 818, {
                width: doc.page.width - PAGE_MARGIN, align: "right", lineBreak: false,
            });
    });

    doc.restore();

    // Les appels ci-dessus utilisent un positionnement absolu, ce qui déplace
    // le curseur de flux (doc.x/doc.y) de PDFKit. On le replace en haut de la
    // zone de contenu pour que le texte qui suit démarre au bon endroit.
    doc.x = doc.page.margins.left;
    doc.y = doc.page.margins.top;
}

// ── Composants de base ─────────────────────────────────────────────────────

function measureBadgeWidth(doc, text) {
    doc.font("Helvetica-Bold").fontSize(7.5);
    return doc.widthOfString(text.toUpperCase()) + 20;
}

function drawBadge(doc, text, { x, y, color, bg }) {
    const w = measureBadgeWidth(doc, text);
    const h = 16;
    doc.roundedRect(x, y, w, h, h / 2).fill(bg);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(color)
        .text(text.toUpperCase(), x, y + 4.5, { width: w, align: "center", lineBreak: false });
    return w;
}

function sectionHeader(doc, { index, total, title, badge, subtitle }) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    doc.x = startX;

    // IMPORTANT : on avance le curseur avec des décalages en pixels fixes
    // (doc.y += N) plutôt qu'avec doc.moveDown(), qui calcule sa distance à
    // partir de la taille de police ACTIVE au moment de l'appel. Comme
    // drawBadge() ci-dessous bascule temporairement sur une police 7.5pt,
    // un moveDown() placé après lui n'avance quasiment plus — c'est ce qui
    // provoquait le chevauchement entre le titre et le badge / le contenu.
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.textLight)
        .text(`SECTION ${String(index).padStart(2, "0")} / ${String(total).padStart(2, "0")}`, startX, doc.y, { lineBreak: false });
    doc.y += 15;
    doc.x = startX;

    const titleTop = doc.y;
    const texteBadge = badge ? L(doc)[badge.cleTexte] : "";
    const badgeW = badge ? measureBadgeWidth(doc, texteBadge) : 0;
    const titleWidth = width - (badge ? badgeW + 14 : 0);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(COLORS.primary)
        .text(title, startX, titleTop, { width: titleWidth });
    // On capture la position réelle (titre sur 1 OU 2 lignes) immédiatement,
    // avant que drawBadge() ne modifie la police active.
    const titleBottom = doc.y;

    if (badge) {
        drawBadge(doc, texteBadge, { x: startX + width - badgeW, y: titleTop + 4, color: badge.color, bg: badge.bg });
    }

    doc.x = startX;
    doc.y = titleBottom + 9;
    doc.moveTo(startX, doc.y).lineTo(startX + width, doc.y).strokeColor(COLORS.border).lineWidth(1.25).stroke();
    doc.y += 16;
    doc.x = startX;

    if (subtitle) {
        doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.textMuted)
            .text(subtitle, startX, doc.y, { width });
        doc.y += 16;
        doc.x = startX;
    }
}

function emptyState(doc, message) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, 46);
    doc.x = startX;
    const top = doc.y;
    doc.roundedRect(startX, top, width, 38, 6).fillAndStroke(COLORS.surface, COLORS.border);
    doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.textMuted)
        .text(message, startX + 16, top + 12, { width: width - 32, lineBreak: false });
    doc.y = top + 38 + 14;
    doc.x = startX;
}

/**
 * Hauteur approchee d'une ligne de corps de texte (10.3 pt + lineGap 4.5).
 * Sert a reserver de la place AVANT d'ecrire, quand le texte a venir n'est pas
 * encore connu de l'appelant.
 */
const HAUTEUR_LIGNE = 17;

/**
 * Sous-titre, jamais separe du texte qu'il introduit.
 *
 * CE QUI A CHANGE. `ensureSpace(doc, 30)` ne reservait que la hauteur du titre
 * lui-meme. Un titre tombant a 25 pt du bas de page tenait donc, et son
 * paragraphe basculait seul a la page suivante : le lecteur trouvait un titre
 * orphelin en bas d'une page, et en haut de la suivante un texte sans en-tete,
 * qui donne l'impression qu'une partie du rapport a saute.
 *
 * On exige desormais la place du titre PLUS trois lignes de corps. A defaut,
 * le titre part avec son contenu.
 */
function drawSubHeading(doc, text) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, 30 + HAUTEUR_LIGNE * 3);
    doc.moveDown(0.25);
    doc.x = startX;
    doc.font("Helvetica-Bold").fontSize(12.5).fillColor(COLORS.primaryDark)
        .text(text, startX, doc.y, { width });
    doc.moveDown(0.3);
    doc.x = startX;
}

module.exports = {
    COLORS,
    PAGE_MARGIN,
    ANALYSE_BADGE,
    DATA_BADGE,
    formatNumber,
    formatPercent,
    formatMDT,
    formatDateFR,
    slugify,
    stripInlineMarkdown,
    assainirPourPdf,
    humanizeType,
    contentWidth,
    tronquer,
    ensureSpace,
    HAUTEUR_LIGNE,
    withoutBottomMargin,
    drawHeaderFooter,
    measureBadgeWidth,
    drawBadge,
    sectionHeader,
    emptyState,
    drawSubHeading,
};
