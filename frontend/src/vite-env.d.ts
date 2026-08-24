/// <reference types="vite/client" />

/**
 * Variables d'environnement exposees au navigateur.
 * Seules celles prefixees par VITE_ sont injectees par Vite : tout ce qui est
 * secret doit rester cote serveur.
 */
interface ImportMetaEnv {
  /** URL absolue du backend. Vide en developpement : le proxy Vite prend le relais. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
