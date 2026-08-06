import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

/**
 * Gestion des comptes.
 * Le rôle se change ici, jamais depuis l'inscription publique : c'est ce qui
 * garantit qu'un visiteur ne peut pas se déclarer administrateur.
 */
export default function Comptes() {
  const { compte: moi } = useAuth();

  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(null);

  useEffect(() => {
    api.comptes()
      .then((data) => setComptes(data.comptes))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  const changerRole = async (id, role) => {
    setErreur('');
    setEnCours(id);
    try {
      const { compte } = await api.setRole(id, role);
      setComptes(comptes.map((c) => (c.id === id ? compte : c)));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnCours(null);
    }
  };

  if (chargement) return <div className="loading">Chargement des comptes…</div>;

  const admins = comptes.filter((c) => c.role === 'admin');
  const clients = comptes.filter((c) => c.role === 'client');

  return (
    <div className="page">
      <header className="page-header">
        <h1>Comptes</h1>
        <p>{admins.length} administrateur(s) · {clients.length} client(s).</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Entreprise</th>
                <th>Rôle</th>
                <th>Dernière connexion</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comptes.map((compte) => {
                const estMoi = compte.id === moi?.id;
                const estAdmin = compte.role === 'admin';

                return (
                  <tr key={compte.id}>
                    <td>
                      <strong>{compte.prenom} {compte.nom}</strong>
                      {estMoi && <span className="muted"> (vous)</span>}
                    </td>
                    <td className="muted">{compte.email}</td>
                    <td className="muted">{compte.entreprise || '—'}</td>
                    <td>
                      <span className={`badge ${estAdmin ? 'badge--info' : 'badge--on'}`}>
                        {estAdmin ? 'Administrateur' : 'Client'}
                      </span>
                    </td>
                    <td className="muted">
                      {compte.derniere_connexion
                        ? new Date(compte.derniere_connexion).toLocaleString('fr-FR')
                        : 'Jamais'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className={`btn btn--sm ${estAdmin ? 'btn--subtle' : 'btn--ghost'}`}
                        disabled={estMoi || enCours === compte.id}
                        title={estMoi ? 'Vous ne pouvez pas modifier votre propre rôle' : undefined}
                        onClick={() => changerRole(compte.id, estAdmin ? 'client' : 'admin')}
                      >
                        {estAdmin ? 'Rétrograder en client' : 'Promouvoir administrateur'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
