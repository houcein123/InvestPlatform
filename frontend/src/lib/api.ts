/* ==========================================================================
   Client API — point de passage unique vers le backend.
   --------------------------------------------------------------------------
   Aucune URL de backend en dur dans les composants : en developpement, les
   chemins relatifs passent par le proxy Vite ; en production, VITE_API_URL
   pointe vers le backend deploye.
   ========================================================================== */

import type {
  AchatClient, CommandeCreee, Compte, ConfigPaiement, JobGeneration,
  PaiementConfirme, Secteur, StatSecteur,
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const TOKEN_KEY = 'tunisia_invest_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** URL absolue d'un fichier servi par la plateforme (PDF d'apercu ou de rapport). */
export function fileUrl(chemin: string) {
  return `${BASE_URL}${chemin}`;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

async function request<T>(path: string, { method = 'GET', body, auth = true }: Options = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  // Le jeton est joint des qu'il existe : le backend s'en sert aussi pour
  // rattacher un achat au compte du client connecte, sans jamais l'exiger.
  let jetonEnvoye = false;
  if (auth) {
    const token = tokenStorage.get();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      jetonEnvoye = true;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Serveur injoignable. Le backend est-il démarré ?', 0);
  }

  // Un 401 ne vaut invalidation du jeton que si ce jeton a effectivement ete
  // presente. Sans cette condition, un 401 sur un appel anonyme deconnectait
  // l'utilisateur alors que sa session etait parfaitement valide.
  if (response.status === 401 && jetonEnvoye) {
    tokenStorage.clear();
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError((data as { error?: string }).error ?? 'Une erreur est survenue', response.status);
  }
  return data as T;
}

type Json = Record<string, unknown>;

export const api = {
  // ── Comptes ──
  register: (payload: Json) =>
    request<{ token: string; compte: Compte }>('/auth/register', { method: 'POST', body: payload, auth: false }),
  login: (email: string, mot_de_passe: string) =>
    request<{ token: string; compte: Compte }>('/auth/login', { method: 'POST', body: { email, mot_de_passe }, auth: false }),
  me: () => request<{ compte: Compte }>('/auth/me'),
  updateProfil: (payload: Json) =>
    request<{ compte: Compte }>('/auth/profil', { method: 'PUT', body: payload }),
  changePassword: (payload: Json) =>
    request<{ success: boolean; message: string }>('/auth/mot-de-passe', { method: 'PUT', body: payload }),

  // ── Catalogue public (CDC section 3) ──
  catalogue: () => request<{ secteurs: Secteur[] }>('/catalogue', { auth: false }),
  secteur: (id: number) => request<{ secteur: Secteur }>(`/catalogue/${id}`, { auth: false }),
  previewUrl: (sectorId: number) => `${BASE_URL}/api/catalogue/${sectorId}/preview`,

  // ── Paiement (CDC section 6, etape 2) ──
  paymentConfig: () => request<ConfigPaiement>('/payment/config', { auth: false }),
  createOrder: (sectorId: number) =>
    request<CommandeCreee>('/payment/create-order', { method: 'POST', body: { sectorId } }),
  capturePayment: (orderId: string | null, achatId: number, payeur: Json = {}) =>
    request<PaiementConfirme>('/payment/capture', { method: 'POST', body: { orderId, achatId, ...payeur } }),

  // ── Génération (CDC section 6, etape 3) ──
  generateReport: (sectorId: number, achatId: number) =>
    request<{ jobId: string; dureeEstimeeSec: number }>('/report/generate', { method: 'POST', body: { sectorId, achatId } }),
  reportStatus: (jobId: string) => request<{ job: JobGeneration }>(`/report/status/${jobId}`, { auth: false }),
  mesRapports: () => request<{ achats: AchatClient[] }>('/report/mes-rapports'),
  relancerRapport: (achatId: number) =>
    request<{ jobId: string }>('/report/relancer', { method: 'POST', body: { achatId } }),

  // ── Panneau de controle (CDC section 7) ──
  adminSecteurs: () => request<{ secteurs: Secteur[] }>('/admin/secteurs'),
  adminSecteur: (id: number) => request<Json>(`/admin/secteurs/${id}`),
  updateSecteur: (id: number, payload: Json) =>
    request<{ secteur: Secteur }>(`/admin/secteurs/${id}`, { method: 'PUT', body: payload }),

  chiffresCles: (id: number) => request<Json>(`/admin/secteurs/${id}/chiffres-cles`),
  saveChiffresCles: (id: number, payload: Json) =>
    request<Json>(`/admin/secteurs/${id}/chiffres-cles`, { method: 'PUT', body: payload }),

  statistiques: (id: number) => request<Json>(`/admin/secteurs/${id}/statistiques`),
  createZone: (id: number, payload: Json) =>
    request<Json>(`/admin/secteurs/${id}/zones`, { method: 'POST', body: payload }),
  createActeur: (id: number, payload: Json) =>
    request<Json>(`/admin/secteurs/${id}/acteurs`, { method: 'POST', body: payload }),
  createCadre: (id: number, payload: Json) =>
    request<Json>(`/admin/secteurs/${id}/cadre`, { method: 'POST', body: payload }),
  deleteItem: (kind: string, itemId: number) =>
    request<{ success: boolean }>(`/admin/${kind}/${itemId}`, { method: 'DELETE' }),

  benchmarks: (id: number) => request<Json>(`/admin/secteurs/${id}/benchmarks`),
  saveBenchmark: (benchmarkId: number, payload: Json) =>
    request<Json>(`/admin/benchmarks/${benchmarkId}`, { method: 'PUT', body: payload }),

  rapports: () => request<Json>('/admin/rapports'),
  rapport: (rapportId: number) => request<Json>(`/admin/rapports/${rapportId}`),
  updateRapport: (rapportId: number, narratives: unknown) =>
    request<Json>(`/admin/rapports/${rapportId}`, { method: 'PUT', body: { narratives } }),

  recalculerProjections: (id: number) =>
    request<Json>(`/admin/secteurs/${id}/projections`, { method: 'POST' }),
  regenererRapport: (id: number) =>
    request<Json>(`/admin/secteurs/${id}/regenerer`, { method: 'POST' }),
  /** Regeneration administrative d'un rapport : maintenance du catalogue, sans achat. */
  regenerer: (id: number) =>
    request<Json>(`/admin/secteurs/${id}/regenerer`, { method: 'POST' }),

  stats: () => request<{ parSecteur: StatSecteur[]; chiffreAffaires: number; devise: string; rapportsRecents: unknown[] }>('/admin/stats'),
  systeme: () => request<Json>('/admin/systeme'),
  comptes: () => request<{ comptes: Compte[] }>('/admin/comptes'),
  setRole: (id: number, role: string) =>
    request<{ compte: Compte }>(`/admin/comptes/${id}/role`, { method: 'PUT', body: { role } }),

  // ── Analyse comparative (publique) ──
  analyseSecteurs: () => request<Json>('/analyse/secteurs', { auth: false }),
  analyseRegionale: () => request<Json>('/analyse/regional', { auth: false }),
};
