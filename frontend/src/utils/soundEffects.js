// Lightweight, zero-dependency Web Audio API Synthesizer for tactile UI feedback
// High-tech, subtle clinical sound design - completely silent by default unless enabled

let audioCtx = null;
let isSoundEnabled = false;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function toggleSound(forcedState) {
  if (typeof forcedState === 'boolean') {
    isSoundEnabled = forcedState;
  } else {
    isSoundEnabled = !isSoundEnabled;
  }
  if (isSoundEnabled) {
    getAudioContext();
    playBlip(900, 0.04);
  }
  return isSoundEnabled;
}

export function getSoundStatus() {
  return isSoundEnabled;
}

export function playBlip(freq = 750, duration = 0.035, gainLevel = 0.04) {
  if (!isSoundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, ctx.currentTime + duration);

    gain.gain.setValueAtTime(gainLevel, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

export function playScenarioChime() {
  if (!isSoundEnabled) return;
  playBlip(620, 0.04, 0.05);
  setTimeout(() => playBlip(930, 0.06, 0.06), 45);
}

export function playAlertBeep() {
  if (!isSoundEnabled) return;
  playBlip(880, 0.08, 0.08);
  setTimeout(() => playBlip(880, 0.08, 0.08), 120);
}

export function playSuccessChime() {
  if (!isSoundEnabled) return;
  playBlip(523.25, 0.05, 0.04);
  setTimeout(() => playBlip(659.25, 0.05, 0.04), 60);
  setTimeout(() => playBlip(783.99, 0.09, 0.05), 120);
}
