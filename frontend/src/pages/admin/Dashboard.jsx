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

  // Valeurs de repli : un backend d'une version antérieure ne renvoie pas
  // encore les totaux consolidés, et un champ absent faisait planter tout
  // l'écran sur un `.toFixed()` — page blanche, sans message.
  const totaux = {
    nb_ventes: 0, revenu: 0,
    nb_ventes_simulees: 0, revenu_simule: 0,
    nb_ventes_total: 0, revenu_total: 0,
    nb_rapports_generes: 0,
    ...stats.totaux,
  };
  const parSecteur = stats.parSecteur.map((s) => ({
    ...s,
    nb_ventes_total: s.nb_ventes_total ?? (s.nb_ventes || 0) + (s.nb_ventes_simulees || 0),
    revenu_total: s.revenu_total ?? (s.revenu || 0) + (s.revenu_simule || 0),
  }));

  // Le classement et les barres se basent sur le TOTAL des ventes : en mode
  // démonstration, se limiter au chiffre d'affaires réel laissait la page
  // entièrement à zéro et sans intérêt.
  const meilleur = [...parSecteur].sort((a, b) => b.revenu_total - a.revenu_total)[0];
  const revenuMax = Math.max(...parSecteur.map((s) => s.revenu_total), 1);
  const toutSimule = totaux.nb_ventes === 0 && totaux.nb_ventes_simulees > 0;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p>Activité commerciale et rapports produits.</p>
      </header>

      <div className="grid grid--stats">
        <div className="stat">
          <div className="stat__value">{totaux.nb_ventes_total}</div>
          <div className="stat__label">
            Rapports vendus
            {totaux.nb_ventes_simulees > 0 && (
              <> · <span className="estimation">{totaux.nb_ventes_simulees} en démo</span></>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="stat__value">
            {totaux.revenu_total.toFixed(2)} <span className="stat__unite">{stats.devise}</span>
          </div>
          <div className="stat__label">
            {toutSimule ? 'Montant des commandes (démonstration)' : 'Revenu total'}
            {!toutSimule && totaux.revenu_simule > 0 && (
              <> · <span className="estimation">dont {totaux.revenu_simule.toFixed(2)} en démo</span></>
            )}
          </div>
        </div>
        <div className="stat">
          <div className="stat__value">{totaux.nb_rapports_generes}</div>
          <div className="stat__label">Rapports générés</div>
        </div>
        <div className="stat">
          <div className="stat__value stat__value--texte">
            {meilleur && meilleur.revenu_total > 0 ? meilleur.nom : '—'}
          </div>
          <div className="stat__label">Secteur le plus vendu</div>
        </div>
      </div>

      {/* Les montants affichés incluent les commandes de démonstration : le
          rappel ci-dessous évite de les confondre avec un encaissement réel. */}
      {totaux.nb_ventes_simulees > 0 && (
        <p className="alert alert--info" style={{ marginTop: 20 }}>
          {toutSimule
            ? `Les ${totaux.nb_ventes_simulees} commandes ci-dessus ont été passées en mode démonstration : les montants correspondent aux tarifs du catalogue, mais aucune somme n'a réellement été débitée.`
            : `${totaux.nb_ventes_simulees} des ${totaux.nb_ventes_total} commandes sont en mode démonstration (${totaux.revenu_simule.toFixed(2)} ${stats.devise}) : le chiffre d'affaires réellement encaissé est de ${totaux.revenu.toFixed(2)} ${stats.devise}.`}
        </p>
      )}

      {/* ── Répartition par secteur ── */}
      <div className="card">
        <div className="row-between">
          <h2 className="section-title" style={{ marginBottom: 0 }}>Ventes par secteur</h2>
          <Link to="/admin/secteurs" className="btn btn--ghost btn--sm">Gérer les secteurs</Link>
        </div>

        <div className="repartition">
          {parSecteur.map((secteur) => (
            <div className="repartition__ligne" key={secteur.id}>
              <span className="repartition__nom">{secteur.nom}</span>
              <div className="repartition__barre">
                <div
                  className="repartition__remplissage"
                  style={{
                    width: `${Math.max((secteur.revenu_total / revenuMax) * 100, secteur.revenu_total > 0 ? 4 : 0)}%`,
                  }}
                />
              </div>
              <span className="repartition__valeur">
                {secteur.nb_ventes_total} vente{secteur.nb_ventes_total > 1 ? 's' : ''}
                <span className="muted"> · {secteur.revenu_total.toFixed(2)} {stats.devise}</span>
                {secteur.nb_ventes_simulees > 0 && secteur.nb_ventes === 0 && (
                  <span className="badge badge--info" style={{ marginLeft: 8 }}>démo</span>
                )}
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
                  <th>Compte payeur</th>
                  <th>Généré le</th>
                  <th>Fichier</th>
                </tr>
              </thead>
              <tbody>
                {stats.rapportsRecents.map((rapport) => (
                  <tr key={rapport.id}>
                    <td><strong>{rapport.secteur}</strong></td>
                    <td className="muted">{rapport.client || 'Achat sans compte'}</td>
                    <td className="muted">
                      {rapport.email_payeur || '—'}
                      {rapport.methode === 'simulation' && (
                        <span className="badge badge--info" style={{ marginLeft: 6 }}>démo</span>
                      )}
                    </td>
                    <td>
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
