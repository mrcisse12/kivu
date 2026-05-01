/**
 * KIVU — Audio FX (Web Audio API procedural sound effects)
 * Pas de fichiers audio nécessaires : tout est généré à la volée.
 *
 * Sons disponibles :
 *   - success  : carillon agréable (leçon réussie)
 *   - correct  : ding court (bonne réponse)
 *   - wrong    : buzz doux (mauvaise réponse)
 *   - levelUp  : montée triomphale (nouveau niveau)
 *   - coin     : tintement métallique (XP gagné)
 *   - click    : tick subtil (UI)
 *   - whoosh   : transition (apparition)
 *   - badge    : trophée débloqué (3 notes ascendantes)
 */

import { store } from '../store.js';

let ctx = null;
let masterGain = null;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  }
  // Auto-resume on first user interaction (browsers block until)
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function isMuted() {
  const prefs = store.get('preferences') || {};
  return prefs.soundEnabled === false; // default true
}

function tone({ freq, duration = 0.18, type = 'sine', startGain = 0.5, attack = 0.005, release = 0.12, delay = 0 }) {
  const c = ensureCtx();
  if (!c || isMuted()) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(startGain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + release);
}

function noiseBurst({ duration = 0.08, gain = 0.15, hp = 1500 }) {
  const c = ensureCtx();
  if (!c || isMuted()) return;
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(filter);
  filter.connect(g);
  g.connect(masterGain);
  src.start();
}

/* ── Sound presets ────────────────────────────────────────── */

export const fx = {
  /** Bonne réponse — ding court joyeux (E5 + G5 simultanées) */
  correct() {
    tone({ freq: 659.25, duration: 0.18, type: 'sine', startGain: 0.32 });
    tone({ freq: 783.99, duration: 0.22, type: 'triangle', startGain: 0.22, delay: 0.02 });
  },

  /** Mauvaise réponse — buzz doux (carré bas) */
  wrong() {
    tone({ freq: 196, duration: 0.18, type: 'sawtooth', startGain: 0.18 });
    tone({ freq: 174.61, duration: 0.22, type: 'sawtooth', startGain: 0.14, delay: 0.05 });
  },

  /** Leçon réussie — carillon (C5 → E5 → G5 → C6) */
  success() {
    tone({ freq: 523.25, duration: 0.18, type: 'sine', startGain: 0.30 });
    tone({ freq: 659.25, duration: 0.22, type: 'sine', startGain: 0.30, delay: 0.10 });
    tone({ freq: 783.99, duration: 0.26, type: 'sine', startGain: 0.30, delay: 0.20 });
    tone({ freq: 1046.5, duration: 0.45, type: 'triangle', startGain: 0.32, delay: 0.32 });
  },

  /** Niveau supérieur — fanfare ascendante (C5 G5 C6 E6 G6) */
  levelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((f, i) => {
      tone({ freq: f, duration: 0.16, type: 'triangle', startGain: 0.30, delay: i * 0.075 });
    });
  },

  /** Pièce / XP — tintement métallique (E6 + B6) */
  coin() {
    tone({ freq: 1318.51, duration: 0.06, type: 'square', startGain: 0.18 });
    tone({ freq: 1975.53, duration: 0.18, type: 'sine', startGain: 0.16, delay: 0.04 });
  },

  /** Click UI — tick discret */
  click() {
    tone({ freq: 880, duration: 0.04, type: 'sine', startGain: 0.10 });
  },

  /** Whoosh — bruit blanc filtré (transition) */
  whoosh() {
    noiseBurst({ duration: 0.12, gain: 0.10, hp: 800 });
  },

  /** Badge débloqué — trois notes ascendantes éclatantes */
  badge() {
    tone({ freq: 783.99, duration: 0.18, type: 'triangle', startGain: 0.30 });
    tone({ freq: 987.77, duration: 0.18, type: 'triangle', startGain: 0.30, delay: 0.10 });
    tone({ freq: 1318.51, duration: 0.40, type: 'triangle', startGain: 0.32, delay: 0.22 });
  },

  /** Streak protégé — un long bourdonnement chaleureux */
  streak() {
    tone({ freq: 440, duration: 0.30, type: 'sine', startGain: 0.20 });
    tone({ freq: 554.37, duration: 0.32, type: 'sine', startGain: 0.20, delay: 0.05 });
  }
};

/**
 * Set up auto-click sounds for buttons matching certain selectors.
 * Lightweight — relies on event delegation.
 */
export function setupGlobalClickSound() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, [data-nav], [data-action]');
    if (!btn) return;
    if (btn.classList.contains('quiet') || btn.dataset.silent === 'true') return;
    fx.click();
  }, { passive: true });
}

/** Toggle from settings */
export function setSoundEnabled(enabled) {
  store.update('preferences', p => ({ ...(p || {}), soundEnabled: enabled }));
}

export function isSoundEnabled() {
  const prefs = store.get('preferences') || {};
  return prefs.soundEnabled !== false;
}
