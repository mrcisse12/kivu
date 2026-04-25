import { store } from '../store.js';
import { findLanguage } from '../data/languages.js';
import { icons } from '../components/icons.js';

let isRecording = false;
let currentMode = 'voice';

const MODES = [
  { id: 'voice',        label: 'Vocale',    icon: icons.mic },
  { id: 'text',         label: 'Texte',     icon: icons.chat },
  { id: 'camera',       label: 'Caméra',    icon: icons.camera },
  { id: 'conversation', label: 'Discussion', icon: icons.users }
];

export function renderTranslate() {
  const { sourceLanguage, targetLanguage } = store.get('translation');
  const source = findLanguage(sourceLanguage);
  const target = findLanguage(targetLanguage);

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Traduction</div>
        <div class="screen-subtitle">
          <span class="text-gradient font-bold">2 000+</span> langues, même hors-ligne
        </div>
      </div>
      ${isRecording ? '<span class="badge-live">En direct</span>' : ''}
    </div>

    <!-- Mode Switcher (SVG icons) -->
    <div class="card mb-md mode-switcher">
      ${MODES.map(m => `
        <button class="mode-btn ${currentMode === m.id ? 'active' : ''}"
                data-action="mode-${m.id}" aria-label="${m.label}">
          <span class="mode-icon" aria-hidden="true">${m.icon(20)}</span>
          <span class="mode-label">${m.label}</span>
        </button>
      `).join('')}
    </div>

    <!-- Language Selector -->
    <div class="lang-selector mb-md">
      ${renderLangPill(source, 'De', 'source')}
      <button class="lang-swap-btn" data-action="lang-swap" aria-label="Inverser les langues">
        ${icons.swap(20)}
      </button>
      ${renderLangPill(target, 'Vers', 'target')}
    </div>

    <!-- Source card -->
    <div class="card translate-card translate-card--source mb-md">
      <div class="translate-card__head">
        <div class="flex items-center gap-xs">
          <span class="lang-flag">${source.flag}</span>
          <span class="text-sm font-semibold">${source.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn icon-btn--sm" aria-label="Écouter">${icons.speaker(18)}</button>
          <button class="icon-btn icon-btn--sm" aria-label="Copier">${icons.copy(18)}</button>
        </div>
      </div>
      <div id="source-text" class="translate-card__body" data-empty="${!isRecording}">
        ${isRecording ? '<span class="recording-text">Écoute en cours…</span>' : 'Parlez ou écrivez ici…'}
      </div>
    </div>

    <!-- Mic Button -->
    <div class="mic-container">
      ${isRecording ? '<div class="mic-ripple"></div><div class="mic-ripple r2"></div><div class="mic-ripple r3"></div>' : ''}
      <button class="mic-btn ${isRecording ? 'recording' : ''}"
              data-action="mic-toggle"
              aria-label="${isRecording ? 'Arrêter l’enregistrement' : 'Démarrer l’enregistrement'}">
        ${isRecording ? icons.micOff(32, 'white') : icons.mic(32, 'white')}
      </button>
    </div>
    <div class="text-center text-sm text-muted mb-md mic-hint">
      ${isRecording ? 'Touchez pour arrêter' : 'Touchez pour parler'}
    </div>

    <!-- Target card -->
    <div class="card translate-card translate-card--target mb-md">
      <div class="translate-card__head">
        <div class="flex items-center gap-xs">
          <span class="lang-flag">${target.flag}</span>
          <span class="text-sm font-semibold">${target.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn icon-btn--sm" aria-label="Écouter">${icons.speaker(18)}</button>
          <button class="icon-btn icon-btn--sm" aria-label="Copier">${icons.copy(18)}</button>
          <button class="icon-btn icon-btn--sm" aria-label="Partager">${icons.share(18)}</button>
        </div>
      </div>
      <div id="target-text" class="translate-card__body" data-empty="true">
        La traduction apparaîtra ici…
      </div>
      <div class="flex gap-xs mt-md flex-wrap">
        <span class="chip chip-success">Confiance 95%</span>
        <span class="chip chip-primary">Hors-ligne</span>
        <span class="chip chip-accent">&lt;200 ms</span>
      </div>
    </div>

    <!-- Trust badges (SVG) -->
    <div class="grid grid-3 mb-lg trust-row">
      <div class="trust-card">
        <span class="trust-icon" style="color:var(--info)">${icons.wifiOff(22)}</span>
        <div>
          <div class="font-semibold text-sm">Hors-ligne</div>
          <div class="text-xs text-muted">Marche sans data</div>
        </div>
      </div>
      <div class="trust-card">
        <span class="trust-icon" style="color:var(--success)">${icons.lock(22)}</span>
        <div>
          <div class="font-semibold text-sm">E2E Chiffré</div>
          <div class="text-xs text-muted">Privacy first</div>
        </div>
      </div>
      <div class="trust-card">
        <span class="trust-icon" style="color:var(--kivu-accent)">${icons.zap(22)}</span>
        <div>
          <div class="font-semibold text-sm">Ultra rapide</div>
          <div class="text-xs text-muted">&lt;200 ms latence</div>
        </div>
      </div>
    </div>

    <!-- Recent translations -->
    <h2 class="font-display font-bold text-lg mb-sm">Traductions récentes</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderHistoryItem('🇫🇷', '🇲🇱', 'Ça va mon ami ?', 'I ka kɛnɛ, n teri?', 'à l\'instant')}
      ${renderHistoryItem('🇫🇷', '🇨🇮', 'Combien coûte ce fruit ?', 'Joli foli yen ka jigi fili ?', 'il y a 5 min')}
      ${renderHistoryItem('🇫🇷', '🇹🇿', 'Bon voyage', 'Safari njema', 'hier')}
    </div>
  `;
}

function renderLangPill(lang, label, target) {
  return `
    <button class="lang-pill" data-action="pick-${target}" aria-label="Choisir la langue ${label.toLowerCase()}">
      <span class="lang-flag">${lang.flag}</span>
      <div class="lang-pill__body">
        <div class="lang-pill__label">${label}</div>
        <div class="lang-pill__name">${lang.name}</div>
      </div>
      <span class="lang-pill__chevron" aria-hidden="true">${icons.chevronDown(16)}</span>
    </button>
  `;
}

function renderHistoryItem(fromFlag, toFlag, source, target, time) {
  return `
    <div class="card history-item">
      <div class="flex items-center gap-xs mb-xs">
        <span class="lang-flag-sm">${fromFlag}</span>
        <span class="text-tertiary">${icons.arrowRight(14)}</span>
        <span class="lang-flag-sm">${toFlag}</span>
        <span style="margin-left:auto" class="text-xs text-muted">${time}</span>
      </div>
      <div class="text-sm text-muted">${source}</div>
      <div class="font-semibold">${target}</div>
    </div>
  `;
}

renderTranslate.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderTranslate();
    renderTranslate.mount();
  };

  document.querySelectorAll('[data-action="mic-toggle"]').forEach(el =>
    el.addEventListener('click', () => {
      isRecording = !isRecording;
      rerender();
      if (isRecording && window.__KIVU__?.toast) {
        window.__KIVU__.toast('Écoute activée — parlez maintenant', { type: 'info', duration: 1800 });
      }
    })
  );

  document.querySelectorAll('[data-action="lang-swap"]').forEach(el =>
    el.addEventListener('click', () => {
      const { sourceLanguage, targetLanguage } = store.get('translation');
      store.update('translation', t => ({ ...t, sourceLanguage: targetLanguage, targetLanguage: sourceLanguage }));
    })
  );

  MODES.forEach(m => {
    document.querySelectorAll(`[data-action="mode-${m.id}"]`).forEach(el =>
      el.addEventListener('click', () => { currentMode = m.id; rerender(); })
    );
  });
};
