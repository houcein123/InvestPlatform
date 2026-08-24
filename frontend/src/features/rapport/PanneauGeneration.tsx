import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { fileUrl } from '@/lib/api';
import type { JobGeneration } from '@/lib/types';

interface Props {
  job: JobGeneration | null;
  enCours: boolean;
  termine: boolean;
  enErreur: boolean;
  secondes: number;
  /** Duree annoncee par le backend, utilisee pour situer l'attente. */
  dureeEstimee?: number;
  onRelancer?: () => void;
}

/**
 * Suivi visuel de la generation du rapport (CDC section 6, etape 3).
 *
 * Le parti pris : afficher CE QUE FAIT le serveur, pas une animation
 * decorative. L'etape en cours vient du backend et change six fois pendant la
 * generation ; le chronometre et la duree estimee situent l'attente. Sur une
 * operation de 40 secondes deja payee, l'absence d'information est ce qui fait
 * recharger la page — et donc perdre le suivi.
 */
export function PanneauGeneration({
  job, enCours, termine, enErreur, secondes, dureeEstimee = 40, onRelancer,
}: Props) {
  const progression = job?.progression ?? 0;
  const etape = job?.etape ?? 'Préparation des données sectorielles';

  return (
    <div className="surface-card p-6">
      <AnimatePresence mode="wait">
        {enErreur ? (
          <motion.div
            key="erreur"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-[hsl(var(--danger-soft))] p-2.5 text-[hsl(var(--danger))]">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <p className="font-display font-semibold">La génération n&apos;a pas abouti</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  {job?.erreur ?? 'Une erreur est survenue pendant la fabrication du rapport.'}
                </p>
                {/* Le paiement est acquis : le dire explicitement evite la
                    question qui vient immediatement a l'esprit. */}
                <p className="mt-2 text-sm text-[hsl(var(--muted))]">
                  Votre paiement reste enregistré. Relancer la génération ne vous sera pas refacturé.
                </p>
              </div>
            </div>
            {onRelancer && (
              <Button variant="outline" onClick={onRelancer} className="self-start">
                Relancer la génération
              </Button>
            )}
          </motion.div>
        ) : termine && job?.pdfUrl ? (
          <motion.div
            key="termine"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <motion.span
                className="rounded-xl bg-[hsl(var(--success)/0.15)] p-2.5 text-[hsl(var(--success))]"
                initial={{ rotate: -12, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 14 }}
              >
                <CheckCircle2 className="size-5" />
              </motion.span>
              <div>
                <p className="font-display font-semibold">Votre rapport est prêt</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  {/* Le volume annonce est celui du document reellement
                      produit, compte a la fin du rendu : deux generations d'un
                      meme secteur ne font pas le meme nombre de pages. */}
                  {job.nombrePages ? `${job.nombrePages} pages, générées` : 'Généré'} en {secondes} secondes.
                  {' '}Il reste disponible dans « Mes rapports ».
                </p>
              </div>
            </div>

            {job.sectionsManquantes && job.sectionsManquantes.length > 0 && (
              <p className="rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] px-3 py-2 text-sm">
                {job.sectionsManquantes.length} section(s) rédigée(s) n&apos;ont pas pu être produites.
                Le rapport reste complet pour ses parties chiffrées et peut être relancé.
              </p>
            )}

            <Button asChild size="lg" className="self-start">
              <a href={fileUrl(job.pdfUrl)} target="_blank" rel="noreferrer">
                <Download /> Télécharger le rapport
              </a>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="encours"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            <div className="flex items-start gap-3">
              <motion.span
                className="rounded-xl bg-[hsl(var(--primary-soft))] p-2.5 text-[hsl(var(--primary))]"
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="size-5" />
              </motion.span>
              <div className="flex-1">
                <p className="font-display font-semibold">Rédaction de votre rapport sectoriel</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  Données officielles, projections et analyses sont assemblées en un document unique.
                  Comptez environ {dureeEstimee} secondes.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress valeur={progression} actif={enCours} />
              <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
                <motion.span key={etape} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                  {etape}
                </motion.span>
                <span className="tabular">
                  {Math.round(progression)} % · {secondes} s
                </span>
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
              <FileText className="size-3.5" />
              Ne fermez pas cette page : le suivi de la generation y est rattache.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
