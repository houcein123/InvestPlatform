// ============================================================================
// InvestPlatform — Générateur de Rapport Sectoriel PDF
// ----------------------------------------------------------------------------
// Conforme au Cahier des Charges §5 : couverture + sommaire + 12 sections,
// approche hybride.
//   - Sections chiffrées : chiffresCles, donneesStatistiques, zonesGeographiques,
//                          acteursPrincipaux, cadreReglementaire
//   - Sections rédigées  : introduction, tendances, opportunites, risques,
//                          benchmarking, recommandations, perspectives
//
// Le document ne signale nulle part que les sections rédigées sont produites
// par un modèle de langage, SAUF dans « Sources et méthodologie » où le procédé
// est décrit explicitement — c'est le seul endroit prévu pour cette mention.
//
// CONTRAT D'ENTRÉE (objet `report`) — produit par reportService :
//   {
//     secteur: <ligne de la table secteurs>,
//     chiffresCles, donneesStatistiques, zonesGeographiques,
//     acteursPrincipaux, cadreReglementaire,   // tables métier
//     narratives: { introduction, tendances, ... },  // textes Groq
//     modeleIA: "llama-3.3-70b-versatile"
//   }
// C'est exactement la forme renvoyée par sectorRepository.getSectorData(),
// enrichie des textes IA : aucune conversion manuelle n'est nécessaire.
// ============================================================================

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const { config } = require("../config/env");
const { SECTION_CATALOG, SECTION_TITLES } = require("./sections");
const { LIBELLES_METHODE } = require("../services/projectionService");
const {
    COLORS,
    PAGE_MARGIN,
    formatNumber,
    formatPercent,
    formatMDT,
    formatDateFR,
    slugify,
    stripInlineMarkdown,
    humanizeType,
    contentWidth,
    tronquer,
    ensureSpace,
    withoutBottomMargin,
    drawHeaderFooter,
    measureBadgeWidth,
    drawBadge,
    sectionHeader,
    emptyState,
    drawSubHeading,
} = require("./theme");

// ============================================================================
// 1. RENDU DE TEXTE ENRICHI (sections rédigées par l'IA)
// ----------------------------------------------------------------------------
// Le texte renvoyé par le modèle de langage suit souvent une structure légère
// (listes à tirets, titres numérotés "1. ...", lignes "**Titre**"). On la
// transforme en mise en page propre plutôt que d'afficher les astérisques et
// tirets bruts.
// ============================================================================

function renderParagraph(doc, text) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    doc.x = startX;
    doc.font("Helvetica").fontSize(10.3).fillColor(COLORS.text)
        .text(stripInlineMarkdown(text), startX, doc.y, { width, align: "justify", lineGap: 4.5 });
    doc.moveDown(0.65);
    doc.x = startX;
}

function renderBullet(doc, text) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    const indent = 15;
    const y = doc.y;
    doc.circle(startX + 3, y + 5.5, 1.7).fill(COLORS.primary);
    doc.font("Helvetica").fontSize(10.3).fillColor(COLORS.text)
        .text(stripInlineMarkdown(text), startX + indent, y, { width: width - indent, align: "justify", lineGap: 4.5 });
    doc.moveDown(0.4);
    doc.x = startX;
}

function renderRichText(doc, text) {
    if (!text || !text.trim()) return;
    const startX = doc.page.margins.left;

    let buffer = [];
    const flush = () => {
        if (buffer.length === 0) return;
        const paragraph = buffer.join(" ").trim();
        buffer = [];
        if (paragraph) {
            ensureSpace(doc, 26);
            renderParagraph(doc, paragraph);
        }
    };

    text.replace(/\r\n/g, "\n").split("\n").forEach((rawLine) => {
        const line = rawLine.trim();
        if (line === "") { flush(); return; }

        const numbered = /^(\d{1,2})[.)]\s+(.+)$/.exec(line);
        const boldOnly = /^\*\*(.+?)\*\*:?$/.exec(line);
        const bullet = /^[-*•]\s+(.+)$/.exec(line);

        if (bullet) {
            flush();
            ensureSpace(doc, 20);
            renderBullet(doc, bullet[1]);
            return;
        }
        if (numbered && numbered[2].length < 80) {
            flush();
            drawSubHeading(doc, `${numbered[1]}. ${stripInlineMarkdown(numbered[2])}`);
            return;
        }
        if (boldOnly) {
            flush();
            drawSubHeading(doc, stripInlineMarkdown(boldOnly[1]));
            return;
        }
        buffer.push(line);
    });
    flush();
    doc.x = startX;
}

function renderNarrativeSection(doc, text) {
    if (!text || !text.trim()) {
        emptyState(doc, "Section non disponible dans cette édition du rapport.");
        return;
    }
    renderRichText(doc, text);
}

// ============================================================================
// 2. CARTES KPI — table "chiffres_cles"
// ============================================================================

const KPI_DEFS = [
    { key: "contribution_pib_pct", label: "Contribution au PIB", fmt: (v) => formatPercent(v) },
    { key: "croissance_annuelle_pct", label: "Croissance annuelle", fmt: (v) => formatPercent(v, 1, true),
      color: (v) => (v < 0 ? COLORS.red : COLORS.green) },
    { key: "nombre_emplois", label: "Emplois générés", fmt: (v) => formatNumber(v) },
    { key: "exportations_mdt", label: "Exportations", fmt: (v) => formatMDT(v) },
    { key: "nombre_entreprises", label: "Entreprises actives", fmt: (v) => formatNumber(v) },
    { key: "investissements_ide_mdt", label: "Investissements IDE", fmt: (v) => formatMDT(v) },
    { key: "part_marche_regional_pct", label: "Part marché régional", fmt: (v) => formatPercent(v) },
];

