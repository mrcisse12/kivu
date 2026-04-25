import { icons } from './icons.js';

const TABS = [
  { path: '/',         icon: icons.home,      label: 'Accueil' },
  { path: '/translate', icon: icons.translate, label: 'Traduire' },
  { path: '/learn',    icon: icons.learn,     label: 'Apprendre' },
  { path: '/preserve', icon: icons.preserve,  label: 'Préserver' },
  { path: '/profile',  icon: icons.profile,   label: 'Profil' }
];

export function renderBottomNav(currentPath) {
  return `
    <nav class="bottom-nav glass" aria-label="Navigation principale">
      ${TABS.map(tab => {
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
