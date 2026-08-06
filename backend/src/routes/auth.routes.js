// ============================================================================
// Authentification — /api/auth
// ----------------------------------------------------------------------------
// Un seul formulaire de connexion pour tout le monde. L'inscription publique
// ne crée que des comptes client ; le rôle renvoyé à la connexion indique au
// frontend s'il doit ouvrir le catalogue ou le panneau de contrôle.
// ============================================================================

const express = require("express");
const jwt = require("jsonwebtoken");

const { config } = require("../config/env");
const accountRepository = require("../services/accountRepository");
const { requireAuth } = require("../middleware/auth");
const { asyncHandler, HttpError } = require("../middleware/errorHandler");

const router = express.Router();

const LONGUEUR_MIN_MOT_DE_PASSE = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signerJeton(compte) {
    return jwt.sign(
        { id: compte.id, email: compte.email },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
}

/** Inscription publique — crée un compte client. */
router.post("/register", asyncHandler(async (req, res) => {
    const { email, mot_de_passe, nom, prenom, entreprise, pays, telephone } = req.body;

    if (!email || !mot_de_passe || !nom || !prenom) {
        throw new HttpError(400, "Email, mot de passe, nom et prénom sont requis");
    }
    if (!EMAIL_RE.test(email)) {
        throw new HttpError(400, "Adresse email invalide");
    }
    if (String(mot_de_passe).length < LONGUEUR_MIN_MOT_DE_PASSE) {
        throw new HttpError(400, `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères`);
    }
    if (await accountRepository.findByEmail(email)) {
        throw new HttpError(409, "Un compte existe déjà avec cet email");
    }

    const compte = await accountRepository.createClient({
        email, mot_de_passe, nom, prenom, entreprise, pays, telephone,
    });

    // Connexion immédiate : demander de ressaisir ses identifiants juste après
    // les avoir choisis n'apporte rien.
    res.status(201).json({ token: signerJeton(compte), compte });
}));

/** Connexion — identique pour un client et un administrateur. */
router.post("/login", asyncHandler(async (req, res) => {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) throw new HttpError(400, "Email et mot de passe requis");

    const compte = await accountRepository.findByEmail(email);

    // Message identique que l'email existe ou non : ne pas révéler quels
    // comptes sont enregistrés.
    if (!compte) throw new HttpError(401, "Email ou mot de passe incorrect");
    if (!compte.est_actif) throw new HttpError(403, "Compte désactivé");

    const valide = await accountRepository.verifyPassword(mot_de_passe, compte.mot_de_passe);
    if (!valide) throw new HttpError(401, "Email ou mot de passe incorrect");

    await accountRepository.touchLogin(compte.id);
    const profil = await accountRepository.findById(compte.id);

    res.json({ token: signerJeton(profil), compte: profil });
}));

/** Compte courant — sert à revalider un jeton au chargement du frontend. */
router.get("/me", requireAuth, (req, res) => {
    res.json({ compte: req.compte });
});

/** Mise à jour du profil par son titulaire. */
router.put("/profil", requireAuth, asyncHandler(async (req, res) => {
    const compte = await accountRepository.updateProfil(req.compte.id, req.body);
    res.json({ compte });
}));

/** Changement de mot de passe — l'actuel est exigé. */
router.put("/mot-de-passe", requireAuth, asyncHandler(async (req, res) => {
    const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;

    if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
        throw new HttpError(400, "Mot de passe actuel et nouveau mot de passe requis");
    }
    if (String(nouveau_mot_de_passe).length < LONGUEUR_MIN_MOT_DE_PASSE) {
        throw new HttpError(400, `Le mot de passe doit contenir au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères`);
    }

    const complet = await accountRepository.findByEmail(req.compte.email);
    const valide = await accountRepository.verifyPassword(mot_de_passe_actuel, complet.mot_de_passe);
    if (!valide) throw new HttpError(401, "Mot de passe actuel incorrect");

    await accountRepository.updatePassword(req.compte.id, nouveau_mot_de_passe);
    res.json({ success: true, message: "Mot de passe mis à jour" });
}));

module.exports = router;
