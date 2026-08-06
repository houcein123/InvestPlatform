// ============================================================================
// Client API — point de passage unique vers le backend.
// ----------------------------------------------------------------------------
// Plus aucune URL « http://localhost:3001 » en dur dans les composants : en
// développement, les chemins relatifs passent par le proxy Vite (voir
// vite.config.js) ; en production, VITE_API_URL pointe vers le backend déployé.
// ============================================================================

const BASE_URL = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "admin_token";

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

async function request(path, { method = "GET", body, auth = false } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth) {
        const token = tokenStorage.get();
        if (token) headers.Authorization = `Bearer ${token}`;
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

    // Une session expirée doit ramener à l'écran de connexion plutôt que
    // d'afficher une erreur incompréhensible au milieu du tableau de bord.
    if (response.status === 401 && auth) {
        tokenStorage.clear();
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new ApiError(data.error || "Une erreur est survenue", response.status);
    }
    return data;
}

export const api = {
    // ── Public (CDC §3 et §6) ──
    catalogue: () => request("/catalogue"),
    previewUrl: (sectorId) => `${BASE_URL}/api/catalogue/${sectorId}/preview`,

    createOrder: (sectorId) => request("/payment/create-order", { method: "POST", body: { sectorId } }),
    capturePayment: (achatId) => request("/payment/capture", { method: "POST", body: { achatId } }),

    generateReport: (sectorId, achatId) =>
        request("/report/generate", { method: "POST", body: { sectorId, achatId } }),
    reportStatus: (jobId) => request(`/report/status/${jobId}`),

    // ── Authentification admin ──
    login: (email, mot_de_passe) => request("/admin/login", { method: "POST", body: { email, mot_de_passe } }),
    register: (payload) => request("/admin/register", { method: "POST", body: payload }),
    me: () => request("/admin/me", { auth: true }),

    // ── Panneau admin (CDC §7) ──
    adminSecteurs: () => request("/admin/secteurs", { auth: true }),
    adminSecteur: (id) => request(`/admin/secteurs/${id}`, { auth: true }),
    updateSecteur: (id, payload) => request(`/admin/secteurs/${id}`, { method: "PUT", body: payload, auth: true }),

    chiffresCles: (id) => request(`/admin/secteurs/${id}/chiffres-cles`, { auth: true }),
    saveChiffresCles: (id, payload) =>
        request(`/admin/secteurs/${id}/chiffres-cles`, { method: "PUT", body: payload, auth: true }),

    zones: (id) => request(`/admin/secteurs/${id}/zones`, { auth: true }),
    createZone: (id, payload) => request(`/admin/secteurs/${id}/zones`, { method: "POST", body: payload, auth: true }),

    acteurs: (id) => request(`/admin/secteurs/${id}/acteurs`, { auth: true }),
    createActeur: (id, payload) => request(`/admin/secteurs/${id}/acteurs`, { method: "POST", body: payload, auth: true }),

    cadre: (id) => request(`/admin/secteurs/${id}/cadre`, { auth: true }),
    createCadre: (id, payload) => request(`/admin/secteurs/${id}/cadre`, { method: "POST", body: payload, auth: true }),

    deleteItem: (kind, itemId) => request(`/admin/${kind}/${itemId}`, { method: "DELETE", auth: true }),

    regenerer: (id) => request(`/admin/secteurs/${id}/regenerer`, { method: "POST", auth: true }),
    stats: () => request("/admin/stats", { auth: true }),
};
