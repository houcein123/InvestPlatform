// ============================================================================
// Paiement — /api/payment (CDC §6, étape 2)
// ----------------------------------------------------------------------------
// Deux modes, choisis par PAIEMENT_MODE :
//
//   'simulation' (défaut) — la commande est validée dans la plateforme.
//        Aucun débit, aucun prestataire externe, aucune configuration. Le
//        montant réellement encaissé est 0 ; le tarif du catalogue reste
//        enregistré sur l'achat pour que le panier ait un sens, mais les
//        statistiques distinguent ces ventes des vraies (achats.mode_paiement).
//
//   'paypal' — transaction PayPal réelle (API Orders v2), en trois temps :
//        1. create-order : on crée l'achat en base PUIS la commande PayPal ;
//        2. l'acheteur approuve sur le domaine de PayPal ;
//        3. capture : on encaisse et on vérifie le montant reçu.
//
// Dans les deux cas, c'est l'enregistrement en base qui fait foi pour
// débloquer la génération du rapport — jamais une affirmation du navigateur.
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

const estSimulation = () => config.paiementMode === "simulation";

/** Configuration publique consommée par le frontend. */
router.get("/config", (req, res) => {
    if (estSimulation()) {
        return res.json({
            mode: "simulation",
            configure: true,
            deviseAffichage: config.devise,
            argentReel: false,
        });
    }

    const statut = paypalService.statut();
    res.json({
        mode: "paypal",
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

// ── Création de la commande ────────────────────────────────────────────────

router.post("/create-order", optionalAuth, asyncHandler(async (req, res) => {
    const { sectorId } = req.body;
    if (!sectorId) throw new HttpError(400, "sectorId est obligatoire");

    const mode = estSimulation() ? "simulation" : "paypal";

    if (mode === "paypal" && !paypalService.isConfigured) {
        throw new HttpError(503, "Paiement indisponible : PayPal n'est pas configuré");
    }

    const commande = await salesService.createOrder(sectorId, req.compte?.id ?? null, mode);
    if (!commande) throw new HttpError(404, "Secteur introuvable ou inactif");

    const base = {
        success: true,
        mode,
        achatId: commande.achat.id,
        secteur: commande.secteur.nom,
        montantAffiche: Number(commande.achat.montant),
        deviseAffichage: config.devise,
    };

    if (mode === "simulation") {
        // Le montant reste celui du catalogue : c'est la valeur de la commande.
        // L'absence de débit réel est portée par le mode, pas par un zéro.
        return res.status(201).json({
            ...base,
            montantPaiement: Number(commande.achat.montant),
            devisePaiement: config.devise,
        });
    }

    const { orderId, montantPaiement, devisePaiement } = await paypalService.createOrder({
        achatId: commande.achat.id,
        montantTND: Number(commande.achat.montant),
        secteur: commande.secteur.nom,
    });

    res.status(201).json({
        ...base,
        orderId,
        montantPaiement,
        devisePaiement,
        environnement: paypalService.statut().environnement,
    });
}));

// ── Validation du paiement ─────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/capture", optionalAuth, asyncHandler(async (req, res) => {
    const { orderId, achatId, emailPayeur, nomPayeur } = req.body;
    if (!achatId) throw new HttpError(400, "achatId est obligatoire");

    // Le compte PayPal déclaré est conservé pour le rapprochement comptable.
    // Seule l'adresse est demandée : un marchand n'a jamais à connaître le mot
    // de passe de son client, et aucune API PayPal ne permettrait de le vérifier.
    if (emailPayeur && !EMAIL_RE.test(emailPayeur)) {
        throw new HttpError(400, "Adresse du compte PayPal invalide");
    }

    const achat = await salesService.findAchat(achatId);
    if (!achat) throw new HttpError(404, "Achat introuvable");
    if (achat.statut_paiement === "paye") {
        return res.json({ success: true, message: "Commande déjà confirmée", achatId: achat.id });
    }

    // ---- Mode simulation : validation locale, montant encaissé nul --------
    if (achat.mode_paiement === "simulation") {
        if (!emailPayeur) throw new HttpError(400, "L'adresse du compte PayPal est requise");

        // Le montant enregistré est le TARIF DU RAPPORT, pas zéro : la ligne
        // de paiement doit refléter la valeur de ce qui a été commandé, sinon
        // la comptabilité est inexploitable. Le fait qu'aucun débit réel n'ait
        // eu lieu est porté par `achats.mode_paiement` et `paiements.methode`.
        const montant = Number(achat.montant);

        await salesService.recordPayment({
            achatId: achat.id,
            utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
            montant,
            devise: config.devise,
            methode: "simulation",
            transactionId: `SIM-${achat.id}-${Date.now()}`,
            statut: "complete",
            emailPayeur,
            nomPayeur: nomPayeur || null,
        });
        await salesService.markPaid(achat.id);

        return res.json({
            success: true,
            mode: "simulation",
            message: "Commande confirmée",
            achatId: achat.id,
            montant,
            devise: config.devise,
            emailPayeur,
        });
    }

    // ---- Mode PayPal : encaissement réel ----------------------------------
    if (!orderId) throw new HttpError(400, "orderId est obligatoire pour un paiement PayPal");

    // Un refus de PayPal (commande non approuvée, expirée, déjà encaissée…)
    // est une situation de paiement, pas une panne serveur.
    let capture;
    try {
        capture = await paypalService.captureOrder(orderId);
    } catch (err) {
        throw new HttpError(402, err.message);
    }

    if (capture.achatId !== null && capture.achatId !== Number(achatId)) {
        throw new HttpError(409, "La commande PayPal ne correspond pas à cet achat");
    }
    if (capture.statut !== "COMPLETED") {
        throw new HttpError(402, `Paiement non abouti (statut PayPal : ${capture.statut})`);
    }

    const attendu = paypalService.convertirDepuisTND(Number(achat.montant));
    if (capture.montant + TOLERANCE_MONTANT < attendu) {
        await salesService.recordPayment({
            achatId: achat.id,
            utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
            montant: capture.montant,
            devise: capture.devise,
            methode: "paypal",
            transactionId: capture.transactionId,
            statut: "montant_insuffisant",
            emailPayeur: capture.emailPayeur ?? emailPayeur ?? null,
        });
        throw new HttpError(402, `Montant encaissé insuffisant (${capture.montant} ${capture.devise} pour ${attendu} attendus)`);
    }

    await salesService.recordPayment({
        achatId: achat.id,
        utilisateurId: req.compte?.id ?? achat.id_utilisateur ?? null,
        montant: capture.montant,
        devise: capture.devise,
        methode: "paypal",
        transactionId: capture.transactionId,
        statut: "complete",
        // En mode PayPal, l'adresse vient de la réponse de PayPal elle-même :
        // elle est authentifiée, contrairement à une saisie du navigateur.
        emailPayeur: capture.emailPayeur ?? emailPayeur ?? null,
        nomPayeur: capture.nomPayeur ?? nomPayeur ?? null,
    });
    await salesService.markPaid(achat.id);

    res.json({
        success: true,
        mode: "paypal",
        message: "Paiement confirmé",
        achatId: achat.id,
        transactionId: capture.transactionId,
        montant: capture.montant,
        devise: capture.devise,
    });
}));

module.exports = router;
