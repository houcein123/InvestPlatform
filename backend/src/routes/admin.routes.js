// ============================================================================
// Panneau admin (CDC §7) — /api/admin/*
// ----------------------------------------------------------------------------
// Toutes les routes de ce fichier sont protégées par verifyAdmin (appliqué
// dans routes/index.js).
//   • édition des secteurs et de leurs données chiffrées
//   • CRUD zones / acteurs / cadre réglementaire
//   • régénération d'un rapport après mise à jour des données
//   • statistiques de vente (rapports vendus par secteur, revenu)
// ============================================================================

const express = require("express");

const sectorRepository = require("../services/sectorRepository");
const salesService = require("../services/salesService");
const accountRepository = require("../services/accountRepository");
const reportService = require("../services/reportService");
const projectionService = require("../services/projectionService");
const paypalService = require("../services/paypalService");
const groqService = require("../services/groqService");
const jobStore = require("../services/jobStore");
const { config } = require("../config/env");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

// ── Secteurs ───────────────────────────────────────────────────────────────

router.get("/secteurs", asyncHandler(async (req, res) => {
    const secteurs = await sectorRepository.listAllSectors();
    res.json({ secteurs });
}));

router.get("/secteurs/:id", asyncHandler(async (req, res) => {
    const data = await sectorRepository.getSectorData(req.params.id);
    if (!data) throw new HttpError(404, "Secteur non trouvé");
    res.json(data);
}));

router.put("/secteurs/:id", asyncHandler(async (req, res) => {
    const secteur = await sectorRepository.updateSector(req.params.id, req.body);
    if (!secteur) throw new HttpError(404, "Secteur non trouvé");
    res.json({ secteur });
}));

// ── Chiffres clés (formulaire d'édition — CDC §7) ──────────────────────────

router.get("/secteurs/:id/chiffres-cles", asyncHandler(async (req, res) => {
    const data = await sectorRepository.getChiffresCles(req.params.id);
    res.json({ chiffresCles: data, champs: sectorRepository.CHIFFRES_FIELDS });
}));

router.put("/secteurs/:id/chiffres-cles", asyncHandler(async (req, res) => {
    const secteur = await sectorRepository.findSectorById(req.params.id);
    if (!secteur) throw new HttpError(404, "Secteur non trouvé");
    const chiffresCles = await sectorRepository.upsertChiffresCles(req.params.id, req.body);
    res.json({ chiffresCles });
}));

// ── Séries statistiques ────────────────────────────────────────────────────

router.get("/secteurs/:id/statistiques", asyncHandler(async (req, res) => {
    res.json({ statistiques: await sectorRepository.listStatistiques(req.params.id) });
}));

router.put("/statistiques/:statId", asyncHandler(async (req, res) => {
    const ligne = await sectorRepository.updateStatistique(req.params.statId, req.body);
    if (!ligne) throw new HttpError(404, "Indicateur non trouvé");
    res.json({ statistique: ligne });
}));

// ── Zones / acteurs / cadre réglementaire ──────────────────────────────────

router.get("/secteurs/:id/zones", asyncHandler(async (req, res) => {
    res.json({ zones: await sectorRepository.listZones(req.params.id) });
}));

router.post("/secteurs/:id/zones", asyncHandler(async (req, res) => {
    if (!req.body.nom || !req.body.type) throw new HttpError(400, "nom et type sont requis");
    res.status(201).json({ zone: await sectorRepository.createZone(req.params.id, req.body) });
}));

router.get("/secteurs/:id/acteurs", asyncHandler(async (req, res) => {
    res.json({ acteurs: await sectorRepository.listActeurs(req.params.id) });
}));

router.post("/secteurs/:id/acteurs", asyncHandler(async (req, res) => {
    if (!req.body.nom || !req.body.type) throw new HttpError(400, "nom et type sont requis");
    res.status(201).json({ acteur: await sectorRepository.createActeur(req.params.id, req.body) });
}));

router.get("/secteurs/:id/cadre", asyncHandler(async (req, res) => {
    res.json({ cadre: await sectorRepository.listCadre(req.params.id) });
}));

router.post("/secteurs/:id/cadre", asyncHandler(async (req, res) => {
    if (!req.body.titre || !req.body.description) throw new HttpError(400, "titre et description sont requis");
    res.status(201).json({ cadre: await sectorRepository.createCadre(req.params.id, req.body) });
}));

router.delete("/:kind(zones|acteurs|cadre)/:itemId", asyncHandler(async (req, res) => {
    const supprime = await sectorRepository.deleteSectorItem(req.params.kind, req.params.itemId);
    if (!supprime) throw new HttpError(404, "Élément non trouvé");
    res.json({ success: true });
}));

// ── Régénération d'un rapport (CDC §7) ─────────────────────────────────────

/**
 * Régénère le rapport d'un secteur avec les données à jour, sans passer par
 * un paiement (action d'administration). Le suivi utilise le même mécanisme
 * de job que la génération côté client.
 */
