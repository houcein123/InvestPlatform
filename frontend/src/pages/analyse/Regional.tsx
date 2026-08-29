import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ExternalLink, Globe2, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { COULEUR_AXE, COULEUR_GRILLE } from '@/components/charts/palette';
import { InfobulleGraphique } from '@/components/charts/InfobulleGraphique';
import { IconeSecteur } from '@/features/catalogue/IconeSecteur';
import { useTraduction } from '@/i18n';
import { useChampTraduit } from '@/i18n/donnees';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { formatNombre } from '@/lib/utils';

interface Indicateur {
  id: number;
  indicateur: string;
  unite: string | null;
  annee: number | null;
  tunisie: number | null;
  maroc: number | null;
  egypte: number | null;
  source: string | null;
}

interface Groupe {
  secteurId: number;
  slug: string;
  secteur: string;
  indicateurs: Indicateur[];
}

// La Tunisie porte la couleur d'action ; les deux comparants restent neutres
// et distincts. L'ordre est fixe : le lecteur retrouve la meme lecture partout.
const PAYS = [
  { cle: 'tunisie', libelle: 'Tunisie', couleur: 'hsl(var(--primary))' },
  { cle: 'maroc', libelle: 'Maroc', couleur: 'hsl(var(--chart-2))' },
  { cle: 'egypte', libelle: 'Égypte', couleur: 'hsl(var(--chart-3))' },
  // Les libelles ci-dessus servent de repli ; ceux affiches passent par
  // `paysTraduits` afin que la legende suive la langue de l'interface.
] as const;

/** Nom des trois pays dans la langue active. */
function paysTraduits(t: Dictionnaire): Record<string, string> {
  return {
    tunisie: t.regional.paysTunisie,
    maroc: t.regional.paysMaroc,
    egypte: t.regional.paysEgypte,
  };
}

export default function Regional() {
  const { t } = useTraduction();
  const champ = useChampTraduit();
  const noms = paysTraduits(t);
  const donnees = useQuery({ queryKey: cles.analyseRegionale, queryFn: api.analyseRegionale });
  const groupes = ((donnees.data as { groupes?: Groupe[] } | undefined)?.groupes ?? []);

  const total = groupes.reduce((somme, g) => somme + g.indicateurs.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          {t.analyse.surtitre}
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          {t.regional.titre}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.regional.accroche}
        </p>
      </header>

      <div className="surface-card flex flex-wrap items-start gap-3 p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
        <p className="flex-1 text-xs leading-relaxed text-[hsl(var(--muted))]">
          {t.regional.sourceAvant}{' '}
          <strong className="text-[hsl(var(--foreground))]">{t.regional.sourceFort}</strong>
          {t.regional.sourceApres}
        </p>
        {total > 0 && <Badge variant="neutre">{t.regional.nombreIndicateurs(total)}</Badge>}
      </div>

      {donnees.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      )}

      {donnees.isSuccess && groupes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Globe2 className="size-8 text-[hsl(var(--muted))]" />
            <p className="font-display font-semibold">{t.regional.aucunComparatif}</p>
            <p className="max-w-md text-sm text-[hsl(var(--muted))]">
              {t.regional.aucunComparatifAvant}
              <code className="mx-1 rounded bg-[hsl(var(--surface-muted))] px-1.5 py-0.5 text-xs">
                scripts/importer_banque_mondiale.py
              </code>
              {t.regional.aucunComparatifApres}
            </p>
          </CardContent>
        </Card>
      )}

      {groupes.map((groupe) => {
        // Les unites different d'un indicateur a l'autre : les tracer sur un
        // meme axe melangerait des pourcentages et des millions. Chaque
        // indicateur a donc son propre graphique.
        return (
          <Card key={groupe.secteurId}>
            <CardHeader className="flex-row items-center gap-3">
              <IconeSecteur slug={groupe.slug} taille="sm" />
              <div>
                <CardTitle className="text-base">{champ(groupe, 'secteur')}</CardTitle>
                <CardDescription>
                  {t.regional.indicateursComparables(groupe.indicateurs.length)}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {groupe.indicateurs.map((indicateur) => {
                const series = PAYS
                  // `noms` traduit l'etiquette : sans cela, l'axe du graphique
                  // et la legende juste dessous nommaient les memes pays
                  // differemment sur le meme ecran.
                  .map(({ cle }) => ({
                    pays: noms[cle],
                    valeur: indicateur[cle] == null ? null : Number(indicateur[cle]),
                  }))
                  .filter((p) => p.valeur !== null);

                return (
                  <div key={indicateur.id} className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] p-4">
                    <p className="text-sm font-medium leading-tight">
                      {champ(indicateur, 'indicateur')}
                    </p>
                    <p className="mt-0.5 text-xs text-[hsl(var(--muted))]">
                      {champ(indicateur, 'unite')}{indicateur.annee ? ` · ${indicateur.annee}` : ''}
                    </p>

                    <ResponsiveContainer width="100%" height={150} className="mt-3">
                      <BarChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={COULEUR_GRILLE} vertical={false} />
                        <XAxis dataKey="pays" tick={{ fill: COULEUR_AXE, fontSize: 10 }}
                          tickLine={false} axisLine={{ stroke: COULEUR_GRILLE }} />
                        <YAxis tick={{ fill: COULEUR_AXE, fontSize: 10 }} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: 'hsl(var(--surface-muted))' }}
                          content={(props) => (
                            <InfobulleGraphique {...props} unite={indicateur.unite ?? undefined} />
                          )} />
                        {/* Une couleur par pays : c'est `Cell` qui la porte,
                            pas une barre imbriquee. */}
                        <Bar dataKey="valeur" name={indicateur.indicateur} radius={[5, 5, 0, 0]} maxBarSize={38}>
                          {series.map((point) => (
                            <Cell
                              key={point.pays}
                              fill={PAYS.find((p) => noms[p.cle] === point.pays)?.couleur}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>

                    <ul className="mt-2 space-y-1">
                      {PAYS.map(({ cle, couleur }) => (
                        <li key={cle} className="flex items-center gap-2 text-xs">
                          <span className="size-2 rounded-full" style={{ backgroundColor: couleur }} aria-hidden />
                          <span className="text-[hsl(var(--muted))]">{noms[cle]}</span>
                          <span className="tabular ml-auto font-semibold">
                            {indicateur[cle] == null ? t.regional.nonDisponible : formatNombre(Number(indicateur[cle]), 2)}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {indicateur.source && (
                      <p className="mt-2 flex items-start gap-1 text-[0.6875rem] leading-snug text-[hsl(var(--muted))]">
                        <ExternalLink className="mt-0.5 size-2.5 shrink-0" />
                        {champ(indicateur, 'source')}
                      </p>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
