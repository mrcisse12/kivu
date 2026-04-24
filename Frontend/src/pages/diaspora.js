export function renderDiaspora() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span style="width:56px;height:56px;border-radius:50%;background:rgba(64,179,191,0.15);color:var(--color-diaspora);display:flex;align-items:center;justify-content:center;font-size:24px">💙</span>
        <div>
          <div class="screen-title">Diaspora</div>
          <div class="screen-subtitle">Familles connectées, cultures vivantes</div>
        </div>
      </div>
    </div>

    <!-- Family tree -->
    <div class="hero-card mb-md" style="background:linear-gradient(135deg,var(--color-diaspora) 0%,var(--kivu-primary-light) 100%);">
      <span class="chip chip-white mb-sm">🌳 Mon arbre familial</span>
      <div class="text-2xl font-bold mt-xs">3 générations · 12 membres</div>
      <div class="flex mt-md">
        ${['👵🏾','👴🏾','👨🏾','👩🏾','🧒🏾','👶🏾'].map((e, i) => `
          <span style="width:44px;height:44px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;font-size:22px;margin-left:${i===0?0:-10}px;border:2px solid white">${e}</span>
        `).join('')}
      </div>
      <div class="text-xs mt-sm" style="opacity:0.9">🇫🇷 Paris · 🇸🇳 Dakar · 🇨🇮 Abidjan · 🇺🇸 New York</div>
    </div>

    <!-- Call actions -->
    <div class="grid grid-2 mb-md">
      <button class="btn" style="background:var(--color-diaspora);color:white;padding:18px 12px;flex-direction:column;">
        <span style="font-size:22px">📹</span>
        <span>Appel vidéo</span>
      </button>
      <button class="btn" style="background:rgba(64,179,191,0.15);color:var(--color-diaspora);padding:18px 12px;flex-direction:column;">
        <span style="font-size:22px">🎙️</span>
        <span>Message vocal</span>
      </button>
    </div>

    <!-- Family stories -->
    <h2 class="font-display font-bold text-lg mb-sm">Histoires de famille</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderStory('👴🏾', 'L\'histoire du village', 'Grand-père Moussa', 'Bambara', '1h 17min')}
      ${renderStory('👵🏾', 'Le conte du lièvre rusé', 'Grand-mère Awa', 'Wolof', '22 min')}
      ${renderStory('👩🏾‍🍳', 'Recette du Thieboudienne', 'Tante Fatou', 'Wolof', '35 min')}
    </div>

    <!-- Heritage journey -->
    <div class="card">
      <div class="flex items-center gap-xs mb-sm">
        <span style="font-size:22px">🗺️</span>
        <span class="font-bold">Parcours héritage</span>
      </div>
      <p class="text-sm text-muted mb-sm">Redécouvrez la langue de vos ancêtres en 30 jours. Recevez des contes, proverbes et leçons quotidiennes.</p>
      <div class="flex gap-xs items-center mb-md">
        ${[1,2,3,4,5,6,7].map(day => `
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
            <span style="width:36px;height:36px;border-radius:50%;background:${day<=3?'var(--color-diaspora)':'var(--bg)'};color:${day<=3?'white':'var(--text-secondary)'};display:flex;align-items:center;justify-content:center;font-weight:600">${day}</span>
            <span class="text-xs text-muted">J${day}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn" style="background:var(--color-diaspora);color:white;width:100%">Continuer jour 4</button>
    </div>
  `;
}

function renderStory(avatar, title, author, lang, duration) {
  return `
    <div class="list-row">
      <div class="avatar" style="background:rgba(64,179,191,0.15)">${avatar}</div>
      <div style="flex:1">
        <div class="font-semibold">${title}</div>
        <div class="text-xs text-muted">par ${author} · ${lang}</div>
        <div class="text-xs" style="color:var(--color-diaspora)">🌊 ${duration}</div>
      </div>
      <button style="font-size:28px;color:var(--color-diaspora)">▶️</button>
    </div>
  `;
}