function drawKPICard(doc, { x, y, w, h, label, value, valueColor }) {
    doc.roundedRect(x, y, w, h, 7).fill(COLORS.primaryBg);
    doc.save();
    doc.roundedRect(x, y, w, h, 7).clip();
    doc.rect(x, y, 4, h).fill(COLORS.primary);
    doc.restore();

    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.textMuted)
        .text(label.toUpperCase(), x + 16, y + 11, { width: w - 28, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(16.5).fillColor(valueColor || COLORS.primaryDark)
        .text(value, x + 16, y + 27, { width: w - 28, lineBreak: false });
}

function drawKPIGrid(doc, chiffresCles) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);

    if (!chiffresCles) {
        emptyState(doc, "Chiffres clés non disponibles — à renseigner depuis le panneau admin.");
        return;
    }

    const cols = 2;
    const gap = 14;
    const cardW = (width - gap * (cols - 1)) / cols;
    const cardH = 58;
    const rowGap = 12;

    let rowY = doc.y;
    KPI_DEFS.forEach((def, i) => {
        const col = i % cols;
        if (col === 0) {
            ensureSpace(doc, cardH + rowGap);
            rowY = doc.y;
        }
        const raw = chiffresCles[def.key];
        const value = raw === null || raw === undefined ? "N/D" : def.fmt(raw);
        const valueColor = def.color && raw !== null && raw !== undefined ? def.color(raw) : undefined;
        drawKPICard(doc, {
            x: startX + col * (cardW + gap), y: rowY, w: cardW, h: cardH,
            label: def.label, value, valueColor,
        });
        if (col === cols - 1 || i === KPI_DEFS.length - 1) {
            doc.y = rowY + cardH + rowGap;
            doc.x = startX;
        }
    });
}

// ============================================================================
// 3. GRAPHIQUES — table "donnees_statistiques"
//    (aucune librairie de charts : tout est dessiné avec les primitives
//     vectorielles de PDFKit)
// ============================================================================

const HISTORY_YEARS = ["2020", "2021", "2022", "2023", "2024"];
const PROJECTION_YEARS = ["2025", "2026", "2027", "2028"];

/**
 * Construit la série affichée dans un graphique.
 *
 * `isProjection` distingue, année par année, ce qui a été publié par la source
 * officielle de ce qui a été estimé. Cette distinction se retrouve dans la
 * couleur des barres et dans la légende : le lecteur sait toujours quelle
 * partie de la courbe est observée et laquelle est projetée.
 */
function extractSeries(row) {
    const years = [];
    const values = [];
    const isProjection = [];

    HISTORY_YEARS.forEach((y) => {
        const observee = row[`valeur_${y}`];
        years.push(y);

        if (observee !== null && observee !== undefined) {
            values.push(Number(observee));
            isProjection.push(false);
            return;
        }

        // Seule 2024 peut être comblée par une estimation : les années
        // antérieures manquantes le restent (une lacune passée ne s'invente pas).
        const estimee = y === "2024" ? row.projection_2024 : null;
        values.push(estimee === null || estimee === undefined ? null : Number(estimee));
        isProjection.push(estimee !== null && estimee !== undefined);
    });

    PROJECTION_YEARS.forEach((y) => {
        const v = row[`projection_${y}`];
        if (v !== null && v !== undefined) {
            years.push(y); values.push(Number(v)); isProjection.push(true);
        }
    });

    return { years, values, isProjection };
}

/** Une série n'a d'intérêt graphique que si elle porte au moins une valeur. */
function hasValues(row) {
    return extractSeries(row).values.some((v) => v !== null && v !== undefined && !isNaN(v));
}

/** Vrai si la ligne porte au moins une estimation calculée. */
function hasProjection(row) {
    return PROJECTION_YEARS.some((y) => row[`projection_${y}`] !== null && row[`projection_${y}`] !== undefined)
        || (row.projection_2024 !== null && row.projection_2024 !== undefined);
}

function drawIndicatorChart(doc, { x, y, width, height, title, unit, years, values, isProjection }) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
        .text(tronquer(doc, title, width - 46), x, y, { width: width - 46 });
    if (unit) {
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text(unit, x + width - 90, y + 1, { width: 90, align: "right", lineBreak: false });
    }

    const chartTop = y + 20;
    const chartBottom = y + height - 16;
    const chartHeight = chartBottom - chartTop;

    const nums = values.filter((v) => v !== null && v !== undefined && !isNaN(v));
    if (nums.length === 0) {
        doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.textLight)
            .text("Données non disponibles", x, chartTop + chartHeight / 2 - 4, { width, align: "center", lineBreak: false });
        return;
    }
    const maxVal = Math.max(...nums) * 1.2 || 1;

    doc.strokeColor(COLORS.borderLight).lineWidth(0.5);
    for (let i = 0; i <= 2; i++) {
        const gy = chartTop + (chartHeight * i) / 2;
        doc.moveTo(x, gy).lineTo(x + width, gy).stroke();
    }

    const n = values.length;
    const gap = 5;
    const barW = (width - gap * (n - 1)) / n;

    values.forEach((v, i) => {
        if (v === null || v === undefined || isNaN(v)) return;
        const bx = x + i * (barW + gap);
        const h = Math.max((v / maxVal) * chartHeight, 1.5);
        const by = chartBottom - h;
        doc.roundedRect(bx, by, barW, h, 1.5).fill(isProjection && isProjection[i] ? COLORS.primaryLight : COLORS.primary);
        if (i === n - 1) {
            doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.primaryDark)
                .text(formatNumber(v), bx - 14, by - 10, { width: barW + 28, align: "center", lineBreak: false });
        }
    });

    doc.strokeColor(COLORS.textLight).lineWidth(0.75).moveTo(x, chartBottom).lineTo(x + width, chartBottom).stroke();

    values.forEach((_, i) => {
        const bx = x + i * (barW + gap);
        doc.font("Helvetica").fontSize(6).fillColor(COLORS.textLight)
            .text(years[i].slice(2), bx - 3, chartBottom + 4, { width: barW + 6, align: "center", lineBreak: false });
    });
}

function drawStatisticsCharts(doc, rows) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    if (rows.length === 0) return;

    const cols = 2;
    const gap = 16;
    const cardW = (width - gap * (cols - 1)) / cols;
    const cardH = 150;
    const rowGap = 18;

    let rowY = doc.y;
    rows.forEach((row, i) => {
        const col = i % cols;
        if (col === 0) {
            ensureSpace(doc, cardH + rowGap);
            rowY = doc.y;
        }
        const { years, values, isProjection } = extractSeries(row);
        drawIndicatorChart(doc, {
            x: startX + col * (cardW + gap), y: rowY, width: cardW, height: cardH,
            title: row.indicateur || "Indicateur", unit: row.unite, years, values, isProjection,
        });
        if (col === cols - 1 || i === rows.length - 1) {
            doc.y = rowY + cardH + rowGap;
            doc.x = startX;
        }
    });
}

