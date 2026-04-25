import { store } from '../store.js';
import { findLanguage } from '../data/languages.js';
import { icons } from '../components/icons.js';
import { api, ApiError } from '../services/api.js';
import { speech } from '../services/speech.js';

let isRecording = false;
let isTranslating = false;
let currentMode = 'voice';

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

    <!-- Source card -->
    <div class="card translate-card translate-card--source mb-md">
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
               : (sourceText ? escapeHtml(sourceText) : 'Parlez ou écrivez ici…')}
           </div>`}
    </div>

    ${currentMode === 'voice' ? renderMicButton(sttOk) : renderTextActions()}

    <!-- Target card -->
    <div class="card translate-card translate-card--target mb-md">
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
          <strong>Reconnaissance vocale indisponible.</strong> Votre navigateur ne supporte
          pas SpeechRecognition. Utilisez Chrome ou Edge, ou le mode <em>Texte</em>.
        </div>
      </div>
    ` : ''}

    <!-- Recent translations -->
    <h2 class="font-display font-bold text-lg mb-sm">Traductions récentes</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${HISTORY.map(h => renderHistoryItem(h)).join('')}
    </div>
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

function renderHistoryItem(h) {
  return `
    <div class="card history-item">
      <div class="flex items-center gap-xs mb-xs">
        <span class="lang-flag-sm">${h.fromFlag}</span>
        <span class="text-tertiary">${icons.arrowRight(14)}</span>
        <span class="lang-flag-sm">${h.toFlag}</span>
        <span style="margin-left:auto" class="text-xs text-muted">${h.time}</span>
      </div>
      <div class="text-sm text-muted">${escapeHtml(h.source)}</div>
      <div class="font-semibold">${escapeHtml(h.target)}</div>
    </div>
  `;
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
      rerender();
      // Auto-speak the translation
      if (speech.ttsSupported) {
        setTimeout(() => speech.speak(result.translatedText, targetLanguage), 200);
      }
    } catch (err) {
      isTranslating = false;
      lastError = err instanceof ApiError
        ? `Backend : ${err.message}`
        : 'Backend hors-ligne — vérifiez le serveur Flask.';
      rerender();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(lastError, { type: 'error' });
      }
    }
  }
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
