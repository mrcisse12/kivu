import { store } from '../store.js';

export function renderAccessibility() {
  const prefs = store.get('preferences');
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span style="width:56px;height:56px;border-radius:50%;background:rgba(153,115,77,0.15);color:var(--color-accessibility);display:flex;align-items:center;justify-content:center;font-size:24px">♿</span>
        <div>
          <div class="screen-title">Accessibilité</div>
          <div class="screen-subtitle">KIVU pour tous, sans exception</div>
        </div>
      </div>
    </div>

    <div class="hero-card mb-md" style="background:linear-gradient(135deg,var(--color-accessibility) 0%,#C79774 100%);">
      <span class="chip chip-white mb-sm">🌐 Inclusion universelle</span>
      <div class="text-2xl font-bold mt-xs">KIVU = 100% accessible</div>
      <div class="grid grid-3 mt-md">
        <div><div class="font-bold text-lg">1,3B</div><div class="text-xs" style="opacity:0.85">Handicaps</div></div>
        <div><div class="font-bold text-lg">540M</div><div class="text-xs" style="opacity:0.85">Malvoyants</div></div>
        <div><div class="font-bold text-lg">430M</div><div class="text-xs" style="opacity:0.85">Sourds</div></div>
      </div>
    </div>

    ${renderGroup('👁️ Vision', [
      { label: 'Contraste élevé', icon: '◐', key: 'highContrast', value: prefs.highContrast },
      { label: 'Description audio', icon: '🔊', key: 'audioDescription', value: false },
      { label: 'Taille du texte', icon: 'Aa', slider: true, value: prefs.fontSize, key: 'fontSize' }
    ])}

    ${renderGroup('👂 Audition', [
      { label: 'Sous-titres automatiques', icon: '📝', value: true, disabled: true },
      { label: 'Langue des signes', icon: '🤟', value: false },
      { label: 'Transcription directe', icon: '💬', value: true, disabled: true }
    ])}

    ${renderGroup('🦽 Mobilité', [
      { label: 'Contrôle vocal', icon: '🎙️', value: true },
      { label: 'Actions simplifiées', icon: '👆', value: false },
      { label: 'Navigation 1 main', icon: '🤚', value: false }
    ])}

    ${renderGroup('📶 Connectivité', [
      { label: 'Mode 2G/3G', icon: '📡', value: true, disabled: true },
      { label: 'Mode hors-ligne', icon: '📵', value: true, disabled: true },
      { label: 'Économie de données', icon: '⚡', value: true, disabled: true }
    ])}
  `;
}

function renderGroup(title, rows) {
  return `
    <div class="card mb-md">
      <div class="font-bold text-lg mb-sm">${title}</div>
      ${rows.map(r => `
        <div class="flex items-center gap-sm" style="padding:10px 0;border-top:1px solid var(--divider)">
          <span style="width:28px;color:var(--color-accessibility);text-align:center">${r.icon}</span>
          <span style="flex:1">${r.label}</span>
          ${r.slider
            ? `<input type="range" min="0.75" max="2" step="0.25" value="${r.value}" style="width:120px"/>
               <span class="text-xs text-muted">${r.value}x</span>`
            : `<label class="toggle" style="position:relative;width:44px;height:24px;background:${r.value?'var(--color-accessibility)':'#ccc'};border-radius:999px;display:inline-block;">
                 <span style="position:absolute;top:2px;left:${r.value?'22px':'2px'};width:20px;height:20px;background:white;border-radius:50%;transition:left 0.2s"></span>
               </label>`}
        </div>
      `).join('')}
    </div>
  `;
}
