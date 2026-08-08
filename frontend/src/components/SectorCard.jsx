import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

/**
 * Carte d'un secteur dans le catalogue.
 *
 * La carte présente et oriente : le règlement et la génération se déroulent
 * sur la page dédiée `/paiement/:id`. Séparer les deux évite d'empiler un
 * formulaire, une barre de progression et un lien de téléchargement dans une
 * vignette de 330 pixels de large.
 */

/** Illustration de repli quand aucune image n'est fournie pour le secteur. */
const ICONES = {
  tourisme: '🏖️',
  agriculture: '🌾',
  technologies: '💻',
  energies: '⚡',
  textile: '🧵',
  logistique: '🚢',
};

function formatDate(valeur) {
  if (!valeur) return '—';
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function SectorCard({ sector, paypalConfig }) {
  const { estConnecte } = useAuth();
  const [imageOk, setImageOk] = useState(true);

  const ouvrirApercu = () => window.open(api.previewUrl(sector.id), '_blank', 'noopener');

  // L'équivalent en devise d'encaissement n'a de sens qu'en mode PayPal :
  // le tarif est affiché en TND mais la transaction passe en euros.
  const equivalentPaiement = paypalConfig?.mode === 'paypal' && paypalConfig?.tauxConversion
    ? (Number(sector.prix_rapport) * paypalConfig.tauxConversion).toFixed(2)
    : null;

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

        <div className="sector-card__actions">
          <button type="button" className="btn btn--ghost btn--block" onClick={ouvrirApercu}>
            Lire l'aperçu gratuit
          </button>

          {estConnecte ? (
            <Link to={`/paiement/${sector.id}`} className="btn btn--primary btn--block">
              Commander ce rapport
            </Link>
          ) : (
            <Link to="/login" className="btn btn--primary btn--block">
              Se connecter pour acheter
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
