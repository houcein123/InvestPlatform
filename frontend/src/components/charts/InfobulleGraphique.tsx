import type { TooltipContentProps } from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

import { formatNombre } from '@/lib/utils';

type Props = TooltipContentProps<ValueType, NameType> & { unite?: string };

/**
 * Infobulle commune a tous les graphiques.
 *
 * L'infobulle par defaut de Recharts ignore le theme : fond blanc sur
 * interface sombre. Celle-ci reprend les jetons de surface, et affiche l'unite
 * — un chiffre sans unite dans un rapport d'investissement ne vaut rien.
 */
export function InfobulleGraphique({ active, payload, label, unite }: Props) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="surface-card px-3 py-2 text-xs shadow-[var(--shadow-elevated)]">
      <p className="mb-1.5 font-semibold">{String(label ?? '')}</p>
      <ul className="space-y-1">
        {payload.map((entree, index) => (
          <li key={`${String(entree.dataKey)}-${index}`} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entree.color }}
              aria-hidden
            />
            <span className="text-[hsl(var(--muted))]">{String(entree.name ?? '')}</span>
            <span className="ml-auto tabular font-semibold">
              {formatNombre(Number(entree.value), 1)}
              {unite ? ` ${unite}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