/** Dernière année réellement publiée pour une série. */
function derniereObservation(row) {
    for (const annee of [2024, 2023, 2022, 2021, 2020]) {
        const v = row[`valeur_${annee}`];
        if (v !== null && v !== undefined) return { annee, valeur: v };
    }
    return null;
}

/** Hauteur d'une ligne de tableau. Constante : chaque cellule tient sur une ligne. */
const ROW_H = 21;

/**
 * Tableau récapitulatif des séries statistiques.
 *
 * La colonne « source » a été retirée : les libellés de l'INS y dépassent
 * régulièrement 170 pt pour une colonne de 76, ce qui les rendait illisibles
 * une fois tronqués. Les sources sont de toute façon listées intégralement en
 * section 12, où elles ont la place de s'afficher.
 */
function drawStatisticsTable(doc, rows) {
    if (!rows || rows.length === 0) return;
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);

    const colonnes = [
        { label: "INDICATEUR", largeur: 0.52 },
        { label: "UNITÉ", largeur: 0.15 },
        { label: "DERNIÈRE VALEUR", largeur: 0.17, align: "right" },
        { label: "EST. 2028", largeur: 0.16, align: "right" },
    ];

    const dessinerEntete = () => {
        const headerY = doc.y;
        doc.rect(startX, headerY, width, ROW_H).fill(COLORS.surface);
        doc.font("Helvetica-Bold").fontSize(7.6).fillColor(COLORS.textMuted);
        let cx = startX;
        colonnes.forEach((col) => {
            const w = col.largeur * width;
            doc.text(col.label, cx + 8, headerY + 7, { width: w - 12, align: col.align || "left" });
            cx += w;
        });
        doc.y = headerY + ROW_H;
        doc.x = startX;
    };

    ensureSpace(doc, ROW_H * 3);
    doc.x = startX;
    dessinerEntete();

    rows.forEach((row, i) => {
        // Une ligne ne doit jamais être coupée en deux pages : on réserve la
        // place AVANT de dessiner, et l'en-tête est répété sur la nouvelle page.
        const avant = doc.y;
        ensureSpace(doc, ROW_H + 2);
        if (doc.y !== avant) dessinerEntete();

        const rowY = doc.y;
        if (i % 2 === 1) doc.rect(startX, rowY, width, ROW_H).fill(COLORS.borderLight);

        const derniere = derniereObservation(row);
        const estimation = row.projection_2028;

        const cellules = [
            { texte: row.indicateur || "-", couleur: COLORS.text },
            { texte: row.unite || "-", couleur: COLORS.textMuted },
            {
                texte: derniere ? `${formatNumber(derniere.valeur)} (${derniere.annee})` : "N/D",
                couleur: COLORS.text, gras: true, align: "right",
            },
            {
                // L'estimation est écrite dans la couleur des projections :
                // impossible de la confondre avec une valeur publiée.
                texte: estimation !== null && estimation !== undefined ? formatNumber(estimation) : "—",
                couleur: COLORS.primary, align: "right",
            },
        ];

        let cx = startX;
        colonnes.forEach((col, index) => {
            const w = col.largeur * width;
            const cellule = cellules[index];
            doc.font(cellule.gras ? "Helvetica-Bold" : "Helvetica").fontSize(8.2).fillColor(cellule.couleur);
            doc.text(tronquer(doc, cellule.texte, w - 14), cx + 8, rowY + 6.5, {
                width: w - 12, align: cellule.align || "left",
            });
            cx += w;
        });

        doc.y = rowY + ROW_H;
        doc.x = startX;
    });
    doc.moveDown(0.4);
    doc.x = startX;
}

/** Nombre de graphiques mis en avant ; le reste bascule en tableau. */
const FEATURED_CHARTS = 4;
/** Plafond du tableau récapitulatif — au-delà, le rapport deviendrait illisible. */
const MAX_TABLE_ROWS = 30;

/** Légende expliquant la distinction observé / estimé sous les graphiques. */
function drawProjectionLegend(doc) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, 26);
    const y = doc.y;

    doc.roundedRect(startX, y + 2, 9, 9, 1.5).fill(COLORS.primary);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textMuted)
        .text("Valeur observée (source officielle)", startX + 15, y + 2, { lineBreak: false });

    const decalage = startX + 15 + doc.widthOfString("Valeur observée (source officielle)") + 22;
    doc.roundedRect(decalage, y + 2, 9, 9, 1.5).fill(COLORS.primaryLight);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textMuted)
        .text("Estimation calculée", decalage + 15, y + 2, { lineBreak: false });

    doc.y = y + 20;
    doc.x = startX;
    doc.font("Helvetica-Oblique").fontSize(8).fillColor(COLORS.textLight)
        .text("Les estimations prolongent la tendance observée ; leur méthode de calcul est détaillée en section 12.",
            startX, doc.y, { width });
    doc.moveDown(0.5);
    doc.x = startX;
}

