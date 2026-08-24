import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BoutonPayPal } from '@/features/paiement/BoutonPayPal';
import { FormulaireSimulation } from '@/features/paiement/FormulaireSimulation';
import { RecapitulatifCommande } from '@/features/paiement/RecapitulatifCommande';
import { PanneauGeneration } from '@/features/rapport/PanneauGeneration';
import { useGenerationRapport } from '@/features/rapport/useGenerationRapport';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { PaiementConfirme } from '@/lib/types';
import { formatMontant } from '@/lib/utils';

type Etape = 'paiement' | 'generation';

const ETAPES: { cle: Etape | 'livraison'; libelle: string }[] = [
  { cle: 'paiement', libelle: 'Paiement' },
  { cle: 'generation', libelle: 'Génération' },
  { cle: 'livraison', libelle: 'Téléchargement' },
];

export default function Paiement() {
  const { id } = useParams<{ id: string }>();
  const sectorId = Number(id);

  const [etape, setEtape] = useState<Etape>('paiement');
  const [achatId, setAchatId] = useState<number | null>(null);

  const secteur = useQuery({
    queryKey: cles.secteur(sectorId),
    queryFn: () => api.secteur(sectorId),
    enabled: Number.isFinite(sectorId),
  });
  const config = useQuery({ queryKey: cles.configPaiement, queryFn: api.paymentConfig });

  const generation = useGenerationRapport();
  const { lancer: lancerGeneration } = generation;

  // La generation s'enchaine automatiquement au paiement : demander un second
  // clic apres un reglement abouti n'apporte rien et laisse croire que quelque
  // chose a echoue.
  //
  // Le garde-fou est une REFERENCE, pas un test sur l'etat du job. Avec
  // `!generation.job && !generation.demarrage`, il existe une fenetre entre la
  // fin de la requete de lancement et la premiere reponse de progression ou
  // les deux conditions sont fausses : l'effet relancait alors une generation.
  // Combine a une dependance dont l'identite changeait a chaque rendu, cela a
  // declenche une centaine de generations du meme rapport et sature le quota
  // de redaction. Un identifiant d'achat ne doit lancer qu'une seule fois.
  const achatLance = useRef<number | null>(null);

  useEffect(() => {
    if (etape !== 'generation' || achatId === null) return;
    if (achatLance.current === achatId) return;

    achatLance.current = achatId;
    lancerGeneration({ sectorId, achatId });
  }, [etape, achatId, sectorId, lancerGeneration]);

  function surPaiementConfirme(resultat: PaiementConfirme & { achatId: number }) {
    setAchatId(resultat.achatId);
    setEtape('generation');
    toast.success(
      resultat.mode === 'paypal' ? 'Paiement confirmé' : 'Commande confirmée',
      { description: `${formatMontant(resultat.montant, resultat.devise)} — la rédaction démarre.` },
    );
  }

  const etapeCourante = etape === 'paiement' ? 0 : generation.termine ? 2 : 1;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/"><ArrowLeft /> Retour au catalogue</Link>
      </Button>

      {/* Fil d'etapes : sur un parcours qui melange paiement et attente longue,
          savoir ou l'on en est evite de croire que le processus est bloque. */}
      <ol className="flex items-center gap-3">
        {ETAPES.map((element, index) => {
          const atteinte = index <= etapeCourante;
          return (
            <li key={element.cle} className="flex flex-1 items-center gap-3">
              <span
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                  atteinte
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))]'
                }`}
              >
                {index < etapeCourante ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className={`hidden text-sm font-medium sm:block ${atteinte ? '' : 'text-[hsl(var(--muted))]'}`}>
                {element.libelle}
              </span>
              {index < ETAPES.length - 1 && (
                <span className="h-px flex-1 bg-[hsl(var(--border))]" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {etape === 'paiement' ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="surface-card p-6"
            >
              <h2 className="font-display text-lg font-semibold">Règlement</h2>
              <p className="mb-5 mt-1 text-sm text-[hsl(var(--muted))]">
                Le montant est calculé par le serveur a partir du tarif du catalogue.
                Il n&apos;est jamais transmis depuis votre navigateur.
              </p>

              {config.isLoading && <Skeleton className="h-32 w-full" />}

              {config.data?.mode === 'paypal' ? (
                <BoutonPayPal
                  config={config.data}
                  sectorId={sectorId}
                  onPaiementConfirme={surPaiementConfirme}
                  onErreur={(message) => toast.error('Paiement interrompu', { description: message })}
                />
              ) : config.data ? (
                <FormulaireSimulation
                  sectorId={sectorId}
                  onPaiementConfirme={surPaiementConfirme}
                  onErreur={(message) => toast.error('Commande interrompue', { description: message })}
                />
              ) : null}

              <p className="mt-5 flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
                <Lock className="size-3.5" />
                Vos identifiants de paiement ne transitent jamais par cette plateforme.
              </p>
            </motion.section>
          ) : (
            <PanneauGeneration
              job={generation.job}
              enCours={generation.enCours}
              termine={generation.termine}
              enErreur={generation.enErreur}
              secondes={generation.secondes}
              onRelancer={() => achatId !== null && generation.relancer(achatId)}
            />
          )}
        </div>

        {secteur.isLoading ? (
          <aside className="surface-card h-fit space-y-3 p-6">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-24 w-full" />
          </aside>
        ) : secteur.data ? (
          <RecapitulatifCommande secteur={secteur.data.secteur} config={config.data} />
        ) : (
          <aside className="surface-card h-fit p-6 text-sm text-[hsl(var(--muted))]">
            Secteur introuvable.
          </aside>
        )}
      </div>
    </div>
  );
}
