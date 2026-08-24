import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Fusionne des classes Tailwind en resolvant les conflits (la derniere gagne). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Montant formate pour un portail financier.
 *
 * Le dinar tunisien n'a pas de symbole court universel : on affiche le code
 * ISO, ce qui evite toute ambiguite avec le dinar algerien ou libyen dans un
 * document destine a des investisseurs etrangers.
 */
export function formatMontant(valeur: number | string | null | undefined, devise = 'TND') {
  const nombre = typeof valeur === 'string' ? Number(valeur) : valeur;
  if (nombre === null || nombre === undefined || Number.isNaN(nombre)) return '—';

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(nombre) + ' ' + devise;
}

/** Nombre compact pour les cartes de synthese (12 400 -> 12,4 k). */
export function formatNombre(valeur: number | string | null | undefined, decimales = 0) {
  const nombre = typeof valeur === 'string' ? Number(valeur) : valeur;
  if (nombre === null || nombre === undefined || Number.isNaN(nombre)) return '—';

  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(nombre);
}

export function formatDate(valeur: string | null | undefined, avecHeure = false) {
  if (!valeur) return '—';
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(avecHeure ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

/** Initiales d'un compte, pour les pastilles d'avatar. */
export function initiales(prenom?: string | null, nom?: string | null) {
  const a = (prenom ?? '').trim().charAt(0);
  const b = (nom ?? '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}