function renderChiffresClesSection(doc, report) {
    const startX = doc.page.margins.left;
    drawKPIGrid(doc, report.chiffresCles);

    // On ne met en avant que les séries réellement renseignées : afficher
    // quatre graphiques « Données non disponibles » donnait un rapport vide
    // alors que d'autres indicateurs du même secteur sont bien remplis.
    const all = report.donneesStatistiques || [];
    const withData = all.filter(hasValues);

    if (withData.length === 0) {
        if (report.chiffresCles) {
            emptyState(doc, "Aucune série statistique disponible pour ce secteur pour le moment.");
        }
        return;
    }

    doc.moveDown(0.3);
    drawSubHeading(doc, "Évolution des indicateurs sectoriels");

    // Les séries qui portent une projection sont mises en avant : ce sont
    // celles qui éclairent le mieux une décision d'investissement.
    const misesEnAvant = [...withData].sort((a, b) => {
        const scoreA = (hasProjection(a) ? 2 : 0) + (Number(a.fiabilite_r2) || 0);
        const scoreB = (hasProjection(b) ? 2 : 0) + (Number(b.fiabilite_r2) || 0);
        return scoreB - scoreA;
    }).slice(0, FEATURED_CHARTS);

    drawStatisticsCharts(doc, misesEnAvant);
    if (misesEnAvant.some(hasProjection)) drawProjectionLegend(doc);

    // Le tableau récapitulatif reprend tout ce qui n'a PAS été mis en graphique.
    const misesEnAvantIds = new Set(misesEnAvant.map((r) => r.id));
    const remaining = withData.filter((r) => !misesEnAvantIds.has(r.id));
    if (remaining.length > 0) {
        doc.moveDown(0.2);
        doc.x = startX;
        const shown = remaining.slice(0, MAX_TABLE_ROWS);
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted)
            .text(`${remaining.length} indicateur(s) supplémentaire(s) disponible(s) :`, startX, doc.y);
        doc.moveDown(0.3);
        doc.x = startX;
        drawStatisticsTable(doc, shown);

        if (remaining.length > shown.length) {
            doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.textLight)
                .text(`… et ${remaining.length - shown.length} autre(s) indicateur(s) consultable(s) depuis le panneau admin.`,
                    startX, doc.y, { width: contentWidth(doc) });
            doc.moveDown(0.4);
            doc.x = startX;
        }
    }
}

// ============================================================================
// 4. TABLEAU GÉNÉRIQUE
//    columns: [{ label, width /* fraction 0..1 */, align, render(row) }]
// ============================================================================

function drawTable(doc, { columns, rows, emptyMessage }) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);

    if (!rows || rows.length === 0) {
        emptyState(doc, emptyMessage || "Aucune donnée disponible pour ce tableau.");
        return;
    }

    ensureSpace(doc, 26);
    doc.x = startX;
    let y = doc.y;
    doc.roundedRect(startX, y, width, 24, 4).fill(COLORS.primaryDark);
    let cx = startX;
    columns.forEach((col) => {
        const w = col.width * width;
        doc.font("Helvetica-Bold").fontSize(7.8).fillColor(COLORS.white)
            .text(col.label.toUpperCase(), cx + 10, y + 8.5, { width: w - 14, align: col.align || "left", lineBreak: false });
        cx += w;
    });
    y += 24;
    doc.y = y;
    doc.x = startX;

    rows.forEach((row, i) => {
        ensureSpace(doc, 23);
        y = doc.y;
        if (i % 2 === 1) doc.rect(startX, y, width, 22).fill(COLORS.surface);
        cx = startX;
        columns.forEach((col) => {
            const w = col.width * width;
            const value = col.render ? col.render(row) : String(row[col.key] ?? "-");
            doc.font(col.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.3)
                .fillColor(col.color ? col.color(row) : COLORS.text);
            // Troncature mesurée : `lineBreak: false` ne suffit pas à empêcher
            // le retour à la ligne, qui ferait déborder la ligne suivante.
            doc.text(tronquer(doc, value, w - 16), cx + 10, y + 6.5, {
                width: w - 14, align: col.align || "left",
            });
            cx += w;
        });
        doc.y = y + 22;
        doc.x = startX;
    });
    doc.moveDown(0.5);
    doc.x = startX;
}

// ============================================================================
// 5. CARTES LISTE — cadre réglementaire / zones (contenu trop long pour un
//    tableau à colonnes fixes : chaque item garde son paragraphe complet)
// ============================================================================

function drawCardShell(doc, height) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, height + 12);
    const top = doc.y;
    doc.roundedRect(startX, top, width, height, 6).fillAndStroke(COLORS.white, COLORS.border);
    doc.y = top + height + 12;
    doc.x = startX;
    return { startX, width, top };
}

function renderActeursSection(doc, acteurs) {
    drawTable(doc, {
        emptyMessage: "Aucun acteur principal renseigné pour ce secteur pour le moment.",
        rows: acteurs,
        columns: [
            { label: "Nom", width: 0.30, render: (r) => r.nom || "-", bold: true },
            { label: "Type", width: 0.17, render: (r) => humanizeType(r.type) },
            { label: "Rôle", width: 0.26, render: (r) => r.role || "-" },
            { label: "CA (MDT)", width: 0.12, align: "right",
              render: (r) => (r.chiffre_affaires != null ? formatNumber(r.chiffre_affaires, 1) : "N/D") },
            { label: "Employés", width: 0.15, align: "right",
              render: (r) => (r.nombre_employes != null ? formatNumber(r.nombre_employes) : "N/D") },
        ],
    });

    // Sites web : listés séparément (des liens n'ont pas leur place dans les
    // cellules d'un tableau à largeur fixe).
    const withSite = (acteurs || []).filter((a) => a.site_web);
    if (withSite.length > 0) {
        const startX = doc.page.margins.left;
        const width = contentWidth(doc);
        doc.moveDown(0.15);
        doc.x = startX;
        doc.font("Helvetica").fontSize(7.8).fillColor(COLORS.textLight)
            .text("SITES WEB : " + withSite.map((a) => `${a.nom} — ${a.site_web.replace(/^https?:\/\//, "")}`).join("   ·   "),
                startX, doc.y, { width, lineBreak: true });
        doc.moveDown(0.4);
        doc.x = startX;
    }
}

