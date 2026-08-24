import { Cpu, Factory, Leaf, Shirt, Sun, Truck } from 'lucide-react';

/**
 * Pictogramme du secteur.
 *
 * Associe au slug et non au libelle : le nom affiche peut etre modifie depuis
 * le panneau de controle, le slug est stable.
 */
const ICONES: Record<string, { Icone: typeof Leaf; classe: string }> = {
  tourisme: { Icone: Sun, classe: 'from-amber-500/25 to-orange-500/10 text-amber-500' },
  agriculture: { Icone: Leaf, classe: 'from-emerald-500/25 to-green-500/10 text-emerald-500' },
  technologies: { Icone: Cpu, classe: 'from-blue-500/25 to-indigo-500/10 text-blue-500' },
  energies: { Icone: Sun, classe: 'from-lime-500/25 to-emerald-500/10 text-lime-500' },
  textile: { Icone: Shirt, classe: 'from-fuchsia-500/25 to-purple-500/10 text-fuchsia-500' },
  logistique: { Icone: Truck, classe: 'from-cyan-500/25 to-sky-500/10 text-cyan-500' },
};

export function IconeSecteur({ slug, taille = 'md' }: { slug: string; taille?: 'sm' | 'md' }) {
  const { Icone, classe } = ICONES[slug] ?? { Icone: Factory, classe: 'from-slate-500/25 to-slate-500/10 text-slate-400' };
  const dimension = taille === 'sm' ? 'size-9' : 'size-11';

  return (
    <span
      aria-hidden
      className={`grid ${dimension} shrink-0 place-items-center rounded-xl bg-gradient-to-br ${classe}`}
    >
      <Icone className={taille === 'sm' ? 'size-4' : 'size-5'} />
    </span>
  );
}