router.post("/secteurs/:id/regenerer", asyncHandler(async (req, res) => {
    const secteur = await sectorRepository.findSectorById(req.params.id);
    if (!secteur) throw new HttpError(404, "Secteur non trouvé");

    const jobId = jobStore.createJob(secteur.id);
    reportService
        .generateFullReport(secteur.id, {
            onProgress: (progression, etape) => jobStore.updateJob(jobId, { progression, etape }),
        })
        .then((result) => {
            jobStore.updateJob(jobId, {
                statut: "termine",
                progression: 100,
                etape: "Rapport régénéré",
                pdfUrl: result.pdf.url,
                filename: result.pdf.filename,
                sectionsManquantes: result.sectionsManquantes,
            });
        })
        .catch((err) => {
            console.error("❌ Échec de régénération :", err);
            jobStore.updateJob(jobId, { statut: "erreur", erreur: "La régénération a échoué" });
        });

    res.status(202).json({ success: true, jobId, message: "Régénération démarrée" });
}));

// ── Projections statistiques ───────────────────────────────────────────────

/**
 * Recalcule les projections d'un secteur à partir de l'historique observé.
 * Les valeurs produites sont des estimations, marquées comme telles en base
 * et dans le rapport.
 */
router.post("/secteurs/:id/projections", asyncHandler(async (req, res) => {
    const secteur = await sectorRepository.findSectorById(req.params.id);
    if (!secteur) throw new HttpError(404, "Secteur non trouvé");

    const resultat = await projectionService.calculerPourSecteur(secteur.id);
    res.json({ success: true, ...resultat });
}));

/** Recalcule les projections de tous les secteurs. */
router.post("/projections", asyncHandler(async (req, res) => {
    const resultat = await projectionService.calculerPourTous();
    res.json({ success: true, ...resultat });
}));

// ── Édition d'un rapport déjà produit ──────────────────────────────────────

/**
 * Le texte d'un rapport généré reste modifiable : un relecteur corrige les
 * sections rédigées et le PDF est reconstruit à l'identique pour le reste.
 * Aucun appel au modèle n'est refait, sans quoi les corrections seraient
 * écrasées.
 */
router.get("/rapports", asyncHandler(async (req, res) => {
    res.json({ rapports: await reportService.listReports() });
}));

router.get("/rapports/:rapportId", asyncHandler(async (req, res) => {
    const rapport = await reportService.getReport(req.params.rapportId);
    if (!rapport) throw new HttpError(404, "Rapport non trouvé");
    res.json({ rapport });
}));

router.put("/rapports/:rapportId", asyncHandler(async (req, res) => {
    const { narratives } = req.body;
    if (!narratives || typeof narratives !== "object") {
        throw new HttpError(400, "Le champ `narratives` est requis");
    }

    const resultat = await reportService.updateReportNarratives(req.params.rapportId, narratives);
    if (!resultat) throw new HttpError(404, "Rapport non trouvé");

    res.json({ success: true, pdfUrl: resultat.pdf.url, filename: resultat.pdf.filename });
}));

// ── Comptes (CDC §7) ───────────────────────────────────────────────────────

router.get("/comptes", asyncHandler(async (req, res) => {
    res.json({ comptes: await accountRepository.listAccounts() });
}));

/**
 * Change le rôle d'un compte. On refuse de retirer le dernier administrateur
 * actif : sans lui, plus personne ne pourrait accéder au panneau de contrôle.
 */
router.put("/comptes/:id/role", asyncHandler(async (req, res) => {
    const { role } = req.body;
    const id = Number(req.params.id);

    if (![accountRepository.ROLE_CLIENT, accountRepository.ROLE_ADMIN].includes(role)) {
        throw new HttpError(400, "Rôle invalide");
    }

    const cible = await accountRepository.findById(id);
    if (!cible) throw new HttpError(404, "Compte non trouvé");

    if (cible.role === accountRepository.ROLE_ADMIN && role === accountRepository.ROLE_CLIENT) {
        const admins = await accountRepository.countActiveAdmins();
        if (admins <= 1) throw new HttpError(409, "Impossible de retirer le dernier administrateur");
        if (id === req.compte.id) throw new HttpError(409, "Vous ne pouvez pas retirer votre propre rôle administrateur");
    }

    res.json({ compte: await accountRepository.setRole(id, role) });
}));

// ── Statistiques de vente (CDC §7) ─────────────────────────────────────────

router.get("/stats", asyncHandler(async (req, res) => {
    const [ventes, rapports] = await Promise.all([
        salesService.getSalesStats(),
        salesService.listRecentReports(),
    ]);
    res.json({ ...ventes, rapportsRecents: rapports });
}));

// ── État des services (page Paramètres) ────────────────────────────────────

router.get("/systeme", asyncHandler(async (req, res) => {
    const paypal = paypalService.statut();
    res.json({
        devise: config.devise,
        redaction: {
            configure: groqService.isConfigured,
            modele: groqService.model,
        },
        paiement: config.paiementMode === "simulation"
            ? {
                mode: "simulation",
                configure: true,
                argentReel: false,
            }
            : {
                mode: "paypal",
                configure: paypal.configure,
                environnement: paypal.environnement,
                devisePaiement: paypal.devise,
                tauxConversion: paypal.tauxTND,
                argentReel: paypal.argentReel,
            },
        rapports: {
            sections: require("../pdf/sections").SECTION_CATALOG.length,
            pagesMin: require("../pdf/sections").MIN_PAGE_COUNT,
        },
    });
}));

module.exports = router;
