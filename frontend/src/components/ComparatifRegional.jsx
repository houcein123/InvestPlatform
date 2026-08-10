import { useEffect, useState } from 'react';
import { api } from '../api/client';

/**
 * Saisie du comparatif Tunisie / Maroc / Égypte exigé par le CDC §4.
 *
 * Ces valeurs sont les SEULES données étrangères que le rapport publie, et
 * elles sont saisies à la main, sourcées. Tant qu'une ligne reste vide, le
 * prompt indique au modèle de ne produire aucun chiffre sur ce point : sans
 * cette table, il inventait l'intégralité des comparaisons.
 */
export default function ComparatifRegional({ secteurId, onErreur }) {
  const [lignes, setLignes] = useState([]);
  const [brouillons, setBrouillons] = useState({});
  const [enregistrement, setEnregistrement] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    api.benchmarks(secteurId)
      .then((data) => {
        setLignes(data.benchmarks);
        setBrouillons(Object.fromEntries(data.benchmarks.map((b) => [b.id, {
          annee: b.annee ?? '',
          valeur_tunisie: b.valeur_tunisie ?? '',
          valeur_maroc: b.valeur_maroc ?? '',
          valeur_egypte: b.valeur_egypte ?? '',
          source: b.source ?? '',
        }])));
      })
      .catch((err) => onErreur(err.message))
      .finally(() => setChargement(false));
  }, [secteurId, onErreur]);

  const maj = (id, champ, valeur) =>
    setBrouillons((b) => ({ ...b, [id]: { ...b[id], [champ]: valeur } }));

  const enregistrer = async (id) => {
    setEnregistrement(id);
    try {
      const { benchmark } = await api.saveBenchmark(id, brouillons[id]);
      setLignes((l) => l.map((x) => (x.id === id ? benchmark : x)));
    } catch (err) {
      onErreur(err.message);
    } finally {
      setEnregistrement(null);
    }
  };

  if (chargement) return null;

  const renseignes = lignes.filter(
    (b) => b.valeur_tunisie !== null || b.valeur_maroc !== null || b.valeur_egypte !== null
  ).length;

  return (
    <div className="card">
      <h2 className="section-title">Comparatif régional — Maroc et Égypte</h2>

      <p className="muted" style={{ marginBottom: 14 }}>
        {renseignes} indicateur(s) renseigné(s) sur {lignes.length}. Ce sont les seuls
        chiffres étrangers que le rapport publiera. Les lignes laissées vides sont
        traitées de façon qualitative dans l'analyse, jamais complétées automatiquement.
      </p>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Indicateur</th>
              <th>Unité</th>
              <th style={{ width: 78 }}>Année</th>
              <th style={{ width: 104 }}>Tunisie</th>
              <th style={{ width: 104 }}>Maroc</th>
              <th style={{ width: 104 }}>Égypte</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => {
              const b = brouillons[ligne.id] || {};
              return (
                <tr key={ligne.id}>
                  <td className="table__truncate">{ligne.indicateur}</td>
                  <td className="muted">{ligne.unite || '—'}</td>
                  {['annee', 'valeur_tunisie', 'valeur_maroc', 'valeur_egypte'].map((champ) => (
                    <td key={champ}>
                      <input
                        className="input" type="number" step="0.01"
                        value={b[champ] ?? ''}
                        onChange={(e) => maj(ligne.id, champ, e.target.value)}
                      />
                    </td>
                  ))}
                  <td>
                    <input
                      className="input" type="text"
                      value={b.source ?? ''}
                      onChange={(e) => maj(ligne.id, 'source', e.target.value)}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--success btn--sm"
                      disabled={enregistrement === ligne.id}
                      onClick={() => enregistrer(ligne.id)}
                    >
                      {enregistrement === ligne.id ? '…' : 'Enregistrer'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
