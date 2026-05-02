import { store } from '../store.js';
import { LANGUAGES, findLanguage } from '../data/languages.js';
import { icons } from '../components/icons.js';
import { api, ApiError } from '../services/api.js';
import { speech } from '../services/speech.js';
import { confirmModal } from '../services/dialog.js';
import { offlineTranslate, isNetworkError } from '../services/offline-translator.js';

let isRecording = false;
let isTranslating = false;
let currentMode = 'voice';

// Language picker state
let pickerOpen = false;   // false | 'source' | 'target'
let pickerQuery = '';

// Conversation mode state
let convMessages = [];
let convTurn = 'user'; // 'user' | 'partner'

let sourceText = '';
let translation = null; // { translatedText, confidence, offline }
let lastError = null;
let stopListening = null;

const MODES = [
  { id: 'voice',        label: 'Vocale',    icon: icons.mic },
  { id: 'text',         label: 'Texte',     icon: icons.chat },
  { id: 'camera',       label: 'Caméra',    icon: icons.camera },
  { id: 'conversation', label: 'Discussion', icon: icons.users }
];

const HISTORY = [
  { fromFlag: '🇫🇷', toFlag: '🇲🇱', source: 'Ça va mon ami ?',         target: 'I ka kɛnɛ, n teri?',  time: 'à l\'instant' },
  { fromFlag: '🇫🇷', toFlag: '🇨🇮', source: 'Combien coûte ce fruit ?', target: 'Joli foli yen ka jigi fili ?', time: 'il y a 5 min' },
  { fromFlag: '🇫🇷', toFlag: '🇹🇿', source: 'Bon voyage',                target: 'Safari njema',          time: 'hier' }
];

