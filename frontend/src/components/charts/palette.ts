/**
 * Palette des graphiques.
 *
 * Six teintes pour six secteurs, differenciees par la TEINTE et pas seulement
 * par la luminosite : un degrade d'une meme couleur devient illisible des que
 * deux series se croisent, et l'est encore moins pour un daltonien.
 *
 * Les valeurs sont lues depuis les jetons CSS, donc suivent le thème clair /
 * sombre sans duplication.
 */
export const COULEURS_SERIES = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-6))',
] as const;

export const COULEUR_OBSERVE = 'hsl(var(--primary))';

/** Les estimations sont rendues dans une teinte distincte, jamais confondue avec l'observe. */
export const COULEUR_ESTIME = 'hsl(var(--accent))';

/** Seconde serie superposee a une premiere : doit s'en distinguer nettement. */
export const COULEUR_ACCENT_LIGNE = 'hsl(var(--chart-4))';

export const COULEUR_GRILLE = 'hsl(var(--border))';
export const COULEUR_AXE = 'hsl(var(--muted))';

export function couleurSerie(index: number) {
  return COULEURS_SERIES[index % COULEURS_SERIES.length];
}
