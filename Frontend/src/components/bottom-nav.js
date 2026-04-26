import { icons } from './icons.js';
import { t } from '../i18n/index.js';

function tabs() {
  return [
    { path: '/',          icon: icons.home,      label: t('nav.home') },
    { path: '/translate', icon: icons.translate, label: t('nav.translate') },
    { path: '/learn',     icon: icons.learn,     label: t('nav.learn') },
    { path: '/preserve',  icon: icons.preserve,  label: t('nav.preserve') },
    { path: '/profile',   icon: icons.profile,   label: t('nav.profile') }
  ];
}

export function renderBottomNav(currentPath) {
  return `
    <nav class="bottom-nav glass" aria-label="Navigation">
      ${tabs().map(tab => {
        const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '/home');
        return `
          <button class="bottom-nav-item ${isActive ? 'active' : ''}"
                  data-nav="${tab.path}"
                  aria-current="${isActive ? 'page' : 'false'}"
                  aria-label="${tab.label}">
            <span class="nav-icon" aria-hidden="true">${tab.icon(22)}</span>
            <span class="nav-label">${tab.label}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
