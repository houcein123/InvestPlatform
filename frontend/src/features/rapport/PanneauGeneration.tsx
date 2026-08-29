import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Download, FileText, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTraduction } from '@/i18n';
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
  const { t } = useTraduction();
  const progression = job?.progression ?? 0;
  // L'etape en cours est produite par le backend, donc toujours en francais :
  // seul le libelle de repli, choisi ici, suit la langue de l'interface.
  const etape = job?.etape ?? t.generation.etapeParDefaut;

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
                <p className="font-display font-semibold">{t.generation.echecTitre}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  {job?.erreur ?? t.generation.echecDefaut}
                </p>
                {/* Le paiement est acquis : le dire explicitement evite la
                    question qui vient immediatement a l'esprit. */}
                <p className="mt-2 text-sm text-[hsl(var(--muted))]">
                  {t.generation.echecPaiement}
                </p>
              </div>
            </div>
            {onRelancer && (
              <Button variant="outline" onClick={onRelancer} className="self-start">
                {t.generation.relancerGeneration}
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
                <p className="font-display font-semibold">{t.generation.pretTitre}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  {/* Le volume annonce est celui du document reellement
                      produit, compte a la fin du rendu : deux generations d'un
                      meme secteur ne font pas le meme nombre de pages. */}
                  {job.nombrePages
                    ? t.generation.pretPages(job.nombrePages, secondes)
                    : t.generation.pretSansPages(secondes)}
                  {' '}{t.generation.pretDisponible}
                </p>
              </div>
            </div>

            {/* Le controle qualite est un AVERTISSEMENT, pas un blocage : le
                rapport est paye et telechargeable. On le montre malgre tout,
                car un chiffre non source dans un document vendu ne doit pas
                rester dans un journal serveur. */}
            {job.controleQualite && job.controleQualite.suspectes.length > 0 && (
              <div className="rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.08)] px-4 py-3">
                <p className="text-sm font-semibold">
                  {t.generation.qualiteTitre(job.controleQualite.suspectes.length)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted))]">
                  {t.generation.qualiteTexte}
                </p>
                <ul className="mt-2 space-y-1">
                  {job.controleQualite.suspectes.map((s) => (
                    <li key={s.section} className="text-xs text-[hsl(var(--muted))]">
                      <span className="font-medium text-[hsl(var(--foreground))]">{s.section}</span>
                      {s.chiffres.length > 0 && <> — {s.chiffres.join(', ')}</>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[0.6875rem] text-[hsl(var(--muted))]">
                  {t.generation.qualiteModele(job.controleQualite.modele)}
                </p>
              </div>
            )}

            {job.sectionsManquantes && job.sectionsManquantes.length > 0 && (
              <p className="rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] px-3 py-2 text-sm">
                {t.generation.sectionsManquantes(job.sectionsManquantes.length)}
              </p>
            )}

            <Button asChild size="lg" className="self-start">
              <a href={fileUrl(job.pdfUrl)} target="_blank" rel="noreferrer">
                <Download /> {t.generation.telechargerRapport}
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
                <p className="font-display font-semibold">{t.generation.enCoursTitre}</p>
                <p className="mt-1 text-sm text-[hsl(var(--muted))]">
                  {t.generation.enCoursTexte(dureeEstimee)}
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
                  {t.generation.avancement(Math.round(progression), secondes)}
                </span>
              </div>
            </div>

            <p className="flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
              <FileText className="size-3.5" />
              {t.generation.neFermezPas}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
