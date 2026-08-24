import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { ErreurChamp, Input, Label } from '@/components/ui/input';

type Mode = 'connexion' | 'inscription';

/**
 * Un seul ecran de connexion pour tout le monde.
 *
 * L'inscription publique ne cree que des comptes client : c'est le role
 * enregistre en base qui decide de la destination apres connexion, jamais un
 * choix fait dans ce formulaire.
 */
export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('connexion');
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(false);
  const { connecter, inscrire } = useAuth();
  const navigate = useNavigate();
  const emplacement = useLocation();

  // Destination posee par le garde de route : on y retourne apres connexion,
  // plutot que de renvoyer au catalogue quelqu'un qui allait commander.
  const retour = (emplacement.state as { retour?: string } | null)?.retour ?? null;

  async function soumettre(evenement: React.FormEvent<HTMLFormElement>) {
    evenement.preventDefault();
    setErreur('');
    setEnCours(true);

    const donnees = Object.fromEntries(new FormData(evenement.currentTarget)) as Record<string, string>;

    try {
      const compte = mode === 'connexion'
        ? await connecter(donnees.email, donnees.mot_de_passe)
        : await inscrire(donnees);

      toast.success(`Bienvenue, ${compte.prenom ?? compte.email}`);

      // Priorite a la destination interrompue. A defaut, un administrateur
      // atterrit sur son pilotage, un client sur le catalogue.
      const destination = retour ?? (compte.role === 'admin' ? '/admin' : '/');
      navigate(destination, { replace: true });
    } catch (probleme) {
      setErreur(probleme instanceof Error ? probleme.message : 'Connexion impossible.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card p-8"
      >
        <span className="mb-6 grid size-11 place-items-center rounded-xl bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-[hsl(var(--primary-foreground))]">
          <TrendingUp className="size-5" />
        </span>

        <h1 className="font-display text-2xl font-bold">
          {mode === 'connexion' ? 'Connexion' : 'Créer un compte'}
        </h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted))]">
          {mode === 'connexion'
            ? 'Accédez à vos rapports et a votre espace.'
            : 'Retrouvez vos commandes et vos rapports au même endroit.'}
        </p>

        <form onSubmit={soumettre} className="mt-6 space-y-4">
          {mode === 'inscription' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="prenom">Prénom</Label>
                <Input id="prenom" name="prenom" autoComplete="given-name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nom">Nom</Label>
                <Input id="nom" name="nom" autoComplete="family-name" required />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mot_de_passe">Mot de passe</Label>
            <Input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              autoComplete={mode === 'connexion' ? 'current-password' : 'new-password'}
              minLength={8}
              required
            />
            {mode === 'inscription' && (
              <p className="text-xs text-[hsl(var(--muted))]">8 caractères minimum.</p>
            )}
          </div>

          {mode === 'inscription' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="entreprise">Entreprise (facultatif)</Label>
                <Input id="entreprise" name="entreprise" autoComplete="organization" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pays">Pays (facultatif)</Label>
                <Input id="pays" name="pays" autoComplete="country-name" />
              </div>
            </div>
          )}

          <ErreurChamp>{erreur}</ErreurChamp>

          <Button type="submit" size="lg" className="w-full" chargement={enCours}>
            {mode === 'connexion' ? 'Se connecter' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-[hsl(var(--muted))]">
          {mode === 'connexion' ? "Pas encore de compte ?" : 'Déjà inscrit ?'}{' '}
          <button
            type="button"
            className="font-semibold text-[hsl(var(--primary))] underline-offset-4 hover:underline"
            onClick={() => { setMode(mode === 'connexion' ? 'inscription' : 'connexion'); setErreur(''); }}
          >
            {mode === 'connexion' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
