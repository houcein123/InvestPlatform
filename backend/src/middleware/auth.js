// ============================================================================
// Authentification admin — vérification du JWT puis rechargement de l'admin
// en base (un compte désactivé après émission du token est ainsi rejeté).
// ============================================================================

const jwt = require("jsonwebtoken");
const { pool } = require("../config/db");
const { config } = require("../config/env");

async function verifyAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Token manquant" });
    }

    let decoded;
    try {
        decoded = jwt.verify(authHeader.split(" ")[1], config.jwtSecret);
    } catch (err) {
        return res.status(401).json({ error: "Token invalide" });
    }

    try {
        const result = await pool.query(
            "SELECT id, email, nom, prenom, role, est_actif FROM admins WHERE id = $1",
            [decoded.id]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: "Admin non trouvé" });

        const admin = result.rows[0];
        if (!admin.est_actif) return res.status(403).json({ error: "Compte désactivé" });

        req.admin = admin;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { verifyAdmin };
