/* ==========================================================================
   Identité de l'éditeur du service.
   --------------------------------------------------------------------------
   SOURCE UNIQUE des coordonnées, mentions légales et informations de contact
   affichées dans le pied de page, la page « À propos » et la page « Contact ».

   ⚠️  LES VALEURS MARQUÉES `A_COMPLETER` SONT DES EMPLACEMENTS, PAS DES DONNÉES.
   Elles ne sont volontairement pas pré-remplies : un numéro d'immatriculation
   ou une adresse inventés seraient indiscernables de vrais renseignements aux
   yeux d'un investisseur, et engageraient la responsabilité de l'éditeur.
   Renseignez-les avant toute mise en ligne — les écrans qui les consomment
   affichent un avertissement visible tant qu'elles sont vides.
   ========================================================================== */

/** Marqueur d'une information non encore renseignée. */
export const A_COMPLETER = '';

export const ENTREPRISE = {
  nom: 'Tunisia Invest',
  baseline: 'Rapports sectoriels pour investisseurs étrangers',

  /** Raison sociale complète de l'entité éditrice. */
  raisonSociale: A_COMPLETER,
  /** Forme juridique (SARL, SA, SUARL…). */
  formeJuridique: A_COMPLETER,
  /** Identifiant unique / registre national des entreprises. */
  immatriculation: A_COMPLETER,
  /** Capital social, avec sa devise. */
  capitalSocial: A_COMPLETER,

  adresse: {
    voie: A_COMPLETER,
    codePostal: A_COMPLETER,
    ville: A_COMPLETER,
    pays: 'Tunisie',
  },

  contact: {
    emailGeneral: A_COMPLETER,
    emailSupport: A_COMPLETER,
    emailCommercial: A_COMPLETER,
    telephone: A_COMPLETER,
    /** Plage horaire d'ouverture du support, fuseau inclus. */
    horaires: 'Du lundi au vendredi, 9 h – 17 h (UTC+1)',
  },

  /** Directeur de la publication, exigé par les mentions légales. */
  directeurPublication: A_COMPLETER,

  /** Hébergeur du service, à mentionner obligatoirement. */
  hebergeur: {
    nom: A_COMPLETER,
    adresse: A_COMPLETER,
  },
} as const;

/** Une information est-elle renseignée ? */
export function estRenseigne(valeur: string): boolean {
  return valeur.trim().length > 0;
}

/** Adresse postale sur une ligne, ou null si incomplète. */
export function adressePostale(): string | null {
  const { voie, codePostal, ville, pays } = ENTREPRISE.adresse;
  if (!estRenseigne(voie) || !estRenseigne(ville)) return null;
  return [voie, [codePostal, ville].filter(estRenseigne).join(' '), pays]
    .filter(Boolean)
    .join(', ');
}

/**
 * Sources officielles citées dans les rapports.
 * Ce sont des organismes publics réels, vérifiables : ils fondent la
 * crédibilité du service et doivent être nommés, pas suggérés.
 */
export const SOURCES_OFFICIELLES = [
  {
    sigle: 'INS',
    nom: 'Institut National de la Statistique',
    role: 'Séries statistiques sectorielles et démographiques',
    site: 'https://www.ins.tn',
  },
  {
    sigle: 'FIPA',
    nom: "Agence de Promotion de l'Investissement Extérieur",
    role: "Cadre d'accueil et incitations à l'investissement étranger",
    site: 'https://www.investintunisia.tn',
  },
  {
    sigle: 'APII',
    nom: "Agence de Promotion de l'Industrie et de l'Innovation",
    role: 'Régimes industriels, zones et statuts export',
    site: 'https://www.tunisieindustrie.nat.tn',
  },
  {
    sigle: 'BCT',
    nom: 'Banque Centrale de Tunisie',
    role: 'Change, balance des paiements, réglementation financière',
    site: 'https://www.bct.gov.tn',
  },
] as const;
