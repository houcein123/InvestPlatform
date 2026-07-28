import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const { login, API_URL } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/api/admin/register' : '/api/admin/login';
    const body = isRegister
      ? { email, mot_de_passe: password, nom, prenom, role: 'admin' }
      : { email, mot_de_passe: password };

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Une erreur est survenue');
        return;
      }

      if (isRegister) {
        setIsRegister(false);
        setError('Compte créé ! Connectez-vous.');
        return;
      }

      login(data.token, data.admin);
    } catch (err) {
      setError('Erreur réseau. Le backend est-il démarré ?');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 InvestPlatform</h1>
        <h2 style={styles.subtitle}>{isRegister ? 'Créer un compte admin' : 'Connexion Admin'}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <>
              <input style={styles.input} placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} required />
              <input style={styles.input} placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} required />
            </>
          )}
          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={styles.input} type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit">
            {isRegister ? 'Créer le compte' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.toggle} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? 'Déjà un compte ? Se connecter' : 'Première connexion ? Créer un compte'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  card: { background: 'white', padding: 40, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: 400, maxWidth: '90%' },
  title: { textAlign: 'center', marginBottom: 8, color: '#333' },
  subtitle: { textAlign: 'center', marginBottom: 24, color: '#666', fontWeight: 400 },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  input: { padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 15, outline: 'none' },
  button: { padding: 14, borderRadius: 8, border: 'none', background: '#667eea', color: 'white', fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  error: { color: '#e74c3c', fontSize: 14, textAlign: 'center', margin: 0 },
  toggle: { textAlign: 'center', marginTop: 16, color: '#667eea', cursor: 'pointer', fontSize: 14 }
};
