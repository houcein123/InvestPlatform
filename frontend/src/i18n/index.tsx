import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';

import { definirLocaleFormatage } from '@/lib/utils';

import { fr, type Dictionnaire } from './fr';
import { en } from './en';

/* ==========================================================================
   Langue de l'interface.
   --------------------------------------------------------------------------
   Même modèle que le thème : préférence d'appareil, en localStorage. Elle ne
   suit pas le compte — un investisseur qui consulte depuis le poste d'un
   collègue ne doit pas lui changer sa langue, et l'inverse non plus.

   Le dictionnaire est exposé en OBJET, pas via une fonction `t('cle.chemin')`.
   La différence n'est pas cosmétique : `t.catalogue.titre` est vérifié par
   TypeScript, renommer une clé signale tous ses usages, et une clé inexistante
   ne compile pas. Une chaîne magique n'offre aucune de ces garanties et se
   découvre en production, sous la forme d'un libellé brut affiché à l'écran.
   ========================================================================== */

export type Langue = 'fr' | 'en';

const CLE = 'tunisia_invest_langue';

const DICTIONNAIRES: Record<Langue, Dictionnaire> = { fr, en };

/** Langues proposées dans le sélecteur, dans l'ordre d'affichage. */
export const LANGUES: Langue[] = ['fr', 'en'];

interface ValeurContexte {
  langue: Langue;
  /** Dictionnaire de la langue active. */
  t: Dictionnaire;
  definirLangue: (langue: Langue) => void;
}

const Contexte = createContext<ValeurContexte>({
  langue: 'fr',
  t: fr,
  definirLangue: () => {},
});

/**
 * Langue retenue au premier rendu.
 *
 * Ordre : choix explicite déjà enregistré, puis langue du navigateur, puis
 * français. Le français reste le défaut parce que l'éditeur est tunisien et
 * que la totalité des sources citées est francophone — un visiteur dont la
 * langue n'est ni le français ni l'anglais tombe sur la version d'origine,
 * celle qui fait foi en cas d'écart de traduction.
 */
function langueInitiale(): Langue {
  const enregistree = localStorage.getItem(CLE);
  if (enregistree === 'fr' || enregistree === 'en') return enregistree;

  // `languages` couvre le cas d'un navigateur réglé sur plusieurs langues :
  // on retient la première que l'on sait afficher, pas seulement la première.
  const preferees = navigator.languages ?? [navigator.language];
  for (const etiquette of preferees) {
    const base = etiquette.slice(0, 2).toLowerCase();
    if (base === 'en') return 'en';
    if (base === 'fr') return 'fr';
  }
  return 'fr';
}

/** Locale Intl associée à chaque langue. */
const LOCALES: Record<Langue, string> = { fr: 'fr-FR', en: 'en-GB' };

export function LangueProvider({ children }: { children: ReactNode }) {
  const [langue, setLangue] = useState<Langue>(langueInitiale);

  // Posee PENDANT le rendu, pas dans un effet : les enfants formatent des
  // montants des leur premier rendu, qui precede l'execution des effets. Dans
  // un useEffect, la toute premiere page anglaise afficherait ses montants a
  // la francaise avant de se corriger — un clignotement visible.
  definirLocaleFormatage(LOCALES[langue]);

  useEffect(() => {
    localStorage.setItem(CLE, langue);
    // L'attribut `lang` de <html> n'est pas décoratif : il pilote la voix des
    // lecteurs d'écran, la coupure de mots du navigateur et l'indexation par
    // les moteurs de recherche. Le laisser figé à "fr" sur une page anglaise
    // les induit tous les trois en erreur.
    const meta = DICTIONNAIRES[langue].metaLangue;
    document.documentElement.lang = meta.codeHtml;

    // Titre et description vivent dans index.html, donc figes en francais au
    // chargement. Un onglet et un resultat Google en francais devant une page
    // anglaise annulent une partie du benefice de la traduction : on les
    // realigne ici sur la langue reellement affichee.
    document.title = meta.titrePage;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', meta.descriptionPage);
  }, [langue]);

  const definirLangue = useCallback((choisie: Langue) => setLangue(choisie), []);

  const valeur = useMemo<ValeurContexte>(
    () => ({ langue, t: DICTIONNAIRES[langue], definirLangue }),
    [langue, definirLangue],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

/** Dictionnaire et langue courants. */
export const useTraduction = () => useContext(Contexte);

/**
 * Formateur de nombres accordé à la langue active.
 *
 * Un investisseur anglophone lit `1,250.50`, un francophone `1 250,50`. Servir
 * le même séparateur aux deux fait douter du montant, ce qui est le dernier
 * effet recherché sur une page de paiement.
 */
export function useFormatNombre() {
  const { langue } = useTraduction();
  return useMemo(() => {
    const locale = langue === 'en' ? 'en-GB' : 'fr-FR';
    return {
      nombre: (valeur: number, decimales = 2) =>
        new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimales,
          maximumFractionDigits: decimales,
        }).format(valeur),
      date: (valeur: string | Date) => {
        const date = typeof valeur === 'string' ? new Date(valeur) : valeur;
        if (Number.isNaN(date.getTime())) return '—';
        return new Intl.DateTimeFormat(locale, {
          day: 'numeric', month: 'long', year: 'numeric',
        }).format(date);
      },
    };
  }, [langue]);
}
