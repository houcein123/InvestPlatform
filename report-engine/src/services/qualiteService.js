// ============================================================================
// Relecture qualité d'une section rédigée, par un SECOND modèle.
// ----------------------------------------------------------------------------
// CE QUE CE SERVICE VÉRIFIE, ET POURQUOI CELA.
//
// Il ne juge ni le style ni l'intérêt du texte : ce sont des appréciations
// qu'un modèle rend au hasard et qu'on ne peut pas arbitrer. Il vérifie UNE
// chose, objectivement contrôlable et qui est le risque propre à ce service :
// le texte avance-t-il des CHIFFRES qui ne figurent pas dans les données
// transmises ?
//
// C'est la faute que la plateforme ne peut pas se permettre. Tout le reste du
// code est construit autour (prompts qui interdisent d'inventer, comparatif
// régional laissé vide plutôt que comblé, séparation de l'observé et de
// l'estimé). Un chiffre inventé dans un rapport vendu à un investisseur
// étranger décrédibilise l'ensemble du document, et il est indétectable à la
// lecture : il a l'air d'une donnée.
//
// POURQUOI UN AUTRE MODÈLE QUE LE RÉDACTEUR. Un modèle qui se relit lui-même
// valide ses propres inventions : la distribution qui a produit le chiffre le
// juge plausible. Un modèle tiers n'a pas cet angle mort. Si les deux modèles
// configurés sont identiques, la relecture est désactivée plutôt que de donner
// une garantie qu'elle n'apporte pas.
//
// CE SERVICE NE BLOQUE JAMAIS UNE LIVRAISON. Le rapport est déjà payé : une
// relecture en échec, un quota épuisé ou un verdict négatif produisent un
// SIGNALEMENT, jamais un refus de livrer. L'arbitrage revient à l'éditeur,
// depuis l'écran d'édition des rapports.
// ============================================================================

const { config } = require("../config/env");
const groqService = require("./groqService");

/** La relecture est-elle exploitable dans cette configuration ? */
function relectureDisponible() {
    if (!config.verificationActive) return false;
    // C'est le client de RELECTURE qui doit être configuré, pas celui de
    // rédaction : les deux ont désormais des clés distinctes.
    if (!groqService.verificationConfiguree) return false;

    const verificateur = (config.groqModelVerification || "").trim();
    if (!verificateur) return false;

    // Même modèle des deux côtés : la relecture n'apporterait rien, autant le
    // dire clairement plutôt que d'afficher un contrôle qui ne contrôle rien.
    return verificateur !== config.groqModel;
}

/**
 * Consigne de relecture.
 *
 * Le verdict est demandé en JSON strict, et en anglais quelle que soit la
 * langue du rapport : c'est une sortie machine, lue par du code, pas par le
 * client. Lui demander de répondre dans la langue du rapport ajouterait une
 * source d'échec de parsing sans aucun bénéfice.
 */
function promptRelecture(contexte, texte) {
    return `You are a fact-checker verifying an economic report before publication.

REFERENCE DATA (the only figures that may legitimately appear):
${contexte}

TEXT TO CHECK:
${texte}

TASK — Identify every NUMERIC claim in the text that cannot be traced back to
the reference data above.

Rules:
- Round numbers used rhetorically ("several thousand", "a majority") are NOT
  violations.
- A figure restated with different phrasing or units, but derivable from the
  reference data, is NOT a violation.
- Dates, year labels (2020-2028) and section numbering are NOT violations.
- Report ONLY figures that are asserted as fact and absent from the data.

Answer with STRICT JSON, no prose, no markdown fence:
{"verdict":"ok"|"suspect","chiffres":["..."],"remarque":"one short sentence"}`;
}

/** Extrait l'objet JSON d'une réponse, même entourée de texte ou de balises. */
function lireVerdict(brut) {
    if (!brut) return null;
    const debut = brut.indexOf("{");
    const fin = brut.lastIndexOf("}");
    if (debut === -1 || fin <= debut) return null;
    try {
        return JSON.parse(brut.slice(debut, fin + 1));
    } catch {
        return null;
    }
}

/**
 * Relit une section et signale les chiffres non sourcés.
 *
 * Retourne toujours un objet, jamais une exception : `statut` vaut "ok",
 * "suspect", "indisponible" (relecture non configurée) ou "echec" (le
 * vérificateur n'a pas répondu). Aucun de ces cas n'interrompt la génération.
 */
async function relireSection(cleSection, contexte, texte) {
    if (!relectureDisponible()) {
        return { section: cleSection, statut: "indisponible" };
    }
    if (!texte || texte.trim().length < 40) {
        // Une section vide ou quasi vide n'a rien à vérifier, et l'appel
        // consommerait du quota que la génération suivante utilisera mieux.
        return { section: cleSection, statut: "ok", chiffres: [] };
    }

    try {
        const brut = await groqService.generateText(promptRelecture(contexte, texte), {
            verification: true,
            model: config.groqModelVerification,
            // Température au plancher : on veut un jugement reproductible, pas
            // une reformulation créative du verdict.
            temperature: 0,
            maxTokens: 400,
        });

        const verdict = lireVerdict(brut);
        if (!verdict) {
            return { section: cleSection, statut: "echec", raison: "réponse illisible" };
        }

        const chiffres = Array.isArray(verdict.chiffres) ? verdict.chiffres.slice(0, 10) : [];
        // Le verdict fait foi, mais une liste non vide l'emporte : un modèle
        // qui liste des chiffres suspects puis conclut « ok » se contredit, et
        // c'est le signalement qui doit survivre au doute.
        const suspect = verdict.verdict === "suspect" || chiffres.length > 0;

        return {
            section: cleSection,
            statut: suspect ? "suspect" : "ok",
            chiffres,
            remarque: typeof verdict.remarque === "string" ? verdict.remarque.slice(0, 300) : "",
        };
    } catch (erreur) {
        // Quota épuisé, modèle retiré du catalogue, réseau : la relecture est
        // un confort, sa panne ne doit pas coûter un rapport au client.
        return { section: cleSection, statut: "echec", raison: erreur.message };
    }
}

/** Résumé lisible d'un ensemble de relectures, pour le journal et l'admin. */
function synthese(relectures) {
    const retenues = relectures.filter((r) => r && r.statut !== "indisponible");
    if (retenues.length === 0) return null;

    const suspectes = retenues.filter((r) => r.statut === "suspect");
    const echecs = retenues.filter((r) => r.statut === "echec");

    return {
        verifiees: retenues.length - echecs.length,
        suspectes: suspectes.map((r) => ({
            section: r.section,
            chiffres: r.chiffres,
            remarque: r.remarque,
        })),
        echecs: echecs.length,
        modele: config.groqModelVerification,
        cleDediee: groqService.cleVerificationDediee,
    };
}

module.exports = { relireSection, relectureDisponible, synthese };
