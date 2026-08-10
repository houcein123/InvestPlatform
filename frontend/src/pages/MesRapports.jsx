import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../api/client';
import ProgressBar from '../components/ProgressBar';

/**
 * Espace client (CDC §6, étape 4).
 *
 * La liste part des ACHATS et non des rapports : un achat payé dont la
 * génération a échoué reste visible, avec un bouton pour la relancer sans
 * repayer. Sans cela, un client ayant réglé pendant une panne du service de
 * rédaction ne voyait plus rien du tout.
 */

const POLL_INTERVAL_MS = 1200;

export default function MesRapports() {
  const [achats, setAchats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [relance, setRelance] = useState(null); // { achatId, valeur, libelle }

  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => { monte.current = false; };
  }, []);

  const charger = () => api.mesRapports().then((data) => setAchats(data.achats));

  useEffect(() => {
    charger()
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  const relancer = async (achatId) => {
    setErreur('');
    setRelance({ achatId, valeur: 0, libelle: 'Préparation des données sectorielles' });

    try {
      const { jobId } = await api.relancerRapport(achatId);

      while (monte.current) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (!monte.current) return;

        const { job } = await api.reportStatus(jobId);
        setRelance({ achatId, valeur: job.progression, libelle: job.etape });

        if (job.statut === 'termine') {
          setRelance(null);
          await charger();
          return;
        }
        if (job.statut === 'erreur') throw new Error(job.erreur || 'Génération interrompue');
      }
    } catch (err) {
      if (!monte.current) return;
      setRelance(null);
      setErreur(err.message);
    }
  };

  if (chargement) return <div className="loading">Chargement de vos rapports…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Mes rapports</h1>
        <p>Les rapports que vous avez achetés restent téléchargeables depuis cet espace.</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {achats.length === 0 ? (
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
                  <th>Acheté le</th>
                  <th className="table__num">Montant</th>
                  <th>Rapport</th>
                </tr>
              </thead>
              <tbody>
                {achats.map((achat) => {
                  const enCours = relance?.achatId === achat.achat_id;

                  return (
                    <tr key={achat.achat_id}>
                      <td><strong>{achat.secteur}</strong></td>
                      <td className="muted">
                        {new Date(achat.date_achat).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="table__num">
                        {Number(achat.montant).toFixed(2)} TND
                      </td>
                      <td>
                        {achat.chemin_fichier ? (
                          <a
                            className="btn btn--ghost btn--sm"
                            href={fileUrl(achat.chemin_fichier)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Télécharger
                          </a>
                        ) : enCours ? (
                          <div style={{ minWidth: 220 }}>
                            <ProgressBar progression={relance.valeur} etape={relance.libelle} />
                          </div>
                        ) : (
                          <div>
                            <span className="badge badge--off">Non généré</span>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              style={{ marginLeft: 8 }}
                              disabled={!!relance}
                              onClick={() => relancer(achat.achat_id)}
                            >
                              Relancer la génération
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="muted" style={{ marginTop: 14 }}>
            Un rapport non généré peut être relancé sans nouveau paiement.
          </p>
        </div>
      )}
    </div>
  );
}
