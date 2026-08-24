import { Building2, Cookie, Database, Server, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

/** Affiche une valeur, ou signale qu'elle reste à renseigner. */
function Champ({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[hsl(var(--border))] py-2.5 last:border-0">
      <dt className="text-sm text-[hsl(var(--muted))]">{libelle}</dt>
      <dd className={estRenseigne(valeur) ? 'text-sm font-medium' : 'text-sm italic text-[hsl(var(--warning))]'}>
        {estRenseigne(valeur) ? valeur : 'à renseigner'}
      </dd>
    </div>
  );
}

export default function MentionsLegales() {
  const adresse = adressePostale();

  const manquants = [
    ENTREPRISE.raisonSociale, ENTREPRISE.immatriculation,
    ENTREPRISE.directeurPublication, ENTREPRISE.hebergeur.nom,
  ].filter((v) => !estRenseigne(v)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold leading-tight">Mentions légales</h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          Informations relatives à l&apos;éditeur du service, à son hébergement et au
          traitement des données.
        </p>
      </header>

      {manquants > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">{manquants} information(s) légale(s) manquante(s)</p>
            <p className="mt-1 text-[hsl(var(--muted))]">
              Ces champs sont vides dans{' '}
              <code className="rounded bg-[hsl(var(--surface-muted))] px-1.5 py-0.5 text-xs">
                src/lib/entreprise.ts
              </code>
              . Ils n&apos;ont pas été pré-remplis : une raison sociale ou un numéro
              d&apos;immatriculation inventés seraient indiscernables de vrais
              renseignements et engageraient votre responsabilité. À compléter avant
              toute mise en ligne publique.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-[hsl(var(--primary))]" /> Éditeur du service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-[hsl(var(--border))]">
            <Champ libelle="Nom commercial" valeur={ENTREPRISE.nom} />
            <Champ libelle="Raison sociale" valeur={ENTREPRISE.raisonSociale} />
            <Champ libelle="Forme juridique" valeur={ENTREPRISE.formeJuridique} />
            <Champ libelle="Immatriculation" valeur={ENTREPRISE.immatriculation} />
            <Champ libelle="Capital social" valeur={ENTREPRISE.capitalSocial} />
            <Champ libelle="Siège social" valeur={adresse ?? ''} />
            <Champ libelle="Directeur de la publication" valeur={ENTREPRISE.directeurPublication} />
            <Champ libelle="Contact" valeur={ENTREPRISE.contact.emailGeneral} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4 text-[hsl(var(--primary))]" /> Hébergement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-[hsl(var(--border))]">
            <Champ libelle="Hébergeur" valeur={ENTREPRISE.hebergeur.nom} />
            <Champ libelle="Adresse" valeur={ENTREPRISE.hebergeur.adresse} />
          </dl>
        </CardContent>
      </Card>

      <Card id="donnees" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-[hsl(var(--primary))]" /> Données personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          <p>
            <strong className="text-[hsl(var(--foreground))]">Données collectées.</strong>{' '}
            À la création d&apos;un compte : adresse email, nom, prénom, et facultativement
            entreprise, pays et téléphone. À chaque commande : le secteur acheté, le montant,
            la date, ainsi que l&apos;adresse du compte payeur et la référence de transaction
            transmises par le prestataire de paiement.
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">Ce qui n&apos;est jamais
            collecté.</strong> Aucun numéro de carte, aucun identifiant bancaire, aucun mot
            de passe de service tiers. Le règlement s&apos;effectue intégralement sur le
            domaine du prestataire de paiement, qui ne nous communique jamais les
            identifiants de ses clients.
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">Finalité.</strong> Ces données
            servent exclusivement à exécuter la commande, à donner accès aux rapports achetés
            et à tenir la comptabilité du service. Elles ne sont ni revendues, ni cédées à
            des fins publicitaires.
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">Vos droits.</strong> Vous
            pouvez consulter et modifier vos informations depuis la page « Profil ». Pour
            toute demande d&apos;accès, de rectification ou de suppression, écrivez à
            l&apos;adresse de contact indiquée ci-dessus.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cookie className="size-4 text-[hsl(var(--primary))]" /> Stockage local
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          <p>
            Le service n&apos;utilise aucun cookie publicitaire ni traceur tiers. Trois
            informations seulement sont conservées dans le navigateur :
          </p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>le jeton de session, qui vous maintient connecté ;</li>
            <li>le thème choisi, clair ou sombre ;</li>
            <li>vos préférences d&apos;affichage, réglables depuis « Paramètres ».</li>
          </ul>
          <p>
            Ces éléments restent sur votre appareil et ne sont pas transmis à des tiers.
            Se déconnecter efface le jeton de session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
