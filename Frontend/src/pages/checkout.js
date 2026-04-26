/**
 * KIVU — Checkout pour passer à un plan payant.
 *
 * Multi-providers (sandbox/mock) : Wave, Orange Money, MTN MoMo,
 * carte bancaire, PayPal, Apple Pay, Google Pay.
 *
 * Pas de credentials externes — l'objectif est de démontrer le flux
 * complet : choix du plan → choix du moyen → saisie minimale → confirmation.
 *
 * URL : /checkout/<plan-id>
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';

const PLANS = {
  starter: { id: 'starter', name: 'KIVU Starter', price: 2000,  period: 'mois', accent: '#1CB0F6', emoji: '⚡' },
  pro:     { id: 'pro',     name: 'KIVU Pro',     price: 5000,  period: 'mois', accent: '#FF9600', emoji: '👑' },
  family:  { id: 'family',  name: 'KIVU Family',  price: 10000, period: 'mois', accent: '#8C40AD', emoji: '👨‍👩‍👧‍👦' }
};

const METHODS = [
  // Mobile Money — priorité Afrique
  {
    id: 'wave', name: 'Wave', region: 'Afrique de l\'Ouest',
    color: '#1DCDFE', textColor: '#003E5F',
    fields: [{ id: 'phone', label: 'Numéro Wave', placeholder: '+221 77 123 45 67', type: 'tel' }],
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="20" fill="#1DCDFE"/>
      <path d="M8 22 Q12 14 16 22 T24 22 T32 22" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
    </svg>`
  },
  {
    id: 'orange', name: 'Orange Money', region: 'Sénégal · Côte d\'Ivoire · Mali',
    color: '#FF7900', textColor: 'white',
    fields: [{ id: 'phone', label: 'Numéro Orange', placeholder: '+221 77 123 45 67', type: 'tel' }],
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#FF7900"/>
      <text x="20" y="25" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="14" font-weight="900" fill="white">OM</text>
    </svg>`
  },
  {
    id: 'mtn', name: 'MTN MoMo', region: 'Cameroun · Nigeria · Ouganda',
    color: '#FFCC00', textColor: '#003F69',
    fields: [{ id: 'phone', label: 'Numéro MTN', placeholder: '+237 6 12 34 56 78', type: 'tel' }],
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#FFCC00"/>
      <text x="20" y="25" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="13" font-weight="900" fill="#003F69">MTN</text>
    </svg>`
  },
  {
    id: 'card', name: 'Carte bancaire', region: 'Visa · Mastercard',
    color: '#1A1F71', textColor: 'white',
    fields: [
      { id: 'number',  label: 'Numéro de carte', placeholder: '4242 4242 4242 4242', type: 'text', maxlength: 19 },
      { id: 'expiry',  label: 'Expiration',      placeholder: 'MM/AA',                type: 'text', maxlength: 5,  half: true },
      { id: 'cvc',     label: 'CVC',             placeholder: '123',                  type: 'text', maxlength: 4,  half: true }
    ],
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="#1A1F71"/>
      <rect x="6" y="14" width="28" height="3" fill="#F7B600"/>
      <rect x="6" y="22" width="14" height="2" fill="white" opacity="0.5"/>
    </svg>`
  },
  {
    id: 'paypal', name: 'PayPal', region: 'International',
    color: '#003087', textColor: 'white',
    fields: [{ id: 'email', label: 'Email PayPal', placeholder: 'vous@exemple.com', type: 'email' }],
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="white" stroke="#E0E0E8"/>
      <text x="20" y="25" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="11" font-weight="900" fill="#003087">PayPal</text>
    </svg>`
  },
  {
    id: 'apple', name: 'Apple Pay', region: 'Tap to pay',
    color: '#000', textColor: 'white',
    fields: [],   // biometric mock
    biometric: true,
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="black"/>
      <path d="M22 15c-1 0-2 .5-2.5 1.3-.5-.5-1.4-1.3-2.5-1.3-1.5 0-3 1.2-3 3.2 0 2 1.8 5 4 6.8.3.3 1.7 1 2 1 .3 0 1.7-.7 2-1 2.2-1.8 4-4.8 4-6.8 0-2-1.5-3.2-3-3.2zm-1.3-2c.5-.6.6-1.5.6-1.7 0-.1-.6 0-1.2.6-.5.5-.7 1.3-.6 1.6.1.1.7-.1 1.2-.5z" fill="white"/>
    </svg>`
  },
  {
    id: 'google', name: 'Google Pay', region: 'Tap to pay',
    color: '#fff', textColor: '#3C4043',
    fields: [],
    biometric: true,
    iconRender: () => `<svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="6" fill="white" stroke="#E0E0E8"/>
      <path d="M20 14a6 6 0 1 0 5.66 8h-5.66v-2.5h7.86c.07.4.14.8.14 1.25 0 4.27-2.86 7.31-7.16 7.31-4.13 0-7.5-3.36-7.5-7.5s3.37-7.5 7.5-7.5c2.02 0 3.71.74 5.02 1.96l-1.71 1.71c-.6-.55-1.7-1.23-3.31-1.23a4.86 4.86 0 0 0 0 9.71c2.84 0 4.04-1.86 4.27-3.21h-4.27v-2.5h6.85" fill="#4285F4"/>
    </svg>`
  }
];

let plan = null;
let methodId = 'wave';
let formValues = {};
let busy = false;
let success = false;
let error = null;

function ensureLoaded() {
  const id = window.location.hash.split('/')[2];
  if (!id) return false;
  if (plan?.id !== id) {
    plan = PLANS[id] || null;
    methodId = 'wave';
    formValues = {};
    busy = false;
    success = false;
    error = null;
  }
  return !!plan;
}

export function renderCheckout() {
  if (!ensureLoaded()) {
    return `
      <div class="empty-state">
        <span class="empty-state__emoji">😔</span>
        <div class="empty-state__title">Plan introuvable</div>
        <button class="btn btn-primary mt-md" data-action="checkout-cancel">Retour aux abonnements</button>
      </div>
    `;
  }

  if (success) return renderSuccess();

  const method = METHODS.find(m => m.id === methodId) || METHODS[0];

  return `
    <div class="screen-header">
      <button class="icon-btn icon-btn--bell" data-action="checkout-cancel" aria-label="Retour">
        ${icons.arrowLeft(20)}
      </button>
      <div>
        <div class="screen-title">Finaliser</div>
        <div class="screen-subtitle">Paiement sécurisé · annulez à tout moment</div>
      </div>
    </div>

    <!-- Plan summary -->
    <div class="card mb-md checkout-summary" style="border:2px solid ${plan.accent}; border-bottom:4px solid ${plan.accent};">
      <div class="checkout-summary__head">
        <span class="checkout-summary__emoji" style="background:${plan.accent}1f;">${plan.emoji}</span>
        <div style="flex:1;">
          <div class="text-xs text-muted">Vous passez à</div>
          <div class="font-display font-bold text-lg">${plan.name}</div>
        </div>
        <div class="text-right">
          <div class="font-display font-bold" style="font-size:24px; color:${plan.accent};">${plan.price.toLocaleString('fr-FR')}</div>
          <div class="text-xs text-muted">FCFA / ${plan.period}</div>
        </div>
      </div>
      <div class="checkout-summary__perks">
        ${planPerks(plan.id).map(p => `
          <div class="checkout-perk">${icons.check(14, plan.accent)} ${p}</div>
        `).join('')}
      </div>
    </div>

    <!-- Method picker -->
    <h2 class="font-display font-bold text-lg mb-sm">Moyen de paiement</h2>
    <div class="checkout-methods mb-md">
      ${METHODS.map(m => `
        <button class="checkout-method ${methodId === m.id ? 'active' : ''}"
                data-action="set-method" data-id="${m.id}"
                aria-label="${m.name}">
          <span class="checkout-method__icon">${m.iconRender()}</span>
          <div class="checkout-method__body">
            <div class="font-bold text-sm">${m.name}</div>
            <div class="text-xs text-muted">${m.region}</div>
          </div>
          ${methodId === m.id ? `<span class="checkout-method__check">${icons.check(16, 'white')}</span>` : ''}
        </button>
      `).join('')}
    </div>

    <!-- Form -->
    <div class="card mb-md">
      <div class="font-bold mb-sm">${method.biometric ? 'Confirmation' : 'Détails ' + method.name}</div>
      ${method.biometric ? `
        <div class="checkout-biometric">
          <div class="checkout-biometric__icon" style="background:${method.color}; color:${method.textColor};">
            ${method.id === 'apple' ? '🆔' : '👆'}
          </div>
          <div class="text-sm text-muted text-center mt-sm">
            ${method.id === 'apple'
              ? 'Confirmez avec Face ID ou Touch ID'
              : 'Confirmez avec votre empreinte'}
          </div>
        </div>
      ` : `
        <div class="checkout-form">
          ${method.fields.map(f => `
            <label class="form-group ${f.half ? 'form-group--half' : ''}">
              <span class="form-label">${f.label}</span>
              <input class="form-input"
                     name="${f.id}"
                     type="${f.type || 'text'}"
                     placeholder="${f.placeholder || ''}"
                     ${f.maxlength ? `maxlength="${f.maxlength}"` : ''}
                     value="${escapeAttr(formValues[f.id] || '')}"
                     data-action="checkout-field" data-id="${f.id}"
                     autocomplete="off"/>
            </label>
          `).join('')}
        </div>
      `}

      ${error ? `<div class="login-error mt-sm">${escapeHtml(error)}</div>` : ''}

      <button class="btn btn-primary btn-full mt-md"
              data-action="confirm-payment"
              ${busy ? 'disabled' : ''}
              style="background:${plan.accent}; border-bottom-color:${darken(plan.accent)};">
        ${busy ? 'Traitement…' : `Payer ${plan.price.toLocaleString('fr-FR')} FCFA`}
      </button>
    </div>

    <!-- Trust bar -->
    <div class="checkout-trust mb-lg">
      ${icons.lock(16)} Paiement chiffré · Données jamais stockées · Annulation 1 clic
    </div>
  `;
}

function renderSuccess() {
  return `
    <div class="checkout-success">
      <div class="checkout-success__mascot animate-scale-in">${mascot.cheering(160)}</div>
      <h1 class="font-display font-bold" style="font-size:32px;">Bienvenue dans ${plan.name} !</h1>
      <p class="text-sm text-muted mt-xs" style="max-width:340px;">
        Votre abonnement est actif. Toutes les fonctionnalités premium sont débloquées.
      </p>

      <div class="checkout-success__rewards">
        <div class="reward-card">
          <div class="reward-icon" style="background:rgba(255,150,0,0.15); color:#FF9600;">⭐</div>
          <div class="font-bold text-lg">+500</div>
          <div class="text-xs text-muted">XP bonus</div>
        </div>
        <div class="reward-card">
          <div class="reward-icon" style="background:rgba(28,176,246,0.15); color:#1CB0F6;">♾️</div>
          <div class="font-bold text-lg">∞</div>
          <div class="text-xs text-muted">Vies</div>
        </div>
        <div class="reward-card">
          <div class="reward-icon" style="background:rgba(140,64,173,0.15); color:#8C40AD;">📚</div>
          <div class="font-bold text-lg">2 000+</div>
          <div class="text-xs text-muted">Langues</div>
        </div>
      </div>

      <div class="flex gap-xs mt-lg" style="width:100%; max-width:340px;">
        <button class="btn btn-ghost btn-full" data-action="view-receipt">Voir le reçu</button>
        <button class="btn btn-primary btn-full" data-action="back-home"
                style="background:${plan.accent}; border-bottom-color:${darken(plan.accent)};">
          Commencer
        </button>
      </div>
    </div>
  `;
}

function planPerks(id) {
  if (id === 'starter') return ['Traduction illimitée', '3 langues', 'Mode hors-ligne', 'Sans publicité'];
  if (id === 'pro')     return ['Famille 5 personnes', 'AI Tutor', 'Cérémonies & savoir', 'Service prioritaire'];
  if (id === 'family')  return ['Famille 10 personnes', 'Outils enseignement', 'Archive privée', 'Heritage Pass'];
  return [];
}

function darken(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, r - 38); g = Math.max(0, g - 38); b = Math.max(0, b - 38);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function rerender() {
  const main = document.querySelector('main.screen');
  if (main) main.innerHTML = renderCheckout();
  renderCheckout.mount();
}

function validate(method) {
  if (method.biometric) return true;
  for (const f of method.fields) {
    const v = (formValues[f.id] || '').trim();
    if (!v) {
      error = `${f.label} est requis`;
      return false;
    }
    if (f.id === 'phone' && !/^\+?\d[\d\s]{7,}$/.test(v)) {
      error = 'Numéro de téléphone invalide';
      return false;
    }
    if (f.id === 'number' && v.replace(/\s/g,'').length < 12) {
      error = 'Numéro de carte invalide';
      return false;
    }
    if (f.id === 'expiry' && !/^\d{2}\/\d{2}$/.test(v)) {
      error = 'Format MM/AA attendu';
      return false;
    }
    if (f.id === 'cvc' && !/^\d{3,4}$/.test(v)) {
      error = 'CVC invalide';
      return false;
    }
    if (f.id === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      error = 'Email invalide';
      return false;
    }
  }
  return true;
}

renderCheckout.mount = () => {
  document.querySelectorAll('[data-action="checkout-cancel"]').forEach(btn =>
    btn.addEventListener('click', () => navigate('/settings'))
  );

  document.querySelectorAll('[data-action="set-method"]').forEach(btn =>
    btn.addEventListener('click', () => {
      methodId = btn.dataset.id;
      formValues = {};
      error = null;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="checkout-field"]').forEach(input =>
    input.addEventListener('input', () => {
      formValues[input.dataset.id] = input.value;
    })
  );

  document.querySelectorAll('[data-action="confirm-payment"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const method = METHODS.find(m => m.id === methodId);
      error = null;
      if (!validate(method)) {
        rerender();
        return;
      }
      busy = true; rerender();

      // Simulate processing — 1.2 → 2.5 seconds depending on method
      const delay = method.biometric ? 900 : 1800;
      setTimeout(() => {
        // Activate the subscription on the user
        const u = store.get('user');
        store.set('user', { ...u, subscription: plan.id });
        // Bonus XP
        store.set('user', {
          ...store.get('user'),
          stats: { ...store.get('user').stats, xp: store.get('user').stats.xp + 500 }
        });
        // Save the receipt
        const receipts = store.get('receipts') || [];
        receipts.push({
          id: 'rcp_' + Date.now(),
          plan: plan.id,
          planName: plan.name,
          amount: plan.price,
          method: method.name,
          date: new Date().toISOString()
        });
        store.set('receipts', receipts);
        success = true;
        busy = false;
        rerender();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`🎉 ${plan.name} activé !`, { type: 'success' });
        }
      }, delay);
    })
  );

  document.querySelectorAll('[data-action="back-home"]').forEach(btn =>
    btn.addEventListener('click', () => navigate('/'))
  );

  document.querySelectorAll('[data-action="view-receipt"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const receipts = store.get('receipts') || [];
      const last = receipts[receipts.length - 1];
      if (last && window.__KIVU__?.toast) {
        window.__KIVU__.toast(`Reçu ${last.id} · ${last.amount.toLocaleString('fr-FR')} FCFA via ${last.method}`, { type: 'info', duration: 4000 });
      }
    })
  );
};
