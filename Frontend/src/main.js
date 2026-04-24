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
import { renderOnboarding } from './pages/onboarding.js';
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

  const renderFn = routes[path] || renderHome;
  const screenHTML = renderFn();
  const navHTML = path === '/onboarding' ? '' : renderBottomNav(path);
  const sideHTML = path === '/onboarding' ? '' : renderDesktopNav(path);

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

// Export for console debug
window.__KIVU__ = { navigate, store };
