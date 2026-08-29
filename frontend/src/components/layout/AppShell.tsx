import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Menu, Moon, Sun, TrendingUp, X } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { useTraduction } from '@/i18n';
import { Button } from '@/components/ui/button';
import { cn, initiales } from '@/lib/utils';

import { BarreNavigation } from './BarreNavigation';
import { PiedDePage } from './PiedDePage';
import { Sidebar } from './Sidebar';
import { SelecteurLangue } from './SelecteurLangue';
import { useTheme } from './ThemeProvider';

/**
 * Ossature du portail : en-tete, navigation laterale, zone de contenu.
 *
 * La navigation est un tiroir sur mobile et une colonne fixe au-dela de 1024 px.
 * Le contenu est anime a chaque changement de route, mais avec un mouvement
 * tres court (16 px, 200 ms) : une transition demonstrative sur un outil que
 * l'on consulte plusieurs fois par jour devient vite une gene.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { compte, estConnecte, deconnecter } = useAuth();
  const { theme, basculer } = useTheme();
  const { t } = useTraduction();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const location = useLocation();

  return (
    <div className="app-backdrop min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.85)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={t.commun.ouvrirNavigation}
            onClick={() => setTiroirOuvert(true)}
          >
            <Menu />
          </Button>

          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-[hsl(var(--primary-foreground))]">
              <TrendingUp className="size-5" />
            </span>
            <span className="hidden font-display text-base font-bold tracking-tight sm:block">
              Tunisia Invest
            </span>
          </Link>

          {/* Navigation horizontale : masquee sous 1024 px, ou le tiroir
              prend le relais. */}
          <div className="ml-6 hidden lg:block">
            <BarreNavigation />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <SelecteurLangue />

            <Button
              variant="ghost"
              size="icon"
              onClick={basculer}
              aria-label={theme === 'dark' ? t.commun.themeClair : t.commun.themeSombre}
            >
              {theme === 'dark' ? <Sun /> : <Moon />}
            </Button>

            {estConnecte ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-right sm:block">
                  <span className="block text-sm font-semibold leading-tight">
                    {compte?.prenom} {compte?.nom}
                  </span>
                  <span className="block text-xs text-[hsl(var(--muted))]">
                    {compte?.role === 'admin' ? t.role.administrateur : t.role.client}
                  </span>
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-[hsl(var(--primary-soft))] text-sm font-bold text-[hsl(var(--primary))]">
                  {initiales(compte?.prenom, compte?.nom)}
                </span>
                <Button variant="ghost" size="icon" onClick={deconnecter} aria-label={t.commun.seDeconnecter}>
                  <LogOut />
                </Button>
              </div>
            ) : (
              <Button asChild size="sm">
                <Link to="/login">{t.commun.seConnecter}</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1600px]">
        <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <PiedDePage />
        </div>
      </div>

      {/* Tiroir de navigation mobile */}
      <AnimatePresence>
        {tiroirOuvert && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setTiroirOuvert(false)}
            />
            <motion.aside
              className={cn(
                'fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto lg:hidden',
                'border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))]',
              )}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
                <span className="font-display font-bold">Navigation</span>
                <Button variant="ghost" size="icon" onClick={() => setTiroirOuvert(false)} aria-label={t.commun.fermer}>
                  <X />
                </Button>
              </div>
              <div onClick={() => setTiroirOuvert(false)}>
                <Sidebar />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
