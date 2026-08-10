// ============================================================================
// Client Groq — rédaction des sections narratives du rapport.
// ----------------------------------------------------------------------------
// Les quotas Groq sont serrés : sur un rapport, sept appels s'enchaînent en
// moins d'une minute et l'API répond 429 dès que la limite par minute est
// atteinte. Sans reprise, les sept sections échouaient d'un coup et le client
// recevait un rapport PAYÉ dont toute la partie rédigée était vide — cas
// observé en conditions réelles.
//
// D'où la reprise avec attente croissante ci-dessous, qui respecte l'en-tête
// `retry-after` quand Groq le fournit.
// ============================================================================

const Groq = require("groq-sdk");
const { config } = require("../config/env");

const client = config.groqApiKey ? new Groq({ apiKey: config.groqApiKey }) : null;

/** Nombre de tentatives par section, première incluse. */
const MAX_TENTATIVES = 4;

/** Attente de base, doublée à chaque échec (2 s, 4 s, 8 s). */
const ATTENTE_BASE_MS = 2000;

/** Plafond de l'attente : au-delà, la génération deviendrait interminable. */
const ATTENTE_MAX_MS = 30000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Une erreur passagère mérite une nouvelle tentative ; une erreur de requête, non. */
function estRecuperable(err) {
    const statut = err?.status ?? err?.response?.status;
    if (statut === 429) return true;              // quota par minute atteint
    if (statut >= 500 && statut < 600) return true; // incident côté Groq
    if (!statut && /ECONNRESET|ETIMEDOUT|EAI_AGAIN|fetch failed/i.test(err?.message || "")) {
        return true;                               // coupure réseau passagère
    }
    return false;
}

/**
 * Délai avant nouvelle tentative.
 * `retry-after` de Groq fait autorité s'il est présent : réessayer plus tôt ne
 * ferait que consommer une tentative pour rien.
 */
function calculerAttente(err, tentative) {
    const entete = err?.headers?.["retry-after"] ?? err?.response?.headers?.["retry-after"];
    const secondes = Number(entete);
    if (Number.isFinite(secondes) && secondes > 0) {
        return Math.min(secondes * 1000 + 250, ATTENTE_MAX_MS);
    }
    return Math.min(ATTENTE_BASE_MS * 2 ** (tentative - 1), ATTENTE_MAX_MS);
}

/**
 * Envoie un prompt à Groq et renvoie le texte produit.
 *
 * @param {string} prompt
 * @param {{maxTokens?: number, temperature?: number, onRetry?: function}} options
 *        onRetry(tentative, attenteMs, message) permet à l'appelant d'informer
 *        l'utilisateur plutôt que de laisser la barre de progression figée.
 * @throws si la clé est absente, si l'erreur n'est pas récupérable, ou si
 *         toutes les tentatives ont échoué.
 */
async function generateText(prompt, { maxTokens = 1500, temperature = 0.5, onRetry } = {}) {
    if (!client) {
        throw new Error("GROQ_API_KEY absente : rédaction indisponible");
    }

    let derniereErreur;

    for (let tentative = 1; tentative <= MAX_TENTATIVES; tentative++) {
        try {
            const completion = await client.chat.completions.create({
                model: config.groqModel,
                messages: [{ role: "user", content: prompt }],
                temperature,
                max_tokens: maxTokens,
            });
            return completion.choices[0]?.message?.content?.trim() || "";
        } catch (err) {
            derniereErreur = err;

            if (!estRecuperable(err) || tentative === MAX_TENTATIVES) throw err;

            const attente = calculerAttente(err, tentative);
            if (onRetry) onRetry(tentative, attente, err.message);
            console.warn(
                `⏳ Groq indisponible (tentative ${tentative}/${MAX_TENTATIVES}) — `
                + `nouvelle tentative dans ${Math.round(attente / 1000)} s`
            );
            await sleep(attente);
        }
    }

    throw derniereErreur;
}

module.exports = {
    generateText,
    model: config.groqModel,
    isConfigured: !!client,
    MAX_TENTATIVES,
};
