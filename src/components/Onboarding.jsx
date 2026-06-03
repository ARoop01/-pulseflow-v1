import React, { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [role, setRole] = useState(null); // 'patient' or 'doctor'
  const [step, setStep] = useState(1);

  // Common Registration State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState(''); // mainly for doctor

  // Patient Intake State
  const [selectedHereditary, setSelectedHereditary] = useState([]);
  const [customHereditary, setCustomHereditary] = useState('');
  const [occupation, setOccupation] = useState('Desk Job');
  const [workHours, setWorkHours] = useState(40);
  const [workExertion, setWorkExertion] = useState('Moderate');
  const [selectedExposures, setSelectedExposures] = useState([]);
  const [personalHistory, setPersonalHistory] = useState('');
  const [mockFileName, setMockFileName] = useState('');

  // Doctor Registration State
  const [selectedDegrees, setSelectedDegrees] = useState([]);
  const [department, setDepartment] = useState('General Health');
  const [availMinutes, setAvailMinutes] = useState(120); // default 2 hours (10m to 480m)
  const [consultFee, setConsultFee] = useState(800);
  const [mockCertName, setMockCertName] = useState('');

  // Predefined lists
  const hereditaryDiseases = [
    'High Blood Pressure',
    'Diabetes (Type 1/2)',
    'Asthma / COPD',
    'Coronary Heart Disease',
    'Cancer History',
    'Rheumatoid Arthritis',
    'Thalassemia / Anemia'
  ];

  const exposureElements = [
    { id: 'sun', label: '☀️ Prolonged Sun / UV' },
    { id: 'dust', label: '💨 Heavy Dust / Silica' },
    { id: 'chemical', label: '🧪 Chemical Fumes / Acids' },
    { id: 'noise', label: '🔊 Loud Noise' },
    { id: 'cold_heat', label: '❄️ Extreme Cold / Heat' },
    { id: 'screens', label: '💻 Screen Blue Light' }
  ];

  const availableDegrees = [
    'MBBS', 'MD (General Medicine)', 'DM (Cardiology)', 'DM (Neurology)', 
    'MD (Pediatrics)', 'MD (Psychiatry)', 'DNB', 'DCH'
  ];

  // Convert minutes slider to hours/minutes representation
  const formatAvailability = (mins) => {
    if (mins < 60) return `${mins} Minutes`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'} ${remainingMins} Min` : `${hrs} ${hrs === 1 ? 'Hour' : 'Hours'}`;
  };

  const handleToggleHereditary = (disease) => {
    setSelectedHereditary(prev => 
      prev.includes(disease) ? prev.filter(d => d !== disease) : [...prev, disease]
    );
  };

  const handleToggleDegree = (deg) => {
    setSelectedDegrees(prev => 
      prev.includes(deg) ? prev.filter(d => d !== deg) : [...prev, deg]
    );
  };

  const handleToggleExposure = (expId) => {
    setSelectedExposures(prev => 
      prev.includes(expId) ? prev.filter(e => e !== expId) : [...prev, expId]
    );
  };

  const handleBaseSubmit = (e) => {
    e.preventDefault();
    if (!name || !phone || !email || !password) return;
    setStep(2);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();

    if (role === 'patient') {
      const patientData = {
        name,
        phone,
        email,
        role: 'patient',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
      };

      const medicalIntake = {
        hereditary: [...selectedHereditary, ...(customHereditary ? [customHereditary] : [])],
        occupation,
        workHours,
        workExertion,
        exposures: selectedExposures,
        personalHistory
      };

      const attachments = mockFileName ? [{
        id: `REC-${Math.floor(Math.random() * 90000) + 10000}`,
        title: `Patient Intake: ${mockFileName}`,
        category: 'Prescriptions',
        doctor: 'Self-Uploaded Intake Record',
        date: new Date().toISOString().split('T')[0],
        desc: `Intake clinical records uploaded during patient registration. Personal medical history logged: ${personalHistory || 'No previous history reported'}.`
      }] : [];

      onComplete(patientData, medicalIntake, attachments);
    } else {
      // Doctor Path Submission
      const qualificationString = selectedDegrees.join(', ') || 'MBBS';
      
      const doctorData = {
        name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
        phone,
        email,
        location,
        role: 'doctor',
        qualification: qualificationString,
        department,
        availMinutes,
        fee: `₹${consultFee.toLocaleString('en-IN')}`,
        workplace: `Consultant Specialist at Care Hospital, ${location || 'India'}`,
        certFile: mockCertName
      };

      onComplete(doctorData, null, null);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      background: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.05) 0%, rgba(11, 19, 41, 1) 90%)',
      animation: 'fadeIn 0.5s'
    }}>
      
      {/* 1. DUAL SELECTOR PAGE */}
      {!role && (
        <div style={{ maxWidth: 840, width: '100%', textAlign: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
            Welcome to the PulseFlow Ecosystem
          </span>
          <h1 style={{ fontSize: 38, marginTop: 8, marginBottom: 12, fontFamily: 'var(--font-display)' }}>
            Choose Your Registration Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 540, margin: '0 auto 48px auto', lineHeight: 1.5 }}>
            To begin, please select your primary profile category. We will configure your workspace based on your role.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            
            {/* Patient Portal Card */}
            <div 
              className="glass-card" 
              style={{ padding: 48, cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
              onClick={() => { setRole('patient'); setStep(1); }}
            >
              <div style={{ fontSize: 52, background: 'var(--primary-glow)', width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', justifyContent: 'center' }}>
                🟢
              </div>
              <div>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>Register as a Patient</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Access our symptom checker, schedule appointments, store records securely, and track your daily wellness metrics.
                </p>
              </div>
            </div>

            {/* Doctor Portal Card */}
            <div 
              className="glass-card" 
              style={{ padding: 48, cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
              onClick={() => { setRole('doctor'); setStep(1); }}
            >
              <div style={{ fontSize: 52, background: 'var(--secondary-glow)', width: 90, height: 90, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', border: '1px solid rgba(14, 165, 233, 0.3)', display: 'flex', justifyContent: 'center' }}>
                🛡️
              </div>
              <div>
                <h3 style={{ fontSize: 22, marginBottom: 8 }}>Register as a Doctor</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Manage consultations, issue digital prescriptions, review patient vitals history, and configure platform availability.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. BASE REGISTRATION DETAILS (STEP 1) */}
      {role && step === 1 && (
        <div className="glass-card" style={{ maxWidth: 500, width: '100%', padding: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                {role === 'patient' ? 'Patient Portal' : 'Physician Console'} • Step 1 of 2
              </span>
              <h2 style={{ marginTop: 4 }}>Create Your Profile</h2>
            </div>
            <button className="theme-toggle" onClick={() => setRole(null)}>✕</button>
          </div>

          <form onSubmit={handleBaseSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder={role === 'doctor' ? 'e.g. Dr. Amit Sharma' : 'e.g. Alex Rivera'}
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Contact Phone Number</label>
              <input 
                type="tel" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                placeholder="e.g. +91 98765 43210" 
                className="form-input" 
                required 
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="e.g. alex@example.com" 
                className="form-input" 
                required 
              />
            </div>

            {role === 'doctor' && (
              <div className="form-group">
                <label>Primary Location / City</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. Mumbai, Maharashtra" 
                  className="form-input" 
                  required 
                />
              </div>
            )}

            <div className="form-group">
              <label>Secure Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                className="form-input" 
                required 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
              Continue Onboarding ➜
            </button>
          </form>
        </div>
      )}

      {/* 3. PATIENT INTAKE DETAILS (STEP 2) */}
      {role === 'patient' && step === 2 && (
        <div className="glass-card" style={{ maxWidth: 640, width: '100%', padding: 40, animation: 'slideUp 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                Patient Medical Intake • Step 2 of 2
              </span>
              <h2 style={{ marginTop: 4 }}>One-Time Health Intake</h2>
            </div>
            <button className="theme-toggle" onClick={() => setStep(1)}>✕</button>
          </div>

          <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Part A: Hereditary History Checkbox Menu */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
                🧬 Family Hereditary Medical History
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {hereditaryDiseases.map(disease => {
                  const isChecked = selectedHereditary.includes(disease);
                  return (
                    <div
                      key={disease}
                      onClick={() => handleToggleHereditary(disease)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 30,
                        border: '1px solid var(--border-color)',
                        background: isChecked ? 'var(--primary-glow)' : 'var(--bg-secondary)',
                        color: isChecked ? 'var(--primary)' : 'var(--text-secondary)',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border-color)',
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {disease}
                    </div>
                  );
                })}
              </div>

              {/* Mention by Myself Column */}
              <div style={{ marginTop: 14 }}>
                <input
                  type="text"
                  value={customHereditary}
                  onChange={(e) => setCustomHereditary(e.target.value)}
                  placeholder="Mention other rare conditions yourself... (e.g. G6PD Deficiency)"
                  className="form-input"
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            {/* Part B: Line of Work and Environmental Exposure */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
                💼 Occupational Telemetry
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Primary Line of Work</label>
                  <select 
                    value={occupation} 
                    onChange={(e) => setOccupation(e.target.value)}
                    className="form-input"
                  >
                    <option value="Desk Job / IT">Desk Job / IT Developer</option>
                    <option value="Corporate / Admin">Corporate / Administration</option>
                    <option value="Agriculture / Farming">Agriculture / Farming</option>
                    <option value="Healthcare Provider">Healthcare Specialist</option>
                    <option value="Construction / Labor">Construction / Engineering</option>
                    <option value="Manufacturing / Factory">Manufacturing / Production</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Physical Exertion Level</label>
                  <select 
                    value={workExertion} 
                    onChange={(e) => setWorkExertion(e.target.value)}
                    className="form-input"
                  >
                    <option value="Sedentary">Sedentary (Mostly Sitting)</option>
                    <option value="Moderate">Moderate (Active/Stretching)</option>
                    <option value="Highly Active">Highly Active (Physical Labor)</option>
                  </select>
                </div>
              </div>

              {/* Work Hours Slider */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label>Average Weekly Hours</label>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{workHours} Hours</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="80" 
                  value={workHours} 
                  onChange={(e) => setWorkHours(parseInt(e.target.value))}
                  className="slider-custom"
                />
              </div>

              {/* Exposures Checklist */}
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                  Frequent Workplace Exposure to Elements:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {exposureElements.map(exp => {
                    const isSelected = selectedExposures.includes(exp.id);
                    return (
                      <div
                        key={exp.id}
                        onClick={() => handleToggleExposure(exp.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)',
                          background: isSelected ? 'var(--secondary-glow)' : 'rgba(255,255,255,0.01)',
                          borderColor: isSelected ? 'var(--secondary)' : 'var(--border-color)',
                          color: isSelected ? 'var(--secondary)' : 'var(--text-secondary)',
                          fontSize: 12.5,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        {exp.label}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            {/* Part C: Personal Health History and Uploads */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
                🩺 Personal Medical History & Attachments
              </label>
              <div className="form-group">
                <label>Previous Major Health Issues or Allergies (Optional)</label>
                <textarea
                  value={personalHistory}
                  onChange={(e) => setPersonalHistory(e.target.value)}
                  placeholder="Describe any active conditions, childhood illnesses, or medicine allergies..."
                  className="form-input"
                  style={{ height: 80, resize: 'none' }}
                />
              </div>

              {/* Mock File Upload Drawer */}
              <div style={{ border: '1px dashed var(--border-color)', borderRadius: 8, padding: '20px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
                <span style={{ fontSize: 24 }}>🗄️</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {mockFileName ? `Selected: ${mockFileName}` : 'Mock Upload Supporting Prescriptions or Diagnostic Files'}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Optional PDF or image formats (Simulated injection)</span>
                {!mockFileName ? (
                  <button 
                    type="button" 
                    onClick={() => setMockFileName('Patient_Intake_Report.pdf')}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 10,
                      display: 'block',
                      margin: '10px auto 0 auto'
                    }}
                  >
                    Simulate File Select
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setMockFileName('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'block',
                      margin: '8px auto 0 auto',
                      textDecoration: 'underline'
                    }}
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                Register & Enter Portal
              </button>
            </div>

          </form>
        </div>
      )}

      {/* 4. DOCTOR CREDENTIALS & AVAILABILITY DETAILS (STEP 2) */}
      {role === 'doctor' && step === 2 && (
        <div className="glass-card" style={{ maxWidth: 640, width: '100%', padding: 40, animation: 'slideUp 0.3s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>
                Physician intake • Step 2 of 2
              </span>
              <h2 style={{ marginTop: 4 }}>Credentials & Availability</h2>
            </div>
            <button className="theme-toggle" onClick={() => setStep(1)}>✕</button>
          </div>

          <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Valid Degrees Checklist */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
                🎓 Professional Valid Medical Degrees
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {availableDegrees.map(deg => {
                  const isChecked = selectedDegrees.includes(deg);
                  return (
                    <div
                      key={deg}
                      onClick={() => handleToggleDegree(deg)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: '1px solid var(--border-color)',
                        background: isChecked ? 'var(--secondary-glow)' : 'var(--bg-secondary)',
                        color: isChecked ? 'var(--secondary)' : 'var(--text-secondary)',
                        borderColor: isChecked ? 'var(--secondary)' : 'var(--border-color)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      {deg}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Primary Clinical Department</label>
                <select 
                  value={department} 
                  onChange={(e) => setDepartment(e.target.value)}
                  className="form-input"
                >
                  <option value="General Health">General Health</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Set Consultation Fee (INR)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>₹</span>
                  <input 
                    type="number" 
                    min="300" 
                    max="5000" 
                    value={consultFee} 
                    onChange={(e) => setConsultFee(parseInt(e.target.value) || 300)}
                    className="form-input"
                    style={{ flexGrow: 1 }}
                  />
                </div>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            {/* Platform Availability Slider (10m to 8h) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 14, fontWeight: 600 }}>🕰️ Platform Daily Availability</label>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--secondary)' }}>
                  {formatAvailability(availMinutes)}
                </span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="480" 
                step="10"
                value={availMinutes} 
                onChange={(e) => setAvailMinutes(parseInt(e.target.value))}
                className="slider-custom"
                style={{ '--primary': 'var(--secondary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                <span>Min Availability: 10 Min</span>
                <span>Max Availability: 8 Hours</span>
              </div>
            </div>

            <hr style={{ borderColor: 'var(--border-color)' }} />

            {/* Experience & Degree Certificate Upload */}
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: 12 }}>
                📁 Medical Registration & Work Experience Certificates
              </label>
              <div style={{ border: '1px dashed var(--border-color)', borderRadius: 8, padding: '20px 16px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', position: 'relative' }}>
                <span style={{ fontSize: 24 }}>🎓</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {mockCertName ? `Selected: ${mockCertName}` : 'Upload Work Experience Documents / Medical License'}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Required for clinical authentication (Simulated injection)</span>
                {!mockCertName ? (
                  <button 
                    type="button" 
                    onClick={() => setMockCertName('Medical_Council_Certificate.pdf')}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      padding: '4px 12px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      marginTop: 10,
                      display: 'block',
                      margin: '10px auto 0 auto'
                    }}
                  >
                    Simulate File Select
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => setMockCertName('')}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--danger)',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'block',
                      margin: '8px auto 0 auto',
                      textDecoration: 'underline'
                    }}
                  >
                    Remove File
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>
                Back
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ flex: 1, justifyContent: 'center', background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.2)' }}
                disabled={selectedDegrees.length === 0}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)',
                  opacity: selectedDegrees.length === 0 ? 0.5 : 1,
                  cursor: selectedDegrees.length === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                Register as Provider
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
