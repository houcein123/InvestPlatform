// ============================================================================
// Tunisia Invest — moteur de rapports.
// ----------------------------------------------------------------------------
// Service INTERNE. Il ne s'adresse pas aux navigateurs : le backend Spring Boot
// est son unique client, et c'est lui qui vérifie qu'un achat payé couvre le
// secteur demandé avant de commander une génération.
//
// Le serveur ne démarre qu'une fois la base joignable : mieux vaut un échec
// explicite au lancement qu'une API qui répond 500 à chaque requête.
// ============================================================================

const express = require("express");

const { config, assertConfig } = require("./config/env");
const { connectDatabase } = require("./config/db");
const groqService = require("./services/groqService");
const { internalAuth } = require("./middleware/internalAuth");
const internalRoutes = require("./routes/internal.routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

assertConfig();

const app = express();

app.use(express.json({ limit: "2mb" }));

// PDF produits (rapports et aperçus). Servis en statique et sans jeton : ce
// sont des fichiers au nom imprévisible, référencés par le frontend une fois
// la génération terminée.
app.use("/reports", express.static(config.reportsDir));

app.use("/internal", internalAuth, internalRoutes);

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
    // lancement, pas au milieu d'une génération déjà payée.
    await groqService.verifierAcces();

    app.listen(config.port, () => {
        console.log("========================================");
        console.log("  ⚙️  Moteur de rapports Tunisia Invest");
        console.log(`  🔒 Interne : http://localhost:${config.port}/internal`);
        console.log(`  📄 PDF     : http://localhost:${config.port}/reports`);
        console.log("  🐘 DB      : PostgreSQL");
        console.log(`  🤖 IA      : ${config.groqModel}`);
        console.log("========================================");
    });
}

start();

module.exports = app;
