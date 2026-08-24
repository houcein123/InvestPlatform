// ============================================================================
// Gestion centralisée des erreurs — évite le try/catch répété dans chaque
// route et garantit une réponse JSON homogène côté frontend.
// ============================================================================

/** Enveloppe un handler async : toute exception part vers errorHandler. */
function asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** Erreur métier avec code HTTP explicite (404, 409, 400...). */
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function notFoundHandler(req, res) {
    res.status(404).json({ error: `Route inconnue : ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars -- Express exige les 4 paramètres
function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    if (status >= 500) console.error("❌", err);
    res.status(status).json({ error: err.status ? err.message : "Erreur serveur" });
}

module.exports = { asyncHandler, HttpError, notFoundHandler, errorHandler };
