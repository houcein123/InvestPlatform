// ============================================================================
// Orchestration de la génération d'un rapport (CDC §6, étape 3).
// ----------------------------------------------------------------------------
//   données base (sectorRepository)
//        ↓
//   contexte chiffré (promptService.buildDataContext)
//        ↓
//   7 appels Groq séquentiels (groqService)
//        ↓
//   assemblage PDF (pdf/reportPdf)
//        ↓
//   persistance (table rapports + logs_generation)
// ============================================================================

const { pool } = require("../config/db");
const sectorRepository = require("./sectorRepository");
const groqService = require("./groqService");
const { prompts, buildDataContext, SECTION_KEYS } = require("./promptService");
const { generateReportPDF, generatePreviewPDF } = require("../pdf/reportPdf");

/**
 * Pause entre deux appels Groq. L'API applique une limite de requêtes par
 * minute ; enchaîner les 7 sections sans délai déclenche des erreurs 429.
 */
const DELAY_BETWEEN_CALLS_MS = 1500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function logGeneration({ secteurId, rapportId = null, prompt, reponse, dureeMs, statut, erreur = null }) {
    try {
        await pool.query(
            `INSERT INTO logs_generation
                (rapport_id, secteur_id, prompt_envoye, reponse_ia, duree_ms, modele_ia, statut, message_erreur)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [rapportId, secteurId, prompt, reponse, dureeMs, groqService.model, statut, erreur]
        );
    } catch (err) {
        // Une trace non écrite ne doit jamais faire échouer une génération payée.
        console.error("⚠️  Écriture du log de génération impossible :", err.message);
    }
}

/**
 * Produit les 7 sections narratives.
 * @param {object} data       résultat de getSectorData()
 * @param {function} onProgress rappel (clé, index, total) pour le suivi
 */
async function generateNarratives(data, onProgress) {
    const contexte = buildDataContext(data);
    const narratives = {};

    for (let i = 0; i < SECTION_KEYS.length; i++) {
        const key = SECTION_KEYS[i];
        const prompt = prompts[key](data.secteur, contexte);
        const started = Date.now();

        try {
            narratives[key] = await groqService.generateText(prompt);
            await logGeneration({
                secteurId: data.secteur.id,
                prompt,
                reponse: narratives[key],
                dureeMs: Date.now() - started,
                statut: "succes",
            });
        } catch (err) {
            // Une section manquante laisse le rapport exploitable : le PDF
            // affiche un encart explicite plutôt que d'échouer entièrement.
            narratives[key] = null;
            console.error(`⚠️  Section IA « ${key} » indisponible :`, err.message);
            await logGeneration({
                secteurId: data.secteur.id,
                prompt,
                reponse: null,
                dureeMs: Date.now() - started,
                statut: "erreur",
                erreur: err.message,
            });
        }

        if (onProgress) onProgress(key, i + 1, SECTION_KEYS.length);
        if (i < SECTION_KEYS.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    return narratives;
}

/** Libellés d'étape affichés dans la barre de progression du frontend. */
const SECTION_LABELS = {
    introduction: "Rédaction de la présentation générale",
    tendances: "Analyse des tendances",
    opportunites: "Identification des opportunités",
    risques: "Analyse des risques",
    benchmarking: "Benchmarking régional",
    recommandations: "Recommandations investisseur",
    perspectives: "Projections 2025-2028",
};

/**
 * Génère le rapport complet d'un secteur et l'enregistre.
 * @param {number} sectorId
 * @param {{achatId?: number, utilisateurId?: number, onProgress?: function}} options
 *        onProgress(progression 0-100, libellé d'étape)
 * @returns {Promise<{pdf: object, rapportId: number|null, sectionsManquantes: string[]}>}
 */
async function generateFullReport(sectorId, { achatId = null, utilisateurId = null, onProgress = null } = {}) {
    const data = await sectorRepository.getSectorData(sectorId);
    if (!data) return null;

    console.log(`📊 Génération du rapport « ${data.secteur.nom} »…`);
    console.log(
        `📦 Données : ${data.chiffresCles ? "chiffres clés OK" : "chiffres clés absents"}, `
        + `${data.donneesStatistiques.length} séries, ${data.zonesGeographiques.length} zones, `
        + `${data.acteursPrincipaux.length} acteurs, ${data.cadreReglementaire.length} textes`
    );

    // 90 % de la barre couvre les appels IA (de loin l'étape la plus longue),
    // les 10 % restants l'assemblage du PDF.
    const narratives = await generateNarratives(data, (key, done, total) => {
        if (onProgress) {
            const suivante = SECTION_KEYS[done];
            onProgress(
                Math.round((done / total) * 90),
                suivante ? SECTION_LABELS[suivante] : "Assemblage du document"
            );
        }
    });
    const sectionsManquantes = SECTION_KEYS.filter((k) => !narratives[k]);

    if (onProgress) onProgress(92, "Assemblage du document PDF");
    const pdf = await generateReportPDF({ ...data, narratives, modeleIA: groqService.model });
    console.log(`✅ PDF généré : ${pdf.filename}`);

    const rapportId = await persistRapport({
        utilisateurId,
        achatId,
        secteur: data.secteur,
        pdf,
        narratives,
    });

    return { pdf, rapportId, sectionsManquantes };
}

/** Enregistre le rapport produit ; ne bloque jamais la livraison du PDF. */
async function persistRapport({ utilisateurId, achatId, secteur, pdf, narratives }) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO rapports
                (utilisateur_id, secteur_id, titre, chemin_fichier, nombre_pages, statut, contenu_ia, date_generation)
             VALUES ($1,$2,$3,$4,$5,'genere',$6, CURRENT_TIMESTAMP)
             RETURNING id`,
            [
                utilisateurId,
                secteur.id,
                `Rapport Sectoriel — ${secteur.nom}`,
                pdf.url,
                secteur.nombre_pages,
                JSON.stringify(narratives),
            ]
        );
        const rapportId = rows[0].id;

        if (achatId) {
            await pool.query("UPDATE achats SET pdf_genere = $1 WHERE id = $2", [pdf.url, achatId]);
        }
        return rapportId;
    } catch (err) {
        console.error("⚠️  Enregistrement du rapport impossible :", err.message);
        return null;
    }
}

