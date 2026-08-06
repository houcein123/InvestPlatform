import { useEffect, useState } from 'react';
import { api } from '../api/client';
import SectorCard from '../components/SectorCard';

/** Catalogue public des 6 secteurs (CDC §3). */
export default function Catalogue() {
  const [secteurs, setSecteurs] = useState([]);
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.catalogue()
      .then((data) => setSecteurs(data.secteurs))
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <div className="loading">Chargement du catalogue…</div>;

  return (
    <div className="page">
      <header className="page-header">
        <h1>Rapports sectoriels</h1>
        <p>
          Analyses combinant les données officielles tunisiennes et une synthèse rédigée par IA.
          Consultez gratuitement les deux premières pages avant d'acheter.
        </p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}

      {!erreur && secteurs.length === 0 && (
        <p className="empty">Aucun secteur disponible pour le moment.</p>
      )}

      <div className="grid grid--sectors">
        {secteurs.map((secteur) => (
          <SectorCard key={secteur.id} sector={secteur} />
        ))}
      </div>
    </div>
  );
}
