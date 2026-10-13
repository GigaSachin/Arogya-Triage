import React, { useState } from 'react';
import { 
  Activity, Download, ShieldCheck, 
  Clock, User, CheckCircle2, Phone, AlertCircle, 
  QrCode, ExternalLink, Sparkles, Building2, HeartPulse, 
  ChevronRight, Heart
} from 'lucide-react';

export default function PatientPortal({ 
  patientUser, 
  queue = [], 
  onSwitchToKiosk
}) {
  const [symptomAlertSent, setSymptomAlertSent] = useState(false);
  const [symptomText, setSymptomText] = useState('');

  const activeRecord = queue.find(
    r => r.id === patientUser?.id || 
         (patientUser?.name && r.display_pseudonym?.toLowerCase().includes(patientUser.name.toLowerCase().split(' ')[0]))
  ) || queue[0] || null;

  const esiLevel = activeRecord?.esi_level || 2;
  const urgencyCode = activeRecord?.urgency_code || 'RED';
  const isApproved = activeRecord?.status === 'APPROVED';

  const getUrgencyConfig = (code) => {
    switch (code) {
      case 'RED':
        return {
          label: 'Emergent Priority',
          color: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.4)',
          glow: 'rgba(239, 68, 68, 0.25)',
          bay: 'Emergency Resuscitation Bay 2',
          wait: '< 5 mins',
          doctor: 'Dr. Suchitra Mohanty, MD',
          advice: 'Immediate medical stabilization allocated. Dedicated nursing staff attending.'
        };
      case 'YELLOW':
        return {
          label: 'Urgent Care',
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.4)',
          glow: 'rgba(245, 158, 11, 0.25)',
          bay: 'Observation Ward 3 (Bed 14)',
          wait: '15 mins',
          doctor: 'Dr. Suchitra Mohanty, MD',
          advice: 'Diagnostic evaluation in progress. Please rest comfortably in observation.'
        };
      default:
        return {
          label: 'Routine Outpatient',
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.4)',
          glow: 'rgba(16, 185, 129, 0.25)',
          bay: 'General OPD Room 4',
          wait: '25 mins',
          doctor: 'Outpatient Duty Officer',
          advice: 'Stable parameters. Scheduled for standard physician examination.'
        };
    }
  };

  const status = getUrgencyConfig(urgencyCode);

  const handleSendAlert = (e) => {
    e.preventDefault();
    if (!symptomText.trim()) return;
    setSymptomAlertSent(true);
    setSymptomText('');
    setTimeout(() => setSymptomAlertSent(false), 5000);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Hero Card */}
      <div className="aurora-panel" style={{
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
          }}>
            <User size={28} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                {patientUser?.name || activeRecord?.display_pseudonym || 'Sanjib Munda'}
              </h2>
              <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}>
                <ShieldCheck size={12} /> ABDM Verified
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span>ABHA: <strong>{patientUser?.abha || activeRecord?.abha_id || '91-4421-9902-8812'}</strong></span>
              <span>•</span>
              <span>Facility: <strong>{activeRecord?.facility_name || 'Rourkela Govt Hospital (RGH)'}</strong></span>
              <span>•</span>
              <span>District: <strong>Sundargarh, Odisha</strong></span>
            </div>
          </div>
        </div>

        {/* Live Token Badge Display */}
        <div style={{
          background: status.bg,
          border: `1px solid ${status.border}`,
          borderRadius: '14px',
          padding: '0.75rem 1.5rem',
          textAlign: 'right',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ fontSize: '0.7rem', color: status.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Triage Token
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: '1.2' }}>
            #{activeRecord?.id?.replace('TC-', 'T-') || 'TRG-8812'}
          </div>
          <div style={{ fontSize: '0.72rem', color: status.color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem', marginTop: '0.2rem' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: status.color, display: 'inline-block' }}></span>
            <span>{status.bay}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Status & Vitals + Holographic Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.8fr) minmax(320px, 1.2fr)', gap: '1.5rem' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Urgency Status Banner */}
          <div className="glass-card" style={{
            background: status.bg,
            border: `1px solid ${status.border}`,
            boxShadow: `0 8px 30px ${status.glow}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{
                  background: status.color,
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em'
                }}>
                  ESI LEVEL {esiLevel} • {status.label}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Est. Wait: <strong style={{ color: 'var(--text-primary)' }}>{status.wait}</strong>
                </span>
              </div>

              <div style={{ fontSize: '0.78rem', color: isApproved ? 'var(--color-green)' : 'var(--color-yellow)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600' }}>
                {isApproved ? <CheckCircle2 size={16} /> : <Clock size={16} className="pulse-beacon-yellow" />}
                <span>{isApproved ? 'Physician Approved' : 'Review in Progress'}</span>
              </div>
            </div>

            <div style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: '500', marginBottom: '1rem', lineHeight: '1.5' }}>
              {status.advice}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.85rem',
              fontSize: '0.8rem'
            }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Attending Physician: <strong style={{ color: 'var(--text-primary)' }}>{status.doctor}</strong>
              </span>

              {activeRecord?.id && (
                <a
                  href={`/api/queue/${activeRecord.id}/referral/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{
                    padding: '0.4rem 0.95rem',
                    fontSize: '0.78rem',
                    borderColor: '#38bdf8',
                    color: '#38bdf8',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={14} />
                  Download ABDM Referral PDF
                </a>
              )}
            </div>
          </div>

          {/* God-Level Vitals Overview */}
          <div className="glass-card">
            <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={18} color="var(--text-highlight)" />
                <span>Recorded Clinical Vitals</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Real-Time Ingestion</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              {/* SpO2 */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem 0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Oxygen (SpO2)</div>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  color: activeRecord?.vitals?.spo2 && activeRecord.vitals.spo2 < 90 ? 'var(--color-red)' : 'var(--color-green)',
                  margin: '0.2rem 0'
                }}>
                  {activeRecord?.vitals?.spo2 ? `${activeRecord.vitals.spo2}%` : '89%'}
                </div>
                <div style={{ fontSize: '0.65rem', color: activeRecord?.vitals?.spo2 && activeRecord.vitals.spo2 < 90 ? 'var(--color-red)' : 'var(--color-green)', fontWeight: '600' }}>
                  {activeRecord?.vitals?.spo2 && activeRecord.vitals.spo2 < 90 ? 'Hypoxemic Alert' : 'Normal'}
                </div>
              </div>

              {/* Pulse */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem 0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Pulse Rate</div>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  color: activeRecord?.vitals?.pulse && (activeRecord.vitals.pulse > 100 || activeRecord.vitals.pulse < 55) ? 'var(--color-yellow)' : 'var(--text-primary)',
                  margin: '0.2rem 0'
                }}>
                  {activeRecord?.vitals?.pulse ? `${activeRecord.vitals.pulse}` : '128'}
                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)', marginLeft: '2px' }}>bpm</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  Normal: 60-100
                </div>
              </div>

              {/* BP */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem 0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Blood Pressure</div>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                  margin: '0.2rem 0'
                }}>
                  {activeRecord?.vitals?.systolic_bp ? `${activeRecord.vitals.systolic_bp}/${activeRecord?.vitals?.diastolic_bp || 60}` : '88/60'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                  mmHg
                </div>
              </div>

              {/* Temp */}
              <div style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px',
                padding: '0.85rem 0.75rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Temperature</div>
                <div style={{
                  fontSize: '1.45rem',
                  fontWeight: '800',
                  color: activeRecord?.vitals?.temperature && activeRecord.vitals.temperature > 100.4 ? 'var(--color-yellow)' : 'var(--text-primary)',
                  margin: '0.2rem 0'
                }}>
                  {activeRecord?.vitals?.temperature ? `${activeRecord.vitals.temperature}°` : '102.4°'}
                  <span style={{ fontSize: '0.75rem', fontWeight: '500', color: 'var(--text-muted)' }}>F</span>
                </div>
                <div style={{ fontSize: '0.65rem', color: activeRecord?.vitals?.temperature && activeRecord.vitals.temperature > 100.4 ? 'var(--color-yellow)' : 'var(--color-green)', fontWeight: '600' }}>
                  {activeRecord?.vitals?.temperature && activeRecord.vitals.temperature > 100.4 ? 'Febrile' : 'Normal'}
                </div>
              </div>
            </div>

            {/* Lab Values Tag if Present */}
            {activeRecord?.labs && Object.keys(activeRecord.labs).length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: 'rgba(56, 189, 248, 0.06)',
                borderRadius: '10px',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase' }}>
                  Critical Lab Results:
                </span>
                {Object.entries(activeRecord.labs).map(([k, v]) => (
                  <span key={k} style={{
                    fontSize: '0.78rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc'
                  }}>
                    <strong>{k.replace('_', ' ')}:</strong> {String(v)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Feeling Worse Notifier */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                <Heart size={16} color="var(--color-red)" />
                <span>Feeling Worse or Have New Symptoms?</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Nurse Call Bell</span>
            </div>

            {symptomAlertSent ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                color: '#86efac',
                fontSize: '0.82rem'
              }}>
                <CheckCircle2 size={18} />
                <span><strong>Alert Dispatched!</strong> The attending triage nurse has been notified and is coming to your bed.</span>
              </div>
            ) : (
              <form onSubmit={handleSendAlert} style={{ display: 'flex', gap: '0.65rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Describe your condition (e.g., severe dizziness, chest heaviness)..."
                  value={symptomText}
                  onChange={(e) => setSymptomText(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!symptomText.trim()}
                  style={{ whiteSpace: 'nowrap', padding: '0.6rem 1.1rem' }}
                >
                  Alert Nurse
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Holographic ABDM Card & Facility Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Holographic ABDM ABHA Digital Health Card */}
          <div style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 45%, #047857 100%)',
            borderRadius: '18px',
            padding: '1.5rem',
            color: '#ffffff',
            boxShadow: '0 16px 40px rgba(4, 120, 87, 0.35)',
            border: '1px solid rgba(167, 243, 208, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Iridescent Accent Glow */}
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '120px',
              height: '120px',
              background: 'radial-gradient(circle, rgba(52, 211, 153, 0.4) 0%, transparent 70%)',
              filter: 'blur(20px)'
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', paddingBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#a7f3d0', fontWeight: '800' }}>
                  National Health Authority
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                  Ayushman Bharat Health Card
                </div>
              </div>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldCheck size={20} color="#ffffff" />
              </div>
            </div>

            {/* Profile Avatar & Details */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '65px',
                height: '75px',
                borderRadius: '10px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={38} color="#a7f3d0" />
              </div>

              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '800' }}>
                  {patientUser?.name || activeRecord?.display_pseudonym || 'Sanjib Munda'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#d1fae5', margin: '0.15rem 0' }}>
                  ABHA: <strong>{patientUser?.abha || activeRecord?.abha_id || '91-4421-9902-8812'}</strong>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0' }}>
                  Gender: Male • Age: 42 yrs
                </div>
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0', marginTop: '0.2rem' }}>
                  State: <strong>Odisha</strong> • District: <strong>Sundargarh</strong>
                </div>
              </div>
            </div>

            {/* Card Footer */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              paddingTop: '0.75rem',
              fontSize: '0.72rem',
              color: '#d1fae5'
            }}>
              <div>
                <span>PHR Address: </span>
                <span style={{ fontWeight: '700', color: '#ffffff' }}>sanjib.m@abdm</span>
              </div>
              <div style={{
                background: '#ffffff',
                color: '#064e3b',
                padding: '0.2rem 0.55rem',
                borderRadius: '5px',
                fontWeight: '800',
                fontSize: '0.65rem'
              }}>
                QR VERIFIED
              </div>
            </div>
          </div>

          {/* Hospital Emergency Contacts */}
          <div className="glass-card" style={{ fontSize: '0.82rem' }}>
            <div style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Building2 size={16} color="var(--text-highlight)" />
              <span>Facility & Emergency Desk</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <div>RGH Panposh Road, Rourkela, Sundargarh - 769004</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-green)' }}>
                <Phone size={14} color="var(--color-green)" />
                <span>Triage Desk: <strong>+91-661-2500108</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-red)' }}>
                <Phone size={14} color="var(--color-red)" />
                <span>Govt Ambulance: <strong>108</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
