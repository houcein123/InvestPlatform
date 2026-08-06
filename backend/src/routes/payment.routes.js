// ============================================================================
// Paiement (CDC §6 étape 2) — /api/payment
// ----------------------------------------------------------------------------
// ⚠️  PayPal n'est PAS encore branché : capture() valide systématiquement le
// paiement. Le reste de la chaîne (achat tracé en base, contrôle du paiement
// avant génération) est en revanche réel, donc l'intégration PayPal se limitera
// à remplacer le corps de ces deux routes par les appels à l'API PayPal.
// ============================================================================

const express = require("express");

const salesService = require("../services/salesService");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/create-order", asyncHandler(async (req, res) => {
    const { sectorId } = req.body;
    if (!sectorId) throw new HttpError(400, "sectorId est obligatoire");

    const order = await salesService.createOrder(sectorId);
    if (!order) throw new HttpError(404, "Secteur introuvable ou inactif");

    res.status(201).json({
        success: true,
        achatId: order.achat.id,
        montant: Number(order.achat.montant),
        devise: salesService.DEVISE,
        secteur: order.secteur.nom,
        simulation: true,
    });
}));

router.post("/capture", asyncHandler(async (req, res) => {
    const { achatId } = req.body;
    if (!achatId) throw new HttpError(400, "achatId est obligatoire");

    const achat = await salesService.capturePayment(achatId);
    if (!achat) throw new HttpError(409, "Achat introuvable ou déjà réglé");

    res.json({
        success: true,
        message: "Paiement confirmé (simulation)",
        achatId: achat.id,
        montant: Number(achat.montant),
        simulation: true,
    });
}));

module.exports = router;
