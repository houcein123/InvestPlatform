import { Building2, Cookie, Database, Server, ShieldAlert } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTraduction } from '@/i18n';
import { ENTREPRISE, adressePostale, estRenseigne } from '@/lib/entreprise';

/** Affiche une valeur, ou signale qu'elle reste à renseigner. */
function Champ({ libelle, valeur, absent }: { libelle: string; valeur: string; absent: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[hsl(var(--border))] py-2.5 last:border-0">
      <dt className="text-sm text-[hsl(var(--muted))]">{libelle}</dt>
      <dd className={estRenseigne(valeur) ? 'text-sm font-medium' : 'text-sm italic text-[hsl(var(--warning))]'}>
        {estRenseigne(valeur) ? valeur : absent}
      </dd>
    </div>
  );
}

export default function MentionsLegales() {
  const { t } = useTraduction();
  const adresse = adressePostale();
  const absent = t.legal.aRenseigner;

  const manquants = [
    ENTREPRISE.raisonSociale, ENTREPRISE.immatriculation,
    ENTREPRISE.directeurPublication, ENTREPRISE.hebergeur.nom,
  ].filter((v) => !estRenseigne(v)).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold leading-tight">{t.legal.titre}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          {t.legal.accroche}
        </p>
      </header>

      {manquants > 0 && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] p-4"
        >
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-[hsl(var(--warning))]" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">{t.legal.manquantsTitre(manquants)}</p>
            <p className="mt-1 text-[hsl(var(--muted))]">
              {t.legal.manquantsAvant}{' '}
              <code className="rounded bg-[hsl(var(--surface-muted))] px-1.5 py-0.5 text-xs">
                src/lib/entreprise.ts
              </code>
              {t.legal.manquantsApres}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-[hsl(var(--primary))]" /> {t.legal.editeur}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-[hsl(var(--border))]">
            <Champ libelle={t.legal.nomCommercial} valeur={ENTREPRISE.nom} absent={absent} />
            <Champ libelle={t.legal.raisonSociale} valeur={ENTREPRISE.raisonSociale} absent={absent} />
            <Champ libelle={t.legal.formeJuridique} valeur={ENTREPRISE.formeJuridique} absent={absent} />
            <Champ libelle={t.legal.immatriculation} valeur={ENTREPRISE.immatriculation} absent={absent} />
            <Champ libelle={t.legal.capitalSocial} valeur={ENTREPRISE.capitalSocial} absent={absent} />
            <Champ libelle={t.legal.siegeSocial} valeur={adresse ?? ''} absent={absent} />
            <Champ libelle={t.legal.directeurPublication} valeur={ENTREPRISE.directeurPublication} absent={absent} />
            <Champ libelle={t.legal.contact} valeur={ENTREPRISE.contact.emailGeneral} absent={absent} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Server className="size-4 text-[hsl(var(--primary))]" /> {t.legal.hebergement}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-[hsl(var(--border))]">
            <Champ libelle={t.legal.hebergeur} valeur={ENTREPRISE.hebergeur.nom} absent={absent} />
            <Champ libelle={t.legal.adresse} valeur={ENTREPRISE.hebergeur.adresse} absent={absent} />
          </dl>
        </CardContent>
      </Card>

      <Card id="donnees" className="scroll-mt-24">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="size-4 text-[hsl(var(--primary))]" /> {t.legal.donneesTitre}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          <p>
            <strong className="text-[hsl(var(--foreground))]">{t.legal.donneesCollecteesTitre}</strong>{' '}
            {t.legal.donneesCollecteesTexte}
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">{t.legal.donneesJamaisTitre}</strong>{' '}
            {t.legal.donneesJamaisTexte}
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">{t.legal.donneesFinaliteTitre}</strong>{' '}
            {t.legal.donneesFinaliteTexte}
          </p>
          <p>
            <strong className="text-[hsl(var(--foreground))]">{t.legal.donneesDroitsTitre}</strong>{' '}
            {t.legal.donneesDroitsTexte}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Cookie className="size-4 text-[hsl(var(--primary))]" /> {t.legal.stockageTitre}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-[hsl(var(--muted))]">
          <p>{t.legal.stockageIntro}</p>
          <ul className="ml-4 list-disc space-y-1.5">
            <li>{t.legal.stockageJeton}</li>
            <li>{t.legal.stockageTheme}</li>
            <li>{t.legal.stockageLangue}</li>
            <li>{t.legal.stockagePreferences}</li>
          </ul>
          <p>{t.legal.stockageConclusion}</p>
        </CardContent>
      </Card>
    </div>
  );
}