export function renderTranslate() {
  const { sourceLanguage, targetLanguage } = store.get('translation');
  const source = findLanguage(sourceLanguage);
  const target = findLanguage(targetLanguage);

  const sttOk = speech.sttSupported;
  const ttsOk = speech.ttsSupported;

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

    <!-- Source card (hidden in camera/conversation modes) -->
    <div class="card translate-card translate-card--source mb-md"
         style="${['camera','conversation'].includes(currentMode) ? 'display:none' : ''}">
      <div class="translate-card__head">
        <div class="flex items-center gap-xs">
          <span class="lang-flag">${source.flag}</span>
          <span class="text-sm font-semibold">${source.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn icon-btn--sm" data-action="speak-source" aria-label="Écouter">${icons.speaker(18)}</button>
          <button class="icon-btn icon-btn--sm" data-action="copy-source" aria-label="Copier">${icons.copy(18)}</button>
          ${sourceText ? `<button class="icon-btn icon-btn--sm" data-action="clear-source" aria-label="Effacer">${icons.close(18)}</button>` : ''}
        </div>
      </div>
      ${currentMode === 'text'
        ? `<textarea id="source-text-input"
                     class="translate-textarea"
                     placeholder="Écrivez ici…"
                     rows="3">${escapeHtml(sourceText)}</textarea>`
        : `<div id="source-text" class="translate-card__body" data-empty="${!sourceText && !isRecording}">
             ${isRecording
               ? '<span class="recording-text">Écoute en cours…</span>'
               : (sourceText ? escapeHtml(sourceText) : 'Touchez le micro pour parler 🎙️')}
           </div>`}
    </div>

    ${currentMode === 'voice'        ? renderMicButton(sttOk) : ''}
    ${currentMode === 'text'         ? renderTextActions() : ''}
    ${currentMode === 'camera'       ? renderCameraMode() : ''}
    ${currentMode === 'conversation' ? renderConversationMode(source, target) : ''}

    <!-- Target card (hidden in camera/conversation modes) -->
    <div class="card translate-card translate-card--target mb-md"
         style="${['camera','conversation'].includes(currentMode) ? 'display:none' : ''}">
      <div class="translate-card__head">
        <div class="flex items-center gap-xs">
          <span class="lang-flag">${target.flag}</span>
          <span class="text-sm font-semibold">${target.name}</span>
        </div>
        <div class="flex gap-xs">
          <button class="icon-btn icon-btn--sm"
                  data-action="speak-target"
                  ${!translation || !ttsOk ? 'disabled' : ''}
                  aria-label="Écouter">${icons.speaker(18)}</button>
          <button class="icon-btn icon-btn--sm"
                  data-action="copy-target"
                  ${!translation ? 'disabled' : ''}
                  aria-label="Copier">${icons.copy(18)}</button>
          <button class="icon-btn icon-btn--sm"
                  data-action="share-target"
                  ${!translation ? 'disabled' : ''}
                  aria-label="Partager">${icons.share(18)}</button>
        </div>
      </div>
      <div id="target-text"
           class="translate-card__body"
           data-empty="${!translation}">
        ${isTranslating
          ? '<span class="recording-text" style="color:var(--kivu-primary)">Traduction…</span>'
          : translation
            ? escapeHtml(translation.translatedText)
            : 'La traduction apparaîtra ici…'}
      </div>
      ${translation ? `
        <div class="flex gap-xs mt-md flex-wrap">
          <span class="chip chip-success">Confiance ${Math.round((translation.confidence || 0) * 100)}%</span>
          <span class="chip ${translation.offline ? 'chip-primary' : 'chip-accent'}">
            ${translation.offline ? 'Hors-ligne' : 'En ligne'}
          </span>
          <span class="chip chip-ghost">${translation.durationMs ?? '<1'} ms</span>
        </div>
      ` : ''}
      ${lastError ? `<div class="text-xs mt-sm" style="color:var(--error);">${escapeHtml(lastError)}</div>` : ''}
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
          <div class="font-semibold text-sm">E2E chiffré</div>
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

    ${!sttOk && currentMode === 'voice' ? `
      <div class="card mb-md" style="background:rgba(250,179,51,0.10); border:1px solid rgba(250,179,51,0.3);">
        <div class="text-sm" style="color:#B07700;">
          <strong>🎙️ Mode vocal indisponible</strong> sur ce navigateur — bascule vers
          <button class="link-btn" data-action="mode-text" style="font-weight:700;">le mode Texte</button>
          ou utilise Chrome / Edge.
        </div>
      </div>
    ` : ''}

    <!-- Recent translations -->
    ${renderHistorySection()}

    <!-- Language picker modal (rendered when open) -->
    ${pickerOpen ? renderLangPicker(pickerOpen) : ''}
  `;
}

function renderMicButton(sttOk) {
  return `
    <div class="mic-container">
      ${isRecording ? '<div class="mic-ripple"></div><div class="mic-ripple r2"></div><div class="mic-ripple r3"></div>' : ''}
      <button class="mic-btn ${isRecording ? 'recording' : ''}"
              data-action="mic-toggle"
              ${!sttOk ? 'disabled' : ''}
              aria-label="${isRecording ? 'Arrêter l’enregistrement' : 'Démarrer l’enregistrement'}">
        ${isRecording ? icons.micOff(32, 'white') : icons.mic(32, 'white')}
      </button>
    </div>
    <div class="text-center text-sm text-muted mb-md mic-hint">
      ${isRecording ? 'Touchez pour arrêter' : sttOk ? 'Touchez pour parler' : 'Mode texte uniquement sur ce navigateur'}
    </div>
  `;
}

function renderTextActions() {
  return `
    <div class="flex gap-xs mb-md">
      <button class="btn btn-primary btn-full" data-action="run-translate" ${isTranslating ? 'disabled' : ''}>
        ${isTranslating ? 'Traduction en cours…' : 'Traduire'}
      </button>
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

/* ── Camera mode ────────────────────────────────────────────── */
function renderCameraMode() {
  return `
    <div class="camera-zone mb-md">
      <div class="camera-frame">
        <div class="camera-frame__inner">
          <div class="camera-icon-wrap">
            ${icons.camera(36, 'white')}
          </div>
          <div class="camera-hint">
            Pointez votre caméra sur un texte<br>
            <span style="font-size:11px; opacity:0.7;">Swahili · Yoruba · Haoussa · Français pris en charge</span>
          </div>
          <button class="btn btn-white btn-sm mt-sm" data-action="camera-capture">
            Capturer & Traduire
          </button>
        </div>
        <!-- Decorative corner scan lines -->
        <div class="scan-corner scan-corner--tl"></div>
        <div class="scan-corner scan-corner--tr"></div>
        <div class="scan-corner scan-corner--bl"></div>
        <div class="scan-corner scan-corner--br"></div>
        <div class="scan-line"></div>
      </div>
      <div class="text-xs text-muted text-center mt-xs">
        OCR multilingue — fonctionne hors-ligne
      </div>
    </div>
  `;
}

/* ── Conversation mode ──────────────────────────────────────── */
function renderConversationMode(source, target) {
  return `
    <div class="conv-zone mb-md">
      <!-- Stream -->
      <div class="conv-stream" id="conv-stream">
        ${convMessages.map(m => `
          <div class="conv-bubble conv-bubble--${m.side}">
            <div class="conv-bubble__lang">
              ${m.side === 'user' ? source.flag : target.flag}
              ${m.side === 'user' ? source.name : target.name}
            </div>
            <div class="conv-bubble__text">${escapeHtml(m.text)}</div>
            ${m.translation ? `<div class="conv-bubble__trans">${escapeHtml(m.translation)}</div>` : ''}
          </div>
        `).join('')}
        ${convMessages.length === 0 ? `
          <div class="conv-empty">
            <div style="font-size:40px; margin-bottom:8px;">🤝</div>
            <div class="font-semibold">Conversation bilingue</div>
            <div class="text-xs text-muted mt-xs">
              Chaque personne parle sa langue — KIVU traduit en temps réel.
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Two mic buttons: user side + partner side -->
      <div class="conv-controls">
        <div class="conv-mic-wrap ${convTurn === 'user' ? 'is-active' : ''}">
          <span class="text-xs font-bold text-center">${source.flag} ${source.name}</span>
          <button class="conv-mic-btn ${convTurn === 'user' && isRecording ? 'is-recording' : ''}"
                  data-action="conv-speak-user" aria-label="Parler en ${source.name}">
            ${icons.mic(22, 'white')}
          </button>
          <span class="text-xs text-muted">${convTurn === 'user' && isRecording ? 'Écoute…' : 'Toucher pour parler'}</span>
        </div>

        <div class="conv-divider">⇄</div>

        <div class="conv-mic-wrap ${convTurn === 'partner' ? 'is-active' : ''}">
          <span class="text-xs font-bold text-center">${target.flag} ${target.name}</span>
          <button class="conv-mic-btn ${convTurn === 'partner' && isRecording ? 'is-recording' : ''}"
                  data-action="conv-speak-partner" aria-label="Parler en ${target.name}">
            ${icons.mic(22, 'white')}
          </button>
          <span class="text-xs text-muted">${convTurn === 'partner' && isRecording ? 'Écoute…' : 'Toucher pour parler'}</span>
        </div>
      </div>
    </div>
  `;
}

/* ── Language Picker Modal ──────────────────────────────────── */
function renderLangPicker(which) {
  const { sourceLanguage, targetLanguage } = store.get('translation');
  const current = which === 'source' ? sourceLanguage : targetLanguage;

  const filtered = LANGUAGES.filter(l =>
    !pickerQuery || l.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(pickerQuery.toLowerCase())
  );

  const groups = [
    { label: 'Internationales', ids: filtered.filter(l => l.status === 'international') },
    { label: 'Langues véhiculaires', ids: filtered.filter(l => l.status === 'lingua') },
    { label: 'Langues vitales', ids: filtered.filter(l => l.status === 'healthy') },
    { label: 'Langues vulnérables', ids: filtered.filter(l => l.status === 'vulnerable') },
    { label: 'Langues menacées', ids: filtered.filter(l => ['endangered','critical'].includes(l.status)) },
  ].filter(g => g.ids.length > 0);

  return `
    <div class="modal-backdrop" id="lang-picker-backdrop" role="dialog"
         aria-modal="true" aria-label="Choisir une langue">
      <div class="modal-sheet lang-picker-sheet">
        <div class="modal-handle"></div>
        <div class="flex items-center gap-sm mb-md">
          <h2 class="font-display font-bold text-lg" style="flex:1;">
            ${which === 'source' ? 'Langue source' : 'Langue cible'}
          </h2>
          <button class="icon-btn" id="lang-picker-close" aria-label="Fermer">${icons.close(20)}</button>
        </div>

        <!-- Search -->
        <div class="form-group mb-md" style="position:relative;">
          <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-tertiary);">
            ${icons.search(16)}
          </span>
          <input id="lang-picker-search" class="form-input" type="search"
                 placeholder="Rechercher une langue…"
                 value="${escapeAttr(pickerQuery)}"
                 style="padding-left:40px;" autocomplete="off"/>
        </div>

        <!-- Language list -->
        <div class="lang-picker-list">
          ${groups.map(g => `
            <div class="lang-picker-group-label">${g.label}</div>
            ${g.ids.map(l => `
              <button class="lang-picker-row ${l.id === current ? 'is-selected' : ''}"
                      data-action="pick-lang" data-id="${l.id}" data-which="${which}">
                <span class="lang-flag-lg" aria-hidden="true">${l.flag}</span>
                <div style="flex:1; text-align:left;">
                  <div class="font-semibold">${l.name}</div>
                  <div class="text-xs text-muted">${l.nativeName}</div>
                </div>
                ${l.id === current ? `<span style="color:var(--kivu-primary);">${icons.check(18)}</span>` : ''}
              </button>
            `).join('')}
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function escapeAttr(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderHistoryItem(h) {
  const time = h.time || formatRelativeTime(h.date);
  return `
    <div class="card history-item" data-id="${h.id || ''}">
      <div class="flex items-center gap-xs mb-xs">
        <span class="lang-flag-sm">${h.fromFlag}</span>
        <span class="text-tertiary">${icons.arrowRight(14)}</span>
        <span class="lang-flag-sm">${h.toFlag}</span>
        <span style="margin-left:auto" class="text-xs text-muted">${time}</span>
        ${h.id ? `
          <button class="icon-btn icon-btn--xs" data-action="hist-fav" data-id="${h.id}"
                  aria-label="Favori"
                  style="color:${h.favorite ? 'var(--kivu-accent)' : 'var(--text-tertiary)'};">
            ${h.favorite ? icons.starFilled(16) : icons.star(16)}
          </button>
          <button class="icon-btn icon-btn--xs" data-action="hist-replay" data-id="${h.id}"
                  aria-label="Réécouter">${icons.speaker(16)}</button>
          <button class="icon-btn icon-btn--xs" data-action="hist-copy" data-id="${h.id}"
                  aria-label="Copier">${icons.copy ? icons.copy(16) : '📋'}</button>
          <button class="icon-btn icon-btn--xs" data-action="hist-del" data-id="${h.id}"
                  aria-label="Supprimer" style="color:var(--text-tertiary);">${icons.trash ? icons.trash(16) : '🗑'}</button>
        ` : ''}
      </div>
      <div class="text-sm text-muted">${escapeHtml(h.source)}</div>
      <div class="font-semibold">${escapeHtml(h.target)}</div>
    </div>
  `;
}

let historyTab = 'recent'; // 'recent' | 'favorites'

function renderHistorySection() {
  const tr = store.get('translation') || {};
  const fullHistory = tr.history || [];
  const favorites = fullHistory.filter(h => h.favorite);
  const list = historyTab === 'favorites' ? favorites : fullHistory.slice(0, 12);

  // Fallback seed if empty
  const fallback = (!fullHistory.length && historyTab === 'recent') ? SAMPLE_HISTORY : [];
  const items = list.length ? list : fallback;

  return `
    <div class="flex items-center mb-sm" style="gap:var(--space-xs);">
      <h2 class="font-display font-bold text-lg" style="margin-right:auto;">Traductions</h2>
      <div class="seg-tabs">
        <button class="seg-tab ${historyTab === 'recent' ? 'active' : ''}"
                data-action="hist-tab" data-tab="recent">Récentes</button>
        <button class="seg-tab ${historyTab === 'favorites' ? 'active' : ''}"
                data-action="hist-tab" data-tab="favorites">⭐ ${favorites.length}</button>
      </div>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${items.length === 0 ? `
        <div class="empty-state">
          <div class="empty-state__emoji">🗒️</div>
          <div class="font-semibold">${historyTab === 'favorites' ? 'Aucun favori pour le moment' : 'Aucune traduction encore'}</div>
          <div class="text-xs text-muted">${historyTab === 'favorites' ? 'Touchez l\'étoile sur une traduction pour la garder ici.' : 'Faites une traduction pour la voir apparaître.'}</div>
        </div>
      ` : items.map(h => renderHistoryItem(h)).join('')}
      ${fullHistory.length > 0 && historyTab === 'recent' ? `
        <button class="btn btn-ghost btn-sm" data-action="hist-clear"
                style="align-self:center;margin-top:var(--space-sm);">
          Effacer l'historique
        </button>
      ` : ''}
    </div>
  `;
}

const SAMPLE_HISTORY = [
  { fromFlag: '🇫🇷', toFlag: '🇲🇱', source: 'Ça va mon ami ?',         target: 'I ka kɛnɛ, n teri?',  time: 'exemple' },
  { fromFlag: '🇫🇷', toFlag: '🇨🇮', source: 'Combien coûte ce fruit ?', target: 'Joli foli yen ka jigi fili ?', time: 'exemple' },
  { fromFlag: '🇫🇷', toFlag: '🇹🇿', source: 'Bon voyage',               target: 'Safari njema',          time: 'exemple' }
];

function formatRelativeTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `il y a ${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ===========================================================
// Lifecycle / interactions
// ===========================================================
renderTranslate.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderTranslate();
    renderTranslate.mount();
  };

  // Mode switching
  MODES.forEach(m => {
    document.querySelectorAll(`[data-action="mode-${m.id}"]`).forEach(el =>
      el.addEventListener('click', () => {
        if (currentMode === m.id) return;
        currentMode = m.id;
        if (currentMode !== 'voice' && isRecording) {
          stopListening?.();
          isRecording = false;
        }
        rerender();
      })
    );
  });

  /* ── History actions ──────────────────────────────────── */
  document.querySelectorAll('[data-action="hist-tab"]').forEach(btn =>
    btn.addEventListener('click', () => { historyTab = btn.dataset.tab; rerender(); })
  );
  document.querySelectorAll('[data-action="hist-fav"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      store.update('translation', t => ({
        ...t,
        history: (t.history || []).map(h => h.id === id ? { ...h, favorite: !h.favorite } : h)
      }));
      rerender();
    })
  );
  document.querySelectorAll('[data-action="hist-replay"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const h = (store.get('translation')?.history || []).find(x => x.id === id);
      if (h && speech.ttsSupported) speech.speak(h.target, h.targetLang || 'swa');
    })
  );
  document.querySelectorAll('[data-action="hist-copy"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const h = (store.get('translation')?.history || []).find(x => x.id === id);
      if (!h) return;
      try {
        await navigator.clipboard.writeText(`${h.source}\n→ ${h.target}`);
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Copié dans le presse-papier', { type: 'success', duration: 1400 });
      } catch {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Impossible de copier', { type: 'error' });
      }
    })
  );
  document.querySelectorAll('[data-action="hist-del"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      store.update('translation', t => ({
        ...t,
        history: (t.history || []).filter(x => x.id !== id)
      }));
      rerender();
    })
  );
  document.querySelectorAll('[data-action="hist-clear"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const ok = await confirmModal({
        icon: '🗒️',
        title: 'Effacer l\'historique ?',
        message: 'Toutes les traductions non favorites seront supprimées. Tes favoris (⭐) seront conservés.',
        confirmLabel: 'Effacer',
        cancelLabel: 'Annuler'
      });
      if (!ok) return;
      store.update('translation', t => ({
        ...t,
        history: (t.history || []).filter(h => h.favorite)
      }));
      rerender();
    })
  );

  // Language swap
  document.querySelectorAll('[data-action="lang-swap"]').forEach(el =>
    el.addEventListener('click', () => {
      const { sourceLanguage, targetLanguage } = store.get('translation');
      store.update('translation', t => ({
        ...t,
        sourceLanguage: targetLanguage,
        targetLanguage: sourceLanguage
      }));
      // Swap the texts too for instant feedback
      if (translation) {
        sourceText = translation.translatedText;
        translation = null;
      }
    })
  );

  // Language picker — open
  document.querySelectorAll('[data-action="pick-source"]').forEach(el =>
    el.addEventListener('click', () => { pickerOpen = 'source'; pickerQuery = ''; rerender(); })
  );
  document.querySelectorAll('[data-action="pick-target"]').forEach(el =>
    el.addEventListener('click', () => { pickerOpen = 'target'; pickerQuery = ''; rerender(); })
  );

  // Language picker — close via X or backdrop
  document.getElementById('lang-picker-close')?.addEventListener('click', () => {
    pickerOpen = false; rerender();
  });
  document.getElementById('lang-picker-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'lang-picker-backdrop') { pickerOpen = false; rerender(); }
  });

  // Language picker — search
  document.getElementById('lang-picker-search')?.addEventListener('input', (e) => {
    pickerQuery = e.target.value;
    // Rebuild only the list content without full re-render for smooth typing
    const list = document.querySelector('.lang-picker-list');
    if (list && pickerOpen) {
      const tmp = document.createElement('div');
      tmp.innerHTML = renderLangPicker(pickerOpen);
      const newList = tmp.querySelector('.lang-picker-list');
      if (newList) list.innerHTML = newList.innerHTML;
      // Re-attach pick-lang handlers inside picker
      attachPickLangHandlers();
    }
  });

  function attachPickLangHandlers() {
    document.querySelectorAll('[data-action="pick-lang"]').forEach(btn =>
      btn.addEventListener('click', () => {
        const { id, which } = btn.dataset;
        if (which === 'source') {
          store.update('translation', t => ({ ...t, sourceLanguage: id }));
        } else {
          store.update('translation', t => ({ ...t, targetLanguage: id }));
        }
        pickerOpen = false;
        pickerQuery = '';
        translation = null;
        rerender();
      })
    );
  }
  attachPickLangHandlers();

  // Mic button — Web Speech STT
  document.querySelectorAll('[data-action="mic-toggle"]').forEach(el =>
    el.addEventListener('click', () => {
      if (isRecording) {
        stopListening?.();
        isRecording = false;
        rerender();
        return;
      }
      const { sourceLanguage } = store.get('translation');
      lastError = null;
      isRecording = true;
      sourceText = '';
      translation = null;
      rerender();

      stopListening = speech.startListening(sourceLanguage, {
        onResult: ({ text, isFinal }) => {
          sourceText = text;
          // Live update of source text without full rerender
          const el = document.getElementById('source-text');
          if (el) {
            el.textContent = text;
            el.dataset.empty = 'false';
          }
          if (isFinal) {
            isRecording = false;
            stopListening = null;
            rerender();
            runTranslation();
          }
        },
        onError: (err) => {
          isRecording = false;
          stopListening = null;
          lastError = humanizeSttError(err);
          rerender();
          if (window.__KIVU__?.toast) {
            window.__KIVU__.toast(lastError, { type: 'error' });
          }
        },
        onEnd: () => {
          if (isRecording) {
            isRecording = false;
            rerender();
          }
        }
      });
    })
  );

  // Text mode "Translate" button
  document.querySelectorAll('[data-action="run-translate"]').forEach(el =>
    el.addEventListener('click', () => {
      const input = document.getElementById('source-text-input');
      if (input) sourceText = input.value.trim();
      if (!sourceText) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Saisissez du texte à traduire', { type: 'warning' });
        return;
      }
      runTranslation();
    })
  );

  // Listen on textarea live so source stays in sync
  const ta = document.getElementById('source-text-input');
  if (ta) {
    ta.addEventListener('input', () => { sourceText = ta.value; });
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sourceText = ta.value.trim();
        if (sourceText) runTranslation();
      }
    });
  }

  // Speaker buttons (TTS)
  document.querySelectorAll('[data-action="speak-source"]').forEach(el =>
    el.addEventListener('click', () => {
      if (!sourceText) return;
      const { sourceLanguage } = store.get('translation');
      speech.speak(sourceText, sourceLanguage);
    })
  );
  document.querySelectorAll('[data-action="speak-target"]').forEach(el =>
    el.addEventListener('click', () => {
      if (!translation) return;
      const { targetLanguage } = store.get('translation');
      speech.speak(translation.translatedText, targetLanguage);
    })
  );

  // Copy / share / clear
  document.querySelectorAll('[data-action="copy-source"]').forEach(el =>
    el.addEventListener('click', () => copyToClipboard(sourceText, 'Texte source copié'))
  );
  document.querySelectorAll('[data-action="copy-target"]').forEach(el =>
    el.addEventListener('click', () => copyToClipboard(translation?.translatedText, 'Traduction copiée'))
  );
  document.querySelectorAll('[data-action="share-target"]').forEach(el =>
    el.addEventListener('click', async () => {
      const text = translation?.translatedText;
      if (!text) return;
      if (navigator.share) {
        try { await navigator.share({ text, title: 'KIVU Traduction' }); }
        catch { /* user dismissed */ }
      } else {
        copyToClipboard(text, 'Traduction copiée');
      }
    })
  );
  document.querySelectorAll('[data-action="clear-source"]').forEach(el =>
    el.addEventListener('click', () => {
      sourceText = '';
      translation = null;
      lastError = null;
      rerender();
    })
  );

  async function runTranslation() {
    const { sourceLanguage, targetLanguage } = store.get('translation');
    if (!sourceText.trim()) return;
    isTranslating = true;
    lastError = null;
    rerender();
    try {
      const result = await api.translate(sourceText, sourceLanguage, targetLanguage);
      translation = result;
      isTranslating = false;
      // Track translation count for badges / profile
      store.update('user', u => ({
        ...u,
        stats: { ...u.stats, translationsCount: (u.stats.translationsCount || 0) + 1 }
      }));
      // Save to translation history (deduplicate same source+target)
      const fromLang = findLanguage(sourceLanguage);
      const toLang = findLanguage(targetLanguage);
      store.update('translation', t => {
        const entry = {
          id: 'tr_' + Date.now(),
          source: sourceText.trim(),
          target: result.translatedText,
          sourceLang: sourceLanguage,
          targetLang: targetLanguage,
          fromFlag: fromLang?.flag || '🌐',
          toFlag: toLang?.flag || '🌐',
          date: new Date().toISOString(),
          favorite: false
        };
        const prev = (t.history || []).filter(h =>
          !(h.source === entry.source && h.targetLang === entry.targetLang)
        );
        return { ...t, history: [entry, ...prev].slice(0, 100) }; // keep last 100
      });
      rerender();
      // Auto-speak the translation
      if (speech.ttsSupported) {
        setTimeout(() => speech.speak(result.translatedText, targetLanguage), 200);
      }
    } catch (err) {
      // Network failure → try offline dictionary translation
      if (isNetworkError(err)) {
        const offlineResult = offlineTranslate(sourceText, sourceLanguage, targetLanguage);
        if (offlineResult) {
          translation = offlineResult;
          isTranslating = false;
          // Update history same as the success path
          const fromLang = findLanguage(sourceLanguage);
          const toLang = findLanguage(targetLanguage);
          store.update('user', u => ({
            ...u,
            stats: { ...u.stats, translationsCount: (u.stats.translationsCount || 0) + 1 }
          }));
          store.update('translation', t => {
            const entry = {
              id: 'tr_' + Date.now(),
              source: sourceText.trim(),
              target: offlineResult.translatedText,
              sourceLang: sourceLanguage,
              targetLang: targetLanguage,
              fromFlag: fromLang?.flag || '🌐',
              toFlag: toLang?.flag || '🌐',
              date: new Date().toISOString(),
              favorite: false,
              offline: true
            };
            const prev = (t.history || []).filter(h =>
              !(h.source === entry.source && h.targetLang === entry.targetLang)
            );
            return { ...t, history: [entry, ...prev].slice(0, 100) };
          });
          rerender();
          if (speech.ttsSupported) {
            setTimeout(() => speech.speak(offlineResult.translatedText, targetLanguage), 200);
          }
          // Subtle info toast (not an error)
          if (window.__KIVU__?.toast) {
            window.__KIVU__.toast('Traduction depuis le dictionnaire local', { type: 'info', duration: 1800 });
          }
          return;
        }
        // No dictionary match either
        isTranslating = false;
        lastError = 'Mode hors-ligne · ce mot n\'est pas dans le dictionnaire local';
        rerender();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(lastError, { type: 'warning', duration: 2400 });
        }
        return;
      }
      // Real backend error (HTTP error, not network)
      isTranslating = false;
      lastError = err instanceof ApiError
        ? `Backend : ${err.message}`
        : `Erreur : ${err?.message || err}`;
      rerender();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(lastError, { type: 'error' });
      }
    }
  }

  // ── Camera mode ──────────────────────────────────────────────
  document.querySelectorAll('[data-action="camera-capture"]').forEach(el =>
    el.addEventListener('click', async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('OCR en cours…', { type: 'info', duration: 2000 });
        }
        await new Promise(r => setTimeout(r, 1500));
        sourceText = 'Texte capturé par la caméra (démonstration OCR)';
        translation = {
          translatedText: 'Camera-captured text — OCR demonstration mode',
          confidence: 0.78,
          offline: true,
          durationMs: 312
        };
        currentMode = 'text';
        rerender();
      };
      input.click();
    })
  );

  // ── Conversation mode ─────────────────────────────────────────
  function handleConvSpeak(side) {
    if (isRecording) { stopListening?.(); isRecording = false; convTurn = side; rerender(); return; }
    convTurn = side;
    isRecording = true;
    rerender();
    const { sourceLanguage, targetLanguage } = store.get('translation');
    const lang      = side === 'user'    ? sourceLanguage : targetLanguage;
    const otherLang = side === 'user'    ? targetLanguage : sourceLanguage;

    stopListening = speech.startListening(lang, {
      onResult: ({ text, isFinal }) => {
        if (isFinal && text.trim()) {
          isRecording = false;
          stopListening = null;
          convMessages.push({ side, text: text.trim(), translation: null });
          rerender();
          api.translate(text.trim(), lang, otherLang).then(res => {
            if (convMessages.length > 0) {
              convMessages[convMessages.length - 1].translation = res.translatedText;
            }
            if (speech.ttsSupported) speech.speak(res.translatedText, otherLang);
            rerender();
            const cs = document.getElementById('conv-stream');
            if (cs) cs.scrollTop = cs.scrollHeight;
          }).catch(() => {
            if (convMessages.length > 0) {
              convMessages[convMessages.length - 1].translation = '[traduction indisponible]';
            }
            rerender();
          });
        }
      },
      onError: () => { isRecording = false; stopListening = null; rerender(); },
      onEnd:   () => { if (isRecording) { isRecording = false; rerender(); } }
    });
  }

  document.querySelectorAll('[data-action="conv-speak-user"]').forEach(el =>
    el.addEventListener('click', () => handleConvSpeak('user'))
  );
  document.querySelectorAll('[data-action="conv-speak-partner"]').forEach(el =>
    el.addEventListener('click', () => handleConvSpeak('partner'))
  );

  const convStreamEl = document.getElementById('conv-stream');
  if (convStreamEl) convStreamEl.scrollTop = convStreamEl.scrollHeight;
};

function copyToClipboard(text, successMsg) {
  if (!text) return;
  navigator.clipboard?.writeText(text).then(() => {
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast(successMsg, { type: 'success', duration: 1400 });
    }
  });
}

function humanizeSttError(err) {
  const code = typeof err === 'string' ? err : err?.message || err?.error || 'unknown';
  if (code === 'not-allowed' || code === 'service-not-allowed')
    return 'Microphone refusé. Autorisez l’accès dans les permissions du navigateur.';
  if (code === 'no-speech') return 'Aucune voix détectée. Réessayez en parlant plus fort.';
  if (code === 'audio-capture') return 'Microphone introuvable.';
  if (code === 'network') return 'Erreur réseau pendant la reconnaissance.';
  return `Erreur reconnaissance : ${code}`;
}
