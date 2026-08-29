import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BadgeCheck, Building2, CalendarClock, Check, FileText, Globe, KeyRound,
  Mail, Phone, ShieldCheck, User, Wallet,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErreurChamp, Input, Label } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { useTraduction } from '@/i18n';
import type { Dictionnaire } from '@/i18n/fr';
import { api } from '@/lib/api';
import { cles } from '@/lib/queryClient';
import { formatDate, formatMontant, formatNombre, initiales } from '@/lib/utils';

/**
 * Force d'un mot de passe.
 *
 * Volontairement descriptive plutôt que bloquante : le serveur impose un
 * minimum de 8 caractères, cet indicateur aide à faire mieux sans transformer
 * la saisie en jeu de devinettes sur des règles invisibles.
 */
function evaluerMotDePasse(valeur: string, t: Dictionnaire) {
  if (!valeur) return null;

  const criteres = [
    valeur.length >= 12,
    /[a-z]/.test(valeur) && /[A-Z]/.test(valeur),
    /[0-9]/.test(valeur),
    /[^A-Za-z0-9]/.test(valeur),
  ];
  const score = criteres.filter(Boolean).length + (valeur.length >= 8 ? 1 : 0);

  if (score <= 2) return { libelle: t.profil.forceFaible, part: 33, teinte: 'bg-[hsl(var(--danger))]' };
  if (score <= 3) return { libelle: t.profil.forceCorrecte, part: 66, teinte: 'bg-[hsl(var(--warning))]' };
  return { libelle: t.profil.forceSolide, part: 100, teinte: 'bg-[hsl(var(--success))]' };
}

