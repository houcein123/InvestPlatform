import { motion } from 'framer-motion';
import {
  BarChart3, ExternalLink, FileCheck2, LineChart, ScrollText, ShieldCheck, Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { SOURCES_OFFICIELLES } from '@/lib/entreprise';

/** Les quatre étapes de fabrication, dans la langue active. */
function etapesMethode(t: Dictionnaire) {
  return [
    { Icone: FileCheck2, titre: t.apropos.methodeCollecteTitre, texte: t.apropos.methodeCollecteTexte },
    { Icone: LineChart, titre: t.apropos.methodeCalculTitre, texte: t.apropos.methodeCalculTexte },
    { Icone: ScrollText, titre: t.apropos.methodeRedactionTitre, texte: t.apropos.methodeRedactionTexte },
    { Icone: ShieldCheck, titre: t.apropos.methodeSeparationTitre, texte: t.apropos.methodeSeparationTexte },
  ];
}

/**
 * Repères chiffrés.
 *
 * Les VALEURS restent hors dictionnaire : « 6 » ou « 2020-2028 » se lisent
 * identiquement dans les deux langues, et les dupliquer inviterait à les
 * corriger d'un côté seulement. Seuls les libellés sont traduits.
 */
function chiffres(t: Dictionnaire) {
  return [
    { valeur: '6', libelle: t.apropos.chiffreSecteurs },
    { valeur: '12', libelle: t.apropos.chiffreSections },
    { valeur: '14+', libelle: t.apropos.chiffrePages },
    { valeur: '2020-2028', libelle: t.apropos.chiffreProfondeur },
  ];
}

export default function APropos() {
  const { t } = useTraduction();

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--surface-muted))] p-8 sm:p-10"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          {t.apropos.surtitre}
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          {t.apropos.titre}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted))]">
          {t.apropos.accroche}
        </p>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-4">
        {chiffres(t).map((chiffre, index) => (
          <motion.div
            key={chiffre.libelle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            className="surface-card p-5 text-center"
          >
            <p className="tabular font-display text-2xl font-bold text-[hsl(var(--primary))]">
              {chiffre.valeur}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--muted))]">{chiffre.libelle}</p>
          </motion.div>
        ))}
      </section>

      <section id="methode" className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-2">
          <Target className="size-5 text-[hsl(var(--primary))]" />
          <h2 className="font-display text-xl font-bold">{t.apropos.methodeTitre}</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.apropos.methodeAccroche}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {etapesMethode(t).map(({ Icone, titre, texte }, index) => (
            <motion.article
              key={titre}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: index * 0.05 }}
              className="surface-card p-6"
            >
              <span className="mb-3 grid size-10 w-fit place-items-center rounded-xl bg-[hsl(var(--primary-soft))] text-[hsl(var(--primary))]">
                <Icone className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold">{titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--muted))]">{texte}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="sources" className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-2">
          <BarChart3 className="size-5 text-[hsl(var(--primary))]" />
          <h2 className="font-display text-xl font-bold">{t.apropos.sourcesTitre}</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.apropos.sourcesAccroche}
        </p>

        <Card>
          <CardContent className="divide-y divide-[hsl(var(--border))] py-0">
            {SOURCES_OFFICIELLES.map((source) => (
              <div key={source.sigle} className="flex flex-wrap items-center gap-4 py-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[hsl(var(--surface-muted))] font-display text-xs font-bold">
                  {source.sigle}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{source.nom}</p>
                  <p className="mt-0.5 text-xs text-[hsl(var(--muted))]">{source.role}</p>
                </div>
                <a
                  href={source.site}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 text-xs font-medium text-[hsl(var(--primary))] hover:underline"
                >
                  {t.apropos.siteOfficiel} <ExternalLink className="size-3" />
                </a>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-[hsl(var(--primary))]" />
              {t.apropos.limitesTitre}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
            <p>
              {t.apropos.limitesConseilAvant}
              <strong className="text-[hsl(var(--foreground))]">{t.apropos.limitesConseilFort}</strong>
              {t.apropos.limitesConseilApres}
            </p>
            <p>
              {t.apropos.limitesConseilAvant}
              <strong className="text-[hsl(var(--foreground))]">{t.apropos.limitesPrevisionsFort}</strong>
              {t.apropos.limitesPrevisionsApres}
            </p>
            <p>
              {t.apropos.limitesConseilAvant}
              <strong className="text-[hsl(var(--foreground))]">{t.apropos.limitesAuditFort}</strong>
              {t.apropos.limitesAuditApres}
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