function drawCadreCard(doc, item) {
    const padX = 16;
    const hasDetails = !!(item.avantages || item.obligations);
    const baseH = 56;
    const detailH = hasDetails ? 30 : 0;
    const { startX, width, top } = drawCardShell(doc, baseH + detailH);

    doc.font("Helvetica-Bold").fontSize(11.5).fillColor(COLORS.text)
        .text(tronquer(doc, item.titre || "Texte réglementaire", width - padX * 2 - 200),
            startX + padX, top + 12, { width: width - padX * 2 - 200 });

    let bx = startX + width - padX;
    const statusLabel = item.est_en_vigueur === false ? "Historique" : "En vigueur";
    const statusColor = item.est_en_vigueur === false ? COLORS.textMuted : COLORS.green;
    const statusBg = item.est_en_vigueur === false ? COLORS.surface : "#ecfdf5";
    const w0 = measureBadgeWidth(doc, statusLabel);
    bx -= w0;
    drawBadge(doc, statusLabel, { x: bx, y: top + 10, color: statusColor, bg: statusBg });

    if (item.type_texte) {
        const label = humanizeType(item.type_texte) + (item.annee ? ` · ${item.annee}` : "");
        const w1 = measureBadgeWidth(doc, label);
        bx -= (w1 + 6);
        drawBadge(doc, label, { x: bx, y: top + 10, color: COLORS.primary, bg: COLORS.primaryBg });
    }

    if (item.description) {
        doc.font("Helvetica").fontSize(9).fillColor(COLORS.textMuted)
            .text(item.description, startX + padX, top + 30, { width: width - padX * 2, height: 26, ellipsis: true });
    }

    if (hasDetails) {
        const halfW = (width - padX * 2 - 20) / 2;
        const dy = top + baseH;
        if (item.avantages) {
            doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.green)
                .text("AVANTAGES", startX + padX, dy, { width: halfW, lineBreak: false });
            doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.text)
                .text(item.avantages, startX + padX, dy + 11, { width: halfW, height: 20, ellipsis: true });
        }
        if (item.obligations) {
            doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.gold)
                .text("OBLIGATIONS", startX + padX + halfW + 20, dy, { width: halfW, lineBreak: false });
            doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.text)
                .text(item.obligations, startX + padX + halfW + 20, dy + 11, { width: halfW, height: 20, ellipsis: true });
        }
    }
}

function drawZoneCard(doc, zone) {
    const padX = 16;
    const isFranche = zone.type === "zone_franche";
    const { startX, width, top } = drawCardShell(doc, 68);

    if (isFranche) {
        doc.rect(startX, top, 4, 68).fill(COLORS.gold);
    }

    doc.font("Helvetica-Bold").fontSize(11.5).fillColor(COLORS.text)
        .text(tronquer(doc, zone.nom || "Zone", width - padX * 2 - 150),
            startX + padX, top + 12, { width: width - padX * 2 - 150 });

    let bx = startX + width - padX;
    if (zone.type) {
        const label = humanizeType(zone.type);
        const w1 = measureBadgeWidth(doc, label);
        bx -= w1;
        drawBadge(doc, label, { x: bx, y: top + 10, color: isFranche ? COLORS.gold : COLORS.primary, bg: isFranche ? COLORS.goldBg : COLORS.primaryBg });
    }

    const metaParts = [];
    if (zone.gouvernorat) metaParts.push(zone.gouvernorat);
    if (zone.superficie_km2) metaParts.push(`${formatNumber(zone.superficie_km2, 1)} km²`);
    if (metaParts.length) {
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textMuted)
            .text(metaParts.join("  ·  "), startX + padX, top + 30, { width: width - padX * 2, lineBreak: false });
    }

    const descParts = [zone.description, zone.avantages].filter(Boolean).join(" — ");
    if (descParts) {
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.text)
            .text(descParts, startX + padX, top + 45, { width: width - padX * 2, height: 18, ellipsis: true });
    }
}

function renderListSection(doc, items, drawCard, emptyMessage) {
    if (!items || items.length === 0) {
        emptyState(doc, emptyMessage);
        return;
    }
    items.forEach((item) => drawCard(doc, item));
}

function renderCadreSection(doc, cadres) {
    renderListSection(doc, cadres, drawCadreCard, "Aucun texte réglementaire renseigné pour ce secteur pour le moment.");
}

function renderZonesSection(doc, zones) {
    renderListSection(doc, zones, drawZoneCard, "Aucune zone géographique renseignée pour ce secteur pour le moment.");
    if (zones && zones.some((z) => z.type === "zone_franche")) {
        doc.moveDown(0.2);
        doc.x = doc.page.margins.left;
        doc.font("Helvetica").fontSize(8).fillColor(COLORS.gold)
            .text("▮ Zone franche — régime fiscal et douanier préférentiel pour les investisseurs éligibles.", doc.x, doc.y, { width: contentWidth(doc) });
        doc.moveDown(0.4);
    }
}

// ============================================================================
// 5 bis. COMPARATIF RÉGIONAL (CDC §4)
// ----------------------------------------------------------------------------
// Les seuls chiffres étrangers que le rapport ait le droit d'afficher : ils
// viennent de la table `benchmarks_regionaux`, saisie par l'administration.
// Aucune valeur n'est produite par le modèle de langage.
// ============================================================================

function renderBenchmarkTable(doc, benchmarks) {
    const renseignes = (benchmarks || []).filter(
        (b) => b.valeur_tunisie !== null || b.valeur_maroc !== null || b.valeur_egypte !== null
    );
    if (renseignes.length === 0) return;

    const startX = doc.page.margins.left;

    drawSubHeading(doc, "Comparatif chiffré Tunisie – Maroc – Égypte");
    drawTable(doc, {
        rows: renseignes,
        columns: [
            { label: "Indicateur", width: 0.40, render: (r) => r.indicateur },
            { label: "Unité", width: 0.16, render: (r) => r.unite || "-" },
            { label: "Tunisie", width: 0.148, align: "right", bold: true,
              render: (r) => (r.valeur_tunisie != null ? formatNumber(r.valeur_tunisie, 2) : "N/D") },
            { label: "Maroc", width: 0.146, align: "right",
              render: (r) => (r.valeur_maroc != null ? formatNumber(r.valeur_maroc, 2) : "N/D") },
            { label: "Égypte", width: 0.146, align: "right",
              render: (r) => (r.valeur_egypte != null ? formatNumber(r.valeur_egypte, 2) : "N/D") },
        ],
    });

    const sources = Array.from(new Set(renseignes.map((b) => b.source).filter(Boolean)));
    if (sources.length > 0) {
        doc.font("Helvetica").fontSize(7.8).fillColor(COLORS.textLight)
            .text(`Sources : ${sources.join(" · ")}`, startX, doc.y, { width: contentWidth(doc) });
        doc.moveDown(0.5);
        doc.x = startX;
    }
    doc.moveDown(0.2);
}

