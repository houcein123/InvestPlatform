import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Eye, FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTraduction } from '@/i18n';
import { useLibelleSecteur } from '@/i18n/donnees';
import { api } from '@/lib/api';
import type { Secteur } from '@/lib/types';
import { formatDate, formatMontant } from '@/lib/utils';

import { IconeSecteur } from './IconeSecteur';

interface Props {
  secteur: Secteur;
  devise: string;
  /** Montant equivalent presente a PayPal, quand la devise de paiement differe. */
  equivalent?: { montant: number; devise: string } | null;
  index: number;
}

/**
 * Carte du catalogue.
 *
 * Deux montants peuvent apparaitre, et c'est voulu : le tarif reste en TND
 * (affichage et comptabilite), mais PayPal n'accepte pas le dinar tunisien.
 * Masquer le montant reellement débité serait une mauvaise surprise au moment
 * du paiement.
 */
export function CarteSecteur({ secteur, devise, equivalent, index }: Props) {
  const { t, langue } = useTraduction();
  const libelle = useLibelleSecteur();

  return (
    <motion.article
      className="surface-card group flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.3), ease: 'easeOut' }}
      whileHover={{ y: -4 }}
    >
      <div className="flex items-start gap-4 p-6 pb-4">
        <IconeSecteur slug={secteur.slug} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight">{libelle.nom(secteur)}</h3>
          <p className="mt-1 text-sm leading-relaxed text-[hsl(var(--muted))]">
            {libelle.description(secteur)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 pb-5">
        <Badge variant="neutre">
          <FileText /> {t.carteSecteur.pages(secteur.nombre_pages)}
        </Badge>
        <Badge variant="neutre">{t.carteSecteur.misAJourLe(formatDate(secteur.date_maj))}</Badge>
      </div>

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[hsl(var(--border))] p-6">
        <div>
          <p className="font-display text-2xl font-bold tabular">
            {formatMontant(secteur.prix_rapport, devise)}
          </p>
          {equivalent && (
            <p className="text-xs text-[hsl(var(--muted))]">
              {t.carteSecteur.debite(formatMontant(equivalent.montant, equivalent.devise))}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={api.previewUrl(secteur.id, langue)} target="_blank" rel="noreferrer">
              <Eye /> {t.carteSecteur.apercu}
            </a>
          </Button>
          <Button asChild>
            <Link to={`/paiement/${secteur.id}`}>
              {t.carteSecteur.commander} <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
