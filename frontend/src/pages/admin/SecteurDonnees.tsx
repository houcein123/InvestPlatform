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
import { api, fileUrl } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { formatNombre } from '@/lib/utils';

const CHAMPS_CHIFFRES = [
  { cle: 'contribution_pib_pct', libelle: 'Contribution au PIB (%)', pas: '0.01' },
  { cle: 'croissance_annuelle_pct', libelle: 'Croissance annuelle (%)', pas: '0.01' },
  { cle: 'nombre_emplois', libelle: 'Emplois générés', pas: '1' },
  { cle: 'exportations_mdt', libelle: 'Exportations (MDT)', pas: '0.01' },
  { cle: 'nombre_entreprises', libelle: 'Entreprises actives', pas: '1' },
  { cle: 'investissements_ide_mdt', libelle: 'Investissements IDE (MDT)', pas: '0.01' },
  { cle: 'part_marche_regional_pct', libelle: 'Part de marché régionale (%)', pas: '0.01' },
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
  titre, Icone, entrees, rendu, vide, onSupprimer, enfants,
}: {
  titre: string;
  Icone: typeof MapPin;
  entrees: Enregistrement[];
  rendu: (item: Enregistrement) => React.ReactNode;
  vide: string;
  onSupprimer: (id: number) => void;
  enfants: React.ReactNode;
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
                  size="icon" variant="ghost" aria-label="Supprimer"
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
    onSuccess: () => { toast.success('Chiffres clés enregistrés'); rafraichir(); },
    onError: (e: Error) => toast.error('Enregistrement impossible', { description: e.message }),
  });

  const supprimer = useMutation({
    mutationFn: ({ kind, itemId }: { kind: string; itemId: number }) => api.deleteItem(kind, itemId),
    onSuccess: () => { toast.success('Élément supprimé'); rafraichir(); },
    onError: (e: Error) => toast.error('Suppression impossible', { description: e.message }),
  });

  const projections = useMutation({
    mutationFn: () => api.recalculerProjections(secteurId),
    onSuccess: () => { toast.success('Projections recalculées'); rafraichir(); },
    onError: (e: Error) => toast.error('Recalcul impossible', { description: e.message }),
  });

  const regenerer = useMutation({
    mutationFn: () => api.regenererRapport(secteurId),
    onSuccess: (resultat) => {
      const url = (resultat as { pdfUrl?: string }).pdfUrl;
      setPdfUrl(url ? fileUrl(url) : null);
      toast.success('Rapport régénéré');
    },
    onError: (e: Error) => toast.error('Régénération impossible', { description: e.message }),
  });

  function ajouter(appel: (id: number, charge: Enregistrement) => Promise<unknown>,
                   charge: Enregistrement, reinitialiser: () => void) {
    return async (evenement: React.FormEvent) => {
      evenement.preventDefault();
      try {
        await appel(secteurId, charge);
        toast.success('Ajouté');
        reinitialiser();
        rafraichir();
      } catch (erreur) {
        toast.error("Ajout impossible", {
          description: erreur instanceof Error ? erreur.message : 'Erreur inconnue',
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
          <Link to="/admin/secteurs"><ArrowLeft /> Retour aux secteurs</Link>
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
        <Link to="/admin/secteurs"><ArrowLeft /> Retour aux secteurs</Link>
      </Button>

      <header className="surface-card p-6">
        <h1 className="font-display text-2xl font-bold leading-tight">{donnees.secteur.nom}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">{donnees.secteur.description}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[hsl(var(--border))] pt-5">
          <p className="mr-auto text-xs text-[hsl(var(--muted))]">
            {formatNombre(stats.length)} séries · {zones.length} zones ·
            {' '}{acteurs.length} acteurs · {textes.length} textes réglementaires
          </p>
          <Button size="sm" variant="outline" chargement={projections.isPending}
            onClick={() => projections.mutate()}>
            <TrendingUp /> Recalculer les projections
          </Button>
          <Button size="sm" chargement={regenerer.isPending} onClick={() => regenerer.mutate()}>
            <RefreshCw /> Régénérer le rapport
          </Button>
        </div>

        {pdfUrl && (
          <p className="mt-4 flex items-center gap-2 text-sm">
            <FileText className="size-4 text-[hsl(var(--success))]" />
            Rapport régénéré —
            <a href={pdfUrl} target="_blank" rel="noreferrer"
              className="font-medium text-[hsl(var(--primary))] hover:underline">
              ouvrir le document
            </a>
          </p>
        )}
      </header>

      <Card>
        <CardHeader><CardTitle className="text-base">Chiffres clés</CardTitle></CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => { e.preventDefault(); enregistrerChiffres.mutate(); }}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {CHAMPS_CHIFFRES.map(({ cle, libelle, pas }) => (
                <Champ
                  key={cle} label={libelle} type="number" pas={pas}
                  valeur={chiffres[cle] ?? ''}
                  onChange={(v) => setChiffres({ ...chiffres, [cle]: v })}
                />
              ))}
            </div>
            <Button type="submit" chargement={enregistrerChiffres.isPending}>
              <Save /> Enregistrer les chiffres clés
            </Button>
          </form>
        </CardContent>
      </Card>

      <ComparatifRegional secteurId={secteurId} />

      <SectionListe
        titre="Zones géographiques et zones franches" Icone={MapPin}
        entrees={zones} vide="Aucune zone renseignée."
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
              <Champ label="Nom" valeur={zone.nom} requis onChange={(v) => setZone({ ...zone, nom: v })} />
              <Champ label="Type" valeur={zone.type} onChange={(v) => setZone({ ...zone, type: v })} />
              <Champ label="Gouvernorat" valeur={zone.gouvernorat} onChange={(v) => setZone({ ...zone, gouvernorat: v })} />
              <Champ label="Superficie (km²)" type="number" pas="0.01" valeur={zone.superficie_km2}
                onChange={(v) => setZone({ ...zone, superficie_km2: v })} />
            </div>
            <Textarea className="min-h-16" placeholder="Description" value={zone.description}
              aria-label="Description de la zone"
              onChange={(e) => setZone({ ...zone, description: e.target.value })} />
            <Button type="submit" size="sm" variant="outline"><Plus /> Ajouter la zone</Button>
          </form>
        }
      />

      <SectionListe
        titre="Acteurs principaux" Icone={Building2}
        entrees={acteurs} vide="Aucun acteur renseigné."
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
              <Champ label="Nom" valeur={acteur.nom} requis onChange={(v) => setActeur({ ...acteur, nom: v })} />
              <Champ label="Type" valeur={acteur.type} onChange={(v) => setActeur({ ...acteur, type: v })} />
              <Champ label="Rôle" valeur={acteur.role} onChange={(v) => setActeur({ ...acteur, role: v })} />
              <Champ label="Site web" valeur={acteur.site_web} onChange={(v) => setActeur({ ...acteur, site_web: v })} />
              <Champ label="CA (MDT)" type="number" pas="0.01" valeur={acteur.chiffre_affaires}
                onChange={(v) => setActeur({ ...acteur, chiffre_affaires: v })} />
              <Champ label="Employés" type="number" pas="1" valeur={acteur.nombre_employes}
                onChange={(v) => setActeur({ ...acteur, nombre_employes: v })} />
            </div>
            <Button type="submit" size="sm" variant="outline"><Plus /> Ajouter l&apos;acteur</Button>
          </form>
        }
      />

      <SectionListe
        titre="Cadre réglementaire et fiscal" Icone={Gavel}
        entrees={textes} vide="Aucun texte renseigné."
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
              <Champ label="Titre" valeur={cadre.titre} requis onChange={(v) => setCadre({ ...cadre, titre: v })} />
              <Champ label="Type" valeur={cadre.type_texte} onChange={(v) => setCadre({ ...cadre, type_texte: v })} />
              <Champ label="Année" type="number" pas="1" valeur={cadre.annee}
                onChange={(v) => setCadre({ ...cadre, annee: v })} />
            </div>
            <Textarea className="min-h-16" placeholder="Description" value={cadre.description}
              aria-label="Description du texte"
              onChange={(e) => setCadre({ ...cadre, description: e.target.value })} />
            <Button type="submit" size="sm" variant="outline"><Plus /> Ajouter le texte</Button>
          </form>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-[hsl(var(--primary))]" /> Séries statistiques
          </CardTitle>
          <Badge variant="neutre">{stats.length}</Badge>
        </CardHeader>
        <CardContent className="px-0 sm:px-0">
          <TableWrapper className="px-2 sm:px-3">
            <Thead>
              <Th>Indicateur</Th>
              <Th>Unité</Th>
              <Th numerique>2022</Th>
              <Th numerique>2023</Th>
              <Th numerique>2024</Th>
              <Th numerique>2028 (est.)</Th>
              <Th>Méthode</Th>
            </Thead>
            <Tbody>
              {stats.length === 0 && (
                <TrMessage colonnes={7}>Aucune série pour ce secteur.</TrMessage>
              )}
              {stats.slice(0, 40).map((serie) => (
                <Tr key={String(serie.id)}>
                  <Td className="max-w-xs">
                    <span className="line-clamp-2">{String(serie.indicateur)}</span>
                  </Td>
                  <Td className="text-[hsl(var(--muted))]">{String(serie.unite ?? '—')}</Td>
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
              40 premières séries affichées sur {formatNombre(stats.length)}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
