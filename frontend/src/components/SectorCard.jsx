import { useEffect, useRef, useState } from 'react';
import { api, fileUrl } from '../api/client';
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
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

export default function SectorCard({ sector }) {
  const [etat, setEtat] = useState('pret'); // pret | achat | generation | termine | erreur
  const [message, setMessage] = useState('');
  const [progression, setProgression] = useState({ valeur: 0, etape: '' });
  const [pdfUrl, setPdfUrl] = useState(null);
  const [imageOk, setImageOk] = useState(true);

  // Le polling doit s'arrêter si l'utilisateur quitte la page en cours de
  // génération, sinon React avertit d'une mise à jour sur composant démonté.
  const monte = useRef(true);
  useEffect(() => () => { monte.current = false; }, []);

  const ouvrirApercu = () => window.open(api.previewUrl(sector.id), '_blank', 'noopener');

  /** Interroge le backend jusqu'à ce que le job soit terminé ou en erreur. */
  const suivreJob = async (jobId) => {
    while (monte.current) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (!monte.current) return null;

      const { job } = await api.reportStatus(jobId);
      setProgression({ valeur: job.progression, etape: job.etape });

      if (job.statut === 'termine') return job;
      if (job.statut === 'erreur') throw new Error(job.erreur || 'Génération interrompue');
    }
    return null;
  };

  const acheter = async () => {
    setEtat('achat');
    setPdfUrl(null);
    setMessage('Création de la commande…');

    try {
      // 1. Commande + 2. Paiement (PayPal simulé côté backend)
      const commande = await api.createOrder(sector.id);
      setMessage(`Paiement de ${commande.montant} ${commande.devise}…`);
      await api.capturePayment(commande.achatId);

      // 3. Génération suivie par la barre de progression
      setEtat('generation');
      setMessage('');
      setProgression({ valeur: 0, etape: 'Préparation des données sectorielles' });

      const { jobId } = await api.generateReport(sector.id, commande.achatId);
      const job = await suivreJob(jobId);
      if (!job) return;

      // 4. Téléchargement
      setEtat('termine');
      setPdfUrl(fileUrl(job.pdfUrl));
      setMessage(
        job.sectionsManquantes?.length
          ? `Rapport prêt — ${job.sectionsManquantes.length} section(s) d'analyse IA indisponible(s).`
          : 'Rapport prêt.'
      );
      window.open(fileUrl(job.pdfUrl), '_blank', 'noopener');
    } catch (err) {
      if (!monte.current) return;
      setEtat('erreur');
      setMessage(err.message);
    }
  };

  const occupe = etat === 'achat' || etat === 'generation';

  return (
    <article className="card sector-card">
      <div className="sector-card__media">
        {imageOk ? (
          <img
            src={`/images/${sector.slug}.jpeg`}
            alt={sector.nom}
            onError={() => setImageOk(false)}
          />
        ) : (
          <span aria-hidden="true">{ICONES[sector.slug] || '📊'}</span>
        )}
      </div>

      <div className="sector-card__body">
        <h2 className="sector-card__title">{sector.nom}</h2>
        <p className="sector-card__desc">{sector.description}</p>

        <div className="sector-card__meta">
          <span>📄 {sector.nombre_pages} pages</span>
          <span>📅 Mis à jour le {formatDate(sector.date_maj)}</span>
        </div>

        <div className="row-between">
          <span className="sector-card__price">{sector.prix_rapport} TND</span>
          {etat === 'termine' && <span className="badge badge--on">Acheté</span>}
        </div>

        {etat === 'generation' && (
          <ProgressBar progression={progression.valeur} etape={progression.etape} />
        )}

        {message && (
          <p className={`alert alert--${etat === 'erreur' ? 'error' : etat === 'termine' ? 'success' : 'info'}`}>
            {message}
          </p>
        )}

        {pdfUrl && (
          <a className="btn btn--ghost btn--block" href={pdfUrl} target="_blank" rel="noreferrer">
            ⬇️ Retélécharger le PDF
          </a>
        )}

        <div className="sector-card__actions">
          <button type="button" className="btn btn--ghost" onClick={ouvrirApercu} disabled={occupe}>
            👁️ Aperçu gratuit
          </button>
          <button type="button" className="btn btn--success" onClick={acheter} disabled={occupe}>
            {occupe ? '⏳ Traitement…' : '🛒 Acheter le rapport'}
          </button>
        </div>
      </div>
    </article>
  );
}
