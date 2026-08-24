import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/lib/utils';

import { groupesVisibles, type Groupe } from './navigation';

/** Le groupe contient-il la route affichée ? */
function groupeActif(groupe: Groupe, chemin: string) {
  return groupe.liens.some((lien) =>
    lien.exact ? chemin === lien.to : chemin === lien.to || chemin.startsWith(`${lien.to}/`));
}

/**
 * Barre de navigation horizontale.
 *
 * Les entrees d'un meme domaine sont REGROUPEES sous un menu deroulant : mises
 * a plat, les quatorze liens deborderaient de la barre bien avant un ecran
 * d'ordinateur portable. Un groupe d'un seul lien reste un lien direct — ouvrir
 * un menu pour un unique choix serait un clic gratuit.
 */
export function BarreNavigation() {
  const { estConnecte, estAdmin } = useAuth();
  const { pathname } = useLocation();
  const groupes = groupesVisibles(estConnecte, estAdmin);

  return (
    <nav aria-label="Navigation principale" className="flex items-center gap-1">
      {groupes.map((groupe) => {
        const actif = groupeActif(groupe, pathname);

        if (groupe.liens.length === 1) {
          const lien = groupe.liens[0];
          return (
            <NavLink
              key={groupe.cle}
              to={lien.to}
              end={lien.exact}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="onglet-actif"
                      className="absolute inset-0 rounded-[var(--radius-control)] bg-[hsl(var(--primary-soft))]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <lien.Icone className={cn('relative size-4', isActive && 'text-[hsl(var(--primary))]')} />
                  <span className="relative whitespace-nowrap">{groupe.libelle}</span>
                </>
              )}
            </NavLink>
          );
        }

        return (
          <DropdownMenu.Root key={groupe.cle}>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className={cn(
                  'relative flex items-center gap-2 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors',
                  'data-[state=open]:bg-[hsl(var(--surface-muted))]',
                  actif
                    ? 'text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]',
                )}
              >
                {actif && (
                  <motion.span
                    layoutId="onglet-actif"
                    className="absolute inset-0 rounded-[var(--radius-control)] bg-[hsl(var(--primary-soft))]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <groupe.Icone className={cn('relative size-4', actif && 'text-[hsl(var(--primary))]')} />
                <span className="relative whitespace-nowrap">{groupe.libelle}</span>
                <ChevronDown className="relative size-3.5 transition-transform data-[state=open]:rotate-180" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="start"
                sideOffset={6}
                className="z-50 w-72 rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1.5 shadow-[var(--shadow-elevated)]"
              >
                {groupe.liens.map((lien) => (
                  <DropdownMenu.Item key={lien.to} asChild>
                    <NavLink
                      to={lien.to}
                      end={lien.exact}
                      className={({ isActive }) =>
                        cn(
                          'flex cursor-pointer items-start gap-3 rounded-[var(--radius-control)] px-3 py-2.5 outline-none transition-colors',
                          'data-[highlighted]:bg-[hsl(var(--surface-muted))]',
                          isActive && 'bg-[hsl(var(--primary-soft))]',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <lien.Icone
                            className={cn(
                              'mt-0.5 size-4 shrink-0',
                              isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted))]',
                            )}
                          />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{lien.libelle}</span>
                            {lien.detail && (
                              <span className="mt-0.5 block text-xs leading-snug text-[hsl(var(--muted))]">
                                {lien.detail}
                              </span>
                            )}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        );
      })}
    </nav>
  );
}
