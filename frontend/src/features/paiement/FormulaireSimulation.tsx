import { useState } from 'react';
import { FlaskConical, Info, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErreurChamp, Input, Label } from '@/components/ui/input';
import { api } from '@/lib/api';
import type { PaiementConfirme } from '@/lib/types';

interface Props {
  sectorId: number;
  onPaiementConfirme: (resultat: PaiementConfirme & { achatId: number }) => void;
  onErreur: (message: string) => void;
}

const EMAIL = /^[^\s@]+@[^\s@]+[.][^\s@]+$/;

/**
 * Validation de commande en mode démonstration.
 *
 * CE QUI A CHANGÉ ET POURQUOI. La version précédente demandait
 * « l'adresse de votre compte PayPal », ce qui imitait un écran de connexion
 * PayPal sans en être un : l'utilisateur pouvait croire qu'il s'authentifiait
 * auprès du prestataire alors qu'il remplissait un simple champ local.
 * L'apparence d'un formulaire d'identification là où il n'y en a pas est
 * exactement le motif d'une page de hameçonnage, quelle que soit l'intention.
 *
 * Le champ demande désormais une ADRESSE DE FACTURATION, ce qu'il a toujours
 * été en réalité : la trace comptable de la commande. Le bandeau indique sans
 * ambiguïté qu'aucun paiement n'a lieu et que le mode réel s'active par
 * configuration.
 *
 * AUCUN MOT DE PASSE N'EST DEMANDÉ NI STOCKÉ, et il ne doit jamais l'être :
 * aucune API PayPal ne permettrait de le vérifier, et la redirection vers leur
 * domaine existe précisément pour qu'un marchand ne voie jamais les
 * identifiants de ses clients.
 */
export function FormulaireSimulation({ sectorId, onPaiementConfirme, onErreur }: Props) {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);

  async function soumettre(evenement: React.FormEvent) {
    evenement.preventDefault();
    if (!EMAIL.test(email)) {
      setErreur('Saisissez une adresse email valide pour recevoir le justificatif.');
      return;
    }
    setErreur('');
    setEnCours(true);

    try {
      const commande = await api.createOrder(sectorId);
      const resultat = await api.capturePayment(null, commande.achatId, {
        emailPayeur: email,
        nomPayeur: nom || undefined,
      });
      onPaiementConfirme({ ...resultat, achatId: commande.achatId });
    } catch (probleme) {
      onErreur(probleme instanceof Error ? probleme.message : 'La validation a échoué.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-5">
      <div className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.08)] px-4 py-3">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-[hsl(var(--warning))]" />
        <div className="text-xs leading-relaxed">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Mode démonstration — aucun paiement
          </p>
          <p className="mt-1 text-[hsl(var(--muted))]">
            Aucun montant n&apos;est débité et aucun prestataire n&apos;est sollicité.
            La commande est enregistrée puis comptabilisée séparément du chiffre
            d&apos;affaires réel. Le règlement PayPal s&apos;active en renseignant
            <code className="mx-1 rounded bg-[hsl(var(--surface-muted))] px-1 py-0.5">PAYPAL_CLIENT_ID</code>
            et
            <code className="mx-1 rounded bg-[hsl(var(--surface-muted))] px-1 py-0.5">PAYPAL_CLIENT_SECRET</code>
            côté serveur.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email-facturation">Adresse de facturation</Label>
        <Input
          id="email-facturation"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.com"
          value={email}
          onChange={(evenement) => setEmail(evenement.target.value)}
          required
        />
        <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
          <Info className="size-3" /> Figure sur le justificatif de commande.
        </p>
        <ErreurChamp>{erreur}</ErreurChamp>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nom-facturation">Nom ou raison sociale (facultatif)</Label>
        <Input
          id="nom-facturation"
          autoComplete="name"
          placeholder="Prénom Nom / Société"
          value={nom}
          onChange={(evenement) => setNom(evenement.target.value)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" chargement={enCours}>
        Valider la commande
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-[hsl(var(--muted))]">
        <ShieldCheck className="size-3.5" />
        Aucun identifiant de paiement ne vous est demandé.
      </p>
    </form>
  );
}
