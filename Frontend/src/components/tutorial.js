/**
 * KIVU — Tutoriel interactif premier lancement.
 *
 * Au premier passage sur la home après l'onboarding, on lance un
 * tour guidé qui met en lumière 6 zones-clés de l'app :
 *   1. Carte XP / niveau (hero card)
 *   2. Mascotte Kivi
 *   3. Tuiles fonctionnalités (Traduire, Apprendre…)
 *   4. Mot du jour
 *   5. Cloche notifications
 *   6. Navigation bottom (mobile) / desktop sidebar
 *
 * UI :
 *   - Backdrop sombre avec "spotlight" SVG sur l'élément ciblé
 *   - Bulle explicative qui pointe vers l'élément
 *   - Boutons : Précédent · Suivant · Passer
 *   - Voix Kivi qui parle chaque étape (optionnel via toggle)
 *   - Persistant : terminé une fois, ne réapparaît plus
 *
 * Démarré automatiquement par main.js si !store.tutorialCompleted
 * et store.onboardingCompleted = true.
 */

import { store } from '../store.js';
import { fx } from '../services/audio-fx.js';
import { speech } from '../services/speech.js';

const STEPS = [
  {
    selector: '.hero-card.grad-hero',
    placement: 'bottom',
    icon: '⚡',
    title: 'Ton voyage commence ici',
    body: 'Cette carte montre ton niveau, ton XP et ta série de jours. Plus tu apprends, plus elle s\'illumine !',
    voice: 'Bienvenue dans KIVU ! Ici, tu vois ton niveau, tes points et ta série de jours consécutifs.'
  },
  {
    selector: '.feature-tile:nth-child(1)',
    placement: 'top',
    icon: '🌍',
    title: 'Traduire en 8 langues',
    body: 'Touche une fonction pour l\'ouvrir. Traduire fonctionne par voix, texte, caméra ou conversation à 2.',
    voice: 'Touche n\'importe quelle tuile pour explorer une fonction. Tu peux traduire à la voix ou par écrit.'
  },
  {
    selector: '.wotd-card',
    placement: 'top',
    icon: '📅',
    title: 'Mot du jour',
    body: 'Chaque jour, un nouveau mot dans ta langue cible. Touche pour entendre la prononciation.',
    voice: 'Chaque jour, je te propose un nouveau mot. Touche-le pour entendre comment il se prononce.'
  },
  {
    selector: '.notif-bell',
    placement: 'left',
    icon: '🔔',
    title: 'Tes notifications',
    body: 'Badges, niveaux, encouragements d\'amis — tout arrive ici. Le chiffre rouge montre les non-lus.',
    voice: 'La cloche en haut à droite te montre tes notifications. Badges, niveaux, et encouragements.'
  },
  {
    selector: '.bottom-nav, .desktop-nav',
    placement: 'top',
    icon: '🧭',
    title: 'Navigue dans KIVU',
    body: 'Accueil, Traduire, Apprendre, Préserver, Profil — tout est à portée de pouce.',
    voice: 'En bas, tu trouves la navigation principale : Accueil, Traduire, Apprendre, Préserver et Profil.'
  },
  {
    selector: null,
    placement: 'center',
    icon: '🚀',
    title: 'Tu es prêt·e !',
    body: 'Touche n\'importe où pour commencer ton aventure. Bonne découverte !',
    voice: 'Tu es prêt à explorer. Bonne aventure dans KIVU !'
  }
];

let stepIdx = 0;
let backdropEl = null;
let bubbleEl = null;
let voiceEnabled = true;

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function findTarget(selector) {
  if (!selector) return null;
  // selector may be comma-separated; pick the first visible one
  const parts = selector.split(',').map(s => s.trim());
  for (const sel of parts) {
    const el = document.querySelector(sel);
    if (el && el.getBoundingClientRect().width > 0) return el;
  }
  return null;
}

function getRect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
    bottom: r.bottom + window.scrollY,
    right: r.right + window.scrollX
  };
}