// ============================================================================
// 6. SOURCES ET MÉTHODOLOGIE
// ============================================================================

function renderSourcesSection(doc, report) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);

    drawSubHeading(doc, "Sources des données sectorielles");
    const sources = Array.from(
        new Set((report.donneesStatistiques || []).map((r) => r.source).filter(Boolean))
    );
    if (sources.length > 0) {
        sources.forEach((src) => renderBullet(doc, src));
    } else {
        doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.textMuted)
            .text("Institut National de la Statistique (INS) et administrations sectorielles tunisiennes.", startX, doc.y, { width });
        doc.moveDown(0.6);
        doc.x = startX;
    }

    doc.moveDown(0.4);
    drawSubHeading(doc, "Méthodologie");
    renderParagraph(doc,
        "Ce rapport repose sur deux composantes complémentaires. Les sections chiffrées "
        + "(chiffres clés, séries statistiques, cadre réglementaire, zones géographiques et "
        + "acteurs du secteur) proviennent des données officielles listées ci-dessus, "
        + "collectées et tenues à jour par l'équipe InvestPlatform. Les sections rédigées "
        + "(présentation, tendances, opportunités, risques, benchmarking régional, "
        + "recommandations et perspectives) sont produites à partir de ces mêmes données "
        + `chiffrées à l'aide d'un modèle de langage (${report.modeleIA || "Groq"}), puis `
        + "intégrées au document. Elles ne comportent aucune donnée chiffrée qui ne figure "
        + "pas dans les sections sourcées."
    );

    // ── Méthode de projection ────────────────────────────────────────────
    const avecProjection = (report.donneesStatistiques || []).filter(hasProjection);
    if (avecProjection.length > 0) {
        doc.moveDown(0.2);
        drawSubHeading(doc, "Calcul des estimations");

        const parMethode = avecProjection.reduce((acc, r) => {
            if (r.methode_projection) acc[r.methode_projection] = (acc[r.methode_projection] || 0) + 1;
            return acc;
        }, {});
        const r2 = avecProjection
            .map((r) => Number(r.fiabilite_r2))
            .filter((v) => !isNaN(v) && v > 0);
        const r2Moyen = r2.length ? r2.reduce((a, b) => a + b, 0) / r2.length : null;

        renderParagraph(doc,
            "Les statistiques officielles disponibles s'arrêtent, selon les indicateurs, entre 2023 "
            + "et 2024. Les valeurs postérieures présentées dans ce rapport sont des estimations "
            + `calculées sur ${avecProjection.length} indicateur(s) par prolongement de la tendance `
            + "observée. Deux modèles sont mis en concurrence pour chaque série — une régression "
            + "linéaire par moindres carrés et un taux de croissance annuel moyen — et celui dont "
            + "l'ajustement à l'historique est le meilleur est retenu. Une série dont aucun modèle "
            + "n'atteint un seuil minimal de qualité ne fait l'objet d'aucune estimation."
        );

        Object.entries(parMethode).forEach(([methode, nombre]) => {
            renderBullet(doc, `${LIBELLES_METHODE[methode] || methode} : ${nombre} indicateur(s)`);
        });
        if (r2Moyen !== null) {
            renderBullet(doc,
                `Qualité d'ajustement moyenne des modèles (R²) : ${r2Moyen.toFixed(2)} sur 1,00`);
        }

        doc.moveDown(0.15);
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted)
            .text("Une estimation n'est pas une prévision garantie : elle prolonge une tendance passée "
                + "et ne tient pas compte des ruptures de conjoncture, décisions politiques ou chocs "
                + "externes à venir.", startX, doc.y, { width, align: "justify", lineGap: 3.5 });
        doc.moveDown(0.6);
        doc.x = startX;
    }

    doc.moveDown(0.2);
    drawSubHeading(doc, "Avertissement");
    doc.font("Helvetica-Oblique").fontSize(9).fillColor(COLORS.textMuted)
        .text(
            "Les analyses et projections présentées dans ce document sont fournies à titre informatif "
            + "et ne constituent pas un conseil en investissement. InvestPlatform recommande de les "
            + "recouper avec des sources complémentaires et de consulter un conseiller financier ou "
            + "juridique avant toute décision d'investissement.",
            startX, doc.y, { width, align: "justify", lineGap: 4 }
        );
    doc.moveDown(0.5);
    doc.x = startX;

    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textLight)
        .text(`Données mises à jour le ${formatDateFR(report.secteur?.date_maj)} — Rapport généré le ${formatDateFR(new Date())}.`, startX, doc.y, { width });
    doc.x = startX;
}

// ============================================================================
// 7. PAGE DE COUVERTURE (page 1 de l'aperçu gratuit)
// ============================================================================