/**
 * Aperçu gratuit — 2 pages, sans appel IA (le sommaire et la couverture ne
 * dépendent que des données en base : l'aperçu reste donc instantané et
 * gratuit même si le quota Groq est épuisé).
 */
async function generatePreview(sectorId) {
    const data = await sectorRepository.getSectorData(sectorId);
    if (!data) return null;
    return generatePreviewPDF(data);
}

/** Liste des rapports produits, pour l'écran d'édition du panneau admin. */
async function listReports(limit = 50) {
    const { rows } = await pool.query(
        `SELECT r.id, r.titre, r.chemin_fichier, r.statut, r.date_generation,
                s.nom AS secteur, s.id AS secteur_id
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
       ORDER BY r.date_generation DESC NULLS LAST
          LIMIT $1`,
        [limit]
    );
    return rows;
}

/** Un rapport et le texte de ses sections rédigées. */
async function getReport(rapportId) {
    const { rows } = await pool.query(
        `SELECT r.*, s.nom AS secteur_nom
           FROM rapports r
           JOIN secteurs s ON s.id = r.secteur_id
          WHERE r.id = $1`,
        [rapportId]
    );
    if (rows.length === 0) return null;

    const rapport = rows[0];
    return {
        id: rapport.id,
        secteurId: rapport.secteur_id,
        secteur: rapport.secteur_nom,
        titre: rapport.titre,
        cheminFichier: rapport.chemin_fichier,
        dateGeneration: rapport.date_generation,
        // `contenu_ia` est stocké en JSONB : selon le pilote, il revient déjà
        // désérialisé ou sous forme de chaîne.
        narratives: typeof rapport.contenu_ia === "string"
            ? JSON.parse(rapport.contenu_ia)
            : (rapport.contenu_ia || {}),
        sections: SECTION_KEYS,
    };
}

/**
 * Réécrit le PDF d'un rapport à partir de textes corrigés à la main.
 *
 * Aucun appel au modèle : c'est précisément l'intérêt de cette fonction, un
 * relecteur peut amender la rédaction sans risquer qu'une régénération
 * remplace ses corrections. Les données chiffrées, elles, sont relues en base
 * afin que le document reparte des valeurs à jour.
 */
async function updateReportNarratives(rapportId, narrativesModifiees) {
    const rapport = await getReport(rapportId);
    if (!rapport) return null;

    const data = await sectorRepository.getSectorData(rapport.secteurId);
    if (!data) return null;

    // Seules les clés connues sont retenues, et un texte vide efface la section.
    const narratives = { ...rapport.narratives };
    for (const cle of SECTION_KEYS) {
        if (Object.prototype.hasOwnProperty.call(narrativesModifiees, cle)) {
            const valeur = narrativesModifiees[cle];
            narratives[cle] = valeur && String(valeur).trim() ? String(valeur) : null;
        }
    }

    const pdf = await generateReportPDF({ ...data, narratives, modeleIA: groqService.model });

    await pool.query(
        `UPDATE rapports
            SET contenu_ia = $1, chemin_fichier = $2, date_generation = CURRENT_TIMESTAMP
          WHERE id = $3`,
        [JSON.stringify(narratives), pdf.url, rapportId]
    );

    return { pdf, rapportId, narratives };
}

module.exports = {
    generateFullReport,
    generatePreview,
    generateNarratives,
    listReports,
    getReport,
    updateReportNarratives,
    SECTION_KEYS,
};
