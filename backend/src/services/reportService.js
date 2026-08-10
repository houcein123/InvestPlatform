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

const fs = require("fs");
const path = require("path");

const { pool } = require("../config/db");
const { config } = require("../config/env");
const { slugify } = require("../pdf/theme");
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
 * @param {object} data résultat de getSectorData()
 * @param {{onSection?: function, onAttente?: function}} rappels
 *        onSection(clé, faites, total) — avancement section par section
 *        onAttente(libellé)            — message passager (reprise après quota)
 */
async function generateNarratives(data, { onSection, onAttente } = {}) {
    const contexte = buildDataContext(data);
    const narratives = {};

    for (let i = 0; i < SECTION_KEYS.length; i++) {
        const key = SECTION_KEYS[i];
        // Le 3e argument ne sert qu'au benchmarking ; les autres prompts
        // l'ignorent, ce qui évite une branche conditionnelle ici.
        const prompt = prompts[key](data.secteur, contexte, data.benchmarksRegionaux);
        const started = Date.now();

        try {
            narratives[key] = await groqService.generateText(prompt, {
                // Une attente de plusieurs secondes doit se voir : sans cela la
                // barre de progression semble bloquée et l'utilisateur ferme
                // l'onglet en croyant à une panne.
                onRetry: (tentative, attenteMs) => {
                    if (onAttente) {
                        onAttente(
                            `Service de rédaction saturé — nouvelle tentative dans ${Math.round(attenteMs / 1000)} s`
                        );
                    }
                },
            });
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

        if (onSection) onSection(key, i + 1, SECTION_KEYS.length);
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
    let avancement = 0;
    const narratives = await generateNarratives(data, {
        onSection: (key, done, total) => {
            avancement = Math.round((done / total) * 90);
            if (onProgress) {
                const suivante = SECTION_KEYS[done];
                onProgress(avancement, suivante ? SECTION_LABELS[suivante] : "Assemblage du document");
            }
        },
        // Le pourcentage ne bouge pas pendant une attente : seul le libellé
        // change, ce qui montre que le service travaille toujours.
        onAttente: (libelle) => onProgress && onProgress(avancement, libelle),
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
 * Aperçu gratuit — 2 pages, sans appel au modèle (couverture et sommaire ne
 * dépendent que des données en base : l'aperçu reste donc instantané et
 * gratuit même si le quota de rédaction est épuisé).
 *
 * Le fichier est REUTILISÉ tant que le secteur n'a pas changé. L'aperçu est le
 * point le plus cliqué du catalogue et son contenu ne dépend que de
 * `secteurs.date_maj` : le régénérer à chaque visite ne faisait qu'écrire
 * inutilement sur le disque à chaque passage d'un visiteur.
 */
async function generatePreview(sectorId) {
    const secteur = await sectorRepository.findSectorById(sectorId);
    if (!secteur) return null;

    const nomFichier = `apercu_${slugify(secteur.slug || secteur.nom)}.pdf`;
    const chemin = path.join(config.reportsDir, nomFichier);

    try {
        const fichier = fs.statSync(chemin);
        const majSecteur = secteur.date_maj ? new Date(secteur.date_maj).getTime() : 0;
        if (fichier.mtimeMs > majSecteur) {
            return { filename: nomFichier, path: chemin, url: `/reports/${nomFichier}` };
        }
    } catch {
        // Absent ou illisible : on le produit ci-dessous.
    }

    const data = await sectorRepository.getSectorData(sectorId);
    if (!data) return null;
    return generatePreviewPDF(data);
}

/**
 * Un rapport payé dont la génération n'a pas abouti doit pouvoir être relancé
 * SANS nouveau paiement : le serveur peut redémarrer en pleine génération, et
 * le suivi de job ne survit pas à un redémarrage. Sans cette reprise, le client
 * se retrouvait avec un achat payé et aucun moyen d'obtenir son document.
 *
 * @returns {Promise<{achat: object}|null>} l'achat éligible, ou null
 */
async function findAchatRegenerable(achatId, utilisateurId) {
    const { rows } = await pool.query(
        `SELECT a.*, (
                SELECT COUNT(*)::int FROM rapports r
                 WHERE r.secteur_id = a.id_secteur
                   AND r.utilisateur_id IS NOT DISTINCT FROM a.id_utilisateur
                   AND r.chemin_fichier IS NOT NULL
            ) AS rapports_produits
           FROM achats a
          WHERE a.id = $1
            AND a.statut_paiement = 'paye'
            AND a.id_utilisateur IS NOT DISTINCT FROM $2`,
        [achatId, utilisateurId]
    );
    return rows[0] || null;
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
    findAchatRegenerable,
    SECTION_KEYS,
};
