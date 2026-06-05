import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import PatientApp from './components/PatientApp';
import PhysicianApp from './components/PhysicianApp';
import { clearSession, getStoredUser } from './lib/api.js';

export default function App() {
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    const user = getStoredUser();
    const token = localStorage.getItem('pf_token');
    if (user && token) setAuthUser(user);
    setLoading(false);
  }, []);

  const handleLogout = () => {
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

  if (!authUser) return <Login onLogin={setAuthUser} />;
  if (authUser.role === 'DOCTOR') return <PhysicianApp user={authUser} onLogout={handleLogout} />;
  return <PatientApp user={authUser} onLogout={handleLogout} />;
}
