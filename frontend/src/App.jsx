import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import NavBar from './components/NavBar';
import Catalogue from './pages/Catalogue';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/admin/Dashboard';
import SecteurDonnees from './pages/admin/SecteurDonnees';

/** Garde de route : renvoie vers la connexion si aucun admin n'est authentifié. */
function RequireAdmin({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return <div className="loading">Chargement…</div>;

  return (
    <>
      <NavBar />
      <Routes>
        {/* Le catalogue est la porte d'entrée publique du service (CDC §3). */}
        <Route path="/" element={<Catalogue />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/admin" element={<RequireAdmin><Dashboard /></RequireAdmin>} />
        <Route path="/admin/secteurs/:id" element={<RequireAdmin><SecteurDonnees /></RequireAdmin>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
