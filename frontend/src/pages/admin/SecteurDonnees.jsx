import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, fileUrl } from '../../api/client';
import ProgressBar from '../../components/ProgressBar';

/**
 * Édition des données d'un secteur (CDC §7) :
 * formulaire des chiffres clés, listes zones / acteurs / cadre réglementaire,
 * et bouton « Régénérer le rapport » avec suivi de progression.
 */

const CHAMPS_CHIFFRES = [
  { cle: 'contribution_pib_pct', libelle: 'Contribution au PIB (%)', pas: '0.01' },
  { cle: 'croissance_annuelle_pct', libelle: 'Croissance annuelle (%)', pas: '0.01' },
  { cle: 'nombre_emplois', libelle: 'Emplois générés', pas: '1' },
  { cle: 'exportations_mdt', libelle: 'Exportations (MDT)', pas: '0.01' },
  { cle: 'nombre_entreprises', libelle: 'Entreprises actives', pas: '1' },
  { cle: 'investissements_ide_mdt', libelle: 'Investissements IDE (MDT)', pas: '0.01' },
  { cle: 'part_marche_regional_pct', libelle: 'Part de marché régionale (%)', pas: '0.01' },
];

const NOUVELLE_ZONE = { nom: '', type: 'zone_franche', gouvernorat: '', superficie_km2: '', description: '', avantages: '' };
const NOUVEL_ACTEUR = { nom: '', type: 'entreprise', role: '', site_web: '', chiffre_affaires: '', nombre_employes: '' };
const NOUVEAU_CADRE = { titre: '', annee: '', description: '', avantages: '', obligations: '', type_texte: 'loi' };

const POLL_INTERVAL_MS = 1200;

