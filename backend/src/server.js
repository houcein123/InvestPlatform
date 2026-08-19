// ============================================================================
// InvestPlatform — point d'entrée du backend.
// Le serveur ne démarre qu'une fois la base joignable : mieux vaut un échec
// explicite au lancement qu'une API qui répond 500 à chaque requête.
// ============================================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const { config, assertConfig } = require("./config/env");
const { connectDatabase } = require("./config/db");
const groqService = require("./services/groqService");
const routes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

assertConfig();

const app = express();

app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// PDF générés (rapports et aperçus)
app.use("/reports", express.static(config.reportsDir));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
    try {
        await connectDatabase();
    } catch (err) {
        console.error("❌ Connexion PostgreSQL impossible :", err.message);
        process.exit(1);
    }

    // Contrôle non bloquant : une clé ou un modèle hors service doit se voir au
    // lancement, pas au milieu d'une génération déjà payée. Le catalogue,
    // l'aperçu et l'espace client fonctionnent sans rédaction.
    await groqService.verifierAcces();

    app.listen(config.port, () => {
        console.log("========================================");
        console.log("  🚀 Backend InvestPlatform démarré");
        console.log(`  📡 API   : http://localhost:${config.port}/api`);
        console.log("  🐘 DB    : PostgreSQL (Neon)");
        console.log(`  🤖 IA    : ${config.groqModel}`);
        console.log("  📄 PDF   : couverture + sommaire + 12 sections");
        console.log("========================================");
    });
}

start();

module.exports = app;
