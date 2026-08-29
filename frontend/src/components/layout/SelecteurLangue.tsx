import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, Languages } from 'lucide-react';

import { LANGUES, useTraduction, type Langue } from '@/i18n';
import { fr } from '@/i18n/fr';
import { en } from '@/i18n/en';
import { cn } from '@/lib/utils';

/** Nom natif de chaque langue — « Français », jamais « French ». */
const ETIQUETTES: Record<Langue, { nom: string; court: string }> = {
  fr: fr.metaLangue,
  en: en.metaLangue,
};

/**
 * Sélecteur de langue.
 *
 * Chaque langue est écrite DANS sa propre langue. Un anglophone qui tombe sur
 * une interface française cherche « English », pas « Anglais » : traduire le
 * nom des langues dans la langue courante rend le sélecteur illisible
 * précisément pour ceux qui en ont besoin.
 *
 * Le code court (FR/EN) est affiché à côté du globe plutôt qu'un drapeau : un
 * drapeau désigne un pays, pas une langue, et l'anglais n'appartient à aucun
 * des marchés visés en particulier.
 */
export function SelecteurLangue() {
  const { langue, definirLangue, t } = useTraduction();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t.commun.changerLangue}
          className={cn(
            'flex items-center gap-1.5 rounded-[var(--radius-control)] px-2.5 py-2 text-sm font-medium transition-colors',
            'text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-muted))] hover:text-[hsl(var(--foreground))]',
            'data-[state=open]:bg-[hsl(var(--surface-muted))]',
          )}
        >
          <Languages className="size-4" />
          <span>{ETIQUETTES[langue].court}</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 w-44 rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-1.5 shadow-[var(--shadow-elevated)]"
        >
          {LANGUES.map((code) => (
            <DropdownMenu.Item
              key={code}
              onSelect={() => definirLangue(code)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius-control)] px-3 py-2 text-sm outline-none transition-colors',
                'data-[highlighted]:bg-[hsl(var(--surface-muted))]',
                code === langue && 'bg-[hsl(var(--primary-soft))] font-medium',
              )}
            >
              <span>{ETIQUETTES[code].nom}</span>
              {code === langue && <Check className="size-4 text-[hsl(var(--primary))]" />}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
