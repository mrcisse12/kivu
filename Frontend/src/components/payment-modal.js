/**
 * KIVU — Payment modal premium.
 *
 * Flux complet :
 *   1. Choix de la méthode (Mobile Money, carte, etc.)
 *   2. Saisie des infos (numéro de téléphone OU carte)
 *   3. Confirmation du montant + bouton "Payer"
 *   4. Écran "Traitement…" (3-4s simulation réaliste)
 *   5. Écran "Paiement confirmé" avec détails
 *
 * Usage :
 *   import { openPaymentModal } from './payment-modal.js';
 *   const result = await openPaymentModal({
 *     amount: 45000,
 *     currency: 'FCFA',
 *     description: '3 articles · livraison incluse'
 *   });
 *   // result = { success: true, methodId: 'orange_money',
 *   //            phone: '...', maskedDisplay: '...', txId: 'TX...' }
 *   // ou null si annulé
 */

import { fx } from '../services/audio-fx.js';
import {
  PAYMENT_METHODS,
  getMethod,
  groupedMethods,
  formatPhone,
  maskedPhone,
  isValidPhone,
  isValidCard
} from '../data/payment-methods.js';

let currentResolve = null;
let backdropEl = null;
let step = 'select'; // 'select' | 'enter' | 'processing' | 'success'
let selectedMethodId = null;
let phoneValue = '';
let cardValue = '';
let cardExpiry = '';
let cardCvv = '';
let cardError = '';
let context = { amount: 0, currency: 'FCFA', description: '' };

/* ─── Helpers ─────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmt(amount) {
  return `${(amount || 0).toLocaleString('fr-FR')} ${context.currency || 'FCFA'}`;
}

function genTxId() {
  return 'TX' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
}

/* ─── Public API ──────────────────────────────────────── */

/**
 * Open the payment modal. Returns a Promise that resolves with the
 * payment details on success, or null if the user cancelled.
 */
export function openPaymentModal({ amount, currency = 'FCFA', description = '' } = {}) {
  return new Promise(resolve => {
    currentResolve = resolve;
    context = { amount, currency, description };
    step = 'select';
    selectedMethodId = null;
    phoneValue = '';
    cardValue = '';
    cardExpiry = '';
    cardCvv = '';
    cardError = '';
    mount();
  });
}

function mount() {
  if (backdropEl) {
    backdropEl.remove();
    backdropEl = null;
  }
  backdropEl = document.createElement('div');
  backdropEl.className = 'pay-backdrop';
  document.body.appendChild(backdropEl);
  render();
  requestAnimationFrame(() => backdropEl.classList.add('is-open'));
  attachHandlers();
}

function render() {
  if (!backdropEl) return;
  backdropEl.innerHTML = renderStep();
  attachHandlers();
}

function renderStep() {
  if (step === 'select')      return renderSelectStep();
  if (step === 'enter')       return renderEnterStep();
  if (step === 'processing')  return renderProcessingStep();
  if (step === 'success')     return renderSuccessStep();
  return '';
}

/* ─── Step 1: select method ───────────────────────────── */

