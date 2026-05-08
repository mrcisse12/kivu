/**
 * KIVU — Indicateur de statut hors-ligne.
 *
 * Affiche une pastille discrète quand la connexion réseau tombe,
 * et un toast quand elle revient. Permet à l'utilisateur de savoir
 * si l'app peut joindre le backend ou doit utiliser le mode offline.
 *
 * S'affiche en haut, sous la barre de scroll-indicator.
 */

let pillEl = null;
let isOnline = navigator.onLine !== false;

function ensurePill() {
  if (pillEl) return pillEl;
  pillEl = document.createElement('div');
  pillEl.className = 'kivu-offline-pill';
  pillEl.setAttribute('role', 'status');
  pillEl.setAttribute('aria-live', 'polite');
  pillEl.innerHTML = `
    <span class="kivu-offline-pill__dot"></span>
    <span class="kivu-offline-pill__label">Hors-ligne</span>
  `;
  document.body.appendChild(pillEl);
  return pillEl;
}

function show() {
  ensurePill();
  pillEl.classList.add('is-visible');
}

function hide() {
  if (!pillEl) return;
  pillEl.classList.remove('is-visible');
}

export function setupOfflineIndicator() {
  // Initial state
  if (!isOnline) show();

  window.addEventListener('online', () => {
    if (isOnline) return;
    isOnline = true;
    hide();
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('🌐 Connexion rétablie', { type: 'success', duration: 1800 });
    }
  });

  window.addEventListener('offline', () => {
    if (!isOnline) return;
    isOnline = false;
    show();
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('📵 Mode hors-ligne — KIVU continue de fonctionner', { type: 'info', duration: 2400 });
    }
  });
}

/** Returns the current network status */
export function isOffline() {
  return !isOnline;
}
