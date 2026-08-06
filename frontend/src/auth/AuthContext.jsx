import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [compte, setCompte] = useState(null);
  const [loading, setLoading] = useState(true);

  // Au chargement, un jeton en localStorage est revalidé auprès du backend :
  // un jeton expiré, révoqué ou dont le compte a changé de rôle ne doit pas
  // donner l'illusion d'être connecté.
  useEffect(() => {
    if (!tokenStorage.get()) {
      setLoading(false);
      return;
    }
    api.me()
      .then((data) => setCompte(data.compte))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, donneesCompte) => {
    tokenStorage.set(token);
    setCompte(donneesCompte);
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setCompte(null);
  }, []);

  /** Après modification du profil, garder l'affichage synchronisé. */
  const rafraichir = useCallback((donneesCompte) => setCompte(donneesCompte), []);

  const value = useMemo(() => ({
    compte,
    loading,
    estConnecte: !!compte,
    estAdmin: compte?.role === 'admin',
    login,
    logout,
    rafraichir,
  }), [compte, loading, login, logout, rafraichir]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return context;
}

/** Destination après connexion : le rôle stocké en base décide, pas le formulaire. */
export function accueilSelonRole(compte) {
  return compte?.role === 'admin' ? '/admin' : '/';
}
