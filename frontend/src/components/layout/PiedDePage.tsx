import { Link } from 'react-router-dom';
import { AlertTriangle, Mail, MapPin, Phone, TrendingUp } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

/**
 * `connecte` marque les entrees reservees aux comptes.
 *
 * Elles suivent la barre de navigation : masquer l'analyse dans le menu et la
 * laisser dans le pied de page reviendrait a ne rien masquer du tout, les deux
 * etant visibles sur le meme ecran.
 */
function colonnes(t: Dictionnaire) {
  return [
    {
      titre: t.pied.colonnePlateforme,
      liens: [
        { to: '/', libelle: t.nav.catalogue },
        { to: '/mes-rapports', libelle: t.nav.mesRapports, connecte: true },
        { to: '/analyse/secteurs', libelle: t.nav.comparateur, connecte: true },
        { to: '/analyse/regional', libelle: t.nav.regional, connecte: true },
        { to: '/ressources/glossaire', libelle: t.nav.glossaire, connecte: true },
      ],
    },
    {
      titre: t.pied.colonneAPropos,
      liens: [
        { to: '/a-propos', libelle: t.pied.quiSommesNous },
        { to: '/a-propos#methode', libelle: t.pied.notreMethode },
        { to: '/a-propos#sources', libelle: t.pied.sourcesDonnees },
      ],
    },
    {
      titre: t.pied.colonneLegal,
      liens: [
        { to: '/mentions-legales', libelle: t.pied.mentionsLegales },
        { to: '/avertissement-risques', libelle: t.pied.avertissementRisques },
        { to: '/mentions-legales#donnees', libelle: t.pied.donneesPersonnelles },
      ],
    },
  ];
}

/**
 * Pied de page du portail.
 *
 * Porte l'AVERTISSEMENT SUR LES RISQUES en clair, sur toutes les pages. Un
 * service qui vend de l'analyse d'investissement doit dire, là où on ne peut
 * pas le manquer, que ses rapports informent sans conseiller : le reléguer
 * derrière un lien reviendrait à le cacher.
 */
export function PiedDePage() {
  const adresse = adressePostale();
  const { contact } = ENTREPRISE;
  const { estConnecte } = useAuth();
  const { t } = useTraduction();

  return (
    <footer className="mt-16 border-t border-[hsl(var(--border))] bg-[hsl(var(--surface)/0.5)]">
      <div className="mx-auto max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex w-fit items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-[hsl(var(--primary-foreground))]">
                <TrendingUp className="size-5" />
              </span>
              <span className="font-display text-base font-bold">{ENTREPRISE.nom}</span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[hsl(var(--muted))]">
              {t.pied.presentation}
            </p>

            <ul className="mt-5 space-y-2 text-sm text-[hsl(var(--muted))]">
              {adresse && (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span>{adresse}</span>
                </li>
              )}
              {estRenseigne(contact.emailGeneral) && (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 shrink-0" />
                  <a href={`mailto:${contact.emailGeneral}`} className="hover:text-[hsl(var(--foreground))]">
                    {contact.emailGeneral}
                  </a>
                </li>
              )}
              {estRenseigne(contact.telephone) && (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 shrink-0" />
                  <a href={`tel:${contact.telephone.replace(/\s/g, '')}`} className="hover:text-[hsl(var(--foreground))]">
                    {contact.telephone}
                  </a>
                </li>
              )}
              <li>
                <Link to="/contact" className="font-medium text-[hsl(var(--primary))] hover:underline">
                  {t.pied.nousContacter}
                </Link>
              </li>
            </ul>
          </div>

          {colonnes(t).map((colonne) => (
            <nav key={colonne.titre} aria-label={colonne.titre}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--foreground))]">
                {colonne.titre}
              </p>
              <ul className="mt-4 space-y-2.5">
                {colonne.liens
                  .filter((lien) => estConnecte || !('connecte' in lien && lien.connecte))
                  .map((lien) => (
                    <li key={lien.to + lien.libelle}>
                      <Link
                        to={lien.to}
                        className="text-sm text-[hsl(var(--muted))] transition-colors hover:text-[hsl(var(--foreground))]"
                      >
                        {lien.libelle}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.08)] p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[hsl(var(--warning))]" />
          <p className="text-xs leading-relaxed text-[hsl(var(--muted))]">
            <strong className="text-[hsl(var(--foreground))]">{t.pied.avertissementTitre}</strong>{' '}
            {t.pied.avertissementTexte}{' '}
            <Link to="/avertissement-risques" className="font-medium text-[hsl(var(--primary))] hover:underline">
              {t.pied.avertissementLien}
            </Link>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--muted))]">
          <p>{t.pied.copyright(new Date().getFullYear(), ENTREPRISE.nom)}</p>
          <p>{ENTREPRISE.baseline}</p>
        </div>
      </div>
    </footer>
  );
}
