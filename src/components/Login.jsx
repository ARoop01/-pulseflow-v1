import React, { useState } from 'react';
import { api, saveSession } from '../lib/api.js';

const SPECIALTIES = ['General Health', 'Cardiology', 'Neurology', 'Pediatrics', 'Psychiatry', 'Dermatology', 'Orthopedics'];
const DEGREES = ['MBBS', 'MD (General Medicine)', 'DM (Cardiology)', 'DM (Neurology)', 'MD (Pediatrics)', 'MD (Psychiatry)', 'DNB', 'DCH', 'MS (Surgery)'];

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('landing'); // 'landing' | 'patient-login' | 'patient-register' | 'doctor-login' | 'doctor-register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Common register fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Doctor register extras
  const [specialty, setSpecialty] = useState('General Health');
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [workplace, setWorkplace] = useState('');
  const [location, setLocation] = useState('');
  const [feeInr, setFeeInr] = useState(800);
  const [credentialFile, setCredentialFile] = useState(null);
  const [licenseNumber, setLicenseNumber] = useState('');

  const reset = () => {
    setError('');
    setLoginEmail(''); setLoginPassword('');
    setName(''); setEmail(''); setPhone(''); setPassword('');
    setSpecialty('General Health'); setSelectedDegrees([]);
    setWorkplace(''); setLocation(''); setFeeInr(800);
    setCredentialFile(null); setLicenseNumber('');
  };

  const go = (m) => { reset(); setMode(m); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginEmail, password: loginPassword });
      const expectedRole = mode === 'doctor-login' ? 'DOCTOR' : 'PATIENT';
      if (res.user.role !== expectedRole) {
        setError(
          expectedRole === 'DOCTOR'
            ? 'This account is registered as a patient. Please use the Patient Login.'
            : 'This account is registered as a physician. Please use the Physician Login.'
        );
        return;
      }
      saveSession(res.token, res.user, res.profileId);
      onLogin(res.user);
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name, email, phone, password, role: 'PATIENT',
        medicalIntake: { occupation: 'Not specified', workHours: 40, workExertion: 'Moderate' },
      });
      saveSession(res.token, res.user, res.patientId);
      onLogin(res.user);
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!credentialFile) { setError('Please upload your degree / medical licence document to proceed.'); return; }
    if (selectedDegrees.length === 0) { setError('Please select at least one qualification degree.'); return; }
    setLoading(true);
    try {
      const docName = name.startsWith('Dr.') ? name : `Dr. ${name}`;
      const res = await api.post('/auth/register', {
        name: docName, email, phone, password, role: 'DOCTOR',
        doctorProfile: {
          department: specialty,
          specialty,
          qualification: selectedDegrees.join(', '),
          workplace: workplace || `Consultant at Care Hospital, ${location || 'India'}`,
          location: location || 'India',
          feeInr: parseInt(feeInr) || 800,
          availMinutes: 120,
          experienceYears: 5,
          degrees: selectedDegrees,
        },
      });
      saveSession(res.token, res.user, res.doctorId);
      onLogin(res.user);
    } catch (err) {
      setError(err.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleDegree = (d) => setSelectedDegrees(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)',
    background: 'var(--bg-secondary)', color: 'var(--text-primary)', WebkitTextFillColor: 'var(--text-primary)', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' };

  // ── LANDING ───────────────────────────────────────────────────────────────
  if (mode === 'landing') return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: 'radial-gradient(circle at 15% 25%, rgba(16,185,129,0.06) 0%, var(--bg-primary) 70%)' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 36, marginBottom: 10 }}>💚</div>
        <h1 style={{ fontSize: 38, fontWeight: 800, margin: 0 }}>PulseFlow</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 15 }}>India's connected telehealth platform</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, maxWidth: 820, width: '100%' }}>
        {/* Patient Portal */}
        <div className="glass-card" style={{ padding: 40, borderTop: '3px solid var(--primary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 44 }}>🟢</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Patient Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Book consultations, track vitals, store medical records, run symptom checks and access your wellness toolkit.
          </p>
          <ul style={{ color: 'var(--text-secondary)', fontSize: 12, paddingLeft: 18, margin: '4px 0', lineHeight: 2 }}>
            <li>Symptom Analyst & Department Routing</li>
            <li>Schedule with Verified Specialists</li>
            <li>Secure Health Locker</li>
            <li>Live Telehealth (Rapido & Scheduled)</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('patient-login')}>Login</button>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('patient-register')}>Register</button>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}
            onClick={async () => {
              try {
                const res = await api.post('/auth/login', { email: 'alex@pulseflow.in', password: 'pulseflow123' });
                saveSession(res.token, res.user, res.profileId);
                onLogin(res.user);
              } catch { }
            }}>
            ⚡ Demo: Continue as Alex Rivera (Patient)
          </button>
        </div>

        {/* Physician Portal */}
        <div className="glass-card" style={{ padding: 40, borderTop: '3px solid var(--secondary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 44 }}>🛡️</div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Physician Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            Manage your consultation queue, view patient records, run live telehealth sessions and track your appointment schedule.
          </p>
          <ul style={{ color: 'var(--text-secondary)', fontSize: 12, paddingLeft: 18, margin: '4px 0', lineHeight: 2 }}>
            <li>Real-time Rapido Consult Queue</li>
            <li>Appointment Schedule & Management</li>
            <li>In-session Patient Records Access</li>
            <li>Issue & Sign Prescriptions</li>
          </ul>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }} onClick={() => go('doctor-login')}>Login</button>
            <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => go('doctor-register')}>Register</button>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: 12, cursor: 'pointer', textAlign: 'left', padding: 0 }}
            onClick={async () => {
              try {
                const res = await api.post('/auth/login', { email: 'sharma@apollo.in', password: 'pulseflow123' });
                saveSession(res.token, res.user, res.profileId);
                onLogin(res.user);
              } catch { }
            }}>
            ⚡ Demo: Continue as Dr. Sharma (Physician)
          </button>
        </div>
      </div>
    </div>
  );

  // ── PATIENT LOGIN ─────────────────────────────────────────────────────────
  if (mode === 'patient-login') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🟢</div>
        <h2 style={{ margin: '0 0 4px' }}>Patient Login</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Sign in to your patient account</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="alex@example.com" /></div>
          <div><label style={labelStyle}>Password</label><input style={inputStyle} type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="Enter your password" /></div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          No account? <button onClick={() => go('patient-register')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Register here</button>
        </p>
      </div>
    </div>
  );

  // ── DOCTOR LOGIN ──────────────────────────────────────────────────────────
  if (mode === 'doctor-login') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
        <h2 style={{ margin: '0 0 4px' }}>Physician Login</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Sign in to your physician account</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required placeholder="doctor@hospital.in" /></div>
          <div><label style={labelStyle}>Password</label><input style={inputStyle} type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required placeholder="Enter your password" /></div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          Not registered? <button onClick={() => go('doctor-register')} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Apply as Physician</button>
        </p>
      </div>
    </div>
  );

  // ── PATIENT REGISTER ──────────────────────────────────────────────────────
  if (mode === 'patient-register') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)', overflowY: 'auto' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 40, margin: '20px 0' }}>
        <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🟢</div>
        <h2 style={{ margin: '0 0 4px' }}>Create Patient Account</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Join PulseFlow to manage your health journey</p>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>}
        <form onSubmit={handlePatientRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="Alex Rivera" /></div>
          <div><label style={labelStyle}>Email Address</label><input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" /></div>
          <div><label style={labelStyle}>Phone Number</label><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 98765 43210" /></div>
          <div><label style={labelStyle}>Password</label><input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} /></div>
          <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 8 }}>{loading ? 'Creating account...' : 'Create Account'}</button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 20 }}>
          Already registered? <button onClick={() => go('patient-login')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Sign in</button>
        </p>
      </div>
    </div>
  );

  // ── DOCTOR REGISTER ───────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg-primary)', overflowY: 'auto' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 560, padding: 40, margin: '20px 0' }}>
        <button onClick={() => go('landing')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, marginBottom: 24, padding: 0 }}>← Back</button>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🛡️</div>
        <h2 style={{ margin: '0 0 4px' }}>Physician Registration</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 8 }}>Your credentials will be reviewed before your profile goes live in the patient directory.</p>
        <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--secondary)', marginBottom: 24 }}>
          🔒 Credential document upload is mandatory. Unverified accounts are restricted from the patient directory until approved.
        </div>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>{error}</div>}
        <form onSubmit={handleDoctorRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Full Name</label><input style={inputStyle} value={name} onChange={e => setName(e.target.value)} required placeholder="Rajesh Sharma" /></div>
            <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} required placeholder="+91 99112 23344" /></div>
          </div>
          <div><label style={labelStyle}>Email Address</label><input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="doctor@hospital.in" /></div>
          <div><label style={labelStyle}>Password</label><input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" minLength={8} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Specialty</label>
              <select style={{ ...inputStyle }} value={specialty} onChange={e => setSpecialty(e.target.value)}>
                {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Consultation Fee (₹)</label><input style={inputStyle} type="number" value={feeInr} onChange={e => setFeeInr(e.target.value)} min={100} max={10000} /></div>
          </div>

          <div>
            <label style={labelStyle}>Qualifications / Degrees <span style={{ color: 'var(--primary)' }}>*</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEGREES.map(d => (
                <button key={d} type="button" onClick={() => toggleDegree(d)}
                  style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, border: '1px solid var(--border-color)', cursor: 'pointer',
                    background: selectedDegrees.includes(d) ? 'var(--secondary)' : 'var(--bg-secondary)',
                    color: selectedDegrees.includes(d) ? '#fff' : 'var(--text-secondary)' }}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div><label style={labelStyle}>Workplace / Hospital</label><input style={inputStyle} value={workplace} onChange={e => setWorkplace(e.target.value)} placeholder="Apollo Hospital, Delhi" /></div>
            <div><label style={labelStyle}>City, State</label><input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="Delhi, India" /></div>
          </div>

          <div><label style={labelStyle}>Medical Registration / Licence No.</label><input style={inputStyle} value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} placeholder="MCI-2019-DL-12345 (optional)" /></div>

          <div>
            <label style={{ ...labelStyle, color: credentialFile ? 'var(--primary)' : 'var(--warning)' }}>
              Degree / Licence Document Upload <span style={{ color: '#f87171' }}>* Required</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `2px dashed ${credentialFile ? 'var(--primary)' : 'rgba(245,158,11,0.5)'}`, borderRadius: 10, cursor: 'pointer', background: credentialFile ? 'rgba(16,185,129,0.05)' : 'rgba(245,158,11,0.04)' }}>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setCredentialFile(e.target.files[0] || null)} />
              <span style={{ fontSize: 24 }}>{credentialFile ? '✅' : '📄'}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: credentialFile ? 'var(--primary)' : 'var(--warning)' }}>
                  {credentialFile ? credentialFile.name : 'Click to upload certificate (PDF / JPG / PNG)'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Upload your MBBS degree, MD certificate, or medical registration certificate</div>
              </div>
            </label>
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center', marginTop: 4, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}>
            {loading ? 'Submitting application...' : 'Submit Physician Application'}
          </button>
        </form>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, marginTop: 16, lineHeight: 1.5 }}>
          By submitting, you confirm all provided credentials are authentic. False submissions will result in permanent account suspension.
        </p>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, marginTop: 12 }}>
          Already registered? <button onClick={() => go('doctor-login')} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontSize: 13, padding: 0 }}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
