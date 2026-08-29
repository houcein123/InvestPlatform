import { AlertTriangle, Ban, LineChart, Scale, TrendingDown } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { formatDate } from '@/lib/utils';

/**
 * Les cinq sections de l'avertissement, dans la langue active.
 *
 * Fonction du dictionnaire plutôt que constante de module : figée au
 * chargement, la liste resterait dans la langue du premier rendu. Sur une page
 * dont l'objet même est d'être comprise, un texte réglementaire servi dans la
 * mauvaise langue est un défaut, pas une approximation.
 */
function sections(t: Dictionnaire) {
  return [
    { Icone: Ban, titre: t.risques.natureTitre, paragraphes: [t.risques.natureP1, t.risques.natureP2] },
    { Icone: TrendingDown, titre: t.risques.perteTitre, paragraphes: [t.risques.perteP1, t.risques.perteP2] },
    { Icone: LineChart, titre: t.risques.projectionsTitre, paragraphes: [t.risques.projectionsP1, t.risques.projectionsP2] },
    { Icone: Scale, titre: t.risques.sourcesTitre, paragraphes: [t.risques.sourcesP1, t.risques.sourcesP2] },
    { Icone: AlertTriangle, titre: t.risques.conseilTitre, paragraphes: [t.risques.conseilP1, t.risques.conseilP2] },
  ];
}

/**
 * Avertissement sur les risques.
 *
 * Page à part entière, référencée depuis le pied de page de chaque écran. Un
 * service qui vend de l'analyse d'investissement doit énoncer ses limites de
 * façon lisible et permanente, pas dans une note de bas de page.
 */
export default function AvertissementRisques() {
  const { t } = useTraduction();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--warning))]">
          {t.risques.surtitre}
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight">
          {t.risques.titre}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.risques.accroche}
        </p>
      </header>

      <div
        role="note"
        className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-5"
      >
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
        <p className="text-sm font-medium leading-relaxed">
          {t.risques.encadre}
        </p>
      </div>

      {sections(t).map(({ Icone, titre, paragraphes }) => (
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
        {t.risques.derniereMiseAJour(formatDate(new Date().toISOString()))}
      </p>
    </div>
  );
}
