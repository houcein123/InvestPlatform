// ============================================================================
// Client API — point de passage unique vers le backend.
// ----------------------------------------------------------------------------
// Aucune URL de backend en dur dans les composants : en développement, les
// chemins relatifs passent par le proxy Vite (voir vite.config.js) ; en
// production, VITE_API_URL pointe vers le backend déployé.
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "investplatform_token";

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** URL absolue d'un fichier servi par le backend (PDF d'aperçu ou de rapport). */
export function fileUrl(path) {
    return `${BASE_URL}${path}`;
}

export class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    // Le jeton est joint dès qu'il existe : le backend s'en sert aussi pour
    // rattacher un achat au compte du client connecté.
    let jetonEnvoye = false;
    if (auth) {
        const token = tokenStorage.get();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
            jetonEnvoye = true;
        }
    }

    let response;
    try {
        response = await fetch(`${BASE_URL}/api${path}`, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new ApiError("Serveur injoignable. Le backend est-il démarré ?", 0);
    }

    // Un 401 ne vaut invalidation du jeton que si ce jeton a effectivement été
    // présenté. Sans cette condition, un 401 sur un appel anonyme déconnectait
    // l'utilisateur alors que sa session était parfaitement valide.
    if (response.status === 401 && jetonEnvoye) {
        tokenStorage.clear();
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(data.error || "Une erreur est survenue", response.status);
    }
    return data;
}

export const api = {
    // ── Comptes ──
    register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
    login: (email, mot_de_passe) => request("/auth/login", { method: "POST", body: { email, mot_de_passe }, auth: false }),
    me: () => request("/auth/me"),
    updateProfil: (payload) => request("/auth/profil", { method: "PUT", body: payload }),
    changePassword: (payload) => request("/auth/mot-de-passe", { method: "PUT", body: payload }),

    // ── Catalogue public (CDC §3) ──
    catalogue: () => request("/catalogue", { auth: false }),
    previewUrl: (sectorId) => `${BASE_URL}/api/catalogue/${sectorId}/preview`,

    // ── Paiement PayPal (CDC §6, étape 2) ──
    paymentConfig: () => request("/payment/config", { auth: false }),
    createOrder: (sectorId) => request("/payment/create-order", { method: "POST", body: { sectorId } }),
    capturePayment: (orderId, achatId, payeur = {}) =>
        request("/payment/capture", { method: "POST", body: { orderId, achatId, ...payeur } }),

    // ── Génération (CDC §6, étape 3) ──
    generateReport: (sectorId, achatId) => request("/report/generate", { method: "POST", body: { sectorId, achatId } }),
    reportStatus: (jobId) => request(`/report/status/${jobId}`, { auth: false }),
    mesRapports: () => request("/report/mes-rapports"),
    relancerRapport: (achatId) => request("/report/relancer", { method: "POST", body: { achatId } }),

    // ── Panneau de contrôle (CDC §7) ──
    adminSecteurs: () => request("/admin/secteurs"),
    adminSecteur: (id) => request(`/admin/secteurs/${id}`),
    updateSecteur: (id, payload) => request(`/admin/secteurs/${id}`, { method: "PUT", body: payload }),

    chiffresCles: (id) => request(`/admin/secteurs/${id}/chiffres-cles`),
    saveChiffresCles: (id, payload) => request(`/admin/secteurs/${id}/chiffres-cles`, { method: "PUT", body: payload }),

    createZone: (id, payload) => request(`/admin/secteurs/${id}/zones`, { method: "POST", body: payload }),
    createActeur: (id, payload) => request(`/admin/secteurs/${id}/acteurs`, { method: "POST", body: payload }),
    createCadre: (id, payload) => request(`/admin/secteurs/${id}/cadre`, { method: "POST", body: payload }),
    deleteItem: (kind, itemId) => request(`/admin/${kind}/${itemId}`, { method: "DELETE" }),

    benchmarks: (id) => request(`/admin/secteurs/${id}/benchmarks`),
    saveBenchmark: (benchmarkId, payload) =>
        request(`/admin/benchmarks/${benchmarkId}`, { method: "PUT", body: payload }),

    rapports: () => request("/admin/rapports"),
    rapport: (rapportId) => request(`/admin/rapports/${rapportId}`),
    updateRapport: (rapportId, narratives) =>
        request(`/admin/rapports/${rapportId}`, { method: "PUT", body: { narratives } }),

    regenerer: (id) => request(`/admin/secteurs/${id}/regenerer`, { method: "POST" }),
    recalculerProjections: (id) => request(`/admin/secteurs/${id}/projections`, { method: "POST" }),

    stats: () => request("/admin/stats"),
    systeme: () => request("/admin/systeme"),
    comptes: () => request("/admin/comptes"),
    setRole: (id, role) => request(`/admin/comptes/${id}/role`, { method: "PUT", body: { role } }),
};
