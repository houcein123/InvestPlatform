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
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",

    // ── PayPal ──
    // `sandbox` = comptes de test, aucun argent réel. `live` = paiements réels.
    paypalEnv: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox",
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    // Le dinar tunisien n'est pas accepté par PayPal : les tarifs restent en
    // TND et la transaction est présentée dans cette devise, à ce taux.
    paypalCurrency: process.env.PAYPAL_CURRENCY || "EUR",
    paypalTauxTND: Number(process.env.PAYPAL_TAUX_TND) || 0.29,
    // Sans cette valeur, PayPal déduit la langue de l'adresse IP et sert
    // parfois la page de paiement en arabe ou en anglais.
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
    if (!config.paypalClientId || !config.paypalClientSecret) {
        console.warn("⚠️  Identifiants PayPal absents — le paiement sera indisponible.");
    } else if (config.paypalEnv === "live") {
        console.warn("🔴 PAYPAL_ENV=live — les paiements débiteront de l'argent réel.");
    }
}

module.exports = { config, assertConfig };
