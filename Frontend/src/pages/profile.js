import { store } from '../store.js';
import { icons } from '../components/icons.js';

const LANG_INFO = {
  fra: { flag: '🇫🇷', name: 'Français' },
  eng: { flag: '🇬🇧', name: 'Anglais' },
  swa: { flag: '🇹🇿', name: 'Swahili' },
  wol: { flag: '🇸🇳', name: 'Wolof' },
  bam: { flag: '🇲🇱', name: 'Bambara' },
  dyu: { flag: '🇨🇮', name: 'Dioula' },
  hau: { flag: '🇳🇬', name: 'Haoussa' },
  yor: { flag: '🇳🇬', name: 'Yoruba' }
};

const MENU = [
  { label: 'Paramètres généraux',         icon: icons.settings,    color: 'var(--kivu-primary)',         path: '/settings' },
  { label: 'Apparence & thème',           icon: icons.eye,         color: 'var(--kivu-tertiary)',        path: '/settings' },
  { label: 'Abonnement KIVU',             icon: icons.star,        color: 'var(--kivu-accent)',          path: '/settings' },
  { label: 'Notifications',               icon: icons.bell,        color: 'var(--info)',                 path: '/settings' },
  { label: 'Accessibilité',               icon: icons.accessibility, color: 'var(--color-accessibility)', path: '/accessibility' },
  { label: 'Hors-ligne & stockage',       icon: icons.archive,     color: 'var(--kivu-secondary)',       path: '/settings' },
  { label: 'Confidentialité & sécurité',  icon: icons.lock,        color: 'var(--success)',              path: '/settings' },
  { label: 'À propos de KIVU',            icon: icons.heart,       color: 'var(--error)',                path: '/settings' }
];

export function renderProfile() {
  const user = store.get('user');
  const langs = [user.preferredLanguage, user.motherTongue, ...(user.learningLanguages || [])]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return `
    <div class="screen-header">
      <div class="screen-title">Profil</div>
      <button class="icon-btn icon-btn--bell" data-nav="/settings" aria-label="Paramètres">
        ${icons.settings(20)}
      </button>
    </div>

    <!-- Profile card -->
    <div class="card profile-card mb-md">
      <div class="profile-avatar-wrap">
        <div class="profile-avatar">${user.avatar}</div>
        <span class="profile-verify" aria-label="Compte vérifié">${icons.check(16, 'white')}</span>
      </div>
      <div class="font-display font-bold text-xl">${user.name}</div>
      <div class="text-sm text-muted">
        <span class="lang-flag-sm">${user.countryFlag}</span> ${user.country} · Polyglotte KIVU
      </div>
      <div class="flex gap-xs justify-center mt-md">
        <button class="btn btn-ghost btn-sm">Modifier le profil</button>
        <button class="btn btn-ghost btn-sm">${icons.share(16)} Partager</button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-3 mb-md">
      ${statCard(user.stats.streak, 'Jours', '🔥', 'var(--error)')}
      ${statCard((user.learningLanguages?.length || 0) + 1, 'Langues', '🌍', 'var(--kivu-primary)')}
      ${statCard(user.stats.xp.toLocaleString('fr-FR'), 'XP', '⭐', 'var(--kivu-accent)')}
      ${statCard(user.stats.badgesCount, 'Badges', '🏅', 'var(--kivu-secondary)')}
      ${statCard(user.stats.contributionsCount, 'Contributions', '❤️', 'var(--kivu-tertiary)')}
      ${statCard('#' + user.stats.rank, 'Rang', '📊', 'var(--info)')}
    </div>

    <!-- Subscription card -->
    <div class="hero-card grad-sunset mb-md" style="position:relative; overflow:hidden;">
      <span class="orb orb--accent" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.3"></span>
      <div style="position:relative; z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <span class="chip chip-white">👑 KIVU PRO</span>
          <span class="text-xs" style="opacity:0.92">30 jours restants</span>
        </div>
        <div class="font-bold text-lg">Accès illimité, hors-ligne, 8 fonctionnalités</div>
        <div class="flex justify-between items-center mt-md">
          <span class="text-sm" style="opacity:0.92">5 000 FCFA / mois</span>
          <button class="btn btn-white btn-sm">Gérer</button>
        </div>
      </div>
    </div>

    <!-- My Languages -->
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Mes langues</div>
        <button class="icon-btn icon-btn--sm" style="color:var(--kivu-primary);" aria-label="Ajouter une langue">
          ${icons.plus(18)}
        </button>
      </div>
      <div class="scroll-x">
        <div class="scroll-x-row">
          ${langs.map(id => {
            const info = LANG_INFO[id] || { flag: '🌍', name: id };
            return `
              <div class="lang-mini">
                <div class="lang-mini__flag">${info.flag}</div>
                <div class="text-xs font-semibold">${info.name}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Settings menu -->
    <div class="flex flex-col gap-xs mb-lg">
      ${MENU.map(m => `
        <button class="list-row menu-item" ${m.path ? `data-nav="${m.path}"` : ''}>
          <span class="menu-icon" style="background:${m.color}1a; color:${m.color};">${m.icon(20)}</span>
          <span style="flex:1">${m.label}</span>
          <span class="text-tertiary">${icons.chevronRight(18)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function statCard(value, label, emoji, color) {
  return `
    <div class="stat-card" style="text-align:center;">
      <div class="stat-emoji" style="color:${color};" aria-hidden="true">${emoji}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}
