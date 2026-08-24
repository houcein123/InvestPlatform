import { AlertTriangle, Ban, LineChart, Scale, TrendingDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECTIONS = [
  {
    Icone: Ban,
    titre: '1. Nature de l’information fournie',
    paragraphes: [
      "Les rapports sectoriels publiés sur cette plateforme constituent des documents d’information économique à caractère général. Ils ne constituent pas un conseil en investissement, une recommandation personnalisée, une sollicitation d’achat ou de vente, ni une offre de service financier réglementé.",
      "L’éditeur n’évalue ni votre situation patrimoniale, ni vos objectifs, ni votre horizon de placement, ni votre tolérance au risque. Aucun élément de ces rapports ne doit être compris comme une incitation à réaliser une opération déterminée.",
    ],
  },
  {
    Icone: TrendingDown,
    titre: '2. Risque de perte en capital',
    paragraphes: [
      "Tout investissement comporte un risque de perte, pouvant aller jusqu’à la totalité des sommes engagées. Les performances passées d’un secteur ne préjugent pas de ses performances futures.",
      "Un investissement direct à l’étranger expose en outre à des risques spécifiques : évolution du cadre réglementaire et fiscal, variation du taux de change, restrictions de change ou de rapatriement des capitaux, risque politique, risque de contrepartie et risque de liquidité.",
    ],
  },
  {
    Icone: LineChart,
    titre: '3. Statut des projections',
    paragraphes: [
      "Les valeurs présentées pour les années 2025 à 2028 sont des ESTIMATIONS obtenues par extrapolation statistique de séries historiques. Elles sont systématiquement signalées comme telles dans l’interface comme dans les documents PDF, et ne doivent jamais être lues comme des données publiées.",
      "Une série dont l’ajustement statistique est jugé insuffisant ne reçoit aucune estimation : l’absence de projection est un résultat, pas une omission.",
    ],
  },
  {
    Icone: Scale,
    titre: '4. Sources et exactitude',
    paragraphes: [
      "Les données chiffrées proviennent d’organismes publics tunisiens et sont reproduites en l’état. L’éditeur ne garantit ni leur exhaustivité, ni leur actualité, ni l’absence d’erreur à la source, et ne saurait être tenu responsable d’une décision fondée sur ces informations.",
      "Les sections rédigées des rapports sont produites à partir du seul jeu de données du secteur concerné. Le procédé employé est décrit explicitement dans la section « Sources et méthodologie » de chaque document.",
    ],
  },
  {
    Icone: AlertTriangle,
    titre: '5. Recours à un conseil professionnel',
    paragraphes: [
      "Avant toute décision d’investissement en Tunisie, il est recommandé de consulter un conseil juridique, fiscal et financier établi localement, et de procéder aux vérifications d’usage (due diligence) propres au projet envisagé.",
      "Les rapports de cette plateforme ne remplacent en aucun cas ces démarches.",
    ],
  },
];

/**
 * Avertissement sur les risques.
 *
 * Page à part entière, référencée depuis le pied de page de chaque écran. Un
 * service qui vend de l'analyse d'investissement doit énoncer ses limites de
 * façon lisible et permanente, pas dans une note de bas de page.
 */
export default function AvertissementRisques() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--warning))]">
          Information réglementaire
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          Avertissement sur les risques
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          À lire avant toute utilisation des rapports proposés sur cette plateforme.
        </p>
      </header>

      <div
        role="note"
        className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-5"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
        <p className="text-sm font-medium leading-relaxed">
          Les rapports de Tunisia Invest sont des documents d&apos;information. Ils ne
          constituent ni un conseil en investissement, ni une recommandation, ni une
          garantie de résultat. Tout investissement comporte un risque de perte en capital.
        </p>
      </div>

      {SECTIONS.map(({ Icone, titre, paragraphes }) => (
        <Card key={titre}>
          <CardHeader>
            <CardTitle className="flex items-start gap-2.5 text-base">
              <Icone className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
              {titre}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {paragraphes.map((paragraphe) => (
              <p key={paragraphe.slice(0, 40)} className="text-sm leading-relaxed text-[hsl(var(--muted))]">
                {paragraphe}
              </p>
            ))}
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-[hsl(var(--muted))]">
        Dernière mise à jour de cet avertissement : {new Date().toLocaleDateString('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric',
        })}.
      </p>
    </div>
  );
}