function ensureMounted() {
  if (backdropEl) return;
  backdropEl = document.createElement('div');
  backdropEl.className = 'kivu-tutorial-backdrop';
  backdropEl.innerHTML = `
    <svg class="kivu-tutorial-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <mask id="kivu-tut-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white"/>
          <rect class="kivu-tut-spot" x="-100" y="-100" width="0" height="0" rx="14" fill="black"/>
        </mask>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill="rgba(20, 32, 58, 0.78)" mask="url(#kivu-tut-mask)"/>
      <rect class="kivu-tut-ring" x="-100" y="-100" width="0" height="0" rx="14" fill="none" stroke="#FF9600" stroke-width="3" stroke-dasharray="6 6"/>
    </svg>
  `;
  document.body.appendChild(backdropEl);

  bubbleEl = document.createElement('div');
  bubbleEl.className = 'kivu-tutorial-bubble';
  document.body.appendChild(bubbleEl);
}

function teardown() {
  if (backdropEl) { backdropEl.remove(); backdropEl = null; }
  if (bubbleEl)   { bubbleEl.remove();   bubbleEl = null; }
  speech.cancelSpeech();
  document.body.classList.remove('kivu-tutorial-active');
  window.removeEventListener('resize', onResize);
  window.removeEventListener('scroll', onScroll, { passive: true });
}

function onResize() { renderStep(); }
function onScroll() { renderStep(); }

function renderStep() {
  const step = STEPS[stepIdx];
  if (!step) return finish(true);
  ensureMounted();
  document.body.classList.add('kivu-tutorial-active');

  const target = findTarget(step.selector);
  const rect = target ? getRect(target) : null;
  // Scroll target into view if needed (smooth)
  if (target) {
    const inView = rect.top - window.scrollY >= 80 && rect.bottom - window.scrollY <= window.innerHeight - 200;
    if (!inView) {
      window.scrollTo({ top: Math.max(0, rect.top - 120), behavior: 'smooth' });
    }
  }

  // Position the spotlight & ring
  const svg = backdropEl?.querySelector('.kivu-tutorial-svg');
  const spot = backdropEl?.querySelector('.kivu-tut-spot');
  const ring = backdropEl?.querySelector('.kivu-tut-ring');
  if (svg) {
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', document.documentElement.scrollHeight);
  }
  if (spot && rect) {
    const padding = 8;
    spot.setAttribute('x', rect.left - padding);
    spot.setAttribute('y', rect.top - padding);
    spot.setAttribute('width', rect.width + padding * 2);
    spot.setAttribute('height', rect.height + padding * 2);
  } else if (spot) {
    spot.setAttribute('width', 0);
    spot.setAttribute('height', 0);
  }
  if (ring && rect) {
    const padding = 8;
    ring.setAttribute('x', rect.left - padding);
    ring.setAttribute('y', rect.top - padding);
    ring.setAttribute('width', rect.width + padding * 2);
    ring.setAttribute('height', rect.height + padding * 2);
  } else if (ring) {
    ring.setAttribute('width', 0);
    ring.setAttribute('height', 0);
  }

  // Position the bubble
  const isFirst = stepIdx === 0;
  const isLast  = stepIdx === STEPS.length - 1;
  const progressPct = ((stepIdx + 1) / STEPS.length) * 100;

  if (bubbleEl) {
    bubbleEl.innerHTML = `
      <div class="kivu-tut-bubble-inner">
        <div class="kivu-tut-progress"><div class="kivu-tut-progress__fill" style="width: ${progressPct}%;"></div></div>
        <div class="kivu-tut-icon" aria-hidden="true">${step.icon}</div>
        <h3 class="kivu-tut-title">${escapeHtml(step.title)}</h3>
        <p class="kivu-tut-body">${escapeHtml(step.body)}</p>
        <div class="kivu-tut-counter">${stepIdx + 1} / ${STEPS.length}</div>
        <div class="kivu-tut-actions">
          <button class="kivu-tut-btn kivu-tut-btn--ghost" data-tut-action="skip">Passer le tour</button>
          <div class="kivu-tut-actions-right">
            ${!isFirst ? '<button class="kivu-tut-btn kivu-tut-btn--ghost" data-tut-action="prev">‹ Retour</button>' : ''}
            <button class="kivu-tut-btn kivu-tut-btn--primary" data-tut-action="next">${isLast ? 'Terminer ✨' : 'Suivant ›'}</button>
          </div>
        </div>
        <button class="kivu-tut-voice ${voiceEnabled ? 'is-on' : ''}" data-tut-action="voice" aria-label="Voix Kivi">
          ${voiceEnabled ? '🔊' : '🔇'}
        </button>
      </div>
    `;
    // Position the bubble near the target
    positionBubble(bubbleEl, rect, step.placement);
    attachHandlers();
  }

  // Speak the step with Kivi's voice
  if (voiceEnabled && step.voice) {
    speech.speakAsKivi(step.voice).catch(() => {});
  }
}

