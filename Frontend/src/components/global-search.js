/**
 * KIVU — Global Search (Cmd+K / Ctrl+K)
 *
 * Recherche fédérée à travers TOUT le contenu de l'app :
 *   - Dictionnaire (80+ mots)
 *   - Traductions sauvegardées
 *   - Marketplace (24 produits)
 *   - Stories (5+ histoires)
 *   - Amis
 *   - Pages / fonctionnalités KIVU
 *   - Méthodes de paiement
 *   - Événements culturels
 *
 * UX :
 *   - Touche Cmd+K (Mac) ou Ctrl+K (Windows/Linux) pour ouvrir
 *   - Touche / depuis le clavier
 *   - Bouton dans l'app (header)
 *   - Modal full-width responsive avec input autofocus
 *   - Résultats groupés par catégorie avec icônes
 *   - Navigation : flèches ↑↓, Enter pour valider, Échap pour fermer
 *   - Recherche live (debounced 100ms) avec score de pertinence
 *   - Action contextuelle au clic : navigation directe vers la bonne page
 */

import { navigate } from '../router.js';
import { fx } from '../services/audio-fx.js';
import { ENTRIES as DICT_ENTRIES } from '../data/dictionary.js';
import { PRODUCTS } from '../data/marketplace.js';
import { STORIES } from '../data/stories.js';
import { CULTURAL_EVENTS } from '../data/events.js';
import { PAYMENT_METHODS } from '../data/payment-methods.js';
import { store } from '../store.js';

let backdropEl = null;
let isOpen = false;
let query = '';
let activeIdx = 0;
let allResults = [];
let debounceTimer = null;

/* ─── Indexable pages ─────────────────────────────────────── */

const PAGES = [
  { id: 'home',         title: 'Accueil',                      desc: 'Tableau de bord, leçons, série',     emoji: '🏠', path: '/' },
  { id: 'translate',    title: 'Traduction',                   desc: 'Voix, texte, caméra, conversation', emoji: '🌐', path: '/translate' },
  { id: 'learn',        title: 'Apprendre',                    desc: 'Leçons, quiz, badges',              emoji: '🎓', path: '/learn' },
  { id: 'preserve',     title: 'Préserver',                    desc: 'Enregistrer mots & contes',         emoji: '🛡️', path: '/preserve' },
  { id: 'business',     title: 'Business',                     desc: 'Commerce africain',                 emoji: '💼', path: '/business' },
  { id: 'multiparty',   title: 'Multi-Party',                  desc: 'Réunions multilangues',             emoji: '🤝', path: '/multi-party' },
  { id: 'assistant',    title: 'Assistant IA Kivi',            desc: 'Tuteur conversationnel',            emoji: '✨', path: '/assistant' },
  { id: 'diaspora',     title: 'Diaspora',                     desc: 'Famille, appels vidéo',             emoji: '🌍', path: '/diaspora' },
  { id: 'accessibility',title: 'Accessibilité',                desc: 'Pour tous, partout',                emoji: '♿', path: '/accessibility' },
  { id: 'profile',      title: 'Mon profil',                   desc: 'Avatar, stats, badges',             emoji: '👤', path: '/profile' },
  { id: 'settings',     title: 'Paramètres',                   desc: 'Langue, thème, notifications',      emoji: '⚙️', path: '/settings' },
  { id: 'radio',        title: 'Radio Kivi',                   desc: 'Écoute passive en cible',           emoji: '📻', path: '/radio' },
  { id: 'stories',      title: 'Stories',                      desc: 'Contes & dialogues',                emoji: '📖', path: '/stories' },
  { id: 'dictionary',   title: 'Dictionnaire',                 desc: '80+ mots, 8 langues',               emoji: '📚', path: '/dictionary' },
  { id: 'friends',      title: 'Mes amis',                     desc: 'Code KIVU, encouragements',         emoji: '👥', path: '/friends' },
  { id: 'leaderboard',  title: 'Classement mondial',           desc: 'Jour, semaine, mois, all-time',     emoji: '🏆', path: '/leaderboard' },
  { id: 'stats',        title: 'Mes statistiques',             desc: 'Graphes, jalons, heatmap',          emoji: '📊', path: '/stats' },
  { id: 'voices',       title: 'Voix admin',                   desc: 'Bibliothèque audio humaine',        emoji: '🎙️', path: '/voices' },
  { id: 'marketplace',  title: 'Marketplace',                  desc: 'Produits artisanaux africains',     emoji: '🛍️', path: '/marketplace' },
  { id: 'orders',       title: 'Mes commandes',                desc: 'Suivi des achats',                  emoji: '📦', path: '/orders' },
];

