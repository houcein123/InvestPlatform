import * as React from 'react';
import { Search } from 'lucide-react';

import { cn } from '@/lib/utils';

import { Input } from './input';

/**
 * Primitives de tableau.
 *
 * Le conteneur porte `overflow-x-auto` : un tableau large doit defiler DANS sa
 * carte, jamais faire defiler la page entiere. C'est la difference entre une
 * mise en page qui tient sur mobile et une qui casse.
 */
export function TableWrapper({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full min-w-[42rem] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[hsl(var(--border))] text-left">{children}</tr>
    </thead>
  );
}

export function Th({
  className, children, numerique = false,
}: { className?: string; children?: React.ReactNode; numerique?: boolean }) {
  return (
    <th
      scope="col"
      className={cn(
        'whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted))]',
        numerique && 'text-right',
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[hsl(var(--border))]">{children}</tbody>;
}

export function Tr({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <tr className={cn('transition-colors hover:bg-[hsl(var(--surface-muted))]', className)}>
      {children}
    </tr>
  );
}

export function Td({
  className, children, numerique = false,
}: { className?: string; children?: React.ReactNode; numerique?: boolean }) {
  return (
    <td className={cn('px-3 py-3 align-middle', numerique && 'tabular text-right', className)}>
      {children}
    </td>
  );
}

/** Ligne unique occupant toute la largeur : vide, erreur ou chargement. */
export function TrMessage({ colonnes, children }: { colonnes: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colonnes} className="px-3 py-12 text-center text-sm text-[hsl(var(--muted))]">
        {children}
      </td>
    </tr>
  );
}

/** Champ de recherche, avec son icone et son etiquette accessible. */
export function ChampRecherche({
  valeur, onChange, placeholder = 'Rechercher…', className,
}: { valeur: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <div className={cn('relative w-full sm:max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[hsl(var(--muted))]" />
      <Input
        type="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={valeur}
        onChange={(evenement) => onChange(evenement.target.value)}
        className="pl-9"
      />
    </div>
  );
}
