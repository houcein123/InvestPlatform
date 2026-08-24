import { useMemo } from 'react';
import {
  Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { COULEUR_ACCENT_LIGNE, COULEUR_AXE, COULEUR_GRILLE, COULEUR_OBSERVE } from './palette';
import { InfobulleGraphique } from './InfobulleGraphique';

export interface PointMensuel {
  mois: string;
  total: number;
}

/**
 * Cumul et moyenne mobile sur une série mensuelle.
 *
 * Deux lectures superposées, et la superposition est le propos :
 *   - l'aire cumulée montre ce qui a été encaissé DEPUIS le début de la période ;
 *   - la ligne de moyenne mobile sur trois mois lisse les à-coups mensuels et
 *     laisse voir la tendance de fond.
 *
 * Un graphique en barres seul répond à « combien ce mois-ci ». Celui-ci répond
 * à « où en suis-je » et « dans quel sens ça va », qui sont les questions d'un
 * consultant en fin de trimestre.
 */
export function GraphiqueCumul({ donnees, unite = 'TND', hauteur = 280 }: {
  donnees: PointMensuel[]; unite?: string; hauteur?: number;
}) {
  const series = useMemo(() => {
    let cumul = 0;
    return donnees.map((point, index) => {
      cumul += point.total;

      // Moyenne mobile sur trois mois : sur les deux premiers points, la
      // fenêtre est incomplète, on moyenne sur ce qui existe plutôt que
      // d'afficher un trou ou une valeur faussement basse.
      const debut = Math.max(0, index - 2);
      const fenetre = donnees.slice(debut, index + 1);
      const moyenne = fenetre.reduce((somme, p) => somme + p.total, 0) / fenetre.length;

      return {
        mois: point.mois,
        Cumul: Math.round(cumul * 100) / 100,
        'Moyenne 3 mois': Math.round(moyenne * 100) / 100,
      };
    });
  }, [donnees]);

  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <ComposedChart data={series} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="remplissage-cumul" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COULEUR_OBSERVE} stopOpacity={0.3} />
            <stop offset="100%" stopColor={COULEUR_OBSERVE} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={COULEUR_GRILLE} vertical={false} />
        <XAxis dataKey="mois" tick={{ fill: COULEUR_AXE, fontSize: 11 }} tickLine={false}
          axisLine={{ stroke: COULEUR_GRILLE }} />
        <YAxis yAxisId="gauche" tick={{ fill: COULEUR_AXE, fontSize: 11 }} tickLine={false}
          axisLine={false} width={64} />
        <YAxis yAxisId="droite" orientation="right" tick={{ fill: COULEUR_AXE, fontSize: 11 }}
          tickLine={false} axisLine={false} width={56} />
        <Tooltip content={(props) => <InfobulleGraphique {...props} unite={unite} />} />
        <Legend wrapperStyle={{ fontSize: 12, color: COULEUR_AXE }} />

        <Area yAxisId="gauche" type="monotone" dataKey="Cumul" stroke={COULEUR_OBSERVE}
          strokeWidth={2.5} fill="url(#remplissage-cumul)" />
        <Line yAxisId="droite" type="monotone" dataKey="Moyenne 3 mois" stroke={COULEUR_ACCENT_LIGNE}
          strokeWidth={2} strokeDasharray="5 4" dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
