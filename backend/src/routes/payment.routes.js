// ============================================================================
// Paiement PayPal — /api/payment (CDC §6, étape 2)
// ----------------------------------------------------------------------------
// Parcours en trois temps, conforme à l'API Orders v2 :
//   1. create-order : on crée l'achat en base PUIS la commande PayPal ;
//   2. l'acheteur approuve dans la fenêtre PayPal (côté navigateur) ;
//   3. capture : on encaisse, on vérifie le montant reçu, on marque l'achat payé.
//
// Le montant encaissé est comparé au tarif du catalogue : un paiement inférieur
// au prix attendu n'ouvre pas droit au rapport.
// ============================================================================

const express = require("express");

const salesService = require("../services/salesService");
const paypalService = require("../services/paypalService");
const { config } = require("../config/env");
const { optionalAuth } = require("../middleware/auth");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

/** Tolérance sur le montant encaissé (arrondis de conversion de devise). */
const TOLERANCE_MONTANT = 0.02;

/** Configuration publique : le frontend en a besoin pour charger le SDK PayPal. */
router.get("/config", (req, res) => {
    const statut = paypalService.statut();
    res.json({
        configure: statut.configure,
        clientId: statut.clientId,
        environnement: statut.environnement,
        devisePaiement: statut.devise,
        deviseAffichage: config.devise,
        tauxConversion: statut.tauxTND,
        locale: statut.locale,
        argentReel: statut.argentReel,
    });
});

router.post("/create-order", optionalAuth, asyncHandler(async (req, res) => {
    const { sectorId } = req.body;
    if (!sectorId) throw new HttpError(400, "sectorId est obligatoire");
    if (!paypalService.isConfigured) throw new HttpError(503, "Paiement indisponible : PayPal n'est pas configuré");

    const commande = await salesService.createOrder(sectorId, req.compte?.id ?? null);
    if (!commande) throw new HttpError(404, "Secteur introuvable ou inactif");

    const { orderId, montantPaiement, devisePaiement } = await paypalService.createOrder({
        achatId: commande.achat.id,
        montantTND: Number(commande.achat.montant),
        secteur: commande.secteur.nom,
    });

    res.status(201).json({
        success: true,
        achatId: commande.achat.id,
        orderId,
        secteur: commande.secteur.nom,
        montantAffiche: Number(commande.achat.montant),
        deviseAffichage: config.devise,
        montantPaiement,
        devisePaiement,
        environnement: paypalService.statut().environnement,
    });
}));

router.post("/capture", optionalAuth, asyncHandler(async (req, res) => {
    const { orderId, achatId } = req.body;
    if (!orderId || !achatId) throw new HttpError(400, "orderId et achatId sont obligatoires");

    const achat = await salesService.findAchat(achatId);
    if (!achat) throw new HttpError(404, "Achat introuvable");
    if (achat.statut_paiement === "paye") {
        return res.json({ success: true, message: "Paiement déjà confirmé", achatId: achat.id });
    }

    // Un refus de PayPal (commande non approuvée, expirée, déjà encaissée…)
    // est une situation de paiement, pas une panne serveur : on renvoie le
    // motif tel quel plutôt qu'une erreur 500 opaque.
    let capture;
    try {
        capture = await paypalService.captureOrder(orderId);
    } catch (err) {
        throw new HttpError(402, err.message);
    }

    // La commande PayPal doit bien correspondre à l'achat présenté.
    if (capture.achatId !== null && capture.achatId !== Number(achatId)) {
        throw new HttpError(409, "La commande PayPal ne correspond pas à cet achat");
    }
    if (capture.statut !== "COMPLETED") {
        throw new HttpError(402, `Paiement non abouti (statut PayPal : ${capture.statut})`);
    }

    // Le montant encaissé doit couvrir le tarif du catalogue converti.
    const attendu = paypalService.convertirDepuisTND(Number(achat.montant));
    if (capture.montant + TOLERANCE_MONTANT < attendu) {
        await salesService.recordPayment({
            achatId: achat.id,
            utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
            montant: capture.montant,
            devise: capture.devise,
            transactionId: capture.transactionId,
            statut: "montant_insuffisant",
        });
        throw new HttpError(402, `Montant encaissé insuffisant (${capture.montant} ${capture.devise} pour ${attendu} attendus)`);
    }

    await salesService.recordPayment({
        achatId: achat.id,
        utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
        montant: capture.montant,
        devise: capture.devise,
        transactionId: capture.transactionId,
        statut: "complete",
    });
    await salesService.markPaid(achat.id);

    res.json({
        success: true,
        message: "Paiement confirmé",
        achatId: achat.id,
        transactionId: capture.transactionId,
        montant: capture.montant,
        devise: capture.devise,
    });
}));

module.exports = router;
