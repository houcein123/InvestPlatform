import { NavLink } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/lib/utils';

import { groupesVisibles } from './navigation';

/**
 * Navigation du tiroir mobile.
 *
 * Meme table de liens que la barre horizontale, mais deployee : sur un ecran
 * etroit, un menu deroulant a l'interieur d'un tiroir ferait deux niveaux
 * d'ouverture pour atteindre un lien.
 */
export function Sidebar() {
  const { estConnecte, estAdmin } = useAuth();
  const groupes = groupesVisibles(estConnecte, estAdmin);

  return (
    <nav aria-label="Navigation" className="flex flex-col gap-1 p-3">
      {groupes.map((groupe) => (
        <div key={groupe.cle} className="space-y-1">
          <p className="px-3 pb-1 pt-4 text-[0.6875rem] font-semibold uppercase tracking-wider text-[hsl(var(--muted))]">
            {groupe.libelle}
          </p>

          {groupe.liens.map(({ to, libelle, Icone, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[hsl(var(--primary-soft))] text-[hsl(var(--foreground))]'
                    : 'text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icone className={cn('size-4', isActive && 'text-[hsl(var(--primary))]')} />
                  <span>{libelle}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      ))}

      {estAdmin && (
        <p className="mt-4 flex items-center gap-2 px-3 text-[0.6875rem] text-[hsl(var(--muted))]">
          <ShieldCheck className="size-3" /> Accès administrateur
        </p>
      )}
    </nav>
  );
}
