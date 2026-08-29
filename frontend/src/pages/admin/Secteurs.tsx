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
import { useTraduction } from '@/i18n';
import { useChampTraduit } from '@/i18n/donnees';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { Secteur } from '@/lib/types';
import { formatDate, formatMontant } from '@/lib/utils';

interface Brouillon {
  nom: string;
  description: string;
  /** Libelles anglais : chaine vide = pas encore traduit (migration 009). */
  nom_en: string;
  description_en: string;
  prix_rapport: string;
  est_actif: boolean;
}

export default function Secteurs() {
  const { t, langue } = useTraduction();
  const champ = useChampTraduit();
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
        nom_en: valeurs.nom_en,
        description_en: valeurs.description_en,
        prix_rapport: Number(valeurs.prix_rapport),
        est_actif: valeurs.est_actif,
      }),
    onSuccess: () => {
      toast.success(t.admin.secteurMisAJour);
      // Le catalogue public affiche les mêmes secteurs : son cache doit tomber
      // en même temps, sinon un prix modifié reste faux jusqu'au rechargement.
      queryClient.invalidateQueries({ queryKey: cles.adminSecteurs });
      queryClient.invalidateQueries({ queryKey: cles.catalogue });
      setEditionId(null);
      setBrouillon(null);
    },
    onError: (erreur: Error) => toast.error(t.admin.enregistrementImpossible, { description: erreur.message }),
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
      nom_en: secteur.nom_en ?? '',
      description_en: secteur.description_en ?? '',
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
          <h1 className="font-display text-2xl font-bold">{t.admin.secteursTitre}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted))]">
            {t.admin.secteursAccroche}
          </p>
        </div>
        {total > 0 && (
          <Badge variant={actifs === total ? 'succes' : 'avertissement'}>
            {t.admin.actifsSurTotal(actifs, total)}
          </Badge>
        )}
      </header>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>{t.admin.catalogue}</CardTitle>
          <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder={t.admin.rechercherSecteur} />
        </CardHeader>

        <CardContent className="px-0 sm:px-0">
          {secteurs.isLoading ? (
            <div className="space-y-2 px-5 sm:px-6">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <TableWrapper className="px-2 sm:px-3">
              <Thead>
                <Th>{t.admin.colonneSecteur}</Th>
                <Th>{t.admin.colonneDescription}</Th>
                <Th numerique>{t.admin.colonnePrix}</Th>
                <Th numerique>{t.admin.colonnePages}</Th>
                <Th>{t.admin.colonneMiseAJour}</Th>
                <Th>{t.admin.colonneEtat}</Th>
                <Th />
              </Thead>
              <Tbody>
                {liste.length === 0 && (
                  <TrMessage colonnes={7}>
                    {recherche ? t.admin.aucunSecteurCorrespond : t.admin.aucunSecteur}
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
                            <div className="space-y-1.5">
                              <Input
                                value={brouillon.nom} aria-label={t.admin.nomSecteur}
                                onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
                                className="h-8 w-40"
                              />
                              <Input
                                value={brouillon.nom_en} aria-label={t.admin.nomAnglais}
                                placeholder={t.admin.nomAnglais}
                                onChange={(e) => setBrouillon({ ...brouillon, nom_en: e.target.value })}
                                className="h-8 w-40"
                              />
                            </div>
                          ) : (
                            <div>
                              {/* Le nom PRINCIPAL suit la langue de
                                  l'interface : en anglais, « Tourism » en
                                  premier, pas « Tourisme Tourism ». */}
                              <span className="font-medium">{champ(secteur, 'nom')}</span>
                              {/* En second, l'autre version — et « non traduit »
                                  quand elle manque : le defaut se voit ici,
                                  pas sur le catalogue public ou il passerait
                                  inapercu sous la forme d'un libelle francais. */}
                              <span className="ml-2 text-xs text-[hsl(var(--muted))]">
                                {langue === 'en'
                                  ? secteur.nom
                                  : (secteur.nom_en || t.admin.traductionAbsente)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Td>

                      <Td className="max-w-xs">
                        {enEdition ? (
                          <div className="space-y-1.5">
                            <Input
                              value={brouillon.description} aria-label={t.admin.description}
                              onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
                              className="h-8"
                            />
                            <Input
                              value={brouillon.description_en} aria-label={t.admin.descriptionAnglaise}
                              placeholder={t.admin.descriptionAnglaise}
                              onChange={(e) => setBrouillon({ ...brouillon, description_en: e.target.value })}
                              className="h-8"
                            />
                          </div>
                        ) : (
                          <span className="line-clamp-2 text-[hsl(var(--muted))]">{champ(secteur, 'description')}</span>
                        )}
                      </Td>

                      <Td numerique>
                        {enEdition ? (
                          <Input
                            type="number" step="0.01" min="0" aria-label={t.admin.prixRapport}
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
                            {brouillon.est_actif ? t.admin.actif : t.admin.masque}
                          </Button>
                        ) : (
                          <Badge variant={secteur.est_actif ? 'succes' : 'neutre'}>
                            {secteur.est_actif ? t.admin.actif : t.admin.masque}
                          </Badge>
                        )}
                      </Td>

                      <Td>
                        <div className="flex items-center justify-end gap-1.5">
                          {enEdition ? (
                            <>
                              <Button size="sm" chargement={enregistrer.isPending}
                                onClick={() => enregistrer.mutate({ id: secteur.id, valeurs: brouillon })}>
                                <Check /> {t.admin.enregistrer}
                              </Button>
                              <Button size="icon" variant="ghost" aria-label={t.admin.annulerEdition}
                                onClick={() => { setEditionId(null); setBrouillon(null); }}>
                                <X />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => ouvrirEdition(secteur)}>
                                <Pencil /> {t.admin.modifier}
                              </Button>
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/admin/secteurs/${secteur.id}`}><Database /> {t.admin.donnees}</Link>
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
