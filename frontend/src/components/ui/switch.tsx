import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';

import { cn } from '@/lib/utils';

/**
 * Interrupteur.
 *
 * Radix pose le role ARIA et la gestion clavier ; le style reprend les jetons
 * de la charte. La piste change de couleur ET le curseur se deplace : sur un
 * ecran en niveaux de gris, la seule couleur ne suffirait pas a lire l'etat.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent transition-colors',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-[hsl(var(--primary))]',
      'data-[state=unchecked]:bg-[hsl(var(--surface-muted))]',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-5 rounded-full bg-white shadow-lg ring-0',
        'transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';

interface LigneReglageProps {
  titre: string;
  description?: string;
  children: React.ReactNode;
}

/** Ligne de reglage : libelle a gauche, controle a droite. */
export function LigneReglage({ titre, description, children }: LigneReglageProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{titre}</p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-[hsl(var(--muted))]">{description}</p>
        )}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}
