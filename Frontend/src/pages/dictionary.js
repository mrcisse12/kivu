/**
 * KIVU — Dictionnaire premium
 *
 * Onglets : Tous · Récents · ⭐ Favoris · Catégories
 * Recherche live (debounced) avec mise en surbrillance des correspondances.
 * Favoris persistés dans store.dictionary.favorites.
 * Récents auto-trackés à chaque ouverture (max 24, plus récent en premier).
 * Modal détail avec mot vedette, traductions audio, exemple, mots liés.
 */

import { CATEGORIES, ENTRIES, searchEntries, getEntry, relatedEntries, countByCategory } from '../data/dictionary.js';
import { icons } from '../components/icons.js';
import { speech } from '../services/speech.js';
import { fx } from '../services/audio-fx.js';
import { confirmModal } from '../services/dialog.js';
import { voiceLibrary } from '../services/voice-library.js';
import { navigate } from '../router.js';
import { store } from '../store.js';

// Cache of "has-human-voice" lookups so we don't hit IndexedDB each render
const humanVoiceCache = new Map(); // key: "lang:text" → boolean
function isHuman(lang, text) {
  const k = (lang || '') + ':' + (text || '').toLowerCase();
  return humanVoiceCache.get(k) === true;
}
async function refreshHumanVoiceCache(entry) {
  if (!entry) return;
  const langs = ['swa', 'wol', 'bam', 'hau', 'yor', 'zul', 'ibo', 'lin'];
  for (const lang of langs) {
    const text = entry[lang];
    if (!text) continue;
    const k = lang + ':' + text.toLowerCase();
    if (humanVoiceCache.has(k)) continue;
    const has = await voiceLibrary.has(lang, text).catch(() => false);
    humanVoiceCache.set(k, has);
  }
}

const LANG_ORDER = ['swa', 'wol', 'bam', 'hau', 'yor', 'zul', 'ibo', 'en'];
const LANG_FLAGS = {
  swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', hau: '🇳🇬',
  yor: '🇳🇬', zul: '🇿🇦', ibo: '🇳🇬', en: '🇬🇧'
};
const LANG_NAMES = {
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', hau: 'Haoussa',
  yor: 'Yoruba',  zul: 'Zulu',  ibo: 'Igbo',    en: 'Anglais'
};
const LANG_TTS = {
  swa: 'swa', wol: 'wol', bam: 'bam', hau: 'hau',
  yor: 'yor', zul: 'zul', ibo: 'ibo', en: 'eng'
};

let query = '';
let activeCat = 'all';
let activeTab = 'all';     // 'all' | 'recent' | 'favorites' | 'categories'
let detail = null;          // entry being shown in detail modal

/* ─── Favorites + recents helpers (persisted) ───────────── */

function getFavorites() {
  return new Set(store.get('dictionary')?.favorites || []);
}
function isFavorite(id) {
  return getFavorites().has(id);
}
function toggleFavorite(id) {
  const set = getFavorites();
  if (set.has(id)) set.delete(id); else set.add(id);
  store.update('dictionary', d => ({ ...(d || {}), favorites: [...set] }));
  return set.has(id);
}
function getRecents() {
  return store.get('dictionary')?.recent || [];
}
function pushRecent(id) {
  const cur = getRecents().filter(x => x !== id);
  const next = [id, ...cur].slice(0, 24);
  store.update('dictionary', d => ({ ...(d || {}), recent: next }));
}

/* ─── Render helpers ────────────────────────────────────── */

function highlightMatch(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  const safeQ = escapeHtml(q);
  // Case-insensitive accent-insensitive highlight (best-effort)
  const folded = safe.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const fq = safeQ.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const idx = folded.indexOf(fq);
  if (idx < 0) return safe;
  return `${safe.slice(0, idx)}<mark class="dict-hl">${safe.slice(idx, idx + q.length)}</mark>${safe.slice(idx + q.length)}`;
}

