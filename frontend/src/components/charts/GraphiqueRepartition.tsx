import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { formatNombre } from '@/lib/utils';

import { COULEUR_AXE, couleurSerie } from './palette';
import { InfobulleGraphique } from './InfobulleGraphique';

export interface PartRepartition {
  nom: string;
  valeur: number;
}

interface Props {
  donnees: PartRepartition[];
  unite?: string;
  hauteur?: number;
  /** Anneau plutôt que camembert : laisse la place au total au centre. */
  total?: { valeur: string; libelle: string };
}

/**
 * Répartition en anneau.
 *
 * Choisi plutôt qu'un camembert plein : l'espace central accueille le total,
 * qui répond à la première question que pose toute répartition — « sur
 * combien ? ». Un pourcentage sans son assiette n'informe qu'à moitié.
 *
 * Les parts nulles sont écartées : une tranche d'épaisseur zéro produit une
 * entrée de légende que rien ne permet de relier au graphique.
 */
export function GraphiqueRepartition({ donnees, unite, hauteur = 260, total }: Props) {
  const parts = donnees.filter((part) => part.valeur > 0);

  if (parts.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[hsl(var(--muted))]">
        Aucune donnée à répartir pour le moment.
      </p>
    );
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={hauteur}>
        <PieChart>
          <Pie
            data={parts}
            dataKey="valeur"
            nameKey="nom"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            stroke="hsl(var(--surface))"
            strokeWidth={2}
          >
            {parts.map((part, index) => (
              <Cell key={part.nom} fill={couleurSerie(index)} />
            ))}
          </Pie>
          <Tooltip content={(props) => <InfobulleGraphique {...props} unite={unite} />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: 12, color: COULEUR_AXE }}
          />
        </PieChart>
      </ResponsiveContainer>

      {total && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center justify-center"
          style={{ height: hauteur - 36 }}
        >
          <span className="tabular font-display text-xl font-bold">{total.valeur}</span>
          <span className="text-[0.6875rem] text-[hsl(var(--muted))]">{total.libelle}</span>
        </div>
      )}
    </div>
  );
}

/** Somme des parts, pour le libellé central. */
export function totalRepartition(donnees: PartRepartition[]) {
  return formatNombre(donnees.reduce((somme, part) => somme + part.valeur, 0));
}
