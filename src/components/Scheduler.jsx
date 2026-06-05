import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';

export default function Scheduler({ addAppointment, filterDept, setFilterDept, doctors: doctorsProp, activeRequest, setActiveRequest, setTab, patientUser }) {
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [localDoctors, setLocalDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Self-fetch doctors if the parent prop is empty (e.g. bootstrap failed)
  useEffect(() => {
    if (doctorsProp?.length > 0) {
      setLocalDoctors(doctorsProp);
    } else {
      setLoadingDoctors(true);
      api.get('/doctors')
        .then(setLocalDoctors)
        .catch(() => setLocalDoctors([]))
        .finally(() => setLoadingDoctors(false));
    }
  }, [doctorsProp]);

  const doctors = localDoctors;

  const handleInstantLiveConsult = async () => {
    try {
      setBooking(true);
      setError('');

      // Create a consult request in the DB
      const res = await api.post('/consult-requests', {
        doctorId: selectedDoctor.id,
        symptomsSummary: 'Instant live telehealth consult requested',
        medicalIntake: patientUser?.medicalIntake || {},
      });

      const requestPayload = {
        id: res.requestId,
        token: res.token,
        patientName: patientUser?.name || 'Alex Rivera',
        patientAge: 32,
        symptoms: 'Extreme neural tension & screen fatigue',
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorAvatar: selectedDoctor.avatar,
        status: 'pending',
        medicalIntake: patientUser?.medicalIntake || {},
      };

      setActiveRequest(requestPayload);

      // Emit via Socket.IO so the doctor side receives it in real time
      const socket = getSocket();
      socket.emit('consult:request', {
        token: res.token,
        doctorId: selectedDoctor.id,
        patientName: patientUser?.name || 'Alex Rivera',
        symptoms: 'Extreme neural tension & screen fatigue',
        medicalIntake: patientUser?.medicalIntake || {},
      });

      setTab('telehealth');
      setSelectedDoctor(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  const departments = ['All', 'General Health', 'Cardiology', 'Neurology', 'Pediatrics', 'Psychiatry'];

  const filteredDoctors = filterDept === 'All'
    ? doctors
    : doctors.filter((dr) => dr.specialty === filterDept);

  const handleOpenBooking = (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate(doc.days?.[0] || '');
    setSelectedSlot(null);
    setError('');
  };

  const handleConfirmBooking = async () => {
    try {
      setBooking(true);
      setError('');

      const appt = await api.post('/appointments', {
        doctorId: selectedDoctor.id,
        scheduledDate: selectedDate,
        scheduledSlot: `${selectedDate} at ${selectedSlot}`,
        type: 'SCHEDULED',
      });

      addAppointment(appt);
      setTicketDetails(appt);
      setSelectedDoctor(null);
    } catch (err) {
      setError(err.message || 'Booking failed. Slot may no longer be available.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="scheduler-container">
      {/* Top filter row */}
      <div>
        <h3 style={{ marginBottom: 16 }}>Specialist Directory</h3>
        <div className="department-filter-row">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={`dept-btn ${filterDept === dept ? 'active' : ''}`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loadingDoctors && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, animation: 'heartbeat 1.5s infinite' }}>💚</div>
          <p>Loading specialists...</p>
        </div>
      )}
      {!loadingDoctors && filteredDoctors.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🩺</div>
          <h3 style={{ marginBottom: 8 }}>No specialists found</h3>
          <p style={{ fontSize: 13 }}>Try selecting a different department or check back later.</p>
        </div>
      )}
      <div className="doctor-list-grid" style={{ animation: 'slideUp 0.4s' }}>
        {filteredDoctors.map((doc) => (
          <div key={doc.id} className="glass-card doctor-card">
            <div className="doctor-profile-header">
              <img src={doc.avatar} alt={doc.name} className="doctor-avatar-large" />
              <div>
                <h4 style={{ fontSize: 18, color: 'var(--text-primary)' }}>{doc.name}</h4>
                <p style={{ color: 'var(--primary)', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                  {doc.qualification}
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                  {doc.specialty} • {doc.workplace}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <span className="rating-badge">★ {doc.rating}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>({doc.reviews} patient reviews)</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', margin: '8px 0' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Experience</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{doc.exp} Years</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Consultation Fee</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{doc.fee}</span>
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => handleOpenBooking(doc)}>
              Schedule Session 🗓️
            </button>
          </div>
        ))}
      </div>

      {/* Booking Slot Selection Modal */}
      {selectedDoctor && (
        <div className="modal-overlay" onClick={() => { setSelectedDoctor(null); setError(''); }}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--primary-glow-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>Booking Console</span>
                <h3 style={{ marginTop: 4 }}>Select Date & Time</h3>
              </div>
              <button className="theme-toggle" onClick={() => { setSelectedDoctor(null); setError(''); }}>✕</button>
            </div>

            {/* Doctor mini info */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <img src={selectedDoctor.avatar} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
              <div>
                <h4 style={{ fontSize: 15 }}>{selectedDoctor.name}</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedDoctor.qualification}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedDoctor.specialty} Specialist • {selectedDoctor.workplace}</p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="form-group">
              <label>Available Consultation Days</label>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {selectedDoctor.days?.map((day) => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDate(day); setSelectedSlot(null); }}
                    style={{
                      background: selectedDate === day ? 'var(--secondary)' : 'var(--bg-secondary)',
                      color: selectedDate === day ? '#fff' : 'var(--text-secondary)',
                      border: '1px solid var(--border-color)',
                      padding: '8px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'var(--transition-fast)',
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Grid */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label>Select Time Slot</label>
              <div className="slot-grid">
                {selectedDoctor.slots?.map((slot) => (
                  <div
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`slot-item ${selectedSlot === slot ? 'selected' : ''}`}
                  >
                    {slot}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 8, textAlign: 'center' }}>{error}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 32 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => { setSelectedDoctor(null); setError(''); }}>
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', opacity: (!selectedSlot || booking) ? 0.5 : 1 }}
                  disabled={!selectedSlot || booking}
                  onClick={handleConfirmBooking}
                >
                  {booking ? 'Booking...' : 'Schedule Session 🗓️'}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)', opacity: 0.3 }}></div>
                <span style={{ padding: '0 12px', fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border-color)', opacity: 0.3 }}></div>
              </div>

              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--secondary) 0%, #0284c7 100%)',
                  borderColor: 'var(--secondary)',
                  boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)',
                  opacity: booking ? 0.5 : 1,
                }}
                disabled={booking}
                onClick={handleInstantLiveConsult}
              >
                ⚡ Instant Live Consult (Rapido Mode) ➜
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Confirmation Ticket */}
      {ticketDetails && (
        <div className="modal-overlay" onClick={() => setTicketDetails(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ color: 'var(--primary)' }}>Booking Successful!</h3>
              <button className="theme-toggle" onClick={() => setTicketDetails(null)}>✕</button>
            </div>

            <div className="ticket-wrapper">
              <div style={{ paddingBottom: 20 }}>
                <span style={{ fontSize: 24 }}>🎫</span>
                <h4 style={{ fontSize: 20, margin: '8px 0 2px 0' }}>PulseFlow India Telehealth</h4>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Appointment Receipt
                </span>
              </div>

              <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PHYSICIAN</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ticketDetails.doctor?.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>QUALIFICATION</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{ticketDetails.doctor?.qualification}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>FACILITY / CLINIC</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', maxWidth: '60%', textAlign: 'right' }}>
                    {ticketDetails.doctor?.workplace}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>DEPARTMENT</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{ticketDetails.doctor?.specialty}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>SCHEDULED TIME</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{ticketDetails.slot}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>TICKET ID</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--secondary)' }}>{ticketDetails.id}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>FEE CHARGED</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>{ticketDetails.doctor?.fee}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>STATUS</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>🟢 CONFIRMED</span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center', margin: '20px 0 10px 0', lineHeight: 1.4 }}>
              Confirmation details saved. You can launch your video booth session directly from the home dashboard.
            </p>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setTicketDetails(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
