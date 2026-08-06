import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../api/client';

/** Espace client : les rapports achetés restent accessibles (CDC §6, étape 4). */
export default function MesRapports() {
  const [rapports, setRapports] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.mesRapports()
      .then((data) => setRapports(data.rapports))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="loading">Chargement de vos rapports…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mes rapports</h1>
        <p>Les rapports que vous avez achetés restent téléchargeables depuis cet espace.</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {rapports.length === 0 ? (
        <div className="card">
          <p className="empty">Vous n'avez pas encore de rapport.</p>
          <div style={{ textAlign: 'center' }}>
            <Link to="/" className="btn btn--primary">Parcourir le catalogue</Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Secteur</th>
                  <th>Généré le</th>
                  <th className="table__num">Montant</th>
                  <th>Fichier</th>
                </tr>
              </thead>
              <tbody>
                {rapports.map((rapport) => (
                  <tr key={rapport.id}>
                    <td><strong>{rapport.secteur}</strong></td>
                    <td>
                      {rapport.date_generation
                        ? new Date(rapport.date_generation).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td className="table__num">
                      {rapport.montant ? `${Number(rapport.montant).toFixed(2)} TND` : '—'}
                    </td>
                    <td>
                      {rapport.chemin_fichier ? (
                        <a
                          className="btn btn--ghost btn--sm"
                          href={fileUrl(rapport.chemin_fichier)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Télécharger
                        </a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
