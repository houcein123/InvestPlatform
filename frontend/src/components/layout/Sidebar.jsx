import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

/**
 * Barre latérale de navigation.
 * Les entrées dépendent du rôle : un client et un administrateur ne voient
 * jamais le même menu, mais les rubriques transverses (profil, paramètres)
 * sont partagées.
 */

const MENU_ADMIN = [
  {
    titre: 'Pilotage',
    liens: [
      { to: '/admin', libelle: 'Tableau de bord', icone: '📊', exact: true },
      { to: '/admin/secteurs', libelle: 'Secteurs', icone: '🗂️' },
      { to: '/admin/comptes', libelle: 'Comptes', icone: '👥' },
    ],
  },
  {
    titre: 'Mon compte',
    liens: [
      { to: '/profil', libelle: 'Profil', icone: '👤' },
      { to: '/parametres', libelle: 'Paramètres', icone: '⚙️' },
    ],
  },
  {
    titre: 'Site public',
    liens: [{ to: '/', libelle: 'Catalogue', icone: '🌍', exact: true }],
  },
];

const MENU_CLIENT = [
  {
    titre: 'Rapports',
    liens: [
      { to: '/', libelle: 'Catalogue', icone: '🌍', exact: true },
      { to: '/mes-rapports', libelle: 'Mes rapports', icone: '📄' },
    ],
  },
  {
    titre: 'Mon compte',
    liens: [
      { to: '/profil', libelle: 'Profil', icone: '👤' },
      { to: '/parametres', libelle: 'Paramètres', icone: '⚙️' },
    ],
  },
];

export default function Sidebar({ ouverte, onNavigate }) {
  const { compte, estAdmin, logout } = useAuth();
  const groupes = estAdmin ? MENU_ADMIN : MENU_CLIENT;

  const initiales = `${compte?.prenom?.[0] ?? ''}${compte?.nom?.[0] ?? ''}`.toUpperCase() || '?';

  return (
    <aside className={`sidebar ${ouverte ? 'sidebar--ouverte' : ''}`}>
      <div className="sidebar__identite">
        <div className="sidebar__avatar" aria-hidden="true">{initiales}</div>
        <div className="sidebar__identite-texte">
          <strong>{compte?.prenom} {compte?.nom}</strong>
          <span className={`badge ${estAdmin ? 'badge--info' : 'badge--on'}`}>
            {estAdmin ? 'Administrateur' : 'Client'}
          </span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {groupes.map((groupe) => (
          <div key={groupe.titre} className="sidebar__groupe">
            <p className="sidebar__groupe-titre">{groupe.titre}</p>
            {groupe.liens.map((lien) => (
              <NavLink
                key={lien.to}
                to={lien.to}
                end={lien.exact}
                onClick={onNavigate}
                className={({ isActive }) => `sidebar__lien ${isActive ? 'sidebar__lien--actif' : ''}`}
              >
                <span className="sidebar__icone" aria-hidden="true">{lien.icone}</span>
                {lien.libelle}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <button type="button" className="btn btn--subtle btn--block" onClick={logout}>
        Déconnexion
      </button>
    </aside>
  );
}
