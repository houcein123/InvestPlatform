// ============================================================================
// Table de routage — vue d'ensemble de toute l'API en un seul écran.
// ============================================================================

const express = require("express");

const { requireAdmin } = require("../middleware/auth");
const authRoutes = require("./auth.routes");
const catalogueRoutes = require("./catalogue.routes");
const paymentRoutes = require("./payment.routes");
const reportRoutes = require("./report.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.get("/health", (req, res) => res.json({ status: "ok", service: "InvestPlatform API" }));

// Comptes — inscription publique (client), connexion commune, profil
router.use("/auth", authRoutes);

// Public / client
router.use("/catalogue", catalogueRoutes);
router.use("/payment", paymentRoutes);
router.use("/report", reportRoutes);

// Panneau de contrôle — réservé au rôle « admin »
router.use("/admin", requireAdmin, adminRoutes);

module.exports = router;
