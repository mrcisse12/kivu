/**
 * KIVU — PWA install premium.
 *
 * Détecte la plateforme (iOS / Android / Desktop) et propose une
 * expérience d'installation contextualisée :
 *
 *  - Android/Chrome/Edge : bouton "Installer" qui déclenche le
 *    prompt natif beforeinstallprompt
 *  - iOS Safari          : pas de prompt natif possible → guide
 *    pas-à-pas avec les captures Safari ("Partager" → "Sur l'écran")
 *  - Desktop             : prompt natif + raccourci clavier
 *
 * Deux modes d'apparition :
 *  - Bannière discrète    (premier passage, après 30s)
 *  - Modal hero premium   (déclenchée explicitement via promptInstall())
 *
 * Affiche les bénéfices : offline, sur l'écran d'accueil, plein écran,
 * notifications, plus rapide.
 */

import { mascot } from './mascot.js';

const DISMISS_KEY = 'kivu.installPromptDismissedAt';
const COOLDOWN_DAYS = 7;

let deferredPrompt = null;
let isStandalone = false;

/* ─── Platform detection ─────────────────────────────────── */

function detectPlatform() {
  const ua = navigator.userAgent || '';
  const isIPhone = /iPhone|iPad|iPod/i.test(ua) && !window.MSStream;
  const isIOSSafari = isIPhone && /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIPhone || isAndroid;

  return {
    isIPhone,
    isIOSSafari,
    isAndroid,
    isMobile,
    isDesktop: !isMobile,
    isChrome: /Chrome|Chromium/i.test(ua) && !/Edge|EdgA/i.test(ua),
    isEdge: /Edg/i.test(ua),
    isFirefox: /Firefox|FxiOS/i.test(ua),
    supportsPromptApi: 'BeforeInstallPromptEvent' in window || ua.includes('Chrome') || ua.includes('Edg'),
    isStandalone:
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  };
}

/* ─── Setup (auto-banner on first visit) ─────────────────── */

export function setupInstallBanner() {
  const platform = detectPlatform();
  if (platform.isStandalone) {
    isStandalone = true;
    return;
  }

  // Capture deferred prompt for Android/Desktop Chromium
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Auto-show discreet banner after 30s if not dismissed recently
    setTimeout(() => maybeShowBanner(), 30_000);
  });

  // iOS Safari : show the discreet banner after 60s of usage
  if (platform.isIOSSafari) {
    setTimeout(() => maybeShowBanner(), 60_000);
  }

  // Cleanup if installed
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    isStandalone = true;
    hide();
    localStorage.removeItem(DISMISS_KEY);
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('🎉 KIVU installé ! Lance-le depuis ton écran d\'accueil.', {
        type: 'success', duration: 4000
      });
    }
  });
}

function maybeShowBanner() {
  if (isStandalone) return;
  if (document.getElementById('install-banner')) return;
  if (document.getElementById('install-modal')) return;
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
  if (Date.now() - dismissedAt < COOLDOWN_DAYS * 24 * 3600 * 1000) return;
  showBanner();
}

/* ─── Discreet banner ────────────────────────────────────── */

function showBanner() {
  if (document.getElementById('install-banner')) return;
  const platform = detectPlatform();
  const el = document.createElement('div');
  el.id = 'install-banner';
  el.className = 'install-banner animate-slide-up';
  el.innerHTML = `
    <div class="install-banner__mascot">${mascot.waving(56)}</div>
    <div class="install-banner__body">
      <div class="font-bold">Installer KIVU</div>
      <div class="text-xs text-muted">Hors-ligne · plein écran · sur l'accueil</div>
    </div>
    <div class="install-banner__actions">
      <button class="btn btn-ghost btn-sm" data-action="install-dismiss">Plus tard</button>
      <button class="btn btn-primary btn-sm" data-action="install-show-modal"
              style="background:var(--kivu-accent);">Installer</button>
    </div>
  `;
  document.body.appendChild(el);

  el.querySelector('[data-action="install-dismiss"]').addEventListener('click', () => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    hide();
  });
  el.querySelector('[data-action="install-show-modal"]').addEventListener('click', () => {
    hide();
    showInstallModal();
  });
}