function buildCoverPage(doc, report, { isPreview = false } = {}) {
    const w = doc.page.width;
    const secteur = report.secteur || {};

    // Bandeau supérieur
    doc.rect(0, 0, w, 210).fill(COLORS.primaryDark);
    doc.rect(0, 190, w, 20).fill(COLORS.primary);

    doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.white)
        .text("InvestPlatform", PAGE_MARGIN, 50, { lineBreak: false });
    doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.primaryLight)
        .text("Tunisia Invest — Analyse sectorielle", PAGE_MARGIN, 70, { lineBreak: false });

    doc.font("Helvetica").fontSize(13).fillColor(COLORS.primaryLight)
        .text(isPreview ? "APERÇU GRATUIT" : "RAPPORT SECTORIEL", PAGE_MARGIN, 118, { characterSpacing: 2, lineBreak: false });
    doc.font("Helvetica-Bold").fontSize(30).fillColor(COLORS.white)
        .text(secteur.nom || "Secteur", PAGE_MARGIN, 140, { width: w - PAGE_MARGIN * 2 });

    // Corps
    doc.fillColor(COLORS.text);
    doc.y = 260;
    doc.x = PAGE_MARGIN;
    if (secteur.description) {
        doc.font("Helvetica").fontSize(11.5).fillColor(COLORS.textMuted)
            .text(secteur.description, PAGE_MARGIN, doc.y, { width: w - PAGE_MARGIN * 2, align: "center" });
    }

    // --- Chips (Pages / Mise à jour / Généré le) --------------------------
    // chipRowY est capturé UNE SEULE FOIS avant la boucle : sans cela, chaque
    // appel .text() à position explicite déplace doc.y, si bien que la 2e et
    // la 3e chip se dessinaient plus bas que la 1re (bug de désalignement).
    doc.y = 330;
    const chips = [
        ["Pages", String(secteur.nombre_pages || SECTION_CATALOG.length + 2)],
        ["Mise à jour", formatDateFR(secteur.date_maj)],
        ["Généré le", formatDateFR(new Date())],
    ];
    const chipW = (w - PAGE_MARGIN * 2 - 24) / 3;
    const chipRowY = doc.y;
    chips.forEach(([label, value], i) => {
        const cx = PAGE_MARGIN + i * (chipW + 12);
        doc.roundedRect(cx, chipRowY, chipW, 54, 6).fillAndStroke(COLORS.surface, COLORS.border);
        doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.textMuted)
            .text(label.toUpperCase(), cx, chipRowY + 11, { width: chipW, align: "center", lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(COLORS.primaryDark)
            .text(value, cx, chipRowY + 27, { width: chipW, align: "center", lineBreak: false });
    });
    doc.y = chipRowY + 54 + 36;
    doc.x = PAGE_MARGIN;

    // --- Aperçu du sommaire ----------------------------------------------
    // Remplit l'espace de façon utile (plutôt qu'un grand vide) en donnant
    // un avant-goût réel du contenu du rapport.
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.textMuted)
        .text("CE RAPPORT COUVRE", PAGE_MARGIN, doc.y, { characterSpacing: 1.2, lineBreak: false });
    doc.y += 22;

    const colGap = 30;
    const colW = (w - PAGE_MARGIN * 2 - colGap) / 2;
    const half = Math.ceil(SECTION_TITLES.length / 2);
    const listTop = doc.y;
    let leftY = listTop;
    let rightY = listTop;
    SECTION_TITLES.forEach((title, i) => {
        const col = i < half ? 0 : 1;
        const cx = PAGE_MARGIN + col * (colW + colGap);
        const cy = col === 0 ? leftY : rightY;
        doc.circle(cx + 2.5, cy + 5.5, 2).fill(COLORS.primaryLight);
        doc.font("Helvetica").fontSize(9.7).fillColor(COLORS.text)
            .text(tronquer(doc, title, colW - 15), cx + 13, cy, { width: colW - 13 });
        if (col === 0) leftY += 23; else rightY += 23;
    });
    doc.y = Math.max(leftY, rightY) + 14;
    doc.x = PAGE_MARGIN;

    const badgeText = "DONNÉES OFFICIELLES · ANALYSE SECTORIELLE";
    doc.font("Helvetica-Bold").fontSize(8.5);
    const bw = doc.widthOfString(badgeText) + 24;
    const bx = (w - bw) / 2;
    doc.roundedRect(bx, doc.y, bw, 20, 10).fill(COLORS.primaryBg);
    doc.fillColor(COLORS.primary).text(badgeText, bx, doc.y + 6, { width: bw, align: "center", lineBreak: false });

    // --- Pied de couverture ----------------------------------------------
    withoutBottomMargin(doc, () => {
        doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.textLight)
            .text("Sources officielles tunisiennes — INS, BCT, ONTT et administrations sectorielles.",
                PAGE_MARGIN, 762, { width: w - PAGE_MARGIN * 2, align: "center", lineBreak: false });
        doc.text("Document confidentiel — usage réservé au destinataire.", PAGE_MARGIN, 776, {
            width: w - PAGE_MARGIN * 2, align: "center", lineBreak: false,
        });
    });
}

// ============================================================================
// 8. SOMMAIRE (page 2 de l'aperçu gratuit)
//    Les numéros de page réels sont renseignés a posteriori, une fois toutes
//    les sections rendues.
// ============================================================================

function buildTOC(doc, { withPageNumbers = true } = {}) {
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    doc.x = startX;

    doc.font("Helvetica-Bold").fontSize(21).fillColor(COLORS.primary).text("Sommaire", startX, doc.y);
    doc.moveDown(0.4);
    doc.x = startX;
    doc.moveTo(startX, doc.y).lineTo(startX + width, doc.y).strokeColor(COLORS.border).lineWidth(1.25).stroke();
    doc.moveDown(1);
    doc.x = startX;

    const entries = [];
    const rowH = 34;

    SECTION_CATALOG.forEach((item, idx) => {
        ensureSpace(doc, rowH);
        const rowY = doc.y;
        const range = doc.bufferedPageRange();
        const pageIndex = range.start + range.count - 1;

        doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.textLight)
            .text(String(idx + 1).padStart(2, "0"), startX, rowY + 2, { width: 28, lineBreak: false });
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(COLORS.text)
            .text(item.title, startX + 32, rowY + 2, { width: width - 32 - 50, lineBreak: false });
        doc.font("Helvetica").fontSize(8).fillColor(item.badge.color)
            .text(item.badge.text.toUpperCase(), startX + 32, rowY + 17, { width: width - 32 - 50, lineBreak: false });

        const numW = 40;
        const numX = startX + width - numW;
        if (withPageNumbers) {
            entries.push({ pageIndex, y: rowY + 2, numX, numW, page: null });
        }

        doc.y = rowY + rowH;
        doc.x = startX;
        if (idx < SECTION_CATALOG.length - 1) {
            doc.moveTo(startX, doc.y - 8).lineTo(startX + width, doc.y - 8).strokeColor(COLORS.borderLight).lineWidth(0.75).stroke();
        }
    });

    return entries;
}

function fillTOCPageNumbers(doc, entries) {
    entries.forEach((entry) => {
        doc.switchToPage(entry.pageIndex);
        doc.font("Helvetica-Bold").fontSize(11.5).fillColor(COLORS.primary)
            .text(String(entry.page), entry.numX, entry.y, { width: entry.numW, align: "right", lineBreak: false });
    });
}

