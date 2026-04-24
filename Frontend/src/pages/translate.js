import { store } from '../store.js';
import { LANGUAGES, findLanguage } from '../data/languages.js';

let isRecording = false;
let currentMode = 'voice';

export function renderTranslate() {
  const { sourceLanguage, targetLanguage } = store.get('translation');
  const source = findLanguage(sourceLanguage);
  const target = findLanguage(targetLanguage);

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Traduction</div>
        <div class="screen-subtitle">
          <span class="text-gradient font-bold">2000+</span> langues, même hors-ligne
        </div>
      </div>
      ${isRecording ? '<span class="badge-live">Live</span>' : ''}
    </div>

    <!-- Mode Switcher -->
    <div class="card mb-md" style="padding:4px; display:grid; grid-template-columns:repeat(4,1fr); gap:4px;">
      ${renderMode('voice', '🎙️', 'Vocale')}
      ${renderMode('text', '💬', 'Texte')}
      ${renderMode('camera', '📷', 'Caméra')}
      ${renderMode('conversation', '🗣️', 'Discussion')}
    </div>

    <!-- Language Selector -->
    <div class="flex gap-xs items-center mb-md">
      ${renderLangPill(source, 'De', 'source')}
      <button class="lang-swap-btn" data-action="lang-swap" aria-label="Inverser">⇄</button>
      ${renderLangPill(target, 'Vers', 'target')}
    </div>

    <!-- Source card -->
    <div class="card mb-md" style="border: 2px solid rgba(23,78,156,0.2);">
      <div class="flex justify-between items-center mb-sm">
        <div class="flex items-center gap-xs">
          <span style="font-size:20px">${source.flag}</span>
          <span class="text-sm text-muted">${source.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn" style="width:36px;height:36px">🔊</button>
          <button class="icon-btn" style="width:36px;height:36px">📋</button>
        </div>
      </div>
      <div id="source-text" style="font-size:17px; min-height:60px; color:var(--text-tertiary);">
        Parlez ou écrivez ici...
      </div>
    </div>

    <!-- Mic Button -->
    <div class="mic-container">
      ${isRecording ? '<div class="mic-ripple"></div><div class="mic-ripple r2"></div><div class="mic-ripple r3"></div>' : ''}
      <button class="mic-btn ${isRecording ? 'recording' : ''}" data-action="mic-toggle">
        ${isRecording ? '⏹️' : '🎙️'}
      </button>
    </div>
    <div class="text-center text-sm text-muted mb-md">
      ${isRecording ? 'Écoute en cours...' : 'Appuyez pour parler'}
    </div>

    <!-- Target card -->
    <div class="card mb-md" style="border: 2px solid rgba(242,149,45,0.25);">
      <div class="flex justify-between items-center mb-sm">
        <div class="flex items-center gap-xs">
          <span style="font-size:20px">${target.flag}</span>
          <span class="text-sm text-muted">${target.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn" style="width:36px;height:36px">🔊</button>
          <button class="icon-btn" style="width:36px;height:36px">📋</button>
          <button class="icon-btn" style="width:36px;height:36px">↗️</button>
        </div>
      </div>
      <div id="target-text" style="font-size:17px; min-height:60px; color:var(--text-tertiary);">
        Appuyez sur le microphone pour commencer...
      </div>
      <div class="flex gap-xs mt-md">
        <span class="chip chip-success">✓ 95% confiance</span>
        <span class="chip chip-primary">📶 Hors-ligne</span>
      </div>
    </div>

    <!-- Feature badges row -->
    <div class="grid grid-3 mb-lg">
      <div class="chip chip-primary" style="justify-content:center; padding:12px;">📶 Hors-ligne</div>
      <div class="chip chip-success" style="justify-content:center; padding:12px;">🔒 E2E</div>
      <div class="chip chip-accent" style="justify-content:center; padding:12px;">⚡ &lt;200 ms</div>
    </div>

    <!-- Recent translations -->
    <h2 class="font-display font-bold text-lg mb-sm">Traductions récentes</h2>
    <div class="flex flex-col gap-xs">
      ${renderHistoryItem('🇫🇷', '🇲🇱', 'Ça va mon ami ?', 'I ka kɛnɛ, n teri?', 'à l\'instant')}
      ${renderHistoryItem('🇫🇷', '🇨🇮', 'Combien coûte ce fruit ?', 'Joli foli yen ka jigi fili ?', 'il y a 5 min')}
      ${renderHistoryItem('🇫🇷', '🇹🇿', 'Bon voyage', 'Safari njema', 'hier')}
    </div>
  `;
}

function renderMode(id, icon, label) {
  const active = currentMode === id;
  return `
    <button class="bottom-nav-item ${active ? 'active' : ''}"
      style="padding: 10px 6px; border-radius: var(--r-md); ${active ? 'background: var(--grad-hero); color: white;' : ''}"
      data-action="mode-${id}">
      <span style="font-size:16px">${icon}</span>
      <span style="font-size:10px">${label}</span>
    </button>
  `;
}

function renderLangPill(lang, label, target) {
  return `
    <button class="lang-pill" data-action="pick-${target}">
      <span class="flag">${lang.flag}</span>
      <div style="flex:1; text-align:left;">
        <div class="label">${label}</div>
        <div class="name">${lang.name}</div>
      </div>
      <span class="text-muted">▼</span>
    </button>
  `;
}

function renderHistoryItem(fromFlag, toFlag, source, target, time) {
  return `
    <div class="card">
      <div class="flex items-center gap-xs mb-xs">
        <span>${fromFlag}</span>
        <span class="text-muted">→</span>
        <span>${toFlag}</span>
        <span style="margin-left:auto" class="text-xs text-muted">${time}</span>
      </div>
      <div class="text-sm text-muted">${source}</div>
      <div class="font-semibold">${target}</div>
    </div>
  `;
}

renderTranslate.mount = () => {
  document.addEventListener('mic-toggle', () => {
    isRecording = !isRecording;
    document.querySelector('main.screen').innerHTML = renderTranslate();
    renderTranslate.mount();
  });

  document.addEventListener('lang-swap', () => {
    const { sourceLanguage, targetLanguage } = store.get('translation');
    store.update('translation', t => ({ ...t, sourceLanguage: targetLanguage, targetLanguage: sourceLanguage }));
  });
};
