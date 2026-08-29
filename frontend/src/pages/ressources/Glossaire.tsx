import { useMemo, useState } from 'react';
import { BookOpen, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChampRecherche } from '@/components/ui/table';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { cn } from '@/lib/utils';

/**
 * Clé de catégorie, stable d'une langue à l'autre.
 *
 * Le filtre compare des CLÉS, jamais des libellés affichés : trier sur
 * « Fiscalité » cesserait de fonctionner dès la bascule en anglais, où la même
 * catégorie s'appelle « Taxation ». La clé reste, l'étiquette se traduit.
 */
type CategorieCle = 'fiscalite' | 'statistique' | 'logistique' | 'investissement' | 'energie';

interface Terme {
  terme: string;
  categorie: CategorieCle;
  definition: string;
  /** Précision utile quand le terme prête à confusion. */
  nuance?: string;
}

/** Libellé affiché de chaque catégorie, dans la langue active. */
function etiquetteCategorie(t: Dictionnaire): Record<CategorieCle, string> {
  return {
    fiscalite: t.glossaire.categorieFiscalite,
    statistique: t.glossaire.categorieStatistique,
    logistique: t.glossaire.categorieLogistique,
    investissement: t.glossaire.categorieInvestissement,
    energie: t.glossaire.categorieEnergie,
  };
}

/**
 * Termes rencontrés dans les rapports sectoriels.
 *
 * Chaque définition décrit un dispositif ou une notion RÉELS. Aucun chiffre
 * n'y figure : un taux ou un seuil change au fil des lois de finances, et une
 * valeur figée dans un glossaire devient fausse sans que personne ne s'en
 * aperçoive. Les valeurs à jour appartiennent aux rapports, qui portent leur
 * date et leur source.
 */
function termes(t: Dictionnaire): Terme[] {
  const g = t.glossaire;
  return [
    {
      terme: g.totalementExportatriceTerme,
      categorie: 'fiscalite',
      definition: g.totalementExportatriceDefinition,
      nuance: g.totalementExportatriceNuance,
    },
    { terme: g.zoneFrancheTerme, categorie: 'investissement', definition: g.zoneFrancheDefinition },
    { terme: g.ideTerme, categorie: 'investissement', definition: g.ideDefinition },
    {
      terme: g.valeurAjouteeTerme,
      categorie: 'statistique',
      definition: g.valeurAjouteeDefinition,
      nuance: g.valeurAjouteeNuance,
    },
    { terme: g.evpTerme, categorie: 'logistique', definition: g.evpDefinition },
    { terme: g.r2Terme, categorie: 'statistique', definition: g.r2Definition, nuance: g.r2Nuance },
    {
      terme: g.observeeEstimeeTerme,
      categorie: 'statistique',
      definition: g.observeeEstimeeDefinition,
      nuance: g.observeeEstimeeNuance,
    },
    { terme: g.balanceTerme, categorie: 'statistique', definition: g.balanceDefinition },
    {
      terme: g.capaciteTerme,
      categorie: 'energie',
      definition: g.capaciteDefinition,
      nuance: g.capaciteNuance,
    },
    { terme: g.facteurChargeTerme, categorie: 'energie', definition: g.facteurChargeDefinition },
    {
      terme: g.nonDoubleImpositionTerme,
      categorie: 'fiscalite',
      definition: g.nonDoubleImpositionDefinition,
    },
    {
      terme: g.dueDiligenceTerme,
      categorie: 'investissement',
      definition: g.dueDiligenceDefinition,
      nuance: g.dueDiligenceNuance,
    },
  ];
}

const CATEGORIES: (CategorieCle | 'toutes')[] = [
  'toutes', 'fiscalite', 'investissement', 'statistique', 'logistique', 'energie',
];

export default function Glossaire() {
  const { t, langue } = useTraduction();
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState<CategorieCle | 'toutes'>('toutes');

  const etiquettes = etiquetteCategorie(t);

  const resultats = useMemo(() => {
    const cherche = recherche.trim().toLowerCase();
    return termes(t)
      .filter((entree) => categorie === 'toutes' || entree.categorie === categorie)
      .filter((entree) => !cherche
        || entree.terme.toLowerCase().includes(cherche)
        || entree.definition.toLowerCase().includes(cherche))
      // Le tri suit la langue : l'ordre alphabetique n'est pas le meme partout,
      // et un glossaire anglais range selon les regles francaises paraitrait
      // desordonne a son lecteur.
      .sort((a, b) => a.terme.localeCompare(b.terme, langue));
  }, [recherche, categorie, t, langue]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          {t.glossaire.surtitre}
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">{t.glossaire.titre}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.glossaire.accroche}
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategorie(c)}
              aria-pressed={categorie === c}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                categorie === c
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'bg-[hsl(var(--surface-muted))] text-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
              )}
            >
              {c === 'toutes' ? t.glossaire.toutes : etiquettes[c]}
            </button>
          ))}
        </div>
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder={t.glossaire.rechercher} />
      </div>

      {resultats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <BookOpen className="size-8 text-[hsl(var(--muted))]" />
            <p className="font-display font-semibold">{t.glossaire.aucunResultat}</p>
          </CardContent>
        </Card>
      ) : (
        <dl className="space-y-3">
          {resultats.map((entree) => (
            <Card key={entree.terme}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <dt className="font-display text-base font-semibold">{entree.terme}</dt>
                  <Badge variant="neutre">{etiquettes[entree.categorie]}</Badge>
                </div>
                <dd className="mt-2 space-y-2.5">
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted))]">
                    {entree.definition}
                  </p>
                  {entree.nuance && (
                    <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[hsl(var(--surface-muted))] px-3 py-2.5 text-xs leading-relaxed">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--primary))]" />
                      <span>{entree.nuance}</span>
                    </p>
                  )}
                </dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      )}

      <p className="text-xs leading-relaxed text-[hsl(var(--muted))]">
        {t.glossaire.avertissement}
      </p>
    </div>
  );
}
