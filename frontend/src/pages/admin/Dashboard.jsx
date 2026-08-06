import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../../api/client';

/**
 * Panneau admin — vue d'ensemble (CDC §7) :
 * statistiques de vente, édition rapide des secteurs, derniers rapports générés.
 */
export default function Dashboard() {
  const [secteurs, setSecteurs] = useState([]);
  const [stats, setStats] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [editionId, setEditionId] = useState(null);
  const [brouillon, setBrouillon] = useState({});

  useEffect(() => {
    Promise.all([api.adminSecteurs(), api.stats()])
      .then(([listeSecteurs, statistiques]) => {
        setSecteurs(listeSecteurs.secteurs);
        setStats(statistiques);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  const demarrerEdition = (secteur) => {
    setEditionId(secteur.id);
    setBrouillon({
      nom: secteur.nom,
      description: secteur.description ?? '',
      prix_rapport: secteur.prix_rapport,
      est_actif: secteur.est_actif,
    });
  };

  const enregistrer = async (id) => {
    try {
      const { secteur } = await api.updateSecteur(id, brouillon);
      setSecteurs(secteurs.map((s) => (s.id === id ? secteur : s)));
      setEditionId(null);
    } catch (err) {
      setErreur(err.message);
    }
  };

  if (chargement) return <div className="loading">Chargement du panneau admin…</div>;

  const revenuParSecteur = new Map((stats?.parSecteur || []).map((s) => [s.id, s]));

  return (
    <div className="page">
      <header className="page-header">
        <h1>Panneau administrateur</h1>
        <p>Données sectorielles, ventes et rapports générés.</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {/* ── Indicateurs de vente (CDC §7) ── */}
      <div className="grid grid--stats">
        <div className="stat">
          <div className="stat__value">{stats?.totaux.nb_ventes ?? 0}</div>
          <div className="stat__label">Rapports vendus</div>
        </div>
        <div className="stat">
          <div className="stat__value">
            {(stats?.totaux.revenu ?? 0).toFixed(2)} <span style={{ fontSize: 16 }}>{stats?.devise}</span>
          </div>
          <div className="stat__label">Revenu total</div>
        </div>
        <div className="stat">
          <div className="stat__value">{stats?.totaux.nb_rapports_generes ?? 0}</div>
          <div className="stat__label">Rapports générés</div>
        </div>
        <div className="stat">
          <div className="stat__value">{secteurs.filter((s) => s.est_actif).length}/{secteurs.length}</div>
          <div className="stat__label">Secteurs en ligne</div>
        </div>
      </div>

      {/* ── Secteurs ── */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">Secteurs</h2>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th className="table__num">Prix</th>
                <th className="table__num">Ventes</th>
                <th className="table__num">Revenu</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secteurs.map((secteur) => {
                const vente = revenuParSecteur.get(secteur.id);
                const enEdition = editionId === secteur.id;

                return (
                  <tr key={secteur.id}>
                    <td>
                      {enEdition ? (
                        <input
                          className="input" value={brouillon.nom}
                          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
                        />
                      ) : secteur.nom}
                    </td>
                    <td className="table__truncate">
                      {enEdition ? (
                        <input
                          className="input" value={brouillon.description}
                          onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
                        />
                      ) : secteur.description}
                    </td>
                    <td className="table__num">
                      {enEdition ? (
                        <input
                          className="input" type="number" step="0.01" style={{ width: 90 }}
                          value={brouillon.prix_rapport}
                          onChange={(e) => setBrouillon({ ...brouillon, prix_rapport: e.target.value })}
                        />
                      ) : `${secteur.prix_rapport} TND`}
                    </td>
                    <td className="table__num">{vente?.nb_ventes ?? 0}</td>
                    <td className="table__num">{(vente?.revenu ?? 0).toFixed(2)}</td>
                    <td>
                      {enEdition ? (
                        <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input
                            type="checkbox" checked={brouillon.est_actif}
                            onChange={(e) => setBrouillon({ ...brouillon, est_actif: e.target.checked })}
                          />
                          En ligne
                        </label>
                      ) : (
                        <span className={`badge ${secteur.est_actif ? 'badge--on' : 'badge--off'}`}>
                          {secteur.est_actif ? 'Actif' : 'Inactif'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="inline-actions">
                        {enEdition ? (
                          <>
                            <button type="button" className="btn btn--success btn--sm" onClick={() => enregistrer(secteur.id)}>
                              Enregistrer
                            </button>
                            <button type="button" className="btn btn--subtle btn--sm" onClick={() => setEditionId(null)}>
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => demarrerEdition(secteur)}>
                              Modifier
                            </button>
                            <Link className="btn btn--primary btn--sm" to={`/admin/secteurs/${secteur.id}`}>
                              Données
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Derniers rapports ── */}
      <div className="card">
        <h2 className="section-title">Derniers rapports générés</h2>
        {stats?.rapportsRecents?.length ? (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Secteur</th>
                  <th>Généré le</th>
                  <th>Statut</th>
                  <th>Fichier</th>
                </tr>
              </thead>
              <tbody>
                {stats.rapportsRecents.map((rapport) => (
                  <tr key={rapport.id}>
                    <td>{rapport.secteur}</td>
                    <td>{rapport.date_generation ? new Date(rapport.date_generation).toLocaleString('fr-FR') : '—'}</td>
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
        ) : (
          <p className="empty">Aucun rapport généré pour le moment.</p>
        )}
      </div>
    </div>
  );
}
