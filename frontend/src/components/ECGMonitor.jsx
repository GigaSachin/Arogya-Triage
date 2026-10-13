import React, { useEffect, useRef, useState } from 'react';
import { Activity, Volume2, VolumeX, ShieldCheck, Wifi } from 'lucide-react';
import { toggleSound, getSoundStatus, playBlip } from '../utils/soundEffects';
import { useLanguage } from '../context/LanguageContext';

export default function ECGMonitor({ criticalRedCount = 0 }) {
  const { t } = useLanguage();
  const isRed = criticalRedCount > 0;
  const canvasRef = useRef(null);
  const [isMuted, setIsMuted] = useState(!getSoundStatus());
  const [vitals, setVitals] = useState({
    hr: 74,
    spo2: 98,
    bp: '120/80',
    rr: 16
  });

  const handleAudioToggle = () => {
    const newState = toggleSound();
    setIsMuted(!newState);
  };

  // Subtle vital telemetry jitter for hospital realism
  useEffect(() => {
    const interval = setInterval(() => {
      const isRed = criticalRedCount > 0;
      setVitals({
        hr: isRed ? (115 + Math.floor(Math.random() * 6)) : (74 + Math.floor(Math.random() * 5) - 2),
        spo2: isRed ? 89 + Math.floor(Math.random() * 3) : 98 + (Math.random() > 0.5 ? 1 : 0),
        bp: isRed ? '88/54' : '122/80',
        rr: isRed ? 28 : 16 + (Math.random() > 0.5 ? 1 : 0)
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [criticalRedCount]);

  // Real-time PQRST ECG Waveform Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.clientWidth || 300;
    let height = canvas.height = canvas.clientHeight || 40;

    let x = 0;
    let prevY = height / 2;
    const points = [];
    const maxPoints = Math.floor(width / 2);

    // Wave cycle step
    let cycleStep = 0;
    let animationFrameId;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);

      // Hospital phosphor trace fade effect
      ctx.fillStyle = 'rgba(10, 15, 29, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Determine current Y based on cardiac PQRST cycle
      let y = height / 2;
      const isRed = criticalRedCount > 0;
      const cycleLength = isRed ? 45 : 70; // Faster frequency for critical cases
      const phase = cycleStep % cycleLength;

      if (phase === 12) {
        // P-wave (atrial depolarization)
        y -= 4;
      } else if (phase === 14) {
        y -= 5;
      } else if (phase === 16) {
        y -= 2;
      } else if (phase === 20) {
        // Q dip
        y += 4;
      } else if (phase === 22) {
        // R peak (ventricular depolarization)
        y -= height * 0.42;
        // Occasional cardiac beep if unmuted
        if (Math.random() > 0.6) {
          playBlip(isRed ? 980 : 840, 0.02, 0.02);
        }
      } else if (phase === 24) {
        // S dip
        y += height * 0.28;
      } else if (phase === 28) {
        // Baseline return
        y = height / 2;
      } else if (phase === 34) {
        // T-wave (ventricular repolarization)
        y -= 7;
      } else if (phase === 36) {
        y -= 8;
      } else if (phase === 38) {
        y -= 3;
      } else {
        // Baseline noise
        y += (Math.random() - 0.5) * 1.2;
      }

      // Draw segment with neon glow
      ctx.beginPath();
      ctx.moveTo(x, prevY);
      ctx.lineTo(x + 2, y);

      const strokeColor = isRed ? '#ff2a5f' : '#00f2fe';
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 6;
      ctx.shadowColor = strokeColor;
      ctx.stroke();

      prevY = y;
      x += 2;

      // Wrap around with wipe bar
      if (x >= width) {
        x = 0;
        ctx.fillStyle = '#060a14';
        ctx.fillRect(0, 0, 16, height);
      }

      // Scanner head dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 2.0, 0, Math.PI * 2);
      ctx.fill();

      cycleStep++;
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [criticalRedCount]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      padding: '0.55rem 1.25rem',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(16px)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '14px',
      margin: '0 0 1.25rem 0',
      boxShadow: 'var(--shadow-card)',
      flexWrap: 'wrap'
    }}>
      {/* Left: ECG Monitor Canvas */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: '1 1 280px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.7rem',
          fontWeight: '800',
          letterSpacing: '0.06em',
          color: isRed ? 'var(--color-red)' : 'var(--text-highlight)',
          textTransform: 'uppercase'
        }}>
          <Activity size={14} color={isRed ? 'var(--color-red)' : 'var(--color-blue)'} />
          <span>LEAD II ECG</span>
        </div>

        <div style={{
          flex: 1,
          height: '34px',
          background: '#090e1a',
          borderRadius: '8px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          position: 'relative',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.8)'
        }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>

      {/* Middle: Live Vital Signs Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        fontSize: '0.8rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('ecg.hr_label', 'HR')}:</span>
          <strong style={{ 
            color: criticalRedCount > 0 ? 'var(--color-red)' : 'var(--text-primary)', 
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88rem'
          }}>
            {vitals.hr} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>bpm</span>
          </strong>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('ecg.spo2_label', 'SpO2')}:</span>
          <strong style={{ 
            color: vitals.spo2 < 92 ? 'var(--color-red)' : 'var(--color-green)', 
            fontFamily: 'var(--font-mono)',
            fontSize: '0.88rem'
          }}>
            {vitals.spo2}%
          </strong>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('ecg.bp_label', 'BP')}:</span>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
            {vitals.bp}
          </strong>
        </div>

        <div style={{ width: '1px', height: '14px', background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{t('ecg.resp_label', 'RESP')}:</span>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
            {vitals.rr}/m
          </strong>
        </div>
      </div>

      {/* Right: Hospital Sync & Audio Chime Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          color: 'var(--color-green)',
          background: 'var(--color-green-bg)',
          padding: '0.25rem 0.65rem',
          borderRadius: '9999px',
          border: '1px solid var(--color-green-border)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <Wifi size={12} color="var(--color-green)" />
          <span>Odisha Telemetry Active</span>
        </div>

        <button
          onClick={handleAudioToggle}
          title={isMuted ? t('ecg.audio_unmute', "Enable Audio Beeper") : t('ecg.audio_mute', "Mute Beeper")}
          style={{
            background: isMuted ? 'var(--bg-surface-elevated)' : 'var(--color-blue-bg)',
            border: isMuted ? '1px solid var(--border-subtle)' : '1px solid var(--color-blue-border)',
            color: isMuted ? 'var(--text-muted)' : 'var(--text-highlight)',
            borderRadius: '8px',
            padding: '0.35rem 0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.74rem',
            fontWeight: '700',
            transition: 'all 0.2s ease',
            boxShadow: isMuted ? 'none' : '0 0 12px var(--color-blue-glow)'
          }}
        >
          {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          <span>{isMuted ? 'Muted' : 'Audio ON'}</span>
        </button>
      </div>
    </div>
  );
}
