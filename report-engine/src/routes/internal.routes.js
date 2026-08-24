// ============================================================================
// API interne du moteur de rapports.
// ----------------------------------------------------------------------------
// Ce service ne s'adresse PAS aux navigateurs. Il ne connaît ni les comptes,
// ni les achats, ni les paiements : le backend Spring Boot vérifie qu'un achat
// payé couvre le secteur demandé, puis lui commande la fabrication du PDF.
//
// Conséquence à ne pas perdre de vue : toute route ajoutée ici est une route
// de confiance. Le contrôle du droit d'accès se fait en amont, jamais ici.
// ============================================================================

const express = require("express");

const reportService = require("../services/reportService");
const projectionService = require("../services/projectionService");
const groqService = require("../services/groqService");
const jobStore = require("../services/jobStore");
const { config } = require("../config/env");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

/** Lance la génération en tâche de fond et tient le job à jour. */
function lancerGeneration(jobId, sectorId, { achatId, utilisateurId }) {
    reportService
        .generateFullReport(sectorId, {
            achatId,
            utilisateurId,
            onProgress: (progression, etape) => jobStore.updateJob(jobId, { progression, etape }),
        })
        .then((resultat) => {
            if (!resultat) {
                jobStore.updateJob(jobId, { statut: "erreur", erreur: "Secteur introuvable" });
                return;
            }
            jobStore.updateJob(jobId, {
                statut: "termine",
                progression: 100,
                etape: "Rapport prêt",
                pdfUrl: resultat.pdf.url,
                filename: resultat.pdf.filename,
                nombrePages: resultat.pdf.nombrePages,
                sectionsManquantes: resultat.sectionsManquantes,
            });
        })
        .catch((err) => {
            console.error("❌ Échec de génération :", err);
            jobStore.updateJob(jobId, { statut: "erreur", erreur: "La génération du rapport a échoué" });
        });
}

router.get("/health", (req, res) => {
    res.json({
        joignable: true,
        service: "Tunisia Invest — moteur de rapports",
        redaction: {
            configure: groqService.isConfigured,
            modele: groqService.model,
        },
        generationsEnCours: jobStore.compterEnCours(),
    });
});

/**
 * Démarre une génération. Le droit a déjà été vérifié par le backend : ce
 * service ne relit pas l'achat, il fabrique.
 */
router.post("/report/generate", asyncHandler(async (req, res) => {
    const { sectorId, achatId, utilisateurId } = req.body;
    if (!sectorId) throw new HttpError(400, "sectorId est obligatoire");

    // Un achat déjà en cours de génération ne relance rien : on renvoie le job
    // existant. Chaque section consomme du quota de rédaction ; lancer dix fois
    // le même rapport, c'est dépenser dix fois et n'en livrer aucun.
    const dejaEnCours = jobStore.jobEnCoursPourAchat(achatId);
    if (dejaEnCours) {
        console.warn(
            `↩️  Génération déjà en cours pour l'achat ${achatId} (job ${dejaEnCours.id}) — demande ignorée.`
        );
        return res.status(202).json({
            success: true,
            jobId: dejaEnCours.id,
            dejaEnCours: true,
            dureeEstimeeSec: 40,
        });
    }

    const jobId = jobStore.createJob(sectorId, achatId ?? null);
    lancerGeneration(jobId, sectorId, { achatId: achatId ?? null, utilisateurId: utilisateurId ?? null });

    res.status(202).json({ success: true, jobId, dureeEstimeeSec: 40 });
}));

/** Progression, relayée telle quelle au frontend par le backend. */
router.get("/report/status/:jobId", (req, res) => {
    const job = jobStore.getJob(req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job inconnu ou expiré" });
    res.json({ job });
});

/**
 * Aperçu gratuit : couverture et sommaire, produits par les mêmes fonctions
 * que le rapport payant. L'acheteur voit exactement les deux premières pages
 * de ce qu'il achètera, et l'aperçu reste instantané même si le quota de
 * rédaction est épuisé.
 */
router.get("/report/preview/:sectorId", asyncHandler(async (req, res) => {
    const apercu = await reportService.generatePreview(req.params.sectorId);
    if (!apercu) throw new HttpError(404, "Secteur introuvable");

    res.type("application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${apercu.filename}"`);
    res.sendFile(apercu.path);
}));

/** Recalcul des projections d'un secteur, ou de tous si l'identifiant vaut 0. */
router.post("/projections/:sectorId", asyncHandler(async (req, res) => {
    const id = Number(req.params.sectorId);
    const resultat = id > 0
        ? await projectionService.calculerPourSecteur(id)
        : await projectionService.calculerPourTous();
    res.json({ success: true, ...resultat });
}));

/**
 * Reconstruit un PDF à partir de sections corrigées à la main.
 * Dernier recours quand le service de rédaction a échoué sur un rapport déjà
 * payé : mieux vaut une saisie manuelle qu'un client sans livrable.
 */
router.post("/report/:rapportId/rebuild", asyncHandler(async (req, res) => {
    const { narratives } = req.body;
    const resultat = await reportService.updateReportNarratives(req.params.rapportId, narratives);
    if (!resultat) throw new HttpError(404, "Rapport introuvable");
    res.json({
        success: true,
        pdfUrl: resultat.pdf.url,
        filename: resultat.pdf.filename,
        nombrePages: resultat.pdf.nombrePages,
    });
}));

/** Rapports produits, pour le panneau de contrôle. */
router.get("/reports", asyncHandler(async (req, res) => {
    res.json({ rapports: await reportService.listReports() });
}));

module.exports = router;
