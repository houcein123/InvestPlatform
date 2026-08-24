import { motion } from 'framer-motion';
import {
  Building2, Clock, HeadsetIcon, Mail, MapPin, MessageSquare, Phone, ShieldAlert,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

const CANAUX = [
  {
    Icone: HeadsetIcon,
    titre: 'Support client',
    texte: "Commande, téléchargement d'un rapport, question sur votre compte.",
    email: ENTREPRISE.contact.emailSupport,
    delai: 'Réponse sous 1 jour ouvré',
  },
  {
    Icone: Building2,
    titre: 'Demandes commerciales',
    texte: 'Rapports sur mesure, accès multi-utilisateurs, partenariats.',
    email: ENTREPRISE.contact.emailCommercial,
    delai: 'Réponse sous 2 jours ouvrés',
  },
  {
    Icone: MessageSquare,
    titre: 'Question générale',
    texte: "Méthode, sources, couverture sectorielle, presse.",
    email: ENTREPRISE.contact.emailGeneral,
    delai: 'Réponse sous 3 jours ouvrés',
  },
];

/**
 * Page de contact.
 *
 * Aucun formulaire n'est proposé : le backend n'expose aucune route de prise
 * de contact, et un formulaire qui n'envoie rien est pire que son absence — il
 * fait croire à l'utilisateur que son message est parti. Les canaux affichés
 * sont des liens `mailto:` qui ouvrent réellement sa messagerie.
 */
export default function Contact() {
  const adresse = adressePostale();
  const { contact } = ENTREPRISE;
  const aucunCanal = CANAUX.every((canal) => !estRenseigne(canal.email));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold leading-tight">Nous contacter</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted))]">
          Choisissez le canal correspondant à votre demande : elle sera traitée par
          l&apos;interlocuteur compétent, sans transfert intermédiaire.
        </p>
      </motion.header>

      {aucunCanal && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Coordonnées non renseignées</p>
            <p className="mt-1 text-[hsl(var(--muted))]">
              Les adresses de contact sont vides dans{' '}
              <code className="rounded bg-[hsl(var(--surface-muted))] px-1.5 py-0.5 text-xs">
                src/lib/entreprise.ts
              </code>
              . Elles n&apos;ont volontairement pas été inventées : une adresse fictive
              renverrait les demandes dans le vide. Renseignez-les avant la mise en ligne.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {CANAUX.map(({ Icone, titre, texte, email, delai }, index) => (
          <motion.article
            key={titre}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="surface-card flex flex-col p-6"
          >
            <span className="mb-3 grid size-10 w-fit place-items-center rounded-xl bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]">
              <Icone className="size-5" />
            </span>
            <h2 className="font-display text-base font-semibold">{titre}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-[hsl(var(--muted))]">{texte}</p>

            {estRenseigne(email) ? (
              <a
                href={`mailto:${email}`}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-[hsl(var(--primary))] hover:underline"
              >
                <Mail className="size-4" /> {email}
              </a>
            ) : (
              <p className="mt-4 text-sm text-[hsl(var(--muted))]">— à renseigner —</p>
            )}

            <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
              <Clock className="size-3" /> {delai}
            </p>
          </motion.article>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordonnées</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[hsl(var(--muted))]" />
              <span>{adresse ?? <span className="text-[hsl(var(--muted))]">Adresse à renseigner</span>}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-[hsl(var(--muted))]" />
              {estRenseigne(contact.telephone) ? (
                <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="hover:underline">
                  {contact.telephone}
                </a>
              ) : (
                <span className="text-[hsl(var(--muted))]">Téléphone à renseigner</span>
              )}
            </p>
            <p className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-[hsl(var(--muted))]" />
              <span>{contact.horaires}</span>
            </p>
          </div>

          <div className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm font-semibold">Avant d&apos;écrire</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[hsl(var(--muted))]">
              <li>
                Un rapport payé mais non livré se relance seul depuis
                « Mes rapports », sans nouveau paiement.
              </li>
              <li>
                Les deux premières pages de chaque rapport sont consultables
                gratuitement depuis le catalogue.
              </li>
              <li>
                Pour une question sur une commande, indiquez la référence de
                transaction : elle figure sur l&apos;écran de confirmation.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