/* ─── Helpers ─────────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function normalize(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Highlight matching part of text */
function highlight(text, q) {
  if (!q) return escapeHtml(text);
  const safe = escapeHtml(text);
  const norm = normalize(safe);
  const nq = normalize(q);
  const idx = norm.indexOf(nq);
  if (idx < 0) return safe;
  return `${safe.slice(0, idx)}<mark class="gs-hl">${safe.slice(idx, idx + q.length)}</mark>${safe.slice(idx + q.length)}`;
}

/**
 * Score how well an item matches the query.
 * Returns a number > 0 if relevant, 0 otherwise.
 */
function scoreMatch(haystackList, q) {
  if (!q) return 0;
  const nq = normalize(q);
  let bestScore = 0;
  for (const text of haystackList) {
    if (!text) continue;
    const nt = normalize(text);
    if (nt === nq) return 1000;                  // exact match
    if (nt.startsWith(nq)) bestScore = Math.max(bestScore, 800);
    else if (nt.includes(nq)) bestScore = Math.max(bestScore, 500);
    // Word boundary match (e.g. "amour" finds "mon amour")
    const words = nt.split(/\s+/);
    if (words.some(w => w.startsWith(nq))) bestScore = Math.max(bestScore, 700);
  }
  return bestScore;
}

/* ─── Search engine ───────────────────────────────────────── */

function searchAll(q) {
  if (!q || q.trim().length < 1) {
    // Show recent / suggested when empty
    return suggestedResults();
  }
  const trimmed = q.trim();
  const groups = [];

  // Pages
  const pageHits = PAGES.map(p => ({
    type: 'page',
    icon: p.emoji,
    title: p.title,
    desc: p.desc,
    path: p.path,
    score: scoreMatch([p.title, p.desc, p.id], trimmed)
  })).filter(x => x.score > 0);
  if (pageHits.length) groups.push({ label: 'Pages KIVU', icon: '🧭', items: pageHits.sort((a,b) => b.score - a.score).slice(0, 6) });

  // Dictionary
  const dictHits = DICT_ENTRIES.map(e => ({
    type: 'dictionary',
    icon: e.emoji,
    title: e.fr,
    desc: `${e.swa || ''}${e.en ? ' · ' + e.en : ''}${e.wol ? ' · ' + e.wol : ''}`,
    path: '/dictionary',
    score: scoreMatch([e.fr, e.swa, e.wol, e.bam, e.hau, e.yor, e.zul, e.ibo, e.en], trimmed)
  })).filter(x => x.score > 0);
  if (dictHits.length) groups.push({ label: 'Dictionnaire', icon: '📚', items: dictHits.sort((a,b) => b.score - a.score).slice(0, 8) });

  // Marketplace products
  const productHits = PRODUCTS.map(p => ({
    type: 'product',
    icon: p.emoji,
    title: p.name,
    desc: `${p.countryFlag} ${p.seller} · ${p.price.toLocaleString('fr-FR')} ${p.currency}`,
    path: '/marketplace',
    score: scoreMatch([p.name, p.description, p.seller, p.country, p.region], trimmed)
  })).filter(x => x.score > 0);
  if (productHits.length) groups.push({ label: 'Marketplace', icon: '🛍️', items: productHits.sort((a,b) => b.score - a.score).slice(0, 6) });

  // Stories
  const storyHits = STORIES.map(s => ({
    type: 'story',
    icon: s.cover,
    title: s.title,
    desc: `${s.flag} ${s.unit} · ${s.duration}`,
    path: `/story/${s.id}`,
    score: scoreMatch([s.title, s.description, s.unit, s.language], trimmed)
  })).filter(x => x.score > 0);
  if (storyHits.length) groups.push({ label: 'Stories', icon: '📖', items: storyHits.sort((a,b) => b.score - a.score).slice(0, 5) });

  // Friends
  const friends = (store.get('friends')?.list || []);
  const friendHits = friends.map(f => ({
    type: 'friend',
    icon: f.avatar,
    title: f.name,
    desc: `${f.countryFlag} ${f.country} · niveau ${f.level || 1}`,
    path: '/friends',
    score: scoreMatch([f.name, f.country, f.code, f.region], trimmed)
  })).filter(x => x.score > 0);
  if (friendHits.length) groups.push({ label: 'Mes amis', icon: '👥', items: friendHits.sort((a,b) => b.score - a.score).slice(0, 5) });

  // Translation history
  const tHistory = (store.get('translation')?.history || []);
  const transHits = tHistory.map(h => ({
    type: 'translation',
    icon: '🔤',
    title: h.source,
    desc: `${h.fromFlag || '🌐'} → ${h.toFlag || '🌐'} : ${h.target}`,
    path: '/translate',
    score: scoreMatch([h.source, h.target], trimmed)
  })).filter(x => x.score > 0);
  if (transHits.length) groups.push({ label: 'Mes traductions', icon: '🌐', items: transHits.sort((a,b) => b.score - a.score).slice(0, 5) });

  // Cultural events
  const eventHits = CULTURAL_EVENTS.map(e => ({
    type: 'event',
    icon: e.emoji,
    title: e.name,
    desc: `${e.region} · ${e.day}/${e.month} · ${e.desc}`,
    path: '/',
    score: scoreMatch([e.name, e.region, e.desc], trimmed)
  })).filter(x => x.score > 0);
  if (eventHits.length) groups.push({ label: 'Événements culturels', icon: '🌍', items: eventHits.sort((a,b) => b.score - a.score).slice(0, 4) });

  // Payment methods
  const payHits = PAYMENT_METHODS.map(p => ({
    type: 'payment',
    icon: p.logo,
    title: p.name,
    desc: `${p.label} · ${p.fees}`,
    path: '/marketplace',
    score: scoreMatch([p.name, p.label, p.desc], trimmed)
  })).filter(x => x.score > 0);
  if (payHits.length) groups.push({ label: 'Paiement', icon: '💳', items: payHits.sort((a,b) => b.score - a.score).slice(0, 4) });

  return groups;
}

