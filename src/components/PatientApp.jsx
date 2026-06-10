import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import SymptomChecker from './SymptomChecker';
import Scheduler from './Scheduler';
import HealthLocker from './HealthLocker';
import Telehealth from './Telehealth';
import WellnessToolkit from './WellnessToolkit';
import { api } from '../lib/api.js';

export default function PatientApp({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [filterDept, setFilterDept] = useState('All');
  const [theme, setTheme] = useState('dark');

  const [patientUser, setPatientUser] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [lockerFiles, setLockerFiles] = useState([]);

  const [activeSession, setActiveSession] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [prescriptionReceipt, setPrescriptionReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile state
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [doctorList, profile, appts, records] = await Promise.all([
          api.get('/doctors'),
          api.get('/patients/me'),
          api.get('/appointments'),
          api.get('/health-records'),
        ]);

        setDoctors(doctorList);
        setPatientUser({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: 'patient',
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          medicalIntake: profile.medicalIntake,
        });
        setAppointments(appts);
        setLockerFiles(records);
      } catch (err) {
        console.error('[PatientApp] load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  const addAppointment = (appt) => setAppointments(prev => [appt, ...prev]);
  const addLockerFile = (file) => setLockerFiles(prev => [file, ...prev]);
  const selectDoctorForConsult = (appt) => { setActiveSession(appt); setTab('telehealth'); };

  const handleEndTelehealthCall = async () => {
    if (!activeSession) return;
    try {
      if (activeSession.sessionId) {
        const result = await api.post(`/sessions/${activeSession.sessionId}/end`, {});
        if (result.prescription) { addLockerFile(result.prescription); setPrescriptionReceipt(result.prescription); }
      } else {
        const prescId = `REC-${Math.floor(Math.random() * 90000) + 10000}`;
        const newPresc = {
          id: prescId,
          title: `Clinical Consultation — ${activeSession.doctor?.name || 'Doctor'}`,
          category: 'Prescriptions',
          doctor: activeSession.doctor?.name || 'Doctor',
          date: new Date().toISOString().split('T')[0],
          desc: `Telehealth consult summary. Authorized by ${activeSession.doctor?.name || 'your doctor'} at ${activeSession.doctor?.workplace || 'Apollo Clinic'}.`,
        };
        addLockerFile(newPresc);
        setPrescriptionReceipt(newPresc);
      }
    } catch (err) { console.error('[EndCall]', err.message); }
    setActiveSession(null);
    setActiveRequest(null);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await api.postForm('/users/avatar', formData);
      setPatientUser(prev => ({ ...prev, avatar: res.avatarUrl }));
      setProfileMsg('Photo updated successfully.');
    } catch (err) {
      setProfileMsg('Upload failed: ' + (err.data?.error || err.message));
    } finally {
      setProfileSaving(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'symptoms', label: 'Symptom Analyst', icon: '🩺' },
    { id: 'scheduler', label: 'Consult Scheduler', icon: '🗓️' },
    { id: 'telehealth', label: 'Video Booth', icon: '📹' },
    { id: 'locker', label: 'Health Locker', icon: '🗄️' },
    { id: 'wellness', label: 'Wellness Hub', icon: '💚' },
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const displayUser = patientUser || { name: user.name, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256', medicalIntake: null };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'heartbeat 1.5s infinite' }}>💚</div>
        <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>PulseFlow</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading your health data...</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Sidebar */}
      <nav className="sidebar">
        <div className="brand">
          <span className="brand-logo">💚</span>
          <span className="brand-name">PulseFlow</span>
        </div>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          <div className="profile-card">
            <img src={displayUser.avatar} alt={displayUser.name} className="profile-avatar" />
            <div className="profile-info">
              <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 110 }}>{displayUser.name}</h4>
              <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 110, fontSize: 11, color: 'var(--text-secondary)' }}>
                {displayUser.medicalIntake?.occupation || 'Patient'}
              </p>
            </div>
          </div>
          <button onClick={onLogout} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', marginTop: 8 }}>
            Sign Out
          </button>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>PulseFlow India © 2026</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-viewport">
        <header className="view-header">
          <div className="header-meta">
            <h1>
              {tab === 'dashboard' && 'Patient Hub'}
              {tab === 'symptoms' && 'Symptom Analyst'}
              {tab === 'scheduler' && 'Appointment Scheduler'}
              {tab === 'telehealth' && 'Simulated Video Booth'}
              {tab === 'locker' && 'Secure Health Locker'}
              {tab === 'wellness' && 'Mindfulness Toolkit'}
              {tab === 'profile' && 'My Profile'}
            </h1>
            <p>
              {tab === 'dashboard' && `Welcome back, ${displayUser.name}. Telemetry modules are active.`}
              {tab === 'symptoms' && 'Complete your biometric check to generate home care indicators.'}
              {tab === 'scheduler' && 'Book visual consultations with verified medical specialists.'}
              {tab === 'telehealth' && 'High-fidelity simulation suite for telehealth video consulting.'}
              {tab === 'locker' && 'Manage your secure medical records cabinet and prescriptions.'}
              {tab === 'wellness' && 'Practice restorative box breathing and track daily hydration.'}
              {tab === 'profile' && 'Manage your account information and profile photo.'}
            </p>
          </div>
          <div className="header-actions">
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle Theme">{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {tab === 'dashboard' && <Dashboard appointments={appointments} setTab={setTab} selectDoctorForConsult={selectDoctorForConsult} currentUser={patientUser} activeRequest={activeRequest} setActiveRequest={setActiveRequest} setActiveSession={setActiveSession} patientUser={patientUser} />}
        {tab === 'symptoms' && <SymptomChecker setTab={setTab} setFilterDept={setFilterDept} />}
        {tab === 'scheduler' && <Scheduler addAppointment={addAppointment} filterDept={filterDept} setFilterDept={setFilterDept} doctors={doctors} activeRequest={activeRequest} setActiveRequest={setActiveRequest} setTab={setTab} patientUser={patientUser} />}
        {tab === 'telehealth' && <Telehealth activeSession={activeSession} endSession={handleEndTelehealthCall} setTab={setTab} simulatorMode="patient" activeRequest={activeRequest} setActiveRequest={setActiveRequest} setActiveSession={setActiveSession} patientUser={patientUser} doctorUser={null} />}
        {tab === 'locker' && <HealthLocker lockerFiles={lockerFiles} addLockerFile={addLockerFile} />}
        {tab === 'wellness' && <WellnessToolkit />}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
            <div className="glass-card">
              {/* Avatar section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={displayUser.avatar}
                    alt={displayUser.name}
                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }}
                  />
                  <label style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg-primary)' }} title="Change photo">
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} disabled={profileSaving} />
                    <span style={{ fontSize: 12 }}>📷</span>
                  </label>
                </div>
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>{displayUser.name}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: '0 0 6px' }}>{displayUser.email}</p>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', fontWeight: 600 }}>Patient Account</span>
                </div>
              </div>

              {profileSaving && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>Uploading photo...</p>}
              {profileMsg && (
                <div style={{ padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 13, background: profileMsg.startsWith('Upload failed') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: profileMsg.startsWith('Upload failed') ? '#f87171' : 'var(--primary)' }}>
                  {profileMsg}
                </div>
              )}

              {/* Profile details */}
              {[
                ['Full Name', displayUser.name],
                ['Email', displayUser.email],
                ['Phone', displayUser.phone || '—'],
                ['Occupation', displayUser.medicalIntake?.occupation || '—'],
                ['Work Exertion', displayUser.medicalIntake?.workExertion || '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}

              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  To update your photo, click the 📷 icon on the avatar. Accepted formats: JPG, PNG, WebP (max 10 MB).
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Prescription Receipt Overlay */}
      {prescriptionReceipt && (
        <div className="modal-overlay" onClick={() => setPrescriptionReceipt(null)}>
          <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--primary)' }}>Consultation Concluded</h3>
              <button className="theme-toggle" onClick={() => setPrescriptionReceipt(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 32 }}>📝</span>
              <h4 style={{ fontSize: 18, marginTop: 10 }}>Medical Consultation Record Generated</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Your provider has compiled and signed your prescription log.</p>
            </div>
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>RECORD AUTHOR</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{prescriptionReceipt.doctor}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>RECORD ID</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{prescriptionReceipt.id}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CLINICAL SUMMARY</span>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', lineHeight: 1.4 }}>{prescriptionReceipt.desc}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPrescriptionReceipt(null)}>Dismiss</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => { setTab('locker'); setPrescriptionReceipt(null); }}>Go to Locker ➜</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
