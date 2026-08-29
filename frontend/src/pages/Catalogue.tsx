import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, FileCheck2, ShieldCheck } from 'lucide-react';

import { CarteSecteur } from '@/features/catalogue/CarteSecteur';
import { SkeletonCarteSecteur } from '@/components/ui/skeleton';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';

/** Les trois arguments de la vitrine, dans la langue active. */
function argumentsCles(t: Dictionnaire) {
  return [
    { Icone: FileCheck2, titre: t.catalogue.argumentDonnees, texte: t.catalogue.argumentDonneesTexte },
    { Icone: BarChart3, titre: t.catalogue.argumentPerspectives, texte: t.catalogue.argumentPerspectivesTexte },
    { Icone: ShieldCheck, titre: t.catalogue.argumentLivraison, texte: t.catalogue.argumentLivraisonTexte },
  ];
}

export default function Catalogue() {
  const { t } = useTraduction();
  const catalogue = useQuery({ queryKey: cles.catalogue, queryFn: api.catalogue });
  const paiement = useQuery({ queryKey: cles.configPaiement, queryFn: api.paymentConfig });

  const devise = paiement.data?.deviseAffichage ?? 'TND';
  const taux = paiement.data?.tauxConversion;
  const devisePaiement = paiement.data?.devisePaiement;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--surface-muted))] p-8 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
            {t.catalogue.surtitre}
          </p>
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
            {t.catalogue.titre}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[hsl(var(--muted))]">
            {t.catalogue.accroche}
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {argumentsCles(t).map(({ Icone, titre, texte }, index) => (
            <motion.div
              key={titre}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.08 }}
              className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.6)] p-4"
            >
              <Icone className="mb-2 size-5 text-[hsl(var(--primary))]" />
              <p className="text-sm font-semibold">{titre}</p>
              <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted))]">{texte}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">{t.catalogue.sectionTitre}</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              {t.catalogue.sectionAccroche}
            </p>
          </div>
        </div>

        {catalogue.isError && (
          <div role="alert" className="surface-card flex items-start gap-3 p-5 text-sm">
            <AlertCircle className="size-5 shrink-0 text-[hsl(var(--danger))]" />
            <div>
              <p className="font-semibold">{t.catalogue.erreurTitre}</p>
              <p className="mt-1 text-[hsl(var(--muted))]">{(catalogue.error as Error).message}</p>
            </div>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {catalogue.isLoading
            ? Array.from({ length: 6 }, (_, index) => <SkeletonCarteSecteur key={index} />)
            : catalogue.data?.secteurs.map((secteur, index) => (
                <CarteSecteur
                  key={secteur.id}
                  secteur={secteur}
                  devise={devise}
                  index={index}
                  equivalent={
                    taux && devisePaiement && devisePaiement !== devise
                      ? {
                          montant: Math.max(0.01, Math.round(Number(secteur.prix_rapport) * taux * 100) / 100),
                          devise: devisePaiement,
                        }
                      : null
                  }
                />
              ))}
        </div>
      </section>
    </div>
  );
}
