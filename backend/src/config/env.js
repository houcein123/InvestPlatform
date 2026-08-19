// ============================================================================
// Configuration centralisée — une seule lecture de process.env dans tout le
// projet. Toute variable manquante est signalée au démarrage plutôt que de
// provoquer une erreur obscure au premier appel.
// ============================================================================

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const REQUIRED = ["DATABASE_URL", "JWT_SECRET"];

const config = {
    port: Number(process.env.PORT) || 3001,
    corsOrigin: process.env.CORS_ORIGIN || "*",

    databaseUrl: process.env.DATABASE_URL,

    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
    bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,

    groqApiKey: process.env.GROQ_API_KEY,
    // Groq retire régulièrement ses modèles : `llama-3.3-70b-versatile`, utilisé
    // au départ, a disparu du catalogue et renvoyait un 404 trompeur en pleine
    // génération. La liste réellement accessible se vérifie au démarrage
    // (voir groqService.verifierAcces) et via `npm run modeles`.
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    // ── Paiement ──
    // 'simulation' : validation locale, aucun débit, aucune configuration
    //                externe. C'est le mode par défaut, celui du développement
    //                et des démonstrations.
    // 'paypal'     : transaction PayPal réelle. N'est retenu que si les
    //                identifiants sont effectivement présents (voir plus bas).
    paiementMode: process.env.PAIEMENT_MODE === "paypal" ? "paypal" : "simulation",

    // ── PayPal (facultatif — requis uniquement si PAIEMENT_MODE=paypal) ──
    paypalEnv: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    // Le dinar tunisien n'est pas accepté par PayPal : les tarifs restent en
    // TND et la transaction est présentée dans cette devise, à ce taux.
    paypalCurrency: process.env.PAYPAL_CURRENCY || "EUR",
    paypalTauxTND: Number(process.env.PAYPAL_TAUX_TND) || 0.29,
    paypalLocale: process.env.PAYPAL_LOCALE || "fr_FR",

    // Devise d'affichage et de comptabilité du catalogue
    devise: process.env.DEVISE || "TND",

    // Répertoire de sortie des PDF (servi en statique sur /reports)
    reportsDir: path.join(__dirname, "../../reports"),
};

function assertConfig() {
    const missing = REQUIRED.filter((key) => !process.env[key]);
    if (missing.length > 0) {
        console.error(`❌ Variables d'environnement manquantes : ${missing.join(", ")}`);
        console.error("   Copiez backend/.env.example vers backend/.env et renseignez-les.");
        process.exit(1);
    }
    if (!config.groqApiKey) {
        console.warn("⚠️  GROQ_API_KEY absente — les sections rédigées du rapport seront indisponibles.");
    }
    if (config.paiementMode === "paypal") {
        if (!config.paypalClientId || !config.paypalClientSecret) {
            // On ne laisse pas la plateforme démarrer dans un mode qu'elle ne
            // peut pas honorer : le repli explicite vaut mieux qu'un bouton
            // de paiement qui échouerait au premier clic.
            console.warn("⚠️  PAIEMENT_MODE=paypal mais identifiants absents — repli sur le mode simulation.");
            config.paiementMode = "simulation";
        } else if (config.paypalEnv === "live") {
            console.warn("🔴 PAYPAL_ENV=live — les paiements débiteront de l'argent réel.");
        }
    }
}

module.exports = { config, assertConfig };
