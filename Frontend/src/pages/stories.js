/**
 * KIVU — Stories enrichies.
 *
 * - Hero "Continuer" si une histoire commencée et pas finie
 * - Recommandation personnalisée selon ta langue cible
 * - Filtres : Tout · par catégorie · par langue
 * - Recherche live (titre, description, langue)
 * - Cartes avec badge "Terminé", durée, XP, langue
 * - Section "Toi & la communauté" : stats agrégées
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { fx } from '../services/audio-fx.js';
import { STORIES } from '../data/stories.js';
import { t } from '../i18n/index.js';

const LANG_NAMES = {
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
  hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo', lin: 'Lingala'
};
const LANG_FLAGS = {
  swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', dyu: '🇨🇮',
  hau: '🇳🇬', yor: '🇳🇬', zul: '🇿🇦', ibo: '🇳🇬', lin: '🇨🇩'
};

let activeCategory = 'all';
let activeLang = 'all';
let query = '';

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function escapeAttr(s) { return escapeHtml(s); }

function getCategories() {
  const set = new Map();
  STORIES.forEach(s => {
    const k = s.unit || 'Autres';
    set.set(k, (set.get(k) || 0) + 1);
  });
  return [...set.entries()].map(([id, count]) => ({ id, count }));
}

function getLanguagesUsed() {
  const set = new Map();
  STORIES.forEach(s => {
    const k = s.language;
    set.set(k, (set.get(k) || 0) + 1);
  });
  return [...set.entries()].map(([id, count]) => ({ id, count }));
}

function filterStories() {
  let list = [...STORIES];
  if (activeCategory !== 'all') list = list.filter(s => s.unit === activeCategory);
  if (activeLang !== 'all')     list = list.filter(s => s.language === activeLang);
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(s =>
      (s.title || '').toLowerCase().includes(q) ||
      (s.description || '').toLowerCase().includes(q) ||
      (s.unit || '').toLowerCase().includes(q) ||
      (LANG_NAMES[s.language] || '').toLowerCase().includes(q)
    );
  }
  return list;
}

function getRecommended(user, completedIds) {
  // Recommend stories in user's target language that aren't completed
  const targetLang = user.preferredLanguage || store.get('lessons')?.targetLang || 'swa';
  const candidates = STORIES.filter(s => !completedIds.includes(s.id));
  // 1. Match target language
  const matchLang = candidates.filter(s => s.language === targetLang);
  if (matchLang.length) return matchLang[0];
  // 2. Match learning languages
  const learningLangs = user.learningLanguages || [];
  const matchLearning = candidates.filter(s => learningLangs.includes(s.language));
  if (matchLearning.length) return matchLearning[0];
  // 3. Any non-completed
  return candidates[0] || null;
}

export function renderStories() {
  const user = store.get('user') || {};
  const completed = (store.get('stories') || {}).completed || [];
  const filtered = filterStories();
  const recommended = getRecommended(user, completed);

  const categories = getCategories();
  const languages = getLanguagesUsed();

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">${t('stories.title') || 'Histoires'}</div>
        <div class="screen-subtitle">Apprends en t'immergeant dans la culture africaine</div>
      </div>
    </div>

    <!-- Stats banner -->
    <div class="stories-stats mb-md">
      <div class="stories-stat">
        <div class="stories-stat__value">${STORIES.length}</div>
        <div class="stories-stat__label">Histoires</div>
      </div>
      <div class="stories-stat stories-stat--accent">
        <div class="stories-stat__value">${completed.length}</div>
        <div class="stories-stat__label">Terminées</div>
      </div>
      <div class="stories-stat">
        <div class="stories-stat__value">${categories.length}</div>
        <div class="stories-stat__label">Catégories</div>
      </div>
      <div class="stories-stat">
        <div class="stories-stat__value">${languages.length}</div>
        <div class="stories-stat__label">Langues</div>
      </div>
    </div>

    <!-- Recommended for you -->
    ${recommended ? `
      <div class="stories-reco card mb-md" style="--reco-grad: ${recommended.coverGradient};">
        <div class="stories-reco__bg">${recommended.cover}</div>
        <div class="stories-reco__inner">
          <div class="stories-reco__chip">✨ Recommandé pour toi</div>
          <h2 class="font-display font-bold text-xl mb-xs" style="color:white;">${escapeHtml(recommended.title)}</h2>
          <p class="text-sm" style="color:rgba(255,255,255,0.92); margin-bottom: 10px;">${escapeHtml(recommended.description || '')}</p>
          <div class="flex gap-xs flex-wrap mb-md">
            <span class="chip chip-white">${recommended.flag} ${LANG_NAMES[recommended.language] || recommended.language}</span>
            <span class="chip chip-white">${recommended.duration}</span>
            <span class="chip chip-white">+${recommended.xp} XP</span>
          </div>
          <button class="btn btn-white" data-action="open-story" data-id="${recommended.id}">
            ▶ Commencer
          </button>
        </div>
      </div>
    ` : `
      <!-- Mascot greeting if all completed -->
      <div class="card mascot-greeting mb-md">
        <div class="mascot-greeting__avatar">${mascot.cheering(80)}</div>
        <div class="mascot-greeting__body">
          <div class="font-bold">Tu as fini toutes les histoires !</div>
          <div class="text-xs text-muted">Reviens bientôt pour de nouveaux contes.</div>
        </div>
      </div>
    `}

    <!-- Search bar -->
    <div class="card mb-md dict-search">
      <span class="dict-search__icon">${icons.search(18)}</span>
      <input id="stories-search-input"
             class="dict-search__input"
             placeholder="Cherche un titre, une langue, une catégorie…"
             value="${escapeAttr(query)}"
             autocomplete="off"
             spellcheck="false"/>
      ${query ? `<button class="dict-search__clear" data-action="stories-clear-search" aria-label="Effacer">${icons.close(16)}</button>` : ''}
    </div>

    <!-- Filters: categories -->
    <div class="text-xs text-muted mb-xs" style="padding:0 4px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase;">Catégories</div>
    <div class="scroll-x mb-sm">
      <div class="scroll-x-row tabs-row">
        <button class="pill-tab ${activeCategory === 'all' ? 'active' : ''}" data-action="stories-cat" data-cat="all">
          📚 Toutes · ${STORIES.length}
        </button>
        ${categories.map(c => `
          <button class="pill-tab ${activeCategory === c.id ? 'active' : ''}" data-action="stories-cat" data-cat="${escapeAttr(c.id)}">
            ${categoryEmoji(c.id)} ${escapeHtml(c.id)} · ${c.count}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Filters: languages -->
    <div class="text-xs text-muted mb-xs" style="padding:0 4px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase;">Langues</div>
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        <button class="pill-tab ${activeLang === 'all' ? 'active' : ''}" data-action="stories-lang" data-lang="all">
          🌍 Toutes
        </button>
        ${languages.map(l => `
          <button class="pill-tab ${activeLang === l.id ? 'active' : ''}" data-action="stories-lang" data-lang="${l.id}">
            ${LANG_FLAGS[l.id] || '🌍'} ${LANG_NAMES[l.id] || l.id} · ${l.count}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Result count -->
    ${(query || activeCategory !== 'all' || activeLang !== 'all') ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
        ${filtered.length} ${filtered.length > 1 ? 'histoires' : 'histoire'}
      </div>
    ` : ''}

    <!-- Grid of stories -->
    ${filtered.length === 0 ? `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">📖</div>
        <div class="empty-state__title">Aucune histoire trouvée</div>
        <div class="text-sm text-muted">Essaie un autre filtre ou une autre recherche.</div>
      </div>
    ` : `
      <div class="grid grid-2 mb-lg story-grid">
        ${filtered.map(s => renderStoryCard(s, completed.includes(s.id), recommended?.id === s.id)).join('')}
      </div>
    `}
  `;
}

function categoryEmoji(cat) {
  const map = {
    'Contes ancestraux': '🦁',
    'Vie quotidienne':   '🛒',
    'Famille & émotions': '👨‍👩‍👧',
    'Urgences & santé':  '🏥',
    'Voyage & culture':  '✈️',
    'Sagesse & spiritualité': '🌟'
  };
  return map[cat] || '📖';
}

function renderStoryCard(s, isDone, isRecommended) {
  return `
    <button class="story-card ${isDone ? 'is-done' : ''}"
            data-action="open-story" data-id="${s.id}"
            style="--story-bg: ${s.coverGradient};">
      <div class="story-cover">
        <span class="story-emoji">${s.cover}</span>
        ${isDone ? '<span class="story-done-badge">✓</span>' : ''}
        ${isRecommended && !isDone ? '<span class="story-reco-badge">✨</span>' : ''}
      </div>
      <div class="story-meta">
        <div class="story-title font-bold">${escapeHtml(s.title)}</div>
        <div class="text-xs text-muted">${escapeHtml(s.unit || '')}</div>
        <div class="story-tags">
          <span class="lang-flag-sm">${s.flag}</span>
          <span class="text-xs text-muted">${s.duration}</span>
          <span class="chip chip-accent">+${s.xp} XP</span>
        </div>
      </div>
    </button>
  `;
}

renderStories.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = (preserveFocus = false) => {
    const focusedId = preserveFocus ? document.activeElement?.id : null;
    main.innerHTML = renderStories();
    renderStories.mount();
    if (focusedId) {
      const el = document.getElementById(focusedId);
      if (el) {
        el.focus();
        if (el.value) el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };

  document.querySelectorAll('[data-action="open-story"]').forEach(btn =>
    btn.addEventListener('click', () => {
      fx.click();
      navigate(`/story/${btn.dataset.id}`);
    })
  );

  document.querySelectorAll('[data-action="stories-cat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="stories-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeLang = btn.dataset.lang;
      fx.click();
      rerender();
    })
  );

  const searchInput = document.getElementById('stories-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value;
      rerender(true);
    });
  }

  document.querySelectorAll('[data-action="stories-clear-search"]').forEach(btn =>
    btn.addEventListener('click', () => {
      query = '';
      rerender();
    })
  );
};