export function renderDictionary() {
  const showingDetail = !!detail;

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Dictionnaire</div>
        <div class="screen-subtitle">${ENTRIES.length} mots · 8 langues · audio inclus</div>
      </div>
    </div>

    ${renderStatsBanner()}

    <!-- Search bar -->
    <div class="card mb-md dict-search">
      <span class="dict-search__icon">${icons.search(20)}</span>
      <input id="dict-search-input"
             class="dict-search__input"
             placeholder="Cherchez un mot, en français ou dans une langue africaine…"
             value="${escapeAttr(query)}"
             autocomplete="off"
             autocapitalize="off"
             spellcheck="false"/>
      ${query ? `<button class="dict-search__clear" data-action="dict-clear" aria-label="Effacer">${icons.close(18)}</button>` : ''}
    </div>

    <!-- Tabs -->
    <div class="dict-tabs mb-md">
      ${renderTab('all',        'Tous',     '🌍', ENTRIES.length)}
      ${renderTab('recent',     'Récents',  '🕒', getRecents().length)}
      ${renderTab('favorites',  'Favoris',  '⭐', getFavorites().size)}
      ${renderTab('categories', 'Catégories', '📚', CATEGORIES.length - 1)}
    </div>

    ${renderActiveTab()}

    ${showingDetail ? renderDetailModal() : ''}
  `;
}

function renderTab(id, label, emoji, count) {
  const active = activeTab === id;
  return `
    <button class="dict-tab ${active ? 'is-active' : ''}" data-action="dict-tab" data-tab="${id}">
      <span class="dict-tab__emoji" aria-hidden="true">${emoji}</span>
      <span class="dict-tab__label">${label}</span>
      <span class="dict-tab__count">${count}</span>
    </button>
  `;
}

function renderStatsBanner() {
  const favCount = getFavorites().size;
  const recCount = getRecents().length;
  return `
    <div class="dict-stats mb-md">
      <div class="dict-stat">
        <div class="dict-stat__value">${ENTRIES.length}</div>
        <div class="dict-stat__label">Mots</div>
      </div>
      <div class="dict-stat">
        <div class="dict-stat__value">8</div>
        <div class="dict-stat__label">Langues</div>
      </div>
      <div class="dict-stat dict-stat--accent">
        <div class="dict-stat__value">${favCount}</div>
        <div class="dict-stat__label">Favoris</div>
      </div>
      <div class="dict-stat">
        <div class="dict-stat__value">${recCount}</div>
        <div class="dict-stat__label">Vus</div>
      </div>
    </div>
  `;
}

function renderActiveTab() {
  // Search overrides tab — always show full results when query has text
  if (query.trim().length > 0) {
    const results = searchEntries(query, 'all');
    return renderResults(results, 'search');
  }
  if (activeTab === 'categories') return renderCategoriesGrid();
  if (activeTab === 'favorites')  return renderFavorites();
  if (activeTab === 'recent')     return renderRecents();
  return renderResults(searchEntries('', activeCat), 'all');
}

function renderResults(results, source = 'all') {
  // Show category pills only on 'all' tab without search
  const showPills = source === 'all' && !query;
  return `
    ${showPills ? `
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
    ` : ''}

    ${(query || (source === 'all' && activeCat !== 'all')) ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
        ${results.length} ${results.length > 1 ? 'résultats' : 'résultat'}${query ? ` pour « ${escapeHtml(query)} »` : ''}
      </div>
    ` : ''}

    ${results.length === 0 ? renderEmptyState('search') : `
      <div class="grid grid-3 mb-lg dict-grid">
        ${results.map(e => renderTile(e)).join('')}
      </div>
    `}
  `;
}

function renderRecents() {
  const ids = getRecents();
  const items = ids.map(getEntry).filter(Boolean);
  if (!items.length) return renderEmptyState('recent');
  return `
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
      ${items.length} mot${items.length > 1 ? 's' : ''} consulté${items.length > 1 ? 's' : ''} récemment
    </div>
    <div class="grid grid-3 mb-lg dict-grid">
      ${items.map(e => renderTile(e)).join('')}
    </div>
    ${items.length ? `
      <button class="btn btn-ghost btn-sm" data-action="dict-clear-recents"
              style="display:block; margin: 0 auto var(--space-lg);">
        Effacer l'historique
      </button>
    ` : ''}
  `;
}

function renderFavorites() {
  const favs = [...getFavorites()];
  const items = favs.map(getEntry).filter(Boolean);
  if (!items.length) return renderEmptyState('favorites');
  return `
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
      ${items.length} favori${items.length > 1 ? 's' : ''}
    </div>
    <div class="grid grid-3 mb-lg dict-grid">
      ${items.map(e => renderTile(e)).join('')}
    </div>
  `;
}

function renderCategoriesGrid() {
  const counts = countByCategory();
  const cats = CATEGORIES.filter(c => c.id !== 'all');
  return `
    <div class="grid grid-2 mb-lg dict-cat-grid">
      ${cats.map(c => `
        <button class="dict-cat-card" data-action="dict-cat-jump" data-cat="${c.id}"
                style="--cat-color: ${c.color};">
          <div class="dict-cat-card__emoji" aria-hidden="true">${c.emoji}</div>
          <div class="dict-cat-card__label">${c.label}</div>
          <div class="dict-cat-card__count">${counts[c.id] || 0} mots</div>
        </button>
      `).join('')}
    </div>
  `;
}

function renderTile(e) {
  const fav = isFavorite(e.id);
  const cat = CATEGORIES.find(c => c.id === e.category);
  return `
    <div class="dict-tile-wrap">
      <button class="dict-tile" data-action="dict-detail" data-id="${e.id}">
        <div class="dict-tile__emoji" aria-hidden="true">${e.emoji}</div>
        <div class="dict-tile__fr">${highlightMatch(e.fr, query)}</div>
        <div class="dict-tile__hint text-xs text-muted">${highlightMatch(e.swa, query)}</div>
        ${cat ? `<span class="dict-tile__cat-dot" style="background:${cat.color};" title="${cat.label}"></span>` : ''}
      </button>
      <button class="dict-tile__fav ${fav ? 'is-fav' : ''}"
              data-action="dict-fav" data-id="${e.id}"
              aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
              title="${fav ? 'Favori' : 'Ajouter aux favoris'}">
        ${fav ? icons.starFilled(16, '#FF9600') : icons.star(16)}
      </button>
    </div>
  `;
}

function renderEmptyState(kind) {
  const states = {
    search: {
      emoji: '🔎',
      title: 'Aucun mot trouvé',
      hint: 'Essayez un autre mot, ou changez de catégorie.'
    },
    recent: {
      emoji: '🕒',
      title: 'Aucun mot consulté pour l\'instant',
      hint: 'Ouvrez un mot pour le voir apparaître ici.'
    },
    favorites: {
      emoji: '⭐',
      title: 'Vous n\'avez pas encore de favoris',
      hint: 'Touchez l\'étoile sur un mot pour le sauvegarder.'
    }
  };
  const s = states[kind] || states.search;
  return `
    <div class="empty-state mb-lg">
      <div class="empty-state__emoji">${s.emoji}</div>
      <div class="empty-state__title">${s.title}</div>
      <div class="text-sm text-muted">${s.hint}</div>
    </div>
  `;
}

function renderDetailModal() {
  const e = detail;
  const fav = isFavorite(e.id);
  const cat = CATEGORIES.find(c => c.id === e.category);
  const related = relatedEntries(e.id, 6);

  return `
    <div class="dict-modal-backdrop">
      <div class="dict-modal" role="dialog" aria-label="${escapeAttr(e.fr)}">
        <button class="dict-modal__close" data-action="dict-close" aria-label="Fermer">
          ${icons.close(20)}
        </button>

        <div class="dict-modal__hero" style="background: linear-gradient(135deg, ${cat?.color || '#174E9C'}1A, ${cat?.color || '#174E9C'}05);">
          <div class="dict-modal__emoji">${e.emoji}</div>
          <div class="font-display font-bold dict-modal__fr">${escapeHtml(e.fr)}</div>
          ${cat ? `
            <div class="dict-modal__cat-chip" style="background:${cat.color}15; color:${cat.color};">
              ${cat.emoji} ${cat.label}
            </div>
          ` : ''}
          <div class="dict-modal__actions">
            <button class="dict-action-btn" data-action="dict-speak"
                    data-text="${escapeAttr(e.fr)}" data-lang="fra"
                    aria-label="Écouter en français">
              ${icons.speaker(18)}
              <span>Écouter</span>
            </button>
            <button class="dict-action-btn ${fav ? 'is-fav' : ''}"
                    data-action="dict-fav-toggle" data-id="${e.id}"
                    aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
              ${fav ? icons.starFilled(18, '#FF9600') : icons.star(18)}
              <span>${fav ? 'Favori' : 'Favori'}</span>
            </button>
            <button class="dict-action-btn" data-action="dict-copy"
                    data-text="${escapeAttr(buildCopyText(e))}"
                    aria-label="Copier toutes les traductions">
              ${icons.copy(18)}
              <span>Copier</span>
            </button>
          </div>
        </div>

        ${e.example ? `
          <div class="dict-section">
            <div class="dict-section__title">Exemple</div>
            <div class="dict-example">
              <div class="dict-example__fr">« ${escapeHtml(e.example.fr)} »</div>
              ${e.example.en ? `<div class="dict-example__en text-xs text-muted">${escapeHtml(e.example.en)}</div>` : ''}
            </div>
          </div>
        ` : ''}

        <div class="dict-section">
          <div class="dict-section__title">Traductions</div>
          <div class="dict-translations">
            ${LANG_ORDER.filter(l => e[l]).map(l => {
              const hasHuman = isHuman(l, e[l]);
              return `
              <div class="dict-trans-row">
                <span class="dict-trans-flag">${LANG_FLAGS[l]}</span>
                <div class="dict-trans-body">
                  <div class="text-xs text-muted">${LANG_NAMES[l]}</div>
                  <div class="font-bold">${escapeHtml(e[l])}</div>
                </div>
                ${hasHuman ? '<span class="human-voice-pill" title="Voix humaine réelle disponible">🎙️ humaine</span>' : ''}
                <button class="icon-btn icon-btn--sm" data-action="dict-speak"
                        data-text="${escapeAttr(e[l])}" data-lang="${LANG_TTS[l]}"
                        aria-label="Écouter ${LANG_NAMES[l]}">
                  ${icons.speaker(18)}
                </button>
              </div>
            `;
            }).join('')}
          </div>
          <div class="text-xs text-muted mt-sm" style="text-align:center;">
            🎙️ <button class="link-btn" data-action="dict-record" style="font-weight:700;">Enregistrer une voix humaine</button>
          </div>
        </div>

        ${related.length ? `
          <div class="dict-section">
            <div class="dict-section__title">Mots liés · ${cat?.label || ''}</div>
            <div class="dict-related">
              ${related.map(r => `
                <button class="dict-related-chip" data-action="dict-detail" data-id="${r.id}">
                  <span aria-hidden="true">${r.emoji}</span>
                  <span>${escapeHtml(r.fr)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="dict-modal__foot">
          <button class="btn btn-primary btn-full" data-action="dict-close">Fermer</button>
        </div>
      </div>
    </div>
  `;
}

function buildCopyText(e) {
  const lines = [`${e.fr} ${e.emoji || ''}`];
  LANG_ORDER.filter(l => e[l]).forEach(l => {
    lines.push(`${LANG_FLAGS[l]} ${LANG_NAMES[l]} : ${e[l]}`);
  });
  return lines.join('\n');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

/* ─── Mount / interactions ──────────────────────────────── */

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

  // ── Search input (live) ───────────────────────────────
  const input = document.getElementById('dict-search-input');
  if (input) {
    input.addEventListener('input', () => {
      query = input.value;
      rerender(true);
    });
    // Pressing Escape clears search
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && query) {
        e.preventDefault();
        query = '';
        rerender();
      }
    });
  }

  // ── Clear search ──────────────────────────────────────
  document.querySelectorAll('[data-action="dict-clear"]').forEach(btn =>
    btn.addEventListener('click', () => {
      query = '';
      rerender();
    })
  );

  // ── Tabs ──────────────────────────────────────────────
  document.querySelectorAll('[data-action="dict-tab"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      query = '';
      rerender();
    })
  );

  // ── Category pill (within "all" tab) ───────────────────
  document.querySelectorAll('[data-action="dict-cat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      rerender();
    })
  );

  // ── Category card (in "categories" tab) ─ jump to "all" filtered ─
  document.querySelectorAll('[data-action="dict-cat-jump"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeCat = btn.dataset.cat;
      activeTab = 'all';
      rerender();
    })
  );

  // ── Toggle favorite from tile ─────────────────────────
  document.querySelectorAll('[data-action="dict-fav"]').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFav = toggleFavorite(btn.dataset.id);
      fx.click();
      if (isFav) {
        fx.coin();
        if (window.__KIVU__?.toast) window.__KIVU__.toast('⭐ Ajouté aux favoris', { type: 'success', duration: 1400 });
      }
      rerender();
    })
  );

  // ── Toggle favorite from detail modal ─────────────────
  document.querySelectorAll('[data-action="dict-fav-toggle"]').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isFav = toggleFavorite(btn.dataset.id);
      fx.click();
      if (isFav) {
        fx.coin();
        if (window.__KIVU__?.toast) window.__KIVU__.toast('⭐ Ajouté aux favoris', { type: 'success', duration: 1400 });
      }
      rerender();
    })
  );

  // ── Open detail ───────────────────────────────────────
  document.querySelectorAll('[data-action="dict-detail"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      detail = getEntry(id);
      if (detail) {
        pushRecent(id);
        // Refresh "human voice" cache for this entry's translations
        await refreshHumanVoiceCache(detail);
        rerender();
        // Auto-speak French (slowly)
        if (speech.ttsSupported) {
          setTimeout(() => speech.speak(detail.fr, 'fra', { rate: 0.95 }), 200);
        }
      }
    })
  );

  // ── Record voice button (jumps to /voices admin page) ──
  document.querySelectorAll('[data-action="dict-record"]').forEach(btn =>
    btn.addEventListener('click', () => {
      detail = null;
      navigate('/voices');
    })
  );

  // ── Close detail (X button + "Fermer" footer button) ──
  document.querySelectorAll('[data-action="dict-close"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      detail = null;
      rerender();
    })
  );
  // ── Backdrop click (close only when target IS the backdrop)
  document.querySelectorAll('.dict-modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target === bd) {
        detail = null;
        rerender();
      }
    });
  });

  // ── Speak individual translation ──────────────────────
  document.querySelectorAll('[data-action="dict-speak"]').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const text = btn.dataset.text;
      const lang = btn.dataset.lang;
      if (text && speech.ttsSupported) speech.speak(text, lang, { rate: 0.92 });
    })
  );

  // ── Copy translations to clipboard ────────────────────
  document.querySelectorAll('[data-action="dict-copy"]').forEach(btn =>
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(btn.dataset.text || '');
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Copié dans le presse-papier ✨', { type: 'success', duration: 1400 });
      } catch {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Impossible de copier', { type: 'error' });
      }
    })
  );

  // ── Clear recents ─────────────────────────────────────
  document.querySelectorAll('[data-action="dict-clear-recents"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const ok = await confirmModal({
        icon: '🕒',
        title: 'Effacer l\'historique ?',
        message: 'La liste des mots consultés sera vidée. Tes favoris ne seront pas affectés.',
        confirmLabel: 'Effacer',
        cancelLabel: 'Annuler'
      });
      if (!ok) return;
      store.update('dictionary', d => ({ ...(d || {}), recent: [] }));
      rerender();
    })
  );

  // ── Escape closes detail ──────────────────────────────
  if (detail) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        detail = null;
        document.removeEventListener('keydown', onEsc);
        const main2 = document.querySelector('main.screen');
        if (main2) {
          main2.innerHTML = renderDictionary();
          renderDictionary.mount();
        }
      }
    };
    document.addEventListener('keydown', onEsc);
  }
};
