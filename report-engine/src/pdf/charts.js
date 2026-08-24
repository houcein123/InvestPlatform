// ============================================================================
// Graphiques vectoriels du rapport PDF.
// ----------------------------------------------------------------------------
// Tout est tracé avec les primitives de PDFKit : aucune librairie de charts,
// aucun rendu en image intermédiaire. Le PDF reste donc vectoriel — il
// s'imprime net à n'importe quelle échelle, et son poids ne dépend pas du
// nombre de graphiques.
//
// RÈGLE COMMUNE À TOUS LES TRACÉS : une valeur OBSERVÉE et une valeur ESTIMÉE
// ne se dessinent jamais de la même façon. Teinte pleine contre teinte claire,
// trait continu contre pointillé, et une légende qui le dit. Présenter une
// extrapolation comme une donnée publiée serait la faute la plus grave que
// puisse commettre ce document.
// ============================================================================

const { COLORS, formatNumber, tronquer } = require("./theme");

/** Palette des séries multiples, différenciée par la TEINTE et non la clarté. */
const PALETTE = [
    "#1d4ed8", // bleu
    "#0f766e", // sarcelle
    "#b45309", // ambre
    "#7c3aed", // violet
    "#be123c", // framboise
    "#4d7c0f", // olive
    "#0369a1", // azur
    "#a21caf", // magenta
];

function couleurSerie(index) {
    return PALETTE[index % PALETTE.length];
}

/** Valeurs exploitables d'une série, dans l'ordre. */
function valeursValides(valeurs) {
    return valeurs.filter((v) => v !== null && v !== undefined && !Number.isNaN(Number(v)));
}

/**
 * Échelle verticale d'un graphique.
 *
 * Le maximum est majoré de 15 % pour que la barre la plus haute ne touche pas
 * le bord supérieur : collée au cadre, elle donne l'impression d'être tronquée.
 */
function echelle(valeurs) {
    const nums = valeursValides(valeurs).map(Number);
    if (nums.length === 0) return { max: 1, min: 0 };
    const max = Math.max(...nums);
    const min = Math.min(0, ...nums);
    return { max: (max || 1) * 1.15, min };
}

/** Grille horizontale de fond, discrète. */
function grille(doc, { x, largeur, haut, bas, lignes = 3 }) {
    doc.strokeColor(COLORS.borderLight).lineWidth(0.5);
    for (let i = 0; i <= lignes; i++) {
        const gy = haut + ((bas - haut) * i) / lignes;
        doc.moveTo(x, gy).lineTo(x + largeur, gy).stroke();
    }
}

/** Titre et unité d'un graphique, sur une ligne. */
function entete(doc, { x, y, largeur, titre, unite }) {
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text)
        .text(tronquer(doc, titre, largeur - 80), x, y, { width: largeur - 80, lineBreak: false });
    if (unite) {
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textLight)
            .text(unite, x + largeur - 80, y + 1, { width: 80, align: "right", lineBreak: false });
    }
}

/** Message affiché à la place d'un graphique sans donnée. */
function sansDonnee(doc, { x, y, largeur, hauteur }) {
    doc.font("Helvetica-Oblique").fontSize(8.5).fillColor(COLORS.textLight)
        .text("Donnée non disponible", x, y + hauteur / 2 - 4,
            { width: largeur, align: "center", lineBreak: false });
}

// ── Courbe d'évolution ──────────────────────────────────────────────────────

/**
 * Courbe d'évolution, observé puis estimé.
 *
 * Complémentaire du diagramme en barres, pas redondante : les barres comparent
 * des années entre elles, la courbe montre la FORME de la trajectoire — une
 * accélération, un palier, un retournement se voient ici et pas là.
 *
 * Le segment estimé est en pointillé et dans une teinte claire ; une marque
 * verticale signale la dernière donnée publiée.
 */
