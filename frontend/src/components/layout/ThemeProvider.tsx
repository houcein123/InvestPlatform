import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

const CLE = 'tunisia_invest_theme';

const Contexte = createContext<{ theme: Theme; basculer: () => void }>({
  theme: 'dark',
  basculer: () => {},
});

/**
 * Theme clair / sombre.
 *
 * Le choix explicite de l'utilisateur prime ; a defaut, on suit le reglage du
 * systeme. La classe est posee sur <html> avant le premier rendu (dans
 * index.html) pour eviter le flash de thème clair au chargement.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const enregistre = localStorage.getItem(CLE) as Theme | null;
    if (enregistre === 'dark' || enregistre === 'light') return enregistre;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(CLE, theme);
  }, [theme]);

  const basculer = useCallback(() => {
    setTheme((actuel) => (actuel === 'dark' ? 'light' : 'dark'));
  }, []);

  return <Contexte.Provider value={{ theme, basculer }}>{children}</Contexte.Provider>;
}

export const useTheme = () => useContext(Contexte);