function hide() {
  const el = document.getElementById('install-banner');
  if (!el) return;
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  setTimeout(() => el.remove(), 300);
}

/* ─── Premium modal ──────────────────────────────────────── */

export function showInstallModal() {
  if (isStandalone) {
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('✓ KIVU est déjà installé sur cet appareil', { type: 'success', duration: 2000 });
    }
    return;
  }
  if (document.getElementById('install-modal')) return;
  const platform = detectPlatform();

  const wrap = document.createElement('div');
  wrap.id = 'install-modal';
  wrap.className = 'install-modal-backdrop';
  wrap.innerHTML = renderModal(platform);
  document.body.appendChild(wrap);
  requestAnimationFrame(() => wrap.classList.add('is-open'));

  // Close on backdrop click
  wrap.addEventListener('click', (ev) => {
    if (ev.target === wrap) closeModal();
  });
  // Close button
  wrap.querySelector('[data-action="install-close"]')?.addEventListener('click', closeModal);
  // Escape closes
  const onEsc = (e) => { if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); } };
  document.addEventListener('keydown', onEsc);

  // Real install button (Android/Desktop)
  wrap.querySelector('[data-action="install-confirm"]')?.addEventListener('click', async () => {
    if (!deferredPrompt) {
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Suivez les instructions à l\'écran pour installer KIVU.', { type: 'info' });
      }
      return;
    }
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      // appinstalled event will close
    } else {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
      closeModal();
    }
    deferredPrompt = null;
  });
}

function closeModal() {
  const wrap = document.getElementById('install-modal');
  if (!wrap) return;
  wrap.classList.remove('is-open');
  setTimeout(() => wrap.remove(), 280);
}

/* ─── Modal markup per platform ──────────────────────────── */

