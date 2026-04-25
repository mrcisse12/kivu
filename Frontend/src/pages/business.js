import { icons } from '../components/icons.js';
import { api } from '../services/api.js';

const SERVICES = [
  { emoji: '💬', title: 'Négociation en direct', desc: 'Multi-participants traduits', color: 'var(--kivu-primary)' },
  { emoji: '📄', title: 'Contrats traduits',     desc: 'Documents légaux',           color: 'var(--kivu-secondary)' },
  { emoji: '🎧', title: 'Service client',        desc: '200+ langues',               color: 'var(--kivu-accent)' },
  { emoji: '📢', title: 'Marketing localisé',    desc: 'Campagnes adaptées',         color: 'var(--kivu-tertiary)' }
];

const PRODUCTS = [
  { emoji: '🍫', name: 'Cacao bio',         seller: 'Aminata',   flag: '🇨🇮', price: '2 500 FCFA/kg', lang: 'Dioula → Français' },
  { emoji: '🎨', name: 'Tissu Kente',        seller: 'Kofi',      flag: '🇬🇭', price: '15 000 FCFA',   lang: 'Ewe → Anglais' },
  { emoji: '☕', name: 'Café éthiopien',     seller: 'Dawit',     flag: '🇪🇹', price: '8 000 FCFA/kg', lang: 'Amharique → Swahili' }
];

const CONTRACTS = [
  { title: 'Vente Cacao — Nigeria',          status: 'Signé',          date: '12 avril', color: 'var(--success)' },
  { title: 'Partenariat Tech — Kenya',       status: 'En négociation', date: '18 avril', color: 'var(--warning)' },
  { title: 'Distribution — Sénégal',         status: 'Brouillon',      date: '20 avril', color: 'var(--info)' }
];

let eoqResult = null;
let eoqLoading = false;
let eoqError = null;

