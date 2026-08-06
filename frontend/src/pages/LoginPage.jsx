import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const [inscription, setInscription] = useState(false);
  const [champs, setChamps] = useState({ email: '', mot_de_passe: '', nom: '', prenom: '' });
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const maj = (champ) => (event) => setChamps({ ...champs, [champ]: event.target.value });

  const soumettre = async (event) => {
    event.preventDefault();
    setErreur('');
    setSucces('');
    setEnvoi(true);

    try {
      if (inscription) {
        await api.register({ ...champs, role: 'admin' });
        setInscription(false);
        setSucces('Compte créé. Vous pouvez vous connecter.');
      } else {
        const data = await api.login(champs.email, champs.mot_de_passe);
        login(data.token, data.admin);
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">🔐 InvestPlatform</h1>
        <h2 className="login__subtitle">
          {inscription ? 'Créer un compte administrateur' : 'Connexion administrateur'}
        </h2>

        <form className="login__form" onSubmit={soumettre}>
          {inscription && (
            <>
              <input
                className="input" placeholder="Prénom" required
                value={champs.prenom} onChange={maj('prenom')}
              />
              <input
                className="input" placeholder="Nom" required
                value={champs.nom} onChange={maj('nom')}
              />
            </>
          )}

          <input
            className="input" type="email" placeholder="Email" required autoComplete="username"
            value={champs.email} onChange={maj('email')}
          />
          <input
            className="input" type="password" placeholder="Mot de passe" required
            autoComplete={inscription ? 'new-password' : 'current-password'}
            value={champs.mot_de_passe} onChange={maj('mot_de_passe')}
          />

          {erreur && <p className="alert alert--error">{erreur}</p>}
          {succes && <p className="alert alert--success">{succes}</p>}

          <button type="submit" className="btn btn--primary btn--block" disabled={envoi}>
            {envoi ? 'Veuillez patienter…' : inscription ? 'Créer le compte' : 'Se connecter'}
          </button>
        </form>

        <button
          type="button"
          className="login__toggle"
          onClick={() => { setInscription(!inscription); setErreur(''); setSucces(''); }}
        >
          {inscription ? 'Déjà un compte ? Se connecter' : 'Première connexion ? Créer un compte'}
        </button>
      </div>
    </div>
  );
}
