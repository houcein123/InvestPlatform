import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../../api/client';

/** Liste des rapports produits, point d'entrée vers leur édition. */
export default function Rapports() {
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.rapports()
      .then((data) => setRapports(data.rapports))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="loading">Chargement des rapports…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Rapports produits</h1>
        <p>Relire et corriger le texte d'un rapport, puis reconstruire son PDF.</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      <div className="card">
        {rapports.length === 0 ? (
          <p className="empty">Aucun rapport généré pour le moment.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Secteur</th>
                  <th>Généré le</th>
                  <th>Fichier</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rapports.map((rapport) => (
                  <tr key={rapport.id}>
                    <td><strong>{rapport.secteur}</strong></td>
                    <td className="muted">
                      {rapport.date_generation
                        ? new Date(rapport.date_generation).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td>
                      {rapport.chemin_fichier ? (
                        <a href={fileUrl(rapport.chemin_fichier)} target="_blank" rel="noreferrer">
                          Ouvrir le PDF
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <Link className="btn btn--primary btn--sm" to={`/admin/rapports/${rapport.id}`}>
                        Modifier le contenu
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
