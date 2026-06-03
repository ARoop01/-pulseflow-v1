import React, { useState } from 'react';
import { api } from '../lib/api.js';

export default function HealthLocker({ lockerFiles, addLockerFile }) {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Upload form state
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Prescription');
  const [newDoctor, setNewDoctor] = useState('Dr. Sarah Jenkins');
  const [newDate, setNewDate] = useState('2026-05-21');
  const [newDesc, setNewDesc] = useState('');

  const fileTabs = ['All', 'Prescriptions', 'Lab Reports', 'Vaccines'];

  const filteredFiles = activeTab === 'All'
    ? lockerFiles
    : lockerFiles.filter((file) => file.category === activeTab);

  const getCategoryBadgeStyle = (cat) => {
    switch (cat) {
      case 'Prescriptions': return { '--badge-bg': 'rgba(16, 185, 129, 0.1)', '--badge-color': 'var(--primary)' };
      case 'Lab Reports':   return { '--badge-bg': 'rgba(14, 165, 233, 0.1)', '--badge-color': 'var(--secondary)' };
      case 'Vaccines':      return { '--badge-bg': 'rgba(139, 92, 246, 0.1)', '--badge-color': 'var(--accent)' };
      default: return {};
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      setUploading(true);
      setUploadError('');

      const record = await api.post('/health-records', {
        title: newTitle,
        category: newType,
        authorizedByName: newDoctor,
        authorizedDate: newDate,
        description: newDesc || 'Standard medical telemetry log, securely logged to patient record ledger.',
      });

      addLockerFile(record);
      setShowUploadModal(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ animation: 'slideUp 0.4s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3>Medical Health Locker</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Access your secure medical documentation ledger</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          ➕ Upload Document
        </button>
      </div>

      {/* Cabinet Tabs */}
      <div className="cabinet-tabs">
        {fileTabs.map((tab) => (
          <div key={tab} className={`cabinet-tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab}
          </div>
        ))}
      </div>

      {/* Files Grid */}
      <div className="report-grid">
        {filteredFiles.map((file) => (
          <div key={file.id} className="glass-card report-card" onClick={() => setSelectedFile(file)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span className="report-type-badge" style={getCategoryBadgeStyle(file.category)}>
                {file.category?.slice(0, -1)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{file.id}</span>
            </div>
            <div>
              <h4 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>{file.title}</h4>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Issued by {file.doctor}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: 12, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📅 {file.date}</span>
              <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>Inspect ➜</span>
            </div>
          </div>
        ))}
      </div>

      {/* Inspect Detail Modal */}
      {selectedFile && (
        <div className="modal-overlay" onClick={() => setSelectedFile(null)}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()} style={{ border: '1px solid var(--primary-glow-strong)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span className="report-type-badge" style={getCategoryBadgeStyle(selectedFile.category)}>
                  Secure Patient Document Ledger
                </span>
                <h3 style={{ marginTop: 8 }}>{selectedFile.title}</h3>
              </div>
              <button className="theme-toggle" onClick={() => setSelectedFile(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, background: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 12, border: '1px solid var(--border-color)', margin: '20px 0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>RECORD ID</span>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace' }}>{selectedFile.id}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>DATE RECORDED</span>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedFile.date}</span>
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>PRESCRIBING PHYSICIAN</span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{selectedFile.doctor}</span>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>RECORD SYNOPSIS</span>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{selectedFile.desc}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedFile(null)}>Close</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => alert(`Downloading: ${selectedFile.title}`)}>
                💾 Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => { setShowUploadModal(false); setUploadError(''); }}>
          <div className="glass-card modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3>Secure Ledger Upload</h3>
              <button className="theme-toggle" onClick={() => { setShowUploadModal(false); setUploadError(''); }}>✕</button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Lipids Panel Lab, Cardiologist Intake Note"
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label>Document Category</label>
                  <select value={newType} onChange={(e) => setNewType(e.target.value)} className="form-input">
                    <option value="Prescription">Prescription</option>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Vaccine">Vaccine Certificate</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Physician Authorized</label>
                  <select value={newDoctor} onChange={(e) => setNewDoctor(e.target.value)} className="form-input">
                    <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins</option>
                    <option value="Dr. Marcus Vance">Dr. Marcus Vance</option>
                    <option value="Dr. Elena Rostova">Dr. Elena Rostova</option>
                    <option value="Dr. Alex Mercer">Dr. Alex Mercer</option>
                    <option value="Dr. Chloe Patel">Dr. Chloe Patel</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Date Authorized</label>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="form-input" />
              </div>

              <div className="form-group">
                <label>Synopsis Summary Details</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Summarize the core diagnostic indicators or details..."
                  className="form-input"
                  style={{ height: 80, resize: 'none' }}
                />
              </div>

              {uploadError && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{uploadError}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => { setShowUploadModal(false); setUploadError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', opacity: uploading ? 0.5 : 1 }} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Encrypt & Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
