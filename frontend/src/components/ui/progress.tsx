import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface ProgressProps {
  /** Avancement en pourcentage (0 a 100). */
  valeur: number;
  className?: string;
  /** Reflet anime qui balaie la barre : signale qu'un travail est en cours meme quand le pourcentage stagne. */
  actif?: boolean;
}

/**
 * Barre de progression.
 *
 * Deux details qui comptent plus qu'il n'y parait sur une attente de 40 secondes :
 *
 *  1. La largeur est animee par un ressort, pas par une transition lineaire.
 *     Le serveur envoie des paliers (12 %, 28 %, 45 %...) ; sans lissage, la
 *     barre saute et donne l'impression d'un compteur casse.
 *
 *  2. Le reflet continue de balayer meme quand le pourcentage ne bouge pas.
 *     C'est le cas quand le service de redaction est sature et que le backend
 *     attend avant de reessayer : une barre parfaitement figee est
 *     indiscernable d'une page plantee.
 */
export function Progress({ valeur, className, actif = true }: ProgressProps) {
  const mouvementReduit = useReducedMotion();
  const borne = Math.max(0, Math.min(100, valeur));

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(borne)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]',
        className,
      )}
    >
      <motion.div
        className="relative h-full rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))]"
        initial={{ width: 0 }}
        animate={{ width: `${borne}%` }}
        transition={
          mouvementReduit
            ? { duration: 0 }
            : { type: 'spring', stiffness: 60, damping: 18, mass: 0.6 }
        }
      >
        {actif && !mouvementReduit && (
          <motion.span
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/35 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '400%' }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </motion.div>
    </div>
  );
}
