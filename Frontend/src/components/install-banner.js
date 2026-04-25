/**
 * KIVU — PWA install banner.
 *
 * Capte l'événement beforeinstallprompt (Chrome/Edge), affiche une bannière
 * custom avec Kivi, et déclenche prompt() au clic. Repose son apparence
 * dans localStorage si l'utilisateur ferme le banner.
 */

import { mascot } from './mascot.js';

const DISMISS_KEY = 'kivu.installPromptDismissedAt';
const COOLDOWN_DAYS = 7;

let deferredPrompt = null;

export function setupInstallBanner() {
  // Skip si déjà installé en standalone
  if (window.matchMedia?.('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Ne pas afficher le mini-bar natif
    e.preventDefault();
    deferredPrompt = e;
    // Respecter le cooldown
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (Date.now() - dismissedAt < COOLDOWN_DAYS * 24 * 3600 * 1000) return;
    show();
  });

  // Si déjà installé, nettoie
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    hide();
    localStorage.removeItem(DISMISS_KEY);
  });
}

function show() {
  if (document.getElementById('install-banner')) return;
  const el = document.createElement('div');
  el.id = 'install-banner';
  el.className = 'install-banner animate-slide-up';
  el.innerHTML = `
    <div class="install-banner__mascot">${mascot.waving(72)}</div>
    <div class="install-banner__body">
      <div class="font-bold">Installer KIVU</div>
      <div class="text-xs text-muted">Accès offline · sur l'écran d'accueil · sans navigateur</div>
    </div>
    <div class="install-banner__actions">
      <button class="btn btn-ghost btn-sm" data-action="install-dismiss">Plus tard</button>
      <button class="btn btn-primary btn-sm" data-action="install-confirm"
              style="background:var(--kivu-accent);">Installer</button>
    </div>
  `;
  document.body.appendChild(el);

  el.querySelector('[data-action="install-dismiss"]').addEventListener('click', () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    hide();
  });
  el.querySelector('[data-action="install-confirm"]').addEventListener('click', async () => {
    if (!deferredPrompt) { hide(); return; }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (window.__KIVU__?.toast) {
      const msg = choice.outcome === 'accepted'
        ? 'KIVU installé !'
        : 'Installation reportée.';
      window.__KIVU__.toast(msg, { type: choice.outcome === 'accepted' ? 'success' : 'info' });
    }
    deferredPrompt = null;
    hide();
  });
}

function hide() {
  const el = document.getElementById('install-banner');
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    setTimeout(() => el.remove(), 300);
  }
}

/** Permet à un lien Settings de déclencher manuellement le prompt. */
export function promptInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    return deferredPrompt.userChoice;
  }
  return Promise.resolve({ outcome: 'unavailable' });
}
