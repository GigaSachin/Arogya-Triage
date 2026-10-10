import React, { useState } from 'react';
import { X, Copy, Check, AlertTriangle, FileCode, Eye } from 'lucide-react';

export function ESIOverrideModal({ isOpen, onClose, record, onSubmitOverride }) {
  const [newESI, setNewESI] = useState(2);
  const [reason, setReason] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. S. Mohanty, Medical Officer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !record) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mandatory clinical justification is required for regulatory audit trail.');
      return;
    }
    setIsSubmitting(true);
    await onSubmitOverride(record.id, newESI, reason, doctorName);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Clinical ESI Override Protocol</h3>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Overriding patient <strong>{record.display_pseudonym}</strong> ({record.id}). 
          Current Assigned Priority: <strong>ESI Level {record.esi_level} ({record.urgency_code})</strong>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Select Revised ESI Level:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {[1, 2, 3, 4, 5].map((level) => {
                const isSelected = newESI === level;
                const isRed = level <= 2;
                const isYellow = level === 3;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setNewESI(level)}
                    style={{
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #38bdf8' : '1px solid var(--border-subtle)',
                      background: isSelected ? (isRed ? '#991b1b' : (isYellow ? '#92400e' : '#14532d')) : '#0f172a',
                      color: '#ffffff',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Level {level}
                  </button>
                );
              })}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.35rem' }}>
              {newESI === 1 && "ESI 1: Resuscitation (Immediate life-saving)"}
              {newESI === 2 && "ESI 2: Emergent (High risk / physiological danger)"}
              {newESI === 3 && "ESI 3: Urgent (Multiple hospital resources)"}
              {newESI === 4 && "ESI 4: Semi-Urgent (Single resource)"}
              {newESI === 5 && "ESI 5: Non-Urgent (Routine OPD / No acute resources)"}
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Mandatory Clinical Justification Reason (Required for Audit Trail):
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Senior Medical Officer examined patient; hemodynamic response improved after fluid bolus; downgraded to Urgent (ESI 3)..."
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              Reviewing Medical Officer Name & Credentials:
            </label>
            <input
              type="text"
              className="form-input"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Logging to Audit Trail...' : 'Confirm Clinical Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function FHIRViewerModal({ isOpen, onClose, fhirBundle }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !fhirBundle) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileCode size={18} color="#38bdf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>ABDM / HL7 FHIR Composition Bundle</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }} onClick={handleCopy}>
              {copied ? <Check size={14} color="#86efac" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Interoperable HL7 FHIR Document conforming to Ayushman Bharat Digital Mission (NRCES India StructureDefinition).
        </p>

        <div style={{
          background: '#090d16',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          padding: '1rem',
          maxHeight: '450px',
          overflowY: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          color: '#38bdf8'
        }}>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(fhirBundle, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export function LabImageModal({ isOpen, onClose, imageUrl }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Ingested Physical Lab Report Slip</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ textAlign: 'center', overflow: 'hidden', borderRadius: '8px' }}>
          <img src={imageUrl} alt="Lab slip" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
        </div>
      </div>
    </div>
  );
}
