import {
  Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useTraduction } from '@/i18n';
import { useChampTraduit } from '@/i18n/donnees';
import type { StatSecteur } from '@/lib/types';

import { COULEUR_AXE, COULEUR_GRILLE, couleurSerie } from './palette';
import { InfobulleGraphique } from './InfobulleGraphique';

/**
 * Ventes par secteur.
 *
 * Les ventes SIMULEES sont empilees a part, dans une teinte neutre : les
 * additionner au chiffre d'affaires réel donnerait un tableau de bord
 * mensonger, et c'est exactement l'erreur que la colonne
 * `achats.mode_paiement` sert a eviter cote base.
 */
export function GraphiqueVentes({ donnees }: { donnees: StatSecteur[] }) {
  const { t } = useTraduction();
  const champ = useChampTraduit();
  const series = donnees.map((secteur) => ({
    // Le nom sert d'etiquette d'axe : il doit suivre la langue, comme la
    // legende du camembert voisin, sinon les deux graphiques d'un meme ecran
    // designent les memes secteurs par des noms differents.
    nom: champ(secteur, 'nom'),
    Reel: Number(secteur.revenu ?? 0),
    Simule: Number(secteur.revenu_simule ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={series} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={COULEUR_GRILLE} vertical={false} />
        <XAxis
          dataKey="nom"
          tick={{ fill: COULEUR_AXE, fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: COULEUR_GRILLE }}
          interval={0}
          angle={-18}
          textAnchor="end"
          height={64}
        />
        <YAxis
          tick={{ fill: COULEUR_AXE, fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip
          cursor={{ fill: 'hsl(var(--surface-muted))' }}
          content={(props) => <InfobulleGraphique {...props} unite="TND" />}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: COULEUR_AXE }} />
        <Bar dataKey="Reel" name={t.admin.legendeReel} radius={[6, 6, 0, 0]} maxBarSize={44}>
          {series.map((_, index) => (
            <Cell key={index} fill={couleurSerie(index)} />
          ))}
        </Bar>
        <Bar
          dataKey="Simule"
          name={t.admin.legendeSimule}
          radius={[6, 6, 0, 0]}
          maxBarSize={44}
          fill="hsl(var(--muted) / 0.35)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
