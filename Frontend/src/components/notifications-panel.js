/**
 * KIVU — Notifications panel (bell + dropdown)
 *
 * Bouton bell flottant en haut à droite, à côté du sync indicator.
 * Au clic, ouvre un panel slide-down avec la liste des notifications,
 * actions "tout marquer lu" + "tout effacer".
 */

import { notifications } from '../services/notifications.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { fx } from '../services/audio-fx.js';

let panelOpen = false;
let bellEl = null;
let panelEl = null;

function bellSVG(size = 22) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z"/>
            <path d="M10 21h4"/>
          </svg>`;
}

function relTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function renderPanel() {
  const list = notifications.list();
  return `
    <div class="notif-panel" role="dialog" aria-label="Notifications">
      <header class="notif-panel__head">
        <strong>Notifications</strong>
        <div class="flex gap-xs">
          ${list.some(n => !n.read) ? '<button class="link-btn text-xs" data-action="notif-read-all">Tout lire</button>' : ''}
          ${list.length ? '<button class="link-btn text-xs" data-action="notif-clear">Effacer</button>' : ''}
        </div>
      </header>
      <div class="notif-panel__body">
        ${list.length === 0 ? `
          <div class="notif-empty">
            <div class="notif-empty__emoji">🔕</div>
            <div class="font-semibold">Aucune notification</div>
            <div class="text-xs text-muted">Vos progrès et événements apparaîtront ici.</div>
          </div>
        ` : list.map(n => `
          <button class="notif-row ${n.read ? '' : 'is-unread'}"
                  data-action="notif-open" data-id="${n.id}"
                  ${n.actionPath ? `data-path="${n.actionPath}"` : ''}
                  type="button">
            <span class="notif-row__icon" aria-hidden="true">${n.icon}</span>
            <div class="notif-row__body">
              <div class="notif-row__title">${escapeHtml(n.title)}</div>
              ${n.body ? `<div class="notif-row__sub">${escapeHtml(n.body)}</div>` : ''}
              <div class="notif-row__time">${relTime(n.date)}</div>
            </div>
            ${!n.read ? '<span class="notif-row__dot"></span>' : ''}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function openPanel() {
  if (panelOpen) return;
  panelOpen = true;
  panelEl = document.createElement('div');
  panelEl.className = 'notif-panel-wrap';
  panelEl.innerHTML = renderPanel();
  document.body.appendChild(panelEl);
  attachPanelHandlers();
  // Click outside to close
  setTimeout(() => {
    document.addEventListener('click', outsideClickHandler, { once: true });
  }, 0);
}

function closePanel() {
  if (!panelOpen) return;
  panelOpen = false;
  panelEl?.remove();
  panelEl = null;
}

function refreshPanel() {
  if (!panelOpen || !panelEl) return;
  panelEl.innerHTML = renderPanel();
  attachPanelHandlers();
}

function attachPanelHandlers() {
  panelEl?.querySelectorAll('[data-action="notif-open"]').forEach(btn =>
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      notifications.markRead(id);
      const path = btn.dataset.path;
      closePanel();
      if (path) navigate(path);
      refreshBell();
    })
  );
  panelEl?.querySelectorAll('[data-action="notif-read-all"]').forEach(btn =>
    btn.addEventListener('click', (e) => { e.stopPropagation(); notifications.markAllRead(); refreshPanel(); refreshBell(); })
  );
  panelEl?.querySelectorAll('[data-action="notif-clear"]').forEach(btn =>
    btn.addEventListener('click', (e) => { e.stopPropagation(); if (confirm('Effacer toutes les notifications ?')) { notifications.clear(); refreshPanel(); refreshBell(); } })
  );
  // Prevent panel clicks from closing the panel
  panelEl?.querySelector('.notif-panel')?.addEventListener('click', (e) => e.stopPropagation());
}

function outsideClickHandler() {
  closePanel();
}

function refreshBell() {
  if (!bellEl) return;
  const count = notifications.unreadCount();
  bellEl.dataset.count = count;
  const badge = bellEl.querySelector('.notif-bell__badge');
  if (count > 0) {
    if (badge) badge.textContent = count > 9 ? '9+' : String(count);
    else {
      const span = document.createElement('span');
      span.className = 'notif-bell__badge';
      span.textContent = count > 9 ? '9+' : String(count);
      bellEl.appendChild(span);
    }
  } else if (badge) {
    badge.remove();
  }
}

export function setupNotificationsBell() {
  bellEl = document.createElement('button');
  bellEl.className = 'notif-bell';
  bellEl.setAttribute('aria-label', 'Notifications');
  bellEl.title = 'Notifications';
  bellEl.innerHTML = bellSVG(20);
  bellEl.addEventListener('click', (e) => {
    e.stopPropagation();
    fx.click();
    if (panelOpen) closePanel();
    else openPanel();
  });
  document.body.appendChild(bellEl);
  refreshBell();

  // Refresh bell when notifications list changes (any store change re-checks)
  store.subscribe(() => {
    refreshBell();
    if (panelOpen) refreshPanel();
  });
}
