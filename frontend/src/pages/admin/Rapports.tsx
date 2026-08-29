import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import {
  ChampRecherche, TableWrapper, Tbody, Td, Th, Thead, Tr, TrMessage,
} from '@/components/ui/table';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { useTitreRapport } from '@/i18n/donnees';
import { api, fileUrl } from '@/lib/api';
import { formatDate, formatNombre } from '@/lib/utils';

interface RapportAdmin {
  id: number;
  titre: string;
  secteur_id: number;
  secteur?: string;
  /** Nom anglais du secteur, joint par le serveur pour recomposer le titre. */
  secteur_en?: string | null;
  chemin_fichier: string | null;
  taille_fichier: number | null;
  nombre_pages: number | null;
  statut: string | null;
  date_generation: string | null;
}

/** Taille de fichier lisible : 53 248 octets ne dit rien à personne. */
function formatTaille(octets: number | null) {
  if (!octets) return '—';
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Libelle affiche d'un statut.
 *
 * Le statut est un CODE en base (`genere`, `en_attente`) : on le traduit ici,
 * jamais en base, ou il sert de critere de filtrage.
 */
function libelleStatut(statut: string | null | undefined, t: Dictionnaire): string {
  switch (statut) {
    case 'genere': return t.admin.statutGenere;
    case 'en_attente': return t.admin.statutEnAttente;
    case 'erreur': return t.admin.statutErreur;
    default: return statut || t.admin.statutInconnu;
  }
}

const ETIQUETTES: Record<string, 'succes' | 'avertissement' | 'danger' | 'neutre'> = {
  termine: 'succes',
  genere: 'succes',
  en_attente: 'avertissement',
  erreur: 'danger',
};

export default function Rapports() {
  const { t } = useTraduction();
  const titreRapport = useTitreRapport();
  const [recherche, setRecherche] = useState('');

  const rapports = useQuery({ queryKey: ['admin', 'rapports'], queryFn: api.rapports });
  const tous = ((rapports.data as { rapports?: RapportAdmin[] } | undefined)?.rapports ?? []);

  const liste = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return tous;
    return tous.filter((r) =>
      (r.titre ?? '').toLowerCase().includes(terme)
      || (r.secteur ?? '').toLowerCase().includes(terme));
  }, [tous, recherche]);

  const livres = tous.filter((r) => r.chemin_fichier).length;
  const poidsTotal = tous.reduce((somme, r) => somme + (r.taille_fichier ?? 0), 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">{t.admin.rapportsTitre}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          {t.admin.rapportsAccroche}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} libelle={t.admin.rapportsGeneres} valeur={formatNombre(tous.length)} Icone={FileText} />
        <StatCard index={1} libelle={t.admin.fichiersDisponibles} valeur={formatNombre(livres)}
          Icone={Download} teinte="succes"
          detail={tous.length > livres ? t.admin.sansFichier(tous.length - livres) : t.admin.tousLivres} />
        <StatCard index={2} libelle={t.admin.volumeTotal} valeur={formatTaille(poidsTotal)}
          Icone={FileText} teinte="neutre" />
      </div>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>{t.admin.historique}</CardTitle>
          <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder={t.admin.rechercherRapport} />
        </CardHeader>

        <CardContent className="px-0 sm:px-0">
          {rapports.isLoading ? (
            <div className="space-y-2 px-5 sm:px-6">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : rapports.isError ? (
            <p role="alert" className="px-6 py-8 text-center text-sm text-[hsl(var(--danger))]">
              {(rapports.error as Error).message}
            </p>
          ) : (
            <TableWrapper className="px-2 sm:px-3">
              <Thead>
                <Th>{t.admin.colonneTitre}</Th>
                <Th>{t.admin.colonneGenereLe}</Th>
                <Th numerique>{t.admin.colonnePages}</Th>
                <Th numerique>{t.admin.colonneTaille}</Th>
                <Th>{t.admin.colonneStatut}</Th>
                <Th />
              </Thead>
              <Tbody>
                {liste.length === 0 && (
                  <TrMessage colonnes={6}>
                    {recherche ? t.admin.aucunRapportCorrespond : t.admin.aucunRapportProduit}
                  </TrMessage>
                )}

                {liste.map((rapport) => (
                  <Tr key={rapport.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]">
                          <FileText className="size-4" />
                        </span>
                        <span className="font-medium">{titreRapport(rapport)}</span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-[hsl(var(--muted))]">
                      {formatDate(rapport.date_generation, true)}
                    </Td>
                    <Td numerique className="text-[hsl(var(--muted))]">{rapport.nombre_pages ?? '—'}</Td>
                    <Td numerique className="text-[hsl(var(--muted))]">{formatTaille(rapport.taille_fichier)}</Td>
                    <Td>
                      <Badge variant={ETIQUETTES[rapport.statut ?? ''] ?? 'neutre'}>
                        {libelleStatut(rapport.statut, t)}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1.5">
                        {rapport.chemin_fichier && (
                          <Button asChild size="sm" variant="ghost">
                            <a href={fileUrl(rapport.chemin_fichier)} target="_blank" rel="noreferrer">
                              <Download /> {t.admin.ouvrir}
                            </a>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="outline">
                          <Link to={`/admin/rapports/${rapport.id}`}><Pencil /> {t.admin.corriger}</Link>
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </TableWrapper>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
