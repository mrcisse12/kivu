import { LANGUAGES } from '../data/languages.js';

export function renderPreserve() {
  const endangered = LANGUAGES.filter(l => ['endangered','critical','vulnerable'].includes(l.status));

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Préservation</div>
        <div class="screen-subtitle">L'héritage de l'humanité, éternel</div>
      </div>
    </div>

    <div class="hero-card grad-royal mb-md">
      <span class="chip chip-white mb-sm">🛡️ Mission sacrée</span>
      <div class="text-2xl font-bold mt-xs">483 langues sauvegardées</div>
      <div class="text-sm" style="opacity:0.9; margin-top:6px;">Grâce à 127 000 contributeurs à travers le monde.<br>Chaque voix compte.</div>
      <div class="grid grid-3 mt-md">
        <div><div class="font-bold">1 247</div><div class="text-xs" style="opacity:0.85">h d'audio</div></div>
        <div><div class="font-bold">84K</div><div class="text-xs" style="opacity:0.85">mots</div></div>
        <div><div class="font-bold">317</div><div class="text-xs" style="opacity:0.85">proverbes</div></div>
      </div>
    </div>

    <button class="card mb-md" style="display:flex;width:100%;text-align:left;gap:12px;align-items:center;">
      <span style="width:60px;height:60px;border-radius:50%;background:var(--kivu-tertiary);color:white;display:flex;align-items:center;justify-content:center;font-size:26px;">🎙️</span>
      <div style="flex:1">
        <div class="font-bold">Enregistrer ma langue</div>
        <div class="text-xs text-muted">Partagez histoires, proverbes, chansons</div>
      </div>
      <span style="font-size:28px; color:var(--kivu-tertiary)">➡️</span>
    </button>

    <h2 class="font-display font-bold text-lg mb-sm">Archives culturelles</h2>
    <div class="grid grid-2 mb-lg">
      ${renderCategory('📖', 'Contes & Légendes', 1247, 'var(--kivu-primary)')}
      ${renderCategory('💬', 'Proverbes', 847, 'var(--kivu-tertiary)')}
      ${renderCategory('🎵', 'Chants & Musique', 523, 'var(--kivu-accent)')}
      ${renderCategory('✨', 'Cérémonies', 234, 'var(--kivu-secondary)')}
      ${renderCategory('🌿', 'Savoir médicinal', 156, 'var(--success)')}
      ${renderCategory('⏳', 'Histoire orale', 412, 'var(--info)')}
    </div>

    <div class="flex justify-between items-center mb-sm">
      <h2 class="font-display font-bold text-lg">Langues en péril</h2>
      <span class="chip chip-error">${endangered.length}</span>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${endangered.map(l => `
        <div class="list-row">
          <div class="avatar" style="background:rgba(235,77,77,0.1)">${l.flag}</div>
          <div style="flex:1">
            <div class="font-semibold">${l.name} · <span class="text-xs text-muted">${l.nativeName}</span></div>
            <div class="text-xs" style="color:var(--error)">⚠️ ${l.status === 'critical' ? 'Critique' : l.status === 'endangered' ? 'Menacée' : 'Vulnérable'} — ${(l.speakers/1000).toFixed(0)}K locuteurs</div>
          </div>
          <button class="icon-btn" style="color:var(--kivu-tertiary)">➕</button>
        </div>
      `).join('')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Mon archive familiale</h2>
    <div class="flex flex-col gap-xs">
      ${renderRecord('👵🏾', 'Grand-mère Awa — Contes Wolof', '42 min', '15 mars 2026')}
      ${renderRecord('👴🏾', 'Grand-père Moussa — Histoire village', '1h 17min', '2 fév 2026')}
      ${renderRecord('👨🏾‍🌾', 'Oncle Ibrahim — Proverbes Bambara', '28 min', '12 jan 2026')}
    </div>
  `;
}

function renderCategory(icon, title, count, color) {
  return `
    <button class="feature-tile">
      <div class="feature-icon" style="background:${color}22;color:${color}">${icon}</div>
      <div class="feature-title">${title}</div>
      <div class="feature-desc">${count} contributions</div>
    </button>
  `;
}

function renderRecord(icon, title, duration, date) {
  return `
    <div class="list-row">
      <div class="avatar" style="background:rgba(140,64,173,0.15)">${icon}</div>
      <div style="flex:1">
        <div class="font-semibold text-sm">${title}</div>
        <div class="text-xs text-muted">🕐 ${duration} · ${date}</div>
      </div>
      <button class="icon-btn" style="color:var(--kivu-tertiary); font-size:22px">▶️</button>
    </div>
  `;
}
