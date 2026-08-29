import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Building2, FileText, Gavel, MapPin, Plus, RefreshCw,
  Save, Trash2, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Label, Textarea } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { TableWrapper, Tbody, Td, Th, Thead, Tr, TrMessage } from '@/components/ui/table';
import { ComparatifRegional } from '@/features/admin/ComparatifRegional';
import { useTraduction } from '@/i18n';
import { useChampTraduit } from '@/i18n/donnees';
import type { Dictionnaire } from '@/i18n/fr';
import { api, fileUrl } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { formatNombre } from '@/lib/utils';

const CHAMPS_CHIFFRES = [
  { cle: 'contribution_pib_pct', libelle: (t: Dictionnaire) => t.admin.champPib, pas: '0.01' },
  { cle: 'croissance_annuelle_pct', libelle: (t: Dictionnaire) => t.admin.champCroissance, pas: '0.01' },
  { cle: 'nombre_emplois', libelle: (t: Dictionnaire) => t.admin.champEmplois, pas: '1' },
  { cle: 'exportations_mdt', libelle: (t: Dictionnaire) => t.admin.champExportations, pas: '0.01' },
  { cle: 'nombre_entreprises', libelle: (t: Dictionnaire) => t.admin.champEntreprises, pas: '1' },
  { cle: 'investissements_ide_mdt', libelle: (t: Dictionnaire) => t.admin.champIde, pas: '0.01' },
  { cle: 'part_marche_regional_pct', libelle: (t: Dictionnaire) => t.admin.champPartMarche, pas: '0.01' },
] as const;

const NOUVELLE_ZONE = {
  nom: '', type: 'zone_franche', gouvernorat: '', superficie_km2: '',
  description: '', avantages: '',
};
const NOUVEL_ACTEUR = {
  nom: '', type: 'entreprise', role: '', site_web: '',
  chiffre_affaires: '', nombre_employes: '',
};
const NOUVEAU_CADRE = {
  titre: '', annee: '', description: '', avantages: '', obligations: '', type_texte: 'loi',
};

type Enregistrement = Record<string, unknown>;

