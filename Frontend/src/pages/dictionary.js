/**
 * KIVU — Dictionnaire visuel.
 *
 * Recherche multilingue + filtre par catégorie + audio TTS au clic sur un mot.
 * Détail d'une entrée : grand emoji, mot FR, traductions dans 8 langues
 * africaines + EN, chaque ligne avec bouton écoute individuel.
 */

import { CATEGORIES, ENTRIES, searchEntries } from '../data/dictionary.js';
import { LANG_LABELS } from '../data/flashcards.js';
import { icons } from '../components/icons.js';
import { speech } from '../services/speech.js';
import { mascot } from '../components/mascot.js';

const LANG_ORDER = ['swa', 'wol', 'bam', 'hau', 'yor', 'zul', 'ibo', 'en'];
const LANG_FLAGS = {
  swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', hau: '🇳🇬',
  yor: '🇳🇬', zul: '🇿🇦', ibo: '🇳🇬', en: '🇬🇧'
};
const LANG_NAMES = {
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', hau: 'Haoussa',
  yor: 'Yoruba',  zul: 'Zulu',  ibo: 'Igbo',    en: 'Anglais'
};

let query = '';
let activeCat = 'all';
let detail = null;          // entry being shown in detail panel

export function renderDictionary() {
  const results = searchEntries(query, activeCat);
  const showingDetail = !!detail;

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Dictionnaire</div>
        <div class="screen-subtitle">${ENTRIES.length} mots · 8 langues · audio inclus</div>
      </div>
    </div>

    <!-- Search bar -->
    <div class="card mb-md dict-search">
      <span class="dict-search__icon">${icons.search(20)}</span>
      <input id="dict-search-input"
             class="dict-search__input"
             placeholder="Cherchez un mot, en français ou dans une langue africaine…"
             value="${escapeAttr(query)}"
             autocomplete="off"
             autofocus/>
      ${query ? `<button class="dict-search__clear" data-action="dict-clear" aria-label="Effacer">${icons.close(18)}</button>` : ''}
    </div>

    <!-- Category pills -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        ${CATEGORIES.map(c => `
          <button class="pill-tab ${activeCat === c.id ? 'active' : ''}"
                  data-action="dict-cat" data-cat="${c.id}"
                  style="${activeCat === c.id ? `background:${c.color}; color:white;` : ''}">
            <span style="display:inline-flex;gap:6px;align-items:center;">
              ${c.emoji} ${c.label}
            </span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Results count + Kivi tip -->
    ${query || activeCat !== 'all' ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
        ${results.length} ${results.length > 1 ? 'résultats' : 'résultat'}
      </div>
    ` : ''}

    <!-- Grid of entries -->
    ${results.length === 0 ? `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">🔎</div>
        <div class="empty-state__title">Aucun mot trouvé</div>
        <div class="text-sm">Essayez un autre mot, ou changez de catégorie.</div>
      </div>
    ` : `
      <div class="grid grid-3 mb-lg dict-grid">
        ${results.map(e => renderTile(e)).join('')}
      </div>
    `}

    ${showingDetail ? renderDetailModal() : ''}
  `;
}

function renderTile(e) {
  return `
    <button class="dict-tile" data-action="dict-detail" data-id="${escapeAttr(e.fr)}">
      <div class="dict-tile__emoji" aria-hidden="true">${e.emoji}</div>
      <div class="dict-tile__fr">${escapeHtml(e.fr)}</div>
      <div class="dict-tile__hint text-xs text-muted">${e.swa}</div>
    </button>
  `;
}

function renderDetailModal() {
  const e = detail;
  return `
    <div class="dict-modal-backdrop" data-action="dict-close">
      <div class="dict-modal" role="dialog" aria-label="${e.fr}" onclick="event.stopPropagation()">
        <button class="dict-modal__close" data-action="dict-close" aria-label="Fermer">
          ${icons.close(20)}
        </button>

        <div class="dict-modal__hero">
          <div class="dict-modal__emoji">${e.emoji}</div>
          <div class="font-display font-bold" style="font-size:32px;">${escapeHtml(e.fr)}</div>
          <div class="text-sm text-muted">Catégorie : ${categoryLabel(e.category)}</div>
        </div>

        <div class="dict-translations">
          ${LANG_ORDER.filter(l => e[l]).map(l => `
            <div class="dict-trans-row">
              <span class="dict-trans-flag">${LANG_FLAGS[l]}</span>
              <div class="dict-trans-body">
                <div class="text-xs text-muted">${LANG_NAMES[l]}</div>
                <div class="font-bold">${escapeHtml(e[l])}</div>
              </div>
              <button class="icon-btn icon-btn--sm" data-action="dict-speak"
                      data-text="${escapeAttr(e[l])}" data-lang="${l}"
                      aria-label="Écouter">
                ${icons.speaker(18)}
              </button>
            </div>
          `).join('')}
        </div>

        <div class="dict-modal__foot">
          <button class="btn btn-primary btn-full" data-action="dict-close">Fermer</button>
        </div>
      </div>
    </div>
  `;
}

function categoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

renderDictionary.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = (preserveFocus = false) => {
    const focusedId = preserveFocus ? document.activeElement?.id : null;
    main.innerHTML = renderDictionary();
    renderDictionary.mount();
    if (focusedId) {
      const el = document.getElementById(focusedId);
      if (el) {
        el.focus();
        if (el.value) el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };

  // Search input
  const input = document.getElementById('dict-search-input');
  if (input) {
    input.addEventListener('input', () => {
      query = input.value;
      rerender(true);
    });
  }

  document.querySelectorAll('[data-action="dict-clear"]').forEach(btn =>
    btn.addEventListener('click', () => {
      query = '';
      rerender();
    })
  );

  // Category filter
  document.querySelectorAll('[data-action="dict-cat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      rerender();
    })
  );

  // Tile detail
  document.querySelectorAll('[data-action="dict-detail"]').forEach(btn =>
    btn.addEventListener('click', () => {
      detail = ENTRIES.find(e => e.fr === btn.dataset.id);
      rerender();
      // Auto-speak French + first non-empty target
      if (speech.ttsSupported && detail) {
        setTimeout(() => speech.speak(detail.fr, 'fra', { rate: 0.95 }), 200);
      }
    })
  );

  // Detail modal — close
  document.querySelectorAll('[data-action="dict-close"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      detail = null;
      rerender();
    })
  );

  // Speak individual translation
  document.querySelectorAll('[data-action="dict-speak"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const text = btn.dataset.text;
      const lang = btn.dataset.lang;
      if (text && speech.ttsSupported) speech.speak(text, lang === 'en' ? 'eng' : lang, { rate: 0.92 });
    })
  );

  // Close modal on Escape
  if (detail) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        detail = null;
        document.removeEventListener('keydown', onEsc);
        rerender();
      }
    };
    document.addEventListener('keydown', onEsc);
  }
};
