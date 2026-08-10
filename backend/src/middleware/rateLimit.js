// ============================================================================
// Limitation de débit — protection des points d'entrée sensibles.
// ----------------------------------------------------------------------------
// /api/auth/login n'était soumis à aucune limite : un attaquant pouvait tester
// des mots de passe aussi vite que le réseau le permettait, et bcrypt seul ne
// protège pas contre ça (il ralentit la vérification, il ne l'interdit pas).
//
// Compteur en mémoire, volontairement : le service tourne sur une seule
// instance. Une montée en charge multi-instances demanderait Redis, ce que le
// périmètre actuel ne justifie pas.
// ============================================================================

const compteurs = new Map();

/** Purge périodique pour éviter que la table ne grossisse indéfiniment. */
const INTERVALLE_PURGE_MS = 5 * 60 * 1000;

const purge = setInterval(() => {
    const maintenant = Date.now();
    for (const [cle, entree] of compteurs) {
        if (entree.expireLe <= maintenant) compteurs.delete(cle);
    }
}, INTERVALLE_PURGE_MS);

// Ne pas maintenir le processus en vie uniquement pour cette purge.
purge.unref?.();

/**
 * @param {{fenetreMs: number, max: number, message?: string}} options
 */
function rateLimit({ fenetreMs, max, message }) {
    return (req, res, next) => {
        // L'adresse IP suffit ici ; derrière un reverse proxy, penser à
        // activer `app.set("trust proxy", 1)` pour ne pas limiter le proxy.
        const cle = `${req.method}:${req.baseUrl}${req.path}:${req.ip}`;
        const maintenant = Date.now();
        const entree = compteurs.get(cle);

        if (!entree || entree.expireLe <= maintenant) {
            compteurs.set(cle, { compte: 1, expireLe: maintenant + fenetreMs });
            return next();
        }

        entree.compte += 1;

        if (entree.compte > max) {
            const secondes = Math.ceil((entree.expireLe - maintenant) / 1000);
            res.set("Retry-After", String(secondes));
            return res.status(429).json({
                error: message || `Trop de tentatives. Réessayez dans ${secondes} secondes.`,
            });
        }

        next();
    };
}

module.exports = { rateLimit };
