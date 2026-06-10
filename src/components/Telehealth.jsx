import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../lib/socket.js';

export default function Telehealth({
  activeSession,
  endSession,
  setTab,
  simulatorMode,
  activeRequest,
  setActiveRequest,
  setActiveSession,
  patientUser,
  doctorUser,
}) {
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatText, setChatText] = useState('');
  const [messages, setMessages] = useState([]);

  const chatBottomRef = useRef(null);

  // ── Socket.IO: join doctor room and listen for events ──────────────────────
  useEffect(() => {
    const socket = getSocket();

    // Doctor joins their personal notification room
    if (simulatorMode === 'doctor' && doctorUser?.id) {
      socket.emit('doctor:join', { doctorId: doctorUser.id });
    }

    // Patient receives session:started (doctor accepted)
    socket.on('session:started', ({ sessionId, doctorName, doctorAvatar, doctorSpecialty, doctorQualification, doctorWorkplace }) => {
      if (activeRequest) {
        const updatedReq = { ...activeRequest, status: 'accepted' };
        setActiveRequest(updatedReq);
        setActiveSession({
          sessionId,
          id: activeRequest.id,
          doctor: {
            id: activeRequest.doctorId,
            name: doctorName || activeRequest.doctorName,
            avatar: doctorAvatar || activeRequest.doctorAvatar,
            specialty: doctorSpecialty || activeRequest.doctorSpecialty || 'General Health',
            qualification: doctorQualification || activeRequest.doctorQualification || '',
            workplace: doctorWorkplace || activeRequest.doctorWorkplace || '',
          },
          date: 'Today (Live)',
          slot: 'Instant Consultation',
        });
      }
    });

    // Real-time chat messages
    socket.on('chat:message', ({ text, senderRole, sentAt }) => {
      setMessages((prev) => [...prev, { sender: senderRole.toLowerCase(), text, sentAt }]);
    });

    return () => {
      socket.off('session:started');
      socket.off('chat:message');
    };
  }, [simulatorMode, doctorUser?.id, activeRequest]);

  // Greeting when call connects
  useEffect(() => {
    if (activeSession) {
      setMessages([
        {
          sender: 'doctor',
          text: `Hello! I'm ${activeSession.doctor?.name}. I've received your health vitals telemetry. How are you feeling today?`,
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [activeSession?.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;

    const senderRole = simulatorMode === 'doctor' ? 'doctor' : 'patient';
    const newMsg = { sender: senderRole, text: chatText };
    setMessages((prev) => [...prev, newMsg]);

    // Emit via Socket.IO if we have a token (Rapido session)
    if (activeRequest?.token && activeSession?.sessionId) {
      const socket = getSocket();
      const userId = senderRole === 'patient'
        ? (patientUser?.id || 'user-alex-rivera')
        : (doctorUser?.id ? `user-${doctorUser.id}` : 'user-dr-sharma');

      socket.emit('chat:message', {
        sessionId: activeSession.sessionId,
        text: chatText,
        senderRole: senderRole.toUpperCase(),
        senderId: userId,
        token: activeRequest.token,
      });
    }

    setChatText('');

    // Simulate doctor response only when user is in patient mode
    if (simulatorMode === 'patient') {
      setTimeout(() => {
        const lower = chatText.toLowerCase();
        let responseText = `Thank you for sharing that. I am reviewing your metrics. Your last heart rate and blood pressure logs look within normal bounds. I recommend maintaining resting vitals today.`;

        if (lower.includes('fever') || lower.includes('hot') || lower.includes('temperature')) {
          responseText = `A fever of moderate degree matches viral immune responses. Stay fully hydrated and log your temperature every 4 hours.`;
        } else if (lower.includes('pain') || lower.includes('hurt') || lower.includes('chest')) {
          responseText = `I notice you mentioned discomfort. If you feel any chest pressure or tight breathing, remain sitting, relax your shoulders, and do not exert yourself.`;
        } else if (lower.includes('tired') || lower.includes('sleep') || lower.includes('exhausted')) {
          responseText = `Neural fatigue is closely linked to sleep cycles. Try the Guided Breathing bubble in the Wellness tab to lower cortisol levels.`;
        } else if (lower.includes('thanks') || lower.includes('thank you') || lower.includes('ok')) {
          responseText = `You're very welcome! Keep tracking your vitals. I'm signing off your digital prescription now.`;
        }

        setMessages((prev) => [...prev, { sender: 'doctor', text: responseText }]);
      }, 1500);
    }
  };

  // ── No active session: show radar or idle screen ─────────────────────────
  if (!activeSession) {
    if (activeRequest && activeRequest.status === 'pending') {
      if (simulatorMode === 'patient') {
        return (
          <div className="radar-container" style={{ animation: 'fadeIn 0.5s', textAlign: 'center' }}>
            <div className="radar-sweep">
              <img
                src={activeRequest.doctorAvatar || '/src/assets/dr_vance.png'}
                alt="Doctor Search"
                className="radar-avatar"
              />
              <div className="radar-blip one"></div>
              <div className="radar-blip two"></div>
            </div>

            <h3 style={{ marginTop: 24, fontSize: 20, color: 'white' }}>Establishing Real-Time Pipeline...</h3>
            <p style={{ color: 'var(--primary)', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <span className="live-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulseGlow 1.5s infinite' }}></span>
              Connecting with {activeRequest.doctorName}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 12, maxWidth: 360, margin: '8px auto 0 auto', lineHeight: 1.4 }}>
              Dispatched hereditary metrics & line of work exertion metrics to provider. Swap the simulator toggle to <b>Physician App Mode</b> to accept this consult.
            </p>

            <button
              className="btn-secondary"
              style={{ marginTop: 24, borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }}
              onClick={() => { setActiveRequest(null); setActiveSession(null); }}
            >
              Cancel Dispatch Pipeline ❌
            </button>
          </div>
        );
      } else if (simulatorMode === 'doctor') {
        return (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', animation: 'slideUp 0.4s', border: '1px solid var(--secondary)' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📡</span>
            <h3>Incoming Live Consult Request</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 440, margin: '8px auto 28px auto', lineHeight: 1.5 }}>
              Patient <b>{activeRequest.patientName}</b> has dispatched a live telehealth request with active occupational exposure telemetry.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setActiveRequest(null)}>
                Decline Request
              </button>
              <button
                className="btn-primary"
                style={{ background: 'var(--secondary)', borderColor: 'var(--secondary)' }}
                onClick={() => {
                  // Emit accept via Socket.IO
                  if (activeRequest.token) {
                    const socket = getSocket();
                    socket.emit('consult:accept', {
                      token: activeRequest.token,
                      doctorId: doctorUser?.id || activeRequest.doctorId,
                      doctorName: doctorUser?.name || activeRequest.doctorName,
                      doctorAvatar: doctorUser?.avatar || activeRequest.doctorAvatar,
                    });
                  }

                  // Local state update (immediate UI response)
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
                      workplace: 'Apollo Hospital',
                    },
                    date: 'Today (Live)',
                    slot: 'Instant Consultation',
                  });
                }}
              >
                Accept & Connect Call ➜
              </button>
            </div>
          </div>
        );
      }
    }

    return (
      <div className="glass-card" style={{ padding: '60px', textAlign: 'center', animation: 'slideUp 0.4s' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>📹</div>
        <h3>Telehealth Consultation Room</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 480, margin: '12px auto 30px auto', lineHeight: 1.5 }}>
          You do not have an active medical consultation session running. Schedule an appointment or launch a consult from your upcoming lists.
        </p>
        <button className="btn-primary" onClick={() => setTab('scheduler')}>
          Browse Doctor Directory 🗓️
        </button>
      </div>
    );
  }

  // ── Active call layout ────────────────────────────────────────────────────
  const FALLBACK_PATIENT = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';
  const FALLBACK_DOCTOR = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=256';
  const isDoctorMode = simulatorMode === 'doctor';
  const mainFeedAvatar = isDoctorMode
    ? FALLBACK_PATIENT
    : (activeSession.doctor?.avatar || FALLBACK_DOCTOR);
  const mainFeedName = isDoctorMode
    ? (activeRequest?.patientName || patientUser?.name || 'Alex Rivera')
    : (activeSession.doctor?.name || 'Your Doctor');
  const selfFeedAvatar = isDoctorMode
    ? (activeSession.doctor?.avatar || FALLBACK_DOCTOR)
    : FALLBACK_PATIENT;

  return (
    <div className="telehealth-grid" style={{ animation: 'fadeIn 0.5s' }}>

      {/* Video Screens */}
      <div className="telehealth-screens">
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {camOff ? (
            <div style={{ width: '100%', height: '100%', background: '#0b1329', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: 48 }}>👤</div>
              <h4 style={{ color: 'var(--text-secondary)' }}>Video Signal Disconnected</h4>
            </div>
          ) : (
            <img src={mainFeedAvatar} alt={mainFeedName} className="doctor-video-feed" style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          )}

          <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(0,0,0,0.5)', padding: '8px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulseGlow 1.5s infinite' }}></span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>LIVE • {mainFeedName}</span>
          </div>

          <div style={{ position: 'absolute', top: 24, right: 24, background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: 20, fontSize: 12, color: 'white', fontWeight: 600, zIndex: 10 }}>
            📶 Connection: Excellent
          </div>
        </div>

        {/* Self Preview */}
        <div className="patient-mini-feed">
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1c2541' }}>
            {micMuted && (
              <span style={{ position: 'absolute', top: 8, left: 8, fontSize: 12, background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: 4, zIndex: 10 }}>🎙️ Off</span>
            )}
            <img src={selfFeedAvatar} alt="Self" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '2px 0' }}>
              <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>Self (Preview)</span>
            </div>
          </div>
        </div>

        {/* Call Controls */}
        <div className="telehealth-controls" style={{ zIndex: 20 }}>
          <button className="btn-ctrl" style={{ color: micMuted ? 'var(--danger)' : 'white', background: micMuted ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.6)' }} onClick={() => setMicMuted(!micMuted)} title="Mute">
            {micMuted ? '🔇' : '🎙️'}
          </button>
          <button className="btn-ctrl" style={{ color: camOff ? 'var(--danger)' : 'white', background: camOff ? 'rgba(239,68,68,0.2)' : 'rgba(0,0,0,0.6)' }} onClick={() => setCamOff(!camOff)} title="Camera">
            {camOff ? '❌📹' : '📹'}
          </button>
          <button className="btn-ctrl" style={{ color: isScreenSharing ? 'var(--primary)' : 'white', background: 'rgba(0,0,0,0.6)' }} onClick={() => setIsScreenSharing(!isScreenSharing)} title="Screen Share">
            🖥️
          </button>
          <button className="btn-ctrl danger" onClick={endSession} style={{ background: 'var(--danger)' }} title="End Consult">
            🔴
          </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="chat-sidebar">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <h4 style={{ fontSize: 15, margin: 0 }}>Session Chat</h4>
          <span style={{ fontSize: 11, background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>Active</span>
        </div>

        <div className="chat-messages">
          {messages.map((msg, idx) => {
            const outgoing = msg.sender === (isDoctorMode ? 'doctor' : 'patient');
            const senderLabel = msg.sender === 'doctor'
              ? (activeSession.doctor?.name || 'Doctor')
              : (activeRequest?.patientName || patientUser?.name || 'Alex Rivera');

            return (
              <div key={idx} className={`msg ${outgoing ? 'outgoing' : 'incoming'}`}>
                <span style={{ fontSize: 10, fontWeight: 700, display: 'block', marginBottom: 2, color: outgoing ? '#fff' : 'var(--primary)' }}>
                  {outgoing ? 'YOU' : senderLabel}
                </span>
                {msg.text}
              </div>
            );
          })}
          <div ref={chatBottomRef}></div>
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-area">
          <input
            type="text"
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Type health report or symptoms..."
            style={{ flexGrow: 1, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 14px', borderRadius: 8, fontSize: 13, outline: 'none' }}
          />
          <button type="submit" className="btn-primary" style={{ padding: '10px 16px', borderRadius: 8, boxShadow: 'none' }}>
            ➜
          </button>
        </form>
      </div>
    </div>
  );
}
