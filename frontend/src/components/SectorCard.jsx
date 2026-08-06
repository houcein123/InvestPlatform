import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fileUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { lirePreferences } from '../preferences';
import PayPalButton from './PayPalButton';
import ProgressBar from './ProgressBar';

/** Illustration de repli quand aucune image n'est fournie pour le secteur. */
const ICONES = {
  tourisme: '🏖️',
  agriculture: '🌾',
  technologies: '💻',
  energies: '⚡',
  textile: '🧵',
  logistique: '🚢',
};

const POLL_INTERVAL_MS = 1200;

function formatDate(valeur) {
  if (!valeur) return '—';
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SectorCard({ sector, paypalConfig }) {
  const { estConnecte } = useAuth();
  const preferences = lirePreferences();

  const [etape, setEtape] = useState('repos'); // repos | paiement | generation | termine | erreur
  const [message, setMessage] = useState('');
  const [progression, setProgression] = useState({ valeur: 0, libelle: '' });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [imageOk, setImageOk] = useState(true);

  // Le polling doit s'arrêter si l'utilisateur quitte la page en cours de
  // génération, sinon React avertit d'une mise à jour sur composant démonté.
  const monte = useRef(true);
  useEffect(() => () => { monte.current = false; }, []);

  const ouvrirApercu = () => window.open(api.previewUrl(sector.id), '_blank', 'noopener');

  const equivalentPaiement = paypalConfig?.tauxConversion
    ? (Number(sector.prix_rapport) * paypalConfig.tauxConversion).toFixed(2)
    : null;

  /** Interroge le backend jusqu'à ce que le job soit terminé ou en erreur. */
  const suivreJob = async (jobId) => {
    while (monte.current) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (!monte.current) return null;

      const { job } = await api.reportStatus(jobId);
      setProgression({ valeur: job.progression, libelle: job.etape });

      if (job.statut === 'termine') return job;
      if (job.statut === 'erreur') throw new Error(job.erreur || 'Génération interrompue');
    }
    return null;
  };

  const lancerGeneration = async ({ achatId }) => {
    setEtape('generation');
    setMessage('');
    setProgression({ valeur: 0, libelle: 'Préparation des données sectorielles' });

    try {
      const { jobId } = await api.generateReport(sector.id, achatId);
      const job = await suivreJob(jobId);
      if (!job) return;

      setEtape('termine');
      setPdfUrl(fileUrl(job.pdfUrl));
      setMessage(
        job.sectionsManquantes?.length
          ? `Rapport prêt — ${job.sectionsManquantes.length} section(s) indisponible(s).`
          : 'Rapport prêt.'
      );
      if (preferences.ouvrirPdfAutomatiquement) {
        window.open(fileUrl(job.pdfUrl), '_blank', 'noopener');
      }
    } catch (err) {
      if (!monte.current) return;
      setEtape('erreur');
      setMessage(err.message);
    }
  };

  const occupe = etape === 'paiement' || etape === 'generation';

  return (
    <article className="sector-card">
      <div className="sector-card__media">
        {imageOk ? (
          <img src={`/images/${sector.slug}.jpeg`} alt="" onError={() => setImageOk(false)} />
        ) : (
          <span className="sector-card__embleme" aria-hidden="true">{ICONES[sector.slug] || '📊'}</span>
        )}
        <span className="sector-card__etiquette">Rapport sectoriel</span>
      </div>

      <div className="sector-card__body">
        <h3 className="sector-card__title">{sector.nom}</h3>
        <p className="sector-card__desc">{sector.description}</p>

        <dl className="sector-card__meta">
          <div>
            <dt>Volume</dt>
            <dd>≈ {sector.nombre_pages} pages</dd>
          </div>
          <div>
            <dt>Mise à jour</dt>
            <dd>{formatDate(sector.date_maj)}</dd>
          </div>
        </dl>

        <div className="sector-card__tarif">
          <div>
            <span className="sector-card__price">{Number(sector.prix_rapport).toFixed(2)}</span>
            <span className="sector-card__devise">TND</span>
          </div>
          {equivalentPaiement && (
            <span className="muted">≈ {equivalentPaiement} {paypalConfig.devisePaiement} à l'encaissement</span>
          )}
        </div>

        {etape === 'generation' && (
          <ProgressBar progression={progression.valeur} etape={progression.libelle} />
        )}

        {message && (
          <p className={`alert alert--${etape === 'erreur' ? 'error' : etape === 'termine' ? 'success' : 'info'}`}>
            {message}
          </p>
        )}

        {pdfUrl && (
          <a className="btn btn--success btn--block" href={pdfUrl} target="_blank" rel="noreferrer">
            Télécharger le rapport
          </a>
        )}

        <div className="sector-card__actions">
          <button type="button" className="btn btn--ghost btn--block" onClick={ouvrirApercu} disabled={occupe}>
            Lire l'aperçu gratuit
          </button>

          {etape !== 'termine' && (
            estConnecte ? (
              <PayPalButton
                config={paypalConfig}
                sectorId={sector.id}
                desactive={occupe}
                onPaiementConfirme={lancerGeneration}
                onErreur={(texte) => { setEtape('erreur'); setMessage(texte); }}
              />
            ) : (
              <Link to="/login" className="btn btn--primary btn--block">
                Se connecter pour acheter
              </Link>
            )
          )}
        </div>
      </div>
    </article>
  );
}
