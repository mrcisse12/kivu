const TABS = [
  { path: '/', icon: '🏠', label: 'Accueil' },
  { path: '/translate', icon: '🎙️', label: 'Traduire' },
  { path: '/learn', icon: '🎓', label: 'Apprendre' },
  { path: '/preserve', icon: '🛡️', label: 'Préserver' },
  { path: '/profile', icon: '👤', label: 'Profil' }
];

export function renderBottomNav(currentPath) {
  return `
    <nav class="bottom-nav">
      ${TABS.map(tab => {
        const isActive = currentPath === tab.path || (tab.path === '/' && currentPath === '/home');
        return `
          <button class="bottom-nav-item ${isActive ? 'active' : ''}" data-nav="${tab.path}">
            <span class="nav-icon">${tab.icon}</span>
            <span>${tab.label}</span>
          </button>
        `;
      }).join('')}
    </nav>
  `;
}
