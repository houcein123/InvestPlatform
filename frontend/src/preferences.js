// ============================================================================
// Préférences d'utilisation, propres à l'appareil.
// ----------------------------------------------------------------------------
// Stockées en localStorage plutôt qu'en base : elles ne concernent que le
// confort d'usage sur ce navigateur, pas le compte lui-même.
// ============================================================================

const CLE = "investplatform_preferences";

export const PREFERENCES_DEFAUT = {
    ouvrirPdfAutomatiquement: true,
};

export function lirePreferences() {
    try {
        return { ...PREFERENCES_DEFAUT, ...JSON.parse(localStorage.getItem(CLE) || "{}") };
    } catch {
        // Une valeur corrompue ne doit pas casser la page : on repart du défaut.
        return PREFERENCES_DEFAUT;
    }
}

export function ecrirePreferences(preferences) {
    localStorage.setItem(CLE, JSON.stringify(preferences));
}