/** Liste éditable : entrées existantes + formulaire d'ajout. */
function SectionListe({
  titre, Icone, entrees, rendu, vide, onSupprimer, enfants, etiquetteSupprimer,
}: {
  titre: string;
  Icone: typeof MapPin;
  entrees: Enregistrement[];
  rendu: (item: Enregistrement) => React.ReactNode;
  vide: string;
  onSupprimer: (id: number) => void;
  enfants: React.ReactNode;
  etiquetteSupprimer: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icone className="size-4 text-[hsl(var(--primary))]" /> {titre}
        </CardTitle>
        <Badge variant="neutre">{entrees.length}</Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {entrees.length === 0 ? (
          <p className="py-4 text-center text-sm text-[hsl(var(--muted))]">{vide}</p>
        ) : (
          <ul className="divide-y divide-[hsl(var(--border))]">
            {entrees.map((item) => (
              <li key={String(item.id)} className="flex items-start justify-between gap-4 py-3">
                <div className="min-w-0 flex-1 text-sm">{rendu(item)}</div>
                <Button
                  size="icon" variant="ghost" aria-label={etiquetteSupprimer}
                  onClick={() => onSupprimer(Number(item.id))}
                  className="text-[hsl(var(--danger))]"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-[var(--radius-control)] border border-dashed border-[hsl(var(--border))] p-4">
          {enfants}
        </div>
      </CardContent>
    </Card>
  );
}

/** Champ de formulaire compact. */
function Champ({
  label, valeur, onChange, type = 'text', pas, requis = false,
}: {
  label: string; valeur: string; onChange: (v: string) => void;
  type?: string; pas?: string; requis?: boolean;
}) {
  const identifiant = `champ-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={identifiant} className="text-xs">{label}</Label>
      <Input
        id={identifiant} type={type} step={pas} required={requis}
        value={valeur} onChange={(e) => onChange(e.target.value)} className="h-9"
      />
    </div>
  );
}

export default function SecteurDonnees() {
  const { t } = useTraduction();
  const champ = useChampTraduit();
  const { id } = useParams<{ id: string }>();
  const secteurId = Number(id);
  const queryClient = useQueryClient();

  const [chiffres, setChiffres] = useState<Record<string, string>>({});
  const [zone, setZone] = useState({ ...NOUVELLE_ZONE });
  const [acteur, setActeur] = useState({ ...NOUVEL_ACTEUR });
  const [cadre, setCadre] = useState({ ...NOUVEAU_CADRE });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const secteur = useQuery({
    queryKey: cles.adminSecteur(secteurId),
    queryFn: () => api.adminSecteur(secteurId),
    enabled: Number.isFinite(secteurId),
  });

  const chiffresCles = useQuery({
    queryKey: ['admin', 'chiffres', secteurId],
    queryFn: async () => {
      const reponse = await api.chiffresCles(secteurId) as { chiffresCles?: Record<string, unknown> };
      const valeurs = reponse.chiffresCles ?? {};
      // Les champs sont pilotés : `null` deviendrait un input non contrôlé,
      // que React refuse de repasser en contrôlé ensuite.
      setChiffres(Object.fromEntries(
        CHAMPS_CHIFFRES.map(({ cle }) => [cle, valeurs[cle] == null ? '' : String(valeurs[cle])]),
      ));
      return reponse;
    },
    enabled: Number.isFinite(secteurId),
  });

  const donnees = secteur.data as {
    secteur?: { nom: string; description: string | null; slug: string };
    donneesStatistiques?: Enregistrement[];
    zonesGeographiques?: Enregistrement[];
    acteursPrincipaux?: Enregistrement[];
    cadreReglementaire?: Enregistrement[];
  } | undefined;

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: cles.adminSecteur(secteurId) });

  const enregistrerChiffres = useMutation({
    mutationFn: () => api.saveChiffresCles(secteurId, Object.fromEntries(
      // Un champ vidé doit remettre la valeur à NULL, pas à zéro : « inconnu »
      // et « nul » sont deux informations différentes.
      Object.entries(chiffres).map(([cle, valeur]) => [cle, valeur === '' ? null : Number(valeur)]),
    )),
    onSuccess: () => { toast.success(t.admin.chiffresEnregistres); rafraichir(); },
    onError: (e: Error) => toast.error(t.admin.enregistrementImpossible, { description: e.message }),
  });

  const supprimer = useMutation({
    mutationFn: ({ kind, itemId }: { kind: string; itemId: number }) => api.deleteItem(kind, itemId),
    onSuccess: () => { toast.success(t.admin.elementSupprime); rafraichir(); },
    onError: (e: Error) => toast.error(t.admin.suppressionImpossible, { description: e.message }),
  });

  const projections = useMutation({
    mutationFn: () => api.recalculerProjections(secteurId),
    onSuccess: () => { toast.success(t.admin.projectionsRecalculees); rafraichir(); },
    onError: (e: Error) => toast.error(t.admin.recalculImpossible, { description: e.message }),
  });

  const regenerer = useMutation({
    mutationFn: () => api.regenererRapport(secteurId),
    onSuccess: (resultat) => {
      const url = (resultat as { pdfUrl?: string }).pdfUrl;
      setPdfUrl(url ? fileUrl(url) : null);
      toast.success(t.admin.rapportRegenereToast);
    },
    onError: (e: Error) => toast.error(t.admin.regenerationImpossible, { description: e.message }),
  });

  function ajouter(appel: (id: number, charge: Enregistrement) => Promise<unknown>,
                   charge: Enregistrement, reinitialiser: () => void) {
    return async (evenement: React.FormEvent) => {
      evenement.preventDefault();
      try {
        await appel(secteurId, charge);
        toast.success(t.admin.ajoute);
        reinitialiser();
        rafraichir();
      } catch (erreur) {
        toast.error(t.admin.ajoutImpossible, {
          description: erreur instanceof Error ? erreur.message : t.admin.erreurInconnue,
        });
      }
    };
  }

  if (secteur.isLoading || chiffresCles.isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-9 w-64" />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-[var(--radius-card)]" />
        ))}
      </div>
    );
  }

  if (!donnees?.secteur) {
    return (
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
          <Link to="/admin/secteurs"><ArrowLeft /> {t.admin.retourSecteurs}</Link>
        </Button>
        <div role="alert" className="surface-card p-6 text-sm">
          {(secteur.error as Error)?.message ?? 'Secteur introuvable.'}
        </div>
      </div>
    );
  }

  const stats = donnees.donneesStatistiques ?? [];
  const zones = donnees.zonesGeographiques ?? [];
  const acteurs = donnees.acteursPrincipaux ?? [];
  const textes = donnees.cadreReglementaire ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/secteurs"><ArrowLeft /> {t.admin.retourSecteurs}</Link>
      </Button>

      <header className="surface-card p-6">
        <h1 className="font-display text-2xl font-bold leading-tight">{champ(donnees.secteur, 'nom')}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">{champ(donnees.secteur, 'description')}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border))] pt-5">
          <p className="mr-auto text-xs text-[hsl(var(--muted))]">
            {t.admin.resume(formatNombre(stats.length), zones.length, acteurs.length, textes.length)}
          </p>
          <Button size="sm" variant="outline" chargement={projections.isPending}
            onClick={() => projections.mutate()}>
            <TrendingUp /> {t.admin.recalculerProjections}
          </Button>
          <Button size="sm" chargement={regenerer.isPending} onClick={() => regenerer.mutate()}>
            <RefreshCw /> {t.admin.regenererRapport}
          </Button>
        </div>

        {pdfUrl && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            <FileText className="size-4 text-[hsl(var(--success))]" />
            {t.admin.rapportRegenere}
            <a href={pdfUrl} target="_blank" rel="noreferrer"
              className="font-medium text-[hsl(var(--primary))] hover:underline">
              {t.admin.ouvrirDocument}
            </a>
          </p>
        )}
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">{t.admin.chiffresCles}</CardTitle></CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => { e.preventDefault(); enregistrerChiffres.mutate(); }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHAMPS_CHIFFRES.map(({ cle, libelle, pas }) => (
                <Champ
                  key={cle} label={libelle(t)} type="number" pas={pas}
                  valeur={chiffres[cle] ?? ''}
                  onChange={(v) => setChiffres({ ...chiffres, [cle]: v })}
                />
              ))}
            </div>
            <Button type="submit" chargement={enregistrerChiffres.isPending}>
              <Save /> {t.admin.enregistrerChiffres}
            </Button>
          </form>
        </CardContent>
      </Card>

      <ComparatifRegional secteurId={secteurId} />

      <SectionListe
        titre={t.admin.zonesTitre} Icone={MapPin} etiquetteSupprimer={t.admin.supprimer}
        entrees={zones} vide={t.admin.zonesVide}
        onSupprimer={(itemId) => supprimer.mutate({ kind: 'zones', itemId })}
        rendu={(z) => (
          <>
            <p className="font-medium">{String(z.nom)}</p>
            <p className="text-xs text-[hsl(var(--muted))]">
              {String(z.type ?? '')} · {String(z.gouvernorat ?? '—')}
              {z.superficie_km2 ? ` · ${formatNombre(Number(z.superficie_km2), 1)} km²` : ''}
            </p>
          </>
        )}
        enfants={
          <form className="space-y-3"
            onSubmit={ajouter(api.createZone, zone, () => setZone({ ...NOUVELLE_ZONE }))}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Champ label={t.admin.champNom} valeur={zone.nom} requis onChange={(v) => setZone({ ...zone, nom: v })} />
              <Champ label={t.admin.champType} valeur={zone.type} onChange={(v) => setZone({ ...zone, type: v })} />
              <Champ label={t.admin.champGouvernorat} valeur={zone.gouvernorat} onChange={(v) => setZone({ ...zone, gouvernorat: v })} />
              <Champ label={t.admin.champSuperficie} type="number" pas="0.01" valeur={zone.superficie_km2}
                onChange={(v) => setZone({ ...zone, superficie_km2: v })} />
            </div>
            <Textarea className="min-h-16" placeholder={t.admin.champDescription} value={zone.description}
              aria-label={t.admin.descriptionZone}
              onChange={(e) => setZone({ ...zone, description: e.target.value })} />
            <Button type="submit" size="sm" variant="outline"><Plus /> {t.admin.ajouterZone}</Button>
          </form>
        }
      />

      <SectionListe
        titre={t.admin.acteursTitre} Icone={Building2} etiquetteSupprimer={t.admin.supprimer}
        entrees={acteurs} vide={t.admin.acteursVide}
        onSupprimer={(itemId) => supprimer.mutate({ kind: 'acteurs', itemId })}
        rendu={(a) => (
          <>
            <p className="font-medium">{String(a.nom)}</p>
            <p className="text-xs text-[hsl(var(--muted))]">
              {String(a.type ?? '')} · {String(a.role ?? '—')}
              {a.chiffre_affaires ? ` · ${formatNombre(Number(a.chiffre_affaires), 1)} MDT` : ''}
            </p>
          </>
        )}
        enfants={
          <form className="space-y-3"
            onSubmit={ajouter(api.createActeur, acteur, () => setActeur({ ...NOUVEL_ACTEUR }))}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Champ label={t.admin.champNom} valeur={acteur.nom} requis onChange={(v) => setActeur({ ...acteur, nom: v })} />
              <Champ label={t.admin.champType} valeur={acteur.type} onChange={(v) => setActeur({ ...acteur, type: v })} />
              <Champ label={t.admin.champRole} valeur={acteur.role} onChange={(v) => setActeur({ ...acteur, role: v })} />
              <Champ label={t.admin.champSiteWeb} valeur={acteur.site_web} onChange={(v) => setActeur({ ...acteur, site_web: v })} />
              <Champ label={t.admin.champCa} type="number" pas="0.01" valeur={acteur.chiffre_affaires}
                onChange={(v) => setActeur({ ...acteur, chiffre_affaires: v })} />
              <Champ label={t.admin.champEmployes} type="number" pas="1" valeur={acteur.nombre_employes}
                onChange={(v) => setActeur({ ...acteur, nombre_employes: v })} />
            </div>
            <Button type="submit" size="sm" variant="outline"><Plus /> {t.admin.ajouterActeur}</Button>
          </form>
        }
      />

      <SectionListe
        titre={t.admin.cadreTitre} Icone={Gavel} etiquetteSupprimer={t.admin.supprimer}
        entrees={textes} vide={t.admin.cadreVide}
        onSupprimer={(itemId) => supprimer.mutate({ kind: 'cadre', itemId })}
        rendu={(c) => (
          <>
            <p className="font-medium">{String(c.titre)}</p>
            <p className="text-xs text-[hsl(var(--muted))]">
              {String(c.type_texte ?? '')}{c.annee ? ` · ${c.annee}` : ''}
            </p>
          </>
        )}
        enfants={
          <form className="space-y-3"
            onSubmit={ajouter(api.createCadre, cadre, () => setCadre({ ...NOUVEAU_CADRE }))}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Champ label={t.admin.champTitre} valeur={cadre.titre} requis onChange={(v) => setCadre({ ...cadre, titre: v })} />
              <Champ label={t.admin.champType} valeur={cadre.type_texte} onChange={(v) => setCadre({ ...cadre, type_texte: v })} />
              <Champ label={t.admin.champAnnee} type="number" pas="1" valeur={cadre.annee}
                onChange={(v) => setCadre({ ...cadre, annee: v })} />
            </div>
            <Textarea className="min-h-16" placeholder={t.admin.champDescription} value={cadre.description}
              aria-label={t.admin.descriptionTexte}
              onChange={(e) => setCadre({ ...cadre, description: e.target.value })} />
            <Button type="submit" size="sm" variant="outline"><Plus /> {t.admin.ajouterTexte}</Button>
          </form>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-[hsl(var(--primary))]" /> {t.admin.seriesTitre}
          </CardTitle>
          <Badge variant="neutre">{stats.length}</Badge>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <TableWrapper className="px-2 sm:px-3">
            <Thead>
              <Th>{t.admin.colonneIndicateur}</Th>
              <Th>{t.admin.colonneUnite}</Th>
              <Th numerique>2022</Th>
              <Th numerique>2023</Th>
              <Th numerique>2024</Th>
              <Th numerique>{t.admin.colonneEstimation}</Th>
              <Th>{t.admin.colonneMethode}</Th>
            </Thead>
            <Tbody>
              {stats.length === 0 && (
                <TrMessage colonnes={7}>{t.admin.aucuneSerie}</TrMessage>
              )}
              {stats.slice(0, 40).map((serie) => (
                <Tr key={String(serie.id)}>
                  <Td className="max-w-xs">
                    <span className="line-clamp-2">{champ(serie, 'indicateur')}</span>
                  </Td>
                  <Td className="text-[hsl(var(--muted))]">{champ(serie, 'unite') || '—'}</Td>
                  <Td numerique>{serie.valeur_2022 != null ? formatNombre(Number(serie.valeur_2022), 1) : '—'}</Td>
                  <Td numerique>{serie.valeur_2023 != null ? formatNombre(Number(serie.valeur_2023), 1) : '—'}</Td>
                  <Td numerique>{serie.valeur_2024 != null ? formatNombre(Number(serie.valeur_2024), 1) : '—'}</Td>
                  {/* Les estimations portent une teinte distincte : jamais
                      confondues avec une donnée publiée. */}
                  <Td numerique className="text-[hsl(var(--accent))]">
                    {serie.projection_2028 != null ? formatNombre(Number(serie.projection_2028), 1) : '—'}
                  </Td>
                  <Td className="text-xs text-[hsl(var(--muted))]">
                    {serie.methode_projection ? (
                      <span>
                        {String(serie.methode_projection)}
                        {serie.fiabilite_r2 != null && ` · R² ${Number(serie.fiabilite_r2).toFixed(2)}`}
                      </span>
                    ) : '—'}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </TableWrapper>

          {stats.length > 40 && (
            <p className="px-6 pt-3 text-xs text-[hsl(var(--muted))]">
              {t.admin.seriesTronquees(formatNombre(stats.length))}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