export default function Profil() {
  const { compte, rafraichir } = useAuth();
  const { t } = useTraduction();

  const [identite, setIdentite] = useState({
    nom: compte?.nom ?? '',
    prenom: compte?.prenom ?? '',
    entreprise: compte?.entreprise ?? '',
    pays: compte?.pays ?? '',
    telephone: compte?.telephone ?? '',
  });

  const [motsDePasse, setMotsDePasse] = useState({
    actuel: '', nouveau: '', confirmation: '',
  });
  const [erreurMdp, setErreurMdp] = useState('');

  // L'activité alimente les indicateurs du haut de page : un profil qui ne
  // rappelle rien de ce que le compte a fait n'apprend rien à son titulaire.
  const achats = useQuery({ queryKey: cles.mesRapports, queryFn: api.mesRapports });
  const lignes = achats.data?.achats ?? [];
  const totalDepense = lignes.reduce((somme, a) => somme + Number(a.montant ?? 0), 0);
  const rapportsLivres = lignes.filter((a) => a.chemin_fichier).length;

  const enregistrerIdentite = useMutation({
    mutationFn: () => api.updateProfil(identite),
    onSuccess: ({ compte: maj }) => {
      rafraichir(maj);
      toast.success(t.profil.profilMisAJour);
    },
    onError: (erreur: Error) => toast.error(t.profil.enregistrementImpossible, { description: erreur.message }),
  });

  const changerMotDePasse = useMutation({
    mutationFn: () => api.changePassword({
      mot_de_passe_actuel: motsDePasse.actuel,
      nouveau_mot_de_passe: motsDePasse.nouveau,
    }),
    onSuccess: () => {
      toast.success(t.profil.motDePasseMisAJour);
      setMotsDePasse({ actuel: '', nouveau: '', confirmation: '' });
      setErreurMdp('');
    },
    onError: (erreur: Error) => setErreurMdp(erreur.message),
  });

  function soumettreMotDePasse(evenement: React.FormEvent) {
    evenement.preventDefault();
    // La confirmation est vérifiée ici : envoyer au serveur un mot de passe
    // que l'utilisateur a mal ressaisi lui ferait perdre l'accès à son compte.
    if (motsDePasse.nouveau !== motsDePasse.confirmation) {
      setErreurMdp(t.profil.saisiesDifferentes);
      return;
    }
    if (motsDePasse.nouveau.length < 8) {
      setErreurMdp(t.profil.motDePasseTropCourt);
      return;
    }
    setErreurMdp('');
    changerMotDePasse.mutate();
  }

  const force = evaluerMotDePasse(motsDePasse.nouveau, t);
  const estAdmin = compte?.role === 'admin';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card flex flex-wrap items-center gap-5 p-6"
      >
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] font-display text-xl font-bold text-[hsl(var(--primary-foreground))]">
          {initiales(compte?.prenom, compte?.nom)}
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-bold leading-tight">
            {compte?.prenom} {compte?.nom}
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[hsl(var(--muted))]">
            <span className="flex items-center gap-1.5"><Mail className="size-3.5" />{compte?.email}</span>
            {compte?.entreprise && (
              <span className="flex items-center gap-1.5"><Building2 className="size-3.5" />{compte.entreprise}</span>
            )}
            {compte?.pays && (
              <span className="flex items-center gap-1.5"><Globe className="size-3.5" />{compte.pays}</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={estAdmin ? 'accent' : 'primaire'}>
            {estAdmin ? <ShieldCheck /> : <User />}
            {estAdmin ? t.role.administrateur : t.role.client}
          </Badge>
          {compte?.est_verifie && <Badge variant="succes"><BadgeCheck /> {t.profil.verifie}</Badge>}
        </div>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} libelle={t.profil.rapportsCommandes} valeur={formatNombre(lignes.length)}
          Icone={FileText} detail={t.profil.livres(formatNombre(rapportsLivres))} />
        <StatCard index={1} libelle={t.profil.totalRegle} valeur={formatMontant(totalDepense)}
          Icone={Wallet} teinte="succes" />
        <StatCard index={2} libelle={t.profil.derniereConnexion}
          valeur={compte?.derniere_connexion ? formatDate(compte.derniere_connexion) : '—'}
          Icone={CalendarClock} teinte="neutre"
          detail={compte?.created_at ? t.profil.membreDepuis(formatDate(compte.created_at)) : undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.profil.infosTitre}</CardTitle>
          <CardDescription>
            {t.profil.infosDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(evenement) => { evenement.preventDefault(); enregistrerIdentite.mutate(); }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">{t.profil.prenom}</Label>
                <Input id="prenom" value={identite.prenom} autoComplete="given-name"
                  onChange={(e) => setIdentite({ ...identite, prenom: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">{t.profil.nom}</Label>
                <Input id="nom" value={identite.nom} autoComplete="family-name"
                  onChange={(e) => setIdentite({ ...identite, nom: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entreprise">{t.profil.entreprise}</Label>
                <Input id="entreprise" value={identite.entreprise} autoComplete="organization"
                  onChange={(e) => setIdentite({ ...identite, entreprise: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">{t.profil.pays}</Label>
                <Input id="pays" value={identite.pays} autoComplete="country-name"
                  onChange={(e) => setIdentite({ ...identite, pays: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="telephone">{t.profil.telephone}</Label>
                <Input id="telephone" type="tel" value={identite.telephone} autoComplete="tel"
                  onChange={(e) => setIdentite({ ...identite, telephone: e.target.value })} />
                <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
                  <Phone className="size-3" /> {t.profil.telephoneAide}
                </p>
              </div>
            </div>

            {/* L'adresse email identifie le compte et sert à la connexion :
                la modifier depuis cet écran, sans revérification, ouvrirait
                une prise de contrôle silencieuse. */}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t.profil.email}</Label>
              <Input id="email" value={compte?.email ?? ''} disabled readOnly />
              <p className="text-xs text-[hsl(var(--muted))]">
                {t.profil.emailAide}
              </p>
            </div>

            <Button type="submit" chargement={enregistrerIdentite.isPending}>
              <Check /> {t.profil.enregistrer}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-[hsl(var(--primary))]" /> {t.profil.motDePasseTitre}
          </CardTitle>
          <CardDescription>
            {t.profil.motDePasseDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={soumettreMotDePasse}>
            <div className="space-y-1.5">
              <Label htmlFor="actuel">{t.profil.motDePasseActuel}</Label>
              <Input id="actuel" type="password" autoComplete="current-password"
                value={motsDePasse.actuel}
                onChange={(e) => setMotsDePasse({ ...motsDePasse, actuel: e.target.value })} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nouveau">{t.profil.nouveauMotDePasse}</Label>
                <Input id="nouveau" type="password" autoComplete="new-password" minLength={8}
                  value={motsDePasse.nouveau}
                  onChange={(e) => setMotsDePasse({ ...motsDePasse, nouveau: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmation">{t.profil.confirmation}</Label>
                <Input id="confirmation" type="password" autoComplete="new-password" minLength={8}
                  value={motsDePasse.confirmation}
                  onChange={(e) => setMotsDePasse({ ...motsDePasse, confirmation: e.target.value })} required />
              </div>
            </div>

            {force && (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-muted))]">
                  <motion.div
                    className={`h-full rounded-full ${force.teinte}`}
                    initial={false}
                    animate={{ width: `${force.part}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                  />
                </div>
                <p className="text-xs text-[hsl(var(--muted))]">
                  {t.profil.robustesseAvant} <strong>{force.libelle}</strong> {t.profil.robustesseApres}
                </p>
              </div>
            )}

            <ErreurChamp>{erreurMdp}</ErreurChamp>

            <Button type="submit" variant="outline" chargement={changerMotDePasse.isPending}>
              <KeyRound /> {t.profil.changerMotDePasse}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.profil.securiteTitre}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[hsl(var(--muted))]">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            {t.profil.securiteBcrypt}
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            {t.profil.securitePaiement}
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            {t.profil.securiteRoles}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
