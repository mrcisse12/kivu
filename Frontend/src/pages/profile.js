import { store } from '../store.js';

export function renderProfile() {
  const user = store.get('user');
  return `
    <div class="screen-header">
      <div class="screen-title">Profil</div>
    </div>

    <!-- Profile card -->
    <div class="card mb-md" style="text-align:center;padding:28px;">
      <div style="width:108px;height:108px;margin:0 auto 12px;border-radius:50%;background:var(--grad-hero);display:flex;align-items:center;justify-content:center;position:relative">
        <div style="width:96px;height:96px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:60px">${user.avatar}</div>
        <span style="position:absolute;bottom:4px;right:4px;width:28px;height:28px;border-radius:50%;background:white;color:var(--kivu-primary);display:flex;align-items:center;justify-content:center">✓</span>
      </div>
      <div class="font-display font-bold text-xl">${user.name}</div>
      <div class="text-sm text-muted">${user.countryFlag} ${user.country} · Polyglotte KIVU</div>
      <div class="flex gap-xs justify-center mt-md">
        <button class="btn btn-ghost" style="padding:8px 16px;font-size:13px">✏️ Modifier</button>
        <button class="btn btn-ghost" style="padding:8px 16px;font-size:13px">↗️ Partager</button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-3 mb-md">
      ${statCard(user.stats.streak, 'Jours', '🔥', 'var(--error)')}
      ${statCard(user.learningLanguages.length + 1, 'Langues', '🌍', 'var(--kivu-primary)')}
      ${statCard(user.stats.xp.toLocaleString('fr-FR'), 'XP', '⭐', 'var(--kivu-accent)')}
      ${statCard(user.stats.badgesCount, 'Badges', '🏅', 'var(--kivu-secondary)')}
      ${statCard(user.stats.contributionsCount, 'Contribs', '❤️', 'var(--kivu-tertiary)')}
      ${statCard('#' + user.stats.rank, 'Rang', '📊', 'var(--info)')}
    </div>

    <!-- Subscription card -->
    <div class="hero-card grad-sunset mb-md">
      <div class="flex justify-between items-center mb-sm">
        <span class="chip chip-white">👑 KIVU PRO</span>
        <span class="text-xs" style="opacity:0.9">30 jours restants</span>
      </div>
      <div class="font-bold text-lg">Accès illimité, offline, 8 fonctionnalités</div>
      <div class="flex justify-between items-center mt-md">
        <span class="text-sm" style="opacity:0.9">5 000 FCFA / mois</span>
        <button class="btn btn-white" style="padding:8px 16px;font-size:13px">Gérer</button>
      </div>
    </div>

    <!-- My Languages -->
    <div class="card mb-md">
      <div class="flex justify-between items-center mb-sm">
        <div class="font-bold">🌍 Mes langues</div>
        <button class="icon-btn" style="background:rgba(23,78,156,0.1);color:var(--kivu-primary);width:32px;height:32px">➕</button>
      </div>
      <div class="scroll-x">
        <div class="scroll-x-row">
          ${[user.preferredLanguage, user.motherTongue, ...user.learningLanguages].filter(Boolean).map(id => {
            const flag = { fra: '🇫🇷', eng: '🇬🇧', swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', dyu: '🇨🇮' }[id] || '🌍';
            const name = { fra: 'Français', eng: 'Anglais', swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula' }[id] || id;
            return `<div style="min-width:80px;text-align:center;padding:12px;background:var(--bg);border-radius:var(--r-md)"><div style="font-size:32px">${flag}</div><div class="text-xs font-semibold">${name}</div></div>`;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Settings menu -->
    <div class="flex flex-col gap-xs">
      ${menuItem('🔔 Notifications', 'var(--kivu-primary)')}
      ${menuItem('🔐 Confidentialité & sécurité', 'var(--success)')}
      ${menuItem('♿ Accessibilité', 'var(--color-accessibility)', '/accessibility')}
      ${menuItem('🌐 Langue de l\'app', 'var(--kivu-accent)')}
      ${menuItem('💾 Stockage & hors-ligne', 'var(--kivu-tertiary)')}
      ${menuItem('❓ Aide & support', 'var(--info)')}
      ${menuItem('ℹ️ À propos de KIVU', 'var(--kivu-secondary)')}
    </div>
  `;
}

function statCard(value, label, icon, color) {
  return `
    <div class="stat-card" style="text-align:center">
      <div style="color:${color};font-size:18px">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function menuItem(label, color, path) {
  return `
    <button class="list-row" ${path ? `data-nav="${path}"` : ''} style="width:100%;text-align:left">
      <span style="width:44px;height:44px;border-radius:50%;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center">${label.split(' ')[0]}</span>
      <span style="flex:1">${label.split(' ').slice(1).join(' ')}</span>
      <span class="text-muted">›</span>
    </button>
  `;
}
