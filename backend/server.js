require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ── SIMULATION BASE DE DONNÉES (en mémoire) ──
// Dans un vrai projet, tu remplaces ça par PostgreSQL
let admins = [];
let secteurs = [
    { id: 1, slug: 'tourisme', nom: 'Tourisme', description: 'Flux touristiques, capacité hôtelière...', prix_rapport: 49.99, nombre_pages: 13, est_actif: true },
    { id: 2, slug: 'agriculture', nom: 'Agriculture', description: 'Surfaces cultivées, exportations...', prix_rapport: 39.99, nombre_pages: 13, est_actif: true },
    { id: 3, slug: 'technologies', nom: 'Technologies & Numérique', description: 'Startups, export IT...', prix_rapport: 59.99, nombre_pages: 13, est_actif: true },
    { id: 4, slug: 'energies', nom: 'Énergies Renouvelables', description: 'Capacité installée, objectifs 2030...', prix_rapport: 54.99, nombre_pages: 13, est_actif: true },
    { id: 5, slug: 'textile', nom: 'Textile & Habillement', description: 'Exportations, emplois...', prix_rapport: 44.99, nombre_pages: 13, est_actif: true },
    { id: 6, slug: 'logistique', nom: 'Logistique & Transport', description: 'Ports, aéroports...', prix_rapport: 49.99, nombre_pages: 13, est_actif: true }
];

// ── MIDDLEWARE AUTH ──
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token manquant' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cle_super_secrete_123');
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalide' });
    }
};

// ── ROUTES ──

// Register (créer le premier admin)
app.post('/api/admin/register', async (req, res) => {
    const { email, mot_de_passe, nom, prenom, role = 'admin' } = req.body;
    if (!email || !mot_de_passe || !nom || !prenom) {
        return res.status(400).json({ error: 'Tous les champs sont requis' });
    }
    if (admins.find(a => a.email === email)) {
        return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    const hashed = await bcrypt.hash(mot_de_passe, 10);
    const admin = { id: admins.length + 1, email, mot_de_passe: hashed, nom, prenom, role };
    admins.push(admin);
    res.status(201).json({ message: 'Admin créé', admin: { id: admin.id, email, nom, prenom, role } });
});

// Login
app.post('/api/admin/login', async (req, res) => {
    const { email, mot_de_passe } = req.body;
    const admin = admins.find(a => a.email === email);
    if (!admin) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const valid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);
    if (!valid) return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || 'cle_super_secrete_123',
        { expiresIn: '24h' }
    );
    res.json({ message: 'Connexion réussie', token, admin: { id: admin.id, email: admin.email, nom: admin.nom, prenom: admin.prenom, role: admin.role } });
});

// Profil
app.get('/api/admin/me', verifyAdmin, (req, res) => {
    const admin = admins.find(a => a.id === req.admin.id);
    res.json({ admin: { id: admin.id, email: admin.email, nom: admin.nom, prenom: admin.prenom, role: admin.role } });
});

// Liste secteurs (protégée)
app.get('/api/admin/secteurs', verifyAdmin, (req, res) => {
    res.json({ secteurs });
});

// Modifier secteur (protégée)
app.put('/api/admin/secteurs/:id', verifyAdmin, (req, res) => {
    const secteur = secteurs.find(s => s.id == req.params.id);
    if (!secteur) return res.status(404).json({ error: 'Secteur non trouvé' });
    const { nom, description, prix_rapport, est_actif } = req.body;
    if (nom) secteur.nom = nom;
    if (description) secteur.description = description;
    if (prix_rapport) secteur.prix_rapport = prix_rapport;
    if (est_actif !== undefined) secteur.est_actif = est_actif;
    secteur.updated_at = new Date();
    res.json({ secteur });
});

// Démarrage
const PORT = 3001;
app.listen(PORT, () => {
    console.log('========================================');
    console.log('  🚀 Backend InvestPlatform démarré');
    console.log('  📡 URL: http://localhost:' + PORT);
    console.log('========================================');
});
