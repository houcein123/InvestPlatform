import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api';

/**
 * Configuration de TanStack Query.
 *
 * Deux reglages meritent d'etre justifies :
 *
 *  - `retry` ignore volontairement les erreurs 4xx. Reessayer un 401, un 403
 *    ou un 404 ne peut pas reussir : cela ne fait que retarder l'affichage du
 *    message et tripler la charge. Seules les pannes reseau et les 5xx sont
 *    rejouees.
 *
 *  - `staleTime` d'une minute. Le catalogue et les donnees sectorielles
 *    changent a l'echelle de la semaine, pas de la seconde : refaire la
 *    requete a chaque retour d'onglet ferait clignoter l'interface sans jamais
 *    afficher autre chose.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (tentative, erreur) => {
        if (erreur instanceof ApiError && erreur.status >= 400 && erreur.status < 500) {
          return false;
        }
        return tentative < 2;
      },
    },
    mutations: {
      // Une mutation rejouee peut creer un second achat ou un second
      // encaissement : jamais de reprise automatique sur une ecriture.
      retry: false,
    },
  },
});

/** Cles de cache centralisees : une faute de frappe ne doit pas creer un cache fantome. */
export const cles = {
  catalogue: ['catalogue'] as const,
  secteur: (id: number) => ['catalogue', id] as const,
  configPaiement: ['paiement', 'config'] as const,
  moi: ['auth', 'moi'] as const,
  mesRapports: ['rapports', 'mes-rapports'] as const,
  jobRapport: (jobId: string) => ['rapports', 'job', jobId] as const,
  adminStats: ['admin', 'stats'] as const,
  adminSecteurs: ['admin', 'secteurs'] as const,
  adminSecteur: (id: number) => ['admin', 'secteurs', id] as const,
  adminComptes: ['admin', 'comptes'] as const,
  adminSysteme: ['admin', 'systeme'] as const,
  analyseSecteurs: ['analyse', 'secteurs'] as const,
  analyseRegionale: ['analyse', 'regional'] as const,
};