function suggestedResults() {
  return [
    {
      label: 'Suggestions',
      icon: '💡',
      items: [
        { type: 'page', icon: '🌐', title: 'Traduire un texte', desc: 'Voix, texte, conversation', path: '/translate', score: 1 },
        { type: 'page', icon: '📚', title: 'Explorer le dictionnaire', desc: '80+ mots en 8 langues', path: '/dictionary', score: 1 },
        { type: 'page', icon: '🎓', title: 'Continuer ma leçon', desc: 'Apprentissage gamifié', path: '/learn', score: 1 },
        { type: 'page', icon: '🛍️', title: 'Marketplace africain', desc: '24 produits artisans', path: '/marketplace', score: 1 },
        { type: 'page', icon: '✨', title: 'Demander à Kivi', desc: 'Assistant IA conversationnel', path: '/assistant', score: 1 },
      ]
    }
  ];
}

/* ─── Modal lifecycle ─────────────────────────────────────── */

export function openGlobalSearch() {
  if (isOpen) return;
  isOpen = true;
  query = '';
  activeIdx = 0;
  if (backdropEl) backdropEl.remove();
  backdropEl = document.createElement('div');
  backdropEl.className = 'gs-backdrop';
  document.body.appendChild(backdropEl);
  render();
  requestAnimationFrame(() => backdropEl.classList.add('is-open'));
  attachInputs();
}

function closeGlobalSearch() {
  if (!isOpen) return;
  isOpen = false;
  if (backdropEl) {
    backdropEl.classList.remove('is-open');
    setTimeout(() => { backdropEl?.remove(); backdropEl = null; }, 220);
  }
  document.removeEventListener('keydown', handleKeyDown);
}

function render() {
  if (!backdropEl) return;
  allResults = searchAll(query);
  const flatItems = [];
  allResults.forEach(g => g.items.forEach(it => flatItems.push(it)));
  if (activeIdx >= flatItems.length) activeIdx = Math.max(0, flatItems.length - 1);

  backdropEl.innerHTML = `
    <div class="gs-modal" data-stop="true" role="dialog" aria-modal="true" aria-label="Recherche globale">
      <div class="gs-input-wrap">
        <span class="gs-icon">🔎</span>
        <input id="gs-input"
               class="gs-input"
               type="search"
               placeholder="Cherche partout : mots, produits, histoires, amis…"
               value="${escapeHtml(query)}"
               autocomplete="off"
               spellcheck="false"
               autofocus />
        <span class="gs-shortcut">Échap</span>
      </div>

      <div class="gs-results" id="gs-results">
        ${renderGroups(allResults, flatItems)}
      </div>

      <div class="gs-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> naviguer</span>
        <span><kbd>↵</kbd> ouvrir</span>
        <span><kbd>Esc</kbd> fermer</span>
        <span class="gs-footer__count">${flatItems.length} résultat${flatItems.length > 1 ? 's' : ''}</span>
      </div>
    </div>
  `;

  // Re-attach input listeners
  attachInputs();

  // Click handlers on result rows
  let idx = 0;
  backdropEl.querySelectorAll('[data-gs-idx]').forEach(el => {
    const itemIdx = Number(el.dataset.gsIdx);
    el.addEventListener('click', () => {
      const item = flatItems[itemIdx];
      if (item) selectResult(item);
    });
    el.addEventListener('mouseenter', () => {
      activeIdx = itemIdx;
      updateActiveStyle();
    });
  });

  updateActiveStyle();
}

