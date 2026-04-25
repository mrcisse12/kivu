import { icons } from '../components/icons.js';

const PARTICIPANTS = [
  { avatar: '👨🏾‍💼', flag: '🇨🇮', lang: 'Dioula' },
  { avatar: '👩🏾‍💼', flag: '🇸🇳', lang: 'Wolof' },
  { avatar: '🧑🏾‍💼', flag: '🇰🇪', lang: 'Swahili' },
  { avatar: '👨🏿‍💼', flag: '🇳🇬', lang: 'Yoruba' }
];

const UPCOMING = [
  { time: '14:00',         title: 'Conseil d’administration', count: 6, flags: ['🇨🇮','🇸🇳','🇰🇪'] },
  { time: '16:30',         title: 'Négociation fournisseur',  count: 3, flags: ['🇲🇱','🇳🇪'] },
  { time: 'Demain 09:00',  title: 'Consultation médicale',    count: 2, flags: ['🇧🇫','🇫🇷'] }
];

const TEMPLATES = [
  { emoji: '💼', title: 'Réunion business',         color: 'var(--kivu-secondary)' },
  { emoji: '🏥', title: 'Consultation médicale',     color: 'var(--error)' },
  { emoji: '🌐', title: 'Négociation diplomatique',  color: 'var(--kivu-primary)' },
  { emoji: '🎓', title: 'Cours académique',          color: 'var(--kivu-accent)' }
];

export function renderMultiParty() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(89,128,235,0.15); color:var(--color-multiparty);">
          ${icons.multiparty(28)}
        </span>
        <div>
          <div class="screen-title">Multi-Party</div>
          <div class="screen-subtitle">Réunions en toutes les langues, simultanément</div>
        </div>
      </div>
    </div>

    <div class="grid grid-2 mb-md">
      <button class="btn btn-cta" style="background:var(--color-multiparty); color:white;">
        <span class="btn-cta__icon">${icons.camera(20, 'white')}</span>
        Nouvelle réunion
      </button>
      <button class="btn btn-cta btn-cta--ghost" style="background:rgba(89,128,235,0.12); color:var(--color-multiparty);">
        <span class="btn-cta__icon">${icons.share(20)}</span>
        Rejoindre
      </button>
    </div>

    <!-- Active meeting -->
    <div class="card mb-md meeting-card meeting-card--live">
      <div class="flex items-center gap-xs mb-sm">
        <span class="badge-live">En cours</span>
        <span class="text-xs text-muted" style="margin-left:auto">04:23</span>
      </div>
      <div class="font-bold text-md mb-sm">Fusion Amani × KIVU</div>

      <div class="participants-stack mb-sm">
        ${PARTICIPANTS.map(p => `
          <span class="participant" title="${p.lang}">
            <span class="participant__avatar">${p.avatar}</span>
            <span class="participant__flag">${p.flag}</span>
          </span>
        `).join('')}
        <span class="participant participant--more">+3</span>
        <button class="btn btn-primary btn-sm" style="margin-left:auto; background:var(--color-multiparty);">Rejoindre</button>
      </div>

      <div class="flex items-center gap-xs flex-wrap">
        ${PARTICIPANTS.map(p => `<span class="lang-flag-sm">${p.flag}</span>`).join('')}
        <span class="lang-flag-sm">🇬🇭</span>
        <span class="lang-flag-sm">🇲🇱</span>
        <span class="text-xs" style="color:var(--color-multiparty); margin-left:auto;">7 langues simultanées</span>
      </div>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Prochaines réunions</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${UPCOMING.map(m => `
        <div class="list-row meeting-row">
          <div class="meeting-time">${m.time}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${m.title}</div>
            <div class="text-xs text-muted">${m.flags.join(' ')} · ${m.count} participants</div>
          </div>
          <span class="text-tertiary">${icons.chevronRight(18)}</span>
        </div>
      `).join('')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Modèles rapides</h2>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${TEMPLATES.map(t => `
          <button class="card template-card" aria-label="${t.title}">
            <span class="template-emoji" style="color:${t.color};">${t.emoji}</span>
            <div class="font-semibold text-sm">${t.title}</div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}
