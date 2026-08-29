import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell, CreditCard, Database, Eye, Languages, LogOut, Monitor, Moon, RotateCcw,
  Server, Sparkles, Sun,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { useTheme } from '@/components/layout/ThemeProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LigneReglage, Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { LANGUES, useTraduction, type Langue } from '@/i18n';
import { fr as dicoFr } from '@/i18n/fr';
import { en as dicoEn } from '@/i18n/en';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import {
  ecrirePreferences, lirePreferences, reinitialiserPreferences, type Preferences,
} from '@/lib/preferences';
import { cn } from '@/lib/utils';

interface EtatSysteme {
  paiement?: {
    mode?: string; environnement?: string; configure?: boolean;
    argentReel?: boolean; devise?: string;
  };
  moteurRapports?: {
    joignable?: boolean;
    redaction?: { configure?: boolean; modele?: string };
    generationsEnCours?: number;
  };
}

function themes(t: Dictionnaire) {
  return [
    { cle: 'light' as const, libelle: t.parametres.themeClair, Icone: Sun },
    { cle: 'dark' as const, libelle: t.parametres.themeSombre, Icone: Moon },
  ];
}

/** Nom natif de chaque langue, comme dans le selecteur de l'en-tete. */
const NOMS_LANGUE: Record<Langue, string> = {
  fr: dicoFr.metaLangue.nom,
  en: dicoEn.metaLangue.nom,
};

