import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { admin, logout, API_URL } = useAuth();
  const [secteurs, setSecteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const token = localStorage.getItem('admin_token');

  useEffect(() => {
    fetch(`${API_URL}/api/admin/secteurs`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => { setSecteurs(data.secteurs); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = (s) => {
    setEditId(s.id);
    setEditData({ nom: s.nom, description: s.description, prix_rapport: s.prix_rapport, est_actif: s.est_actif });
  };

  const saveEdit = async (id) => {
    const res = await fetch(`${API_URL}/api/admin/secteurs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(editData)
    });
    if (res.ok) {
      const data = await res.json();
      setSecteurs(secteurs.map(s => s.id === id ? data.secteur : s));
      setEditId(null);
    }
  };

  if (loading) return <div style={styles.loading}>Chargement...</div>;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>📊 Panneau Admin</h1>
          <p style={styles.headerSub}>InvestPlatform — Gestion des secteurs</p>
        </div>
        <div style={styles.userInfo}>
          <span>👤 {admin?.prenom} {admin?.nom}</span>
          <button style={styles.logoutBtn} onClick={logout}>Déconnexion</button>
        </div>
      </header>

      {/* STATS CARDS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{secteurs.length}</div>
          <div style={styles.statLabel}>Secteurs actifs</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{secteurs.filter(s => s.est_actif).length}</div>
          <div style={styles.statLabel}>En ligne</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{secteurs.filter(s => !s.est_actif).length}</div>
          <div style={styles.statLabel}>Hors ligne</div>
        </div>
      </div>

      {/* TABLE */}
      <div style={styles.tableCard}>
        <h2 style={styles.tableTitle}>🗂️ Gestion des secteurs</h2>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Nom</th>
              <th style={styles.th}>Description</th>
              <th style={styles.th}>Prix</th>
              <th style={styles.th}>Pages</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {secteurs.map(s => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}>{s.id}</td>
                <td style={styles.td}>
                  {editId === s.id
                    ? <input style={styles.editInput} value={editData.nom} onChange={e => setEditData({...editData, nom: e.target.value})} />
                    : s.nom}
                </td>
                <td style={styles.td}>
                  {editId === s.id
                    ? <input style={styles.editInput} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                    : <span style={styles.desc}>{s.description}</span>}
                </td>
                <td style={styles.td}>
                  {editId === s.id
                    ? <input style={{...styles.editInput, width: 80}} type="number" value={editData.prix_rapport} onChange={e => setEditData({...editData, prix_rapport: parseFloat(e.target.value)})} />
                    : `${s.prix_rapport} TND`}
                </td>
                <td style={styles.td}>{s.nombre_pages}</td>
                <td style={styles.td}>
                  <span style={{...styles.badge, background: s.est_actif ? '#d4edda' : '#f8d7da', color: s.est_actif ? '#155724' : '#721c24'}}>
                    {s.est_actif ? '✅ Actif' : '❌ Inactif'}
                  </span>
                </td>
                <td style={styles.td}>
                  {editId === s.id ? (
                    <button style={styles.saveBtn} onClick={() => saveEdit(s.id)}>💾 Sauver</button>
                  ) : (
                    <button style={styles.editBtn} onClick={() => startEdit(s)}>✏️ Modifier</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 24, maxWidth: 1200, margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: 18 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #e5e7eb' },
  headerTitle: { fontSize: 24, color: '#1f2937' },
  headerSub: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 16 },
  logoutBtn: { padding: '8px 16px', borderRadius: 8, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 500 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  statCard: { background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statNumber: { fontSize: 32, fontWeight: 700, color: '#667eea' },
  statLabel: { color: '#6b7280', fontSize: 14, marginTop: 4 },
  tableCard: { background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: 24, overflow: 'auto' },
  tableTitle: { fontSize: 18, marginBottom: 16, color: '#1f2937' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  thead: { background: '#f9fafb' },
  th: { padding: 12, textAlign: 'left', fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: 12, color: '#4b5563' },
  desc: { maxWidth: 300, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badge: { padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
  editBtn: { padding: '6px 12px', borderRadius: 6, border: '1px solid #667eea', background: 'white', color: '#667eea', cursor: 'pointer', fontSize: 13 },
  saveBtn: { padding: '6px 12px', borderRadius: 6, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontSize: 13 },
  editInput: { padding: 6, borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, width: '100%' }
};
