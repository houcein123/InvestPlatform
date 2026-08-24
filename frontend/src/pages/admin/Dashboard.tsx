import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FileText, Layers, TrendingUp, Wallet } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { GraphiqueVentes } from '@/components/charts/GraphiqueVentes';
import { GraphiqueRepartition } from '@/components/charts/GraphiqueRepartition';
import { api, fileUrl } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { StatSecteur } from '@/lib/types';
import { formatDate, formatMontant, formatNombre } from '@/lib/utils';

interface Totaux {
  nb_ventes: number;
  revenu: number;
  nb_ventes_simulees: number;
  revenu_simule: number;
  nb_ventes_total: number;
  revenu_total: number;
  nb_rapports_generes: number;
}

interface RapportRecent {
  id: number;
  titre: string;
  chemin_fichier: string | null;
  date_generation: string | null;
  /** Pages du PDF produit, comptees par le moteur a la generation. */
  nombre_pages: number | null;
}

/** Panneau de controle — vue d'ensemble des ventes et des rapports (CDC section 7). */
export default function Dashboard() {
  const stats = useQuery({ queryKey: cles.adminStats, queryFn: api.stats });

  if (stats.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-[var(--radius-card)]" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (stats.isError) {
    return (
      <p role="alert" className="surface-card p-5 text-sm text-[hsl(var(--danger))]">
        {(stats.error as Error).message}
      </p>
    );
  }

  const donnees = stats.data as unknown as {
    parSecteur: StatSecteur[];
    totaux: Totaux;
    devise: string;
    rapportsRecents: RapportRecent[];
  };

  const totaux = donnees.totaux;
  const parSecteur = donnees.parSecteur ?? [];

  // En mode démonstration, se limiter au chiffre d'affaires réel laisserait la
  // page entierement a zero. On affiche donc le total, en disant clairement ce
  // qu'il contient plutot qu'en melangeant les deux sans le signaler.
  const toutSimule = totaux.nb_ventes === 0 && totaux.nb_ventes_simulees > 0;
  const meilleur = [...parSecteur].sort((a, b) =>
    (b.revenu + b.revenu_simule) - (a.revenu + a.revenu_simule))[0];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Activite commerciale et rapports produits.
        </p>
      </header>

      {toutSimule && (
        <p className="surface-card px-4 py-3 text-sm">
          <Badge variant="avertissement" className="mr-2">Mode démonstration</Badge>
          Aucune vente reelle enregistree : les montants ci-dessous correspondent a des
          commandes validees sans debit.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          index={0}
          libelle="Rapports vendus"
          valeur={formatNombre(totaux.nb_ventes_total)}
          Icone={TrendingUp}
          detail={totaux.nb_ventes_simulees > 0
            ? `dont ${formatNombre(totaux.nb_ventes_simulees)} en démonstration`
            : undefined}
        />
        <StatCard
          index={1}
          libelle={toutSimule ? 'Montant des commandes' : "Chiffre d'affaires"}
          valeur={formatMontant(toutSimule ? totaux.revenu_total : totaux.revenu, donnees.devise)}
          Icone={Wallet}
          teinte="succes"
          detail={!toutSimule && totaux.revenu_simule > 0
            ? `${formatMontant(totaux.revenu_simule, donnees.devise)} simules, exclus`
            : undefined}
        />
        <StatCard
          index={2}
          libelle="Rapports générés"
          valeur={formatNombre(totaux.nb_rapports_generes)}
          Icone={FileText}
        />
        <StatCard
          index={3}
          libelle="Secteur le plus demande"
          valeur={meilleur && (meilleur.revenu + meilleur.revenu_simule) > 0 ? meilleur.nom : '—'}
          Icone={Layers}
          teinte="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader><CardTitle>Ventes par secteur</CardTitle></CardHeader>
          <CardContent>
            <GraphiqueVentes donnees={parSecteur} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Part de chaque secteur</CardTitle></CardHeader>
          <CardContent>
            {/* Le graphique en barres compare les montants, l'anneau montre le
                POIDS RELATIF : deux lectures distinctes de la meme serie. En
                mode demonstration, ou le revenu reel est nul, on repartit le
                volume total plutot que d'afficher un anneau vide. */}
            <GraphiqueRepartition
              donnees={parSecteur.map((secteur) => ({
                nom: secteur.nom,
                valeur: Number(secteur.revenu ?? 0) + Number(secteur.revenu_simule ?? 0),
              }))}
              unite={donnees.devise}
              total={{ valeur: formatMontant(totaux.revenu_total, donnees.devise), libelle: 'toutes ventes' }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Detail par secteur</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(var(--border))] text-left text-xs uppercase tracking-wide text-[hsl(var(--muted))]">
                  <th className="pb-2 font-semibold">Secteur</th>
                  <th className="pb-2 text-right font-semibold">Ventes</th>
                  <th className="pb-2 text-right font-semibold">Revenus</th>
                  <th className="pb-2 text-right font-semibold">Rapports</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {parSecteur.map((secteur) => (
                  <tr key={secteur.id}>
                    <td className="py-3">
                      <Link className="font-medium hover:underline" to={`/admin/secteurs/${secteur.id}`}>
                        {secteur.nom}
                      </Link>
                    </td>
                    <td className="py-3 text-right">
                      {formatNombre(secteur.nb_ventes)}
                      {secteur.nb_ventes_simulees > 0 && (
                        <span className="text-[hsl(var(--muted))]"> +{secteur.nb_ventes_simulees}</span>
                      )}
                    </td>
                    {/* Les revenus se lisent comme les ventes juste a cote :
                        le montant reel d'abord, le simule ajoute en gris.
                        N'afficher que le reel laissait la colonne entierement
                        a zero en mode demonstration, alors que la colonne
                        Ventes, elle, montrait bien les commandes validees. */}
                    <td className="py-3 text-right font-semibold">
                      {formatMontant(secteur.revenu, donnees.devise)}
                      {Number(secteur.revenu_simule ?? 0) > 0 && (
                        <span className="font-normal text-[hsl(var(--muted))]">
                          {' '}+{formatMontant(secteur.revenu_simule, donnees.devise)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">{formatNombre(secteur.nb_rapports_generes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Derniers rapports produits</CardTitle></CardHeader>
          <CardContent>
            {donnees.rapportsRecents?.length ? (
              <ul className="divide-y divide-[hsl(var(--border))]">
                {donnees.rapportsRecents.slice(0, 8).map((rapport) => (
                  <li key={rapport.id} className="flex items-center gap-3 py-2.5">
                    <FileText className="size-4 shrink-0 text-[hsl(var(--muted))]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{rapport.titre}</p>
                      <p className="text-xs text-[hsl(var(--muted))]">
                        {formatDate(rapport.date_generation, true)}
                        {rapport.nombre_pages ? ` · ${rapport.nombre_pages} pages` : ''}
                      </p>
                    </div>
                    {rapport.chemin_fichier && (
                      <Button asChild variant="ghost" size="sm">
                        <a href={fileUrl(rapport.chemin_fichier)} target="_blank" rel="noreferrer">
                          Ouvrir
                        </a>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-[hsl(var(--muted))]">
                Aucun rapport produit pour le moment.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
