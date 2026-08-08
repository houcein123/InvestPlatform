import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SectorCard from '../components/SectorCard';

/**
 * Catalogue public des 6 secteurs (CDC §3).
 * Vitrine du service : elle doit inspirer la même confiance qu'une note
 * sectorielle institutionnelle, d'où la mise en avant des sources officielles
 * et de la structure exacte du rapport livré.
 */

const SOURCES = [
  { sigle: 'INS', nom: 'Institut National de la Statistique' },
  { sigle: 'BCT', nom: 'Banque Centrale de Tunisie' },
  { sigle: 'ONTT', nom: 'Office National du Tourisme Tunisien' },
  { sigle: 'STEG', nom: 'Société Tunisienne de l\'Électricité et du Gaz' },
  { sigle: 'FIPA', nom: 'Agence de Promotion de l\'Investissement Extérieur' },
];

const ETAPES = [
  { numero: '01', titre: 'Consulter', texte: "Les deux premières pages de chaque rapport sont librement téléchargeables." },
  { numero: '02', titre: 'Commander', texte: 'Paiement sécurisé à l\'acte par PayPal, sans abonnement.' },
  { numero: '03', titre: 'Recevoir', texte: 'Le document est assemblé en moins d\'une minute et reste dans votre espace.' },
];

const GARANTIES = [
  {
    titre: 'Données sourcées',
    texte: "Chaque série chiffrée porte la mention de l'organisme qui la publie et l'année de dernière observation.",
  },
  {
    titre: 'Projections explicites',
    texte: "Les valeurs postérieures aux publications officielles sont calculées par modèle statistique et signalées comme estimations.",
  },
  {
    titre: 'Périmètre régional',
    texte: 'Chaque secteur est comparé au Maroc et à l\'Égypte, les deux marchés concurrents de référence.',
  },
];

export default function Catalogue() {
  const [secteurs, setSecteurs] = useState([]);
  const [paypalConfig, setPaypalConfig] = useState(null);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    Promise.all([api.catalogue(), api.paymentConfig().catch(() => null)])
      .then(([catalogue, paiement]) => {
        setSecteurs(catalogue.secteurs);
        setPaypalConfig(paiement);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="loading">Chargement du catalogue…</div>;

  return (
    <div className="catalogue">
      {/* ── En-tête institutionnel ── */}
      <section className="hero">
        <div className="hero__contenu">
          <p className="hero__surtitre">République Tunisienne · Analyse sectorielle</p>
          <h1 className="hero__titre">
            Rapports sectoriels pour l'investissement en Tunisie
          </h1>
          <p className="hero__accroche">
            Six secteurs de l'économie tunisienne documentés à partir des statistiques
            publiques officielles, du cadre réglementaire en vigueur et des zones
            d'implantation ouvertes aux investisseurs étrangers.
          </p>

          <dl className="hero__reperes">
            <div>
              <dt>Secteurs couverts</dt>
              <dd>{secteurs.length}</dd>
            </div>
            <div>
              <dt>Sections par rapport</dt>
              <dd>12</dd>
            </div>
            <div>
              <dt>Horizon des projections</dt>
              <dd>2028</dd>
            </div>
          </dl>
        </div>

        <aside className="hero__sources" aria-label="Sources officielles">
          <p className="hero__sources-titre">Données issues de</p>
          <ul>
            {SOURCES.map((source) => (
              <li key={source.sigle}>
                <strong>{source.sigle}</strong>
                <span>{source.nom}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {/* ── Catalogue ── */}
      <section className="catalogue__section" id="secteurs">
        <header className="catalogue__entete">
          <h2>Choisir un secteur</h2>
          <p>Aperçu gratuit de deux pages pour chaque rapport, sans inscription.</p>
        </header>

        {secteurs.length === 0 ? (
          <p className="empty">Aucun secteur disponible pour le moment.</p>
        ) : (
          <div className="grid grid--sectors">
            {secteurs.map((secteur) => (
              <SectorCard key={secteur.id} sector={secteur} paypalConfig={paypalConfig} />
            ))}
          </div>
        )}
      </section>

      {/* ── Déroulé du service (CDC §6) ── */}
      <section className="catalogue__section">
        <header className="catalogue__entete">
          <h2>Comment ça marche</h2>
        </header>
        <div className="etapes">
          {ETAPES.map((etape) => (
            <div className="etape" key={etape.numero}>
              <span className="etape__numero">{etape.numero}</span>
              <h3>{etape.titre}</h3>
              <p>{etape.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Engagements méthodologiques ── */}
      <section className="catalogue__section">
        <header className="catalogue__entete">
          <h2>Ce que garantit chaque rapport</h2>
        </header>
        <div className="grid grid--garanties">
          {GARANTIES.map((garantie) => (
            <div className="garantie" key={garantie.titre}>
              <h3>{garantie.titre}</h3>
              <p>{garantie.texte}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="catalogue__pied">
        <p>
          Les analyses publiées sont fournies à titre informatif et ne constituent pas un
          conseil en investissement. Les décisions d'investissement relèvent de la seule
          responsabilité du lecteur, qui est invité à consulter un conseiller financier
          ou juridique.
        </p>
      </footer>
    </div>
  );
}
