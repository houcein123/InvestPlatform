// ============================================================================
// Génération de rapport (CDC §6 étape 3) — /api/report
// ----------------------------------------------------------------------------
// La génération prend 20 à 40 secondes : la route ne bloque pas la requête,
// elle démarre un job et renvoie un identifiant que le frontend interroge
// pour alimenter sa barre de progression.
// ============================================================================

const express = require("express");

const reportService = require("../services/reportService");
const salesService = require("../services/salesService");
const sectorRepository = require("../services/sectorRepository");
const jobStore = require("../services/jobStore");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

/**
 * Lance la génération en tâche de fond et tient le job à jour.
 * Rien n'est renvoyé : le suivi passe par GET /status/:jobId.
 */
function runGenerationJob(jobId, sectorId, achatId) {
    reportService
        .generateFullReport(sectorId, {
            achatId,
            onProgress: (progression, etape) => jobStore.updateJob(jobId, { progression, etape }),
        })
        .then((result) => {
            if (!result) {
                jobStore.updateJob(jobId, { statut: "erreur", erreur: "Secteur introuvable" });
                return;
            }
            jobStore.updateJob(jobId, {
                statut: "termine",
                progression: 100,
                etape: "Rapport prêt",
                pdfUrl: result.pdf.url,
                filename: result.pdf.filename,
                sectionsManquantes: result.sectionsManquantes,
            });
        })
        .catch((err) => {
            console.error("❌ Échec de génération :", err);
            jobStore.updateJob(jobId, {
                statut: "erreur",
                erreur: "La génération du rapport a échoué",
            });
        });
}

/**
 * Démarre la génération. `achatId` est exigé : on ne génère un rapport payant
 * qu'après un paiement capturé (CDC §6).
 */
router.post("/generate", asyncHandler(async (req, res) => {
    const { sectorId, achatId } = req.body;
    if (!sectorId) throw new HttpError(400, "sectorId est obligatoire");

    const secteur = await sectorRepository.findSectorById(sectorId);
    if (!secteur) throw new HttpError(404, "Secteur introuvable");

    const achat = await salesService.findAchat(achatId);
    if (!achat || achat.statut_paiement !== "paye") {
        throw new HttpError(402, "Aucun paiement confirmé pour ce rapport");
    }
    if (Number(achat.id_secteur) !== Number(sectorId)) {
        throw new HttpError(400, "Le paiement ne correspond pas à ce secteur");
    }

    const jobId = jobStore.createJob(sectorId);
    runGenerationJob(jobId, sectorId, achat.id);

    res.status(202).json({
        success: true,
        jobId,
        message: "Génération démarrée",
        dureeEstimeeSec: 40,
    });
}));

/** Suivi de progression consommé par la barre du frontend. */
router.get("/status/:jobId", (req, res) => {
    const job = jobStore.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job inconnu ou expiré" });
    res.json({ job });
});

module.exports = router;
