import { store } from '../store.js';
import { icons } from '../components/icons.js';

const GROUPS = [
  {
    title: 'Vision',
    icon: icons.eye,
    color: 'var(--kivu-primary)',
    rows: [
      { label: 'Contraste élevé',     icon: '◐',  key: 'highContrast' },
      { label: 'Description audio',   icon: '🔊', key: 'audioDescription' },
      { label: 'Taille du texte',     icon: 'Aa', key: 'fontSize', slider: true, min: 0.75, max: 2, step: 0.25, defaultValue: 1 }
    ]
  },
  {
    title: 'Audition',
    icon: icons.ear,
    color: 'var(--kivu-secondary)',
    rows: [
      { label: 'Sous-titres automatiques', icon: '📝', key: 'autoCaptions',     locked: true },
      { label: 'Langue des signes',         icon: '🤟', key: 'signLanguage' },
      { label: 'Transcription en direct',   icon: '💬', key: 'liveTranscript', locked: true }
    ]
  },
  {
    title: 'Mobilité',
    icon: icons.hand,
    color: 'var(--kivu-accent)',
    rows: [
      { label: 'Contrôle vocal',          icon: '🎙️', key: 'voiceControl' },
      { label: 'Actions simplifiées',     icon: '👆', key: 'simpleActions' },
      { label: 'Navigation à une main',   icon: '🤚', key: 'oneHandNav' }
    ]
  },
  {
    title: 'Connectivité',
    icon: icons.signal,
    color: 'var(--kivu-tertiary)',
    rows: [
      { label: 'Mode 2G/3G',           icon: '📡', key: 'low2g3g',        locked: true },
      { label: 'Mode hors-ligne',       icon: '📵', key: 'offline',        locked: true },
      { label: 'Économie de données',   icon: '⚡', key: 'dataSaver',      locked: true }
    ]
  }
];

export function renderAccessibility() {
  const prefs = store.get('preferences') || {};

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(153,115,77,0.15); color:var(--color-accessibility);">
          ${icons.accessibility(28)}
        </span>
        <div>
          <div class="screen-title">Accessibilité</div>
          <div class="screen-subtitle">KIVU pour tous, sans exception</div>
        </div>
      </div>
    </div>

    <div class="hero-card mb-md a11y-hero" style="position:relative; overflow:hidden;">
      <span class="orb" style="background:#C79774; width:140px;height:140px;top:-50px;right:-30px;opacity:0.3"></span>
      <div style="position:relative; z-index:1;">
        <span class="chip chip-white mb-sm">Inclusion universelle</span>
        <div class="text-2xl font-bold mt-xs">100% accessible</div>
        <div class="grid grid-3 mt-md">
          <div><div class="font-bold text-lg">1,3 B</div><div class="text-xs" style="opacity:0.85">Handicaps</div></div>
          <div><div class="font-bold text-lg">540 M</div><div class="text-xs" style="opacity:0.85">Malvoyants</div></div>
          <div><div class="font-bold text-lg">430 M</div><div class="text-xs" style="opacity:0.85">Sourds</div></div>
        </div>
      </div>
    </div>

    ${GROUPS.map(g => renderGroup(g, prefs)).join('')}
  `;
}

function renderGroup(g, prefs) {
  return `
    <div class="card mb-md a11y-group">
      <div class="flex items-center gap-xs mb-sm">
        <span class="a11y-group__icon" style="color:${g.color}; background:${g.color}1f;">${g.icon(20)}</span>
        <div class="font-bold text-lg">${g.title}</div>
      </div>
      ${g.rows.map(r => renderRow(r, g.color, prefs)).join('')}
    </div>
  `;
}

function renderRow(r, color, prefs) {
  const value = prefs[r.key] ?? r.defaultValue ?? false;

  if (r.slider) {
    return `
      <div class="a11y-row">
        <span class="a11y-row__icon" style="color:${color};">${r.icon}</span>
        <span class="a11y-row__label">${r.label}</span>
        <input type="range" min="${r.min}" max="${r.max}" step="${r.step}"
               value="${value}" class="a11y-slider"
               data-action="a11y-slider" data-key="${r.key}"
               aria-label="${r.label}"/>
        <span class="text-xs text-muted" style="width:36px; text-align:right;">${value}x</span>
      </div>
    `;
  }

  const isOn = !!value || r.locked;
  return `
    <div class="a11y-row">
      <span class="a11y-row__icon" style="color:${color};">${r.icon}</span>
      <span class="a11y-row__label">${r.label}</span>
      ${r.locked ? '<span class="chip chip-success">Activé</span>' : ''}
      <button class="toggle-switch ${isOn ? 'on' : ''} ${r.locked ? 'is-locked' : ''}"
              data-action="a11y-toggle" data-key="${r.key}"
              aria-pressed="${isOn}" aria-label="${r.label}"
              ${r.locked ? 'disabled' : ''}>
        <span class="toggle-switch__thumb"></span>
      </button>
    </div>
  `;
}

renderAccessibility.mount = () => {
  const main = document.querySelector('main.screen');

  document.querySelectorAll('[data-action="a11y-toggle"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, [key]: !prefs[key] });
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`Préférence "${key}" mise à jour`, { type: 'success', duration: 1500 });
      }
    })
  );

  document.querySelectorAll('[data-action="a11y-slider"]').forEach(input =>
    input.addEventListener('change', () => {
      const key = input.dataset.key;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, [key]: Number(input.value) });
    })
  );
};
