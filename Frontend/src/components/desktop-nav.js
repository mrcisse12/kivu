const NAV_ITEMS = [
  { path: '/', icon: '🏠', label: 'Accueil' },
  { path: '/translate', icon: '🎙️', label: 'Traduction' },
  { path: '/learn', icon: '🎓', label: 'Apprentissage' },
  { path: '/preserve', icon: '🛡️', label: 'Préservation' },
  { path: '/business', icon: '💼', label: 'Business' },
  { path: '/multi-party', icon: '👥', label: 'Multi-Party' },
  { path: '/assistant', icon: '✨', label: 'Assistant IA' },
  { path: '/diaspora', icon: '💙', label: 'Diaspora' },
  { path: '/accessibility', icon: '♿', label: 'Accessibilité' },
  { path: '/profile', icon: '👤', label: 'Profil' }
];

export function renderDesktopNav(currentPath) {
  return `
    <aside class="desktop-nav">
      <div class="brand">KIVU</div>
      ${NAV_ITEMS.map(item => {
        const isActive = currentPath === item.path || (item.path === '/' && currentPath === '/home');
        return `
          <button class="desktop-nav-item ${isActive ? 'active' : ''}" data-nav="${item.path}">
            <span>${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `;
      }).join('')}
    </aside>
  `;
}
