import { Eye, FileText, Lock, RefreshCw, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconeSecteur } from '@/features/catalogue/IconeSecteur';
import { api } from '@/lib/api';
import type { ConfigPaiement, Secteur } from '@/lib/types';
import { formatMontant } from '@/lib/utils';

interface Props {
  secteur: Secteur;
  config?: ConfigPaiement;
}

const GARANTIES = [
  { Icone: FileText, texte: 'Rapport PDF livré immédiatement après validation' },
  { Icone: RefreshCw, texte: 'Régénération gratuite en cas d’échec technique' },
  { Icone: Lock, texte: 'Aucun identifiant bancaire conservé par la plateforme' },
];

/**
 * Récapitulatif de commande.
 *
 * Détaille la ligne facturée AVANT le paiement, avec le montant réellement
 * débité quand il diffère du tarif affiché — le dinar tunisien n'étant pas
 * accepté par PayPal, la transaction part dans une autre devise. Découvrir
 * cette conversion sur l'écran du prestataire est la surprise qui fait
 * abandonner un panier.
 */
export function RecapitulatifCommande({ secteur, config }: Props) {
  const deviseAffichage = config?.deviseAffichage ?? 'TND';
  const conversionNecessaire = Boolean(
    config?.mode === 'paypal' && config.tauxConversion && config.devisePaiement !== deviseAffichage,
  );
  const montantDebite = conversionNecessaire
    ? Math.max(0.01, Math.round(Number(secteur.prix_rapport) * (config?.tauxConversion ?? 1) * 100) / 100)
    : null;

  return (
    <aside className="surface-card h-fit p-6 lg:sticky lg:top-24">
      <h2 className="font-display text-base font-semibold">Récapitulatif</h2>

      <div className="mt-4 flex items-start gap-3 border-b border-[hsl(var(--border))] pb-4">
        <IconeSecteur slug={secteur.slug} taille="sm" />
        <div className="min-w-0">
          <p className="font-semibold leading-tight">{secteur.nom}</p>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted))]">
            Rapport sectoriel · {secteur.nombre_pages} pages minimum · format PDF
          </p>
        </div>
      </div>

      <dl className="space-y-2.5 py-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-[hsl(var(--muted))]">Sous-total</dt>
          <dd className="tabular">{formatMontant(secteur.prix_rapport, deviseAffichage)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-[hsl(var(--muted))]">Frais de service</dt>
          <dd className="tabular text-[hsl(var(--muted))]">Aucun</dd>
        </div>
        <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-2.5">
          <dt className="font-semibold">Total à régler</dt>
          <dd className="tabular font-display text-lg font-bold">
            {formatMontant(secteur.prix_rapport, deviseAffichage)}
          </dd>
        </div>

        {conversionNecessaire && montantDebite !== null && (
          <div className="flex items-start justify-between gap-3 rounded-[var(--radius-control)] bg-[hsl(var(--surface-muted))] px-3 py-2.5">
            <dt className="text-xs leading-relaxed text-[hsl(var(--muted))]">
              Montant débité par PayPal
              <span className="mt-0.5 block">
                Le dinar tunisien n&apos;est pas une devise acceptée : la transaction est
                présentée en {config?.devisePaiement}.
              </span>
            </dt>
            <dd className="tabular whitespace-nowrap text-sm font-semibold">
              {formatMontant(montantDebite, config?.devisePaiement ?? 'EUR')}
            </dd>
          </div>
        )}
      </dl>

      <ul className="space-y-2 border-t border-[hsl(var(--border))] py-4">
        {GARANTIES.map(({ Icone, texte }) => (
          <li key={texte} className="flex items-start gap-2 text-xs leading-relaxed text-[hsl(var(--muted))]">
            <Icone className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--success))]" />
            {texte}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-[hsl(var(--border))] pt-4">
        {config?.mode === 'paypal' ? (
          <Badge variant={config.argentReel ? 'danger' : 'avertissement'}>
            <ShieldCheck /> PayPal {config.environnement}
            {config.argentReel ? ' · argent réel' : ' · bac à sable'}
          </Badge>
        ) : (
          <Badge variant="neutre">Mode démonstration</Badge>
        )}
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <a href={api.previewUrl(secteur.id)} target="_blank" rel="noreferrer">
          <Eye /> Consulter l&apos;aperçu gratuit
        </a>
      </Button>
    </aside>
  );
}
