import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import Sidebar from './Sidebar';

/**
 * Ossature de l'application.
 * Un visiteur non connecté voit le site public en pleine largeur ; dès qu'un
 * compte est connecté, la barre latérale apparaît avec le menu correspondant
 * à son rôle.
 */
export default function AppShell({ children }) {
  const { estConnecte } = useAuth();
  const { pathname } = useLocation();
  const [menuOuvert, setMenuOuvert] = useState(false);

  // L'écran de connexion occupe tout le viewport.
  if (pathname === '/login') return children;

  return (
    <div className={estConnecte ? 'shell shell--avec-sidebar' : 'shell'}>
      <header className="topbar">
        {estConnecte && (
          <button
            type="button"
            className="topbar__burger"
            aria-label="Afficher ou masquer le menu"
            aria-expanded={menuOuvert}
            onClick={() => setMenuOuvert((ouvert) => !ouvert)}
          >
            ☰
          </button>
        )}

        <Link to="/" className="topbar__marque">
          InvestPlatform
          <span>Tunisia Invest — Analyse sectorielle</span>
        </Link>

        {!estConnecte && (
          <Link to="/login" className="btn btn--ghost btn--sm">Se connecter</Link>
        )}
      </header>

      {estConnecte && (
        <>
          <Sidebar ouverte={menuOuvert} onNavigate={() => setMenuOuvert(false)} />
          {menuOuvert && (
            <button
              type="button"
              className="shell__voile"
              aria-label="Fermer le menu"
              onClick={() => setMenuOuvert(false)}
            />
          )}
        </>
      )}

      <main className="shell__contenu">{children}</main>
    </div>
  );
}