function renderModal(platform) {
  const benefits = renderBenefits();
  let instructions = '';

  if (platform.isIOSSafari) {
    instructions = `
      <div class="install-step">
        <div class="install-step__num">1</div>
        <div class="install-step__body">
          <div class="font-semibold">Touche le bouton Partager</div>
          <div class="text-xs text-muted">L'icône <span class="install-step__icon">⬆️</span> en bas de Safari</div>
        </div>
      </div>
      <div class="install-step">
        <div class="install-step__num">2</div>
        <div class="install-step__body">
          <div class="font-semibold">Choisis « Sur l'écran d'accueil »</div>
          <div class="text-xs text-muted">L'option <span class="install-step__icon">➕</span> dans le menu</div>
        </div>
      </div>
      <div class="install-step">
        <div class="install-step__num">3</div>
        <div class="install-step__body">
          <div class="font-semibold">Touche « Ajouter »</div>
          <div class="text-xs text-muted">KIVU apparaît sur ton écran d'accueil 🎉</div>
        </div>
      </div>
    `;
  } else if (platform.isIPhone) {
    instructions = `
      <div class="install-step is-warning">
        <div class="install-step__num">!</div>
        <div class="install-step__body">
          <div class="font-semibold">Ouvre KIVU dans Safari pour installer</div>
          <div class="text-xs text-muted">L'installation PWA n'est pas disponible sur les autres navigateurs iOS. Copie l'URL et ouvre-la dans Safari.</div>
        </div>
      </div>
    `;
  } else if (platform.isAndroid) {
    instructions = `
      <div class="install-step">
        <div class="install-step__num">1</div>
        <div class="install-step__body">
          <div class="font-semibold">Touche « Installer KIVU »</div>
          <div class="text-xs text-muted">Le bouton ci-dessous lance l'installation native de Chrome</div>
        </div>
      </div>
      <div class="install-step">
        <div class="install-step__num">2</div>
        <div class="install-step__body">
          <div class="font-semibold">Confirme dans la fenêtre Android</div>
          <div class="text-xs text-muted">L'icône KIVU apparaît sur ton écran d'accueil</div>
        </div>
      </div>
    `;
  } else {
    // Desktop
    instructions = `
      <div class="install-step">
        <div class="install-step__num">1</div>
        <div class="install-step__body">
          <div class="font-semibold">Clique « Installer KIVU »</div>
          <div class="text-xs text-muted">Le navigateur ouvre la fenêtre d'installation</div>
        </div>
      </div>
      <div class="install-step">
        <div class="install-step__num">2</div>
        <div class="install-step__body">
          <div class="font-semibold">Lance KIVU comme une vraie app</div>
          <div class="text-xs text-muted">Sans onglet, sans barre d'URL, plein écran</div>
        </div>
      </div>
    `;
  }

  const ctaLabel = platform.isIOSSafari ? 'Compris !'
    : platform.isIPhone ? 'Ouvrir Safari'
    : platform.isAndroid ? '🚀 Installer KIVU'
    : '🚀 Installer KIVU';
  const ctaAction = platform.isIOSSafari ? 'install-close'
    : platform.isIPhone ? 'install-close'
    : 'install-confirm';

  return `
    <div class="install-modal" role="dialog" aria-modal="true" aria-label="Installer KIVU">
      <button class="install-modal__close" data-action="install-close" aria-label="Fermer">×</button>

      <div class="install-modal__hero">
        <div class="install-modal__mascot">${mascot.cheering(96)}</div>
        <h2 class="install-modal__title">Installe KIVU</h2>
        <p class="install-modal__sub">L'expérience complète, sans navigateur. <strong>2 millions de langues à portée de pouce.</strong></p>
      </div>

      <div class="install-benefits">
        ${benefits}
      </div>

      <div class="install-platform-tag">
        ${platform.isIOSSafari ? '🍎 iPhone — Safari'
          : platform.isIPhone ? '🍎 iPhone'
          : platform.isAndroid ? '🤖 Android'
          : platform.isEdge ? '🪟 Microsoft Edge'
          : platform.isChrome ? '💻 Chrome'
          : platform.isFirefox ? '🦊 Firefox'
          : '💻 Desktop'}
      </div>

      <div class="install-steps">
        ${instructions}
      </div>

      <button class="btn btn-primary btn-full install-modal__cta" data-action="${ctaAction}">
        ${ctaLabel}
      </button>

      <button class="btn btn-ghost btn-full install-modal__later" data-action="install-close">
        Plus tard
      </button>

      <p class="install-modal__footer">
        💚 100% gratuit · Pas de pubs · Hors-ligne · 5 langues
      </p>
    </div>
  `;
}

function renderBenefits() {
  const items = [
    { emoji: '⚡', title: '3× plus rapide', desc: 'Lance directement sans navigateur' },
    { emoji: '📵', title: 'Hors-ligne complet', desc: 'Apprends en avion ou métro' },
    { emoji: '🔔', title: 'Notifications quotidiennes', desc: 'Garde ta série de jours' },
    { emoji: '🏠', title: 'Écran d\'accueil', desc: 'Une icône comme une vraie app' }
  ];
  return items.map(b => `
    <div class="install-benefit">
      <span class="install-benefit__emoji">${b.emoji}</span>
      <div>
        <div class="font-semibold text-sm">${b.title}</div>
        <div class="text-xs text-muted">${b.desc}</div>
      </div>
    </div>
  `).join('');
}

/* ─── Public API ─────────────────────────────────────────── */

/** Manually trigger the install modal (used from Settings) */
export function promptInstall() {
  showInstallModal();
  return Promise.resolve();
}

/** Returns true if the app is running standalone (already installed) */
export function isInstalled() {
  return isStandalone || detectPlatform().isStandalone;
}
