import { useRef, useState } from 'react';
import {
  PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer, FUNDING,
} from '@paypal/react-paypal-js';
import { Info, Loader2 } from 'lucide-react';

import { api } from '@/lib/api';
import type { ConfigPaiement, PaiementConfirme } from '@/lib/types';

interface Props {
  config: ConfigPaiement;
  sectorId: number;
  onPaiementConfirme: (resultat: PaiementConfirme & { achatId: number }) => void;
  onErreur: (message: string) => void;
}

/** Traduit les echecs les plus frequents en consigne actionnable. */
function messageLisible(erreur: unknown) {
  const brut = erreur instanceof Error ? erreur.message : String(erreur ?? '');

  if (/popup|window|blocked|closed/i.test(brut)) {
    return "La fenetre PayPal n'a pas pu s'ouvrir. Autorisez les fenêtres surgissantes pour ce site, puis réessayez.";
  }
  if (/Connexion requise|401/i.test(brut)) {
    return 'Votre session a expiré. Reconnectez-vous puis relancez le paiement.';
  }
  return brut || 'Le paiement a échoué.';
}

/** Etat de chargement du SDK, lu depuis le fournisseur. */
function EtatSdk() {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isRejected) {
    return (
      <p role="alert" className="text-sm font-medium text-[hsl(var(--danger))]">
        Impossible de charger PayPal. Vérifiez votre connexion ou un eventuel bloqueur de publicités.
      </p>
    );
  }
  if (isPending) {
    return (
      <p className="flex items-center gap-2 text-sm text-[hsl(var(--muted))]">
        <Loader2 className="size-4 animate-spin" /> Chargement de PayPal...
      </p>
    );
  }
  return null;
}

/**
 * Bouton de paiement PayPal (API Orders v2).
 *
 * Le SDK officiel `@paypal/react-paypal-js` remplace le chargement manuel du
 * script : le fournisseur gere le cycle de vie du script et le demontage des
 * iframes, ce qui supprime la classe de bugs ou un second jeu de boutons
 * venait s'empiler apres un re-rendu.
 *
 * Deux invariants de securite, cote serveur et non ici :
 *   - le MONTANT n'est jamais transmis depuis le navigateur : la commande est
 *     creee a partir du tarif du catalogue lu en base ;
 *   - le montant reellement encaisse est reverifie avant que le rapport ne
 *     soit debloque.
 *
 * `fundingSource={FUNDING.PAYPAL}` limite l'affichage a un seul bouton. Par
 * defaut le SDK ajoute « Carte bancaire », qui ouvre le paiement invite : un
 * parcours distinct, sur lequel le reglage `landing_page: LOGIN` de la
 * commande n'a aucun effet, et qui prete a confusion.
 */
export function BoutonPayPal({ config, sectorId, onPaiementConfirme, onErreur }: Props) {
  const [enCours, setEnCours] = useState(false);

  // L'identifiant d'achat vit dans une reference : il est cree par le serveur
  // au moment de la commande et doit survivre aux rendus intermediaires entre
  // l'approbation et l'encaissement.
  const achatId = useRef<number | null>(null);

  if (!config.configure || !config.clientId) {
    return (
      <p role="alert" className="text-sm font-medium text-[hsl(var(--danger))]">
        Paiement indisponible : PayPal n&apos;est pas configure cote serveur.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <PayPalScriptProvider
        options={{
          clientId: config.clientId,
          currency: config.devisePaiement ?? 'EUR',
          intent: 'capture',
          // Sans cette locale, PayPal deduit la langue de l'adresse IP et
          // sert la page en arabe ou en anglais depuis la Tunisie.
          locale: config.locale ?? 'fr_FR',
          components: 'buttons',
        }}
      >
        <EtatSdk />

        <PayPalButtons
          fundingSource={FUNDING.PAYPAL}
          style={{ height: 46, tagline: false, label: 'pay', shape: 'rect' }}
          disabled={enCours}
          createOrder={async () => {
            setEnCours(true);
            try {
              const commande = await api.createOrder(sectorId);
              achatId.current = commande.achatId;
              if (!commande.orderId) {
                throw new Error("Le serveur n'a pas renvoye de commande PayPal.");
              }
              return commande.orderId;
            } catch (erreur) {
              setEnCours(false);
              onErreur(messageLisible(erreur));
              throw erreur;
            }
          }}
          onApprove={async (donnees) => {
            try {
              const resultat = await api.capturePayment(donnees.orderID, achatId.current as number);
              onPaiementConfirme({ ...resultat, achatId: achatId.current as number });
            } catch (erreur) {
              onErreur(messageLisible(erreur));
            } finally {
              setEnCours(false);
            }
          }}
          onError={(erreur) => {
            setEnCours(false);
            onErreur(messageLisible(erreur));
          }}
          onCancel={() => {
            setEnCours(false);
            onErreur("Paiement annulé — aucun montant n'a été débité.");
          }}
        />
      </PayPalScriptProvider>

      {/* Note d'information, pas une alerte : elle s'affiche en permanence
          en bac a sable, avant toute tentative de paiement. Le cadre orange
          la faisait passer pour une erreur. */}
      {!config.argentReel && (
        <p className="flex items-start gap-2 rounded-[var(--radius-control)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-muted))] px-3 py-2.5 text-xs leading-relaxed text-[hsl(var(--muted))]">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>
            <strong className="text-[hsl(var(--foreground))]">Environnement de test.</strong>{' '}
            Aucun montant reel ne sera debite. Cliquez sur <strong>Connexion</strong> dans
            la fenetre PayPal et utilisez un compte acheteur sandbox
            (developer.paypal.com → Testing Tools → Sandbox accounts) : un compte
            PayPal reel n'existe pas dans cet environnement.
          </span>
        </p>
      )}

    </div>
  );
}
