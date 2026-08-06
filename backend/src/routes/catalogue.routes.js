// ============================================================================
// Catalogue public (CDC §3) — /api/catalogue
// Les 6 secteurs, leur prix, leur nombre de pages, leur date de mise à jour,
// et l'aperçu gratuit de 2 pages.
// ============================================================================

const express = require("express");

const sectorRepository = require("../services/sectorRepository");
const reportService = require("../services/reportService");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
    const secteurs = await sectorRepository.listActiveSectors();
    res.json({ secteurs });
}));

router.get("/:id", asyncHandler(async (req, res) => {
    const secteur = await sectorRepository.findSectorById(req.params.id);
    if (!secteur || !secteur.est_actif) throw new HttpError(404, "Secteur introuvable");
    res.json({ secteur });
}));

/** Aperçu gratuit : couverture + sommaire, servis en PDF inline. */
router.get("/:id/preview", asyncHandler(async (req, res) => {
    const preview = await reportService.generatePreview(req.params.id);
    if (!preview) throw new HttpError(404, "Secteur introuvable");

    res.type("application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${preview.filename}"`);
    res.sendFile(preview.path);
}));

module.exports = router;
