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
    vet_officer: {
      role: 'vet_officer',
      id: 'OD-VET-2018-9921',
      name: 'Dr. A. K. Nayak, BVSc & AH',
      designation: 'Senior Veterinary Officer (Emergency & Livestock)',
      facility: 'Govt Veterinary Hospital Panposh, Rourkela',
      facilityId: 'FAC-ROU-01',
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.35)',
      highlights: [
        'Veterinary Triage Index (VTI: Critical, Emergent, Urgent, Routine)',
        'Species-Specific Bovine & Canine Emergency Norms',
        'DAH&VS Clinical Referral Note & Transfer PDF Generation'
      ]
    },
    paravet: {
      role: 'paravet',
      id: 'LI-SDG-2023-118',
      name: 'Bikram Jena, Livestock Inspector',
      designation: 'Frontline Paravet & Livestock Inspector',
      facility: 'Block Veterinary Dispensary Bisra',
      facilityId: 'FAC-ROU-02',
      color: '#06b6d4',
      glow: 'rgba(6, 182, 212, 0.35)',
      highlights: [
        'Field Bovine Bloat & Canine Parvovirus Fast Intake',
        'Automatic Owner Phone Privacy Protection',
        'Transparent Uncertainty Safe Fallbacks (Zero Drug Prescriptions)'
      ]
    },
    patient: {
      role: 'patient',
      id: 'TC-01-RED-SEPSIS',
      name: 'Sanjib Munda',
      abha: '91-4421-9902-8812',
      designation: 'Citizen Patient (ABHA Verified)',
      facility: 'Rourkela Govt Hospital (RGH)',
      color: '#8b5cf6',
      glow: 'rgba(139, 92, 246, 0.35)',
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
    } else if (role === 'vet_officer') {
      setRegId('OD-VET-2018-9921');
    } else if (role === 'paravet') {
      setRegId('LI-SDG-2023-118');
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
          background: 'var(--bg-surface-elevated)',
          borderRight: '1px solid var(--border-subtle)',
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
              background: 'var(--color-blue-bg)',
              border: '1px solid var(--color-blue-border)',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              color: 'var(--text-highlight)',
              fontWeight: '600',
              marginBottom: '1.75rem'
            }}>
              <ShieldCheck size={14} color="var(--color-blue)" />
              <span>AROGYA-TRIAGE • CLINICAL GATEWAY</span>
            </div>

            {/* Glowing Brand Title */}
            <h1 style={{
              fontSize: '2.4rem',
              fontWeight: '800',
              lineHeight: '1.15',
              letterSpacing: '-0.03em',
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              Clinical Decision Support
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
              background: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
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
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-primary)' }}>
                    <div style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: `${activePersona.color}15`,
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
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="pulse-beacon-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }}></span>
              <span style={{ color: '#059669' }}>Edge Cache Synced</span>
            </div>
            <span>Sundargarh • Rourkela PHC</span>
          </div>
        </div>

        {/* Right Form Card */}
        <div style={{
          padding: '3rem 2.5rem',
          background: 'var(--bg-card)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Header inside Form */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Authenticate Role
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Choose your persona to access specialized clinical workflows
            </p>
          </div>

          {/* God-Level Segmented Role Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '0.35rem',
            background: 'var(--bg-surface-elevated)',
            padding: '0.35rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
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
                gap: '0.3rem',
                padding: '0.65rem 0.35rem',
                background: selectedRole === 'doctor' ? 'var(--bg-main)' : 'transparent',
                border: selectedRole === 'doctor' ? '1px solid var(--color-blue-border)' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'doctor' ? 'var(--text-highlight)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'doctor' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Stethoscope size={18} color={selectedRole === 'doctor' ? 'var(--color-blue)' : 'currentColor'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Doctor</span>
            </button>

            {/* ANM Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('anm_gnm')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.65rem 0.35rem',
                background: selectedRole === 'anm_gnm' ? 'var(--bg-main)' : 'transparent',
                border: selectedRole === 'anm_gnm' ? '1px solid var(--color-yellow-border)' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'anm_gnm' ? 'var(--color-yellow)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'anm_gnm' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <Activity size={18} color={selectedRole === 'anm_gnm' ? 'var(--color-yellow)' : 'currentColor'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>ANM/GNM</span>
            </button>

            {/* Vet Officer Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('vet_officer')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.65rem 0.35rem',
                background: selectedRole === 'vet_officer' ? 'var(--bg-main)' : 'transparent',
                border: selectedRole === 'vet_officer' ? '1px solid var(--color-green-border)' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'vet_officer' ? 'var(--color-green)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'vet_officer' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <HeartPulse size={18} color={selectedRole === 'vet_officer' ? 'var(--color-green)' : 'currentColor'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Vet Officer</span>
            </button>

            {/* Paravet Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('paravet')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.65rem 0.35rem',
                background: selectedRole === 'paravet' ? 'var(--bg-main)' : 'transparent',
                border: selectedRole === 'paravet' ? '1px solid var(--color-blue-border)' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'paravet' ? 'var(--text-highlight)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'paravet' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <ShieldCheck size={18} color={selectedRole === 'paravet' ? 'var(--color-blue)' : 'currentColor'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Paravet</span>
            </button>

            {/* Patient Tab */}
            <button
              type="button"
              onClick={() => handleRoleSelect('patient')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.65rem 0.35rem',
                background: selectedRole === 'patient' ? 'var(--bg-main)' : 'transparent',
                border: selectedRole === 'patient' ? '1px solid var(--border-specular)' : '1px solid transparent',
                borderRadius: '9px',
                color: selectedRole === 'patient' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: selectedRole === 'patient' ? 'var(--shadow-sm)' : 'none'
              }}
            >
              <User size={18} color={selectedRole === 'patient' ? 'var(--text-highlight)' : 'currentColor'} />
              <span style={{ fontSize: '0.72rem', fontWeight: '700' }}>Patient</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                  {selectedRole === 'doctor' && 'Medical Council Reg. Number'}
                  {selectedRole === 'anm_gnm' && 'National Health Mission Staff ID'}
                  {selectedRole === 'vet_officer' && 'Veterinary Council Reg. Number (VCI / OVCI)'}
                  {selectedRole === 'paravet' && 'Livestock Inspector / Paravet ID'}
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
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
              ⚡ 1-Click Instant Evaluation Personas:
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--color-blue-border)', color: 'var(--text-highlight)', background: 'var(--color-blue-bg)' }}
                onClick={() => onLogin(personas.doctor)}
              >
                Dr. S. Mohanty
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--color-yellow-border)', color: 'var(--color-yellow)', background: 'var(--color-yellow-bg)' }}
                onClick={() => onLogin(personas.anm_gnm)}
              >
                Sunita (ANM)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'var(--color-green-border)', color: 'var(--color-green)', background: 'var(--color-green-bg)' }}
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