export function renderBusiness() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(45,158,115,0.15); color:var(--kivu-secondary);">
          ${icons.business(28)}
        </span>
        <div>
          <div class="screen-title">Business</div>
          <div class="screen-subtitle">Commerce sans frontières linguistiques</div>
        </div>
      </div>
    </div>

    <div class="hero-card grad-savanna mb-md" style="position:relative; overflow:hidden;">
      <span class="orb orb--green" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.4"></span>
      <div style="position:relative;z-index:1;">
        <h3 class="font-bold text-lg mb-xs">Déverrouillez le commerce africain</h3>
        <p class="text-sm" style="opacity:0.92;">$200 B/an d'opportunités perdues à cause des barrières linguistiques. KIVU les libère.</p>
        <div class="grid grid-3 mt-md">
          <div><div class="font-bold text-lg">+$5 B</div><div class="text-xs" style="opacity:0.85">Commerce an 1</div></div>
          <div><div class="font-bold text-lg">54</div><div class="text-xs" style="opacity:0.85">Pays</div></div>
          <div><div class="font-bold text-lg">500 K</div><div class="text-xs" style="opacity:0.85">Entreprises</div></div>
        </div>
      </div>
    </div>

    <!-- EOQ live demo -->
    <div class="card mb-md eoq-card">
      <div class="section-head mb-sm">
        <h2 class="font-display font-bold text-lg">Calculateur EOQ</h2>
        <span class="chip chip-primary">Wilson · backend Python</span>
      </div>
      <p class="text-xs text-muted mb-sm">
        Quantité économique de commande optimale pour minimiser vos coûts de stock.
      </p>
      <div class="grid grid-3 mb-sm eoq-inputs">
        <label class="form-group">
          <span class="form-label">Demande / an</span>
          <input id="eoq-demand" class="form-input" type="number" value="1000" min="1"/>
        </label>
        <label class="form-group">
          <span class="form-label">Coût commande</span>
          <input id="eoq-ordering" class="form-input" type="number" value="50" min="0"/>
        </label>
        <label class="form-group">
          <span class="form-label">Coût stockage</span>
          <input id="eoq-holding" class="form-input" type="number" value="2" min="0.01" step="0.01"/>
        </label>
      </div>
      <button class="btn btn-primary btn-full" data-action="run-eoq">
        ${eoqLoading ? 'Calcul en cours…' : 'Calculer la quantité optimale'}
      </button>

      ${eoqError ? `<div class="text-xs mt-sm" style="color:var(--error);">${eoqError}</div>` : ''}
      ${eoqResult ? renderEoqResult(eoqResult) : ''}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Services entreprise</h2>
    <div class="grid grid-2 mb-md">
      ${SERVICES.map(s => `
        <div class="feature-tile">
          <div class="feature-icon" style="background:${s.color}1a; color:${s.color};">
            <span aria-hidden="true">${s.emoji}</span>
          </div>
          <div class="feature-title">${s.title}</div>
          <div class="feature-desc">${s.desc}</div>
        </div>
      `).join('')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Marketplace sans frontières</h2>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${PRODUCTS.map(p => `
          <div class="card product-card">
            <div class="product-card__media">${p.emoji}</div>
            <div class="font-bold">${p.name}</div>
            <div class="text-xs text-muted">${p.seller} <span class="lang-flag-sm">${p.flag}</span></div>
            <div class="font-bold mt-xs" style="color:var(--kivu-secondary);">${p.price}</div>
            <div class="text-xs mt-xs" style="color:var(--kivu-primary);">${p.lang}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Mes contrats récents</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${CONTRACTS.map(c => `
        <div class="list-row">
          <div class="avatar" style="background:${c.color}22; color:${c.color};">${icons.archive(20)}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${c.title}</div>
            <div class="text-xs" style="color:${c.color};">${c.status}</div>
          </div>
          <div class="text-xs text-muted">${c.date}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderEoqResult(r) {
  const total = r.totalAnnualCost ?? r.totalCost;
  return `
    <div class="eoq-result mt-sm animate-scale-in">
      <div class="eoq-metric">
        <div class="eoq-metric__value">${r.eoq?.toFixed(1) ?? '—'}</div>
        <div class="eoq-metric__label">Quantité optimale</div>
      </div>
      <div class="eoq-metric">
        <div class="eoq-metric__value">${r.ordersPerYear?.toFixed(2) ?? '—'}</div>
        <div class="eoq-metric__label">Commandes / an</div>
      </div>
      <div class="eoq-metric">
        <div class="eoq-metric__value">${total != null ? total.toFixed(0) : '—'}</div>
        <div class="eoq-metric__label">Coût total annuel</div>
      </div>
    </div>
    ${r.cycleDays != null ? `<div class="text-xs text-muted mt-xs">Cycle : 1 commande tous les ${r.cycleDays.toFixed(0)} jours</div>` : ''}
  `;
}

renderBusiness.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  document.querySelectorAll('[data-action="run-eoq"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const d  = Number(document.getElementById('eoq-demand')?.value);
      const oc = Number(document.getElementById('eoq-ordering')?.value);
      const hc = Number(document.getElementById('eoq-holding')?.value);
      if (!d || !oc || !hc) {
        eoqError = 'Tous les champs doivent être > 0.';
        rerender();
        return;
      }
      eoqLoading = true; eoqError = null; rerender();
      try {
        const data = await api.post('/economics/eoq', {
          annualDemand: d,
          orderingCost: oc,
          holdingCost: hc
        });
        eoqResult = data;
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`EOQ optimale : ${data.eoq?.toFixed(1)} unités`, { type: 'success' });
        }
      } catch (err) {
        // Fallback: calcul local Wilson si backend indispo
        eoqResult = wilsonLocal(d, oc, hc);
        eoqError = 'Backend hors-ligne — calcul local utilisé';
      } finally {
        eoqLoading = false;
        rerender();
      }
    })
  );

  function rerender() {
    main.innerHTML = renderBusiness();
    renderBusiness.mount();
  }
};

// Wilson: EOQ = sqrt(2 D S / H)
function wilsonLocal(D, S, H) {
  const eoq = Math.sqrt((2 * D * S) / H);
  const ordersPerYear = D / eoq;
  const totalAnnualCost = (D / eoq) * S + (eoq / 2) * H;
  return { eoq, ordersPerYear, totalAnnualCost };
}