export default function Parametres() {
  const { compte, estAdmin, deconnecter } = useAuth();
  const { theme, basculer } = useTheme();
  const { t, langue, definirLangue } = useTraduction();
  const [preferences, setPreferences] = useState<Preferences>(lirePreferences);

  // Les préférences sont écrites à chaque changement plutôt que derrière un
  // bouton « Enregistrer » : un réglage d'affichage doit s'appliquer aussitôt,
  // sinon on ne sait pas si le clic a été pris en compte.
  useEffect(() => { ecrirePreferences(preferences); }, [preferences]);

  // L'état des services n'est lisible que par un administrateur : la route est
  // sous /api/admin. On ne la demande donc pas pour un client, sous peine de
  // faire clignoter une erreur 403 sans objet.
  const systeme = useQuery({
    queryKey: cles.adminSysteme,
    queryFn: api.systeme,
    enabled: estAdmin,
  });
  const etat = systeme.data as EtatSysteme | undefined;

  function basculerPreference(cle: keyof Preferences) {
    setPreferences((actuelles) => ({ ...actuelles, [cle]: !actuelles[cle] }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold">{t.parametres.titre}</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          {t.parametres.accroche}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t.parametres.apparenceTitre}</CardTitle>
          <CardDescription>
            {t.parametres.apparenceDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {themes(t).map(({ cle, libelle, Icone }) => {
              const actif = theme === cle;
              return (
                <button
                  key={cle}
                  type="button"
                  onClick={() => { if (!actif) basculer(); }}
                  aria-pressed={actif}
                  className={cn(
                    'flex items-center gap-3 rounded-[var(--radius-control)] border p-4 text-left transition-colors',
                    actif
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-soft))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-muted))]',
                  )}
                >
                  <Icone className={cn('size-5', actif && 'text-[hsl(var(--primary))]')} />
                  <span className="text-sm font-medium">{libelle}</span>
                  {actif && (
                    <motion.span
                      layoutId="theme-actif"
                      className="ml-auto size-2 rounded-full bg-[hsl(var(--primary))]"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* La langue est reglable ici EN PLUS du selecteur de l'en-tete :
              on vient dans les parametres pour changer un reglage durable, et
              ne pas l'y trouver donne a croire qu'il n'existe pas. */}
          <div className="grid gap-3 sm:grid-cols-2">
            {LANGUES.map((code) => {
              const actif = langue === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => definirLangue(code)}
                  aria-pressed={actif}
                  className={cn(
                    'flex items-center gap-3 rounded-[var(--radius-control)] border p-4 text-left transition-colors',
                    actif
                      ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary-soft))]'
                      : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-muted))]',
                  )}
                >
                  <Languages className={cn('size-5', actif && 'text-[hsl(var(--primary))]')} />
                  <span className="text-sm font-medium">{NOMS_LANGUE[code]}</span>
                  {actif && (
                    <motion.span
                      layoutId="langue-active"
                      className="ml-auto size-2 rounded-full bg-[hsl(var(--primary))]"
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs leading-relaxed text-[hsl(var(--muted))]">
            {t.parametres.langueDescription}
          </p>

          <div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
            <LigneReglage
              titre={t.parametres.affichageCompact}
              description={t.parametres.affichageCompactDescription}
            >
              <Switch
                checked={preferences.densite === 'compacte'}
                onCheckedChange={(actif) =>
                  setPreferences({ ...preferences, densite: actif ? 'compacte' : 'confortable' })}
                aria-label={t.parametres.affichageCompact}
              />
            </LigneReglage>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.parametres.rapportsTitre}</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[hsl(var(--border))] py-0">
          <LigneReglage
            titre={t.parametres.ouvrirPdf}
            description={t.parametres.ouvrirPdfDescription}
          >
            <Switch
              checked={preferences.ouvrirPdfAutomatiquement}
              onCheckedChange={() => basculerPreference('ouvrirPdfAutomatiquement')}
              aria-label={t.parametres.ouvrirPdf}
            />
          </LigneReglage>

          <LigneReglage
            titre={t.parametres.afficherEstimations}
            description={t.parametres.afficherEstimationsDescription}
          >
            <Switch
              checked={preferences.afficherProjections}
              onCheckedChange={() => basculerPreference('afficherProjections')}
              aria-label={t.parametres.afficherEstimations}
            />
          </LigneReglage>

          <LigneReglage
            titre={t.parametres.notifications}
            description={t.parametres.notificationsDescription}
          >
            <Switch
              checked={preferences.notificationsActives}
              onCheckedChange={() => basculerPreference('notificationsActives')}
              aria-label={t.parametres.notifications}
            />
          </LigneReglage>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.parametres.compteTitre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">{t.parametres.adresseEmail}</dt>
              <dd className="mt-0.5 text-sm font-medium">{compte?.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">{t.parametres.role}</dt>
              <dd className="mt-0.5">
                <Badge variant={estAdmin ? 'accent' : 'primaire'}>
                  {estAdmin ? t.role.administrateur : t.role.client}
                </Badge>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-[hsl(var(--border))] pt-4">
            <Button variant="outline" size="sm" onClick={() => {
              reinitialiserPreferences();
              setPreferences(lirePreferences());
              toast.success(t.parametres.preferencesReinitialisees);
            }}>
              <RotateCcw /> {t.parametres.reinitialiser}
            </Button>

            <Button variant="danger" size="sm" onClick={deconnecter}>
              <LogOut /> {t.commun.seDeconnecter}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-[hsl(var(--primary))]" /> {t.parametres.donneesTitre}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm text-[hsl(var(--muted))]">
          <p className="flex items-start gap-2">
            <Eye className="mt-0.5 size-4 shrink-0" />
            {t.parametres.donneesLocal}
          </p>
          <p className="flex items-start gap-2">
            <CreditCard className="mt-0.5 size-4 shrink-0" />
            {t.parametres.donneesPaiement}
          </p>
          <p className="flex items-start gap-2">
            <Bell className="mt-0.5 size-4 shrink-0" />
            {t.parametres.donneesConservation}
          </p>
        </CardContent>
      </Card>

      {/* L'état des services externes n'intéresse que l'exploitation : il est
          réservé aux administrateurs, comme la route qui le fournit. */}
      {estAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-4 text-[hsl(var(--primary))]" /> {t.parametres.servicesTitre}
            </CardTitle>
            <CardDescription>{t.parametres.servicesDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systeme.isLoading && <Skeleton className="h-24 w-full" />}

            {systeme.isError && (
              <p role="alert" className="text-sm text-[hsl(var(--danger))]">
                {(systeme.error as Error).message}
              </p>
            )}

            {etat && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <CreditCard className="size-4" /> {t.parametres.servicePaiement}
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-[hsl(var(--muted))]">
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceMode}</span>
                      <Badge variant={etat.paiement?.mode === 'paypal' ? 'primaire' : 'neutre'}>
                        {etat.paiement?.mode ?? '—'}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceEnvironnement}</span>
                      {/* Un environnement « live » débite de l'argent réel :
                          il doit sauter aux yeux, pas se fondre dans la page. */}
                      <Badge variant={etat.paiement?.argentReel ? 'danger' : 'avertissement'}>
                        {etat.paiement?.environnement ?? '—'}
                        {etat.paiement?.argentReel ? t.parametres.serviceArgentReel : t.parametres.serviceTest}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceIdentifiants}</span>
                      <Badge variant={etat.paiement?.configure ? 'succes' : 'neutre'}>
                        {etat.paiement?.configure ? t.parametres.serviceConfigures : t.parametres.serviceAbsents}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="size-4" /> {t.parametres.serviceMoteur}
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-[hsl(var(--muted))]">
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceDisponibilite}</span>
                      <Badge variant={etat.moteurRapports?.joignable === false ? 'danger' : 'succes'}>
                        {etat.moteurRapports?.joignable === false ? t.parametres.serviceInjoignable : t.parametres.serviceEnLigne}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceRedaction}</span>
                      <Badge variant={etat.moteurRapports?.redaction?.configure ? 'succes' : 'avertissement'}>
                        {etat.moteurRapports?.redaction?.configure ? t.parametres.serviceActive : t.parametres.serviceCleAbsente}
                      </Badge>
                    </p>
                    {etat.moteurRapports?.redaction?.modele && (
                      <p className="flex items-center justify-between gap-3">
                        <span>{t.parametres.serviceModele}</span>
                        <span className="truncate font-mono text-[0.6875rem]">
                          {etat.moteurRapports.redaction.modele}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center justify-between gap-3">
                      <span>{t.parametres.serviceGenerations}</span>
                      <span className="tabular font-semibold">
                        {etat.moteurRapports?.generationsEnCours ?? 0}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => systeme.refetch()}
              chargement={systeme.isFetching}>
              <Monitor /> {t.parametres.actualiser}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
