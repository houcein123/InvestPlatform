import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Catalogue from './pages/Catalogue';
function App() {
  const { admin, loading } = useAuth();

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <Routes>
      <Route path="/login" element={admin ? <Navigate to="/dashboard" /> : <LoginPage />} />
      <Route path="/dashboard" element={admin ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={admin ? "/dashboard" : "/login"} />} />
      <Route path="/catalogue" element={<Catalogue />} />
    </Routes>
  );
}

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18 }
};

export default App;
