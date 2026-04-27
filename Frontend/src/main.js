/**
 * KIVU — Point d'entrée SPA Vanilla JS
 * Router minimaliste, state global, rendu via render()
 */

import { router, navigate } from './router.js';
import { renderHome } from './pages/home.js';
import { renderTranslate } from './pages/translate.js';
import { renderLearn } from './pages/learn.js';
import { renderPreserve } from './pages/preserve.js';
import { renderBusiness } from './pages/business.js';
import { renderMultiParty } from './pages/multiparty.js';
import { renderAssistant } from './pages/assistant.js';
import { renderDiaspora } from './pages/diaspora.js';
import { renderAccessibility } from './pages/accessibility.js';
import { renderProfile } from './pages/profile.js';
import { renderSettings, applyTheme } from './pages/settings.js';
import { renderOnboarding } from './pages/onboarding.js';
import { renderLessonPlayer } from './pages/lesson-player.js';
import { renderRadio } from './pages/radio.js';
import { renderDictionary } from './pages/dictionary.js';
import { renderLogin } from './pages/login.js';
import { renderCheckout } from './pages/checkout.js';
import { renderStories } from './pages/stories.js';
import { renderStoryPlayer } from './pages/story-player.js';
import { setupInstallBanner } from './components/install-banner.js';
import { setupMascotTracker } from './components/mascot-tracker.js';
import { initI18n, onLangChange } from './i18n/index.js';
import { applyPalette, applyDensity, applyContrast } from './theme.js';
import { sync } from './services/sync.js';
import { renderBottomNav } from './components/bottom-nav.js';
import { renderDesktopNav } from './components/desktop-nav.js';
import { store } from './store.js';

const routes = {
  '/': renderHome,
  '/home': renderHome,
  '/translate': renderTranslate,
  '/learn': renderLearn,
  '/preserve': renderPreserve,
  '/business': renderBusiness,
  '/multi-party': renderMultiParty,
  '/assistant': renderAssistant,
  '/diaspora': renderDiaspora,
  '/accessibility': renderAccessibility,
  '/profile': renderProfile,
  '/settings': renderSettings,
  '/radio': renderRadio,
  '/stories': renderStories,
  '/dictionary': renderDictionary,
  '/login': renderLogin,
  '/onboarding': renderOnboarding
};

const app = document.getElementById('app');

function render() {
  const path = router.current();

  // Onboarding first
  if (!store.get('onboardingCompleted') && path !== '/onboarding') {
    navigate('/onboarding');
    return;
  }

  // Lesson player route: /lesson/<day> — full screen, no nav
  if (path.startsWith('/lesson/')) {
    app.innerHTML = `<main class="screen lesson-screen">${renderLessonPlayer()}</main>`;
    if (renderLessonPlayer.mount) renderLessonPlayer.mount();
    return;
  }

  // Story player route: /story/<id> — full screen, no nav
  if (path.startsWith('/story/')) {
    app.innerHTML = `<main class="screen lesson-screen">${renderStoryPlayer()}</main>`;
    if (renderStoryPlayer.mount) renderStoryPlayer.mount();
    return;
  }

  // Checkout route: /checkout/<plan-id>
  if (path.startsWith('/checkout/')) {
    app.innerHTML = `
      ${renderDesktopNav(path)}
      <main class="screen animate-slide-up">${renderCheckout()}</main>
    `;
    if (renderCheckout.mount) renderCheckout.mount();
    return;
  }

  const renderFn = routes[path] || renderHome;
  const screenHTML = renderFn();
  const isFullScreen = path === '/onboarding' || path === '/login';
  const navHTML = isFullScreen ? '' : renderBottomNav(path);
  const sideHTML = isFullScreen ? '' : renderDesktopNav(path);

  app.innerHTML = `
    ${sideHTML}
    <main class="screen animate-slide-up">${screenHTML}</main>
    ${navHTML}
  `;

  // Run post-render hooks (for attaching Chart.js, listeners, etc.)
  if (renderFn.mount) renderFn.mount();
}

// Subscribe to router and global state changes
router.onChange(render);
store.subscribe(render);

