import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, AlertTriangle, FileCode, Eye } from 'lucide-react';
import { playBlip, playSuccessChime } from '../utils/soundEffects';

export function ESIOverrideModal({ isOpen, onClose, record, onSubmitOverride }) {
  const [newESI, setNewESI] = useState(2);
  const [reason, setReason] = useState('');
  const [doctorName, setDoctorName] = useState('Dr. S. Mohanty, Medical Officer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mandatory clinical justification is required for regulatory audit trail.');
      return;
    }
    setIsSubmitting(true);
    await onSubmitOverride(record.id, newESI, reason, doctorName);
    setIsSubmitting(false);
    playSuccessChime();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && record && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.93, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Clinical ESI Override Protocol</h3>
              </div>
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playBlip(550, 0.02); onClose(); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </motion.button>
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
                      <motion.button
                        key={level}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { playBlip(680, 0.03); setNewESI(level); }}
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                          background: isSelected ? (isRed ? 'var(--color-red)' : (isYellow ? 'var(--color-yellow)' : 'var(--color-green)')) : 'var(--bg-surface-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        Level {level}
                      </motion.button>
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
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.97 }} 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={onClose}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.97 }} 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging to Audit Trail...' : 'Confirm Clinical Override'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function FHIRViewerModal({ isOpen, onClose, fhirBundle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(fhirBundle, null, 2));
    setCopied(true);
    playSuccessChime();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && fhirBundle && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="modal-content" 
            style={{ maxWidth: '750px' }}
            initial={{ scale: 0.93, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCode size={18} color="#38bdf8" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>ABDM / HL7 FHIR Composition Bundle</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <motion.button 
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-outline" 
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem' }} 
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} color="#86efac" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { playBlip(550, 0.02); onClose(); }} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </motion.button>
              </div>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Interoperable HL7 FHIR Document conforming to Ayushman Bharat Digital Mission (NRCES India StructureDefinition).
            </p>

            <div style={{
              background: 'var(--bg-surface-elevated)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              padding: '1rem',
              maxHeight: '450px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: 'var(--text-primary)'
            }}>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(fhirBundle, null, 2)}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LabImageModal({ isOpen, onClose, imageUrl }) {
  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="modal-content" 
            style={{ maxWidth: '800px' }}
            initial={{ scale: 0.93, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Ingested Physical Lab Report Slip</h3>
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playBlip(550, 0.02); onClose(); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </motion.button>
            </div>
            <div style={{ textAlign: 'center', overflow: 'hidden', borderRadius: '8px' }}>
              <img src={imageUrl} alt="Lab slip" style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function VeterinaryOverrideModal({ isOpen, onClose, record, onSubmitOverride }) {
  const [newUrgency, setNewUrgency] = useState('EMERGENT');
  const [reason, setReason] = useState('');
  const [reviewerName, setReviewerName] = useState('Dr. A. K. Nayak, Veterinary Officer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mandatory veterinary clinical justification is required for regulatory audit trail.');
      return;
    }
    setIsSubmitting(true);
    await onSubmitOverride(record.id, newUrgency, reason, reviewerName);
    setIsSubmitting(false);
    playSuccessChime();
    onClose();
  };

  const urgencyOptions = [
    { key: 'CRITICAL', label: 'CRITICAL (Code RED)', desc: 'Immediate resuscitation / life-threat' },
    { key: 'EMERGENT', label: 'EMERGENT (Code RED)', desc: 'Rapid deterioration risk (within 15-30m)' },
    { key: 'URGENT', label: 'URGENT (Code YELLOW)', desc: 'Assessment within 1-2 hours' },
    { key: 'ROUTINE', label: 'ROUTINE (Code GREEN)', desc: 'Routine outpatient examination' }
  ];

  return (
    <AnimatePresence>
      {isOpen && record && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.93, opacity: 0, y: 18 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 14 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Veterinary Urgency Override (VECCS / ICAR)</h3>
              </div>
              <motion.button 
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => { playBlip(550, 0.02); onClose(); }} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </motion.button>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Overriding animal case <strong>{record.display_pseudonym || record.animal_tag_or_name}</strong> ({record.id}) - Species: <strong>{record.species?.toUpperCase()}</strong>.
              <br />
              Current Urgency: <strong style={{ color: record.urgency_code === 'RED' ? '#ef4444' : '#f59e0b' }}>{record.urgency_category || record.urgency_code}</strong>.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Select Revised Veterinary Triage Category:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {urgencyOptions.map((opt) => {
                    const isSelected = newUrgency === opt.key;
                    const isRed = opt.key === 'CRITICAL' || opt.key === 'EMERGENT';
                    const isYellow = opt.key === 'URGENT';
                    return (
                      <motion.button
                        key={opt.key}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { playBlip(680, 0.03); setNewUrgency(opt.key); }}
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          textAlign: 'left',
                          border: isSelected ? '2px solid var(--color-green-border)' : '1px solid var(--border-subtle)',
                          background: isSelected ? (isRed ? 'var(--color-red)' : (isYellow ? 'var(--color-yellow)' : 'var(--color-green)')) : 'var(--bg-surface-elevated)',
                          color: isSelected ? '#ffffff' : 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontWeight: '700', fontSize: '0.82rem' }}>{opt.label}</div>
                        <div style={{ fontSize: '0.68rem', color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-secondary)' }}>{opt.desc}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Mandatory Clinical Justification (DAH&VS / ICAR Compliance):
                </label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. In-person clinical palpation revealed stabilized rumen motility post-trocar; downgraded to Urgent observation..."
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Reviewing Veterinary Officer:
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.97 }} 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={onClose}
                >
                  Cancel
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.97 }} 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Logging to Audit Trail...' : 'Confirm Veterinary Override'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
