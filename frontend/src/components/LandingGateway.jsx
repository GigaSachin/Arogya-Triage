import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartPulse, Stethoscope, Activity, CheckCircle2, 
  Sparkles, ShieldCheck, Zap, ArrowRight, PlayCircle,
  Mic, FileText, AlertTriangle, FileDown, Layers, ChevronRight
} from 'lucide-react';
import TiltCard from './TiltCard';
import Triage3DCore from './Triage3DCore';
import { playBlip, playScenarioChime } from '../utils/soundEffects';
import { useLanguage } from '../context/LanguageContext';

export default function LandingGateway({
  onSelectPathway,
  onLoadScenario,
  onResetEngine,
  activeQueueCount,
  criticalRedCount,
  isResetting,
  humanCount,
  vetCount
}) {
  const { t, language } = useLanguage();
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.03
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
    }
  };

  const handlePathwayClick = (pathway) => {
    playBlip(820, 0.04);
    onSelectPathway(pathway);
  };

  const handleScenarioClick = (scId) => {
    playScenarioChime();
    onLoadScenario(scId);
  };

  const [activeStage, setActiveStage] = useState(0);

  const workflowStages = [
    {
      id: 0,
      number: '01',
      title: 'Patient Input',
      badge: 'Multimodal + Multilingual',
      icon: Mic,
      color: '#0284c7',
      summary: 'Messy Indic Voice (Odia/Hindi) + Degraded Lab Slip OCR + In-Flight Aadhaar Masking',
      data: {
        rawInput: 'ଅତ୍ୟଧିକ ଜ୍ୱର, ମୁଣ୍ଡ ଘୂରାଉଛି, ମାଢ଼ିରୁ ରକ୍ତ ପଡୁଛି (Severe fever, confusion, gum bleeding)',
        labOcr: 'Platelets: 16,000 /uL [CRITICAL] • Dengue NS1: POSITIVE • Hb: 11.4 g/dL',
        vitals: 'SpO2: 89% (Hypoxemia) • BP: 88/58 mmHg (Shock) • Pulse: 128 bpm • Temp: 103.4°F',
        privacy: 'Aadhaar 9821 4452 1092 masked in-memory to XXXX-XXXX-1092 prior to storage'
      }
    },
    {
      id: 1,
      number: '02',
      title: 'Structured Summary',
      badge: 'Non-Diagnostic',
      icon: FileText,
      color: '#6366f1',
      summary: 'Medical English Translation + Chronological Timeline + Categorized Symptoms',
      data: {
        translation: 'Severe high-grade fever, acute confusion / altered sensorium, and spontaneous mucosal gingival bleeding over 3 days.',
        timeline: [
          'Day 1: Acute fever spike with rigors and severe retro-orbital headache',
          'Day 2: Marked lethargy, vomiting, persistent weakness',
          'Day 3: Disorientation, cold extremities, spontaneous gum bleed'
        ],
        symptoms: ['High-Grade Pyrexia', 'Altered Sensorium', 'Spontaneous Bleed', 'Tachycardia', 'Hypotension']
      }
    },
    {
      id: 2,
      number: '03',
      title: 'Missing Info Gaps',
      badge: 'Surfaced Pre-Consult',
      icon: AlertTriangle,
      color: '#d97706',
      summary: 'Critical clinical gaps flagged before doctor enters, saving 8–10 mins of consultation time',
      data: {
        gaps: [
          { name: 'Tetanus Toxoid (TT) Immunization Status', impact: 'Check history of pre-existing trauma or wound before fever onset' },
          { name: 'Symptom Duration Marker for Petechiae', impact: 'Tourniquet test / petechial rash duration not reported by patient' },
          { name: 'Baseline Renal / Creatinine Profile', impact: 'Hypotension present (BP 88/58); urine output quantification required' },
          { name: 'Fluid Loss / Oral Intake Assessment', impact: 'Immediate volume repletion protocol needs oral fluid tolerance check' }
        ]
      }
    },
    {
      id: 3,
      number: '04',
      title: 'Urgency Flag',
      badge: 'Deterministic ESI v4',
      icon: Zap,
      color: '#dc2626',
      summary: 'Deterministic Python Rule Engine: Zero LLM hallucinations, zero drug prescriptions',
      data: {
        level: 'ESI Level 2 (RED - Emergent)',
        urgencyCode: 'RED',
        rationale: 'Deterministic trigger: SpO2 89% (< 90%) + Thrombocytopenia 16,000 /uL (< 20k) + Hypotension with Tachycardia',
        guardrails: 'Strictly Non-Diagnostic: No definitive disease diagnosis assigned; zero drug dosages prescribed.'
      }
    },
    {
      id: 4,
      number: '05',
      title: 'Staff Review & Sign-Off',
      badge: 'Medical Officer + ABDM',
      icon: CheckCircle2,
      color: '#059669',
      summary: 'Human Medical Officer sign-off, clinical override audit trail, and 1-click ABDM Referral PDF',
      data: {
        reviewer: 'Dr. Suchitra Mohanty, MD (Senior Medical Officer, RGH)',
        action: 'Human Verification: Approved Triage Assessment with Clinical Sign-off',
        auditTrail: 'Mandatory clinical justification logged for MCI/DISHA audit compliance',
        referralPdf: 'Print-ready bilingual ABDM Referral Note generated for transfer to SCB Medical College',
        fhirBundle: 'HL7 FHIR R4 Document Bundle ready in 2 seconds for state health repository'
      }
    }
  ];

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '2rem', 
        padding: '0.5rem 0 3rem 0' 
      }}
    >
      
      {/* Hero Header: Cybernetic HUD Command Deck */}
      <motion.div 
        variants={itemVariants}
        className="hud-frame"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.35fr) minmax(300px, 0.9fr)',
          gap: '2.5rem',
          alignItems: 'center',
          padding: '2.5rem 2.25rem',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-lg), 0 0 30px rgba(56, 189, 248, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Ambient Top Cyber Scan Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #00f2fe, #818cf8, #10b981, transparent)'
        }} />

        {/* Left: Mission & Concise Telemetry */}
        <div style={{ zIndex: 2 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.74rem',
            fontWeight: '700',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-highlight)',
            marginBottom: '1rem',
            background: 'var(--color-blue-bg)',
            padding: '0.3rem 0.85rem',
            borderRadius: '9999px',
            border: '1px solid var(--color-blue-border)',
            boxShadow: '0 0 12px var(--color-blue-glow)'
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--color-blue)', boxShadow: '0 0 8px var(--color-blue)' }}></span>
            <span>{t('gateway.hero_badge', 'Deterministic Clinical Decision Support • Bharat V2.5')}</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 3.8vw, 3.2rem)',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            lineHeight: '1.12',
            background: 'var(--title-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'var(--title-shadow)',
            marginBottom: '1rem'
          }}>
            {t('gateway.hero_title', 'AROGYA-TRIAGE')}
          </h1>

          <p style={{
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.65',
            marginBottom: '1.75rem',
            maxWidth: '560px'
          }}>
            {t('gateway.hero_subtitle', 'Multimodal, non-diagnostic clinical & veterinary emergency triage engineered for frontline health workers, medical officers, and field paravets across India. Transforming messy Indic speech and degraded paper lab slips into prioritized queues in under 15 seconds.')}
          </p>

          {/* Clean HUD Telemetry Bar */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '1.25rem',
            background: 'var(--telemetry-pill-bg)',
            padding: '0.55rem 1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--telemetry-pill-border)',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-blue)', boxShadow: '0 0 6px var(--color-blue)' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t('gateway.telemetry_human', 'Human Active')}:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{humanCount ?? 3}</strong>
            </div>

            <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 6px var(--color-green)' }}></span>
              <span style={{ color: 'var(--text-muted)' }}>{t('gateway.telemetry_vet', 'Veterinary Cases')}:</span>
              <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{vetCount ?? 4}</strong>
            </div>

            {criticalRedCount > 0 && (
              <>
                <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--color-red)' }}>
                  <span className="pulse-beacon-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-red)' }}></span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{criticalRedCount} {t('gateway.telemetry_emergent', 'Emergent')}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Holographic 3D Core View */}
        <div style={{ zIndex: 2, position: 'relative' }}>
          <Triage3DCore criticalRedCount={criticalRedCount} />
        </div>
      </motion.div>

      {/* Interactive 5-Stage Live Clinical Workflow Pipeline (PS03 Mandate Demonstration) */}
      <motion.div 
        variants={itemVariants}
        className="glass-card"
        style={{
          padding: '2rem 2.25rem',
          borderRadius: '20px',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-glass)',
          boxShadow: 'var(--shadow-card), 0 0 30px rgba(56, 189, 248, 0.05)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.72rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: '#0284c7',
              background: '#eff6ff',
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              border: '1px solid #bfdbfe',
              marginBottom: '0.65rem'
            }}>
              <Sparkles size={12} color="#0284c7" />
              <span>PS03 Grand Finale End-to-End Pipeline</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Real Working 5-Stage Triage Workflow
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '680px', lineHeight: '1.55' }}>
              Explore how messy vernacular patient input is transformed into structured summaries, pre-consult information gaps, deterministic urgency flags, and healthcare staff sign-off in under 15 seconds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleScenarioClick('TC-01')}
              className="btn btn-primary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              title="Launch live input in Kiosk and submit"
            >
              <Zap size={15} />
              <span>⚡ Launch Real-Time Walkthrough</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handlePathwayClick('doctor')}
              className="btn btn-outline"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
              title="Inspect Doctor Review Dashboard"
            >
              <Stethoscope size={15} />
              <span>👨‍⚕️ Open Doctor Review HUD</span>
            </motion.button>
          </div>
        </div>

        {/* 5-Stage Stepper Navigation Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          background: 'var(--bg-surface-elevated)',
          padding: '0.65rem',
          borderRadius: '14px',
          border: '1px solid var(--border-subtle)'
        }}>
          {workflowStages.map((stage) => {
            const isSelected = activeStage === stage.id;
            const Icon = stage.icon;
            return (
              <motion.button
                key={stage.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playBlip(700, 0.02); setActiveStage(stage.id); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  border: isSelected ? `1px solid ${stage.color}` : '1px solid transparent',
                  background: isSelected ? 'var(--bg-main)' : 'transparent',
                  boxShadow: isSelected ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: isSelected ? `${stage.color}15` : 'var(--bg-surface)',
                  border: `1px solid ${isSelected ? stage.color : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={14} color={isSelected ? stage.color : 'var(--text-muted)'} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: stage.color, letterSpacing: '0.04em' }}>
                    STAGE {stage.number}
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: '700', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {stage.title}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Active Stage Live Breakdown Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              background: 'var(--bg-main)',
              border: `1px solid ${workflowStages[activeStage].color}40`,
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: '800',
                  padding: '0.2rem 0.65rem',
                  borderRadius: '6px',
                  background: `${workflowStages[activeStage].color}18`,
                  color: workflowStages[activeStage].color,
                  border: `1px solid ${workflowStages[activeStage].color}40`
                }}>
                  Stage {workflowStages[activeStage].number}: {workflowStages[activeStage].badge}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {workflowStages[activeStage].summary}
                </span>
              </div>
            </div>

            {/* Stage 0: Patient Input Content */}
            {activeStage === 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0284c7', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Mic size={13} /> 1. Messy Vernacular Speech (Odia)
                  </div>
                  <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-sans)', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '1.45', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    "{workflowStages[0].data.rawInput}"
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    Transcribed via Sarvam Indic Speech API • No manual typing required by ANM
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#d97706', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FileText size={13} /> 2. Degraded Paper Lab Slip OCR
                  </div>
                  <div style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', lineHeight: '1.5' }}>
                    {workflowStages[0].data.labOcr}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    Parsed rumpled lab slip with stained background • Zero manual data re-entry
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#059669', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={13} /> 3. In-Flight PII Anonymization
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', lineHeight: '1.45' }}>
                    {workflowStages[0].data.privacy}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '600', marginTop: '0.45rem' }}>
                    ✓ DISHA & ABDM Privacy Compliance: Pseudonym token REC-TC01-MUNDA
                  </div>
                </div>
              </div>
            )}

            {/* Stage 1: Structured Summary Content */}
            {activeStage === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6366f1', marginBottom: '0.4rem' }}>
                    Standardized Clinical English Translation
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', lineHeight: '1.5', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                    "{workflowStages[1].data.translation}"
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
                    {workflowStages[1].data.symptoms.map((s, idx) => (
                      <span key={idx} style={{ fontSize: '0.68rem', fontWeight: '600', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#6366f1', marginBottom: '0.4rem' }}>
                    Chronological Symptom Progression Timeline
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {workflowStages[1].data.timeline.map((event, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
                        <span>{event}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.55rem' }}>
                    Organizes messy narration into clear timeline for the doctor before patient enters OPD.
                  </div>
                </div>
              </div>
            )}

            {/* Stage 2: Missing Information Gaps Content */}
            {activeStage === 2 && (
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
                  Arogya-Triage automatically cross-checks standard emergency protocols and flags missing clinical markers <strong>before the consultation</strong>:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
                  {workflowStages[2].data.gaps.map((gap, idx) => (
                    <div key={idx} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#d97706', fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.35rem' }}>
                        <AlertTriangle size={15} />
                        <span>{gap.name}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#92400e', lineHeight: '1.4' }}>
                        {gap.impact}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: '600', marginTop: '0.85rem' }}>
                  ⚡ Impact: Surfaced in-advance so ANM / nurse can ask the patient or draw blood before the specialist arrives.
                </div>
              </div>
            )}

            {/* Stage 3: Urgency Flag Content */}
            {activeStage === 3 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem', alignItems: 'center' }}>
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '14px', padding: '1.25rem', textAlign: 'center' }}>
                  <span className="badge badge-red" style={{ fontSize: '0.9rem', padding: '0.4rem 1rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    🔴 ESI Level 2 (RED - Emergent)
                  </span>
                  <div style={{ fontSize: '0.78rem', color: '#991b1b', fontWeight: '600', marginTop: '0.5rem' }}>
                    Immediate Bedside Priority
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '0.25rem' }}>
                    SpO2 89% • Platelets 16,000 /uL • BP 88/58
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: '14px', padding: '1rem', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                    Deterministic Mathematical Rules (Zero LLM Hallucinations):
                  </div>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '0.65rem' }}>
                    {workflowStages[3].data.rationale}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: '600' }}>
                    ✓ {workflowStages[3].data.guardrails}
                  </div>
                </div>
              </div>
            )}

            {/* Stage 4: Staff Review & Sign-Off Content */}
            {activeStage === 4 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#059669', marginBottom: '0.4rem' }}>
                    1. Medical Officer Human Verification
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', lineHeight: '1.45' }}>
                    Reviewer: <strong>{workflowStages[4].data.reviewer}</strong>
                    <div style={{ marginTop: '0.35rem', color: 'var(--text-secondary)' }}>Status: {workflowStages[4].data.action}</div>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                    {workflowStages[4].data.auditTrail}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#0284c7', marginBottom: '0.4rem' }}>
                    2. Instant 1-Click ABDM Referral PDF
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-main)', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', lineHeight: '1.45' }}>
                    {workflowStages[4].data.referralPdf}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
                    <button 
                      onClick={() => handlePathwayClick('doctor')} 
                      className="btn btn-outline" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FileDown size={13} /> Open PDF in Review
                    </button>
                    <button 
                      onClick={() => handlePathwayClick('doctor')} 
                      className="btn btn-outline" 
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Layers size={13} /> View HL7 FHIR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Two Core Pathways as Sleek Holographic Tilt Cards */}
      <motion.div 
        variants={itemVariants}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '1.75rem'
        }}
      >
        
        {/* Pathway 1: Human Healthcare */}
        <TiltCard 
          glowColor="rgba(0, 242, 254, 0.2)"
          maxTilt={6}
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-card), 0 0 25px rgba(0, 242, 254, 0.08)',
            minHeight: '420px',
            position: 'relative'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                border: '1px solid rgba(56, 189, 248, 0.4)'
              }}>
                <Stethoscope size={22} color="#ffffff" />
              </div>

              <span className="badge badge-blue" style={{ fontSize: '0.74rem', padding: '0.3rem 0.8rem' }}>
                ESI Levels 1–5 • ABDM FHIR
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('gateway.human_gateway_title', 'Human Healthcare Pathway')}
            </h2>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              {t('gateway.human_gateway_desc', 'Clinical emergency decision support for public hospital OPDs and triage nodes across India (Rourkela CHC, SCB Medical College, PHCs).')}
            </p>

            {/* Core Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                t('gateway.human_feature_1', 'Deterministic ESI Levels 1–5 Rule Engine (Zero LLM Hallucination)'),
                t('gateway.human_feature_2', 'Indic Voice-to-Text Pipeline (Odia, Hindi, English via Sarvam AI)'),
                t('gateway.human_feature_3', 'Degraded Hospital Lab Slip Tabular OCR Extraction & 1-Click ABDM PDF')
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={15} color="var(--text-highlight)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Human Clinical Governance Badge */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1.5rem', 
              padding: '0.45rem 0.85rem', 
              background: 'var(--color-blue-bg)', 
              borderRadius: '9px', 
              border: '1px solid var(--color-blue-border)' 
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-blue)', boxShadow: '0 0 6px var(--color-blue)' }}></span>
              <span style={{ fontSize: '0.74rem', color: 'var(--text-highlight)', fontWeight: '700' }}>
                Human-in-the-Loop • Doctor Review & Signature Required
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePathwayClick('doctor')}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1rem', fontSize: '0.82rem' }}
            >
              <Stethoscope size={16} />
              {t('nav.doctor_queue', 'Doctor Queue')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePathwayClick('kiosk')}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1rem', fontSize: '0.82rem' }}
            >
              <Activity size={16} />
              {t('nav.patient_intake', 'Patient Intake')}
            </motion.button>
          </div>
        </TiltCard>

        {/* Pathway 2: Veterinary Care */}
        <TiltCard 
          glowColor="rgba(16, 185, 129, 0.2)"
          maxTilt={6}
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-card), 0 0 25px rgba(16, 185, 129, 0.08)',
            minHeight: '420px',
            position: 'relative'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
                border: '1px solid rgba(52, 211, 153, 0.4)'
              }}>
                <HeartPulse size={22} color="#ffffff" />
              </div>

              <span className="badge badge-green" style={{ fontSize: '0.74rem', padding: '0.3rem 0.8rem' }}>
                VECCS / ICAR Index • DAH&VS
              </span>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t('gateway.vet_gateway_title', 'Veterinary Care Pathway')}
            </h2>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              {t('gateway.vet_gateway_desc', 'Rural companion animal and livestock emergency triage for field paravets, veterinary polyclinics, and livestock inspectors across Odisha.')}
            </p>

            {/* Core Features */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.75rem' }}>
              {[
                t('gateway.vet_feature_1', 'Veterinary Triage Index (Critical, Emergent, Urgent, Routine)'),
                t('gateway.vet_feature_2', 'Species Physiological Bounds for Cattle Bloat & Canine Parvo'),
                t('gateway.vet_feature_3', 'Paravet field-stabilization automated clinical directives')
              ].map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <CheckCircle2 size={15} color="var(--color-green)" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* Veterinary Field Intake Governance Badge */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1.5rem', 
              padding: '0.45rem 0.85rem', 
              background: 'var(--color-green-bg)', 
              borderRadius: '9px', 
              border: '1px solid var(--color-green-border)' 
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-green)', boxShadow: '0 0 6px var(--color-green)' }}></span>
              <span style={{ fontSize: '0.74rem', color: 'var(--color-green)', fontWeight: '700' }}>
                Field Examination • Veterinary Officer Sign-off & Transfer
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePathwayClick('vet_dashboard')}
              className="btn btn-success"
              style={{ padding: '0.65rem 1rem', fontSize: '0.82rem' }}
            >
              <HeartPulse size={16} />
              {t('nav.vet_queue', 'Vet Queue')}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePathwayClick('vet_kiosk')}
              className="btn btn-outline"
              style={{ padding: '0.65rem 1rem', fontSize: '0.82rem' }}
            >
              <Activity size={16} />
              {t('nav.vet_intake', 'Vet Intake')}
            </motion.button>
          </div>
        </TiltCard>
      </motion.div>

      {/* Quick Benchmark Launcher: 1-Click Evaluation Showcase */}
      <motion.div 
        variants={itemVariants}
        className="glass-card"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-glass)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            <PlayCircle size={18} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {t('gateway.benchmark_title', '1-Click Benchmark Test Vector Switcher')}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t('gateway.benchmark_subtitle', 'Instant pre-calibrated scenario injection for Grand Finale judges')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.4rem 0.75rem', 
              border: '1px solid var(--color-red-border)', 
              color: 'var(--color-red)', 
              background: 'var(--color-red-bg)' 
            }}
            onClick={() => handleScenarioClick('TC-01')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-red)', display: 'inline-block' }}></span>
            TC-01 (Red Sepsis • Odia)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.4rem 0.75rem', 
              border: '1px solid var(--color-yellow-border)', 
              color: 'var(--color-yellow)', 
              background: 'var(--color-yellow-bg)' 
            }}
            onClick={() => handleScenarioClick('TC-02')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-yellow)', display: 'inline-block' }}></span>
            TC-02 (Yellow Dengue • Hindi)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.4rem 0.75rem', 
              border: '1px solid var(--color-green-border)', 
              color: 'var(--color-green)', 
              background: 'var(--color-green-bg)' 
            }}
            onClick={() => handleScenarioClick('TC-03')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-green)', display: 'inline-block' }}></span>
            TC-03 (Green OPD • English)
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline"
            style={{ 
              fontSize: '0.72rem', 
              padding: '0.4rem 0.75rem', 
              border: '1px solid var(--color-blue-border)', 
              color: 'var(--text-highlight)', 
              background: 'var(--color-blue-bg)' 
            }}
            onClick={() => handleScenarioClick('VET-01')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-blue)', display: 'inline-block' }}></span>
            VET-01 (Cattle Bloat • Critical)
          </motion.button>
        </div>
      </motion.div>

    </motion.div>
  );
}
