// ============================================================================
// Pool PostgreSQL (Neon) — instance unique partagée par tous les services.
// ============================================================================

const { Pool } = require("pg");
const { config } = require("./env");

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
    console.error("❌ Erreur inattendue du pool PostgreSQL :", err.message);
});

/** Vérifie la connexion au démarrage ; arrête le process si la base est injoignable. */
async function connectDatabase() {
    const client = await pool.connect();
    try {
        await client.query("SELECT 1");
        console.log("✅ Connecté à PostgreSQL (Neon)");
    } finally {
        client.release();
    }
}

module.exports = { pool, connectDatabase };
