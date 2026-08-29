import {
  BarChart3, BookOpen, Building2, FileText, Globe2, LayoutGrid,
  Settings, User, Users, type LucideIcon,
} from 'lucide-react';

import type { Dictionnaire } from '@/i18n/fr';

export interface Lien {
  to: string;
  libelle: string;
  Icone: LucideIcon;
  exact?: boolean;
  /** Ligne d'explication affichée dans les menus déroulants. */
  detail?: string;
}

export interface Groupe {
  cle: string;
  libelle: string;
  Icone: LucideIcon;
  liens: Lien[];
  /** Restriction d'accès : le groupe n'apparaît que si elle est satisfaite. */
  acces: 'public' | 'connecte' | 'admin';
}

/**
 * Table de navigation, source unique.
 *
 * La barre horizontale et le tiroir mobile la lisent tous les deux : deux
 * listes séparées finiraient par diverger, et un lien n'existerait plus que
 * sur l'un des deux affichages.
 *
 * C'est une FONCTION du dictionnaire, plus une constante : les libellés
 * changent avec la langue. Figés au chargement du module, ils resteraient dans
 * la langue du premier rendu, et basculer en anglais laisserait un menu
 * français au-dessus d'une page traduite.
 */
export function construireNavigation(t: Dictionnaire): Groupe[] {
  return [
    {
      cle: 'catalogue',
      libelle: t.nav.catalogue,
      Icone: LayoutGrid,
      acces: 'public',
      liens: [
        { to: '/', libelle: t.nav.catalogue, Icone: LayoutGrid, exact: true,
          detail: t.nav.catalogueDetail },
      ],
    },
    {
      cle: 'client',
      libelle: t.nav.mesRapports,
      Icone: FileText,
      acces: 'connecte',
      liens: [
        { to: '/mes-rapports', libelle: t.nav.mesRapports, Icone: FileText,
          detail: t.nav.mesRapportsDetail },
      ],
    },
    {
      cle: 'analyse',
      libelle: t.nav.analyse,
      Icone: BarChart3,
      // Reserve aux comptes : sur l'ecran de connexion et pour un visiteur non
      // identifie, la seule action attendue est de se connecter ou de creer un
      // compte. Le comparateur et le glossaire n'ont d'interet qu'une fois dans
      // l'espace, et les proposer avant detourne d'un formulaire commence.
      acces: 'connecte',
      liens: [
        { to: '/analyse/secteurs', libelle: t.nav.comparateur, Icone: LayoutGrid,
          detail: t.nav.comparateurDetail },
        { to: '/analyse/regional', libelle: t.nav.regional, Icone: Globe2,
          detail: t.nav.regionalDetail },
        { to: '/ressources/glossaire', libelle: t.nav.glossaire, Icone: BookOpen,
          detail: t.nav.glossaireDetail },
      ],
    },
    {
      cle: 'admin',
      libelle: t.nav.administration,
      Icone: BarChart3,
      acces: 'admin',
      liens: [
        { to: '/admin', libelle: t.nav.pilotage, Icone: BarChart3, exact: true,
          detail: t.nav.pilotageDetail },
        { to: '/admin/secteurs', libelle: t.nav.secteurs, Icone: Building2,
          detail: t.nav.secteursDetail },
        { to: '/admin/rapports', libelle: t.nav.rapports, Icone: FileText,
          detail: t.nav.rapportsDetail },
        { to: '/admin/comptes', libelle: t.nav.comptes, Icone: Users,
          detail: t.nav.comptesDetail },
      ],
    },
    {
      cle: 'compte',
      libelle: t.nav.compte,
      Icone: User,
      acces: 'connecte',
      liens: [
        { to: '/profil', libelle: t.nav.profil, Icone: User,
          detail: t.nav.profilDetail },
        { to: '/parametres', libelle: t.nav.parametres, Icone: Settings,
          detail: t.nav.parametresDetail },
      ],
    },
  ];
}

/** Groupes visibles pour l'état de session courant. */
export function groupesVisibles(t: Dictionnaire, estConnecte: boolean, estAdmin: boolean): Groupe[] {
  return construireNavigation(t).filter((groupe) => {
    if (groupe.acces === 'public') return true;
    if (groupe.acces === 'admin') return estAdmin;
    return estConnecte;
  });
}