function renderSelectStep() {
  const groups = groupedMethods();
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true" aria-label="Choisir un moyen de paiement">
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-modal__amount">${fmt(context.amount)}</div>
        <div class="pay-modal__desc">${escapeHtml(context.description || 'Paiement KIVU')}</div>
      </div>

      <div class="pay-demo-pill">
        🧪 <strong>Mode démo</strong> · Aucun argent n'est prélevé
      </div>

      ${groups.map(g => `
        <div class="pay-group">
          <div class="pay-group__head">
            <div class="font-bold">${escapeHtml(g.title)}</div>
            ${g.subtitle ? `<div class="text-xs text-muted">${escapeHtml(g.subtitle)}</div>` : ''}
          </div>
          <div class="pay-methods">
            ${g.methods.map(m => `
              <button class="pay-method" data-action="pay-pick" data-id="${m.id}"
                      style="--m-color: ${m.color};">
                <span class="pay-method__logo" style="background: ${m.color};">
                  ${m.logo}
                </span>
                <div class="pay-method__body">
                  <div class="font-semibold">${escapeHtml(m.label)}</div>
                  <div class="text-xs text-muted">${escapeHtml(m.desc)}</div>
                  <div class="pay-method__countries">
                    ${(m.countries || []).slice(0, 6).map(c => `<span>${c}</span>`).join('')}
                  </div>
                </div>
                <div class="pay-method__meta">
                  ${m.popular ? '<span class="pay-method__chip pay-method__chip--popular">Populaire</span>' : ''}
                  ${m.instant ? '<span class="pay-method__chip pay-method__chip--instant">Instantané</span>' : ''}
                  <span class="text-xs text-muted">${escapeHtml(m.fees || '')}</span>
                </div>
              </button>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ─── Step 2: enter info ──────────────────────────────── */

function renderEnterStep() {
  const m = getMethod(selectedMethodId);
  if (!m) return renderSelectStep();
  if (m.type === 'mobile_money') return renderPhoneEntry(m);
  if (m.type === 'card')         return renderCardEntry(m);
  if (m.type === 'wallet')       return renderWalletRedirect(m);
  if (m.type === 'crypto')       return renderCryptoEntry(m);
  if (m.type === 'cod')          return renderCodConfirm(m);
  return renderPhoneEntry(m);
}

function renderPhoneEntry(m) {
  const valid = isValidPhone(m, phoneValue);
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <button class="pay-modal__back" data-action="pay-back" aria-label="Retour">←</button>
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-method__logo pay-method__logo--lg" style="background: ${m.color};">
          ${m.logo}
        </div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:8px;">${escapeHtml(m.label)}</div>
        <div class="text-xs text-muted">Paiement instantané · ${escapeHtml(m.fees || 'Sans frais')}</div>
      </div>

      <div class="pay-amount-row">
        <div class="text-xs text-muted">Montant à payer</div>
        <div class="font-display font-bold" style="font-size:1.4rem; color: ${m.color};">${fmt(context.amount)}</div>
      </div>

      <div class="pay-form-group">
        <label class="form-label">Numéro de téléphone</label>
        <div class="pay-phone-input">
          <span class="pay-phone-input__prefix">${m.phonePrefix || '+221'}</span>
          <input id="pay-phone"
                 class="pay-phone-input__field"
                 type="tel"
                 placeholder="${m.phoneFormat || 'XX XXX XX XX'}"
                 value="${escapeHtml(phoneValue)}"
                 inputmode="numeric"
                 autocomplete="tel"
                 maxlength="20"
                 autofocus/>
        </div>
        <div class="text-xs text-muted" style="margin-top:6px;">
          Tu recevras un SMS de confirmation sur ce numéro.
        </div>
      </div>

      <button class="btn btn-full pay-modal__cta ${valid ? '' : 'is-disabled'}"
              data-action="pay-confirm" ${valid ? '' : 'disabled'}
              style="background: ${m.color}; border-color: ${m.color}; color:white;">
        Payer ${fmt(context.amount)}
      </button>

      <div class="pay-secure-row">
        🔒 Paiement sécurisé · 🛡️ Garantie KIVU · 📱 Aucune donnée stockée
      </div>
    </div>
  `;
}

function renderCardEntry(m) {
  const cleanCard = cardValue.replace(/\D/g, '');
  const validCard = isValidCard(cleanCard);
  const validExpiry = /^\d{2}\/\d{2}$/.test(cardExpiry);
  const validCvv = /^\d{3,4}$/.test(cardCvv);
  const allValid = validCard && validExpiry && validCvv;
  const cardBrand = detectCardBrand(cleanCard);

  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <button class="pay-modal__back" data-action="pay-back" aria-label="Retour">←</button>
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-method__logo pay-method__logo--lg" style="background: ${m.color};">
          ${m.logo}
        </div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:8px;">Carte bancaire</div>
        <div class="text-xs text-muted">Sécurisé via Stripe · ${escapeHtml(m.fees)}</div>
      </div>

      <div class="pay-amount-row">
        <div class="text-xs text-muted">Montant à payer</div>
        <div class="font-display font-bold" style="font-size:1.4rem; color: ${m.color};">${fmt(context.amount)}</div>
      </div>

      <div class="pay-card-mockup" style="background: linear-gradient(135deg, #1a1f36 0%, #2d3550 100%);">
        <div class="pay-card-mockup__brand">${cardBrand || '💳'}</div>
        <div class="pay-card-mockup__num">
          ${(cleanCard.padEnd(16, '•').match(/.{1,4}/g) || []).slice(0, 4).join(' ')}
        </div>
        <div class="pay-card-mockup__row">
          <div>
            <div class="pay-card-mockup__lbl">EXP</div>
            <div>${cardExpiry || '••/••'}</div>
          </div>
          <div>
            <div class="pay-card-mockup__lbl">CVV</div>
            <div>${cardCvv ? cardCvv.replace(/./g, '•') : '•••'}</div>
          </div>
        </div>
      </div>

      <div class="pay-form-group">
        <label class="form-label">Numéro de carte</label>
        <input id="pay-card-num" class="form-input" type="text"
               placeholder="1234 5678 9012 3456"
               value="${escapeHtml(cardValue)}"
               inputmode="numeric" maxlength="23"
               autocomplete="cc-number" autofocus/>
      </div>
      <div class="flex gap-sm">
        <div class="pay-form-group" style="flex:1;">
          <label class="form-label">Expiration</label>
          <input id="pay-card-exp" class="form-input" type="text"
                 placeholder="MM/AA"
                 value="${escapeHtml(cardExpiry)}"
                 inputmode="numeric" maxlength="5"
                 autocomplete="cc-exp"/>
        </div>
        <div class="pay-form-group" style="flex:1;">
          <label class="form-label">CVV</label>
          <input id="pay-card-cvv" class="form-input" type="text"
                 placeholder="123"
                 value="${escapeHtml(cardCvv)}"
                 inputmode="numeric" maxlength="4"
                 autocomplete="cc-csc"/>
        </div>
      </div>

      ${cardError ? `<div class="text-xs" style="color:var(--error); margin-top:6px;">${escapeHtml(cardError)}</div>` : ''}

      <button class="btn btn-primary btn-full pay-modal__cta ${allValid ? '' : 'is-disabled'}"
              data-action="pay-confirm" ${allValid ? '' : 'disabled'}>
        Payer ${fmt(context.amount)}
      </button>

      <div class="pay-secure-row">
        🔒 Chiffrement TLS 1.3 · 🛡️ PCI-DSS · 📱 3D Secure
      </div>
    </div>
  `;
}

function detectCardBrand(num) {
  if (/^4/.test(num)) return 'VISA';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'MASTERCARD';
  if (/^3[47]/.test(num)) return 'AMEX';
  if (/^6/.test(num)) return 'VERVE';
  return '';
}

function renderWalletRedirect(m) {
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <button class="pay-modal__back" data-action="pay-back" aria-label="Retour">←</button>
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-method__logo pay-method__logo--lg" style="background: ${m.color};">
          ${m.logo}
        </div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:8px;">${escapeHtml(m.label)}</div>
      </div>

      <div class="pay-amount-row">
        <div class="text-xs text-muted">Montant à payer</div>
        <div class="font-display font-bold" style="font-size:1.4rem; color: ${m.color};">${fmt(context.amount)}</div>
      </div>

      <div class="pay-info-card">
        Tu seras redirigé vers ${escapeHtml(m.label)} pour confirmer le paiement, puis ramené sur KIVU.
      </div>

      <button class="btn btn-full pay-modal__cta"
              data-action="pay-confirm"
              style="background: ${m.color}; color:white; border-color: ${m.color};">
        Continuer vers ${escapeHtml(m.label)} →
      </button>
    </div>
  `;
}

function renderCryptoEntry(m) {
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <button class="pay-modal__back" data-action="pay-back" aria-label="Retour">←</button>
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-method__logo pay-method__logo--lg" style="background: ${m.color};">
          ${m.logo}
        </div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:8px;">Paiement crypto</div>
      </div>

      <div class="pay-amount-row">
        <div class="text-xs text-muted">Montant à payer</div>
        <div class="font-display font-bold" style="font-size:1.4rem; color: ${m.color};">${fmt(context.amount)}</div>
      </div>

      <div class="pay-crypto-grid">
        ${[
          { id: 'usdc', name: 'USDC', emoji: '🟦', net: 'Polygon' },
          { id: 'btc',  name: 'Bitcoin', emoji: '🟠', net: 'Lightning' },
          { id: 'eth',  name: 'Ethereum', emoji: '⚪', net: 'Mainnet' }
        ].map(c => `
          <button class="pay-crypto-card" data-action="pay-confirm" data-crypto="${c.id}">
            <span class="pay-crypto-card__emoji">${c.emoji}</span>
            <div class="font-bold">${c.name}</div>
            <div class="text-xs text-muted">${c.net}</div>
          </button>
        `).join('')}
      </div>

      <div class="text-xs text-muted" style="text-align:center; margin-top:14px;">
        L'adresse + QR code de paiement s'affichera après sélection.
      </div>
    </div>
  `;
}

function renderCodConfirm(m) {
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <button class="pay-modal__back" data-action="pay-back" aria-label="Retour">←</button>
      <button class="pay-modal__close" data-action="pay-cancel" aria-label="Fermer">×</button>

      <div class="pay-modal__head">
        <div class="pay-method__logo pay-method__logo--lg" style="background: ${m.color};">
          ${m.logo}
        </div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:8px;">Cash à la livraison</div>
      </div>

      <div class="pay-amount-row">
        <div class="text-xs text-muted">À payer au livreur</div>
        <div class="font-display font-bold" style="font-size:1.4rem; color: ${m.color};">${fmt(context.amount + 500)}</div>
        <div class="text-xs text-muted">${fmt(context.amount)} + 500 FCFA livraison</div>
      </div>

      <div class="pay-info-card">
        Le livreur encaisse à la remise du colis. Pas de paiement avant. Garantie KIVU 7 jours.
      </div>

      <button class="btn btn-full pay-modal__cta" data-action="pay-confirm"
              style="background: ${m.color}; color:white; border-color:${m.color};">
        Confirmer la commande
      </button>
    </div>
  `;
}

/* ─── Step 3: processing ──────────────────────────────── */

function renderProcessingStep() {
  const m = getMethod(selectedMethodId);
  return `
    <div class="pay-modal" data-stop="true" role="dialog" aria-modal="true">
      <div class="pay-processing">
        <div class="pay-processing__spinner" style="--sp-color: ${m?.color || '#1CB0F6'};"></div>
        <div class="font-display font-bold" style="font-size:1.2rem; margin-top:18px;">Paiement en cours…</div>
        <div class="text-sm text-muted" style="margin-top:6px;">Connexion à ${escapeHtml(m?.label || 'la passerelle')}</div>

        <div class="pay-processing__steps">
          ${[
            'Validation du montant',
            'Authentification',
            'Confirmation du compte',
            'Finalisation'
          ].map((s, i) => `
            <div class="pay-processing__step" style="animation-delay: ${i * 0.6}s;">
              <span class="pay-processing__step-dot"></span>
              <span class="text-sm">${s}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* ─── Step 4: success ─────────────────────────────────── */

function renderSuccessStep() {
  const m = getMethod(selectedMethodId);
  const txId = backdropEl?._kivuTxId || genTxId();
  const display = m?.type === 'mobile_money' && phoneValue
    ? maskedPhone(m, phoneValue)
    : m?.type === 'card' && cardValue
      ? `•••• ${cardValue.replace(/\D/g, '').slice(-4)}`
      : m?.label || '';

  return `
    <div class="pay-modal pay-modal--success" data-stop="true" role="dialog" aria-modal="true">
      <div class="pay-success">
        <div class="pay-success__check">
          <svg viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="${m?.color || '#2D9E73'}" stroke-width="3" class="pay-success__circle"/>
            <path d="M20 32 L29 41 L46 24" stroke="${m?.color || '#2D9E73'}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" class="pay-success__tick"/>
          </svg>
        </div>
        <h2 class="font-display font-bold" style="font-size:1.4rem; margin: 14px 0 6px;">Paiement confirmé !</h2>
        <div class="text-sm text-muted">${fmt(context.amount)}${m?.type === 'cod' ? ' (cash à la livraison)' : ''}</div>

        <div class="pay-receipt">
          <div class="pay-receipt__row">
            <span class="text-xs text-muted">Méthode</span>
            <span class="font-semibold">${escapeHtml(m?.label || '')}</span>
          </div>
          <div class="pay-receipt__row">
            <span class="text-xs text-muted">${m?.type === 'card' ? 'Carte' : m?.type === 'mobile_money' ? 'Numéro' : 'Compte'}</span>
            <span class="font-semibold" style="font-family: ui-monospace, monospace;">${escapeHtml(display)}</span>
          </div>
          <div class="pay-receipt__row">
            <span class="text-xs text-muted">Transaction</span>
            <span class="font-semibold" style="font-family: ui-monospace, monospace; font-size:0.8rem;">${txId}</span>
          </div>
          <div class="pay-receipt__row">
            <span class="text-xs text-muted">Date</span>
            <span class="font-semibold">${new Date().toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <button class="btn btn-primary btn-full pay-modal__cta" data-action="pay-finish">
          Voir ma commande
        </button>
      </div>
    </div>
  `;
}

/* ─── Handlers ────────────────────────────────────────── */

function attachHandlers() {
  if (!backdropEl) return;

  // Close
  backdropEl.querySelectorAll('[data-action="pay-cancel"]').forEach(el =>
    el.addEventListener('click', () => finish(null))
  );
  backdropEl.addEventListener('click', (ev) => {
    if (ev.target === backdropEl && step !== 'processing' && step !== 'success') {
      finish(null);
    }
  });

  // Back
  backdropEl.querySelectorAll('[data-action="pay-back"]').forEach(el =>
    el.addEventListener('click', () => {
      step = 'select';
      fx.click();
      render();
    })
  );

  // Pick method
  backdropEl.querySelectorAll('[data-action="pay-pick"]').forEach(el =>
    el.addEventListener('click', () => {
      selectedMethodId = el.dataset.id;
      step = 'enter';
      fx.click();
      render();
    })
  );

  // Phone input live update
  const phoneInput = backdropEl.querySelector('#pay-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', (ev) => {
      const m = getMethod(selectedMethodId);
      const formatted = formatPhone(m, ev.target.value);
      phoneValue = formatted;
      ev.target.value = formatted;
      // Update CTA enabled state without full rerender
      const cta = backdropEl.querySelector('[data-action="pay-confirm"]');
      const valid = isValidPhone(m, formatted);
      if (cta) {
        cta.classList.toggle('is-disabled', !valid);
        if (valid) cta.removeAttribute('disabled'); else cta.setAttribute('disabled', '');
      }
    });
  }

  // Card inputs
  const cardInput = backdropEl.querySelector('#pay-card-num');
  if (cardInput) {
    cardInput.addEventListener('input', (ev) => {
      const digits = ev.target.value.replace(/\D/g, '').slice(0, 19);
      cardValue = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
      ev.target.value = cardValue;
      cardError = '';
      updateCardCta();
      // Re-render card mockup
      renderCardPreview();
    });
  }
  const expInput = backdropEl.querySelector('#pay-card-exp');
  if (expInput) {
    expInput.addEventListener('input', (ev) => {
      let v = ev.target.value.replace(/\D/g, '').slice(0, 4);
      if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
      cardExpiry = v;
      ev.target.value = v;
      updateCardCta();
      renderCardPreview();
    });
  }
  const cvvInput = backdropEl.querySelector('#pay-card-cvv');
  if (cvvInput) {
    cvvInput.addEventListener('input', (ev) => {
      cardCvv = ev.target.value.replace(/\D/g, '').slice(0, 4);
      ev.target.value = cardCvv;
      updateCardCta();
      renderCardPreview();
    });
  }

  // Confirm payment
  backdropEl.querySelectorAll('[data-action="pay-confirm"]').forEach(el =>
    el.addEventListener('click', startProcessing)
  );

  // Finish
  backdropEl.querySelectorAll('[data-action="pay-finish"]').forEach(el =>
    el.addEventListener('click', () => {
      const m = getMethod(selectedMethodId);
      const display = m?.type === 'mobile_money' && phoneValue
        ? maskedPhone(m, phoneValue)
        : m?.type === 'card' && cardValue
          ? `•••• ${cardValue.replace(/\D/g, '').slice(-4)}`
          : m?.label || '';
      finish({
        success: true,
        methodId: selectedMethodId,
        methodLabel: m?.label || '',
        phone: phoneValue,
        maskedDisplay: display,
        txId: backdropEl?._kivuTxId || genTxId(),
        amount: context.amount,
        currency: context.currency
      });
    })
  );
}

function renderCardPreview() {
  const mockup = backdropEl.querySelector('.pay-card-mockup');
  if (!mockup) return;
  const cleanCard = cardValue.replace(/\D/g, '');
  const numEl = mockup.querySelector('.pay-card-mockup__num');
  if (numEl) {
    numEl.textContent = (cleanCard.padEnd(16, '•').match(/.{1,4}/g) || []).slice(0, 4).join(' ');
  }
  const rows = mockup.querySelectorAll('.pay-card-mockup__row > div > div:last-child');
  if (rows[0]) rows[0].textContent = cardExpiry || '••/••';
  if (rows[1]) rows[1].textContent = cardCvv ? cardCvv.replace(/./g, '•') : '•••';
  // Brand
  const brand = detectCardBrand(cleanCard);
  const brandEl = mockup.querySelector('.pay-card-mockup__brand');
  if (brandEl) brandEl.textContent = brand || '💳';
}

function updateCardCta() {
  const cleanCard = cardValue.replace(/\D/g, '');
  const valid = isValidCard(cleanCard) && /^\d{2}\/\d{2}$/.test(cardExpiry) && /^\d{3,4}$/.test(cardCvv);
  const cta = backdropEl.querySelector('[data-action="pay-confirm"]');
  if (cta) {
    cta.classList.toggle('is-disabled', !valid);
    if (valid) cta.removeAttribute('disabled'); else cta.setAttribute('disabled', '');
  }
}

async function startProcessing() {
  step = 'processing';
  fx.click();
  render();
  // Simulate realistic processing time (3.5s)
  await new Promise(r => setTimeout(r, 3500));
  step = 'success';
  if (backdropEl) backdropEl._kivuTxId = genTxId();
  fx.success();
  render();
}

function finish(result) {
  if (backdropEl) {
    backdropEl.classList.remove('is-open');
    setTimeout(() => {
      backdropEl?.remove();
      backdropEl = null;
    }, 280);
  }
  if (currentResolve) {
    const r = currentResolve;
    currentResolve = null;
    r(result);
  }
}
