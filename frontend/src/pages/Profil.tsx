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
function evaluerMotDePasse(valeur: string) {
  if (!valeur) return null;

  const criteres = [
    valeur.length >= 12,
    /[a-z]/.test(valeur) && /[A-Z]/.test(valeur),
    /[0-9]/.test(valeur),
    /[^A-Za-z0-9]/.test(valeur),
  ];
  const score = criteres.filter(Boolean).length + (valeur.length >= 8 ? 1 : 0);

  if (score <= 2) return { libelle: 'Faible', part: 33, teinte: 'bg-[hsl(var(--danger))]' };
  if (score <= 3) return { libelle: 'Correct', part: 66, teinte: 'bg-[hsl(var(--warning))]' };
  return { libelle: 'Solide', part: 100, teinte: 'bg-[hsl(var(--success))]' };
}

export default function Profil() {
  const { compte, rafraichir } = useAuth();

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
      toast.success('Profil mis à jour');
    },
    onError: (erreur: Error) => toast.error('Enregistrement impossible', { description: erreur.message }),
  });

  const changerMotDePasse = useMutation({
    mutationFn: () => api.changePassword({
      mot_de_passe_actuel: motsDePasse.actuel,
      nouveau_mot_de_passe: motsDePasse.nouveau,
    }),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour');
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
      setErreurMdp('Les deux saisies ne correspondent pas.');
      return;
    }
    if (motsDePasse.nouveau.length < 8) {
      setErreurMdp('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setErreurMdp('');
    changerMotDePasse.mutate();
  }

  const force = evaluerMotDePasse(motsDePasse.nouveau);
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
            {estAdmin ? 'Administrateur' : 'Client'}
          </Badge>
          {compte?.est_verifie && <Badge variant="succes"><BadgeCheck /> Vérifié</Badge>}
        </div>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard index={0} libelle="Rapports commandés" valeur={formatNombre(lignes.length)}
          Icone={FileText} detail={`${formatNombre(rapportsLivres)} livré(s)`} />
        <StatCard index={1} libelle="Total réglé" valeur={formatMontant(totalDepense)}
          Icone={Wallet} teinte="succes" />
        <StatCard index={2} libelle="Dernière connexion"
          valeur={compte?.derniere_connexion ? formatDate(compte.derniere_connexion) : '—'}
          Icone={CalendarClock} teinte="neutre"
          detail={compte?.created_at ? `Membre depuis le ${formatDate(compte.created_at)}` : undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
          <CardDescription>
            Ces informations figurent sur vos commandes et vos rapports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(evenement) => { evenement.preventDefault(); enregistrerIdentite.mutate(); }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" value={identite.prenom} autoComplete="given-name"
                  onChange={(e) => setIdentite({ ...identite, prenom: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" value={identite.nom} autoComplete="family-name"
                  onChange={(e) => setIdentite({ ...identite, nom: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input id="entreprise" value={identite.entreprise} autoComplete="organization"
                  onChange={(e) => setIdentite({ ...identite, entreprise: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">Pays</Label>
                <Input id="pays" value={identite.pays} autoComplete="country-name"
                  onChange={(e) => setIdentite({ ...identite, pays: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="telephone">Téléphone</Label>
                <Input id="telephone" type="tel" value={identite.telephone} autoComplete="tel"
                  onChange={(e) => setIdentite({ ...identite, telephone: e.target.value })} />
                <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted))]">
                  <Phone className="size-3" /> Utilisé uniquement pour vous joindre au sujet d&apos;une commande.
                </p>
              </div>
            </div>

            {/* L'adresse email identifie le compte et sert à la connexion :
                la modifier depuis cet écran, sans revérification, ouvrirait
                une prise de contrôle silencieuse. */}
            <div className="space-y-1.5">
              <Label htmlFor="email">Adresse email</Label>
              <Input id="email" value={compte?.email ?? ''} disabled readOnly />
              <p className="text-xs text-[hsl(var(--muted))]">
                L&apos;adresse identifie votre compte et ne peut pas être modifiée ici.
                Contactez le support pour en changer.
              </p>
            </div>

            <Button type="submit" chargement={enregistrerIdentite.isPending}>
              <Check /> Enregistrer les modifications
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-[hsl(var(--primary))]" /> Mot de passe
          </CardTitle>
          <CardDescription>
            Le mot de passe actuel est exigé : sans lui, une session laissée ouverte
            suffirait à verrouiller le compte de son titulaire.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={soumettreMotDePasse}>
            <div className="space-y-1.5">
              <Label htmlFor="actuel">Mot de passe actuel</Label>
              <Input id="actuel" type="password" autoComplete="current-password"
                value={motsDePasse.actuel}
                onChange={(e) => setMotsDePasse({ ...motsDePasse, actuel: e.target.value })} required />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nouveau">Nouveau mot de passe</Label>
                <Input id="nouveau" type="password" autoComplete="new-password" minLength={8}
                  value={motsDePasse.nouveau}
                  onChange={(e) => setMotsDePasse({ ...motsDePasse, nouveau: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmation">Confirmation</Label>
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
                  Robustesse : <strong>{force.libelle}</strong> — 8 caractères minimum ;
                  au-delà de 12, avec chiffres et symboles, la résistance augmente nettement.
                </p>
              </div>
            )}

            <ErreurChamp>{erreurMdp}</ErreurChamp>

            <Button type="submit" variant="outline" chargement={changerMotDePasse.isPending}>
              <KeyRound /> Changer le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-[hsl(var(--muted))]">
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            Votre mot de passe est conservé sous forme d&apos;empreinte bcrypt.
            Personne, y compris l&apos;équipe Tunisia Invest, ne peut le lire.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            Aucun identifiant de paiement n&apos;est stocké : les règlements se font
            sur le domaine de PayPal, qui ne nous transmet que l&apos;adresse du compte payeur.
          </p>
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[hsl(var(--success))]" />
            Vos droits sont relus en base à chaque requête : une modification de rôle
            prend effet immédiatement, sans attendre l&apos;expiration de votre session.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