function renderGroups(groups, flatItems) {
  if (!groups.length) {
    return `
      <div class="gs-empty">
        <div class="gs-empty__emoji">🔍</div>
        <div class="font-bold">Aucun résultat</div>
        <div class="text-xs text-muted">Essaie un autre mot, ou explore les suggestions ci-dessus.</div>
      </div>
    `;
  }
  let idx = 0;
  return groups.map(g => `
    <div class="gs-group">
      <div class="gs-group__head">
        <span>${g.icon}</span>
        <span>${escapeHtml(g.label)}</span>
        <span class="gs-group__count">${g.items.length}</span>
      </div>
      <div class="gs-group__items">
        ${g.items.map(item => {
          const i = idx++;
          return `
            <button class="gs-item" data-gs-idx="${i}">
              <span class="gs-item__icon">${item.icon || '•'}</span>
              <div class="gs-item__body">
                <div class="gs-item__title">${highlight(item.title, query)}</div>
                ${item.desc ? `<div class="gs-item__desc">${highlight(item.desc, query)}</div>` : ''}
              </div>
              <span class="gs-item__type">${typeLabel(item.type)}</span>
              <span class="gs-item__arrow">↵</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function typeLabel(type) {
  const map = {
    page:        'Page',
    dictionary:  'Mot',
    product:     'Produit',
    story:       'Histoire',
    friend:      'Ami',
    translation: 'Traduction',
    event:       'Événement',
    payment:     'Paiement'
  };
  return map[type] || type;
}

function updateActiveStyle() {
  if (!backdropEl) return;
  backdropEl.querySelectorAll('.gs-item').forEach(el => {
    el.classList.toggle('is-active', Number(el.dataset.gsIdx) === activeIdx);
  });
  // Scroll active into view
  const active = backdropEl.querySelector('.gs-item.is-active');
  if (active) {
    active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function attachInputs() {
  const input = backdropEl?.querySelector('#gs-input');
  if (!input) return;
  input.addEventListener('input', (ev) => {
    query = ev.target.value;
    activeIdx = 0;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => render(), 80);
  });
  // Backdrop click closes
  backdropEl.addEventListener('click', (ev) => {
    if (ev.target === backdropEl) closeGlobalSearch();
  });
  // Global key handlers
  document.addEventListener('keydown', handleKeyDown);
}

function handleKeyDown(e) {
  if (!isOpen) return;
  const flatItems = [];
  allResults.forEach(g => g.items.forEach(it => flatItems.push(it)));

  if (e.key === 'Escape') {
    e.preventDefault();
    closeGlobalSearch();
    return;
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIdx = Math.min(flatItems.length - 1, activeIdx + 1);
    updateActiveStyle();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIdx = Math.max(0, activeIdx - 1);
    updateActiveStyle();
    return;
  }
  if (e.key === 'Enter') {
    const item = flatItems[activeIdx];
    if (item) {
      e.preventDefault();
      selectResult(item);
    }
  }
}

function selectResult(item) {
  fx.click();
  closeGlobalSearch();
  if (item.path) navigate(item.path);
}

/* ─── Setup (global keyboard listener + button trigger) ───── */

export function setupGlobalSearch() {
  // Cmd+K / Ctrl+K / / shortcut
  document.addEventListener('keydown', (e) => {
    // Don't trigger if user is typing in an input/textarea (unless it's our own input)
    const tag = (e.target.tagName || '').toLowerCase();
    const isTyping = ['input', 'textarea'].includes(tag) || e.target.isContentEditable;
    const isOurInput = e.target.id === 'gs-input';

    // Cmd+K (Mac) or Ctrl+K (Win/Linux) — global trigger
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (isOpen) closeGlobalSearch();
      else openGlobalSearch();
      return;
    }
    // / shortcut — only when not typing
    if (e.key === '/' && !isTyping && !isOpen) {
      e.preventDefault();
      openGlobalSearch();
      return;
    }
  });

  // Floating button bottom-left
  const btn = document.createElement('button');
  btn.className = 'gs-fab';
  btn.setAttribute('aria-label', 'Recherche globale');
  btn.title = 'Recherche · Ctrl+K';
  btn.innerHTML = `
    <span class="gs-fab__icon">🔎</span>
    <span class="gs-fab__label">Rechercher</span>
    <span class="gs-fab__shortcut">⌘K</span>
  `;
  btn.addEventListener('click', () => openGlobalSearch());
  document.body.appendChild(btn);

  // Hide FAB on full-screen routes
  const updateFabVisibility = () => {
    const hash = (location.hash || '').replace('#', '');
    const fullScreen = ['/onboarding', '/login'];
    const inLessonOrStory = hash.startsWith('/lesson/') || hash.startsWith('/story/') || hash.startsWith('/checkout/');
    btn.style.display = (fullScreen.includes(hash) || inLessonOrStory) ? 'none' : 'inline-flex';
  };
  updateFabVisibility();
  window.addEventListener('hashchange', updateFabVisibility);
}
