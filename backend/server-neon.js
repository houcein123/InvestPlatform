require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
// Import du service Groq
const { generateText } = require("./services/groqService");
const prompts = require("./services/promptService");
const generatePDF = require("./utils/pdfGenerator");
const path = require("path");
app.use(cors());
app.use(express.json());
app.use(
    "/reports",
    express.static(path.join(__dirname, "reports"))
);

// ── CONNEXION NEON POSTGRESQL ──
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false  // Nécessaire pour Neon
    }
});

// Test de connexion au démarrage
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ ERREUR DE CONNEXION À NEON:', err.message);
        console.error('Vérifie ta DATABASE_URL dans le fichier .env');
        process.exit(1);
    }
    console.log('✅ Connecté à PostgreSQL (Neon)');
    release();
});

// ── MIDDLEWARE AUTH ──
const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Token manquant' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const result = await pool.query(
            'SELECT id, email, nom, prenom, role, est_actif FROM admins WHERE id = $1',
            [decoded.id]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Admin non trouvé' });
        }
        const admin = result.rows[0];
        if (!admin.est_actif) {
            return res.status(403).json({ error: 'Compte désactivé' });
        }
        req.admin = admin;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
};

// ── ROUTES ──

// Register
app.post('/api/admin/register', async (req, res) => {
    try {
        const { email, mot_de_passe, nom, prenom, role = 'admin' } = req.body;
        if (!email || !mot_de_passe || !nom || !prenom) {
            return res.status(400).json({ error: 'Tous les champs sont requis' });
        }
        const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email déjà utilisé' });
        }
        const hashed = await bcrypt.hash(mot_de_passe, 10);
        const result = await pool.query(
            `INSERT INTO admins (email, mot_de_passe, nom, prenom, role) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nom, prenom, role`,
            [email, hashed, nom, prenom, role]
        );
        res.status(201).json({ message: 'Admin créé', admin: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;
        const result = await pool.query(
            'SELECT id, email, mot_de_passe, nom, prenom, role, est_actif FROM admins WHERE email = $1',
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        const admin = result.rows[0];
        if (!admin.est_actif) {
            return res.status(403).json({ error: 'Compte désactivé' });
        }
        const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
        if (!valid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        await pool.query(
            'UPDATE admins SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );
        const token = jwt.sign(
            { id: admin.id, email: admin.email, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({
            message: 'Connexion réussie',
            token,
            admin: {
                id: admin.id, email: admin.email,
                nom: admin.nom, prenom: admin.prenom, role: admin.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Profil
app.get('/api/admin/me', verifyAdmin, async (req, res) => {
    res.json({ admin: req.admin });
});

// Liste secteurs (depuis NEON)
app.get('/api/admin/secteurs', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM secteurs ORDER BY id');
        res.json({ secteurs: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Catalogue public (sans authentification)
app.get('/api/secteurs', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                nom,
                description,
                prix_rapport,
                nombre_pages,
                updated_at
            FROM secteurs
            WHERE est_actif = true
            ORDER BY id
        `);

        res.json({
            secteurs: result.rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: 'Erreur serveur'
        });
    }
});
// Modifier secteur (sur NEON)
app.put('/api/admin/secteurs/:id', verifyAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, description, prix_rapport, est_actif } = req.body;
        const result = await pool.query(
            `UPDATE secteurs 
             SET nom = $1, description = $2, prix_rapport = $3, 
                 est_actif = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $5 RETURNING *`,
            [nom, description, prix_rapport, est_actif, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Secteur non trouvé' });
        }
        res.json({ secteur: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Stats ventes
app.get('/api/admin/statistiques-ventes', verifyAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.nom as secteur, sv.annee, sv.mois, sv.nb_ventes, sv.revenu_total
            FROM statistiques_ventes sv
            JOIN secteurs s ON s.id = sv.secteur_id
            ORDER BY sv.annee DESC, sv.mois DESC
        `);
        res.json({ statistiques: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// ==========================================
// Génération complète du rapport IA
// ==========================================

app.post("/api/report/generate", async (req, res) => {

    try {

        const { sectorId } = req.body;

        if (!sectorId) {
            return res.status(400).json({
                success: false,
                error: "sectorId est obligatoire"
            });
        }

        // Récupération du secteur depuis PostgreSQL
        const result = await pool.query(
            "SELECT * FROM secteurs WHERE id = $1",
            [sectorId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Secteur introuvable"
            });
        }

        const sector = result.rows[0];

        console.log("Secteur :", sector.nom);

        // Génération IA
        const introduction = await generateText(
            prompts.introduction(sector)
        );

        const tendances = await generateText(
            prompts.tendances(sector)
        );

        const opportunites = await generateText(
            prompts.opportunites(sector)
        );

        const risques = await generateText(
            prompts.risques(sector)
        );

        const benchmarking = await generateText(
            prompts.benchmarking(sector)
        );

        const recommandations = await generateText(
            prompts.recommandations(sector)
        );

        const perspectives = await generateText(
            prompts.perspectives(sector)
        );

        const rapport = {

            secteur: sector.nom,

            introduction,

            tendances,

            opportunites,

            risques,

            benchmarking,

            recommandations,

            perspectives

        };

        const pdfPath = generatePDF(rapport);

        const pdfUrl = `http://localhost:3001/reports/${rapport.secteur}.pdf`;

        res.json({
            success: true,
            rapport,
            pdf: pdfUrl
        });
    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});
// Démarrage
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  ✅ Groq SDK chargé');
    console.log('  🚀 Backend InvestPlatform démarré');
    console.log('  📡 URL: http://localhost:' + PORT);
    console.log('  🐘 DB: PostgreSQL (Neon)');
    console.log('========================================');
});
