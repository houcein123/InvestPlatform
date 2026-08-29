import { useMemo } from 'react';
import {
  Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { useTraduction } from '@/i18n';

import type { SerieStatistique } from '@/lib/types';

import { COULEUR_AXE, COULEUR_ESTIME, COULEUR_GRILLE, COULEUR_OBSERVE } from './palette';
import { InfobulleGraphique } from './InfobulleGraphique';

const ANNEES_OBSERVEES = [2020, 2021, 2022, 2023, 2024] as const;
const ANNEES_ESTIMEES = [2024, 2025, 2026, 2027, 2028] as const;

/**
 * Evolution d'un indicateur, observe puis estime.
 *
 * La distinction est PORTEE PAR LE GRAPHIQUE, pas seulement par la legende :
 * la courbe observee est pleine, l'estimation est pointillee et dans une autre
 * teinte, et une ligne verticale marque le passage de l'un a l'autre. Un
 * lecteur qui survole trois secondes doit voir ou s'arretent les donnees
 * publiees — presenter une extrapolation comme un fait serait la faute la plus
 * grave que puisse commettre ce produit.
 *
 * Une serie sans estimation (ajustement trop faible) n'affiche simplement pas
 * la seconde courbe : une case vide vaut mieux qu'un chiffre invente.
 */
export function GraphiqueSerie({ serie, hauteur = 260 }: { serie: SerieStatistique; hauteur?: number }) {
  const { t } = useTraduction();
  const donnees = useMemo(() => {
    const points = new Map<number, { annee: string; observe?: number | null; estime?: number | null }>();

    for (const annee of ANNEES_OBSERVEES) {
      const valeur = serie[`valeur_${annee}` as keyof SerieStatistique] as number | null;
      if (valeur !== null && valeur !== undefined) {
        points.set(annee, { annee: String(annee), observe: Number(valeur) });
      }
    }

    for (const annee of ANNEES_ESTIMEES) {
      const valeur = serie[`projection_${annee}` as keyof SerieStatistique] as number | null;
      if (valeur === null || valeur === undefined) continue;
      const existant = points.get(annee) ?? { annee: String(annee) };
      points.set(annee, { ...existant, estime: Number(valeur) });
    }

    // Le raccord : sans ce point commun, les deux courbes se touchent pas et
    // le graphique montre une rupture qui n'existe pas dans la donnee.
    const derniereObservee = [...ANNEES_OBSERVEES].reverse()
      .find((annee) => points.get(annee)?.observe !== undefined);
    if (derniereObservee !== undefined) {
      const point = points.get(derniereObservee);
      if (point && point.estime === undefined) point.estime = point.observe;
    }

    return [...points.entries()].sort(([a], [b]) => a - b).map(([, point]) => point);
  }, [serie]);

  const aDesEstimations = donnees.some((point) => point.estime !== undefined && point.estime !== null);
  const derniereObservee = [...donnees].reverse().find((point) => point.observe !== undefined)?.annee;

  return (
    <ResponsiveContainer width="100%" height={hauteur}>
      <AreaChart data={donnees} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="remplissage-observe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COULEUR_OBSERVE} stopOpacity={0.35} />
            <stop offset="100%" stopColor={COULEUR_OBSERVE} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke={COULEUR_GRILLE} vertical={false} />
        <XAxis dataKey="annee" tick={{ fill: COULEUR_AXE, fontSize: 11 }} tickLine={false} axisLine={{ stroke: COULEUR_GRILLE }} />
        <YAxis tick={{ fill: COULEUR_AXE, fontSize: 11 }} tickLine={false} axisLine={false} width={56} />
        <Tooltip content={(props) => <InfobulleGraphique {...props} unite={serie.unite ?? undefined} />} />
        <Legend wrapperStyle={{ fontSize: 12, color: COULEUR_AXE }} />

        {aDesEstimations && derniereObservee && (
          <ReferenceLine
            x={derniereObservee}
            stroke={COULEUR_AXE}
            strokeDasharray="4 4"
            label={{ value: 'derniere donnée publiée', fill: COULEUR_AXE, fontSize: 10, position: 'insideTopRight' }}
          />
        )}

        <Area
          type="monotone"
          dataKey="observe"
          name={t.admin.serieObservee}
          stroke={COULEUR_OBSERVE}
          strokeWidth={2.5}
          fill="url(#remplissage-observe)"
          connectNulls
          dot={{ r: 3, strokeWidth: 0, fill: COULEUR_OBSERVE }}
        />
        {aDesEstimations && (
          <Area
            type="monotone"
            dataKey="estime"
            name={t.admin.serieEstimation}
            stroke={COULEUR_ESTIME}
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="transparent"
            connectNulls
            dot={{ r: 3, strokeWidth: 0, fill: COULEUR_ESTIME }}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
