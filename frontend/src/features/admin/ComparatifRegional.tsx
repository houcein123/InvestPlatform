import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Globe2, Info, Save } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableWrapper, Tbody, Td, Th, Thead, Tr, TrMessage } from '@/components/ui/table';
import { useTraduction } from '@/i18n';
import { api } from '@/lib/api';

interface Benchmark {
  id: number;
  indicateur: string;
  unite: string | null;
  annee: number | null;
  valeur_tunisie: number | null;
  valeur_maroc: number | null;
  valeur_egypte: number | null;
  source: string | null;
}

type Brouillon = Record<number, Partial<Record<keyof Benchmark, string>>>;

/**
 * Comparatif régional Tunisie / Maroc / Égypte.
 *
 * La grille est livrée VIDE, et c'est délibéré. Le cahier des charges exige une
 * comparaison avec le Maroc et l'Égypte, mais le contexte transmis au modèle de
 * rédaction ne contient que des chiffres tunisiens : sans cette table, le modèle
 * devait produire lui-même toutes les valeurs étrangères, dans un rapport vendu.
 *
 * Tant qu'une ligne n'est pas renseignée, le prompt impose au modèle de traiter
 * la comparaison en termes qualitatifs et de signaler l'absence de chiffre.
 * Pré-remplir ces cases reviendrait exactement à l'erreur que ce dispositif
 * corrige.
 */
export function ComparatifRegional({ secteurId }: { secteurId: number }) {
  const { t } = useTraduction();
  const queryClient = useQueryClient();
  const [brouillons, setBrouillons] = useState<Brouillon>({});

  const cle = ['admin', 'benchmarks', secteurId];
  const benchmarks = useQuery({
    queryKey: cle,
    queryFn: () => api.benchmarks(secteurId),
    enabled: Number.isFinite(secteurId),
  });

  const enregistrer = useMutation({
    mutationFn: ({ id, valeurs }: { id: number; valeurs: Record<string, unknown> }) =>
      api.saveBenchmark(id, valeurs),
    onSuccess: (_, { id }) => {
      toast.success(t.admin.indicateurEnregistre);
      setBrouillons((actuels) => {
        const suite = { ...actuels };
        delete suite[id];
        return suite;
      });
      queryClient.invalidateQueries({ queryKey: cle });
      // Le PDF lit ces valeurs : son cache de données sectorielles doit tomber.
      queryClient.invalidateQueries({ queryKey: ['admin', 'secteurs', secteurId] });
    },
    onError: (erreur: Error) =>
      toast.error(t.admin.enregistrementImpossible, { description: erreur.message }),
  });

  const donnees = benchmarks.data as
    { benchmarks?: Benchmark[]; renseignes?: number; total?: number } | undefined;
  const lignes = donnees?.benchmarks ?? [];

  function valeur(ligne: Benchmark, champ: keyof Benchmark) {
    const brouillon = brouillons[ligne.id]?.[champ];
    if (brouillon !== undefined) return brouillon;
    const actuelle = ligne[champ];
    return actuelle == null ? '' : String(actuelle);
  }

  function modifier(id: number, champ: keyof Benchmark, v: string) {
    setBrouillons((actuels) => ({ ...actuels, [id]: { ...actuels[id], [champ]: v } }));
  }

  function soumettre(ligne: Benchmark) {
    const brouillon = brouillons[ligne.id] ?? {};
    const nombre = (v: string | undefined, actuel: number | null) =>
      v === undefined ? actuel : (v.trim() === '' ? null : Number(v));

    enregistrer.mutate({
      id: ligne.id,
      valeurs: {
        annee: nombre(brouillon.annee, ligne.annee),
        valeur_tunisie: nombre(brouillon.valeur_tunisie, ligne.valeur_tunisie),
        valeur_maroc: nombre(brouillon.valeur_maroc, ligne.valeur_maroc),
        valeur_egypte: nombre(brouillon.valeur_egypte, ligne.valeur_egypte),
        source: brouillon.source ?? ligne.source,
      },
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe2 className="size-4 text-[hsl(var(--primary))]" /> {t.admin.comparatifTitre}
        </CardTitle>
        {donnees && (
          <Badge variant={donnees.renseignes ? 'succes' : 'avertissement'}>
            {t.admin.comparatifRenseignes(donnees.renseignes ?? 0, donnees.total ?? 0)}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4 px-0 sm:px-0">
        <p className="mx-5 flex items-start gap-2 rounded-[var(--radius-control)] bg-[hsl(var(--surface-muted))] px-4 py-3 text-xs leading-relaxed text-[hsl(var(--muted))] sm:mx-6">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            {t.admin.comparatifAvant}
            <strong>{t.admin.comparatifFort}</strong>
            {t.admin.comparatifApres}
          </span>
        </p>

        {benchmarks.isLoading ? (
          <div className="space-y-2 px-5 sm:px-6">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <TableWrapper className="px-2 sm:px-3">
            <Thead>
              <Th>{t.admin.colonneIndicateur}</Th>
              <Th>{t.admin.colonneUnite}</Th>
              <Th numerique>{t.admin.comparatifAnnee}</Th>
              <Th numerique>{t.regional.paysTunisie}</Th>
              <Th numerique>{t.regional.paysMaroc}</Th>
              <Th numerique>{t.regional.paysEgypte}</Th>
              <Th>{t.admin.comparatifSource}</Th>
              <Th />
            </Thead>
            <Tbody>
              {lignes.length === 0 && (
                <TrMessage colonnes={8}>
                  Aucun indicateur comparatif défini pour ce secteur.
                </TrMessage>
              )}

              {lignes.map((ligne) => {
                const modifie = Boolean(brouillons[ligne.id]);
                return (
                  <Tr key={ligne.id}>
                    <Td className="max-w-[14rem]">
                      <span className="line-clamp-2 font-medium">{ligne.indicateur}</span>
                    </Td>
                    <Td className="text-[hsl(var(--muted))]">{ligne.unite ?? '—'}</Td>

                    {(['annee', 'valeur_tunisie', 'valeur_maroc', 'valeur_egypte'] as const).map((champ) => (
                      <Td key={champ} numerique>
                        <Input
                          type="number"
                          step={champ === 'annee' ? '1' : '0.01'}
                          aria-label={`${ligne.indicateur} — ${champ}`}
                          value={valeur(ligne, champ)}
                          onChange={(e) => modifier(ligne.id, champ, e.target.value)}
                          className="h-8 w-24 text-right"
                        />
                      </Td>
                    ))}

                    <Td>
                      <Input
                        aria-label={`${ligne.indicateur} — source`}
                        placeholder={t.admin.comparatifSourcePlaceholder}
                        value={valeur(ligne, 'source')}
                        onChange={(e) => modifier(ligne.id, 'source', e.target.value)}
                        className="h-8 w-40"
                      />
                    </Td>

                    <Td>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant={modifie ? 'primary' : 'ghost'}
                          disabled={!modifie || enregistrer.isPending}
                          onClick={() => soumettre(ligne)}
                        >
                          <Save /> {t.admin.enregistrer}
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </TableWrapper>
        )}
      </CardContent>
    </Card>
  );
}
