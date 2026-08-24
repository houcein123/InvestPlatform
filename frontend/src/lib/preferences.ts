/* ==========================================================================
   Préférences d'utilisation, propres à l'appareil.
   --------------------------------------------------------------------------
   Stockées en localStorage plutôt qu'en base : elles ne concernent que le
   confort d'usage sur ce navigateur, pas le compte lui-même. Se connecter
   depuis un autre poste ne doit pas les emporter.
   ========================================================================== */

const CLE = 'tunisia_invest_preferences';

export interface Preferences {
  /** Ouvre le PDF dans un nouvel onglet dès que la génération aboutit. */
  ouvrirPdfAutomatiquement: boolean;
  /** Affiche les estimations à côté des données observées dans les tableaux. */
  afficherProjections: boolean;
  /** Notifications visuelles en bas d'écran (paiement, génération, erreurs). */
  notificationsActives: boolean;
  /** Densité de l'affichage des tableaux et listes. */
  densite: 'confortable' | 'compacte';
  /** Format des montants : code ISO (49,99 TND) ou symbole court. */
  formatMontant: 'iso' | 'court';
}

export const PREFERENCES_DEFAUT: Preferences = {
  ouvrirPdfAutomatiquement: true,
  afficherProjections: true,
  notificationsActives: true,
  densite: 'confortable',
  formatMontant: 'iso',
};

export function lirePreferences(): Preferences {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return PREFERENCES_DEFAUT;
    // Fusion avec les valeurs par défaut : une préférence ajoutée dans une
    // version ultérieure ne doit pas revenir `undefined` chez les comptes
    // existants.
    return { ...PREFERENCES_DEFAUT, ...(JSON.parse(brut) as Partial<Preferences>) };
  } catch {
    // Une valeur corrompue ne doit pas casser la page : on repart du défaut.
    return PREFERENCES_DEFAUT;
  }
}

export function ecrirePreferences(preferences: Preferences) {
  localStorage.setItem(CLE, JSON.stringify(preferences));
}

export function reinitialiserPreferences() {
  localStorage.removeItem(CLE);
}
