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

/**
 * Vérifie au démarrage que la clé est acceptée ET que le modèle configuré
 * existe encore.
 *
 * Sans ce contrôle, une clé invalide ou un modèle retiré ne se manifestaient
 * qu'en pleine génération, sous la forme d'un « 404 model_not_found » qui
 * pointe vers le modèle alors que la cause peut être la clé. Le diagnostic
 * arrive désormais au lancement, avec la liste des modèles réellement
 * accessibles.
 *
 * Ne bloque JAMAIS le démarrage : le catalogue, l'aperçu et l'espace client
 * fonctionnent sans rédaction.
 */
async function verifierAcces() {
    if (!client) return { ok: false, raison: "cle_absente" };

    let reponse;
    try {
        reponse = await fetch("https://api.groq.com/openai/v1/models", {
            headers: { Authorization: `Bearer ${config.groqApiKey}` },
        });
    } catch (err) {
        console.warn(`⚠️  Service de rédaction injoignable (${err.message}) — vérification reportée.`);
        return { ok: false, raison: "reseau" };
    }

    if (reponse.status === 401) {
        console.error("❌ GROQ_API_KEY refusée par Groq (401).");
        console.error("   Vérifiez qu'une SEULE clé figure sur la ligne GROQ_API_KEY du fichier .env :");
        console.error("   dotenv coupe la valeur au premier « # », une seconde clé y serait ignorée.");
        console.error("   Clé à régénérer sur https://console.groq.com/keys");
        return { ok: false, raison: "cle_invalide" };
    }

    if (!reponse.ok) {
        console.warn(`⚠️  Vérification du service de rédaction impossible (HTTP ${reponse.status}).`);
        return { ok: false, raison: "indisponible" };
    }

    const data = await reponse.json().catch(() => ({}));
    const disponibles = (data.data || []).filter((m) => m.active !== false).map((m) => m.id);

    if (!disponibles.includes(config.groqModel)) {
        console.error(`❌ Le modèle « ${config.groqModel} » n'est pas accessible avec cette clé.`);
        console.error("   Groq retire régulièrement des modèles. Modèles de rédaction disponibles :");
        disponibles
            .filter((id) => /gpt-oss|qwen|llama-3|compound/i.test(id) && !/guard|whisper|orpheus/i.test(id))
            .forEach((id) => console.error(`     - ${id}`));
        console.error("   Renseignez GROQ_MODEL dans .env avec l'un d'eux.");
        return { ok: false, raison: "modele_absent", disponibles };
    }

    console.log(`✅ Rédaction : ${config.groqModel}`);
    return { ok: true, disponibles };
}

module.exports = {
    generateText,
    verifierAcces,
    model: config.groqModel,
    isConfigured: !!client,
    MAX_TENTATIVES,
};
