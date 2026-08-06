import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { admin, logout } = useAuth();
  const { pathname } = useLocation();

  // L'écran de connexion occupe tout le viewport : pas de barre par-dessus.
  if (pathname === '/login') return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        InvestPlatform
        <span>Tunisia Invest — Rapports sectoriels</span>
      </Link>

      <div className="navbar__links">
        <Link to="/">Catalogue</Link>
        {admin ? (
          <>
            <Link to="/admin">Panneau admin</Link>
            <span className="muted">{admin.prenom} {admin.nom}</span>
            <button type="button" className="btn btn--subtle btn--sm" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <Link to="/login">Espace admin</Link>
        )}
      </div>
    </nav>
  );
}
