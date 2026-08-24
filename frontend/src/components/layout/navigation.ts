import {
  BarChart3, BookOpen, Building2, FileText, Globe2, LayoutGrid,
  Settings, User, Users, type LucideIcon,
} from 'lucide-react';

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
 */
export const NAVIGATION: Groupe[] = [
  {
    cle: 'catalogue',
    libelle: 'Catalogue',
    Icone: LayoutGrid,
    acces: 'public',
    liens: [
      { to: '/', libelle: 'Catalogue', Icone: LayoutGrid, exact: true,
        detail: 'Les six secteurs et leurs rapports' },
    ],
  },
  {
    cle: 'client',
    libelle: 'Mes rapports',
    Icone: FileText,
    acces: 'connecte',
    liens: [
      { to: '/mes-rapports', libelle: 'Mes rapports', Icone: FileText,
        detail: 'Commandes réglées et documents livrés' },
    ],
  },
  {
    cle: 'analyse',
    libelle: 'Analyse',
    Icone: BarChart3,
    // Reserve aux comptes : sur l'ecran de connexion et pour un visiteur non
    // identifie, la seule action attendue est de se connecter ou de creer un
    // compte. Le comparateur et le glossaire n'ont d'interet qu'une fois dans
    // l'espace, et les proposer avant detourne d'un formulaire commence.
    acces: 'connecte',
    liens: [
      { to: '/analyse/secteurs', libelle: 'Comparateur de secteurs', Icone: LayoutGrid,
        detail: 'Les six secteurs face à face, sur sept indicateurs' },
      { to: '/analyse/regional', libelle: 'Comparatif régional', Icone: Globe2,
        detail: 'Tunisie, Maroc et Égypte sur données officielles' },
      { to: '/ressources/glossaire', libelle: 'Glossaire', Icone: BookOpen,
        detail: "Termes de l'investissement en Tunisie" },
    ],
  },
  {
    cle: 'admin',
    libelle: 'Administration',
    Icone: BarChart3,
    acces: 'admin',
    liens: [
      { to: '/admin', libelle: 'Pilotage', Icone: BarChart3, exact: true,
        detail: 'Ventes, revenus et rapports produits' },
      { to: '/admin/secteurs', libelle: 'Secteurs', Icone: Building2,
        detail: 'Tarifs, visibilité et données sectorielles' },
      { to: '/admin/rapports', libelle: 'Rapports', Icone: FileText,
        detail: 'Documents générés et corrections' },
      { to: '/admin/comptes', libelle: 'Comptes', Icone: Users,
        detail: 'Rôles et accès des utilisateurs' },
    ],
  },
  {
    cle: 'compte',
    libelle: 'Compte',
    Icone: User,
    acces: 'connecte',
    liens: [
      { to: '/profil', libelle: 'Profil', Icone: User,
        detail: 'Informations personnelles et mot de passe' },
      { to: '/parametres', libelle: 'Paramètres', Icone: Settings,
        detail: "Thème, préférences et état des services" },
    ],
  },
];

/** Groupes visibles pour l'état de session courant. */
export function groupesVisibles(estConnecte: boolean, estAdmin: boolean): Groupe[] {
  return NAVIGATION.filter((groupe) => {
    if (groupe.acces === 'public') return true;
    if (groupe.acces === 'admin') return estAdmin;
    return estConnecte;
  });
}
