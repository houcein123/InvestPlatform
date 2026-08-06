// ============================================================================
// Table de routage — vue d'ensemble de toute l'API en un seul écran.
// ============================================================================

const express = require("express");

const { verifyAdmin } = require("../middleware/auth");
const authRoutes = require("./auth.routes");
const catalogueRoutes = require("./catalogue.routes");
const paymentRoutes = require("./payment.routes");
const reportRoutes = require("./report.routes");
const adminRoutes = require("./admin.routes");

const router = express.Router();

router.get("/health", (req, res) => res.json({ status: "ok", service: "InvestPlatform API" }));

// Public
router.use("/catalogue", catalogueRoutes);
router.use("/payment", paymentRoutes);
router.use("/report", reportRoutes);

// Admin — l'ordre compte : /register, /login et /me sont publics ou
// auto-protégés ; tout le reste de /admin passe par verifyAdmin.
router.use("/admin", authRoutes);
router.use("/admin", verifyAdmin, adminRoutes);

module.exports = router;
