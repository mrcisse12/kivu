export function renderBusiness() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span style="width:56px;height:56px;border-radius:50%;background:rgba(45,158,115,0.15);color:var(--kivu-secondary);display:flex;align-items:center;justify-content:center;font-size:24px">💼</span>
        <div>
          <div class="screen-title">Business</div>
          <div class="screen-subtitle">Commerce sans frontières linguistiques</div>
        </div>
      </div>
    </div>

    <div class="hero-card grad-savanna mb-md">
      <h3 class="font-bold text-lg mb-xs">Déverrouillez le commerce africain</h3>
      <p class="text-sm" style="opacity:0.9">$200B/an d'opportunités perdues à cause des barrières. KIVU les libère.</p>
      <div class="grid grid-3 mt-md">
        <div><div class="font-bold text-lg">+$5B</div><div class="text-xs" style="opacity:0.85">Commerce an 1</div></div>
        <div><div class="font-bold text-lg">54</div><div class="text-xs" style="opacity:0.85">Pays</div></div>
        <div><div class="font-bold text-lg">500K</div><div class="text-xs" style="opacity:0.85">Entreprises</div></div>
      </div>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Services Entreprise</h2>
    <div class="grid grid-2 mb-md">
      ${renderService('💬', 'Négociation en direct', 'Multi-participants traduits', 'var(--kivu-primary)')}
      ${renderService('📄', 'Contrats traduits', 'Documents légaux', 'var(--kivu-secondary)')}
      ${renderService('🎧', 'Service client', '200+ langues', 'var(--kivu-accent)')}
      ${renderService('📢', 'Marketing localisé', 'Campagnes adaptées', 'var(--kivu-tertiary)')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Marketplace sans frontières</h2>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${renderProduct('🍫', 'Cacao bio', 'Aminata — 🇨🇮', '2 500 FCFA/kg', 'Dioula → Français')}
        ${renderProduct('🎨', 'Tissu Kente', 'Kofi — 🇬🇭', '15 000 FCFA', 'Ewe → Anglais')}
        ${renderProduct('☕', 'Café éthiopien', 'Dawit — 🇪🇹', '8 000 FCFA/kg', 'Amharique → Swahili')}
      </div>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Mes contrats récents</h2>
    <div class="flex flex-col gap-xs">
      ${renderContract('Vente Cacao — Nigeria', 'Signé', '12 avril', 'var(--success)', '📄')}
      ${renderContract('Partenariat Tech — Kenya', 'En négociation', '18 avril', 'var(--warning)', '📄')}
      ${renderContract('Distribution — Sénégal', 'Brouillon', '20 avril', 'var(--info)', '📄')}
    </div>
  `;
}

function renderService(icon, title, desc, color) {
  return `
    <div class="feature-tile">
      <div class="feature-icon" style="background:${color}22;color:${color}">${icon}</div>
      <div class="feature-title">${title}</div>
      <div class="feature-desc">${desc}</div>
    </div>
  `;
}

function renderProduct(emoji, name, seller, price, lang) {
  return `
    <div class="card" style="min-width:200px">
      <div style="height:120px; background:var(--bg); border-radius:var(--r-md); display:flex; align-items:center; justify-content:center; font-size:60px; margin-bottom:8px">${emoji}</div>
      <div class="font-bold">${name}</div>
      <div class="text-xs text-muted">${seller}</div>
      <div class="font-bold" style="color:var(--kivu-secondary); margin-top:4px">${price}</div>
      <div class="text-xs text-primary mt-xs">↔️ ${lang}</div>
    </div>
  `;
}

function renderContract(title, status, date, color, icon) {
  return `
    <div class="list-row">
      <div class="avatar" style="background:${color}22; color:${color}">${icon}</div>
      <div style="flex:1">
        <div class="font-semibold">${title}</div>
        <div class="text-xs" style="color:${color}">${status}</div>
      </div>
      <div class="text-xs text-muted">${date}</div>
    </div>
  `;
}
