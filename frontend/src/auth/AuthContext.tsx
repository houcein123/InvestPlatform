import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { api, tokenStorage } from '@/lib/api';
import type { Compte } from '@/lib/types';

interface ContexteAuth {
  compte: Compte | null;
  chargement: boolean;
  estConnecte: boolean;
  estAdmin: boolean;
  connecter: (email: string, motDePasse: string) => Promise<Compte>;
  inscrire: (payload: Record<string, unknown>) => Promise<Compte>;
  deconnecter: () => void;
  rafraichir: (compte: Compte) => void;
}

const Contexte = createContext<ContexteAuth | null>(null);

/**
 * Session du navigateur.
 *
 * Le compte est revalide aupres du serveur au chargement : un jeton encore
 * present dans le stockage local ne prouve rien, le role peut avoir change ou
 * le compte avoir ete desactive entre deux visites.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [compte, setCompte] = useState<Compte | null>(null);
  const [chargement, setChargement] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    let annule = false;

    if (!tokenStorage.get()) {
      setChargement(false);
      return () => { annule = true; };
    }

    api.me()
      .then((reponse) => { if (!annule) setCompte(reponse.compte); })
      .catch(() => { tokenStorage.clear(); })
      .finally(() => { if (!annule) setChargement(false); });

    return () => { annule = true; };
  }, []);

  const connecter = useCallback(async (email: string, motDePasse: string) => {
    const reponse = await api.login(email, motDePasse);
    tokenStorage.set(reponse.token);
    setCompte(reponse.compte);
    return reponse.compte;
  }, []);

  const inscrire = useCallback(async (payload: Record<string, unknown>) => {
    const reponse = await api.register(payload);
    tokenStorage.set(reponse.token);
    setCompte(reponse.compte);
    return reponse.compte;
  }, []);

  const deconnecter = useCallback(() => {
    tokenStorage.clear();
    setCompte(null);
    // Le cache contient des donnees du compte precedent (espace client,
    // panneau de controle) : le vider evite qu'elles reapparaissent
    // brievement a la prochaine connexion.
    queryClient.clear();
  }, [queryClient]);

  const valeur = useMemo<ContexteAuth>(() => ({
    compte,
    chargement,
    estConnecte: compte !== null,
    estAdmin: compte?.role === 'admin',
    connecter,
    inscrire,
    deconnecter,
    rafraichir: setCompte,
  }), [compte, chargement, connecter, inscrire, deconnecter]);

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth() {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error('useAuth doit etre utilise a l’interieur de AuthProvider');
  return contexte;
}
