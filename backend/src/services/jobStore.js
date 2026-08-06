// ============================================================================
// Suivi de progression des générations (CDC §6 étape 3 : « barre de
// progression 20-40 sec »).
// ----------------------------------------------------------------------------
// La génération dure trop longtemps pour tenir dans une requête HTTP confortable :
// la route de génération démarre un job et répond immédiatement, le frontend
// interroge ensuite /api/report/status/:jobId.
//
// Stockage en mémoire, volontairement : un job ne survit pas à un redémarrage
// du serveur, mais le PDF produit, lui, est bien persisté en base et sur disque.
// ============================================================================

const jobs = new Map();

/** Purge des jobs terminés au bout de 15 minutes, pour éviter la fuite mémoire. */
const TTL_MS = 15 * 60 * 1000;

function createJob(sectorId) {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    jobs.set(id, {
        id,
        sectorId,
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

module.exports = { createJob, updateJob, getJob };
