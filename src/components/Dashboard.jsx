import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';

export default function Dashboard({ appointments, setTab, selectDoctorForConsult, currentUser, activeRequest, setActiveRequest, setActiveSession, patientUser }) {
  const [pulseTime, setPulseTime] = useState(72);
  const [activeMetric, setActiveMetric] = useState('heartrate');
  const [activeDoctorMetric, setActiveDoctorMetric] = useState('consults');
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [symptomChecks, setSymptomChecks] = useState([]);

  // Simulate subtle heartbeat rate fluctuation for patient mode
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTime(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        const next = prev + delta;
        return next > 90 ? 88 : next < 60 ? 65 : next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'patient') return;
    api.get('/vitals').then(v => setVitalsHistory(Array.isArray(v) ? v : [])).catch(() => {});
    api.get('/symptom-checks').then(s => setSymptomChecks(Array.isArray(s) ? s : [])).catch(() => {});
  }, [currentUser?.role]);

  // Helper to convert availability minutes to text
  const formatAvailability = (mins) => {
    if (!mins) return '2 Hours';
    if (mins < 60) return `${mins} Mins`;
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs} Hours`;
  };

  // ================= PHYSICIAN CONSOLE VIEW =================
  if (currentUser?.role === 'doctor') {
    const doctorStats = [
      {
        id: 'duty',
        title: 'Daily Platform Duty',
        value: formatAvailability(currentUser.availMinutes),
        unit: 'active',
        status: 'Online & Ready',
        color: 'hsl(195, 85%, 41%)',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        )
      },
      {
        id: 'location',
        title: 'Clinic Location',
        value: currentUser.location?.split(',')[0] || 'Mumbai',
        unit: 'city',
        status: 'Practicing',
        color: 'hsl(162, 73%, 46%)',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )
      },
      {
        id: 'fee',
        title: 'Consultation Charge',
        value: currentUser.fee || '₹800',
        unit: 'INR',
        status: 'Standard Fee',
        color: 'hsl(262, 83%, 68%)',
        icon: (
          <span style={{ fontSize: 20, fontWeight: 800 }}>₹</span>
        )
      },
      {
        id: 'rating',
        title: 'Clinical Rating',
        value: '5.0',
        unit: '★',
        status: 'Perfect Rank',
        color: 'hsl(45, 93%, 47%)',
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      }
    ];

    // Simulated doctor performance analytics
    const doctorCharts = {
      consults: {
        points: [
          { label: 'Mon', y: 160, val: 3 },
          { label: 'Tue', y: 120, val: 5 },
          { label: 'Wed', y: 140, val: 4 },
          { label: 'Thu', y: 100, val: 6 },
          { label: 'Fri', y: 70, val: 8 },
          { label: 'Sat', y: 140, val: 4 },
          { label: 'Sun', y: 180, val: 2 }
        ],
        color: 'var(--secondary)',
        gradient: ['rgba(14, 165, 233, 0.3)', 'rgba(14, 165, 233, 0)']
      },
      hours: {
        points: [
          { label: 'Mon', y: 150, val: 2.5 },
          { label: 'Tue', y: 110, val: 4.2 },
          { label: 'Wed', y: 130, val: 3.5 },
          { label: 'Thu', y: 90, val: 5.0 },
          { label: 'Fri', y: 60, val: 6.8 },
          { label: 'Sat', y: 120, val: 4.0 },
          { label: 'Sun', y: 170, val: 1.8 }
        ],
        color: 'var(--primary)',
        gradient: ['rgba(16, 185, 129, 0.3)', 'rgba(16, 185, 129, 0)']
      }
    };

    const selectedDoctorData = doctorCharts[activeDoctorMetric];

    const getSvgPath = (points) => {
      let path = `M 40 ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const x = 40 + i * 115;
        const y = points[i].y;
        path += ` L ${x} ${y}`;
      }
      return path;
    };

    const getGradientPath = (points) => {
      let path = getSvgPath(points);
      const lastX = 40 + (points.length - 1) * 115;
      path += ` L ${lastX} 200 L 40 200 Z`;
      return path;
    };

    // Filter appointments booked specifically for this doctor
    const myBookings = appointments.filter(appt => 
      appt.doctor.name === currentUser.name || 
      appt.doctor.id === `dr-${currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
    );

    // Seed mock patients if no patient has booked this doctor yet
    const simulatedQueue = [
      {
        id: 'sim-pat-1',
        patient: {
          name: 'Alex Rivera',
          age: 32,
          symptoms: 'Insomnia & Severe Screen Eye Strain',
          bloodType: 'O-Positive',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256'
        },
        slot: 'Mon, May 25 at 10:30 AM'
      },
      {
        id: 'sim-pat-2',
        patient: {
          name: 'Pooja Patel',
          age: 27,
          symptoms: 'Acid Reflux & Joint Exertion Ache',
          bloodType: 'B-Positive',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256'
        },
        slot: 'Mon, May 25 at 02:30 PM'
      }
    ];

    return (
      <>
        {/* Incoming Telehealth Rapid Dispatch Alert Panel */}
        {activeRequest && activeRequest.status === 'pending' && (
          <div 
            className="glass-card" 
            style={{ 
              marginBottom: 24, 
              border: '2px solid var(--secondary)', 
              background: 'radial-gradient(100% 100% at 0% 0%, rgba(14, 165, 233, 0.15) 0%, rgba(11, 19, 41, 0.6) 100%)', 
              boxShadow: '0 0 30px rgba(14, 165, 233, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              animation: 'heartbeat 3s infinite ease-in-out'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ 
                  width: 50, 
                  height: 50, 
                  borderRadius: '50%', 
                  background: 'rgba(14, 165, 233, 0.15)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: 24,
                  border: '1.5px solid var(--secondary)'
                }}>
                  📡
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    ⚠️ CRITICAL DISPATCH INCOMING (RAPIDO TELEHEALTH MODE)
                  </span>
                  <h3 style={{ margin: '4px 0 0 0', color: 'white' }}>Live Request from {activeRequest.patientName}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    Immediate specialist consult requested via real-time gateway pipeline.
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  className="sim-reset-btn" 
                  style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13 }}
                  onClick={() => setActiveRequest(null)}
                >
                  Decline Dispatch
                </button>
                <button 
                  className="btn-primary" 
                  style={{ 
                    background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)', 
                    borderColor: 'var(--secondary)',
                    boxShadow: '0 4px 15px rgba(14, 165, 233, 0.3)',
                    padding: '8px 20px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 700
                  }}
                  onClick={() => {
                    const updatedReq = { ...activeRequest, status: 'accepted' };
                    setActiveRequest(updatedReq);
                    setActiveSession({
                      id: activeRequest.id,
                      doctor: {
                        id: activeRequest.doctorId,
                        name: activeRequest.doctorName,
                        avatar: activeRequest.doctorAvatar,
                        specialty: 'Cardiology',
                        qualification: 'MBBS, MD, DM (Cardiology)',
                        workplace: 'Apollo Hospital'
                      },
                      date: 'Today (Live)',
                      slot: 'Instant Consultation'
                    });
                    setTab('telehealth');
                  }}
                >
                  Accept & Connect Booth ➜
                </button>
              </div>
            </div>

            {/* Displaying Patient hereditary and exertion telemetry metrics */}
            <div 
              style={{ 
                marginTop: 20, 
                paddingTop: 16, 
                borderTop: '1px solid rgba(255,255,255,0.06)', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: 16 
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Subject Symptoms
                </span>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>
                  {activeRequest.symptoms}
                </span>
              </div>
              
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Hereditary Matrices
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {activeRequest.medicalIntake?.hereditary?.map((h, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: 'var(--primary)', 
                        background: 'var(--primary-glow)', 
                        padding: '2px 8px', 
                        borderRadius: 4 
                      }}
                    >
                      {h}
                    </span>
                  )) || <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None declared</span>}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Occupation Exertion
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                  💼 {activeRequest.medicalIntake?.occupation || 'Developer'} • {activeRequest.medicalIntake?.workExertion || 'Moderate'} ({activeRequest.medicalIntake?.workHours || 40} hrs/wk)
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Exposures / Risks
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                  {activeRequest.medicalIntake?.exposures?.map((e, idx) => (
                    <span 
                      key={idx} 
                      style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: 'var(--warning)', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        padding: '2px 8px', 
                        borderRadius: 4 
                      }}
                    >
                      ⚠️ {e}
                    </span>
                  )) || <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>None declared</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Physician Metric Panels */}
        <div className="dashboard-grid">
          {doctorStats.map(stat => (
            <div 
              key={stat.id}
              className="glass-card vital-card"
              style={{ 
                '--vital-accent': stat.color,
                borderLeft: `4px solid ${stat.color}`,
                boxShadow: `0 8px 20px -5px ${stat.color}15`
              }}
            >
              <div className="vital-header">
                <span className="vital-title">{stat.title}</span>
                <span className="vital-icon" style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div>
                <span className="vital-value">
                  {stat.value}
                  <span className="vital-unit"> {stat.unit}</span>
                </span>
              </div>
              <div className="vital-status" style={{ '--status-color': stat.color }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: stat.color, animation: 'pulseGlow 2s infinite' }}></span>
                {stat.status}
              </div>
            </div>
          ))}
        </div>

        {/* Doctor Main Analytics Row */}
        <div className="dashboard-large-row">
          {/* Custom SVG Performance Chart */}
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h3>Practice Telemetry Analytics</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                  Weekly summary of {activeDoctorMetric === 'consults' ? 'Patient consultations conducted' : 'Time active on platform'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['consults', 'hours'].map(metric => (
                  <button
                    key={metric}
                    onClick={() => setActiveDoctorMetric(metric)}
                    style={{
                      background: activeDoctorMetric === metric ? 'var(--secondary)' : 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 8,
                      padding: '6px 12px',
                      color: activeDoctorMetric === metric ? '#fff' : 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {metric.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Interactive SVG Chart */}
            <div className="chart-container">
              <svg className="chart-svg" viewBox="0 0 800 240">
                <defs>
                  <linearGradient id="doctor-chart-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={selectedDoctorData.color} stopOpacity="0.3"/>
                    <stop offset="100%" stopColor={selectedDoctorData.color} stopOpacity="0"/>
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1="40" y1="50" x2="740" y2="50" className="chart-grid-line" />
                <line x1="40" y1="100" x2="740" y2="100" className="chart-grid-line" />
                <line x1="40" y1="150" x2="740" y2="150" className="chart-grid-line" />
                <line x1="40" y1="200" x2="740" y2="200" stroke="var(--text-muted)" strokeWidth="1.5" />

                {/* Y-Axis scale label references */}
                <text x="15" y="55" className="chart-axis-label">High</text>
                <text x="15" y="125" className="chart-axis-label">Avg</text>
                <text x="15" y="205" className="chart-axis-label">Low</text>

                {/* Area Gradient Fill */}
                <path d={getGradientPath(selectedDoctorData.points)} fill="url(#doctor-chart-gradient)" style={{ transition: 'd 0.5s ease-in-out' }} />

                {/* Spline stroke */}
                <path 
                  d={getSvgPath(selectedDoctorData.points)} 
                  fill="none" 
                  stroke={selectedDoctorData.color} 
                  strokeWidth="3.5" 
                  strokeLinecap="round" 
                  style={{ transition: 'd 0.5s ease-in-out' }}
                />

                {/* Chart Points */}
                {selectedDoctorData.points.map((pt, idx) => {
                  const x = 40 + idx * 115;
                  return (
                    <g key={idx} className="chart-point-group">
                      <circle
                        cx={x}
                        cy={pt.y}
                        r="6"
                        fill={selectedDoctorData.color}
                        stroke="var(--bg-secondary)"
                        strokeWidth="2.5"
                        style={{ cursor: 'pointer', transition: 'cy 0.5s ease-in-out' }}
                      />
                      <text x={x} y="225" textAnchor="middle" className="chart-axis-label" fontWeight="600">{pt.label}</text>
                      <g className="chart-tooltip" style={{ opacity: 1 }}>
                        <rect x={x - 28} y={pt.y - 32} width="56" height="22" rx="4" fill="var(--bg-secondary)" stroke={selectedDoctorData.color} strokeWidth="1" />
                        <text x={x} y={pt.y - 18} fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">
                          {pt.val}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Booked Consultations Queue */}
          <div className="glass-card">
            <h3>Active Consultation Queue</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Patients scheduled for consultations today</p>
            
            <div className="timeline-feed">
              {/* If real patient booked the doctor */}
              {myBookings.map((appt, idx) => (
                <div key={`real-${idx}`} className="timeline-item">
                  <div className="timeline-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    📹
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ fontWeight: 600 }}>Patient: Alex Rivera (Real Booking)</h5>
                      <span 
                        onClick={() => selectDoctorForConsult(appt)}
                        style={{
                          fontSize: 11,
                          color: 'var(--secondary)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}
                      >
                        Launch Booth
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Biometrics: O-Positive • Slot: {appt.slot}
                    </p>
                    <div className="timeline-time">Pending Session</div>
                  </div>
                </div>
              ))}

              {/* Standard pre-seeded simulated clinic queue */}
              {simulatedQueue.map((item, idx) => (
                <div key={`sim-${idx}`} className="timeline-item">
                  <div className="timeline-icon" style={{ background: 'var(--secondary-glow)', color: 'var(--secondary)' }}>
                    🩺
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ fontWeight: 600 }}>{item.patient.name} (Simulated Consult)</h5>
                      <span 
                        onClick={() => selectDoctorForConsult({
                          id: `sim-appt-${idx}`,
                          doctor: {
                            name: currentUser.name,
                            specialty: currentUser.department,
                            avatar: currentUser.avatar,
                            qualification: currentUser.qualification,
                            workplace: currentUser.workplace || 'Apollo Clinic'
                          },
                          slot: item.slot
                        })}
                        style={{
                          fontSize: 11,
                          color: 'var(--secondary)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}
                      >
                        Start Session
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                      Symptoms: {item.patient.symptoms} • {item.slot}
                    </p>
                    <div className="timeline-time" style={{ color: 'var(--text-muted)' }}>Due Today</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ================= PATIENT CONSOLE VIEW (DEFAULT) =================
  const latestDiag = symptomChecks[0] || null;
  const medicines = [];
  const pendingMeds = medicines.filter(m => !m.done).length;

  const patientCards = [
    {
      id: 'meds',
      title: 'Medicine Schedule',
      value: medicines.length > 0 ? String(medicines.length) : '0',
      unit: medicines.length > 0 ? 'meds today' : 'prescribed',
      status: medicines.length > 0
        ? (pendingMeds > 0 ? `${pendingMeds} pending tonight` : 'All doses taken')
        : 'No active prescriptions',
      color: 'hsl(38, 92%, 50%)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="14" rx="2"/>
          <line x1="9" y1="21" x2="15" y2="21"/>
          <line x1="12" y1="17" x2="12" y2="21"/>
          <polyline points="7 10 9 8 11 12 13 6 15 10 17 10"/>
        </svg>
      )
    },
    {
      id: 'diag',
      title: 'Latest AI Diagnosis',
      value: latestDiag ? `${Math.round(latestDiag.diagnosisProbability)}%` : '—',
      unit: latestDiag ? 'AI match' : '',
      status: latestDiag?.diagnosisCondition || 'No analysis yet',
      color: 'hsl(162, 73%, 46%)',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
      )
    },
  ];

  const toChartPoints = (arr, accessor) => {
    if (!arr.length) return [];
    const vals = arr.map(accessor);
    const validVals = vals.filter(v => v != null);
    if (!validVals.length) return [];
    const minV = Math.min(...validVals);
    const maxV = Math.max(...validVals);
    const range = maxV - minV || 1;
    return arr.map((v, i) => ({
      label: new Date(v.recordedAt).toLocaleDateString('en-US', { weekday: 'short' }),
      val: accessor(v) ?? '—',
      y: accessor(v) != null ? Math.round(200 - ((accessor(v) - minV) / range) * 140) : 125,
    }));
  };
  const vitalsChronological = [...vitalsHistory].reverse().slice(-7);

  const chartData = {
    heartrate: {
      points: vitalsChronological.length
        ? toChartPoints(vitalsChronological, v => v.heartRateBpm)
        : [
            { label: 'Mon', y: 155, val: 68 }, { label: 'Tue', y: 120, val: 74 },
            { label: 'Wed', y: 165, val: 65 }, { label: 'Thu', y: 95, val: 82 },
            { label: 'Fri', y: 145, val: 70 }, { label: 'Sat', y: 130, val: 73 },
            { label: 'Sun', y: 150, val: 69 },
          ],
      color: 'var(--secondary)',
    },
    steps: {
      points: vitalsChronological.length
        ? toChartPoints(vitalsChronological, v => v.dailySteps)
        : [
            { label: 'Mon', y: 160, val: 6500 }, { label: 'Tue', y: 120, val: 8100 },
            { label: 'Wed', y: 90, val: 9400 }, { label: 'Thu', y: 175, val: 5900 },
            { label: 'Fri', y: 130, val: 7600 }, { label: 'Sat', y: 60, val: 10200 },
            { label: 'Sun', y: 100, val: 8432 },
          ],
      color: 'var(--primary)',
    },
  };

  const selectedData = chartData[activeMetric] || chartData.heartrate;

  const getSvgPath = (points) => {
    let path = `M 40 ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const x = 40 + i * 115;
      const y = points[i].y;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  const getGradientPath = (points) => {
    let path = getSvgPath(points);
    const lastX = 40 + (points.length - 1) * 115;
    path += ` L ${lastX} 200 L 40 200 Z`;
    return path;
  };

  return (
    <>
      {/* Patient Metric Cards Row */}
      <div className="dashboard-grid">
        {patientCards.map(card => (
          <div
            key={card.id}
            className="glass-card vital-card"
            style={{
              '--vital-accent': card.color,
              borderLeft: `4px solid ${card.color}`,
              boxShadow: `0 8px 20px -5px ${card.color}15`
            }}
          >
            <div className="vital-header">
              <span className="vital-title">{card.title}</span>
              <span className="vital-icon" style={{ color: card.color }}>{card.icon}</span>
            </div>
            <div>
              <span className="vital-value">
                {card.value}
                <span className="vital-unit"> {card.unit}</span>
              </span>
            </div>
            <div className="vital-status" style={{ '--status-color': card.color }}>
              <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: card.color, animation: 'pulseGlow 2s infinite' }}></span>
              {card.status}
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Row */}
      <div className="dashboard-large-row">
        {/* Animated Custom Chart Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3>Health Analytics</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Weekly telemetry — {activeMetric === 'heartrate' ? 'Heart Rate (bpm)' : 'Daily Steps'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ id: 'heartrate', label: 'HR' }, { id: 'steps', label: 'STEPS' }].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveMetric(id)}
                  style={{
                    background: activeMetric === id ? 'var(--primary)' : 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    color: activeMetric === id ? '#fff' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Animated Chart */}
          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 800 240">
              <defs>
                <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={selectedData.color} stopOpacity="0.3"/>
                  <stop offset="100%" stopColor={selectedData.color} stopOpacity="0"/>
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="50" x2="740" y2="50" className="chart-grid-line" />
              <line x1="40" y1="100" x2="740" y2="100" className="chart-grid-line" />
              <line x1="40" y1="150" x2="740" y2="150" className="chart-grid-line" />
              <line x1="40" y1="200" x2="740" y2="200" stroke="var(--text-muted)" strokeWidth="1.5" />

              {/* Axis labels */}
              <text x="15" y="55" className="chart-axis-label">Max</text>
              <text x="15" y="125" className="chart-axis-label">Mid</text>
              <text x="15" y="205" className="chart-axis-label">Min</text>

              {/* Gradient Fill Path */}
              <path d={getGradientPath(selectedData.points)} fill="url(#chart-gradient)" style={{ transition: 'd 0.5s ease-in-out' }} />

              {/* Spline Path */}
              <path 
                d={getSvgPath(selectedData.points)} 
                fill="none" 
                stroke={selectedData.color} 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                style={{ transition: 'd 0.5s ease-in-out' }}
              />

              {/* Data circles & hover highlights */}
              {selectedData.points.map((pt, idx) => {
                const x = 40 + idx * 115;
                return (
                  <g key={idx} className="chart-point-group">
                    <circle
                      cx={x}
                      cy={pt.y}
                      r="6"
                      fill={selectedData.color}
                      stroke="var(--bg-secondary)"
                      strokeWidth="2.5"
                      style={{ cursor: 'pointer', transition: 'cy 0.5s ease-in-out' }}
                    />
                    <text x={x} y="225" textAnchor="middle" className="chart-axis-label" fontWeight="600">{pt.label}</text>
                    
                    {/* Tooltip Overlay (Visible on Hover via CSS/Inline) */}
                    <g className="chart-tooltip" style={{ opacity: 1 }}>
                      <rect x={x - 28} y={pt.y - 32} width="56" height="22" rx="4" fill="var(--bg-secondary)" stroke={selectedData.color} strokeWidth="1" />
                      <text x={x} y={pt.y - 18} fill="white" fontSize="10" textAnchor="middle" fontWeight="bold">
                        {pt.val}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Dynamic Activity/Agenda Panel */}
        <div className="glass-card">
          <h3>Upcoming Consultations</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>Scheduled video calls and events</p>
          
          <div className="timeline-feed">
            {appointments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12, opacity: 0.5 }}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ fontSize: 14 }}>No consultations booked.</p>
                <button 
                  onClick={() => setTab('scheduler')}
                  style={{
                    background: 'transparent',
                    border: '1px dashed var(--primary)',
                    color: 'var(--primary)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    marginTop: 12,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Book Session Now
                </button>
              </div>
            ) : (
              appointments.map((appt, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-icon" style={{ background: 'var(--primary-glow)', color: 'var(--primary)' }}>
                    📹
                  </div>
                  <div className="timeline-content">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ fontWeight: 600 }}>Video Call: {appt.doctor.name}</h5>
                      <span 
                        onClick={() => selectDoctorForConsult(appt)}
                        style={{
                          fontSize: 11,
                          color: 'var(--secondary)',
                          cursor: 'pointer',
                          fontWeight: 700,
                          textDecoration: 'underline'
                        }}
                      >
                        Launch Call
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{appt.doctor.specialty} • {appt.slot}</p>
                    <div className="timeline-time">Today, {appt.slot.split(' ')[0]}</div>
                  </div>
                </div>
              ))
            )}

            {medicines.map((med, i) => (
              <div key={`med-${i}`} className="timeline-item">
                <div className="timeline-icon" style={{ background: med.done ? 'var(--primary-glow)' : 'rgba(245, 158, 11, 0.1)', color: med.done ? 'var(--primary)' : 'var(--warning)' }}>
                  💊
                </div>
                <div className="timeline-content">
                  <h5>{med.name}</h5>
                  <p>{med.schedule}</p>
                  <div className="timeline-time" style={{ color: med.done ? 'var(--primary)' : 'hsl(38, 92%, 50%)' }}>
                    {med.done ? '✓ Taken' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
            {symptomChecks.slice(0, 2).map((sc, i) => (
              <div key={`sc-${i}`} className="timeline-item">
                <div className="timeline-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
                  🧬
                </div>
                <div className="timeline-content">
                  <h5>{sc.diagnosisCondition}</h5>
                  <p>{sc.recommendedDepartment} • {Math.round(sc.diagnosisProbability)}% match</p>
                  <div className="timeline-time">
                    {new Date(sc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            ))}
            {symptomChecks.length === 0 && (
              <div className="timeline-item">
                <div className="timeline-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--primary)' }}>
                  🧬
                </div>
                <div className="timeline-content">
                  <h5>No symptom analyses yet</h5>
                  <p>Run the AI symptom checker to see your diagnosis history here.</p>
                  <div className="timeline-time">—</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
