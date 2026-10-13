import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Stethoscope, User, LogOut, HeartPulse, RefreshCw, Layers, ShieldCheck, Zap, Sun, Moon
} from 'lucide-react';
import { playBlip, playScenarioChime } from '../utils/soundEffects';

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
  isResetting,
  theme = 'light',
  onToggleTheme,
  onSetTheme
}) {
  const navItems = [
    { id: 'gateway', label: 'Command Hub', icon: Layers },
    { id: 'doctor', label: 'Doctor Queue', icon: Stethoscope, badge: activeQueueCount, isRed: criticalRedCount > 0 },
    { id: 'kiosk', label: 'Patient Intake', icon: Activity },
    { id: 'vet_dashboard', label: 'Vet Queue', icon: HeartPulse },
    { id: 'vet_kiosk', label: 'Vet Intake', icon: Activity },
    { id: 'patient', label: 'Patient Portal', icon: User },
  ];

  const handleTabClick = (tabId) => {
    playBlip(720, 0.03);
    setCurrentTab(tabId);
  };

  const handleScenarioClick = (scId) => {
    playScenarioChime();
    onLoadScenario(scId);
  };

  return (
    <header style={{ 
      borderBottom: '1px solid var(--border-subtle)', 
      background: theme === 'dark' ? 'rgba(8, 14, 28, 0.88)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: theme === 'dark' ? '0 4px 30px rgba(0, 0, 0, 0.7), 0 1px 0 rgba(56, 189, 248, 0.15)' : '0 1px 4px rgba(15, 23, 42, 0.05)'
    }}>
      {/* Top Main Bar */}
      <div style={{
        padding: '0.65rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        {/* Brand with Holographic Glow */}
        <motion.div 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            playBlip(800, 0.03);
            if (currentUser) setCurrentTab('gateway');
            else onOpenLogin();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f2fe 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: theme === 'dark' ? '0 0 16px rgba(0, 242, 254, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.35)' : '0 2px 8px rgba(37, 99, 235, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <HeartPulse size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ 
                fontSize: '1.2rem', 
                fontWeight: '900', 
                letterSpacing: '-0.02em', 
                background: theme === 'dark' 
                  ? 'linear-gradient(135deg, #ffffff 0%, #7dd3fc 100%)' 
                  : 'linear-gradient(135deg, #0f172a 0%, #1e40af 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: theme === 'dark' ? '0 0 20px rgba(56, 189, 248, 0.35)' : 'none'
              }}>
                AROGYA
              </span>
              <span style={{ 
                fontSize: '0.75rem', 
                fontWeight: '700', 
                letterSpacing: '0.08em',
                color: theme === 'dark' ? '#38bdf8' : '#2563eb',
                background: theme === 'dark' ? 'rgba(56, 189, 248, 0.12)' : '#eff6ff',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid #bfdbfe'
              }}>
                TRIAGE HUD
              </span>
            </div>
          </div>
        </motion.div>

        {/* Center: Segmented Cyber Navigation Deck with Sliding Hologram Indicator */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          background: theme === 'dark' ? 'rgba(10, 16, 32, 0.85)' : '#f1f5f9',
          padding: '0.25rem 0.35rem',
          borderRadius: '12px',
          border: '1px solid var(--border-subtle)',
          boxShadow: theme === 'dark' ? 'inset 0 2px 6px rgba(0, 0, 0, 0.5)' : 'none',
          position: 'relative',
          overflowX: 'auto',
          maxWidth: '100%'
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  position: 'relative',
                  padding: '0.42rem 0.85rem',
                  borderRadius: '9px',
                  border: 'none',
                  background: 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '700' : '500',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  whiteSpace: 'nowrap',
                  zIndex: 2,
                  outline: 'none',
                  transition: 'color 0.2s ease'
                }}
              >
                {/* Framer Motion Sliding Pill Background with Neon Cyan / Emerald Edge */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: '9px',
                      background: item.id.includes('vet') 
                        ? (theme === 'dark' 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.28) 0%, rgba(5, 150, 105, 0.15) 100%)' 
                            : 'linear-gradient(135deg, #059669 0%, #047857 100%)')
                        : (theme === 'dark' 
                            ? 'linear-gradient(135deg, rgba(0, 242, 254, 0.28) 0%, rgba(37, 99, 235, 0.2) 100%)' 
                            : 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)'),
                      border: item.id.includes('vet') 
                        ? (theme === 'dark' ? '1px solid rgba(16, 185, 129, 0.6)' : '1px solid #059669')
                        : (theme === 'dark' ? '1px solid rgba(0, 242, 254, 0.65)' : '1px solid #0284c7'),
                      boxShadow: item.id.includes('vet') 
                        ? (theme === 'dark' ? '0 0 16px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(5, 150, 105, 0.3)')
                        : (theme === 'dark' ? '0 0 18px rgba(0, 242, 254, 0.45)' : '0 2px 8px rgba(37, 99, 235, 0.3)'),
                      zIndex: -1
                    }}
                  />
                )}

                <Icon 
                  size={14} 
                  color={isActive ? (theme === 'dark' ? (item.id.includes('vet') ? '#34d399' : '#00f2fe') : '#ffffff') : 'currentColor'} 
                />
                <span>{item.label}</span>

                {item.badge > 0 && (
                  <span style={{
                    background: item.isRed ? 'var(--color-red)' : '#334155',
                    color: '#ffffff',
                    fontSize: '0.65rem',
                    fontWeight: '800',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '9999px',
                    marginLeft: '0.2rem',
                    boxShadow: item.isRed ? '0 0 10px var(--color-red-glow)' : 'none'
                  }}>
                    {item.badge}
                  </span>
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Right Action: Clean Demo Scenarios & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          
          {/* Critical Red Case Beacon if present */}
          {criticalRedCount > 0 && (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={() => setCurrentTab('doctor')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--color-red-bg)',
                border: '1px solid var(--color-red-border)',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem',
                cursor: 'pointer',
                boxShadow: '0 0 14px var(--color-red-glow)'
              }}
            >
              <span className="pulse-beacon-red" style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-red)' }}></span>
              <span style={{ fontSize: '0.72rem', color: 'var(--color-red)', fontWeight: '800' }}>
                {criticalRedCount} CRITICAL RED
              </span>
            </motion.div>
          )}

          {/* Live Operator Mode & Clear Queue */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            background: 'var(--bg-surface)', 
            padding: '0.25rem 0.55rem', 
            borderRadius: '8px', 
            border: '1px solid var(--border-subtle)' 
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 6px #10b981' }}></span>
            <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700' }}>Live Clinical Node</span>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-outline" 
              style={{ padding: '0.2rem 0.45rem', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '0.25rem', marginLeft: '0.2rem' }}
              onClick={() => {
                if (window.confirm("Clear all active queue records to start a fresh live session?")) {
                  playBlip(600, 0.04);
                  onResetEngine();
                }
              }}
              disabled={isResetting}
              title="Clear queue records for fresh human testing"
            >
              <RefreshCw size={11} className={isResetting ? 'pulse-beacon-yellow' : ''} />
              <span>Reset</span>
            </motion.button>
          </div>

          {/* Crisp Segmented Theme Pill Switcher: Light (Active/Default) & Dark */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: theme === 'dark' ? 'rgba(15, 23, 42, 0.75)' : '#e2e8f0',
              border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.28)' : '1px solid #cbd5e1',
              borderRadius: '9999px',
              padding: '2px',
              gap: '2px',
              boxShadow: theme === 'dark' ? 'inset 0 1px 3px rgba(0,0,0,0.5)' : 'inset 0 1px 2px rgba(0,0,0,0.06)'
            }}
            title="Arogya Interface Theme Switcher"
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (theme !== 'light') {
                  playBlip(750, 0.03);
                  if (onSetTheme) onSetTheme('light');
                  else if (onToggleTheme) onToggleTheme();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: theme === 'light' ? '#ffffff' : 'transparent',
                color: theme === 'light' ? '#2563eb' : 'var(--text-muted)',
                boxShadow: theme === 'light' ? '0 1px 4px rgba(0, 0, 0, 0.12), 0 0 8px rgba(37, 99, 235, 0.15)' : 'none',
                border: theme === 'light' ? '1px solid #bfdbfe' : '1px solid transparent',
                borderRadius: '9999px',
                padding: '0.22rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title="Clinical Light Theme (Default)"
            >
              <Sun size={12} color={theme === 'light' ? '#d97706' : 'currentColor'} />
              <span>Light</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (theme !== 'dark') {
                  playBlip(750, 0.03);
                  if (onSetTheme) onSetTheme('dark');
                  else if (onToggleTheme) onToggleTheme();
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: theme === 'dark' ? '#0f172a' : 'transparent',
                color: theme === 'dark' ? '#38bdf8' : 'var(--text-muted)',
                boxShadow: theme === 'dark' ? '0 1px 6px rgba(0, 0, 0, 0.4), 0 0 10px rgba(56, 189, 248, 0.25)' : 'none',
                border: theme === 'dark' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                borderRadius: '9999px',
                padding: '0.22rem 0.6rem',
                fontSize: '0.72rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              title="Obsidian Dark Theme"
            >
              <Moon size={12} color={theme === 'dark' ? '#38bdf8' : 'currentColor'} />
              <span>Dark</span>
            </motion.button>
          </div>

          {/* User state */}
          {currentUser ? (
            <motion.div 
              whileHover={{ scale: 1.02 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.3rem 0.65rem'
              }}
            >
              <div style={{ fontSize: '0.76rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                {currentUser.name.split(',')[0]}
              </div>
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  playBlip(550, 0.03);
                  onLogout();
                }}
                title="Sign Out"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px'
                }}
              >
                <LogOut size={13} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                playBlip(800, 0.03);
                onOpenLogin();
              }}
              className="btn btn-primary"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.78rem' }}
            >
              Sign In
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
