#!/usr/bin/env node
// ============================================================================
// Liste les modèles de rédaction accessibles à la clé configurée.
//
//   npm run modeles
//
// Groq retire régulièrement des modèles de son catalogue : quand une génération
// échoue sur « model_not_found », c'est ici qu'on trouve par quoi remplacer
// GROQ_MODEL. La commande sert aussi à vérifier qu'une clé est bien acceptée,
// l'erreur renvoyée en cours de génération pouvant être trompeuse.
// ============================================================================

const { config } = require("../config/env");

/** Les modèles de transcription et de classification ne rédigent pas de texte. */
const NON_REDACTIONNELS = /guard|whisper|orpheus/i;

(async () => {
    if (!config.groqApiKey) {
        console.error("❌ GROQ_API_KEY absente du fichier .env");
        process.exit(1);
    }

    let reponse;
    try {
        reponse = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${config.groqApiKey}` },
        });
    } catch (err) {
        console.error("❌ Groq injoignable :", err.message);
        process.exit(1);
    }

    if (reponse.status === 401) {
        console.error("❌ Clé refusée (401).");
        console.error("   Une SEULE clé doit figurer sur la ligne GROQ_API_KEY : dotenv");
        console.error("   coupe la valeur au premier « # », une seconde clé y serait ignorée.");
        process.exit(1);
    }
    if (!reponse.ok) {
        console.error(`❌ HTTP ${reponse.status}`);
        process.exit(1);
    }

    const data = await reponse.json();
    const actifs = (data.data || []).filter((m) => m.active !== false);
    const redaction = actifs
        .filter((m) => !NON_REDACTIONNELS.test(m.id))
        .sort((a, b) => (b.context_window || 0) - (a.context_window || 0));

    console.log(`\nModèles de rédaction accessibles (${redaction.length} sur ${actifs.length}) :\n`);
    console.log("  " + "MODÈLE".padEnd(46) + "CONTEXTE".padStart(10) + "SORTIE MAX".padStart(12));

    for (const m of redaction) {
        const actuel = m.id === config.groqModel ? "  ← configuré" : "";
        console.log(
            "  " + m.id.padEnd(46)
            + String(m.context_window || "?").padStart(10)
            + String(m.max_completion_tokens || "?").padStart(12)
            + actuel
        );
    }

    const disponible = redaction.some((m) => m.id === config.groqModel);
    console.log(`\nGROQ_MODEL = ${config.groqModel} → ${disponible ? "✅ disponible" : "❌ INDISPONIBLE"}`);
    if (!disponible) {
        console.log("   Remplacez GROQ_MODEL dans .env par l'un des modèles ci-dessus.");
        process.exitCode = 1;
    }
    console.log();
})();
