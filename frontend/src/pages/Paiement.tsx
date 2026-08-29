import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Languages, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BoutonPayPal } from '@/features/paiement/BoutonPayPal';
import { FormulaireSimulation } from '@/features/paiement/FormulaireSimulation';
import { RecapitulatifCommande } from '@/features/paiement/RecapitulatifCommande';
import { PanneauGeneration } from '@/features/rapport/PanneauGeneration';
import { useGenerationRapport } from '@/features/rapport/useGenerationRapport';
import { LANGUES, useTraduction, type Langue } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import type { PaiementConfirme } from '@/lib/types';
import { formatMontant } from '@/lib/utils';

type Etape = 'paiement' | 'generation';

/** Le fil d'etapes, dans la langue active. */
function etapes(t: Dictionnaire): { cle: Etape | 'livraison'; libelle: string }[] {
  return [
    { cle: 'paiement', libelle: t.paiement.etapePaiement },
    { cle: 'generation', libelle: t.paiement.etapeGeneration },
    { cle: 'livraison', libelle: t.paiement.etapeLivraison },
  ];
}

export default function Paiement() {
  const { id } = useParams<{ id: string }>();
  const { t, langue } = useTraduction();
  const sectorId = Number(id);

  // La langue du RAPPORT est initialisée sur celle de l'interface — le choix
  // le plus probable — mais reste modifiable : un lecteur francophone peut
  // commander un document anglais pour un partenaire ou un dossier bancaire.
  const [langueRapport, setLangueRapport] = useState<Langue>(langue);

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
    lancerGeneration({ sectorId, achatId, langue: langueRapport });
  }, [etape, achatId, sectorId, lancerGeneration, langueRapport]);

  function surPaiementConfirme(resultat: PaiementConfirme & { achatId: number }) {
    setAchatId(resultat.achatId);
    setEtape('generation');
    toast.success(
      resultat.mode === 'paypal' ? t.paiement.paiementConfirme : t.paiement.commandeConfirmee,
      { description: t.paiement.redactionDemarre(formatMontant(resultat.montant, resultat.devise)) },
    );
  }

  const etapeCourante = etape === 'paiement' ? 0 : generation.termine ? 2 : 1;
  const listeEtapes = etapes(t);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/"><ArrowLeft /> {t.paiement.retourCatalogue}</Link>
      </Button>

      {/* Fil d'etapes : sur un parcours qui melange paiement et attente longue,
          savoir ou l'on en est evite de croire que le processus est bloque. */}
      <ol className="flex items-center gap-3">
        {listeEtapes.map((element, index) => {
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
              {index < listeEtapes.length - 1 && (
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
              <h2 className="font-display text-lg font-semibold">{t.paiement.reglementTitre}</h2>
              <p className="mb-5 mt-1 text-sm text-[hsl(var(--muted))]">
                {t.paiement.reglementTexte}
              </p>

              <fieldset className="mb-6 rounded-[var(--radius-control)] border border-[hsl(var(--border))] p-4">
                <legend className="px-1.5 text-sm font-semibold">
                  {t.paiement.langueRapportTitre}
                </legend>
                <div className="mt-1 grid gap-2 sm:grid-cols-2">
                  {LANGUES.map((code) => {
                    const actif = langueRapport === code;
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLangueRapport(code)}
                        aria-pressed={actif}
                        className={
                          'flex items-center gap-2.5 rounded-[var(--radius-control)] border p-3 text-left text-sm transition-colors '
                          + (actif
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-soft))] font-medium'
                            : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-muted))]')
                        }
                      >
                        <Languages
                          className={'size-4 ' + (actif ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted))]')}
                        />
                        {code === 'fr' ? t.paiement.langueFrancais : t.paiement.langueAnglais}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-[hsl(var(--muted))]">
                  {t.paiement.langueRapportAide}
                </p>
              </fieldset>

              {config.isLoading && <Skeleton className="h-32 w-full" />}

              {config.data?.mode === 'paypal' ? (
                <BoutonPayPal
                  config={config.data}
                  sectorId={sectorId}
                  onPaiementConfirme={surPaiementConfirme}
                  onErreur={(message) => toast.error(t.paiement.paiementInterrompu, { description: message })}
                />
              ) : config.data ? (
                <FormulaireSimulation
                  sectorId={sectorId}
                  onPaiementConfirme={surPaiementConfirme}
                  onErreur={(message) => toast.error(t.paiement.commandeInterrompue, { description: message })}
                />
              ) : null}

              <p className="mt-5 flex items-center gap-2 text-xs text-[hsl(var(--muted))]">
                <Lock className="size-3.5" />
                {t.paiement.identifiantsJamais}
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
            {t.paiement.secteurIntrouvable}
          </aside>
        )}
      </div>
    </div>
  );
}
