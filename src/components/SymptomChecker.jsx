import React, { useState } from 'react';
import { api } from '../lib/api.js';

export default function SymptomChecker({ setTab, setFilterDept }) {
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagResult, setDiagResult] = useState(null);
  const [error, setError] = useState('');

  const symptomGroups = [
    {
      group: 'General',
      color: 'var(--primary)',
      symptoms: [
        { id: 'fever', label: '🌡️ Fever', dept: 'General Health' },
        { id: 'cough', label: '💨 Cough', dept: 'General Health' },
        { id: 'fatigue', label: '💤 Fatigue / Low Energy', dept: 'General Health' },
        { id: 'body_ache', label: '🤕 Body Ache', dept: 'General Health' },
        { id: 'throat', label: '🗣️ Sore Throat', dept: 'General Health' },
        { id: 'sneezing', label: '🤧 Runny Nose / Sneezing', dept: 'General Health' },
        { id: 'loss_of_appetite', label: '🍽️ Loss of Appetite', dept: 'General Health' },
        { id: 'night_sweats', label: '🥵 Night Sweats', dept: 'General Health' },
        { id: 'chills', label: '🥶 Chills / Shivering', dept: 'General Health' },
      ],
    },
    {
      group: 'Heart & Lungs',
      color: 'hsl(0, 80%, 55%)',
      symptoms: [
        { id: 'chest', label: '❤️ Chest Tightness', dept: 'Cardiology' },
        { id: 'palpitations', label: '💓 Heart Palpitations', dept: 'Cardiology' },
        { id: 'sob', label: '🫁 Shortness of Breath', dept: 'Cardiology' },
        { id: 'wheezing', label: '🌬️ Wheezing', dept: 'Pulmonology' },
        { id: 'chest_congestion', label: '🤒 Chest Congestion', dept: 'Pulmonology' },
        { id: 'breathlessness', label: '😮‍💨 Breathlessness on Exertion', dept: 'Pulmonology' },
      ],
    },
    {
      group: 'Head & Nerves',
      color: 'hsl(262, 83%, 68%)',
      symptoms: [
        { id: 'headache', label: '🧠 Headache', dept: 'Neurology' },
        { id: 'migraine', label: '⚡ Migraine', dept: 'Neurology' },
        { id: 'dizzy', label: '🌀 Dizziness', dept: 'Neurology' },
        { id: 'numbness', label: '🫳 Numbness / Tingling', dept: 'Neurology' },
      ],
    },
    {
      group: 'Mental Health',
      color: 'hsl(195, 85%, 41%)',
      symptoms: [
        { id: 'anxiety', label: '💭 Anxiety / Stress', dept: 'Psychiatry' },
        { id: 'insomnia', label: '🛌 Insomnia / Sleep Trouble', dept: 'Psychiatry' },
        { id: 'panic_attack', label: '🌪️ Panic Attacks', dept: 'Psychiatry' },
        { id: 'depression', label: '😔 Low Mood / Depression', dept: 'Psychiatry' },
      ],
    },
    {
      group: 'Digestion',
      color: 'hsl(38, 92%, 50%)',
      symptoms: [
        { id: 'indigestion', label: '🧃 Stomach Ache / Indigestion', dept: 'Gastroenterology' },
        { id: 'acid_reflux', label: '🔥 Acid Reflux / GERD', dept: 'Gastroenterology' },
        { id: 'nausea', label: '🤢 Nausea', dept: 'Gastroenterology' },
        { id: 'vomiting', label: '🤮 Vomiting', dept: 'Gastroenterology' },
        { id: 'bloating', label: '🫧 Bloating / Gas', dept: 'Gastroenterology' },
        { id: 'diarrhea', label: '🚽 Diarrhea', dept: 'Gastroenterology' },
        { id: 'abdominal_cramps', label: '😣 Abdominal Cramps', dept: 'Gastroenterology' },
      ],
    },
    {
      group: 'Bones & Muscles',
      color: 'hsl(30, 70%, 45%)',
      symptoms: [
        { id: 'joint_pain', label: '🦴 Joint Pain / Back Ache', dept: 'Orthopedics' },
        { id: 'swollen_joints', label: '🦵 Swollen Joints', dept: 'Orthopedics' },
        { id: 'bone_pain', label: '💀 Bone Pain', dept: 'Orthopedics' },
        { id: 'stiffness', label: '🧊 Morning Stiffness', dept: 'Orthopedics' },
        { id: 'muscle', label: '💪 Muscle Pain / Cramps', dept: 'General Health' },
      ],
    },
    {
      group: 'Eyes & ENT',
      color: 'hsl(200, 80%, 45%)',
      symptoms: [
        { id: 'blurry_vision', label: '👁️ Blurry Vision', dept: 'Ophthalmology' },
        { id: 'red_eyes', label: '🔴 Red / Irritated Eyes', dept: 'Ophthalmology' },
        { id: 'watery_eyes', label: '💧 Watery Eyes', dept: 'Ophthalmology' },
        { id: 'ear_pain', label: '👂 Ear Pain / Discharge', dept: 'ENT' },
        { id: 'hearing_loss', label: '🔇 Hearing Loss / Tinnitus', dept: 'ENT' },
        { id: 'nasal_congestion', label: '👃 Nasal Congestion / Sinusitis', dept: 'ENT' },
        { id: 'sinus_pressure', label: '🤯 Sinus Pressure', dept: 'ENT' },
      ],
    },
    {
      group: 'Skin & Hair',
      color: 'hsl(340, 70%, 50%)',
      symptoms: [
        { id: 'skin_rash', label: '🩹 Skin Rash / Itchiness', dept: 'Dermatology' },
        { id: 'acne', label: '😤 Severe Acne', dept: 'Dermatology' },
        { id: 'hair_loss', label: '🪮 Hair Loss', dept: 'Dermatology' },
        { id: 'dry_skin', label: '🏜️ Dry / Flaky Skin', dept: 'Dermatology' },
      ],
    },
  ];

  const handleToggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.find(s => s.id === symptom.id)
        ? prev.filter(s => s.id !== symptom.id)
        : [...prev, symptom]
    );
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (selectedSymptoms.length === 0) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      setIsAnalyzing(true);
      setError('');
      try {
        const result = await api.post('/symptom-checks', {
          symptoms: selectedSymptoms.map(s => ({ id: s.id, label: s.label, dept: s.dept })),
          severity,
          duration,
        });
        setDiagResult(result);
        setStep(3);
      } catch (err) {
        setError(err.message || 'Analysis failed. Please try again.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setSeverity(5);
    setDuration(3);
    setStep(1);
    setDiagResult(null);
    setError('');
  };

  const strokeCircumference = 2 * Math.PI * 50;
  const strokeDashoffset = diagResult
    ? strokeCircumference - (diagResult.prob / 100) * strokeCircumference
    : strokeCircumference;

  const urgencyConfig = {
    routine:   { bg: 'rgba(16, 185, 129, 0.1)',  color: 'var(--primary)',       icon: '✅', label: 'Routine'         },
    urgent:    { bg: 'rgba(245, 158, 11, 0.1)',  color: 'hsl(38, 92%, 50%)',   icon: '⚠️', label: 'Needs Attention' },
    emergency: { bg: 'rgba(239, 68, 68, 0.1)',   color: 'hsl(0, 80%, 55%)',    icon: '🚨', label: 'Seek Care Now'   },
  };

  return (
    <div className="checker-container">
      <div className="glass-card" style={{ padding: '40px' }}>

        {/* Step Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Step {step} of 3
            </span>
            <h2 style={{ marginTop: 4 }}>AI Symptom Analyser</h2>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {selectedSymptoms.length > 0
              ? `${selectedSymptoms.length} symptom${selectedSymptoms.length !== 1 ? 's' : ''} selected`
              : 'Claude-powered Diagnosis'}
          </span>
        </div>

        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        {/* ── STEP 1: Symptom Selection ─────────────────────────────────── */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              Select all symptoms you are currently experiencing. Organised by body area for more accurate analysis.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {symptomGroups.map(group => (
                <div key={group.group}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: group.color,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    marginBottom: 10, borderBottom: `1px solid ${group.color}35`, paddingBottom: 6,
                  }}>
                    {group.group}
                  </div>
                  <div className="symptom-tag-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                    {group.symptoms.map(sym => {
                      const isSelected = selectedSymptoms.find(s => s.id === sym.id);
                      return (
                        <div
                          key={sym.id}
                          className={`symptom-tag ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleSymptom(sym)}
                          style={{ fontSize: 13, padding: '12px 10px' }}
                        >
                          {sym.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40 }}>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {selectedSymptoms.length} symptom{selectedSymptoms.length !== 1 ? 's' : ''} selected
              </div>
              <button
                className="btn-primary"
                disabled={selectedSymptoms.length === 0}
                style={{ opacity: selectedSymptoms.length === 0 ? 0.5 : 1 }}
                onClick={handleNextStep}
              >
                Continue ➜
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Severity & Context ────────────────────────────────── */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              Rate the intensity and duration so the AI can produce an accurate clinical assessment.
            </p>

            {/* Selected symptoms recap */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28,
              padding: 16, background: 'rgba(255,255,255,0.02)',
              borderRadius: 10, border: '1px solid var(--border-color)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', width: '100%', marginBottom: 4 }}>
                SELECTED SYMPTOMS
              </span>
              {selectedSymptoms.map(s => (
                <span key={s.id} style={{
                  fontSize: 12, fontWeight: 600, color: 'var(--primary)',
                  background: 'var(--primary-glow)', padding: '3px 10px', borderRadius: 20,
                }}>
                  {s.label}
                </span>
              ))}
            </div>

            <div className="severity-slider-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Symptom Severity</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{severity} / 10</span>
              </div>
              <input
                type="range" min="1" max="10" value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="slider-custom"
              />
              <div className="severity-labels">
                <span>Mild</span>
                <span>Moderate</span>
                <span>Severe</span>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 600, fontSize: 15 }}>Duration</label>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--secondary)' }}>
                  {duration} {duration === 1 ? 'Day' : 'Days'}
                </span>
              </div>
              <input
                type="range" min="1" max="14" value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="slider-custom"
                style={{ '--primary': 'var(--secondary)' }}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'hsl(0, 80%, 55%)', marginTop: 12, textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>Back</button>
              <button className="btn-primary" onClick={handleNextStep} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: 14, height: 14,
                      border: '2px solid white', borderTopColor: 'transparent',
                      borderRadius: '50%', animation: 'wave 1s infinite linear', marginRight: 8,
                    }}></span>
                    AI Analysing...
                  </>
                ) : 'Generate AI Diagnosis'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: AI Diagnosis Result ───────────────────────────────── */}
        {step === 3 && diagResult && (
          <div className="diagnosis-container" style={{ animation: 'fadeIn 0.4s' }}>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20,
                background: diagResult.aiPowered ? 'rgba(139, 92, 246, 0.12)' : 'rgba(100,100,100,0.08)',
                color: diagResult.aiPowered ? 'hsl(262, 83%, 68%)' : 'var(--text-muted)',
                border: `1px solid ${diagResult.aiPowered ? 'hsl(262, 83%, 68%)50' : 'var(--border-color)'}`,
              }}>
                {diagResult.aiPowered ? '✦ Claude AI Powered' : '⚙ Rule-based Analysis'}
              </span>
              {diagResult.urgencyLevel && (() => {
                const u = urgencyConfig[diagResult.urgencyLevel] || urgencyConfig.routine;
                return (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '3px 12px', borderRadius: 20,
                    background: u.bg, color: u.color, border: `1px solid ${u.color}40`,
                  }}>
                    {u.icon} {u.label}
                  </span>
                );
              })()}
            </div>

            {/* Donut + Condition */}
            <div className="diagnosis-donut-card">
              <svg className="donut-chart-svg">
                <circle cx="60" cy="60" r="50" className="donut-bg" />
                <circle
                  cx="60" cy="60" r="50"
                  className="donut-fg"
                  style={{
                    '--dashoffset': strokeDashoffset,
                    stroke: diagResult.prob > 80 ? 'var(--accent)' : 'var(--primary)',
                  }}
                />
                <text x="60" y="65" textAnchor="middle" className="donut-text">
                  {diagResult.prob}%
                </text>
              </svg>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Primary Indication Match
                </span>
                <h3 style={{ fontSize: 22, color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>
                  {diagResult.condition}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                  {diagResult.assessment || diagResult.advice}
                </p>
              </div>
            </div>

            {/* Home care */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)', padding: 24,
            }}>
              <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                🟢 Home care guidance
              </h4>
              <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                {diagResult.advice}
              </p>
            </div>

            {/* Specialist referral */}
            <div className="specialist-match-card">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Recommended Department
                </span>
                <h4 style={{ fontSize: 18, color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
                  {diagResult.recommendedDept}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  AI matched your symptoms to a {diagResult.recommendedDept?.toLowerCase()} specialist.
                </p>
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setFilterDept(diagResult.recommendedDept);
                  setTab('scheduler');
                }}
              >
                Schedule Specialist 🗓️
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <button className="btn-secondary" style={{ padding: '10px 24px', fontSize: 13 }} onClick={handleReset}>
                🔄 Start New Analysis
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
