import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { accueilSelonRole, useAuth } from '../auth/AuthContext';

/**
 * Écran d'accès unique.
 *
 * L'inscription ne crée que des comptes client : un administrateur ne se crée
 * pas depuis le site public, il existe déjà en base. La connexion est la même
 * pour tout le monde — c'est le rôle enregistré qui détermine où l'on arrive,
 * panneau de contrôle ou catalogue.
 */

const CHAMPS_VIDES = {
  email: '', mot_de_passe: '', nom: '', prenom: '', entreprise: '', pays: '', telephone: '',
};

export default function LoginPage() {
  const [inscription, setInscription] = useState(false);
  const [champs, setChamps] = useState(CHAMPS_VIDES);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const maj = (champ) => (event) => setChamps({ ...champs, [champ]: event.target.value });

  const soumettre = async (event) => {
    event.preventDefault();
    setErreur('');
    setEnvoi(true);

    try {
      const data = inscription
        ? await api.register(champs)
        : await api.login(champs.email, champs.mot_de_passe);

      login(data.token, data.compte);
      navigate(accueilSelonRole(data.compte), { replace: true });
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  const basculer = () => {
    setInscription(!inscription);
    setErreur('');
    setChamps(CHAMPS_VIDES);
  };

  return (
    <div className="login">
      <div className="login__card">
        <Link to="/" className="login__retour">← Retour au catalogue</Link>

        <h1 className="login__title">InvestPlatform</h1>
        <p className="login__subtitle">
          {inscription
            ? 'Créez votre compte pour acheter et retrouver vos rapports sectoriels.'
            : 'Connectez-vous pour accéder à votre espace.'}
        </p>

        <form className="login__form" onSubmit={soumettre}>
          {inscription && (
            <>
              <div className="grid grid--form">
                <div className="field">
                  <label htmlFor="prenom">Prénom</label>
                  <input id="prenom" className="input" required value={champs.prenom} onChange={maj('prenom')} />
                </div>
                <div className="field">
                  <label htmlFor="nom">Nom</label>
                  <input id="nom" className="input" required value={champs.nom} onChange={maj('nom')} />
                </div>
              </div>
              <div className="grid grid--form">
                <div className="field">
                  <label htmlFor="entreprise">Entreprise (facultatif)</label>
                  <input id="entreprise" className="input" value={champs.entreprise} onChange={maj('entreprise')} />
                </div>
                <div className="field">
                  <label htmlFor="pays">Pays (facultatif)</label>
                  <input id="pays" className="input" value={champs.pays} onChange={maj('pays')} />
                </div>
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="email">Adresse email</label>
            <input
              id="email" className="input" type="email" required autoComplete="username"
              value={champs.email} onChange={maj('email')}
            />
          </div>

          <div className="field">
            <label htmlFor="mot_de_passe">Mot de passe</label>
            <input
              id="mot_de_passe" className="input" type="password" required
              autoComplete={inscription ? 'new-password' : 'current-password'}
              minLength={inscription ? 8 : undefined}
              value={champs.mot_de_passe} onChange={maj('mot_de_passe')}
            />
            {inscription && <span className="muted">8 caractères minimum.</span>}
          </div>

          {erreur && <p className="alert alert--error">{erreur}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={envoi}>
            {envoi ? 'Veuillez patienter…' : inscription ? 'Créer mon compte' : 'Se connecter'}
          </button>
        </form>

        <button type="button" className="login__toggle" onClick={basculer}>
          {inscription
            ? 'Vous avez déjà un compte ? Se connecter'
            : 'Pas encore de compte ? Créer un compte client'}
        </button>
      </div>
    </div>
  );
}