function drawLineChart(doc, { x, y, largeur, hauteur, titre, unite, annees, valeurs, estProjection }) {
    entete(doc, { x, y, largeur, titre, unite });

    const haut = y + 20;
    const bas = y + hauteur - 16;
    const hauteurTrace = bas - haut;

    if (valeursValides(valeurs).length < 2) {
        sansDonnee(doc, { x, y: haut, largeur, hauteur: hauteurTrace });
        return;
    }

    grille(doc, { x, largeur, haut, bas });

    const { max } = echelle(valeurs);
    const pas = valeurs.length > 1 ? largeur / (valeurs.length - 1) : largeur;
    const pointX = (i) => x + i * pas;
    const pointY = (v) => bas - (Number(v) / max) * hauteurTrace;

    // Deux passes : le tracé observé, puis le tracé estimé. Les dessiner d'un
    // seul trait empêcherait de changer de style en cours de route.
    const segments = [];
    let courant = null;
    valeurs.forEach((v, i) => {
        if (v === null || v === undefined || Number.isNaN(Number(v))) {
            courant = null;
            return;
        }
        const projete = Boolean(estProjection && estProjection[i]);
        if (!courant || courant.projete !== projete) {
            // Le segment estimé démarre au dernier point observé : sans ce
            // raccord, la courbe présente une rupture qui n'existe pas.
            const depart = courant ? [courant.points[courant.points.length - 1]] : [];
            courant = { projete, points: [...depart] };
            segments.push(courant);
        }
        courant.points.push({ x: pointX(i), y: pointY(v), v });
    });

    segments.forEach((segment) => {
        if (segment.points.length < 2) return;
        doc.save();
        doc.strokeColor(segment.projete ? COLORS.primaryLight : COLORS.primary)
            .lineWidth(segment.projete ? 1.4 : 1.9);
        if (segment.projete) doc.dash(3, { space: 2.5 });

        segment.points.forEach((point, i) => {
            if (i === 0) doc.moveTo(point.x, point.y);
            else doc.lineTo(point.x, point.y);
        });
        doc.stroke();
        doc.undash();
        doc.restore();
    });

    // Points, puis valeur de fin — la seule que le lecteur cherche vraiment.
    segments.forEach((segment) => {
        segment.points.forEach((point) => {
            doc.circle(point.x, point.y, segment.projete ? 1.6 : 2.1)
                .fill(segment.projete ? COLORS.primaryLight : COLORS.primary);
        });
    });

    const dernier = valeurs.length - 1;
    const valeurFin = valeurs[dernier];
    if (valeurFin !== null && valeurFin !== undefined && !Number.isNaN(Number(valeurFin))) {
        doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.primaryDark)
            .text(formatNumber(valeurFin), pointX(dernier) - 26, pointY(valeurFin) - 11,
                { width: 52, align: "center", lineBreak: false });
    }

    doc.strokeColor(COLORS.textLight).lineWidth(0.75)
        .moveTo(x, bas).lineTo(x + largeur, bas).stroke();

    annees.forEach((annee, i) => {
        doc.font("Helvetica").fontSize(6).fillColor(COLORS.textLight)
            .text(String(annee).slice(2), pointX(i) - 8, bas + 4,
                { width: 16, align: "center", lineBreak: false });
    });
}

// ── Anneau de répartition ───────────────────────────────────────────────────

/**
 * Répartition en anneau.
 *
 * L'anneau plutôt que le camembert plein : le centre accueille le total, qui
 * répond à la première question que pose toute répartition — « sur combien ? ».
 *
 * Les parts nulles sont écartées : une tranche d'épaisseur zéro produit une
 * entrée de légende que rien ne permet de relier au dessin.
 */
function drawDonutChart(doc, { x, y, largeur, hauteur, titre, parts, total, uniteTotal }) {
    entete(doc, { x, y, largeur, titre });

    const utiles = parts.filter((part) => Number(part.valeur) > 0);
    const haut = y + 20;
    const hauteurTrace = hauteur - 26;

    if (utiles.length === 0) {
        sansDonnee(doc, { x, y: haut, largeur, hauteur: hauteurTrace });
        return;
    }

    const somme = utiles.reduce((cumul, part) => cumul + Number(part.valeur), 0);
    const rayon = Math.min(hauteurTrace / 2 - 2, 42);
    const centreX = x + rayon + 6;
    const centreY = haut + hauteurTrace / 2;
    const epaisseur = rayon * 0.38;

    let angle = -Math.PI / 2;
    utiles.forEach((part, index) => {
        const portion = (Number(part.valeur) / somme) * Math.PI * 2;
        const fin = angle + portion;

        // Une tranche d'anneau = arc extérieur, puis arc intérieur en sens
        // inverse. PDFKit n'a pas de primitive d'arc : on la compose.
        doc.save();
        doc.moveTo(centreX + Math.cos(angle) * rayon, centreY + Math.sin(angle) * rayon);
        const pas = Math.max(2, Math.ceil(portion / 0.12));
        for (let i = 1; i <= pas; i++) {
            const a = angle + (portion * i) / pas;
            doc.lineTo(centreX + Math.cos(a) * rayon, centreY + Math.sin(a) * rayon);
        }
        for (let i = pas; i >= 0; i--) {
            const a = angle + (portion * i) / pas;
            doc.lineTo(
                centreX + Math.cos(a) * (rayon - epaisseur),
                centreY + Math.sin(a) * (rayon - epaisseur),
            );
        }
        doc.closePath().fill(couleurSerie(index));
        doc.restore();

        angle = fin;
    });

    if (total !== undefined && total !== null) {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text)
            .text(formatNumber(total), centreX - rayon, centreY - 8,
                { width: rayon * 2, align: "center", lineBreak: false });
        if (uniteTotal) {
            doc.font("Helvetica").fontSize(6).fillColor(COLORS.textLight)
                .text(uniteTotal, centreX - rayon, centreY + 4,
                    { width: rayon * 2, align: "center", lineBreak: false });
        }
    }

    // Légende à droite de l'anneau, une entrée par ligne.
    const legendeX = centreX + rayon + 14;
    const legendeLargeur = x + largeur - legendeX;
    let legendeY = haut + 4;

    utiles.slice(0, 6).forEach((part, index) => {
        const pourcentage = Math.round((Number(part.valeur) / somme) * 100);
        doc.roundedRect(legendeX, legendeY + 1.5, 6, 6, 1.5).fill(couleurSerie(index));
        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textMuted)
            .text(
                tronquer(doc, `${part.nom} · ${pourcentage} %`, legendeLargeur - 12),
                legendeX + 10, legendeY,
                { width: legendeLargeur - 12, lineBreak: false },
            );
        legendeY += 13;
    });
}

