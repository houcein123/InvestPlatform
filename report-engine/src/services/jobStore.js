// ============================================================================
// Suivi de progression des générations (CDC §6 étape 3 : « barre de
// progression 20-40 sec »).
// ----------------------------------------------------------------------------
// La génération dure trop longtemps pour tenir dans une requête HTTP
// confortable : la route démarre un job et répond immédiatement, l'appelant
// interroge ensuite la progression.
//
// Stockage en mémoire, volontairement : un job ne survit pas à un redémarrage
// du serveur, mais le PDF produit, lui, est bien persisté en base et sur disque.
// ============================================================================

const jobs = new Map();

/** Purge des jobs terminés au bout de 15 minutes, pour éviter la fuite mémoire. */
const TTL_MS = 15 * 60 * 1000;

function createJob(sectorId, achatId = null) {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    jobs.set(id, {
        id,
        sectorId,
        achatId,
        statut: "en_cours",
        etape: "Préparation des données sectorielles",
        progression: 0,
        pdfUrl: null,
        filename: null,
        erreur: null,
        creeLe: Date.now(),
    });
    return id;
}

/**
 * Génération déjà en cours pour cet achat ?
 *
 * GARDE-FOU INDISPENSABLE. Chaque section fait un appel au service de
 * rédaction ; lancer N fois le même rapport, c'est consommer N fois le quota
 * et n'en livrer aucun. Un défaut du frontend a déjà déclenché une centaine de
 * générations simultanées du même achat, saturant la limite par minute au
 * point qu'aucune section n'aboutissait.
 *
 * Le serveur ne doit pas dépendre de la correction du client pour s'en
 * protéger : à un achat payé correspond au plus une génération en vol.
 */
function jobEnCoursPourAchat(achatId) {
    if (achatId === null || achatId === undefined) return null;
    for (const job of jobs.values()) {
        if (job.statut === "en_cours" && Number(job.achatId) === Number(achatId)) {
            return job;
        }
    }
    return null;
}

function updateJob(id, patch) {
    const job = jobs.get(id);
    if (!job) return null;
    Object.assign(job, patch);
    if (patch.statut === "termine" || patch.statut === "erreur") {
        setTimeout(() => jobs.delete(id), TTL_MS).unref?.();
    }
    return job;
}

function getJob(id) {
    return jobs.get(id) || null;
}

/** Nombre de générations réellement en vol, pour la supervision. */
function compterEnCours() {
    let total = 0;
    for (const job of jobs.values()) {
        if (job.statut === "en_cours") total += 1;
    }
    return total;
}

module.exports = { createJob, updateJob, getJob, jobEnCoursPourAchat, compterEnCours };
