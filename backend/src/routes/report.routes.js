// ============================================================================
// Génération de rapport — /api/report (CDC §6, étape 3)
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
const { optionalAuth, requireAuth } = require("../middleware/auth");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

/** Lance la génération en tâche de fond et tient le job à jour. */
function runGenerationJob(jobId, sectorId, { achatId, utilisateurId }) {
    reportService
        .generateFullReport(sectorId, {
            achatId,
            utilisateurId,
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
            jobStore.updateJob(jobId, { statut: "erreur", erreur: "La génération du rapport a échoué" });
        });
}

/**
 * Démarre la génération. Un achat payé portant sur ce secteur est exigé :
 * la preuve du paiement est lue en base, jamais reçue du frontend.
 */
router.post("/generate", optionalAuth, asyncHandler(async (req, res) => {
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
    runGenerationJob(jobId, sectorId, {
        achatId: achat.id,
        utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
    });

    res.status(202).json({ success: true, jobId, message: "Génération démarrée", dureeEstimeeSec: 40 });
}));

/** Suivi de progression consommé par la barre du frontend. */
router.get("/status/:jobId", (req, res) => {
    const job = jobStore.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job inconnu ou expiré" });
    res.json({ job });
});

/** Espace client : les achats et leurs rapports (CDC §6, étape 4). */
router.get("/mes-rapports", requireAuth, asyncHandler(async (req, res) => {
    const achats = await salesService.listUserPurchases(req.compte.id);
    res.json({ achats });
}));

/**
 * Relance la génération d'un achat déjà payé dont le rapport manque.
 * Aucun nouveau paiement : le droit vient de l'achat, qui est vérifié en base.
 */
router.post("/relancer", requireAuth, asyncHandler(async (req, res) => {
    const { achatId } = req.body;
    if (!achatId) throw new HttpError(400, "achatId est obligatoire");

    const achat = await reportService.findAchatRegenerable(achatId, req.compte.id);
    if (!achat) throw new HttpError(404, "Achat introuvable ou non réglé");

    const jobId = jobStore.createJob(achat.id_secteur);
    runGenerationJob(jobId, achat.id_secteur, {
        achatId: achat.id,
        utilisateurId: req.compte.id,
    });

    res.status(202).json({ success: true, jobId, message: "Génération relancée" });
}));

module.exports = router;
