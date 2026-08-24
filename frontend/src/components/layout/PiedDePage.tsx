import { Link } from 'react-router-dom';
import { AlertTriangle, Mail, MapPin, Phone, TrendingUp } from 'lucide-react';

import { useAuth } from '@/auth/AuthContext';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

/**
 * `connecte` marque les entrees reservees aux comptes.
 *
 * Elles suivent la barre de navigation : masquer l'analyse dans le menu et la
 * laisser dans le pied de page reviendrait a ne rien masquer du tout, les deux
 * etant visibles sur le meme ecran.
 */
const COLONNES = [
  {
    titre: 'Plateforme',
    liens: [
      { to: '/', libelle: 'Catalogue sectoriel' },
      { to: '/mes-rapports', libelle: 'Mes rapports', connecte: true },
      { to: '/analyse/secteurs', libelle: 'Comparateur de secteurs', connecte: true },
      { to: '/analyse/regional', libelle: 'Comparatif régional', connecte: true },
      { to: '/ressources/glossaire', libelle: 'Glossaire', connecte: true },
    ],
  },
  {
    titre: 'À propos',
    liens: [
      { to: '/a-propos', libelle: "Qui sommes-nous" },
      { to: '/a-propos#methode', libelle: 'Notre méthode' },
      { to: '/a-propos#sources', libelle: 'Sources de données' },
    ],
  },
  {
    titre: 'Informations légales',
    liens: [
      { to: '/mentions-legales', libelle: 'Mentions légales' },
      { to: '/avertissement-risques', libelle: 'Avertissement sur les risques' },
      { to: '/mentions-legales#donnees', libelle: 'Données personnelles' },
    ],
  },
];

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
              Rapports sectoriels sur l&apos;économie tunisienne, construits à partir des
              données publiées par les organismes officiels et enrichis d&apos;analyses
              rédigées à partir de ces mêmes chiffres.
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
                  Nous contacter
                </Link>
              </li>
            </ul>
          </div>

          {COLONNES.map((colonne) => (
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
            <strong className="text-[hsl(var(--foreground))]">Avertissement.</strong>{' '}
            Les rapports proposés sur cette plateforme sont des documents d&apos;information
            économique. Ils ne constituent ni un conseil en investissement, ni une
            recommandation d&apos;achat ou de vente, ni une garantie de résultat. Les
            projections qu&apos;ils contiennent sont des estimations calculées, signalées
            comme telles, et ne préjugent pas de l&apos;évolution réelle des marchés.
            Tout investissement comporte un risque de perte en capital.{' '}
            <Link to="/avertissement-risques" className="font-medium text-[hsl(var(--primary))] hover:underline">
              Lire l&apos;avertissement complet
            </Link>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--border))] pt-6 text-xs text-[hsl(var(--muted))]">
          <p>© {new Date().getFullYear()} {ENTREPRISE.nom}. Tous droits réservés.</p>
          <p>{ENTREPRISE.baseline}</p>
        </div>
      </div>
    </footer>
  );
}
