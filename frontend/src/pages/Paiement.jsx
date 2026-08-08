import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, fileUrl } from '../api/client';
import { lirePreferences } from '../preferences';
import PayPalButton from '../components/PayPalButton';
import ProgressBar from '../components/ProgressBar';

/**
 * Page de règlement d'un rapport.
 *
 * Le paiement a sa propre page plutôt qu'un formulaire replié dans la carte du
 * catalogue : l'acheteur voit ce qu'il commande sans distraction, et le
 * parcours (récapitulatif → règlement → génération → téléchargement) se lit
 * d'un seul tenant.
 *
 * Seule l'ADRESSE du compte est demandée. Aucun mot de passe : un marchand n'a
 * pas à connaître les identifiants PayPal de ses clients, et aucune API ne
 * permettrait de les vérifier — un tel formulaire ne serait qu'une collecte de
 * mots de passe en clair.
 */

const POLL_INTERVAL_MS = 1200;

export default function Paiement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const preferences = lirePreferences();

  const [secteur, setSecteur] = useState(null);
  const [config, setConfig] = useState(null);
  const [commande, setCommande] = useState(null);
  const [chargement, setChargement] = useState(true);

  const [compte, setCompte] = useState({ email: '', nom: '' });
  const [etape, setEtape] = useState('formulaire'); // formulaire | envoi | generation | termine
  const [erreur, setErreur] = useState('');
  const [progression, setProgression] = useState({ valeur: 0, libelle: '' });
  const [pdfUrl, setPdfUrl] = useState(null);

  // Remis à true à chaque montage : React monte deux fois en développement, et
  // un drapeau figé à false bloquerait le suivi de progression à 0 %.
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => { monte.current = false; };
  }, []);

  useEffect(() => {
    Promise.all([api.catalogue(), api.paymentConfig()])
      .then(([catalogue, paiement]) => {
        const trouve = catalogue.secteurs.find((s) => String(s.id) === String(id));
        if (!trouve) {
          navigate('/', { replace: true });
          return;
        }
        setSecteur(trouve);
        setConfig(paiement);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [id, navigate]);

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

  const lancerGeneration = async (achatId) => {
    setEtape('generation');
    setProgression({ valeur: 0, libelle: 'Préparation des données sectorielles' });

    const { jobId } = await api.generateReport(secteur.id, achatId);
    const job = await suivreJob(jobId);
    if (!job) return;

    setEtape('termine');
    setPdfUrl(fileUrl(job.pdfUrl));
    if (preferences.ouvrirPdfAutomatiquement) {
      window.open(fileUrl(job.pdfUrl), '_blank', 'noopener');
    }
  };

  /** Mode démonstration : commande puis validation locale. */
  const regler = async (event) => {
    event.preventDefault();
    setErreur('');
    setEtape('envoi');

    try {
      const nouvelle = commande ?? (await api.createOrder(secteur.id));
      setCommande(nouvelle);

      await api.capturePayment(null, nouvelle.achatId, {
        emailPayeur: compte.email.trim(),
        nomPayeur: compte.nom.trim() || null,
      });

      await lancerGeneration(nouvelle.achatId);
    } catch (err) {
      if (!monte.current) return;
      setEtape('formulaire');
      setErreur(err.message);
    }
  };

  if (chargement) return <div className="loading">Chargement…</div>;
  if (!secteur) return null;

  const prix = Number(secteur.prix_rapport).toFixed(2);

  return (
    <div className="page page--narrow">
      <header className="page-header">
        <Link to="/" className="muted">← Retour au catalogue</Link>
        <h1 style={{ marginTop: 8 }}>Régler votre commande</h1>
      </header>

      <div className="card paiement">
        <h2 className="section-title">Récapitulatif</h2>

        <dl className="commande__lignes">
          <div>
            <dt>Rapport sectoriel</dt>
            <dd>{secteur.nom}</dd>
          </div>
          <div>
            <dt>Volume</dt>
            <dd>≈ {secteur.nombre_pages} pages</dd>
          </div>
          <div className="commande__total">
            <dt>Total</dt>
            <dd>{prix} TND</dd>
          </div>
        </dl>

        {erreur && <p className="alert alert--error" style={{ marginTop: 16 }}>{erreur}</p>}

        {/* ── Règlement ── */}
        {etape === 'formulaire' || etape === 'envoi' ? (
          config?.mode === 'paypal' ? (
            <div style={{ marginTop: 22 }}>
              <PayPalButton
                config={config}
                sectorId={secteur.id}
                onPaiementConfirme={({ achatId }) => lancerGeneration(achatId).catch((err) => {
                  setEtape('formulaire');
                  setErreur(err.message);
                })}
                onErreur={setErreur}
              />
            </div>
          ) : (
            <form onSubmit={regler} style={{ marginTop: 22 }}>
              <h2 className="section-title">Compte PayPal</h2>

              <div className="stack">
                <div className="field">
                  <label htmlFor="paypal-email">Adresse du compte</label>
                  <input
                    id="paypal-email" className="input" type="email" required
                    autoComplete="email" placeholder="adresse@exemple.com"
                    value={compte.email}
                    onChange={(e) => setCompte({ ...compte, email: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="paypal-nom">Titulaire du compte (facultatif)</label>
                  <input
                    id="paypal-nom" className="input" type="text" autoComplete="name"
                    value={compte.nom}
                    onChange={(e) => setCompte({ ...compte, nom: e.target.value })}
                  />
                </div>
              </div>

              <p className="paiement__mention">
                L'adresse du compte est conservée avec la commande pour le suivi comptable.
                <strong> Aucun mot de passe n'est demandé ni enregistré</strong> — la plateforme
                n'a pas à connaître vos identifiants PayPal.
              </p>

              <div className="form-actions">
                <Link to="/" className="btn btn--subtle">Annuler</Link>
                <button type="submit" className="btn btn--success" disabled={etape === 'envoi'}>
                  {etape === 'envoi' ? 'Validation…' : `Régler ${prix} TND`}
                </button>
              </div>
            </form>
          )
        ) : null}

        {/* ── Génération ── */}
        {etape === 'generation' && (
          <div style={{ marginTop: 24 }}>
            <h2 className="section-title">Préparation de votre rapport</h2>
            <ProgressBar progression={progression.valeur} etape={progression.libelle} />
            <p className="muted" style={{ marginTop: 10 }}>
              La génération prend une trentaine de secondes. Ne fermez pas cette page.
            </p>
          </div>
        )}

        {/* ── Livraison ── */}
        {etape === 'termine' && (
          <div style={{ marginTop: 24 }}>
            <p className="alert alert--success">Votre rapport est prêt.</p>
            <div className="form-actions">
              <a className="btn btn--success" href={pdfUrl} target="_blank" rel="noreferrer">
                Télécharger le rapport
              </a>
              <Link to="/mes-rapports" className="btn btn--ghost">Voir mes rapports</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
