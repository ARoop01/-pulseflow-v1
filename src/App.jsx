import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import PatientApp from './components/PatientApp';
import PhysicianApp from './components/PhysicianApp';
import { api, clearSession, getStoredUser, saveSession } from './lib/api.js';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const cached = getStoredUser();
    if (!cached) {
      setLoading(false);
      return;
    }
    // Verify the HttpOnly cookie is still valid
    api.get('/users/me')
      .then((data) => setAuthUser(data.user || cached))
      .catch(() => { clearSession(); })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = (user, profileId) => {
    saveSession(user, profileId);
    setAuthUser(user);
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout', {}); } catch {}
    clearSession();
    setAuthUser(null);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'heartbeat 1.5s infinite' }}>💚</div>
        <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>PulseFlow</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Initialising platform...</p>
      </div>
    </div>
  );

  if (!authUser) return <Login onLogin={handleLogin} />;
  if (authUser.role === 'DOCTOR') return <PhysicianApp user={authUser} onLogout={handleLogout} />;
  return <PatientApp user={authUser} onLogout={handleLogout} />;
}
