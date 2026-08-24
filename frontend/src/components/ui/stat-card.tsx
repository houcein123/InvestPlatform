import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Props {
  libelle: string;
  valeur: string;
  Icone: LucideIcon;
  detail?: string;
  /** Teinte d'accent de la pastille : distingue les familles d'indicateurs. */
  teinte?: 'primaire' | 'accent' | 'succes' | 'neutre';
  index?: number;
}

const TEINTES: Record<NonNullable<Props['teinte']>, string> = {
  primaire: 'bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]',
  accent: 'bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))]',
  succes: 'bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]',
  neutre: 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))]',
};

/**
 * Carte d'indicateur.
 *
 * La valeur est en chasse fixe : sur une rangee de quatre cartes, des chiffres
 * proportionnels donnent des alignements differents a chaque rafraichissement.
 */
export function StatCard({ libelle, valeur, Icone, detail, teinte = 'primaire', index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.24) }}
      className="surface-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[hsl(var(--muted))]">{libelle}</p>
        <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', TEINTES[teinte])}>
          <Icone className="size-4" />
        </span>
      </div>
      <p className="tabular mt-3 font-display text-2xl font-bold">{valeur}</p>
      {detail && <p className="mt-1 text-xs text-[hsl(var(--muted))]">{detail}</p>}
    </motion.div>
  );
}
