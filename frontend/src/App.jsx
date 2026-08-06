import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import AppShell from './components/layout/AppShell';

import Catalogue from './pages/Catalogue';
import LoginPage from './pages/LoginPage';
import Profil from './pages/Profil';
import Parametres from './pages/Parametres';
import MesRapports from './pages/MesRapports';
import Dashboard from './pages/admin/Dashboard';
import Secteurs from './pages/admin/Secteurs';
import SecteurDonnees from './pages/admin/SecteurDonnees';
import Comptes from './pages/admin/Comptes';

/** Exige un compte connecté, quel que soit son rôle. */
function RequireAuth({ children }) {
  const { estConnecte } = useAuth();
  return estConnecte ? children : <Navigate to="/login" replace />;
}

/**
 * Exige le rôle administrateur.
 * Un client qui tente une URL du panneau de contrôle est renvoyé au catalogue,
 * pas vers la connexion : il est déjà authentifié, il n'a simplement pas accès.
 */
function RequireAdmin({ children }) {
  const { estConnecte, estAdmin } = useAuth();
  if (!estConnecte) return <Navigate to="/login" replace />;
  return estAdmin ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <div className="loading">Chargement…</div>;

  return (
    <AppShell>
      <Routes>
        {/* Le catalogue est la porte d'entrée publique du service (CDC §3). */}
        <Route path="/" element={<Catalogue />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/profil" element={<RequireAuth><Profil /></RequireAuth>} />
        <Route path="/parametres" element={<RequireAuth><Parametres /></RequireAuth>} />
        <Route path="/mes-rapports" element={<RequireAuth><MesRapports /></RequireAuth>} />

        <Route path="/admin" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/admin/secteurs" element={<RequireAdmin><Secteurs /></RequireAdmin>} />
        <Route path="/admin/secteurs/:id" element={<RequireAdmin><SecteurDonnees /></RequireAdmin>} />
        <Route path="/admin/comptes" element={<RequireAdmin><Comptes /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}
