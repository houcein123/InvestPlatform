import { useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

/** Fiche personnelle du compte connecté — client comme administrateur. */

const CHAMPS_PROFIL = [
  { cle: 'prenom', libelle: 'Prénom' },
  { cle: 'nom', libelle: 'Nom' },
  { cle: 'entreprise', libelle: 'Entreprise' },
  { cle: 'pays', libelle: 'Pays' },
  { cle: 'telephone', libelle: 'Téléphone', type: 'tel' },
];

export default function Profil() {
  const { compte, rafraichir } = useAuth();

  const [profil, setProfil] = useState(() =>
    Object.fromEntries(CHAMPS_PROFIL.map(({ cle }) => [cle, compte?.[cle] ?? '']))
  );
  const [motsDePasse, setMotsDePasse] = useState({
    mot_de_passe_actuel: '', nouveau_mot_de_passe: '', confirmation: '',
  });

  const [messageProfil, setMessageProfil] = useState(null);
  const [messageMdp, setMessageMdp] = useState(null);

  const enregistrerProfil = async (event) => {
    event.preventDefault();
    setMessageProfil(null);
    try {
      const { compte: maj } = await api.updateProfil(profil);
      rafraichir(maj);
      setMessageProfil({ type: 'success', texte: 'Profil mis à jour.' });
    } catch (err) {
      setMessageProfil({ type: 'error', texte: err.message });
    }
  };

  const changerMotDePasse = async (event) => {
    event.preventDefault();
    setMessageMdp(null);

    if (motsDePasse.nouveau_mot_de_passe !== motsDePasse.confirmation) {
      setMessageMdp({ type: 'error', texte: 'La confirmation ne correspond pas au nouveau mot de passe.' });
      return;
    }

    try {
      await api.changePassword({
        mot_de_passe_actuel: motsDePasse.mot_de_passe_actuel,
        nouveau_mot_de_passe: motsDePasse.nouveau_mot_de_passe,
      });
      setMotsDePasse({ mot_de_passe_actuel: '', nouveau_mot_de_passe: '', confirmation: '' });
      setMessageMdp({ type: 'success', texte: 'Mot de passe mis à jour.' });
    } catch (err) {
      setMessageMdp({ type: 'error', texte: err.message });
    }
  };

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <h1>Mon profil</h1>
        <p>Vos informations personnelles et vos identifiants de connexion.</p>
      </header>

      <form className="card" onSubmit={enregistrerProfil}>
        <h2 className="section-title">Informations</h2>

        <div className="field" style={{ marginBottom: 16 }}>
          <label>Adresse email</label>
          <input className="input" value={compte?.email ?? ''} disabled />
          <span className="muted">
            L'email identifie le compte et ne peut pas être modifié ici.
          </span>
        </div>

        <div className="grid grid--form">
          {CHAMPS_PROFIL.map(({ cle, libelle, type }) => (
            <div className="field" key={cle}>
              <label htmlFor={cle}>{libelle}</label>
              <input
                id={cle} className="input" type={type || 'text'}
                value={profil[cle] ?? ''}
                onChange={(e) => setProfil({ ...profil, [cle]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {messageProfil && (
          <p className={`alert alert--${messageProfil.type}`} style={{ marginTop: 16 }}>
            {messageProfil.texte}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--success">Enregistrer</button>
        </div>
      </form>

      <form className="card" onSubmit={changerMotDePasse}>
        <h2 className="section-title">Mot de passe</h2>

        <div className="stack">
          <div className="field">
            <label htmlFor="actuel">Mot de passe actuel</label>
            <input
              id="actuel" className="input" type="password" required autoComplete="current-password"
              value={motsDePasse.mot_de_passe_actuel}
              onChange={(e) => setMotsDePasse({ ...motsDePasse, mot_de_passe_actuel: e.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="nouveau">Nouveau mot de passe</label>
            <input
              id="nouveau" className="input" type="password" required minLength={8} autoComplete="new-password"
              value={motsDePasse.nouveau_mot_de_passe}
              onChange={(e) => setMotsDePasse({ ...motsDePasse, nouveau_mot_de_passe: e.target.value })}
            />
            <span className="muted">8 caractères minimum.</span>
          </div>
          <div className="field">
            <label htmlFor="confirmation">Confirmer le nouveau mot de passe</label>
            <input
              id="confirmation" className="input" type="password" required autoComplete="new-password"
              value={motsDePasse.confirmation}
              onChange={(e) => setMotsDePasse({ ...motsDePasse, confirmation: e.target.value })}
            />
          </div>
        </div>

        {messageMdp && (
          <p className={`alert alert--${messageMdp.type}`} style={{ marginTop: 16 }}>
            {messageMdp.texte}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn--primary">Changer le mot de passe</button>
        </div>
      </form>
    </div>
  );
}
