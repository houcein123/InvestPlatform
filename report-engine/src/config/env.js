// ============================================================================
// Configuration centralisée — une seule lecture de process.env dans tout le
// projet. Toute variable manquante est signalée au démarrage plutôt que de
// provoquer une erreur obscure au premier appel.
// ============================================================================

const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const REQUIRED = ["DATABASE_URL", "REPORT_ENGINE_TOKEN"];

const config = {
    port: Number(process.env.PORT) || 3001,
    corsOrigin: process.env.CORS_ORIGIN || "*",

    databaseUrl: process.env.DATABASE_URL,

    // Jeton partage avec le backend Spring Boot : seule authentification
    // du moteur, qui ne connait ni comptes ni sessions.
    internalToken: process.env.REPORT_ENGINE_TOKEN,

    groqApiKey: process.env.GROQ_API_KEY,

    // Clé PROPRE à la relecture qualité.
    //
    // Deux clés plutôt qu'une, et ce n'est pas une coquetterie : les quotas
    // Groq sont par clé et par minute. Faire passer les 7 rédactions ET les 7
    // relectures par la même clé double la consommation sur la même limite,
    // et c'est la rédaction — celle qui est payée — qui prend le 429 en
    // premier. Sur une clé distincte, une relecture au quota épuisé n'empêche
    // aucun rapport de sortir.
    //
    // Absente : la relecture retombe sur la clé principale, et si celle-ci
    // manque aussi, elle se désactive proprement.
    groqApiKeyVerification: process.env.GROQ_API_KEY_TEST_QUALITY || process.env.GROQ_API_KEY,
    // Groq retire régulièrement ses modèles : `llama-3.3-70b-versatile`, utilisé
    // au départ, a disparu du catalogue et renvoyait un 404 trompeur en pleine
    // génération. La liste réellement accessible se vérifie au démarrage
    // (voir groqService.verifierAcces) et via `npm run modeles`.
    groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    // ── Relecture qualité ──
    // Un SECOND modèle relit ce que le premier a écrit. Il doit être DIFFÉRENT
    // du rédacteur : un modèle qui se relit lui-même valide ses propres
    // inventions, parce que la même distribution qui a produit le chiffre le
    // juge plausible. Un modèle tiers n'a pas cet angle mort.
    //
    // Vide ou identique au rédacteur → relecture désactivée, et le rapport est
    // produit comme avant. C'est un filet, pas une dépendance.
    groqModelVerification: process.env.GROQ_MODEL_VERIFICATION || "",
    verificationActive: process.env.VERIFICATION_QUALITE !== "false",

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
}

module.exports = { config, assertConfig };