export default function SecteurDonnees() {
  const { id } = useParams();

  const [donnees, setDonnees] = useState(null);
  const [chiffres, setChiffres] = useState({});
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [info, setInfo] = useState('');

  const [zone, setZone] = useState(NOUVELLE_ZONE);
  const [acteur, setActeur] = useState(NOUVEL_ACTEUR);
  const [cadre, setCadre] = useState(NOUVEAU_CADRE);

  const [regeneration, setRegeneration] = useState(null); // { valeur, etape } | null
  const [pdfUrl, setPdfUrl] = useState(null);
  const [projectionEnCours, setProjectionEnCours] = useState(false);

  // Remis à true à chaque montage : React monte les composants deux fois en
  // développement, et le nettoyage du premier montage figeait sinon le drapeau
  // à false, ce qui bloquait le suivi de progression à 0 %.
  const monte = useRef(true);
  useEffect(() => {
    monte.current = true;
    return () => { monte.current = false; };
  }, []);

  const recharger = () => api.adminSecteur(id).then(setDonnees);

  useEffect(() => {
    Promise.all([api.adminSecteur(id), api.chiffresCles(id)])
      .then(([secteurData, chiffresData]) => {
        setDonnees(secteurData);
        const valeurs = {};
        CHAMPS_CHIFFRES.forEach(({ cle }) => {
          valeurs[cle] = chiffresData.chiffresCles?.[cle] ?? '';
        });
        setChiffres(valeurs);
      })
      .catch((err) => setErreur(err.message))
      .finally(() => setChargement(false));
  }, [id]);

  const enregistrerChiffres = async (event) => {
    event.preventDefault();
    setErreur('');
    try {
      await api.saveChiffresCles(id, chiffres);
      await recharger();
      setInfo('Chiffres clés enregistrés. La date de mise à jour du catalogue a été rafraîchie.');
    } catch (err) {
      setErreur(err.message);
    }
  };

  const ajouter = (creer, valeurs, reinitialiser) => async (event) => {
    event.preventDefault();
    setErreur('');
    try {
      await creer(id, valeurs);
      reinitialiser();
      await recharger();
    } catch (err) {
      setErreur(err.message);
    }
  };

  const supprimer = async (kind, itemId) => {
    setErreur('');
    try {
      await api.deleteItem(kind, itemId);
      await recharger();
    } catch (err) {
      setErreur(err.message);
    }
  };

  /**
   * Recalcule les estimations à partir de l'historique observé.
   * À lancer après toute mise à jour des séries statistiques, sinon les
   * projections affichées dans le rapport reposent sur d'anciennes données.
   */
  const recalculerProjections = async () => {
    setErreur('');
    setInfo('');
    setProjectionEnCours(true);
    try {
      const resultat = await api.recalculerProjections(id);
      await recharger();
      setInfo(
        `${resultat.projetees} série(s) projetée(s) sur ${resultat.total}. `
        + `${resultat.ignorees} série(s) sans modèle fiable restent sans estimation.`
      );
    } catch (err) {
      setErreur(err.message);
    } finally {
      setProjectionEnCours(false);
    }
  };

  const regenerer = async () => {
    setErreur('');
    setInfo('');
    setPdfUrl(null);
    setRegeneration({ valeur: 0, etape: 'Préparation des données sectorielles' });

    try {
      const { jobId } = await api.regenerer(id);
      while (monte.current) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (!monte.current) return;

        const { job } = await api.reportStatus(jobId);
        setRegeneration({ valeur: job.progression, etape: job.etape });

        if (job.statut === 'termine') {
          setRegeneration(null);
          setPdfUrl(fileUrl(job.pdfUrl));
          setInfo('Rapport régénéré avec les données à jour.');
          return;
        }
        if (job.statut === 'erreur') throw new Error(job.erreur || 'Régénération interrompue');
      }
    } catch (err) {
      if (!monte.current) return;
      setRegeneration(null);
      setErreur(err.message);
    }
  };

  if (chargement) return <div className="loading">Chargement des données du secteur…</div>;
  if (!donnees) return <div className="page"><p className="alert alert--error">{erreur || 'Secteur introuvable'}</p></div>;

  const { secteur, donneesStatistiques, zonesGeographiques, acteursPrincipaux, cadreReglementaire } = donnees;

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/admin" className="muted">← Retour au panneau admin</Link>
        <h1 style={{ marginTop: 8 }}>{secteur.nom}</h1>
        <p>{secteur.description}</p>
      </header>

      {erreur && <p className="alert alert--error">{erreur}</p>}
      {info && <p className="alert alert--success">{info}</p>}

      {/* ── Régénération et projections ── */}
      <div className="card">
        <div className="row-between">
          <div>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Rapport PDF</h2>
            <p className="muted">
              {donneesStatistiques.length} séries statistiques · {zonesGeographiques.length} zones ·{' '}
              {acteursPrincipaux.length} acteurs · {cadreReglementaire.length} textes réglementaires
            </p>
          </div>
          <div className="inline-actions">
            <button type="button" className="btn btn--ghost" onClick={recalculerProjections} disabled={projectionEnCours}>
              {projectionEnCours ? 'Calcul…' : 'Recalculer les projections'}
            </button>
            <button type="button" className="btn btn--primary" onClick={regenerer} disabled={!!regeneration}>
              {regeneration ? 'Régénération…' : 'Régénérer le rapport'}
            </button>
          </div>
        </div>

        {regeneration && <ProgressBar progression={regeneration.valeur} etape={regeneration.etape} />}
        {pdfUrl && (
          <p style={{ marginTop: 12 }}>
            <a href={pdfUrl} target="_blank" rel="noreferrer">Ouvrir le rapport régénéré</a>
          </p>
        )}
      </div>

      {/* ── Chiffres clés ── */}
      <form className="card" onSubmit={enregistrerChiffres}>
        <h2 className="section-title">Chiffres clés</h2>
        <div className="grid grid--form">
          {CHAMPS_CHIFFRES.map(({ cle, libelle, pas }) => (
            <div className="field" key={cle}>
              <label htmlFor={cle}>{libelle}</label>
              <input
                id={cle} className="input" type="number" step={pas}
                value={chiffres[cle] ?? ''}
                onChange={(e) => setChiffres({ ...chiffres, [cle]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn--success">Enregistrer les chiffres clés</button>
        </div>
      </form>

      {/* ── Zones géographiques ── */}
      <div className="card">
        <h2 className="section-title">Zones géographiques et zones franches</h2>
        <ListeItems
          items={zonesGeographiques}
          vide="Aucune zone renseignée."
          rendu={(z) => `${z.nom} — ${z.type}${z.gouvernorat ? ` (${z.gouvernorat})` : ''}`}
          onSupprimer={(itemId) => supprimer('zones', itemId)}
        />
        <form className="grid grid--form" onSubmit={ajouter(api.createZone, zone, () => setZone(NOUVELLE_ZONE))}>
          <Champ label="Nom" value={zone.nom} onChange={(v) => setZone({ ...zone, nom: v })} requis />
          <ChampSelect
            label="Type" value={zone.type} onChange={(v) => setZone({ ...zone, type: v })}
            options={['zone_franche', 'zone_cotiere', 'pole_industriel', 'port']}
          />
          <Champ label="Gouvernorat" value={zone.gouvernorat} onChange={(v) => setZone({ ...zone, gouvernorat: v })} />
          <Champ label="Superficie (km²)" type="number" value={zone.superficie_km2} onChange={(v) => setZone({ ...zone, superficie_km2: v })} />
          <Champ label="Description" value={zone.description} onChange={(v) => setZone({ ...zone, description: v })} />
          <Champ label="Avantages" value={zone.avantages} onChange={(v) => setZone({ ...zone, avantages: v })} />
          <div className="form-actions">
            <button type="submit" className="btn btn--ghost">Ajouter la zone</button>
          </div>
        </form>
      </div>

      {/* ── Acteurs principaux ── */}
      <div className="card">
        <h2 className="section-title">Acteurs principaux</h2>
        <ListeItems
          items={acteursPrincipaux}
          vide="Aucun acteur renseigné."
          rendu={(a) => `${a.nom} — ${a.role || a.type}`}
          onSupprimer={(itemId) => supprimer('acteurs', itemId)}
        />
        <form className="grid grid--form" onSubmit={ajouter(api.createActeur, acteur, () => setActeur(NOUVEL_ACTEUR))}>
          <Champ label="Nom" value={acteur.nom} onChange={(v) => setActeur({ ...acteur, nom: v })} requis />
          <ChampSelect
            label="Type" value={acteur.type} onChange={(v) => setActeur({ ...acteur, type: v })}
            options={['entreprise', 'agence_publique', 'tour_operateur']}
          />
          <Champ label="Rôle" value={acteur.role} onChange={(v) => setActeur({ ...acteur, role: v })} />
          <Champ label="Site web" value={acteur.site_web} onChange={(v) => setActeur({ ...acteur, site_web: v })} />
          <Champ label="Chiffre d'affaires (MDT)" type="number" value={acteur.chiffre_affaires} onChange={(v) => setActeur({ ...acteur, chiffre_affaires: v })} />
          <Champ label="Employés" type="number" value={acteur.nombre_employes} onChange={(v) => setActeur({ ...acteur, nombre_employes: v })} />
          <div className="form-actions">
            <button type="submit" className="btn btn--ghost">Ajouter l'acteur</button>
          </div>
        </form>
      </div>

      {/* ── Cadre réglementaire ── */}
      <div className="card">
        <h2 className="section-title">Cadre réglementaire et fiscal</h2>
        <ListeItems
          items={cadreReglementaire}
          vide="Aucun texte réglementaire renseigné."
          rendu={(c) => `${c.titre}${c.annee ? ` (${c.annee})` : ''}`}
          onSupprimer={(itemId) => supprimer('cadre', itemId)}
        />
        <form className="grid grid--form" onSubmit={ajouter(api.createCadre, cadre, () => setCadre(NOUVEAU_CADRE))}>
          <Champ label="Titre" value={cadre.titre} onChange={(v) => setCadre({ ...cadre, titre: v })} requis />
          <Champ label="Année" type="number" value={cadre.annee} onChange={(v) => setCadre({ ...cadre, annee: v })} />
          <ChampSelect
            label="Type de texte" value={cadre.type_texte} onChange={(v) => setCadre({ ...cadre, type_texte: v })}
            options={['loi', 'decret', 'convention']}
          />
          <Champ label="Description" value={cadre.description} onChange={(v) => setCadre({ ...cadre, description: v })} requis />
          <Champ label="Avantages" value={cadre.avantages} onChange={(v) => setCadre({ ...cadre, avantages: v })} />
          <Champ label="Obligations" value={cadre.obligations} onChange={(v) => setCadre({ ...cadre, obligations: v })} />
          <div className="form-actions">
            <button type="submit" className="btn btn--ghost">Ajouter le texte</button>
          </div>
        </form>
      </div>

      {/* ── Séries statistiques (lecture seule) ── */}
      <div className="card">
        <h2 className="section-title">Séries statistiques ({donneesStatistiques.length})</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Importées depuis les CSV de l'INS via <code>sql/setup_database.py --import-csv</code>.
          Les colonnes <span className="estimation">en bleu</span> sont des estimations calculées,
          jamais des valeurs publiées.
        </p>
        <div className="table-wrapper" style={{ maxHeight: 360, overflowY: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Indicateur</th>
                <th>Unité</th>
                <th className="table__num">2022</th>
                <th className="table__num">2023</th>
                <th className="table__num">2024</th>
                <th className="table__num">Est. 2028</th>
                <th>Modèle</th>
              </tr>
            </thead>
            <tbody>
              {donneesStatistiques.map((ligne) => (
                <tr key={ligne.id}>
                  <td className="table__truncate">{ligne.indicateur}</td>
                  <td className="muted">{ligne.unite || '—'}</td>
                  <td className="table__num">{ligne.valeur_2022 ?? '—'}</td>
                  <td className="table__num">{ligne.valeur_2023 ?? '—'}</td>
                  <td className="table__num">
                    {ligne.valeur_2024 ?? (
                      ligne.projection_2024
                        ? <span className="estimation">{ligne.projection_2024}</span>
                        : '—'
                    )}
                  </td>
                  <td className="table__num">
                    {ligne.projection_2028
                      ? <span className="estimation">{ligne.projection_2028}</span>
                      : '—'}
                  </td>
                  <td className="muted">
                    {ligne.methode_projection
                      ? `${ligne.methode_projection.replace(/_/g, ' ')}${ligne.fiabilite_r2 ? ` (R² ${Number(ligne.fiabilite_r2).toFixed(2)})` : ''}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Petits composants de formulaire ───────────────────────────────────────

function Champ({ label, value, onChange, type = 'text', requis = false }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        className="input" type={type} required={requis}
        value={value} onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ChampSelect({ label, value, onChange, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option.replace(/_/g, ' ')}</option>
        ))}
      </select>
    </div>
  );
}

function ListeItems({ items, rendu, vide, onSupprimer }) {
  if (!items.length) return <p className="empty">{vide}</p>;

  return (
    <ul className="stack" style={{ listStyle: 'none', marginBottom: 18 }}>
      {items.map((item) => (
        <li key={item.id} className="row-between" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
          <span>{rendu(item)}</span>
          <button type="button" className="btn btn--danger btn--sm" onClick={() => onSupprimer(item.id)}>
            Supprimer
          </button>
        </li>
      ))}
    </ul>
  );
}
