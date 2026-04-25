import { LANGUAGES } from '../data/languages.js';
import { icons } from '../components/icons.js';

const CATEGORIES = [
  { emoji: '📖', title: 'Contes & légendes', count: 1247, color: 'var(--kivu-primary)' },
  { emoji: '💬', title: 'Proverbes',         count: 847,  color: 'var(--kivu-tertiary)' },
  { emoji: '🎵', title: 'Chants & musique',  count: 523,  color: 'var(--kivu-accent)' },
  { emoji: '✨', title: 'Cérémonies',         count: 234,  color: 'var(--kivu-secondary)' },
  { emoji: '🌿', title: 'Savoir médicinal',  count: 156,  color: 'var(--success)' },
  { emoji: '⏳', title: 'Histoire orale',    count: 412,  color: 'var(--info)' }
];

const RECORDINGS = [
  { avatar: '👵🏾', title: 'Grand-mère Awa — Contes Wolof',       duration: '42 min',     date: '15 mars 2026' },
  { avatar: '👴🏾', title: 'Grand-père Moussa — Histoire village', duration: '1 h 17 min', date: '2 fév 2026' },
  { avatar: '👨🏾‍🌾', title: 'Oncle Ibrahim — Proverbes Bambara',  duration: '28 min',     date: '12 jan 2026' }
];

export function renderPreserve() {
  const endangered = LANGUAGES.filter(l => ['endangered','critical','vulnerable'].includes(l.status));

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Préservation</div>
        <div class="screen-subtitle">L'héritage de l'humanité, éternel</div>
      </div>
    </div>

    <div class="hero-card grad-royal mb-md" style="position:relative; overflow:hidden;">
      <span class="orb orb--purple" style="width:160px;height:160px;top:-60px;right:-40px;opacity:0.4"></span>
      <div style="position:relative;z-index:1;">
        <span class="chip chip-white mb-sm">Mission sacrée</span>
        <div class="text-2xl font-bold mt-xs" data-counter="483">483</div>
        <div class="text-sm mt-xs" style="opacity:0.92;">langues sauvegardées</div>
        <div class="text-xs mt-xs" style="opacity:0.78;">Grâce à 127 000 contributeurs à travers le monde.</div>
        <div class="grid grid-3 mt-md preserve-stats">
          <div><div class="font-bold text-lg">1 247</div><div class="text-xs" style="opacity:0.85">h d'audio</div></div>
          <div><div class="font-bold text-lg">84 K</div><div class="text-xs" style="opacity:0.85">mots</div></div>
          <div><div class="font-bold text-lg">317</div><div class="text-xs" style="opacity:0.85">proverbes</div></div>
        </div>
      </div>
    </div>

    <button class="card featured-action mb-md">
      <span class="featured-action__icon" style="background:var(--kivu-tertiary); box-shadow:0 6px 16px rgba(140,64,173,0.32);">
        ${icons.mic(28, 'white')}
      </span>
      <div class="featured-action__body">
        <div class="font-bold">Enregistrer ma langue</div>
        <div class="text-xs text-muted">Partagez histoires, proverbes, chansons</div>
      </div>
      <span class="featured-action__arrow">${icons.chevronRight(20)}</span>
    </button>

    <h2 class="font-display font-bold text-lg mb-sm">Archives culturelles</h2>
    <div class="grid grid-2 mb-lg">
      ${CATEGORIES.map(c => `
        <button class="feature-tile">
          <div class="feature-icon" style="background:${c.color}1a; color:${c.color};">
            <span aria-hidden="true">${c.emoji}</span>
          </div>
          <div class="feature-title">${c.title}</div>
          <div class="feature-desc">${c.count} contributions</div>
        </button>
      `).join('')}
    </div>

    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Langues en péril</h2>
      <span class="chip chip-error">${endangered.length} langues</span>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${endangered.map(l => `
        <div class="list-row endangered-row">
          <div class="avatar avatar--endangered">${l.flag}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${l.name} <span class="text-xs text-muted">· ${l.nativeName}</span></div>
            <div class="text-xs text-status">
              ${statusLabel(l.status)} — ${(l.speakers/1000).toFixed(0)} K locuteurs
            </div>
          </div>
          <button class="icon-btn icon-btn--sm" style="color:var(--kivu-tertiary);" aria-label="Contribuer">
            ${icons.plus(20)}
          </button>
        </div>
      `).join('')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Mon archive familiale</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${RECORDINGS.map(r => `
        <div class="list-row">
          <div class="avatar" style="background:rgba(140,64,173,0.15);">${r.avatar}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold text-sm">${r.title}</div>
            <div class="text-xs text-muted">${r.duration} · ${r.date}</div>
          </div>
          <button class="icon-btn icon-btn--sm" style="color:var(--kivu-tertiary);" aria-label="Lire">
            ${icons.speaker(18)}
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function statusLabel(s) {
  if (s === 'critical')   return 'Critique';
  if (s === 'endangered') return 'Menacée';
  return 'Vulnérable';
}
