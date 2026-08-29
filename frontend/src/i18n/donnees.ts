import { useTraduction, type Langue } from './index';

/* ==========================================================================
   Libellés venant de la BASE, pas du dictionnaire.
   --------------------------------------------------------------------------
   Un nom de secteur est une DONNÉE : il est saisi en base, modifiable depuis
   l'écran d'administration, et un septième secteur peut apparaître sans que
   le code change. Le mettre dans `fr.ts` / `en.ts` reviendrait à figer dans
   le frontend une information qui ne lui appartient pas — et le secteur
   ajouté demain n'y serait pas.

   D'où ce module séparé : il ne traduit rien, il CHOISIT entre deux valeurs
   déjà traduites que le serveur a envoyées.
   ========================================================================== */

/**
 * Ligne portant des colonnes jumelles `champ` / `champ_en` (migrations 009 et
 * 011). Le type reste ouvert : les tables concernées n'exposent pas les mêmes
 * champs, et les énumérer une à une figerait ce module à chaque migration.
 */
type Traduisible = object;

/**
 * Valeur à afficher pour la langue active, avec repli sur le français.
 *
 * Le repli n'est pas une commodité, c'est la règle : une traduction absente
 * doit laisser voir le libellé d'origine, jamais une case vide. Un secteur
 * dont personne n'a saisi le nom anglais reste vendable.
 */
function choisir(
  langue: Langue,
  valeurFr: string | null | undefined,
  valeurEn: string | null | undefined,
): string {
  if (langue === 'en') return valeurEn?.trim() || valeurFr?.trim() || '';
  return valeurFr?.trim() || '';
}

/**
 * Sélecteur de champ traduit.
 *
 *   const champ = useChampTraduit();
 *   champ(secteur, 'nom')          // « Tourism » ou « Tourisme »
 *   champ(serie, 'indicateur')     // intitulé traduit, ou l'original
 */
export function useChampTraduit() {
  const { langue } = useTraduction();
  return (ligne: Traduisible | null | undefined, nom: string) => {
    // Cast local plutot qu'index signature sur le type public : `Secteur` et
    // les autres interfaces du domaine n'en ont pas, et leur en imposer une
    // ouvrirait l'acces a n'importe quelle cle sur tout le code appelant.
    const source = ligne as Record<string, unknown> | null | undefined;
    return choisir(
      langue,
      source?.[nom] as string | null | undefined,
      source?.[`${nom}_en`] as string | null | undefined,
    );
  };
}

/** Nom et description d'un secteur dans la langue active. */
export function useLibelleSecteur() {
  const champ = useChampTraduit();
  return {
    nom: (secteur: Traduisible) => champ(secteur, 'nom'),
    description: (secteur: Traduisible) => champ(secteur, 'description'),
  };
}

/**
 * Titre d'un rapport, recompose dans la langue active.
 *
 * `rapports.titre` est fige en base a la generation (« Rapport Sectoriel —
 * Agriculture ») : il reste donc francais dans une interface anglaise. Le
 * reecrire en base falsifierait la trace de ce qui a ete produit et livre ;
 * on recompose donc a l'affichage, a partir du secteur que le serveur joint
 * desormais a chaque rapport.
 *
 * Repli sur le titre stocke quand le secteur n'est pas resolvable : un rapport
 * dont le secteur a ete supprime garde un intitule lisible.
 */
export function useTitreRapport() {
  const { t } = useTraduction();
  const champ = useChampTraduit();

  return (rapport: Traduisible & { titre?: string | null }) => {
    const secteur = champ(rapport, 'secteur');
    return secteur ? t.admin.titreRapport(secteur) : (rapport?.titre || '');
  };
}
