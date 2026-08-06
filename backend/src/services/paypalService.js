// ============================================================================
// PayPal — API Orders v2 (CDC §6, étape 2)
// ----------------------------------------------------------------------------
// ⚠️  Le dinar tunisien ne fait PAS partie des devises acceptées par PayPal.
// Les tarifs du catalogue restent donc en TND (affichage et comptabilité),
// et la transaction est présentée à PayPal dans la devise configurée
// (PAYPAL_CURRENCY, EUR par défaut) via le taux PAYPAL_TAUX_TND.
//
// En environnement `sandbox`, aucun argent réel ne circule : les paiements
// se déroulent exactement comme en production mais sur des comptes de test.
// ============================================================================

const { config } = require("../config/env");

const HOSTS = {
    sandbox: "https://api-m.sandbox.paypal.com",
    live: "https://api-m.paypal.com",
};

const host = HOSTS[config.paypalEnv] || HOSTS.sandbox;

const isConfigured = !!(config.paypalClientId && config.paypalClientSecret);

/** Jeton OAuth mis en cache : PayPal le délivre pour ~9 h. */
let jetonCache = null;

/** Marge de sécurité avant expiration, pour ne pas utiliser un jeton périmé. */
const MARGE_EXPIRATION_MS = 60 * 1000;

async function getAccessToken() {
    if (!isConfigured) {
        throw new Error("PayPal non configuré : renseignez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET");
    }
    if (jetonCache && jetonCache.expireLe - MARGE_EXPIRATION_MS > Date.now()) {
        return jetonCache.valeur;
    }

    const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString("base64");
    const response = await fetch(`${host}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`Authentification PayPal refusée : ${data.error_description || response.status}`);
    }

    jetonCache = {
        valeur: data.access_token,
        expireLe: Date.now() + data.expires_in * 1000,
    };
    return jetonCache.valeur;
}

async function appelPayPal(chemin, { method = "POST", body } = {}) {
    const token = await getAccessToken();
    const response = await fetch(`${host}${chemin}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const detail = data.details?.[0]?.description || data.message || response.statusText;
        throw new Error(`PayPal : ${detail}`);
    }
    return data;
}

/** Convertit un montant TND vers la devise acceptée par PayPal. */
function convertirDepuisTND(montantTND) {
    const converti = Number(montantTND) * config.paypalTauxTND;
    return Math.max(0.01, Math.round(converti * 100) / 100);
}

/**
 * Crée une commande PayPal.
 * @param {{achatId: number, montantTND: number, secteur: string}} params
 * @returns {Promise<{orderId: string, montantPaiement: number, devisePaiement: string}>}
 */
async function createOrder({ achatId, montantTND, secteur }) {
    const montantPaiement = convertirDepuisTND(montantTND);

    const order = await appelPayPal("/v2/checkout/orders", {
        body: {
            intent: "CAPTURE",
            purchase_units: [
                {
                    // custom_id relie la transaction PayPal à notre achat : c'est
                    // ce qui permet de recouper les deux systèmes en cas de litige.
                    custom_id: String(achatId),
                    description: `Rapport sectoriel — ${secteur}`.slice(0, 127),
                    amount: {
                        currency_code: config.paypalCurrency,
                        value: montantPaiement.toFixed(2),
                    },
                },
            ],
            application_context: {
                brand_name: "InvestPlatform",
                user_action: "PAY_NOW",
                shipping_preference: "NO_SHIPPING",
            },
        },
    });

    return {
        orderId: order.id,
        montantPaiement,
        devisePaiement: config.paypalCurrency,
    };
}

/**
 * Encaisse une commande approuvée par l'acheteur.
 * @returns {Promise<{transactionId: string, statut: string, montant: number, devise: string, achatId: number|null}>}
 */
async function captureOrder(orderId) {
    const resultat = await appelPayPal(`/v2/checkout/orders/${orderId}/capture`);

    const unite = resultat.purchase_units?.[0];
    const capture = unite?.payments?.captures?.[0];

    return {
        transactionId: capture?.id || resultat.id,
        statut: resultat.status,
        montant: Number(capture?.amount?.value ?? 0),
        devise: capture?.amount?.currency_code || config.paypalCurrency,
        achatId: unite?.custom_id ? Number(unite.custom_id) : null,
    };
}

/** État de la configuration, exposé au panneau admin et au frontend. */
function statut() {
    return {
        configure: isConfigured,
        environnement: config.paypalEnv,
        devise: config.paypalCurrency,
        tauxTND: config.paypalTauxTND,
        clientId: config.paypalClientId || null,
        argentReel: config.paypalEnv === "live",
    };
}

module.exports = {
    createOrder,
    captureOrder,
    convertirDepuisTND,
    statut,
    isConfigured,
};
