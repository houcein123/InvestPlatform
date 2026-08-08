import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fileUrl } from '../../api/client';

/**
 * Relecture et correction d'un rapport déjà produit.
 *
 * Le PDF est reconstruit à partir du texte corrigé, **sans nouvel appel au
 * modèle** : une régénération complète écraserait les corrections. Les données
 * chiffrées, elles, sont relues en base, donc le document repart des valeurs
 * à jour.
 */

const LIBELLES = {
  introduction: 'Présentation générale du secteur',
  tendances: 'Analyse des tendances',
  opportunites: 'Opportunités identifiées',
  risques: 'Analyse des risques',
  benchmarking: 'Benchmarking régional',
  recommandations: 'Recommandations investisseur',
  perspectives: 'Perspectives 2025-2028',
};

function compterMots(texte) {
  return (texte || '').trim().split(/\s+/).filter(Boolean).length;
}

export default function RapportEdition() {
  const { id } = useParams();

  const [rapport, setRapport] = useState(null);
  const [textes, setTextes] = useState({});
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState('');
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    api.rapport(id)
      .then((data) => {
        setRapport(data.rapport);
        setTextes(
          Object.fromEntries(data.rapport.sections.map((cle) => [cle, data.rapport.narratives[cle] ?? '']))
        );
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [id]);

  const enregistrer = async (event) => {
    event.preventDefault();
    setErreur('');
    setPdfUrl(null);
    setEnregistrement(true);

    try {
      const resultat = await api.updateRapport(id, textes);
      setPdfUrl(fileUrl(resultat.pdfUrl));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setEnregistrement(false);
    }
  };

  if (chargement) return <div className="loading">Chargement du rapport…</div>;
  if (!rapport) return <div className="page"><p className="alert alert--error">{erreur || 'Rapport introuvable'}</p></div>;

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/admin/rapports" className="muted">← Retour aux rapports</Link>
        <h1 style={{ marginTop: 8 }}>{rapport.secteur}</h1>
        <p>
          Rapport généré le{' '}
          {rapport.dateGeneration ? new Date(rapport.dateGeneration).toLocaleString('fr-FR') : '—'}.
          Les sections chiffrées sont reconstruites automatiquement à partir de la base.
        </p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {pdfUrl && (
        <p className="alert alert--success">
          PDF reconstruit.{' '}
          <a href={pdfUrl} target="_blank" rel="noreferrer">Ouvrir le nouveau document</a>
        </p>
      )}

      <form onSubmit={enregistrer}>
        {rapport.sections.map((cle) => (
          <div className="card" key={cle}>
            <div className="row-between">
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                {LIBELLES[cle] || cle}
              </h2>
              <span className="muted">{compterMots(textes[cle])} mots</span>
            </div>

            <textarea
              className="textarea textarea--rapport"
              value={textes[cle] ?? ''}
              placeholder="Section vide — elle apparaîtra comme indisponible dans le PDF."
              onChange={(e) => setTextes({ ...textes, [cle]: e.target.value })}
            />
          </div>
        ))}

        <div className="form-actions" style={{ marginTop: 22 }}>
          <button type="submit" className="btn btn--success" disabled={enregistrement}>
            {enregistrement ? 'Reconstruction du PDF…' : 'Enregistrer et reconstruire le PDF'}
          </button>
          <Link to="/admin/rapports" className="btn btn--subtle">Annuler</Link>
        </div>
      </form>
    </div>
  );
}
