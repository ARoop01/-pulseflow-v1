import React, { useState } from 'react';
import { api } from '../lib/api.js';

export default function SymptomChecker({ setTab, setFilterDept }) {
  const [step, setStep] = useState(1);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState(3);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Expanded available symptoms to 20 total cases!
  const availableSymptoms = [
    { id: 'fever', label: '🌡️ Fever', dept: 'General Health' },
    { id: 'headache', label: '🧠 Headache', dept: 'Neurology' },
    { id: 'cough', label: '💨 Cough', dept: 'General Health' },
    { id: 'sob', label: '🫁 Dyspnea', dept: 'Cardiology' },
    { id: 'fatigue', label: '💤 Fatigue', dept: 'General Health' },
    { id: 'muscle', label: '💪 Muscle Pain', dept: 'General Health' },
    { id: 'chest', label: '❤️ Chest Tightness', dept: 'Cardiology' },
    { id: 'throat', label: '🗣️ Sore Throat', dept: 'General Health' },
    { id: 'dizzy', label: '🌀 Dizziness', dept: 'Neurology' },
    { id: 'anxiety', label: '💭 Anxiety', dept: 'Psychiatry' },
    
    // 10 new symptoms added as requested
    { id: 'indigestion', label: '🧃 Acidity/Stomach Ache', dept: 'General Health' },
    { id: 'joint_pain', label: '🦴 Joint Pain/Back Ache', dept: 'General Health' },
    { id: 'blurry_vision', label: '👁️ Blurry Vision/Sore Eyes', dept: 'General Health' },
    { id: 'skin_rash', label: '🩹 Skin Rash/Itchiness', dept: 'General Health' },
    { id: 'insomnia', label: '🛌 Insomnia/Sleep Trouble', dept: 'Psychiatry' },
    { id: 'acid_reflux', label: '🔥 Acid Reflux/Gerd', dept: 'General Health' },
    { id: 'migraine', label: '⚡ Migraine Headache', dept: 'Neurology' },
    { id: 'sneezing', label: '🤧 Runny Nose/Sneezing', dept: 'General Health' },
    { id: 'palpitations', label: '💓 Heart Palpitations', dept: 'Cardiology' },
    { id: 'panic_attack', label: '🌪️ Extreme Panic/Fear', dept: 'Psychiatry' }
  ];

  const handleToggleSymptom = (symptom) => {
    setSelectedSymptoms(prev => {
      if (prev.find(s => s.id === symptom.id)) {
        return prev.filter(s => s.id !== symptom.id);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const handleNextStep = () => {
    if (step === 1 && selectedSymptoms.length === 0) return;
    
    if (step === 2) {
      setIsAnalyzing(true);
      setTimeout(async () => {
        setIsAnalyzing(false);
        setStep(3);
        // Persist symptom check to backend (fire-and-forget)
        try {
          const diagResult = getDiagnostics();
          await api.post('/symptom-checks', {
            symptoms: selectedSymptoms.map(s => ({ id: s.id, label: s.label, dept: s.dept })),
            severity,
            durationDays: duration,
            recommendedDepartment: getRecommendedDept(),
            diagnosisCondition: diagResult.condition,
            diagnosisProbability: diagResult.prob,
          });
        } catch (_) {
          // non-blocking — UI already shows results
        }
      }, 2000);
    } else {
      setStep(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setSelectedSymptoms([]);
    setSeverity(5);
    setDuration(3);
    setStep(1);
  };

  // Get recommended specialist department based on selected symptoms
  const getRecommendedDept = () => {
    if (selectedSymptoms.find(s => s.dept === 'Cardiology')) return 'Cardiology';
    if (selectedSymptoms.find(s => s.dept === 'Neurology')) return 'Neurology';
    if (selectedSymptoms.find(s => s.dept === 'Psychiatry')) return 'Psychiatry';
    if (selectedSymptoms.find(s => s.dept === 'Pediatrics')) return 'Pediatrics';
    return 'General Health';
  };

  const recommendedDept = getRecommendedDept();

  // Custom diagnostic probability outputs including expanded symptom logic
  const getDiagnostics = () => {
    const mainSymptom = selectedSymptoms[0]?.id;
    
    if (mainSymptom === 'chest' || mainSymptom === 'sob' || mainSymptom === 'palpitations') {
      return {
        condition: 'Cardiovascular Assessment Triggered',
        prob: 78,
        desc: 'Symptoms like chest tight or heart palpitations suggest localized cardiac stress or mild dyspnea. Early evaluation by an Indian specialist is recommended to monitor blood pressure trends.',
        advice: 'Avoid physical strain immediately, rest in a comfortable sitting posture, and record your heart rate vitals.'
      };
    }
    if (mainSymptom === 'headache' || mainSymptom === 'dizzy' || mainSymptom === 'migraine') {
      return {
        condition: 'Neurological Tension / Migraine Syndrome',
        prob: 85,
        desc: 'Typical presentation of neurological fatigue, severe migraine, or neural tension. Elevated severity warrants monitoring sleep habits and tracking neurological metrics.',
        advice: 'Stay hydrated, dim screen light sources immediately, and rest in a dark, quiet room.'
      };
    }
    if (mainSymptom === 'anxiety' || mainSymptom === 'insomnia' || mainSymptom === 'panic_attack') {
      return {
        condition: 'Autonomic Hyperarousal & Stress Response',
        prob: 84,
        desc: 'Elevated cognitive anxiety and stress stimulating somatic panic, racing pulse, or sleep disturbances. Practicing guided relaxation lowers metrics.',
        advice: 'Practice box breathing (4-4-4-4) in our Wellness Hub and log water intake.'
      };
    }
    if (mainSymptom === 'indigestion' || mainSymptom === 'acid_reflux') {
      return {
        condition: 'Acute Gastrointestinal Reflux / Dyspepsia',
        prob: 72,
        desc: 'Upper digestive tract irritation, high acidity, or stomach pain. Often linked to metabolic baseline levels or food sensitivities.',
        advice: 'Maintain a bland light diet, hydrate regularly, and avoid lying down flat immediately after meals.'
      };
    }
    if (mainSymptom === 'joint_pain') {
      return {
        condition: 'Inflammatory Joint / Back Strain',
        prob: 65,
        desc: 'Musculoskeletal stress or inflammation located in major joints. Often aggravated by bad ergonomic posture or physical exertion.',
        advice: 'Apply warm compress, practice light stretches, and keep moving gently to prevent joint stiffening.'
      };
    }
    if (mainSymptom === 'blurry_vision') {
      return {
        condition: 'Ocular Strain / Visual Fatigue',
        prob: 60,
        desc: 'Fatigue in ocular muscles or mild dry eye syndrome, highly associated with excessive digital screen exposure.',
        advice: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds. Rest eyes.'
      };
    }
    if (mainSymptom === 'skin_rash') {
      return {
        condition: 'Contact Dermatitis / Urticaria',
        prob: 68,
        desc: 'Localized inflammatory response on dermal layers, possibly triggered by environmental factors or soap compounds.',
        advice: 'Avoid scratching the affected region, keep skin moisturized, and wash with mild cool water.'
      };
    }
    return {
      condition: 'Acute Viral Syndrome / Coryza',
      prob: 70,
      desc: 'Standard viral indicators showing respiratory immune response. Vitals should remain optimal, and recovery is standard with adequate care.',
      advice: 'Maintain adequate fluid hydration, get physical rest, and track core body temperature indices.'
    };
  };

  const diag = getDiagnostics();

  // Donut SVG circumference calculation
  const strokeCircumference = 2 * Math.PI * 50; // 314.15
  const strokeDashoffset = strokeCircumference - (diag.prob / 100) * strokeCircumference;

  return (
    <div className="checker-container">
      <div className="glass-card" style={{ padding: '40px' }}>
        
        {/* Step Indicator Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Step {step} of 3
            </span>
            <h2 style={{ marginTop: 4 }}>Symptom & Wellness Analyst</h2>
          </div>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI-Diagnostic Simulator</span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {/* STEP 1: Symptom Selection */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: 15 }}>
              Select any primary or secondary symptoms you are currently experiencing to run our wellness matching engine:
            </p>

            <div className="symptom-tag-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
              {availableSymptoms.map(sym => {
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
                Continue Analyzer ➜
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Severity & Context Details */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 15 }}>
              Help us understand the intensity and duration of your symptoms to calculate correct wellness indices:
            </p>

            {/* Severity Slider */}
            <div className="severity-slider-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: 15 }}>Symptom Severity Intensity</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{severity} / 10</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="slider-custom"
              />
              <div className="severity-labels">
                <span>Mild (Disturbance)</span>
                <span>Moderate (Restricting)</span>
                <span>Severe (Acute Stress)</span>
              </div>
            </div>

            {/* Duration Input */}
            <div className="form-group" style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontWeight: 600, fontSize: 15 }}>Symptom Duration (Days)</label>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--secondary)' }}>{duration} {duration === 1 ? 'Day' : 'Days'}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="14" 
                value={duration} 
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="slider-custom"
                style={{ '--primary': 'var(--secondary)' }}
              />
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn-primary" onClick={handleNextStep} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'wave 1s infinite linear', marginRight: 8 }}></span>
                    Analyzing Vitals...
                  </>
                ) : (
                  'Generate Diagnostics'
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete Analysis Dashboard */}
        {step === 3 && (
          <div className="diagnosis-container" style={{ animation: 'fadeIn 0.4s' }}>
            
            {/* Donut Chart Probability Card */}
            <div className="diagnosis-donut-card">
              <svg className="donut-chart-svg">
                <circle cx="60" cy="60" r="50" className="donut-bg" />
                <circle 
                  cx="60" 
                  cy="60" 
                  r="50" 
                  className="donut-fg"
                  style={{
                    '--dashoffset': strokeDashoffset,
                    stroke: diag.prob > 80 ? 'var(--accent)' : 'var(--primary)'
                  }}
                />
                <text x="60" y="65" textAnchor="middle" className="donut-text">
                  {diag.prob}%
                </text>
              </svg>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Primary Indication Match
                </span>
                <h3 style={{ fontSize: 22, color: 'var(--text-primary)', margin: '4px 0 8px 0' }}>{diag.condition}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.5 }}>
                  {diag.desc}
                </p>
              </div>
            </div>

            {/* Recommendations & Action Plan */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: 24 }}>
              <h4 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                🟢 Home care guidance recommendation
              </h4>
              <p style={{ color: 'var(--text-primary)', fontSize: 14, lineHeight: 1.5, fontWeight: 500 }}>
                {diag.advice}
              </p>
            </div>

            {/* Specialist Matching Redirect Card */}
            <div className="specialist-match-card">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Recommended Department Specialist
                </span>
                <h4 style={{ fontSize: 18, color: 'var(--text-primary)', margin: '4px 0 2px 0' }}>
                  {recommendedDept} Department
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  We matched your vitals with our on-duty {recommendedDept.toLowerCase()} specialists.
                </p>
              </div>
              <button 
                className="btn-primary"
                onClick={() => {
                  setFilterDept(recommendedDept);
                  setTab('scheduler');
                }}
              >
                Schedule Specialist 🗓️
              </button>
            </div>

            {/* Reset Button */}
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
