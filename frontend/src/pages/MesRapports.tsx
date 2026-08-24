import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, FileText, RefreshCw, ShoppingBag } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PanneauGeneration } from '@/features/rapport/PanneauGeneration';
import { useGenerationRapport } from '@/features/rapport/useGenerationRapport';
import { api, fileUrl } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { formatDate, formatMontant } from '@/lib/utils';

export default function MesRapports() {
  const achats = useQuery({ queryKey: cles.mesRapports, queryFn: api.mesRapports });
  const generation = useGenerationRapport();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">Mes rapports</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Vos commandes réglées et les documents livrés. Un rapport reste telechargeable
          indefiniment.
        </p>
      </header>

      {/* Une relance lancee depuis cette page s'affiche ici, au-dessus de la
          liste : elle concerne l'ensemble, pas une ligne en particulier. */}
      {generation.job && (
        <PanneauGeneration
          job={generation.job}
          enCours={generation.enCours}
          termine={generation.termine}
          enErreur={generation.enErreur}
          secondes={generation.secondes}
        />
      )}

      {achats.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      )}

      {achats.data?.achats.length === 0 && (
        <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-[hsl(var(--surface-muted))]">
            <ShoppingBag className="size-6 text-[hsl(var(--muted))]" />
          </span>
          <p className="font-display font-semibold">Aucune commande pour le moment</p>
          <p className="max-w-sm text-sm text-[hsl(var(--muted))]">
            Les rapports que vous commandez apparaîtront ici, avec leur lien de téléchargement.
          </p>
          <Button asChild className="mt-2"><a href="/">Parcourir le catalogue</a></Button>
        </div>
      )}

      <div className="space-y-3">
        {achats.data?.achats.map((achat, index) => (
          <motion.article
            key={achat.achat_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.25) }}
            className="surface-card flex flex-wrap items-center gap-4 p-5"
          >
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]">
              <FileText className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-tight">{achat.secteur}</p>
              <p className="mt-1 text-xs text-[hsl(var(--muted))]">
                Commande du {formatDate(achat.date_achat)} · {formatMontant(achat.montant)}
                {achat.mode_paiement === 'simulation' && ' · démonstration'}
                {/* Volume du document effectivement livre, pas celui annonce
                    au catalogue : deux rapports du meme secteur n'ont pas le
                    meme nombre de pages selon la longueur des analyses. */}
                {achat.chemin_fichier && achat.nombre_pages
                  ? ` · ${achat.nombre_pages} pages`
                  : ''}
              </p>
            </div>

            {achat.chemin_fichier ? (
              <div className="flex items-center gap-2">
                <Badge variant="succes">Livré le {formatDate(achat.date_generation)}</Badge>
                <Button asChild size="sm">
                  <a href={fileUrl(achat.chemin_fichier)} target="_blank" rel="noreferrer">
                    <Download /> Télécharger
                  </a>
                </Button>
              </div>
            ) : (
              /* Un achat regle dont le rapport manque : le droit vient de
                 l'achat verifie en base, la relance n'est jamais refacturee. */
              <div className="flex items-center gap-2">
                <Badge variant="avertissement">Rapport à produire</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  chargement={generation.demarrage}
                  onClick={() => generation.relancer(achat.achat_id)}
                >
                  <RefreshCw /> Relancer
                </Button>
              </div>
            )}
          </motion.article>
        ))}
      </div>
    </div>
  );
}
