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
  const [aboutDoctor, setAboutDoctor] = useState(null); // doctor to show credentials for

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

      const res = await api.post('/consult-requests', {
        specialty: selectedDoctor.specialty,
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
        doctorSpecialty: selectedDoctor.specialty,
        doctorQualification: selectedDoctor.qualification,
        doctorWorkplace: selectedDoctor.workplace,
        status: 'pending',
        medicalIntake: patientUser?.medicalIntake || {},
      };

      setActiveRequest(requestPayload);

      const socket = getSocket();
      socket.emit('consult:request', {
        token: res.token,
        specialty: selectedDoctor.specialty,
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

  // Generate upcoming dates (today + 14 days) that match the doctor's day-of-week pattern
  const getUpcomingDates = (storedDays) => {
    if (!storedDays?.length) return [];
    const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatDate = (d) => `${WEEKDAY[d.getDay()]}, ${MONTH[d.getMonth()]} ${d.getDate()}`;
    const dayNames = [...new Set(storedDays.map(d => d.split(',')[0].trim()))];
    const allowedDayNums = dayNames.map(n => WEEKDAY.indexOf(n)).filter(n => n >= 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today); cutoff.setDate(cutoff.getDate() + 14);
    const results = [];
    const cursor = new Date(today);
    while (cursor <= cutoff) {
      if (allowedDayNums.includes(cursor.getDay())) results.push(formatDate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return results;
  };

  const departments = [
    'All', 'General Health', 'Cardiology', 'Neurology', 'Pediatrics',
    'Psychiatry', 'Dermatology', 'Orthopedics', 'ENT', 'Ophthalmology',
    'Gastroenterology', 'Pulmonology',
  ];

  const filteredDoctors = filterDept === 'All'
    ? doctors
    : doctors.filter((dr) => dr.specialty === filterDept);

  const handleOpenBooking = (doc) => {
    const upcomingDates = getUpcomingDates(doc.days);
    setSelectedDoctor({ ...doc, upcomingDates });
    setSelectedDate(upcomingDates[0] || '');
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
        timeSlot: selectedSlot, // raw time for DB lookup
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

  const certLabel = (cert) => {
    if (typeof cert === 'string') return { name: cert, fileUrl: null };
    return { name: cert.name || cert, fileUrl: cert.fileUrl || null };
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
        {filteredDoctors.map((doc) => {
          const nextAvail = doc.days?.[0] || null;
          const slotCount = doc.slots?.length || 0;
          return (
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

              {/* Availability preview */}
              <div style={{ margin: '8px 0', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {nextAvail ? (
                  <>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(16,185,129,0.1)', color: 'var(--primary)', fontWeight: 600 }}>
                      Next: {nextAvail}
                    </span>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                      {slotCount} slot{slotCount !== 1 ? 's' : ''} available
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', color: '#f87171' }}>
                    No slots available — contact clinic
                  </span>
                )}
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

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-secondary" style={{ flex: '0 0 auto', padding: '8px 14px', fontSize: 12 }} onClick={() => setAboutDoctor(doc)}>
                  About Doctor
                </button>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => handleOpenBooking(doc)}>
                  Schedule Session 🗓️
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* About Doctor Modal — credentials & availability */}
      {aboutDoctor && (
        <div className="modal-overlay" onClick={() => setAboutDoctor(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>About This Physician</span>
                <h3 style={{ marginTop: 4 }}>{aboutDoctor.name}</h3>
              </div>
              <button className="theme-toggle" onClick={() => setAboutDoctor(null)}>✕</button>
            </div>

            {/* Doctor summary */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', marginBottom: 20 }}>
              <img src={aboutDoctor.avatar} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--secondary)' }} alt={aboutDoctor.name} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 2px' }}>{aboutDoctor.qualification}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 4px' }}>{aboutDoctor.specialty} Specialist • {aboutDoctor.location}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{aboutDoctor.workplace}</p>
              </div>
            </div>

            {/* Details grid */}
            {[
              ['Experience', `${aboutDoctor.exp} years`],
              ['Consultation Fee', aboutDoctor.fee],
              ['Rating', `${aboutDoctor.rating} ★ (${aboutDoctor.reviews} reviews)`],
              ['Verification', aboutDoctor.isVerified ? '✅ Verified Physician' : '⏳ Pending Verification'],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: 13 }}>{val}</span>
              </div>
            ))}

            {/* Qualifications / Credentials */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Qualifications & Credentials
              </div>
              {aboutDoctor.certifications?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {aboutDoctor.certifications.map((cert, i) => {
                    const { name, fileUrl } = certLabel(cert);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16 }}>🎓</span>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{name}</span>
                        </div>
                        {fileUrl ? (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: 'rgba(14,165,233,0.1)', color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}
                          >
                            📄 View PDF
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>On file</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Credential documents pending upload.</p>
              )}
            </div>

            {/* Available times */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Available Days & Time Slots
              </div>
              {aboutDoctor.days?.length > 0 ? (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                    {aboutDoctor.days.slice(0, 5).map((d) => (
                      <span key={d} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', color: 'var(--primary)', fontWeight: 600 }}>{d}</span>
                    ))}
                    {aboutDoctor.days.length > 5 && <span style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 6px' }}>+{aboutDoctor.days.length - 5} more</span>}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {aboutDoctor.slots?.map((s) => (
                      <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>{s}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No available slots at this time. Contact clinic for appointments.</p>
              )}
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }} onClick={() => { setAboutDoctor(null); handleOpenBooking(aboutDoctor); }}>
              Book Appointment with {aboutDoctor.name.split(' ')[0]} {aboutDoctor.name.split(' ')[1]} 🗓️
            </button>
          </div>
        </div>
      )}

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
              <img src={selectedDoctor.avatar} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} alt={selectedDoctor.name} />
              <div>
                <h4 style={{ fontSize: 15 }}>{selectedDoctor.name}</h4>
                <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selectedDoctor.qualification}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{selectedDoctor.specialty} Specialist • {selectedDoctor.workplace}</p>
              </div>
            </div>

            {/* Date Selector */}
            <div className="form-group">
              <label>Available Consultation Days</label>
              {(!selectedDoctor.upcomingDates?.length) && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>No available slots in the next 2 weeks.</p>
              )}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                {(selectedDoctor.upcomingDates || []).map((day) => (
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
              {selectedDoctor.slots?.length === 0 && (
                <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>This doctor has no time slots configured. Please contact the clinic or use Instant Consult below.</p>
              )}
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
