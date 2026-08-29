import {
  Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useTraduction } from '@/i18n';

import { COULEUR_AXE, couleurSerie } from './palette';
import { InfobulleGraphique } from './InfobulleGraphique';

export interface Origine {
  nom: string;
  valeur: number;
}

/**
 * Classement horizontal.
 *
 * Barres HORIZONTALES et non verticales : les libellés sont des noms de pays,
 * de longueur très inégale. En vertical, ils s'inclinent ou se tronquent ;
 * ici, ils se lisent normalement et le classement se parcourt de haut en bas,
 * comme une liste.
 */
export function GraphiqueOrigines({ donnees, hauteur }: { donnees: Origine[]; hauteur?: number }) {
  const { t } = useTraduction();
  if (donnees.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-[hsl(var(--muted))]">
        Aucune origine à afficher.
      </p>
    );
  }

  // La hauteur suit le nombre de barres : figée, elle écraserait huit pays ou
  // laisserait un grand vide sous deux.
  const hauteurCalculee = hauteur ?? Math.max(180, donnees.length * 34 + 20);

  return (
    <ResponsiveContainer width="100%" height={hauteurCalculee}>
      <BarChart data={donnees} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 0 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="nom"
          width={128}
          tick={{ fill: COULEUR_AXE, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--surface-muted))' }}
          content={(props) => <InfobulleGraphique {...props} unite="demande(s)" />}
        />
        <Bar dataKey="valeur" name={t.admin.serieDemandes} radius={[0, 6, 6, 0]} maxBarSize={22}>
          {donnees.map((origine, index) => (
            <Cell key={origine.nom} fill={couleurSerie(index)} />
          ))}
          <LabelList
            dataKey="valeur"
            position="right"
            style={{ fill: COULEUR_AXE, fontSize: 11, fontVariantNumeric: 'tabular-nums' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
