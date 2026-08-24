import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Database, Eye, EyeOff, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChampRecherche, TableWrapper, Tbody, Td, Th, Thead, Tr, TrMessage,
} from '@/components/ui/table';
import { IconeSecteur } from '@/features/catalogue/IconeSecteur';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { Secteur } from '@/lib/types';
import { formatDate, formatMontant } from '@/lib/utils';

interface Brouillon {
  nom: string;
  description: string;
  prix_rapport: string;
  est_actif: boolean;
}

export default function Secteurs() {
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState('');
  const [editionId, setEditionId] = useState<number | null>(null);
  const [brouillon, setBrouillon] = useState<Brouillon | null>(null);

  const secteurs = useQuery({ queryKey: cles.adminSecteurs, queryFn: api.adminSecteurs });

  const enregistrer = useMutation({
    mutationFn: ({ id, valeurs }: { id: number; valeurs: Brouillon }) =>
      api.updateSecteur(id, {
        nom: valeurs.nom,
        description: valeurs.description,
        prix_rapport: Number(valeurs.prix_rapport),
        est_actif: valeurs.est_actif,
      }),
    onSuccess: () => {
      toast.success('Secteur mis à jour');
      // Le catalogue public affiche les mêmes secteurs : son cache doit tomber
      // en même temps, sinon un prix modifié reste faux jusqu'au rechargement.
      queryClient.invalidateQueries({ queryKey: cles.adminSecteurs });
      queryClient.invalidateQueries({ queryKey: cles.catalogue });
      setEditionId(null);
      setBrouillon(null);
    },
    onError: (erreur: Error) => toast.error('Enregistrement impossible', { description: erreur.message }),
  });

  const liste = useMemo(() => {
    const tous = secteurs.data?.secteurs ?? [];
    const terme = recherche.trim().toLowerCase();
    if (!terme) return tous;
    return tous.filter((s) =>
      s.nom.toLowerCase().includes(terme) || (s.description ?? '').toLowerCase().includes(terme));
  }, [secteurs.data, recherche]);

  function ouvrirEdition(secteur: Secteur) {
    setEditionId(secteur.id);
    setBrouillon({
      nom: secteur.nom,
      description: secteur.description ?? '',
      prix_rapport: String(secteur.prix_rapport),
      est_actif: Boolean(secteur.est_actif),
    });
  }

  const actifs = (secteurs.data?.secteurs ?? []).filter((s) => s.est_actif).length;
  const total = secteurs.data?.secteurs.length ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Secteurs</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
            Tarif, description et visibilité au catalogue. Un secteur masqué disparaît
            du catalogue public mais reste téléchargeable par ceux qui l&apos;ont acheté.
          </p>
        </div>
        {total > 0 && (
          <Badge variant={actifs === total ? 'succes' : 'avertissement'}>
            {actifs} / {total} actif(s)
          </Badge>
        )}
      </header>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>Catalogue</CardTitle>
          <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Rechercher un secteur…" />
        </CardHeader>

        <CardContent className="px-0 sm:px-0">
          {secteurs.isLoading ? (
            <div className="space-y-2 px-5 sm:px-6">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <TableWrapper className="px-2 sm:px-3">
              <Thead>
                <Th>Secteur</Th>
                <Th>Description</Th>
                <Th numerique>Prix</Th>
                <Th numerique>Pages</Th>
                <Th>Mise à jour</Th>
                <Th>État</Th>
                <Th />
              </Thead>
              <Tbody>
                {liste.length === 0 && (
                  <TrMessage colonnes={7}>
                    {recherche ? 'Aucun secteur ne correspond à cette recherche.' : 'Aucun secteur.'}
                  </TrMessage>
                )}

                {liste.map((secteur) => {
                  const enEdition = editionId === secteur.id && brouillon !== null;
                  return (
                    <Tr key={secteur.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <IconeSecteur slug={secteur.slug} taille="sm" />
                          {enEdition ? (
                            <Input
                              value={brouillon.nom} aria-label="Nom du secteur"
                              onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
                              className="h-8 w-40"
                            />
                          ) : (
                            <span className="font-medium">{secteur.nom}</span>
                          )}
                        </div>
                      </Td>

                      <Td className="max-w-xs">
                        {enEdition ? (
                          <Input
                            value={brouillon.description} aria-label="Description"
                            onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
                            className="h-8"
                          />
                        ) : (
                          <span className="line-clamp-2 text-[hsl(var(--muted))]">{secteur.description}</span>
                        )}
                      </Td>

                      <Td numerique>
                        {enEdition ? (
                          <Input
                            type="number" step="0.01" min="0" aria-label="Prix du rapport"
                            value={brouillon.prix_rapport}
                            onChange={(e) => setBrouillon({ ...brouillon, prix_rapport: e.target.value })}
                            className="h-8 w-24 text-right"
                          />
                        ) : (
                          <span className="font-semibold">{formatMontant(secteur.prix_rapport)}</span>
                        )}
                      </Td>

                      <Td numerique className="text-[hsl(var(--muted))]">{secteur.nombre_pages}</Td>
                      <Td className="whitespace-nowrap text-[hsl(var(--muted))]">{formatDate(secteur.date_maj)}</Td>

                      <Td>
                        {enEdition ? (
                          <Button variant="ghost" size="sm"
                            onClick={() => setBrouillon({ ...brouillon, est_actif: !brouillon.est_actif })}>
                            {brouillon.est_actif ? <Eye /> : <EyeOff />}
                            {brouillon.est_actif ? 'Actif' : 'Masqué'}
                          </Button>
                        ) : (
                          <Badge variant={secteur.est_actif ? 'succes' : 'neutre'}>
                            {secteur.est_actif ? 'Actif' : 'Masqué'}
                          </Badge>
                        )}
                      </Td>

                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          {enEdition ? (
                            <>
                              <Button size="sm" chargement={enregistrer.isPending}
                                onClick={() => enregistrer.mutate({ id: secteur.id, valeurs: brouillon })}>
                                <Check /> Enregistrer
                              </Button>
                              <Button size="icon" variant="ghost" aria-label="Annuler l'édition"
                                onClick={() => { setEditionId(null); setBrouillon(null); }}>
                                <X />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => ouvrirEdition(secteur)}>
                                <Pencil /> Modifier
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/admin/secteurs/${secteur.id}`}><Database /> Données</Link>
                              </Button>
                            </>
                          )}
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
    </div>
  );
}