// Cloud sync — push debounced on every store change, periodic loop, pull on tab focus
store.subscribe(() => sync.pushSoon());
sync.startPeriodic();
// Initial pull if already signed in
if (localStorage.getItem('kivu.token')) {
  sync.pull().catch(() => {});
}

// Apply persisted theme + i18n + palette + density BEFORE first paint
(() => {
  const prefs = store.get('preferences') || {};
  applyTheme(prefs.theme || 'auto');
  applyPalette(prefs.palette || 'kivu');
  applyDensity(prefs.density || 'normal');
  applyContrast(!!prefs.highContrast);
  initI18n(prefs.uiLang || 'fr');
  // Re-render the whole app when UI language changes
  onLangChange(() => render());
  if (prefs.fontSize) {
    document.documentElement.style.setProperty('--root-font-size', `${prefs.fontSize * 16}px`);
  }
  // Reagir à l'évolution du thème système si l'utilisateur est en mode 'auto'
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const cur = (store.get('preferences') || {}).theme || 'auto';
      if (cur === 'auto') applyTheme('auto');
    });
  }
})();

// Hide splash after mount
window.addEventListener('load', () => {
  render();
  setTimeout(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.classList.add('hidden');
    setTimeout(() => splash && splash.remove(), 700);
  }, 700);
});

// Service worker — PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// Custom PWA install banner with Kivi mascot
setupInstallBanner();

// Mascot eye-tracking (Kivi suit le curseur + cligne aléatoirement)
setupMascotTracker();

// ===========================================================
// Cloud sync status indicator (top-right)
// ===========================================================
const syncIndicator = document.createElement('button');
syncIndicator.className = 'sync-indicator';
syncIndicator.title = 'Synchroniser maintenant';
syncIndicator.setAttribute('aria-label', 'État de la synchronisation');
syncIndicator.innerHTML = `<span class="sync-dot"></span><span class="sync-label">Sync</span>`;
syncIndicator.addEventListener('click', () => sync.syncNow());
document.body.appendChild(syncIndicator);

const SYNC_LABELS = {
  idle:     { text: 'Sync',      color: 'var(--text-tertiary)' },
  syncing:  { text: 'Sync…',     color: 'var(--kivu-primary)' },
  success:  { text: 'À jour',    color: 'var(--success)' },
  error:    { text: 'Échec',     color: 'var(--error)' },
  offline:  { text: 'Hors-ligne', color: 'var(--warning)' },
  unauth:   { text: 'Connectez-vous', color: 'var(--text-tertiary)' }
};
sync.onChange((s) => {
  const meta = SYNC_LABELS[s] || SYNC_LABELS.idle;
  syncIndicator.style.setProperty('--sync-color', meta.color);
  syncIndicator.querySelector('.sync-label').textContent = meta.text;
  syncIndicator.dataset.status = s;
  // Hide entirely when not signed in (avoid clutter for guests)
  syncIndicator.style.display = s === 'unauth' ? 'none' : 'inline-flex';
});

// Event delegation for navigation links
document.addEventListener('click', (e) => {
  const link = e.target.closest('[data-nav]');
  if (link) {
    e.preventDefault();
    navigate(link.dataset.nav);
  }

  const action = e.target.closest('[data-action]');
  if (action) {
    const evt = new CustomEvent(action.dataset.action, { detail: action.dataset, bubbles: true });
    action.dispatchEvent(evt);
  }
});

// ===========================================================
// Global premium UX: toasts + scroll indicator
// ===========================================================
const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

const TOAST_ICONS = { success: '✅', warning: '⚠️', error: '❌', info: '💬' };
function toast(message, { type = 'info', duration = 3200 } = {}) {
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `
    <span class="toast__icon">${TOAST_ICONS[type] || '💬'}</span>
    <span class="toast__body">${message}</span>
  `;
  toastContainer.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity 0.25s, transform 0.25s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-8px)';
    setTimeout(() => el.remove(), 260);
  }, duration);
}

const scrollBar = document.createElement('div');
scrollBar.className = 'scroll-indicator';
document.body.appendChild(scrollBar);
window.addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  scrollBar.style.setProperty('--scroll', pct + '%');
}, { passive: true });

// Export for console debug
window.__KIVU__ = { navigate, store, toast };
