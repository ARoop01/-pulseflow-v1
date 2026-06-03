import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';

export default function WellnessToolkit() {
  const breathingCyclesRef = useRef(0);
  // Breathing Assistant State
  const [breathingPhase, setBreathingPhase] = useState('Inhale');
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(false);

  // Hydration Tracker State
  const [waterCups, setWaterCups] = useState(3);
  const waterGoal = 8;

  // Box Breathing cycle state management
  useEffect(() => {
    let interval = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathingSeconds(prev => {
          if (prev === 1) {
            // Transition phase
            setBreathingPhase(currentPhase => {
              if (currentPhase === 'Hold (Empty)') {
                breathingCyclesRef.current += 1;
              }
              switch (currentPhase) {
                case 'Inhale': return 'Hold (Full)';
                case 'Hold (Full)': return 'Exhale';
                case 'Exhale': return 'Hold (Empty)';
                case 'Hold (Empty)': return 'Inhale';
                default: return 'Inhale';
              }
            });
            return 4; // Reset box timer to 4 seconds
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Log completed breathing session when user stops
      if (breathingCyclesRef.current > 0) {
        api.post('/wellness', { sessionType: 'BREATHING', value: breathingCyclesRef.current }).catch(() => {});
        breathingCyclesRef.current = 0;
      }
      setBreathingPhase('Inhale');
      setBreathingSeconds(4);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  const handleAddWater = () => {
    if (waterCups >= waterGoal) return;
    setWaterCups(prev => prev + 1);
    api.post('/wellness', { sessionType: 'HYDRATION', value: 1 }).catch(() => {});
  };

  const handleResetWater = () => {
    setWaterCups(0);
  };

  // Compile visual breathing details
  const getBreathingDetails = () => {
    switch (breathingPhase) {
      case 'Inhale':
        return {
          prompt: 'Inhale Deeply',
          glow: 'rgba(16, 185, 129, 0.4)',
          color: 'var(--primary)',
          scale: 1.4
        };
      case 'Hold (Full)':
        return {
          prompt: 'Hold Breath',
          glow: 'rgba(14, 165, 233, 0.4)',
          color: 'var(--secondary)',
          scale: 1.4
        };
      case 'Exhale':
        return {
          prompt: 'Exhale Slowly',
          glow: 'rgba(139, 92, 246, 0.4)',
          color: 'var(--accent)',
          scale: 1.0
        };
      case 'Hold (Empty)':
        return {
          prompt: 'Hold & Rest',
          glow: 'rgba(100, 116, 139, 0.4)',
          color: 'var(--text-muted)',
          scale: 1.0
        };
      default:
        return {};
    }
  };

  const breathing = getBreathingDetails();
  const hydrationPct = (waterCups / waterGoal) * 100;

  return (
    <div className="wellness-grid" style={{ animation: 'slideUp 0.4s' }}>
      
      {/* 1. Mindful Breathing Assistant */}
      <div className="glass-card breathing-hub">
        <div style={{ textAlign: 'center' }}>
          <h3>Mindfulness Breathing Assistant</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Reduce clinical stress with balanced box breathing (4-4-4-4 technique)
          </p>
        </div>

        {/* Pulsating Orb */}
        <div className="breathing-circle-outer">
          <div 
            className="breathing-circle-inner"
            style={{
              animation: isBreathingActive ? 'none' : 'breathing 8s infinite ease-in-out',
              transform: isBreathingActive ? `scale(${breathing.scale})` : '',
              boxShadow: isBreathingActive ? `0 0 60px ${breathing.glow}` : '',
              background: isBreathingActive 
                ? `radial-gradient(circle, ${breathing.color} 0%, rgba(30, 41, 59, 0.2) 75%)` 
                : 'radial-gradient(circle, var(--primary) 0%, rgba(16, 185, 129, 0.2) 70%)',
              transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1), background 1s ease, box-shadow 1s ease'
            }}
          >
            <div className="breathing-prompt" style={{ textAlign: 'center' }}>
              <div>{isBreathingActive ? breathing.prompt : 'Resting'}</div>
              {isBreathingActive && (
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, fontFamily: 'monospace' }}>
                  {breathingSeconds}s
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Breathing controls */}
        <div>
          <button 
            className="btn-primary" 
            style={{ 
              background: isBreathingActive ? 'var(--danger)' : 'linear-gradient(135deg, var(--primary) 0%, #059669 100%)',
              boxShadow: isBreathingActive ? '0 4px 15px rgba(239, 68, 68, 0.2)' : ''
            }} 
            onClick={() => setIsBreathingActive(!isBreathingActive)}
          >
            {isBreathingActive ? '🛑 Terminate Assistant' : '✨ Activate Breathing Assistant'}
          </button>
        </div>
      </div>

      {/* 2. Water Hydration Tracker */}
      <div className="glass-card water-tracker-container" style={{ padding: '48px' }}>
        <div style={{ textAlign: 'center' }}>
          <h3>Interactive Hydration Tracker</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            Monitor and log daily water telemetry indices
          </p>
        </div>

        {/* Water tank visual glass */}
        <div className="water-tank-wrapper">
          <div 
            className="water-fill-level"
            style={{ height: `${hydrationPct}%` }}
          >
            {hydrationPct > 0 && (
              <>
                <div className="water-wave"></div>
                <div className="water-wave-secondary"></div>
              </>
            )}
          </div>
          
          {/* Overlay glass indicator */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10, textAlign: 'center', pointerEvents: 'none' }}>
            <span style={{ fontSize: 28, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>💧</span>
            <h4 style={{ fontSize: 24, fontWeight: 800, color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {Math.round(hydrationPct)}%
            </h4>
            <span style={{ fontSize: 11, color: '#e0f2fe', fontWeight: 600, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {waterCups} / {waterGoal} Cups
            </span>
          </div>
        </div>

        {/* Control Button Sets */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button
            className="btn-primary"
            onClick={handleAddWater}
            disabled={waterCups >= waterGoal}
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.2)',
              opacity: waterCups >= waterGoal ? 0.5 : 1,
              cursor: waterCups >= waterGoal ? 'not-allowed' : 'pointer'
            }}
          >
            Log 1 Cup (250ml) 🥤
          </button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: waterCups >= waterGoal ? 'var(--primary)' : 'var(--text-secondary)' }}>
              {waterCups >= waterGoal 
                ? '🌟 Daily Target Achieved!' 
                : `${waterGoal - waterCups} cups left to hit wellness index`}
            </span>
            <button 
              onClick={handleResetWater}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
                textDecoration: 'underline'
              }}
            >
              Reset Tracker
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
