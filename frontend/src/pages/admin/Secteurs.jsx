import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

/** Gestion des secteurs du catalogue : tarif, description, mise en ligne. */
export default function Secteurs() {
  const [secteurs, setSecteurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [editionId, setEditionId] = useState(null);
  const [brouillon, setBrouillon] = useState({});

  useEffect(() => {
    api.adminSecteurs()
      .then((data) => setSecteurs(data.secteurs))
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
    setErreur('');
    try {
      const { secteur } = await api.updateSecteur(id, brouillon);
      setSecteurs(secteurs.map((s) => (s.id === id ? secteur : s)));
      setEditionId(null);
    } catch (err) {
      setErreur(err.message);
    }
  };

  if (chargement) return <div className="loading">Chargement des secteurs…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Secteurs</h1>
        <p>Tarification et publication des six rapports du catalogue.</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      <div className="card">
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th className="table__num">Prix (TND)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {secteurs.map((secteur) => {
                const enEdition = editionId === secteur.id;

                return (
                  <tr key={secteur.id}>
                    <td>
                      {enEdition ? (
                        <input
                          className="input" value={brouillon.nom}
                          onChange={(e) => setBrouillon({ ...brouillon, nom: e.target.value })}
                        />
                      ) : <strong>{secteur.nom}</strong>}
                    </td>
                    <td className="table__truncate">
                      {enEdition ? (
                        <input
                          className="input" value={brouillon.description}
                          onChange={(e) => setBrouillon({ ...brouillon, description: e.target.value })}
                        />
                      ) : <span className="muted">{secteur.description}</span>}
                    </td>
                    <td className="table__num">
                      {enEdition ? (
                        <input
                          className="input" type="number" step="0.01" style={{ width: 100 }}
                          value={brouillon.prix_rapport}
                          onChange={(e) => setBrouillon({ ...brouillon, prix_rapport: e.target.value })}
                        />
                      ) : Number(secteur.prix_rapport).toFixed(2)}
                    </td>
                    <td>
                      {enEdition ? (
                        <label className="option option--inline">
                          <input
                            type="checkbox" checked={brouillon.est_actif}
                            onChange={(e) => setBrouillon({ ...brouillon, est_actif: e.target.checked })}
                          />
                          <span>En ligne</span>
                        </label>
                      ) : (
                        <span className={`badge ${secteur.est_actif ? 'badge--on' : 'badge--off'}`}>
                          {secteur.est_actif ? 'En ligne' : 'Masqué'}
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
    </div>
  );
}
