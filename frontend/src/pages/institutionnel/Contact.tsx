import { motion } from 'framer-motion';
import {
  Building2, Clock, HeadsetIcon, Mail, MapPin, MessageSquare, Phone, ShieldAlert,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

/** Les trois canaux de contact, dans la langue active. */
function canaux(t: Dictionnaire) {
  return [
    {
      Icone: HeadsetIcon,
      titre: t.contact.supportTitre,
      texte: t.contact.supportTexte,
      email: ENTREPRISE.contact.emailSupport,
      delai: t.contact.supportDelai,
    },
    {
      Icone: Building2,
      titre: t.contact.commercialTitre,
      texte: t.contact.commercialTexte,
      email: ENTREPRISE.contact.emailCommercial,
      delai: t.contact.commercialDelai,
    },
    {
      Icone: MessageSquare,
      titre: t.contact.generalTitre,
      texte: t.contact.generalTexte,
      email: ENTREPRISE.contact.emailGeneral,
      delai: t.contact.generalDelai,
    },
  ];
}

/**
 * Page de contact.
 *
 * Aucun formulaire n'est proposé : le backend n'expose aucune route de prise
 * de contact, et un formulaire qui n'envoie rien est pire que son absence — il
 * fait croire à l'utilisateur que son message est parti. Les canaux affichés
 * sont des liens `mailto:` qui ouvrent réellement sa messagerie.
 */
export default function Contact() {
  const { t } = useTraduction();
  const adresse = adressePostale();
  const { contact } = ENTREPRISE;
  const listeCanaux = canaux(t);
  const aucunCanal = listeCanaux.every((canal) => !estRenseigne(canal.email));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-extrabold leading-tight">{t.contact.titre}</h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted))]">
          {t.contact.accroche}
        </p>
      </motion.header>

      {aucunCanal && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">{t.contact.aucunCanalTitre}</p>
            <p className="mt-1 text-[hsl(var(--muted))]">
              {t.contact.aucunCanalAvant}{' '}
              <code className="rounded bg-[hsl(var(--surface-muted))] px-1.5 py-0.5 text-xs">
                src/lib/entreprise.ts
              </code>
              {t.contact.aucunCanalApres}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {listeCanaux.map(({ Icone, titre, texte, email, delai }, index) => (
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
              <p className="mt-4 text-sm text-[hsl(var(--muted))]">{t.contact.aRenseigner}</p>
            )}

            <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
              <Clock className="size-3" /> {delai}
            </p>
          </motion.article>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.contact.coordonnees}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-3 text-sm">
            <p className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[hsl(var(--muted))]" />
              <span>{adresse ?? <span className="text-[hsl(var(--muted))]">{t.contact.adresseARenseigner}</span>}</span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-[hsl(var(--muted))]" />
              {estRenseigne(contact.telephone) ? (
                <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="hover:underline">
                  {contact.telephone}
                </a>
              ) : (
                <span className="text-[hsl(var(--muted))]">{t.contact.telephoneARenseigner}</span>
              )}
            </p>
            <p className="flex items-center gap-2.5">
              <Clock className="size-4 shrink-0 text-[hsl(var(--muted))]" />
              <span>{contact.horaires}</span>
            </p>
          </div>

          <div className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] bg-[hsl(var(--surface-muted))] p-4">
            <p className="text-sm font-semibold">{t.contact.avantEcrireTitre}</p>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[hsl(var(--muted))]">
              <li>{t.contact.avantEcrire1}</li>
              <li>{t.contact.avantEcrire2}</li>
              <li>{t.contact.avantEcrire3}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
