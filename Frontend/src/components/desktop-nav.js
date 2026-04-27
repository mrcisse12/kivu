import { icons } from './icons.js';
import { t }     from '../i18n/index.js';
import { store } from '../store.js';

function navItems() {
  return [
    { path: '/',              icon: icons.home,          label: t('nav.home') },
    { path: '/translate',     icon: icons.translate,     label: t('nav.translate') },
    { path: '/learn',         icon: icons.learn,         label: t('nav.learn') },
    { path: '/preserve',      icon: icons.preserve,      label: t('nav.preserve') },
    { path: '/business',      icon: icons.business,      label: t('nav.business') },
    { path: '/multi-party',   icon: icons.multiparty,    label: t('nav.multiparty') },
    { path: '/assistant',     icon: icons.assistant,     label: t('nav.assistant') },
    { path: '/stories',       icon: icons.book,          label: t('nav.stories') },
    { path: '/dictionary',    icon: icons.search,        label: 'Dictionnaire' },
    { path: '/diaspora',      icon: icons.diaspora,      label: t('nav.diaspora') },
    { path: '/accessibility', icon: icons.accessibility, label: t('nav.accessibility') },
    { path: '/radio',         icon: icons.speaker,       label: t('nav.radio') },
    { path: '/profile',       icon: icons.profile,       label: t('nav.profile') }
  ];
}

function renderNavUserCard() {
  const user = store.get('user');
  if (!user || user.guest) {
    return `
      <button class="nav-user-card nav-user-card--guest" data-nav="/login">
        ${icons.profile(18)}
        <span class="text-sm font-semibold">Se connecter</span>
      </button>
    `;
  }
  const xpPct = Math.round(Math.min(100,
    ((user.stats?.xp || 0) / (user.stats?.nextLevelXP || 500)) * 100
  ));
  return `
    <button class="nav-user-card" data-nav="/profile" aria-label="Mon profil">
      <div class="nav-user-card__avatar">${user.avatar || '🧑🏾'}</div>
      <div class="nav-user-card__body">
        <div class="nav-user-card__name">${(user.name || 'KIVU').split(' ')[0]}</div>
        <div class="nav-user-card__xp">
          <div class="nav-xp-bar">
            <div class="nav-xp-fill" style="width:${xpPct}%"></div>
          </div>
          <span class="text-xs" style="color:var(--kivu-accent); font-weight:700;">Niv. ${user.stats?.level || 1}</span>
        </div>
      </div>
      <span class="nav-streak">🔥${user.stats?.streak || 0}</span>
    </button>
  `;
}

export function renderDesktopNav(currentPath) {
  return `
    <aside class="desktop-nav" aria-label="Navigation">
      <div class="brand">
        <span class="brand-logo" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <defs>
              <linearGradient id="brand-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="#174E9C"/>
                <stop offset="0.55" stop-color="#3395DA"/>
                <stop offset="1" stop-color="#F2952D"/>
              </linearGradient>
            </defs>
            <path d="M6 4h4v10l8-10h5l-8 10 9 14h-5l-7-11-2 2v9H6V4z" fill="url(#brand-grad)"/>
          </svg>
        </span>
        <span class="brand-text">${t('app.name')}</span>
      </div>
      <div class="brand-tagline">${t('app.tagline')}</div>

      <div class="nav-section-label">${t('nav.home')}</div>
      ${navItems().map(item => {
        const isActive = currentPath === item.path || (item.path === '/' && currentPath === '/home');
        return `
          <button class="desktop-nav-item ${isActive ? 'active' : ''}"
                  data-nav="${item.path}"
                  aria-current="${isActive ? 'page' : 'false'}">
            <span class="nav-icon" aria-hidden="true">${item.icon(20)}</span>
            <span class="nav-label">${item.label}</span>
          </button>
        `;
      }).join('')}

      <!-- User card at bottom -->
      <div class="desktop-nav-footer">
        ${renderNavUserCard()}
        <div class="text-xs text-muted" style="text-align:center; padding-top:8px;">
          v2.0 — Science Fest Africa 2026
        </div>
      </div>
    </aside>
  `;
}
