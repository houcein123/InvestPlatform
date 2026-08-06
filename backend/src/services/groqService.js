// ============================================================================
// Client Groq — génération des sections narratives du rapport.
// ============================================================================

const Groq = require("groq-sdk");
const { config } = require("../config/env");

const client = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

/**
 * Envoie un prompt à Groq et renvoie le texte produit.
 * @throws si la clé est absente ou si l'API répond en erreur — l'appelant
 *         décide s'il dégrade (aperçu) ou s'il échoue (rapport payant).
 */
async function generateText(prompt, { maxTokens = 1500, temperature = 0.5 } = {}) {
    if (!client) {
        throw new Error("GROQ_API_KEY absente : génération IA indisponible");
    }

    const completion = await client.chat.completions.create({
        model: config.groqModel,
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
    });

    return completion.choices[0]?.message?.content?.trim() || "";
}

module.exports = { generateText, model: config.groqModel, isConfigured: !!client };
