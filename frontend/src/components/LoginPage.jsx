import React, { useState } from 'react';
import { 
  Stethoscope, Activity, User, ArrowRight, 
  Lock, HeartPulse, Check, ShieldCheck, Sparkles, 
  Zap, Award, FileText, QrCode, Building2
} from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('doctor');

  // Input states
  const [regId, setRegId] = useState('OD-MCI-2019-4821');
  const [pin, setPin] = useState('••••');
  const [facility, setFacility] = useState('FAC-ROU-01');

  // Persona configurations
  const personas = {
    doctor: {
      role: 'doctor',
      id: 'OD-MCI-2019-4821',
      name: 'Dr. Suchitra Mohanty, MD',
      designation: 'Senior Medical Officer (Emergency Triage)',
      facility: 'Rourkela Govt Hospital (RGH)',
      facilityId: 'FAC-ROU-01',
      color: '#3b82f6',
      glow: 'rgba(59, 130, 246, 0.35)',
      highlights: [
        'Deterministic ESI v4 Risk Scoring (Levels 1–5)',
        'Mandatory Clinical Override & Audit Log Trail',
        '1-Click ABDM Referral PDF & HL7 FHIR Generation'
      ]
    },
    anm_gnm: {
      role: 'anm_gnm',
      id: 'ANM-SDG-2024-042',
      name: 'Sunita Nayak, Senior ANM',
      designation: 'Frontline Public Health Worker',
      facility: 'Sector-4 Community Health Center',
      facilityId: 'FAC-ROU-01',
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.35)',
      highlights: [
        'Indic Voice Transcription (Odia, Hindi, English)',
        'Degraded Paper Lab Slip OCR Table Extraction',
        'Automatic In-Flight Aadhaar & Phone PII Masking'
      ]
    },
    patient: {
      role: 'patient',
      id: 'TC-01-RED-SEPSIS',
      name: 'Sanjib Munda',
      abha: '91-4421-9902-8812',
      designation: 'Citizen Patient (ABHA Verified)',
      facility: 'Rourkela Govt Hospital (RGH)',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.35)',
      highlights: [
        'Live Triage Queue Token & Bed Allocation Status',
        'Ayushman Bharat Digital Health Card (ABHA)',
        'Physician Review Status & Direct PDF Download'
      ]
    }
  };

  const activePersona = personas[selectedRole];

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    if (role === 'doctor') {
      setRegId('OD-MCI-2019-4821');
    } else if (role === 'anm_gnm') {
      setRegId('ANM-SDG-2024-042');
    } else {
      setRegId('91-4421-9902-8812');
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onLogin({
      ...activePersona,
      id: regId || activePersona.id
    });
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative'
    }}>
      {/* Dynamic Ambient Background Glow Orb */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '400px',
        background: `radial-gradient(ellipse at center, ${activePersona.glow} 0%, transparent 70%)`,
        filter: 'blur(80px)',
        pointerEvents: 'none',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 0
      }} />

      {/* Main Split Portal Card */}
      <div className="aurora-panel" style={{
        width: '100%',
        maxWidth: '1060px',
        display: 'grid',
        gridTemplateColumns: 'minmax(320px, 1fr) minmax(360px, 1fr)',
        gap: '0',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        
        {/* Left Hero Showcase */}
        <div style={{
          padding: '3rem 2.5rem',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 29, 0.9))',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            {/* System Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              color: '#38bdf8',
              fontWeight: '600',
              marginBottom: '1.75rem'
            }}>
              <ShieldCheck size={14} color="#38bdf8" />
              <span>AROGYA-TRIAGE • MCP v2.0 CLINICAL GATEWAY</span>
            </div>

            {/* Glowing Brand Title */}
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Human-in-the-Loop Clinical Intelligence
            </h1>

            <p style={{
              fontSize: '0.92rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              marginBottom: '2rem'
            }}>
              Deterministic emergency severity triage scoring, multimodal vernacular voice intake, and real-time ABDM referral orchestration.
            </p>

            {/* Role Capabilities Live Preview */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${activePersona.color}33`,
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                fontSize: '0.72rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: activePersona.color,
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Sparkles size={14} />
                <span>Active Role Permissions & Features:</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {activePersona.highlights.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#f1f5f9' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: `${activePersona.color}22`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Check size={11} color={activePersona.color} strokeWidth={3} />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Micro Telemetry Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-beacon-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ color: '#86efac' }}>Edge Cache Synced</span>
            </div>
            <span>Sundargarh • Rourkela PHC</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div style={{
          padding: '3rem 2.5rem',
          background: 'rgba(15, 23, 42, 0.85)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Header inside Form */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#ffffff', marginBottom: '0.35rem' }}>
              Authenticate Role
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Choose your persona to access specialized clinical workflows
            </p>
          </div>

          {/* God-Level 3-Tab Segmented Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: 'rgba(8, 12, 22, 0.9)',
            padding: '0.4rem',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '1.75rem'
          }}>
            {/* Doctor Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('doctor')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.75rem 0.5rem',
                background: selectedRole === 'doctor' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                border: selectedRole === 'doctor' ? '1px solid #3b82f6' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'doctor' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'doctor' ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none'
              }}
            >
              <Stethoscope size={20} color={selectedRole === 'doctor' ? '#60a5fa' : 'currentColor'} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Doctor</span>
            </button>

            {/* ANM Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('anm_gnm')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.75rem 0.5rem',
                background: selectedRole === 'anm_gnm' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                border: selectedRole === 'anm_gnm' ? '1px solid #f59e0b' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'anm_gnm' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'anm_gnm' ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none'
              }}
            >
              <Activity size={20} color={selectedRole === 'anm_gnm' ? '#fbbf24' : 'currentColor'} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>ANM / GNM</span>
            </button>

            {/* Patient Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('patient')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.75rem 0.5rem',
                background: selectedRole === 'patient' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                border: selectedRole === 'patient' ? '1px solid #10b981' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'patient' ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'patient' ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <User size={20} color={selectedRole === 'patient' ? '#34d399' : 'currentColor'} />
              <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Patient</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  {selectedRole === 'doctor' && 'Medical Council Reg. Number'}
                  {selectedRole === 'anm_gnm' && 'National Health Mission Staff ID'}
                  {selectedRole === 'patient' && '14-Digit ABHA / Mobile Number'}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  placeholder="Enter credential"
                  required
                  style={{
                    borderColor: `${activePersona.color}55`,
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  {selectedRole === 'patient' ? 'Verification OTP' : 'Security Passcode / PIN'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="••••"
                    required
                    style={{ fontSize: '0.9rem' }}
                  />
                  <Lock size={15} style={{ position: 'absolute', right: '12px', top: '13px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  Assigned Healthcare Facility
                </label>
                <select
                  className="form-select"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="FAC-ROU-01">Rourkela Govt Hospital (RGH) • CHC</option>
                  <option value="FAC-SDG-02">Sundargarh District HQ Hospital</option>
                  <option value="FAC-CTC-03">SCB Medical College, Cuttack</option>
                </select>
              </div>
            </div>

            {/* Glowing Action Button */}
            <button
              type="submit"
              className="btn"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.95rem',
                borderRadius: '12px',
                background: selectedRole === 'doctor'
                  ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  : selectedRole === 'anm_gnm'
                    ? 'linear-gradient(135deg, #d97706, #b45309)'
                    : 'linear-gradient(135deg, #059669, #047857)',
                color: '#ffffff',
                boxShadow: `0 8px 25px ${activePersona.glow}`,
                borderTop: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <span>Access {activePersona.role === 'doctor' ? 'Clinical Triage Queue' : activePersona.role === 'anm_gnm' ? 'Intake Kiosk' : 'Patient Health Portal'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Instant Logins */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
              ⚡ 1-Click Instant Evaluation Personas:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(59, 130, 246, 0.4)', color: '#93c5fd' }}
                onClick={() => onLogin(personas.doctor)}
              >
                Dr. S. Mohanty
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fde68a' }}
                onClick={() => onLogin(personas.anm_gnm)}
              >
                Sunita (ANM)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#86efac' }}
                onClick={() => onLogin(personas.patient)}
              >
                Sanjib (Patient)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
