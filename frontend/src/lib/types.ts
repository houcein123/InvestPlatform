/* ==========================================================================
   Contrats de donnees echanges avec le backend.
   --------------------------------------------------------------------------
   Les noms de champs sont ceux des colonnes SQL (snake_case) : le backend les
   expose tels quels, et les renommer ici creerait deux vocabulaires pour la
   meme donnee. Le typage sert a detecter une rupture de contrat a la
   compilation, pas a redecorer l'API.
   ========================================================================== */

export type Role = 'client' | 'admin';

export interface Compte {
  id: number;
  email: string;
  nom: string | null;
  prenom: string | null;
  entreprise: string | null;
  pays: string | null;
  telephone: string | null;
  role: Role;
  est_actif: boolean;
  est_verifie: boolean;
  derniere_connexion: string | null;
  created_at: string | null;
}

export interface Secteur {
  id: number;
  slug: string;
  nom: string;
  description: string | null;
  /**
   * Libelles anglais (migration 009), nuls tant qu'un secteur n'est pas
   * traduit. Ne les lisez pas directement : `libelleSecteur` gere le repli.
   */
  nom_en?: string | null;
  description_en?: string | null;
  icone: string | null;
  prix_rapport: number;
  nombre_pages: number;
  date_maj: string | null;
  est_actif: boolean;
}

export interface ChiffresCles {
  contribution_pib_pct: number | null;
  croissance_annuelle_pct: number | null;
  nombre_emplois: number | null;
  exportations_mdt: number | null;
  nombre_entreprises: number | null;
  investissements_ide_mdt: number | null;
  part_marche_regional_pct: number | null;
}

/**
 * Serie temporelle. La distinction `valeur_*` / `projection_*` est structurante :
 * une valeur est OBSERVEE et publiee par une source officielle, une projection
 * est ESTIMEE. L'interface ne doit jamais les rendre de la meme facon.
 */
export interface SerieStatistique {
  id: number;
  indicateur: string;
  unite: string | null;
  valeur_2020: number | null;
  valeur_2021: number | null;
  valeur_2022: number | null;
  valeur_2023: number | null;
  valeur_2024: number | null;
  projection_2024: number | null;
  projection_2025: number | null;
  projection_2026: number | null;
  projection_2027: number | null;
  projection_2028: number | null;
  methode_projection: string | null;
  fiabilite_r2: number | null;
  source: string | null;
}

export type ModePaiement = 'simulation' | 'paypal';

export interface ConfigPaiement {
  mode: ModePaiement;
  configure: boolean;
  clientId?: string | null;
  environnement?: 'sandbox' | 'live';
  devisePaiement?: string;
  deviseAffichage: string;
  tauxConversion?: number;
  locale?: string;
  argentReel: boolean;
}

export interface CommandeCreee {
  success: boolean;
  mode: ModePaiement;
  achatId: number;
  secteur: string;
  /** Nom anglais du secteur (migration 009) ; null si non traduit. */
  secteur_en?: string | null;
  montantAffiche: number;
  deviseAffichage: string;
  orderId?: string;
  montantPaiement: number;
  devisePaiement: string;
  environnement?: string;
}

export interface PaiementConfirme {
  success: boolean;
  mode: ModePaiement;
  message: string;
  achatId: number;
  transactionId?: string;
  montant: number;
  devise: string;
}

export type StatutJob = 'en_cours' | 'termine' | 'erreur';

export interface JobGeneration {
  id: string;
  sectorId: number;
  statut: StatutJob;
  etape: string;
  progression: number;
  pdfUrl: string | null;
  filename: string | null;
  /** Pages du PDF produit, comptees a la generation. */
  nombrePages?: number | null;
  erreur: string | null;
  sectionsManquantes?: string[];
  /**
   * Relecture par le second modele : sections dont un chiffre n'a pas ete
   * retrouve dans les donnees. Absent si la relecture n'est pas configuree.
   */
  controleQualite?: {
    verifiees: number;
    suspectes: { section: string; chiffres: string[]; remarque: string }[];
    echecs: number;
    modele: string;
  } | null;
}

export interface AchatClient {
  achat_id: number;
  montant: number;
  date_achat: string;
  mode_paiement: ModePaiement;
  secteur_id: number;
  secteur: string;
  /** Nom anglais du secteur (migration 009) ; null si non traduit. */
  secteur_en?: string | null;
  rapport_id: number | null;
  chemin_fichier: string | null;
  date_generation: string | null;
  /** Pages du document livre, comptees a la generation (null si non produit). */
  nombre_pages: number | null;
}

export interface StatSecteur {
  id: number;
  nom: string;
  slug: string;
  prix_rapport: number;
  nb_ventes: number;
  revenu: number;
  nb_ventes_simulees: number;
  revenu_simule: number;
  nb_rapports_generes: number;
}
