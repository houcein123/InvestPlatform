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

const AI_BADGE = { text: "Analyse IA", color: COLORS.ai, bg: COLORS.aiBg };
const DATA_BADGE = { text: "Données officielles", color: COLORS.data, bg: COLORS.dataBg };

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

function formatNumber(value, decimals = 0) {
    if (value === null || value === undefined || value === "" || isNaN(value)) return "N/D";
    const fixed = Number(value).toFixed(decimals);
    const parts = fixed.split(".");
    const negative = parts[0].startsWith("-");
    let intPart = negative ? parts[0].slice(1) : parts[0];
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return (negative ? "-" : "") + intPart + (parts[1] ? "," + parts[1] : "");
}

function formatPercent(value, decimals = 1, withSign = false) {
    if (value === null || value === undefined || isNaN(value)) return "N/D";
    const num = Number(value);
    const sign = withSign && num > 0 ? "+" : "";
    return `${sign}${formatNumber(num, decimals)} %`;
}

function formatMDT(value) {
    if (value === null || value === undefined || isNaN(value)) return "N/D";
    return `${formatNumber(value, 1)} MDT`;
}

function formatDateFR(input) {
    const d = input ? new Date(input) : new Date();
    if (isNaN(d.getTime())) return "N/D";
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

function slugify(str) {
    return String(str || "rapport")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "rapport";
}

function stripInlineMarkdown(str) {
    return String(str || "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .trim();
}

function humanizeType(raw) {
    if (!raw) return "";
    if (TYPE_LABELS[raw]) return TYPE_LABELS[raw];
    return String(raw).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ── Mise en page ───────────────────────────────────────────────────────────

function contentWidth(doc) {
    return doc.page.width - doc.page.margins.left - doc.page.margins.right;
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
            .text("Rapport Sectoriel", PAGE_MARGIN + 68, 28, { lineBreak: false });
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textLight)
            .text(String(pageNum), 0, 28, { width: doc.page.width - PAGE_MARGIN, align: "right", lineBreak: false });
        doc.moveTo(PAGE_MARGIN, 44).lineTo(doc.page.width - PAGE_MARGIN, 44)
            .strokeColor(COLORS.border).lineWidth(1).stroke();

        // Pied de page
        doc.moveTo(PAGE_MARGIN, 810).lineTo(doc.page.width - PAGE_MARGIN, 810)
            .strokeColor(COLORS.border).lineWidth(1).stroke();
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text(`Secteur : ${sector}`, PAGE_MARGIN, 818, { lineBreak: false });
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text("Document confidentiel — usage réservé au destinataire", 0, 818, {
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
    const badgeW = badge ? measureBadgeWidth(doc, badge.text) : 0;
    const titleWidth = width - (badge ? badgeW + 14 : 0);
    doc.font("Helvetica-Bold").fontSize(19).fillColor(COLORS.primary)
        .text(title, startX, titleTop, { width: titleWidth });
    // On capture la position réelle (titre sur 1 OU 2 lignes) immédiatement,
    // avant que drawBadge() ne modifie la police active.
    const titleBottom = doc.y;

    if (badge) {
        drawBadge(doc, badge.text, { x: startX + width - badgeW, y: titleTop + 4, color: badge.color, bg: badge.bg });
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

function drawSubHeading(doc, text) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, 30);
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
    AI_BADGE,
    DATA_BADGE,
    formatNumber,
    formatPercent,
    formatMDT,
    formatDateFR,
    slugify,
    stripInlineMarkdown,
    humanizeType,
    contentWidth,
    ensureSpace,
    withoutBottomMargin,
    drawHeaderFooter,
    measureBadgeWidth,
    drawBadge,
    sectionHeader,
    emptyState,
    drawSubHeading,
};
