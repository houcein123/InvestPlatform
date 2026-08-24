import { useMemo, useState } from 'react';
import { BookOpen, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ChampRecherche } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Terme {
  terme: string;
  categorie: 'Fiscalité' | 'Statistique' | 'Logistique' | 'Investissement' | 'Énergie';
  definition: string;
  /** Précision utile quand le terme prête à confusion. */
  nuance?: string;
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
const TERMES: Terme[] = [
  {
    terme: 'Société totalement exportatrice',
    categorie: 'Fiscalité',
    definition: "Régime tunisien réservé aux entreprises dont l'essentiel du chiffre d'affaires est réalisé à l'export. Il ouvre droit à des avantages fiscaux et douaniers, en contrepartie d'obligations déclaratives et d'un seuil d'exportation à respecter.",
    nuance: "Le seuil et la durée des avantages relèvent de la loi de finances en vigueur : vérifiez-les auprès de l'APII avant de bâtir un plan financier dessus.",
  },
  {
    terme: 'Zone franche',
    categorie: 'Investissement',
    definition: "Périmètre douanier où les marchandises entrent et sortent sans droits ni taxes tant qu'elles ne sont pas mises à la consommation sur le marché local. Conçu pour les activités de transformation destinées à la réexportation.",
  },
  {
    terme: 'IDE — Investissement direct étranger',
    categorie: 'Investissement',
    definition: "Prise de participation durable d'un investisseur non-résident dans une entreprise résidente, avec intention d'influer sur sa gestion. Se distingue de l'investissement de portefeuille, purement financier et liquide.",
  },
  {
    terme: 'Valeur ajoutée sectorielle',
    categorie: 'Statistique',
    definition: "Richesse créée par un secteur : sa production diminuée des consommations intermédiaires. Exprimée en pourcentage du PIB, elle mesure le poids réel du secteur dans l'économie.",
    nuance: "À ne pas confondre avec le chiffre d'affaires : deux secteurs au chiffre d'affaires identique peuvent créer une richesse très différente.",
  },
  {
    terme: 'EVP — Équivalent vingt pieds',
    categorie: 'Logistique',
    definition: "Unité de mesure du trafic conteneurisé (TEU en anglais). Un conteneur standard de 20 pieds vaut 1 EVP, un conteneur de 40 pieds en vaut 2. Sert à comparer l'activité des ports indépendamment de la taille des boîtes.",
  },
  {
    terme: 'Coefficient de détermination (R²)',
    categorie: 'Statistique',
    definition: "Mesure de la qualité d'ajustement d'un modèle à des données observées, entre 0 et 1. Plus il approche de 1, mieux le modèle explique la série historique.",
    nuance: "Un R² élevé ne garantit pas que la projection se réalisera : il dit que le modèle colle au passé, pas qu'il prédit l'avenir. Les séries dont l'ajustement est insuffisant ne reçoivent aucune estimation dans nos rapports.",
  },
  {
    terme: 'Donnée observée / donnée estimée',
    categorie: 'Statistique',
    definition: "Une donnée observée a été publiée par une source officielle pour une année donnée. Une donnée estimée est calculée par extrapolation de l'historique.",
    nuance: "Nos rapports et cette interface ne les présentent jamais de la même façon : couleur, tracé et mention diffèrent. Présenter une extrapolation comme un fait serait la faute la plus grave que puisse commettre ce service.",
  },
  {
    terme: 'Balance commerciale sectorielle',
    categorie: 'Statistique',
    definition: "Différence entre les exportations et les importations d'un secteur sur une période. Un solde positif signale un secteur exportateur net.",
  },
  {
    terme: 'Capacité installée',
    categorie: 'Énergie',
    definition: "Puissance maximale qu'un parc de production peut délivrer, exprimée en mégawatts (MW). Elle ne dit rien de l'énergie réellement produite, qui dépend du facteur de charge.",
    nuance: "Une centrale solaire de 10 MW ne produit pas 10 MW en continu : l'ensoleillement conditionne sa production réelle.",
  },
  {
    terme: 'Facteur de charge',
    categorie: 'Énergie',
    definition: "Rapport entre l'énergie effectivement produite sur une période et celle qu'une installation aurait produite en fonctionnant à pleine puissance sur la même durée.",
  },
  {
    terme: 'Convention de non-double imposition',
    categorie: 'Fiscalité',
    definition: "Accord bilatéral qui répartit le droit d'imposer entre deux États, afin qu'un même revenu ne soit pas taxé deux fois. Détermine notamment le traitement des dividendes rapatriés.",
  },
  {
    terme: 'Due diligence',
    categorie: 'Investissement',
    definition: "Ensemble des vérifications menées avant un investissement : situation juridique, comptable, fiscale, sociale et environnementale de la cible.",
    nuance: "Un rapport sectoriel documente un marché ; il ne remplace en aucun cas une due diligence, qui porte sur une entreprise précise.",
  },
];

const CATEGORIES = ['Toutes', 'Fiscalité', 'Investissement', 'Statistique', 'Logistique', 'Énergie'] as const;

export default function Glossaire() {
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState<(typeof CATEGORIES)[number]>('Toutes');

  const resultats = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return TERMES
      .filter((t) => categorie === 'Toutes' || t.categorie === categorie)
      .filter((t) => !terme
        || t.terme.toLowerCase().includes(terme)
        || t.definition.toLowerCase().includes(terme))
      .sort((a, b) => a.terme.localeCompare(b.terme, 'fr'));
  }, [recherche, categorie]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          Ressources
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">Glossaire</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          Les termes rencontrés dans les rapports sectoriels, définis sans jargon.
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
              {c}
            </button>
          ))}
        </div>
        <ChampRecherche valeur={recherche} onChange={setRecherche} placeholder="Rechercher un terme…" />
      </div>

      {resultats.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <BookOpen className="size-8 text-[hsl(var(--muted))]" />
            <p className="font-display font-semibold">Aucun terme ne correspond</p>
          </CardContent>
        </Card>
      ) : (
        <dl className="space-y-3">
          {resultats.map((terme) => (
            <Card key={terme.terme}>
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <dt className="font-display text-base font-semibold">{terme.terme}</dt>
                  <Badge variant="neutre">{terme.categorie}</Badge>
                </div>
                <dd className="mt-2 space-y-2.5">
                  <p className="text-sm leading-relaxed text-[hsl(var(--muted))]">
                    {terme.definition}
                  </p>
                  {terme.nuance && (
                    <p className="flex items-start gap-2 rounded-[var(--radius-control)] bg-[hsl(var(--surface-muted))] px-3 py-2.5 text-xs leading-relaxed">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--primary))]" />
                      <span>{terme.nuance}</span>
                    </p>
                  )}
                </dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      )}

      <p className="text-xs leading-relaxed text-[hsl(var(--muted))]">
        Ces définitions décrivent des notions et des dispositifs, sans mentionner de
        taux ni de seuils : ceux-ci évoluent au fil des lois de finances, et une valeur
        figée ici deviendrait fausse sans que personne ne s&apos;en aperçoive. Les
        chiffres à jour figurent dans les rapports, avec leur date et leur source.
      </p>
    </div>
  );
}
