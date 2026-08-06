// ============================================================================
// Authentification — vérification du JWT puis rechargement du compte en base.
// ----------------------------------------------------------------------------
// Le rôle n'est jamais lu depuis le jeton : il est relu en base à chaque
// requête. Un compte rétrogradé ou désactivé perd donc ses droits
// immédiatement, sans attendre l'expiration du jeton.
// ============================================================================

const jwt = require("jsonwebtoken");
const { config } = require("../config/env");
const accountRepository = require("../services/accountRepository");

/** Extrait et vérifie le jeton ; renvoie null si absent ou invalide. */
function lireJeton(req) {
    const entete = req.headers.authorization;
    if (!entete || !entete.startsWith("Bearer ")) return null;
    try {
        return jwt.verify(entete.split(" ")[1], config.jwtSecret);
    } catch {
        return null;
    }
}

async function chargerCompte(req) {
    const charge = lireJeton(req);
    if (!charge) return null;
    const compte = await accountRepository.findById(charge.id);
    if (!compte || !compte.est_actif) return null;
    return compte;
}

/** Exige un compte connecté (client ou administrateur). */
async function requireAuth(req, res, next) {
    try {
        const compte = await chargerCompte(req);
        if (!compte) return res.status(401).json({ error: "Connexion requise" });
        req.compte = compte;
        next();
    } catch (err) {
        next(err);
    }
}

/** Exige un compte administrateur. */
async function requireAdmin(req, res, next) {
    try {
        const compte = await chargerCompte(req);
        if (!compte) return res.status(401).json({ error: "Connexion requise" });
        if (compte.role !== accountRepository.ROLE_ADMIN) {
            return res.status(403).json({ error: "Accès réservé aux administrateurs" });
        }
        req.compte = compte;
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Renseigne req.compte s'il y a un jeton valide, sans jamais bloquer.
 * Utilisé sur le parcours d'achat : un visiteur non connecté peut commander,
 * et un client connecté voit son achat rattaché à son espace.
 */
async function optionalAuth(req, res, next) {
    try {
        req.compte = await chargerCompte(req);
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