function positionBubble(bubble, rect, placement) {
  const margin = 14;
  const bw = bubble.offsetWidth || 320;
  const bh = bubble.offsetHeight || 220;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let top, left;

  if (!rect || placement === 'center') {
    top  = window.scrollY + (vh - bh) / 2;
    left = (vw - bw) / 2;
  } else if (placement === 'top') {
    top  = rect.top - bh - margin;
    left = rect.left + rect.width / 2 - bw / 2;
    if (top < window.scrollY + 16) top = rect.bottom + margin;
  } else if (placement === 'bottom') {
    top  = rect.bottom + margin;
    left = rect.left + rect.width / 2 - bw / 2;
    if (top + bh > window.scrollY + vh - 16) top = rect.top - bh - margin;
  } else if (placement === 'left') {
    top  = rect.top + rect.height / 2 - bh / 2;
    left = rect.left - bw - margin;
    if (left < 8) left = rect.right + margin;
  } else { // right
    top  = rect.top + rect.height / 2 - bh / 2;
    left = rect.right + margin;
    if (left + bw > vw - 8) left = rect.left - bw - margin;
  }
  // Clamp to viewport
  left = Math.max(8, Math.min(left, vw - bw - 8));
  top  = Math.max(window.scrollY + 8, Math.min(top, window.scrollY + vh - bh - 8));

  bubble.style.top  = top + 'px';
  bubble.style.left = left + 'px';
}

function attachHandlers() {
  bubbleEl?.querySelector('[data-tut-action="next"]')?.addEventListener('click', next);
  bubbleEl?.querySelector('[data-tut-action="prev"]')?.addEventListener('click', prev);
  bubbleEl?.querySelector('[data-tut-action="skip"]')?.addEventListener('click', () => finish(false));
  bubbleEl?.querySelector('[data-tut-action="voice"]')?.addEventListener('click', toggleVoice);
}

function next() {
  fx.click();
  if (stepIdx >= STEPS.length - 1) return finish(true);
  stepIdx++;
  renderStep();
}
function prev() {
  fx.click();
  if (stepIdx <= 0) return;
  stepIdx--;
  renderStep();
}
function toggleVoice() {
  voiceEnabled = !voiceEnabled;
  if (!voiceEnabled) speech.cancelSpeech();
  renderStep();
}
function finish(completed) {
  fx.click();
  store.set('tutorialCompleted', true);
  teardown();
  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast(completed
      ? '🎉 Tour guidé terminé — bonne aventure !'
      : 'Tour passé. Tu peux le rejouer depuis Paramètres.', { type: completed ? 'success' : 'info', duration: 2400 });
  }
}

/** Public: start the tutorial. Returns true if started, false if blocked. */
export function startTutorial({ force = false } = {}) {
  if (!force && store.get('tutorialCompleted')) return false;
  // Wait for the home page to be rendered
  if (!document.querySelector('.hero-card')) {
    setTimeout(() => startTutorial({ force }), 300);
    return false;
  }
  stepIdx = 0;
  voiceEnabled = true;
  ensureMounted();
  renderStep();
  window.addEventListener('resize', onResize);
  window.addEventListener('scroll', onScroll, { passive: true });
  fx.click();
  return true;
}

/** Public: reset and rerun the tutorial (called from settings). */
export function resetTutorial() {
  store.set('tutorialCompleted', false);
}
