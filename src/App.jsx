import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import SymptomChecker from './components/SymptomChecker';
import Scheduler from './components/Scheduler';
import HealthLocker from './components/HealthLocker';
import Telehealth from './components/Telehealth';
import WellnessToolkit from './components/WellnessToolkit';
import Onboarding from './components/Onboarding';
import { api, saveSession, clearSession, getStoredUser, isLoggedIn } from './lib/api.js';

export default function App() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [simulatorMode, setSimulatorMode] = useState('patient'); // 'patient' or 'doctor'
  const [activeRequest, setActiveRequest] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [filterDept, setFilterDept] = useState('All');
  const [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true);

  // User profiles
  const [patientUser, setPatientUser] = useState(null);
  const [doctorUser, setDoctorUser] = useState(null);

  // App data
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [lockerFiles, setLockerFiles] = useState([]);

  // Telehealth session states
  const [activeSession, setActiveSession] = useState(null);
  const [prescriptionReceipt, setPrescriptionReceipt] = useState(null);

  // ── Bootstrap: load seeded data on mount ──────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        // Always load the doctor directory (public)
        const doctorList = await api.get('/doctors');
        setDoctors(doctorList);

        // Auto-login as demo patient for simulator experience
        const res = await api.post('/auth/login', {
          email: 'alex@pulseflow.in',
          password: 'pulseflow123',
        });
        saveSession(res.token, res.user, res.profileId);

        // Load patient profile
        const profile = await api.get('/patients/me');
        setPatientUser({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: 'patient',
          avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
          medicalIntake: profile.medicalIntake,
        });

        // Load appointments
        const appts = await api.get('/appointments');
        setAppointments(appts);

        // Load health records
        const records = await api.get('/health-records');
        setLockerFiles(records);

        // Set default doctor user (Dr. Sharma for simulator, fallback to first doctor)
        const sharma = doctorList.find((d) => d.id === 'dr-sharma') || doctorList[0];
        if (sharma) {
          setDoctorUser({
            id: sharma.id,
            name: sharma.name,
            email: sharma.email,
            phone: sharma.phone,
            role: 'doctor',
            avatar: sharma.avatar,
            qualification: sharma.qualification,
            specialty: sharma.specialty,
            department: sharma.specialty,
            availMinutes: sharma.availableMinutesDaily,
            fee: sharma.fee,
            location: sharma.location,
            workplace: sharma.workplace,
          });
        }

        setIsRegistered(true);
      } catch (err) {
        console.error('[Bootstrap] error:', err.message);
        // Fall back to showing onboarding if auto-login fails
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  // Sync theme with HTML data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const addAppointment = (appt) => {
    setAppointments((prev) => [appt, ...prev]);
  };

  const addLockerFile = (file) => {
    setLockerFiles((prev) => [file, ...prev]);
  };

  const selectDoctorForConsult = (appt) => {
    setActiveSession(appt);
    setTab('telehealth');
  };

  const handleEndTelehealthCall = async () => {
    if (!activeSession) return;

    try {
      // If there's a real session ID, call the API to end it
      if (activeSession.sessionId) {
        const result = await api.post(`/sessions/${activeSession.sessionId}/end`, {});
        if (result.prescription) {
          addLockerFile(result.prescription);
          setPrescriptionReceipt(result.prescription);
        }
      } else {
        // Fallback: generate a local prescription receipt
        const prescId = `REC-${Math.floor(Math.random() * 90000) + 10000}`;
        const newPresc = {
          id: prescId,
          title: `Clinical Consultation - ${activeSession.doctor?.name || 'Doctor'}`,
          category: 'Prescriptions',
          doctor: activeSession.doctor?.name || 'Doctor',
          date: new Date().toISOString().split('T')[0],
          desc: `Telehealth follow-up consult summary notes. Authorized by ${activeSession.doctor?.name || 'your doctor'} at ${activeSession.doctor?.workplace || 'Apollo Clinic'}. Advised active recovery rest cycle.`,
        };
        addLockerFile(newPresc);
        setPrescriptionReceipt(newPresc);
      }
    } catch (err) {
      console.error('[EndCall]', err.message);
    }

    setActiveSession(null);
    setActiveRequest(null);
  };

  // Onboarding complete handler
  const handleOnboardingComplete = async (userData, medicalData, attachments) => {
    try {
      if (userData.role === 'patient') {
        const res = await api.post('/auth/register', {
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password || 'pulseflow123',
          role: 'PATIENT',
          avatarUrl: userData.avatar,
          medicalIntake: medicalData,
        });

        saveSession(res.token, res.user, res.patientId);

        const profile = await api.get('/patients/me');
        setPatientUser({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          role: 'patient',
          avatar: profile.avatar || userData.avatar,
          medicalIntake: profile.medicalIntake,
        });

        if (attachments?.length) {
          setLockerFiles((prev) => [...attachments, ...prev]);
        }

        setIsRegistered(true);
        setSimulatorMode('patient');
        setTab('dashboard');
      } else if (userData.role === 'doctor') {
        const res = await api.post('/auth/register', {
          name: userData.name.startsWith('Dr.') ? userData.name : `Dr. ${userData.name}`,
          email: userData.email,
          phone: userData.phone,
          password: userData.password || 'pulseflow123',
          role: 'DOCTOR',
          doctorProfile: {
            department: userData.department,
            specialty: userData.department,
            qualification: userData.qualification,
            workplace: userData.workplace,
            location: userData.location,
            feeInr: parseInt(userData.fee?.replace(/[^\d]/g, '')) || 800,
            availMinutes: userData.availMinutes,
          },
        });

        saveSession(res.token, res.user, res.doctorId);

        // Refresh doctor list
        const updatedDoctors = await api.get('/doctors');
        setDoctors(updatedDoctors);

        const newDoc = updatedDoctors.find((d) => d.email === userData.email);
        if (newDoc) {
          setDoctorUser({
            id: newDoc.id,
            name: newDoc.name,
            email: newDoc.email,
            phone: newDoc.phone,
            role: 'doctor',
            avatar: newDoc.avatar,
            qualification: newDoc.qualification,
            specialty: newDoc.specialty,
            department: newDoc.specialty,
            availMinutes: newDoc.availableMinutesDaily,
            fee: newDoc.fee,
            location: newDoc.location,
            workplace: newDoc.workplace,
          });
        }

        setIsRegistered(true);
        setSimulatorMode('doctor');
        setTab('scheduler');
      }
    } catch (err) {
      console.error('[Onboarding]', err.message);
      // If email already registered, skip to demo mode
      setIsRegistered(true);
      setTab('dashboard');
    }
  };

  // Resolve active display details based on simulator role
  const currentUser = simulatorMode === 'patient' ? patientUser : doctorUser;

  const displayUser = currentUser
    ? {
        name: currentUser.name,
        avatar: currentUser.avatar,
        subtitle:
          currentUser.role === 'doctor'
            ? currentUser.qualification
            : currentUser.medicalIntake?.occupation || 'Patient Dashboard',
      }
    : {
        name: 'Guest User',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        subtitle: 'Not Registered',
      };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'symptoms', label: 'Symptom Analyst', icon: '🩺' },
    { id: 'scheduler', label: 'Consult Scheduler', icon: '🗓️' },
    { id: 'telehealth', label: 'Video Booth', icon: '📹' },
    { id: 'locker', label: 'Health Locker', icon: '🗄️' },
    { id: 'wellness', label: 'Wellness Hub', icon: '💚' },
  ];

  // Loading screen
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: 'heartbeat 1.5s infinite' }}>💚</div>
          <h3 style={{ color: 'var(--primary)', marginBottom: 8 }}>PulseFlow</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Connecting to platform...</p>
        </div>
      </div>
    );
  }

  // Full-screen onboarding
  if (!isRegistered) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10000 }}>
          <button
            onClick={() => setIsRegistered(true)}
            className="btn-primary"
            style={{ padding: '10px 20px', borderRadius: 30, background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
          >
            ⚡ Bypass to Live Simulation Mode
          </button>
        </div>
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="app-container">

      {/* Floating Glassmorphic Simulator Control Center */}
      <div className="simulator-control-panel">
        <div className="simulator-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20, animation: 'heartbeat 1.5s infinite' }}>📡</span>
            <div>
              <h5 style={{ margin: 0, fontWeight: 700, letterSpacing: '0.05em', color: 'white' }}>PULSEFLOW REAL-TIME SIMULATOR</h5>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)' }}>Simulate dual Patient & Doctor apps simultaneously</p>
            </div>
          </div>

          <div className="simulator-toggle-group">
            <button
              className={`sim-toggle-btn patient ${simulatorMode === 'patient' ? 'active' : ''}`}
              onClick={() => setSimulatorMode('patient')}
            >
              🟢 Patient App Mode
            </button>
            <button
              className={`sim-toggle-btn doctor ${simulatorMode === 'doctor' ? 'active' : ''}`}
              onClick={async () => {
                setSimulatorMode('doctor');
                if (!doctorUser?.id) {
                  const sharma = doctors.find((d) => d.id === 'dr-sharma');
                  if (sharma) {
                    setDoctorUser({
                      id: sharma.id,
                      name: sharma.name,
                      email: sharma.email,
                      phone: sharma.phone,
                      role: 'doctor',
                      avatar: sharma.avatar,
                      qualification: sharma.qualification,
                      specialty: sharma.specialty,
                      department: sharma.specialty,
                      availMinutes: sharma.availableMinutesDaily,
                      fee: sharma.fee,
                      location: sharma.location,
                      workplace: sharma.workplace,
                    });
                  }
                }
              }}
            >
              🛡️ Physician App Mode
            </button>
          </div>

          <button
            className="sim-reset-btn"
            onClick={() => {
              clearSession();
              setIsRegistered(false);
              setActiveRequest(null);
              setActiveSession(null);
              setPatientUser(null);
              setDoctorUser(null);
              setAppointments([]);
              setLockerFiles([]);
              setLoading(true);
              // Re-bootstrap with demo data
              setTimeout(() => window.location.reload(), 100);
            }}
            title="Reset Profiles and Register Custom User"
          >
            🔄 Reset Portal
          </button>
        </div>

        {/* Live log ticker */}
        <div className="simulator-ticker">
          <span className="ticker-badge">PIPELINE dispatch</span>
          <div className="ticker-text">
            {activeRequest ? (
              activeRequest.status === 'pending' ? (
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                  ⚠️ [RADAR DISPATCHED] {activeRequest.patientName} requested instant consult with {activeRequest.doctorName}. Switch to Physician App to Accept!
                </span>
              ) : (
                <span style={{ color: '#10b981', fontWeight: 600 }}>
                  🟢 [CONNECTED] Live session between {activeRequest.patientName} & {activeRequest.doctorName} is active. Feeds are synchronized.
                </span>
              )
            ) : (
              <span style={{ color: 'var(--text-secondary)' }}>
                📡 System Online & Listening. Request an "Instant Live Telehealth (Rapido Mode)" consult in the Patient App to dispatch biometrics.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar" style={{ marginTop: 90 }}>
        <div className="brand">
          <span className="brand-logo">💚</span>
          <span className="brand-name">PulseFlow</span>
        </div>

        <ul className="nav-menu">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={`nav-item ${tab === item.id ? 'active' : ''}`}
              onClick={() => setTab(item.id)}
            >
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
              <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 110 }} title={displayUser.subtitle}>
                {displayUser.subtitle}
              </p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
            PulseFlow India © 2026
          </p>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-viewport" style={{ marginTop: 90 }}>
        <header className="view-header">
          <div className="header-meta">
            <h1>
              {tab === 'dashboard' && (simulatorMode === 'doctor' ? 'Physician Control Console' : 'Patient Hub')}
              {tab === 'symptoms' && 'Symptom Analyst'}
              {tab === 'scheduler' && 'Appointment Scheduler'}
              {tab === 'telehealth' && 'Simulated Video Booth'}
              {tab === 'locker' && 'Secure Health Locker'}
              {tab === 'wellness' && 'Mindfulness Toolkit'}
            </h1>
            <p>
              {tab === 'dashboard' && (simulatorMode === 'doctor' ? `Welcome back, ${currentUser?.name || 'Doctor'}. Practice platform telemetry is active.` : `Welcome back, ${currentUser?.name || 'Alex'}. Telemetry modules are active.`)}
              {tab === 'symptoms' && 'Complete your biometric check to generate home care indicators.'}
              {tab === 'scheduler' && 'Book visual consultations with verified medical specialists.'}
              {tab === 'telehealth' && 'High-fidelity simulation suite for telehealth video consulting.'}
              {tab === 'locker' && 'Manage your secure medical records cabinet and prescriptions.'}
              {tab === 'wellness' && 'Practice restorative box breathing and track daily hydration indices.'}
            </p>
          </div>

          <div className="header-actions">
            <div style={{ textRendering: 'optimizeLegibility', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>
              📅 May 25, 2026
            </div>
            <button className="theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </header>

        {tab === 'dashboard' && (
          <Dashboard
            appointments={appointments}
            setTab={setTab}
            selectDoctorForConsult={selectDoctorForConsult}
            currentUser={currentUser}
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
            setActiveSession={setActiveSession}
            patientUser={patientUser}
          />
        )}
        {tab === 'symptoms' && (
          <SymptomChecker setTab={setTab} setFilterDept={setFilterDept} />
        )}
        {tab === 'scheduler' && (
          <Scheduler
            addAppointment={addAppointment}
            filterDept={filterDept}
            setFilterDept={setFilterDept}
            doctors={doctors}
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
            setTab={setTab}
            patientUser={patientUser}
          />
        )}
        {tab === 'telehealth' && (
          <Telehealth
            activeSession={activeSession}
            endSession={handleEndTelehealthCall}
            setTab={setTab}
            simulatorMode={simulatorMode}
            activeRequest={activeRequest}
            setActiveRequest={setActiveRequest}
            setActiveSession={setActiveSession}
            patientUser={patientUser}
            doctorUser={doctorUser}
          />
        )}
        {tab === 'locker' && (
          <HealthLocker lockerFiles={lockerFiles} addLockerFile={addLockerFile} />
        )}
        {tab === 'wellness' && <WellnessToolkit />}
      </main>

      {/* Prescription Receipt Overlay */}
      {prescriptionReceipt && (
        <div className="modal-overlay" onClick={() => setPrescriptionReceipt(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--primary)' }}>Consultation Concluded</h3>
              <button className="theme-toggle" onClick={() => setPrescriptionReceipt(null)}>✕</button>
            </div>

            <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: 32 }}>📝</span>
              <h4 style={{ fontSize: 18, marginTop: 10 }}>Medical Consultation Record Generated</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Your provider has compiled and signed your prescription log.
              </p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TYPE</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>📄 Prescription</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>CLINICAL SUMMARY NOTE</span>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8, border: '1px solid var(--border-color)', lineHeight: 1.4 }}>
                  {prescriptionReceipt.desc}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setPrescriptionReceipt(null)}>
                Dismiss
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { setTab('locker'); setPrescriptionReceipt(null); }}
              >
                Go to Locker ➜
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