// ── Barres horizontales (classement) ────────────────────────────────────────

/**
 * Classement en barres horizontales.
 *
 * Horizontales et non verticales parce que les libellés sont des noms propres,
 * de longueur très inégale : en vertical, ils s'inclinent ou se tronquent.
 */
function drawHorizontalBars(doc, { x, y, largeur, hauteur, titre, unite, entrees }) {
    entete(doc, { x, y, largeur, titre, unite });

    const haut = y + 20;
    const utiles = entrees.filter((e) => Number(e.valeur) > 0).slice(0, 6);

    if (utiles.length === 0) {
        sansDonnee(doc, { x, y: haut, largeur, hauteur: hauteur - 26 });
        return;
    }

    const max = Math.max(...utiles.map((e) => Number(e.valeur))) || 1;
    const largeurLibelle = Math.min(120, largeur * 0.42);
    const largeurBarre = largeur - largeurLibelle - 46;
    const pasVertical = Math.min(20, (hauteur - 26) / utiles.length);

    utiles.forEach((entree, index) => {
        const ligneY = haut + index * pasVertical;
        const proportion = Number(entree.valeur) / max;

        doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.textMuted)
            .text(tronquer(doc, entree.nom, largeurLibelle - 6), x, ligneY + 2,
                { width: largeurLibelle - 6, lineBreak: false });

        doc.roundedRect(x + largeurLibelle, ligneY + 1.5, largeurBarre, 8, 2)
            .fill(COLORS.borderLight);
        doc.roundedRect(x + largeurLibelle, ligneY + 1.5, Math.max(largeurBarre * proportion, 1.5), 8, 2)
            .fill(couleurSerie(index));

        doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.text)
            .text(formatNumber(entree.valeur), x + largeurLibelle + largeurBarre + 4, ligneY + 2,
                { width: 42, align: "right", lineBreak: false });
    });
}

// ── Comparatif régional ─────────────────────────────────────────────────────

/**
 * Comparatif Tunisie / Maroc / Égypte, en barres groupées.
 *
 * Un pays sans valeur renseignée est laissé VIDE, avec la mention « n. d. » :
 * combler le trou par une estimation reviendrait exactement à l'erreur que la
 * table `benchmarks_regionaux` a été créée pour éviter.
 */
function drawComparisonBars(doc, { x, y, largeur, hauteur, titre, unite, pays, valeurs }) {
    entete(doc, { x, y, largeur, titre, unite });

    const haut = y + 20;
    const bas = y + hauteur - 16;
    const hauteurTrace = bas - haut;

    if (valeursValides(valeurs).length === 0) {
        sansDonnee(doc, { x, y: haut, largeur, hauteur: hauteurTrace });
        return;
    }

    grille(doc, { x, largeur, haut, bas, lignes: 2 });
    const { max } = echelle(valeurs);

    const n = pays.length;
    const espace = 14;
    const largeurBarre = Math.min(46, (largeur - espace * (n - 1)) / n);
    const departX = x + (largeur - (largeurBarre * n + espace * (n - 1))) / 2;

    pays.forEach((nomPays, i) => {
        const barreX = departX + i * (largeurBarre + espace);
        const valeur = valeurs[i];

        if (valeur === null || valeur === undefined || Number.isNaN(Number(valeur))) {
            doc.font("Helvetica-Oblique").fontSize(7).fillColor(COLORS.textLight)
                .text("n. d.", barreX, bas - 12, { width: largeurBarre, align: "center", lineBreak: false });
        } else {
            const h = Math.max((Number(valeur) / max) * hauteurTrace, 2);
            doc.roundedRect(barreX, bas - h, largeurBarre, h, 2).fill(couleurSerie(i));
            doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.text)
                .text(formatNumber(valeur), barreX - 8, bas - h - 10,
                    { width: largeurBarre + 16, align: "center", lineBreak: false });
        }

        doc.font("Helvetica").fontSize(7).fillColor(COLORS.textMuted)
            .text(nomPays, barreX - 8, bas + 4,
                { width: largeurBarre + 16, align: "center", lineBreak: false });
    });

    doc.strokeColor(COLORS.textLight).lineWidth(0.75)
        .moveTo(x, bas).lineTo(x + largeur, bas).stroke();
}

module.exports = {
    PALETTE,
    couleurSerie,
    drawLineChart,
    drawDonutChart,
    drawHorizontalBars,
    drawComparisonBars,
};
