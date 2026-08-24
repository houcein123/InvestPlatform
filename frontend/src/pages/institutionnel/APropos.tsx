import { motion } from 'framer-motion';
import {
  BarChart3, ExternalLink, FileCheck2, LineChart, ScrollText, ShieldCheck, Target,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SOURCES_OFFICIELLES } from '@/lib/entreprise';

const ETAPES_METHODE = [
  {
    Icone: FileCheck2,
    titre: 'Collecte des données publiées',
    texte: "Les séries statistiques proviennent des organismes publics tunisiens. Elles sont importées telles quelles, sans retraitement, et chaque indicateur conserve la référence de sa source.",
  },
  {
    Icone: LineChart,
    titre: 'Calcul des perspectives',
    texte: "Deux modèles sont mis en concurrence sur chaque série — régression linéaire par moindres carrés et taux de croissance annuel moyen — et celui qui s'ajuste le mieux à l'historique est retenu. Une série dont aucun modèle n'atteint un coefficient de détermination suffisant ne reçoit aucune estimation.",
  },
  {
    Icone: ScrollText,
    titre: 'Rédaction adossée aux chiffres',
    texte: "Les sections d'analyse sont rédigées à partir du seul jeu de données du secteur, transmis intégralement au modèle de langage avec la consigne de n'avancer aucun chiffre absent de ce jeu. Le procédé et le modèle employés sont décrits dans la section « Sources et méthodologie » de chaque rapport.",
  },
  {
    Icone: ShieldCheck,
    titre: "Séparation de l'observé et de l'estimé",
    texte: "Une donnée publiée et une projection calculée ne sont jamais présentées de la même façon, ni dans l'interface ni dans le PDF : couleurs distinctes, tracé différent, mention explicite. Présenter une extrapolation comme un fait serait la faute la plus grave que puisse commettre ce service.",
  },
];

const CHIFFRES = [
  { valeur: '6', libelle: 'secteurs couverts' },
  { valeur: '12', libelle: 'sections par rapport' },
  { valeur: '14+', libelle: 'pages par document' },
  { valeur: '2020-2028', libelle: 'profondeur temporelle' },
];

export default function APropos() {
  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[var(--radius-card)] border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--surface))] to-[hsl(var(--surface-muted))] p-8 sm:p-10"
      >
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
          Qui sommes-nous
        </p>
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
          Rendre l&apos;économie tunisienne lisible pour ceux qui envisagent d&apos;y investir.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[hsl(var(--muted))]">
          Un investisseur étranger qui étudie la Tunisie se heurte à des données dispersées
          entre plusieurs organismes, publiées à des rythmes différents et rarement mises en
          perspective. Tunisia Invest rassemble ces séries, les met en forme et les commente,
          secteur par secteur, dans un document unique.
        </p>
      </motion.header>

      <section className="grid gap-4 sm:grid-cols-4">
        {CHIFFRES.map((chiffre, index) => (
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
          <h2 className="font-display text-xl font-bold">Notre méthode</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          La valeur d&apos;un rapport d&apos;investissement tient à ce qu&apos;on peut vérifier.
          Chaque étape de fabrication est donc conçue pour qu&apos;un lecteur puisse remonter
          d&apos;une affirmation à la donnée qui la fonde.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {ETAPES_METHODE.map(({ Icone, titre, texte }, index) => (
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
          <h2 className="font-display text-xl font-bold">Sources de données</h2>
        </div>
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted))]">
          Les chiffres publiés dans nos rapports proviennent d&apos;organismes publics
          tunisiens. Nous ne produisons aucune donnée primaire : notre travail consiste à
          rassembler, structurer et mettre en perspective ce qui est déjà publié.
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
                  Site officiel <ExternalLink className="size-3" />
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
              Ce que nos rapports ne sont pas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
            <p>
              Ce ne sont <strong className="text-[hsl(var(--foreground))]">pas des conseils
              en investissement</strong>. Nous n&apos;évaluons pas votre situation, vos
              objectifs ni votre tolérance au risque, et nous ne recommandons aucune
              opération. Un rapport documente un secteur ; la décision vous appartient.
            </p>
            <p>
              Ce ne sont <strong className="text-[hsl(var(--foreground))]">pas des prévisions
              garanties</strong>. Les projections 2025-2028 sont des extrapolations
              statistiques d&apos;un historique. Elles sont utiles pour situer un ordre de
              grandeur, jamais pour affirmer ce qui adviendra.
            </p>
            <p>
              Ce ne sont <strong className="text-[hsl(var(--foreground))]">pas des documents
              d&apos;audit</strong>. Ils ne remplacent ni une due diligence, ni l&apos;avis
              d&apos;un conseil juridique ou fiscal établi en Tunisie.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
