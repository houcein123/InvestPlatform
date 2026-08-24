// ============================================================================
// Authentification du moteur — jeton partagé avec le backend Spring Boot.
// ----------------------------------------------------------------------------
// Ce service ne doit jamais être exposé publiquement : il fabrique des rapports
// sans vérifier de droit d'accès, cette vérification appartient au backend.
// Le jeton est la dernière barrière si le port se retrouve joignable.
//
// La comparaison est faite en temps constant : comparer deux chaînes avec ===
// sort à la première différence, ce qui laisse mesurer le jeton octet par octet.
// ============================================================================

const crypto = require("crypto");
const { config } = require("../config/env");

const attendu = Buffer.from(config.internalToken || "", "utf8");

function internalAuth(req, res, next) {
    const entete = req.headers.authorization;
    if (!entete || !entete.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Jeton interne requis" });
    }

    const fourni = Buffer.from(entete.slice(7), "utf8");
    const valide = fourni.length === attendu.length && crypto.timingSafeEqual(fourni, attendu);

    if (!valide) {
        return res.status(403).json({ error: "Jeton interne invalide" });
    }
    next();
}

module.exports = { internalAuth };
