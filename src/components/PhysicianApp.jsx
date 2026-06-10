import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { getSocket, disconnectSocket } from '../lib/socket.js';

// ── Schedule tab with appointment list + availability management ──────────────
function ScheduleTab({ appointments, doctorProfile }) {
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [newDate, setNewDate] = useState('');
  const [newSlot, setNewSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showAddSlot, setShowAddSlot] = useState(false);

  const PRESET_SLOTS = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM',
    '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'];

  // Build next 14 days for the date picker
  const upcomingDates = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 14);
    const results = [];
    const cursor = new Date(today);
    while (cursor <= cutoff) {
      results.push(`${WEEKDAY_NAMES[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}`);
      cursor.setDate(cursor.getDate() + 1);
    }
    return results;
  })();

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!newDate || !newSlot) { setSaveMsg('Select both a date and a time slot.'); return; }
    const doctorId = doctorProfile?.id;
    if (!doctorId) { setSaveMsg('Doctor profile not loaded yet.'); return; }
    setSaving(true);
    setSaveMsg('');
    try {
      await api.post(`/doctors/${doctorId}/availability`, { availableDate: newDate, timeSlot: newSlot });
      setSaveMsg(`Slot added: ${newDate} at ${newSlot}`);
      setNewDate('');
      setNewSlot('');
    } catch (err) {
      setSaveMsg('Failed to add slot: ' + (err.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add availability slot */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showAddSlot ? 20 : 0 }}>
          <h3 style={{ margin: 0 }}>Manage Availability</h3>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 14px' }} onClick={() => setShowAddSlot(p => !p)}>
            {showAddSlot ? 'Hide' : '+ Add Slot'}
          </button>
        </div>

        {showAddSlot && (
          <form onSubmit={handleAddSlot} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Date</label>
                <select
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                >
                  <option value="">Select date…</option>
                  {upcomingDates.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Time Slot</label>
                <select
                  value={newSlot}
                  onChange={e => setNewSlot(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }}
                >
                  <option value="">Select time…</option>
                  {PRESET_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {saveMsg && (
              <p style={{ fontSize: 13, margin: 0, color: saveMsg.startsWith('Failed') ? '#f87171' : 'var(--primary)' }}>{saveMsg}</p>
            )}
            <button className="btn-primary" type="submit" disabled={saving} style={{ alignSelf: 'flex-start', padding: '8px 20px' }}>
              {saving ? 'Adding…' : 'Add Availability Slot'}
            </button>
          </form>
        )}
      </div>

      {/* Appointments list */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 16 }}>Scheduled Appointments</h3>
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
            <p>No appointments yet. Patients can book once you have availability slots.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {appointments.map(appt => (
              <div key={appt.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-secondary)', border: '2px solid var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {appt.patient?.avatar ? <img src={appt.patient.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{appt.patient?.name || 'Patient'}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{appt.slot || appt.date}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{appt.type === 'INSTANT' ? '⚡ Rapido (Instant)' : '📅 Scheduled'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: appt.status === 'CONFIRMED' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: appt.status === 'CONFIRMED' ? 'var(--primary)' : 'var(--text-secondary)' }}>{appt.status}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{appt.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PhysicianApp({ user, onLogout }) {
  const [tab, setTab] = useState('dashboard');
  const [theme, setTheme] = useState('dark');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sessionEnding, setSessionEnding] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const chatEndRef = useRef(null);

  // Load doctor profile and appointments
  useEffect(() => {
    async function loadData() {
      try {
        const profileId = localStorage.getItem('pf_profile_id');
        const [profile, appts] = await Promise.all([
          api.get(`/doctors/${profileId}`),
          api.get('/appointments'),
        ]);
        setDoctorProfile(profile);
        setAppointments(appts);
      } catch (err) {
        console.error('[PhysicianApp] load error:', err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Socket.IO: join doctor notification room
  useEffect(() => {
    const profileId = localStorage.getItem('pf_profile_id');
    if (!profileId) return;
    const socket = getSocket();

    socket.emit('doctor:join', { doctorId: profileId });

    socket.on('consult:incoming', (request) => {
      setIncomingRequests(prev => {
        if (prev.find(r => r.token === request.token)) return prev;
        return [{ ...request, receivedAt: new Date() }, ...prev];
      });
      setTab('queue');
    });

    socket.on('session:started', ({ sessionId, doctorName, doctorAvatar }) => {
      setActiveSession(prev => prev ? { ...prev, sessionId } : null);
    });

    socket.on('chat:message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => {
      socket.off('consult:incoming');
      socket.off('session:started');
      socket.off('chat:message');
    };
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleAcceptRequest = (request) => {
    const profileId = localStorage.getItem('pf_profile_id');
    const socket = getSocket();
    socket.emit('consult:accept', {
      token: request.token,
      doctorId: profileId,
      doctorName: doctorProfile?.name || user.name,
      doctorAvatar: doctorProfile?.avatar || '',
    });
    setActiveSession({
      token: request.token,
      patientName: request.patientName,
      symptoms: request.symptoms,
      medicalIntake: request.medicalIntake,
    });
    setIncomingRequests(prev => prev.filter(r => r.token !== request.token));
    setChatMessages([]);
    setTab('session');
  };

  const handleDeclineRequest = (request) => {
    const socket = getSocket();
    socket.emit('consult:decline', { token: request.token });
    setIncomingRequests(prev => prev.filter(r => r.token !== request.token));
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeSession) return;
    const socket = getSocket();
    socket.emit('chat:message', {
      sessionId: activeSession.sessionId,
      text: chatInput.trim(),
      senderRole: 'DOCTOR',
      senderId: user.id,
      token: activeSession.token,
    });
    setChatMessages(prev => [...prev, { text: chatInput.trim(), senderRole: 'DOCTOR', sentAt: new Date() }]);
    setChatInput('');
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    setSessionEnding(true);
    try {
      let prescData = null;
      if (activeSession.sessionId) {
        const result = await api.post(`/sessions/${activeSession.sessionId}/end`, {});
        prescData = result.prescription;
      } else {
        prescData = {
          id: `REC-${Math.floor(Math.random() * 90000) + 10000}`,
          title: `Telehealth Session — ${activeSession.patientName}`,
          doctor: doctorProfile?.name || user.name,
          date: new Date().toISOString().split('T')[0],
          desc: `Consultation completed. Patient: ${activeSession.patientName}. Session closed by physician.`,
        };
      }
      if (activeSession.sessionId) {
        const socket = getSocket();
        socket.emit('session:ended', { sessionId: activeSession.sessionId, token: activeSession.token });
      }
      setPrescription(prescData);
      setActiveSession(null);
      setChatMessages([]);
      setTab('dashboard');
    } catch (err) {
      console.error('[EndSession]', err.message);
    } finally {
      setSessionEnding(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏥' },
    { id: 'queue', label: 'Live Queue', icon: '🚨', badge: incomingRequests.length },
    { id: 'schedule', label: 'My Schedule', icon: '📅' },
    ...(activeSession ? [{ id: 'session', label: 'Active Session', icon: '📹' }] : []),
    { id: 'profile', label: 'My Profile', icon: '👤' },
  ];

  const docName = doctorProfile?.name || user.name;
  const docAvatar = doctorProfile?.avatar;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16, animation: 'heartbeat 1.5s infinite' }}>🛡️</div>
        <h3 style={{ color: 'var(--secondary)', marginBottom: 8 }}>Physician Console</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading your clinical workspace...</p>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {/* Physician Sidebar */}
      <nav className="sidebar" style={{ borderRight: '1px solid rgba(14,165,233,0.15)' }}>
        <div className="brand">
          <span className="brand-logo" style={{ filter: 'hue-rotate(180deg)' }}>💙</span>
          <span className="brand-name">PulseFlow</span>
        </div>
        <div style={{ padding: '8px 16px', marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--secondary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Physician Portal</div>
        </div>
        <ul className="nav-menu">
          {navItems.map(item => (
            <li key={item.id} className={`nav-item ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)}
              style={item.id === 'session' ? { borderLeft: '3px solid var(--secondary)', background: 'rgba(14,165,233,0.08)' } : {}}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '2px 6px', minWidth: 18, textAlign: 'center' }}>{item.badge}</span>}
            </li>
          ))}
        </ul>
        <div className="sidebar-footer">
          {!doctorProfile?.isVerified && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--warning)', marginBottom: 10, lineHeight: 1.4 }}>
              ⏳ Credentials under review. You won't appear in patient directory until verified.
            </div>
          )}
          {doctorProfile?.isVerified && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: 11, color: 'var(--primary)', marginBottom: 10 }}>
              ✅ Verified Physician
            </div>
          )}
          <div className="profile-card">
            {docAvatar && <img src={docAvatar} alt={docName} className="profile-avatar" />}
            {!docAvatar && <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>}
            <div className="profile-info">
              <h4 style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 110, fontSize: 12 }}>{docName}</h4>
              <p style={{ fontSize: 10, color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 110 }}>{doctorProfile?.specialty || 'Physician'}</p>
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
              {tab === 'dashboard' && 'Physician Console'}
              {tab === 'queue' && 'Live Consultation Queue'}
              {tab === 'schedule' && 'My Appointment Schedule'}
              {tab === 'session' && 'Active Telehealth Session'}
              {tab === 'profile' && 'My Profile'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {tab === 'dashboard' && `Welcome, ${docName}. Your clinical workspace is active.`}
              {tab === 'queue' && 'Incoming Rapido consult requests — accept or decline in real time.'}
              {tab === 'schedule' && 'View and manage your upcoming patient appointments.'}
              {tab === 'session' && `Live session with ${activeSession?.patientName || 'Patient'}.`}
              {tab === 'profile' && 'Your physician profile and verification status.'}
            </p>
          </div>
          <div className="header-actions">
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>📅 {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <button className="theme-toggle" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'Appointments', value: appointments.length, unit: 'total', color: 'var(--secondary)', icon: '📅' },
                { label: 'Live Queue', value: incomingRequests.length, unit: 'pending', color: incomingRequests.length > 0 ? '#ef4444' : 'var(--primary)', icon: '🚨' },
                { label: 'Daily Capacity', value: doctorProfile ? Math.floor(doctorProfile.availableMinutesDaily / 60) + 'h' : '—', unit: 'available', color: 'var(--accent)', icon: '⏱️' },
                { label: 'Rating', value: doctorProfile?.rating?.toFixed(1) || '5.0', unit: '★', color: 'hsl(45,93%,47%)', icon: '⭐' },
              ].map(stat => (
                <div key={stat.label} className="glass-card vital-card" style={{ borderLeft: `4px solid ${stat.color}` }}>
                  <div className="vital-header">
                    <span className="vital-title">{stat.label}</span>
                    <span style={{ fontSize: 20 }}>{stat.icon}</span>
                  </div>
                  <div><span className="vital-value">{stat.value}<span className="vital-unit"> {stat.unit}</span></span></div>
                </div>
              ))}
            </div>

            {/* Incoming request alert */}
            {incomingRequests.length > 0 && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: '#f87171' }}>🚨 {incomingRequests.length} Incoming Rapido Request{incomingRequests.length > 1 ? 's' : ''}</h3>
                  <button className="btn-primary" onClick={() => setTab('queue')} style={{ background: '#ef4444' }}>View Queue</button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                  Patient{incomingRequests.length > 1 ? 's are' : ' is'} waiting for an instant consult. Switch to Live Queue to respond.
                </p>
              </div>
            )}

            {/* Recent Appointments */}
            <div className="glass-card">
              <h3 style={{ marginBottom: 16 }}>Recent Appointments</h3>
              {appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>📅</div>
                  <p>No appointments booked yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {appointments.slice(0, 5).map(appt => (
                    <div key={appt.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>👤</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{appt.patient?.name || 'Patient'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{appt.slot || appt.date}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12, background: appt.status === 'CONFIRMED' ? 'rgba(16,185,129,0.15)' : 'rgba(100,116,139,0.15)', color: appt.status === 'CONFIRMED' ? 'var(--primary)' : 'var(--text-secondary)' }}>{appt.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LIVE QUEUE ── */}
        {tab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', animation: 'pulseGlow 2s infinite' }}></span>
              <span style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>Socket.IO Connected — Listening for incoming Rapido requests</span>
            </div>

            {incomingRequests.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🩺</div>
                <h3 style={{ marginBottom: 8 }}>No Active Requests</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>When a patient dispatches a Rapido consult, it will appear here in real time.</p>
              </div>
            ) : (
              incomingRequests.map(req => (
                <div key={req.token} className="glass-card" style={{ border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulseGlow 1s infinite' }}></span>
                        <h3 style={{ margin: 0, fontSize: 16 }}>{req.patientName}</h3>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• {req.receivedAt ? new Date(req.receivedAt).toLocaleTimeString() : 'Just now'}</span>
                      </div>
                      <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>Instant Rapido Consult Request</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-secondary" onClick={() => handleDeclineRequest(req)} style={{ padding: '8px 18px', fontSize: 13 }}>Decline</button>
                      <button className="btn-primary" onClick={() => handleAcceptRequest(req)} style={{ padding: '8px 18px', fontSize: 13, background: 'var(--primary)' }}>Accept & Connect</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SYMPTOMS</div>
                      <div style={{ fontSize: 13 }}>{req.symptoms || 'Not specified'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>OCCUPATION</div>
                      <div style={{ fontSize: 13 }}>{req.medicalIntake?.occupation || '—'}</div>
                    </div>
                    <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>EXERTION LEVEL</div>
                      <div style={{ fontSize: 13 }}>{req.medicalIntake?.workExertion || '—'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── SCHEDULE ── */}
        {tab === 'schedule' && (
          <ScheduleTab appointments={appointments} doctorProfile={doctorProfile} />
        )}

        {/* ── ACTIVE SESSION ── */}
        {tab === 'session' && activeSession && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, height: 'calc(100vh - 180px)' }}>
            {/* Patient Info Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>
                  <div>
                    <h3 style={{ margin: 0 }}>{activeSession.patientName}</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--primary)' }}>🔴 Live Session Active</p>
                  </div>
                  <button onClick={handleEndSession} disabled={sessionEnding} className="btn-primary" style={{ marginLeft: 'auto', background: '#ef4444', padding: '8px 20px' }}>
                    {sessionEnding ? 'Ending...' : 'End Session & Issue Prescription'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CHIEF COMPLAINT</div>
                    <div style={{ fontSize: 13 }}>{activeSession.symptoms || 'Not specified'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>OCCUPATION</div>
                    <div style={{ fontSize: 13 }}>{activeSession.medicalIntake?.occupation || '—'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>EXERTION LEVEL</div>
                    <div style={{ fontSize: 13 }}>{activeSession.medicalIntake?.workExertion || '—'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>WORK HRS / WEEK</div>
                    <div style={{ fontSize: 13 }}>{activeSession.medicalIntake?.workHoursWeekly || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Video placeholder */}
              <div className="glass-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>📹</div>
                  <p style={{ fontSize: 14, fontWeight: 600 }}>Video Feed — {activeSession.patientName}</p>
                  <p style={{ fontSize: 12 }}>Live video simulation active</p>
                </div>
              </div>
            </div>

            {/* Chat Panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: 14 }}>Session Chat</div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {chatMessages.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 20 }}>Session started. Send a message to the patient.</p>}
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.senderRole === 'DOCTOR' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '80%', padding: '8px 12px', borderRadius: 12, fontSize: 13, background: msg.senderRole === 'DOCTOR' ? 'var(--secondary)' : 'var(--bg-secondary)', color: msg.senderRole === 'DOCTOR' ? '#fff' : 'var(--text-primary)' }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendChat} style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: 8 }}>
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: 13, outline: 'none' }} />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px' }}>Send</button>
              </form>
            </div>
          </div>
        )}

        {tab === 'session' && !activeSession && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📹</div>
            <h3 style={{ marginBottom: 8 }}>No Active Session</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Accept a Rapido request from the Live Queue to start a session.</p>
          </div>
        )}

        {/* ── PROFILE ── */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
            <div className="glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                {docAvatar
                  ? <img src={docAvatar} alt={docName} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--secondary)' }} />
                  : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛡️</div>
                }
                <div>
                  <h2 style={{ margin: '0 0 4px' }}>{docName}</h2>
                  <p style={{ color: 'var(--text-secondary)', margin: '0 0 8px', fontSize: 14 }}>{doctorProfile?.qualification}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12, background: doctorProfile?.isVerified ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: doctorProfile?.isVerified ? 'var(--primary)' : 'var(--warning)' }}>
                    {doctorProfile?.isVerified ? '✅ Verified Physician' : '⏳ Pending Verification'}
                  </span>
                </div>
              </div>
              {[
                ['Specialty', doctorProfile?.specialty],
                ['Workplace', doctorProfile?.workplace],
                ['Location', doctorProfile?.location],
                ['Consultation Fee', doctorProfile?.fee],
                ['Daily Availability', doctorProfile ? `${Math.floor(doctorProfile.availableMinutesDaily / 60)}h ${doctorProfile.availableMinutesDaily % 60 > 0 ? `${doctorProfile.availableMinutesDaily % 60}m` : ''}` : '—'],
                ['Experience', doctorProfile?.exp ? `${doctorProfile.exp} years` : '—'],
                ['Rating', doctorProfile?.rating ? `${doctorProfile.rating.toFixed(1)} ★ (${doctorProfile.reviews || 0} reviews)` : '—'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                  <span style={{ fontSize: 14 }}>{value || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Prescription issued overlay */}
      {prescription && (
        <div className="modal-overlay" onClick={() => setPrescription(null)}>
          <div className="glass-card modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--primary)' }}>Session Closed</h3>
              <button className="theme-toggle" onClick={() => setPrescription(null)}>✕</button>
            </div>
            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 32 }}>📝</span>
              <h4 style={{ fontSize: 18, marginTop: 10 }}>Prescription Issued to Patient</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>The consultation record has been added to the patient's Health Locker.</p>
            </div>
            <div style={{ margin: '20px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>RECORD ID</span>
                <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace' }}>{prescription.id}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AUTHORIZED BY</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{prescription.doctor}</span>
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setPrescription(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