// ============================================================================
// 9. AIGUILLAGE DES SECTIONS
//    Une entrée du catalogue (sections.js) → la fonction de rendu correspondante.
//    Ajouter une section = ajouter une ligne au catalogue + une entrée ici.
// ============================================================================

const RENDERERS = {
    introduction: (doc, r) => renderNarrativeSection(doc, r.narratives?.introduction),
    chiffres: (doc, r) => renderChiffresClesSection(doc, r),
    tendances: (doc, r) => renderNarrativeSection(doc, r.narratives?.tendances),
    acteurs: (doc, r) => renderActeursSection(doc, r.acteursPrincipaux),
    cadre: (doc, r) => renderCadreSection(doc, r.cadreReglementaire),
    zones: (doc, r) => renderZonesSection(doc, r.zonesGeographiques),
    opportunites: (doc, r) => renderNarrativeSection(doc, r.narratives?.opportunites),
    risques: (doc, r) => renderNarrativeSection(doc, r.narratives?.risques),
    benchmarking: (doc, r) => {
        renderBenchmarkTable(doc, r.benchmarksRegionaux);
        renderNarrativeSection(doc, r.narratives?.benchmarking);
    },
    recommandations: (doc, r) => renderNarrativeSection(doc, r.narratives?.recommandations),
    perspectives: (doc, r) => renderNarrativeSection(doc, r.narratives?.perspectives),
    sources: (doc, r) => renderSourcesSection(doc, r),
};

// ============================================================================
// 10. ORCHESTRATION
// ============================================================================

function createDocument(title) {
    return new PDFDocument({
        size: "A4",
        margin: PAGE_MARGIN,
        bufferPages: true,
        info: {
            Title: title,
            Author: "InvestPlatform",
            Subject: "Rapport sectoriel InvestPlatform",
        },
    });
}

/**
 * Écrit le document et ne résout qu'une fois le fichier RÉELLEMENT fermé.
 * Sans cette attente, la route répondait pendant que le stream écrivait encore :
 * le client téléchargeait un PDF tronqué.
 */
function finalize(doc, filePath, filename) {
    return new Promise((resolve, reject) => {
        const stream = fs.createWriteStream(filePath);
        stream.on("finish", () => resolve({ filename, path: filePath, url: `/reports/${filename}` }));
        stream.on("error", reject);
        doc.pipe(stream);
        doc.end();
    });
}

function ensureReportsDir() {
    if (!fs.existsSync(config.reportsDir)) {
        fs.mkdirSync(config.reportsDir, { recursive: true });
    }
}

/**
 * Rapport complet — couverture + sommaire + 12 sections.
 * @param {object} report cf. CONTRAT D'ENTRÉE en tête de fichier
 * @returns {Promise<{filename: string, path: string, url: string}>}
 */
async function generateReportPDF(report) {
    ensureReportsDir();

    const secteur = report.secteur || {};
    const filename = `rapport_${slugify(secteur.slug || secteur.nom)}_${Date.now()}.pdf`;
    const filePath = path.join(config.reportsDir, filename);

    const doc = createDocument(`Rapport Sectoriel — ${secteur.nom || ""}`);

    let pageNum = 1;
    doc.on("pageAdded", () => {
        pageNum += 1;
        drawHeaderFooter(doc, secteur.nom || "", pageNum);
    });

    // ---- Page 1 : couverture --------------------------------------------
    buildCoverPage(doc, report);

    // ---- Page 2 : sommaire ----------------------------------------------
    doc.addPage();
    const tocEntries = buildTOC(doc);

    // ---- Pages 3+ : une section par page (le texte long déborde librement)
    SECTION_CATALOG.forEach((section, i) => {
        doc.addPage();
        tocEntries[i].page = pageNum;
        sectionHeader(doc, {
            index: i + 1,
            total: SECTION_CATALOG.length,
            title: section.title,
            badge: section.badge,
        });
        RENDERERS[section.key](doc, report);
    });

    // ---- Rétro-remplissage des numéros de page dans le sommaire ----------
    fillTOCPageNumbers(doc, tocEntries);
    doc.flushPages();

    return finalize(doc, filePath, filename);
}

/**
 * Aperçu gratuit (CDC §3) — littéralement les 2 premières pages du rapport :
 * la couverture et le sommaire, produits par les MÊMES fonctions que le
 * rapport payant. L'acheteur voit donc exactement ce qu'il achètera.
 * Une bande d'appel à l'action remplace les numéros de page.
 *
 * @returns {Promise<{filename: string, path: string, url: string}>}
 */
async function generatePreviewPDF(report) {
    ensureReportsDir();

    const secteur = report.secteur || {};
    const filename = `apercu_${slugify(secteur.slug || secteur.nom)}.pdf`;
    const filePath = path.join(config.reportsDir, filename);

    const doc = createDocument(`Aperçu gratuit — ${secteur.nom || ""}`);

    let pageNum = 1;
    doc.on("pageAdded", () => {
        pageNum += 1;
        drawHeaderFooter(doc, secteur.nom || "", pageNum);
    });

    buildCoverPage(doc, report, { isPreview: true });

    doc.addPage();
    buildTOC(doc, { withPageNumbers: false });

    // Bandeau d'appel à l'action en bas du sommaire
    const startX = doc.page.margins.left;
    const width = contentWidth(doc);
    ensureSpace(doc, 90);
    const top = doc.y + 10;
    doc.roundedRect(startX, top, width, 74, 8).fillAndStroke(COLORS.primaryBg, COLORS.primaryLight);
    doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.primaryDark)
        .text("Aperçu gratuit — 2 pages sur " + (secteur.nombre_pages || SECTION_CATALOG.length + 2),
            startX + 20, top + 16, { width: width - 40, lineBreak: false });
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.primary)
        .text(
            `Le rapport complet développe les ${SECTION_CATALOG.length} sections listées ci-dessus : `
            + "chiffres clés et graphiques, acteurs, cadre réglementaire, zones franches, "
            + "puis l'analyse rédigée (tendances, opportunités, risques, benchmarking régional, "
            + "recommandations et perspectives 2025-2028).",
            startX + 20, top + 38, { width: width - 40 }
        );

    return finalize(doc, filePath, filename);
}

module.exports = { generateReportPDF, generatePreviewPDF };
