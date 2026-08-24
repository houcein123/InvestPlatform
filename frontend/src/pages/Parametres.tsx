import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Bell, CreditCard, Database, Eye, LogOut, Monitor, Moon, RotateCcw,
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

const THEMES = [
  { cle: 'light' as const, libelle: 'Clair', Icone: Sun },
  { cle: 'dark' as const, libelle: 'Sombre', Icone: Moon },
];

export default function Parametres() {
  const { compte, estAdmin, deconnecter } = useAuth();
  const { theme, basculer } = useTheme();
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
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          Réglages d&apos;affichage propres à cet appareil, et état de votre compte.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Apparence</CardTitle>
          <CardDescription>
            Le thème est mémorisé sur ce navigateur. Par défaut, il suit le réglage
            de votre système.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {THEMES.map(({ cle, libelle, Icone }) => {
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

          <div className="divide-y divide-[hsl(var(--border))] border-t border-[hsl(var(--border))]">
            <LigneReglage
              titre="Affichage compact"
              description="Réduit les espacements des tableaux et des listes pour voir plus de lignes à l'écran."
            >
              <Switch
                checked={preferences.densite === 'compacte'}
                onCheckedChange={(actif) =>
                  setPreferences({ ...preferences, densite: actif ? 'compacte' : 'confortable' })}
                aria-label="Affichage compact"
              />
            </LigneReglage>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rapports et notifications</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-[hsl(var(--border))] py-0">
          <LigneReglage
            titre="Ouvrir le PDF automatiquement"
            description="Dès qu'une génération aboutit, le rapport s'ouvre dans un nouvel onglet."
          >
            <Switch
              checked={preferences.ouvrirPdfAutomatiquement}
              onCheckedChange={() => basculerPreference('ouvrirPdfAutomatiquement')}
              aria-label="Ouvrir le PDF automatiquement"
            />
          </LigneReglage>

          <LigneReglage
            titre="Afficher les estimations"
            description="Présente les projections 2025-2028 à côté des données publiées. Elles restent visuellement distinctes : jamais confondues avec un chiffre officiel."
          >
            <Switch
              checked={preferences.afficherProjections}
              onCheckedChange={() => basculerPreference('afficherProjections')}
              aria-label="Afficher les estimations"
            />
          </LigneReglage>

          <LigneReglage
            titre="Notifications à l'écran"
            description="Confirmations de paiement, fin de génération et messages d'erreur."
          >
            <Switch
              checked={preferences.notificationsActives}
              onCheckedChange={() => basculerPreference('notificationsActives')}
              aria-label="Notifications à l'écran"
            />
          </LigneReglage>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">Adresse email</dt>
              <dd className="mt-0.5 text-sm font-medium">{compte?.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">Rôle</dt>
              <dd className="mt-0.5">
                <Badge variant={estAdmin ? 'accent' : 'primaire'}>
                  {estAdmin ? 'Administrateur' : 'Client'}
                </Badge>
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 border-t border-[hsl(var(--border))] pt-4">
            <Button variant="outline" size="sm" onClick={() => {
              reinitialiserPreferences();
              setPreferences(lirePreferences());
              toast.success('Préférences réinitialisées');
            }}>
              <RotateCcw /> Réinitialiser les préférences
            </Button>

            <Button variant="danger" size="sm" onClick={deconnecter}>
              <LogOut /> Se déconnecter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4 text-[hsl(var(--primary))]" /> Données et confidentialité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm text-[hsl(var(--muted))]">
          <p className="flex items-start gap-2">
            <Eye className="mt-0.5 size-4 shrink-0" />
            Les réglages de cette page ne quittent pas ce navigateur : ils sont
            stockés localement, jamais transmis au serveur ni rattachés à votre compte.
          </p>
          <p className="flex items-start gap-2">
            <CreditCard className="mt-0.5 size-4 shrink-0" />
            Pour chaque règlement, seules l&apos;adresse du compte payeur et la référence
            de transaction sont conservées — la trace comptable, rien de plus.
          </p>
          <p className="flex items-start gap-2">
            <Bell className="mt-0.5 size-4 shrink-0" />
            Les rapports que vous achetez restent accessibles dans « Mes rapports »
            sans limite de durée.
          </p>
        </CardContent>
      </Card>

      {/* L'état des services externes n'intéresse que l'exploitation : il est
          réservé aux administrateurs, comme la route qui le fournit. */}
      {estAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="size-4 text-[hsl(var(--primary))]" /> État des services
            </CardTitle>
            <CardDescription>Paiement et moteur de rédaction.</CardDescription>
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
                    <CreditCard className="size-4" /> Paiement
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-[hsl(var(--muted))]">
                    <p className="flex items-center justify-between gap-3">
                      <span>Mode</span>
                      <Badge variant={etat.paiement?.mode === 'paypal' ? 'primaire' : 'neutre'}>
                        {etat.paiement?.mode ?? '—'}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>Environnement</span>
                      {/* Un environnement « live » débite de l'argent réel :
                          il doit sauter aux yeux, pas se fondre dans la page. */}
                      <Badge variant={etat.paiement?.argentReel ? 'danger' : 'avertissement'}>
                        {etat.paiement?.environnement ?? '—'}
                        {etat.paiement?.argentReel ? ' · argent réel' : ' · test'}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>Identifiants</span>
                      <Badge variant={etat.paiement?.configure ? 'succes' : 'neutre'}>
                        {etat.paiement?.configure ? 'configurés' : 'absents'}
                      </Badge>
                    </p>
                  </div>
                </div>

                <div className="rounded-[var(--radius-control)] border border-[hsl(var(--border))] p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <Sparkles className="size-4" /> Moteur de rapports
                  </p>
                  <div className="mt-3 space-y-2 text-xs text-[hsl(var(--muted))]">
                    <p className="flex items-center justify-between gap-3">
                      <span>Disponibilité</span>
                      <Badge variant={etat.moteurRapports?.joignable === false ? 'danger' : 'succes'}>
                        {etat.moteurRapports?.joignable === false ? 'injoignable' : 'en ligne'}
                      </Badge>
                    </p>
                    <p className="flex items-center justify-between gap-3">
                      <span>Rédaction</span>
                      <Badge variant={etat.moteurRapports?.redaction?.configure ? 'succes' : 'avertissement'}>
                        {etat.moteurRapports?.redaction?.configure ? 'active' : 'clé absente'}
                      </Badge>
                    </p>
                    {etat.moteurRapports?.redaction?.modele && (
                      <p className="flex items-center justify-between gap-3">
                        <span>Modèle</span>
                        <span className="truncate font-mono text-[0.6875rem]">
                          {etat.moteurRapports.redaction.modele}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center justify-between gap-3">
                      <span>Générations en cours</span>
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
              <Monitor /> Actualiser
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
