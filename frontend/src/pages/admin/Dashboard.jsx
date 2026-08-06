import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../../api/client';

/** Panneau de contrôle — vue d'ensemble des ventes et des rapports (CDC §7). */
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    api.stats()
      .then(setStats)
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="loading">Chargement du tableau de bord…</div>;
  if (erreur) return <div className="page"><p className="alert alert--error">{erreur}</p></div>;

  const meilleur = [...stats.parSecteur].sort((a, b) => b.revenu - a.revenu)[0];
  const revenuMax = Math.max(...stats.parSecteur.map((s) => s.revenu), 1);

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p>Activité commerciale et rapports produits.</p>
      </header>

      <div className="grid grid--stats">
        <div className="stat">
          <div className="stat__value">{stats.totaux.nb_ventes}</div>
          <div className="stat__label">Rapports vendus</div>
        </div>
        <div className="stat">
          <div className="stat__value">
            {stats.totaux.revenu.toFixed(2)} <span className="stat__unite">{stats.devise}</span>
          </div>
          <div className="stat__label">Revenu total</div>
        </div>
        <div className="stat">
          <div className="stat__value">{stats.totaux.nb_rapports_generes}</div>
          <div className="stat__label">Rapports générés</div>
        </div>
        <div className="stat">
          <div className="stat__value stat__value--texte">
            {meilleur && meilleur.revenu > 0 ? meilleur.nom : '—'}
          </div>
          <div className="stat__label">Secteur le plus vendu</div>
        </div>
      </div>

      {/* ── Répartition par secteur ── */}
      <div className="card">
        <div className="row-between">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Ventes par secteur</h2>
          <Link to="/admin/secteurs" className="btn btn--ghost btn--sm">Gérer les secteurs</Link>
        </div>

        <div className="repartition">
          {stats.parSecteur.map((secteur) => (
            <div className="repartition__ligne" key={secteur.id}>
              <span className="repartition__nom">{secteur.nom}</span>
              <div className="repartition__barre">
                <div
                  className="repartition__remplissage"
                  style={{ width: `${Math.max((secteur.revenu / revenuMax) * 100, secteur.revenu > 0 ? 4 : 0)}%` }}
                />
              </div>
              <span className="repartition__valeur">
                {secteur.nb_ventes} vente{secteur.nb_ventes > 1 ? 's' : ''}
                <span className="muted"> · {secteur.revenu.toFixed(2)} {stats.devise}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Derniers rapports ── */}
      <div className="card">
        <h2 className="section-title">Derniers rapports générés</h2>
        {stats.rapportsRecents.length === 0 ? (
          <p className="empty">Aucun rapport généré pour le moment.</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Secteur</th>
                  <th>Client</th>
                  <th>Généré le</th>
                  <th>Statut</th>
                  <th>Fichier</th>
                </tr>
              </thead>
              <tbody>
                {stats.rapportsRecents.map((rapport) => (
                  <tr key={rapport.id}>
                    <td><strong>{rapport.secteur}</strong></td>
                    <td className="muted">{rapport.client || 'Achat sans compte'}</td>
                    <td>
                      {rapport.date_generation
                        ? new Date(rapport.date_generation).toLocaleString('fr-FR')
                        : '—'}
                    </td>
                    <td><span className="badge badge--info">{rapport.statut}</span></td>
                    <td>
                      {rapport.chemin_fichier ? (
                        <a href={fileUrl(rapport.chemin_fichier)} target="_blank" rel="noreferrer">
                          Ouvrir le PDF
                        </a>
                      ) : '—'}
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
