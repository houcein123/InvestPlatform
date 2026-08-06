import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ecrirePreferences, lirePreferences } from '../preferences';

/**
 * Paramètres.
 * Un client y règle ses préférences d'affichage ; un administrateur y trouve
 * en plus l'état réel des services dont dépend la plateforme (rédaction des
 * rapports, paiement), lu depuis la configuration du serveur.
 */

export default function Parametres() {
  const { compte, estAdmin } = useAuth();

  const [preferences, setPreferences] = useState(lirePreferences);
  const [systeme, setSysteme] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    if (!estAdmin) return;
    api.systeme().then(setSysteme).catch((err) => setErreur(err.message));
  }, [estAdmin]);

  const basculer = (cle) => {
    const suivantes = { ...preferences, [cle]: !preferences[cle] };
    setPreferences(suivantes);
    ecrirePreferences(suivantes);
  };

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <h1>Paramètres</h1>
        <p>Préférences d'utilisation{estAdmin ? ' et état des services de la plateforme.' : '.'}</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      <div className="card">
        <h2 className="section-title">Préférences</h2>
        <div className="stack">
          <label className="option">
            <input
              type="checkbox"
              checked={preferences.ouvrirPdfAutomatiquement}
              onChange={() => basculer('ouvrirPdfAutomatiquement')}
            />
            <span>
              <strong>Ouvrir le PDF automatiquement</strong>
              <span className="muted">Le rapport s'ouvre dans un nouvel onglet dès qu'il est prêt.</span>
            </span>
          </label>

        </div>
        <p className="muted" style={{ marginTop: 14 }}>
          Ces préférences sont enregistrées sur cet appareil.
        </p>
      </div>

      <div className="card">
        <h2 className="section-title">Compte</h2>
        <dl className="definitions">
          <div><dt>Email</dt><dd>{compte?.email}</dd></div>
          <div><dt>Rôle</dt><dd>{estAdmin ? 'Administrateur' : 'Client'}</dd></div>
          <div>
            <dt>Dernière connexion</dt>
            <dd>{compte?.derniere_connexion ? new Date(compte.derniere_connexion).toLocaleString('fr-FR') : '—'}</dd>
          </div>
          <div>
            <dt>Compte créé le</dt>
            <dd>{compte?.created_at ? new Date(compte.created_at).toLocaleDateString('fr-FR') : '—'}</dd>
          </div>
        </dl>
      </div>

      {estAdmin && systeme && (
        <div className="card">
          <h2 className="section-title">État des services</h2>

          <dl className="definitions">
            <div>
              <dt>Rédaction des rapports</dt>
              <dd>
                <span className={`badge ${systeme.redaction.configure ? 'badge--on' : 'badge--off'}`}>
                  {systeme.redaction.configure ? 'Configurée' : 'Non configurée'}
                </span>
                <span className="muted"> {systeme.redaction.modele}</span>
              </dd>
            </div>

            <div>
              <dt>Paiement</dt>
              <dd>
                <span className={`badge ${systeme.paiement.configure ? 'badge--on' : 'badge--off'}`}>
                  {systeme.paiement.configure ? 'PayPal configuré' : 'Non configuré'}
                </span>
                <span className={`badge ${systeme.paiement.argentReel ? 'badge--off' : 'badge--info'}`}>
                  {systeme.paiement.argentReel ? 'Production — argent réel' : 'Sandbox — aucun argent réel'}
                </span>
              </dd>
            </div>

            <div>
              <dt>Devise</dt>
              <dd>
                Affichage en {systeme.devise} · encaissement en {systeme.paiement.devisePaiement}
                <span className="muted"> (taux {systeme.paiement.tauxConversion})</span>
              </dd>
            </div>

            <div>
              <dt>Rapport</dt>
              <dd>{systeme.rapports.sections} sections · {systeme.rapports.pagesMin} pages minimum</dd>
            </div>
          </dl>

          <p className="muted" style={{ marginTop: 14 }}>
            Ces réglages proviennent du fichier <code>backend/.env</code> du serveur.
          </p>
        </div>
      )}
    </div>
  );
}
