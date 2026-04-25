import { icons } from '../components/icons.js';

const FAMILY = ['👵🏾','👴🏾','👨🏾','👩🏾','🧒🏾','👶🏾'];
const CITIES = [
  { flag: '🇫🇷', city: 'Paris' },
  { flag: '🇸🇳', city: 'Dakar' },
  { flag: '🇨🇮', city: 'Abidjan' },
  { flag: '🇺🇸', city: 'New York' }
];

const STORIES = [
  { avatar: '👴🏾', title: 'L\'histoire du village',         author: 'Grand-père Moussa', lang: 'Bambara', duration: '1 h 17 min' },
  { avatar: '👵🏾', title: 'Le conte du lièvre rusé',         author: 'Grand-mère Awa',   lang: 'Wolof',    duration: '22 min' },
  { avatar: '👩🏾‍🍳', title: 'Recette du Thieboudienne',      author: 'Tante Fatou',      lang: 'Wolof',    duration: '35 min' }
];

export function renderDiaspora() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(64,179,191,0.15); color:var(--color-diaspora);">
          ${icons.diaspora(28)}
        </span>
        <div>
          <div class="screen-title">Diaspora</div>
          <div class="screen-subtitle">Familles connectées, cultures vivantes</div>
        </div>
      </div>
    </div>

    <div class="hero-card mb-md diaspora-hero" style="position:relative; overflow:hidden;">
      <span class="orb" style="background:#7DD3D8; width:140px;height:140px;top:-50px;right:-30px;opacity:0.4"></span>
      <div style="position:relative; z-index:1;">
        <span class="chip chip-white mb-sm">🌳 Mon arbre familial</span>
        <div class="text-2xl font-bold mt-xs">3 générations · 12 membres</div>
        <div class="family-stack mt-md">
          ${FAMILY.map(e => `<span class="family-avatar">${e}</span>`).join('')}
        </div>
        <div class="family-cities">
          ${CITIES.map(c => `<span class="family-city"><span class="lang-flag-sm">${c.flag}</span> ${c.city}</span>`).join('')}
        </div>
      </div>
    </div>

    <div class="grid grid-2 mb-md">
      <button class="btn btn-cta" style="background:var(--color-diaspora); color:white;">
        <span class="btn-cta__icon">${icons.camera(20, 'white')}</span>
        Appel vidéo
      </button>
      <button class="btn btn-cta btn-cta--ghost" style="background:rgba(64,179,191,0.12); color:var(--color-diaspora);">
        <span class="btn-cta__icon">${icons.mic(20)}</span>
        Message vocal
      </button>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Histoires de famille</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${STORIES.map(s => `
        <div class="list-row">
          <div class="avatar" style="background:rgba(64,179,191,0.15)">${s.avatar}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${s.title}</div>
            <div class="text-xs text-muted">par ${s.author} · ${s.lang}</div>
            <div class="text-xs" style="color:var(--color-diaspora);">${s.duration}</div>
          </div>
          <button class="icon-btn icon-btn--play" aria-label="Écouter">
            ${icons.speaker(20, 'white')}
          </button>
        </div>
      `).join('')}
    </div>

    <div class="card heritage-journey mb-lg">
      <div class="flex items-center gap-xs mb-sm">
        <span class="font-bold">Parcours héritage</span>
        <span class="chip chip-primary" style="margin-left:auto;">30 jours</span>
      </div>
      <p class="text-sm text-muted mb-sm">
        Redécouvrez la langue de vos ancêtres en 30 jours. Recevez contes, proverbes et leçons quotidiennes.
      </p>
      <div class="journey-days mb-md">
        ${[1,2,3,4,5,6,7].map(day => `
          <div class="journey-day">
            <span class="journey-dot ${day <= 3 ? 'done' : day === 4 ? 'current' : ''}">${day <= 3 ? icons.check(14, 'white') : day}</span>
            <span class="text-xs text-muted">J${day}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-full" style="background:var(--color-diaspora);">
        Continuer jour 4
      </button>
    </div>
  `;
}
