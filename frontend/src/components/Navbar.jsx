import React from 'react';
import { 
  Activity, Database, Cpu, Stethoscope, 
  User, LogIn, LogOut, HeartPulse, RefreshCw,
  ShieldAlert, Sparkles, Layers
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentUser,
  onOpenLogin,
  onLogout,
  onLoadScenario, 
  onResetEngine, 
  activeQueueCount,
  criticalRedCount,
  isResetting 
}) {
  return (
    <header style={{ 
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)', 
      background: 'rgba(8, 12, 22, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
    }}>
      {/* Critical Red Case Triage Beacon if Active */}
      {criticalRedCount > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, #7f1d1d, #991b1b)',
          color: '#fecaca',
          padding: '0.3rem 1.5rem',
          fontSize: '0.75rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          letterSpacing: '0.02em',
          borderBottom: '1px solid rgba(239, 68, 68, 0.5)'
        }}>
          <span className="pulse-beacon-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
          <span>CRITICAL EMERGENCY: {criticalRedCount} Emergent (ESI Level 2) Case(s) awaiting Physician Stabilization</span>
        </div>
      )}

      {/* Main Bar */}
      <div style={{
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {/* Brand */}
        <div 
          onClick={onOpenLogin}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)',
            border: '1px solid rgba(147, 197, 253, 0.4)'
          }}>
            <HeartPulse size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.03em', color: '#ffffff' }}>
                AROGYA
              </span>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '700',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.1rem 0.45rem',
                borderRadius: '4px'
              }}>
                MCP v2.0
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1' }}>
              Clinical Triage Engine
            </div>
          </div>
        </div>

        {/* Center: Segmented Navigation Pills */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: 'rgba(15, 23, 42, 0.65)',
          padding: '0.3rem',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <button
            onClick={() => setCurrentTab('login')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'login' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentTab === 'login' ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: currentTab === 'login' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <LogIn size={14} />
            Login
          </button>

          <button
            onClick={() => setCurrentTab('doctor')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'doctor' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentTab === 'doctor' ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: currentTab === 'doctor' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Stethoscope size={14} />
            Doctor Queue
            {activeQueueCount > 0 && (
              <span style={{
                background: criticalRedCount > 0 ? '#ef4444' : '#334155',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: '700',
                padding: '0.1rem 0.45rem',
                borderRadius: '9999px',
                marginLeft: '0.2rem'
              }}>
                {activeQueueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('kiosk')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'kiosk' ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
              color: currentTab === 'kiosk' ? '#fbbf24' : 'var(--text-secondary)',
              fontWeight: currentTab === 'kiosk' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Activity size={14} />
            Intake Kiosk
          </button>

          <button
            onClick={() => setCurrentTab('patient')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'patient' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
              color: currentTab === 'patient' ? '#34d399' : 'var(--text-secondary)',
              fontWeight: currentTab === 'patient' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <User size={14} />
            Patient Portal
          </button>

          <button
            onClick={() => setCurrentTab('surveillance')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'surveillance' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentTab === 'surveillance' ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: currentTab === 'surveillance' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Database size={14} />
            Surveillance
          </button>

          <button
            onClick={() => setCurrentTab('mcp')}
            style={{
              padding: '0.45rem 0.95rem',
              borderRadius: '9px',
              border: 'none',
              background: currentTab === 'mcp' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
              color: currentTab === 'mcp' ? '#60a5fa' : 'var(--text-secondary)',
              fontWeight: currentTab === 'mcp' ? '700' : '500',
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <Cpu size={14} />
            MCP
          </button>
        </nav>

        {/* Right Action: PRD Scenarios & Persona State */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Quick PRD Test Vectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255, 255, 255, 0.04)', padding: '0.25rem 0.4rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}
              onClick={() => onLoadScenario('TC-01')}
              title="Load TC-01 Red Sepsis"
            >
              TC-01
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fde68a' }}
              onClick={() => onLoadScenario('TC-02')}
              title="Load TC-02 Yellow Febrile"
            >
              TC-02
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#86efac' }}
              onClick={() => onLoadScenario('TC-03')}
              title="Load TC-03 Green OPD"
            >
              TC-03
            </button>
            <button 
              className="btn btn-outline" 
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.72rem' }}
              onClick={onResetEngine}
              disabled={isResetting}
              title="Reset synthetic state"
            >
              <RefreshCw size={12} className={isResetting ? 'pulse-beacon-yellow' : ''} />
            </button>
          </div>

          {/* User state badge */}
          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '0.35rem 0.75rem'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: currentUser.color || '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff'
              }}>
                {currentUser.role === 'doctor' && <Stethoscope size={13} />}
                {currentUser.role === 'anm_gnm' && <Activity size={13} />}
                {currentUser.role === 'patient' && <User size={13} />}
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ffffff' }}>
                {currentUser.name.split(',')[0]}
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  marginLeft: '0.2rem'
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
