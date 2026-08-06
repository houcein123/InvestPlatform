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
        console.warn("⚠️  GROQ_API_KEY absente — les sections d'analyse IA seront indisponibles.");
    }
}

module.exports = { config, assertConfig };
