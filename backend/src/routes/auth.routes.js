// ============================================================================
// Authentification administrateur — /api/admin/register | login | me
// ============================================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { pool } = require("../config/db");
const { config } = require("../config/env");
const { verifyAdmin } = require("../middleware/auth");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

router.post("/register", asyncHandler(async (req, res) => {
    const { email, mot_de_passe, nom, prenom, role = "admin" } = req.body;
    if (!email || !mot_de_passe || !nom || !prenom) {
        throw new HttpError(400, "Tous les champs sont requis");
    }
    if (String(mot_de_passe).length < 8) {
        throw new HttpError(400, "Le mot de passe doit contenir au moins 8 caractères");
    }

    const existing = await pool.query("SELECT id FROM admins WHERE email = $1", [email]);
    if (existing.rows.length > 0) throw new HttpError(409, "Email déjà utilisé");

    const hashed = await bcrypt.hash(mot_de_passe, config.bcryptRounds);
    const { rows } = await pool.query(
        `INSERT INTO admins (email, mot_de_passe, nom, prenom, role)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING id, email, nom, prenom, role`,
        [email, hashed, nom, prenom, role]
    );
    res.status(201).json({ message: "Admin créé", admin: rows[0] });
}));

router.post("/login", asyncHandler(async (req, res) => {
    const { email, mot_de_passe } = req.body;
    const { rows } = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);

    // Message identique que l'email existe ou non : ne pas révéler quels
    // comptes sont enregistrés.
    if (rows.length === 0) throw new HttpError(401, "Email ou mot de passe incorrect");

    const admin = rows[0];
    if (!admin.est_actif) throw new HttpError(403, "Compte désactivé");

    const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valid) throw new HttpError(401, "Email ou mot de passe incorrect");

    await pool.query("UPDATE admins SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1", [admin.id]);

    const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );

    res.json({
        message: "Connexion réussie",
        token,
        admin: { id: admin.id, email: admin.email, nom: admin.nom, prenom: admin.prenom, role: admin.role },
    });
}));

router.get("/me", verifyAdmin, (req, res) => {
    res.json({ admin: req.admin });
});

module.exports = router;
