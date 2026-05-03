/**
 * KIVU — Marketplace.
 *
 * Vitrine e-commerce pour artisans et entreprises africaines.
 * Démontre la mission Business de KIVU : libérer le commerce
 * intra-africain en éliminant les barrières linguistiques.
 *
 * Fonctionnalités :
 *   - Catalogue 24 produits, 8 catégories (artisanat, mode,
 *     alimentation, musique, livres, services, beauté)
 *   - Recherche live + filtres par catégorie
 *   - Carte produit avec note, nombre de ventes, indicateur de stock
 *   - Modal détail : description (auto-traduite), vendeur, pays,
 *     produits liés, ajout au panier
 *   - Panier persistant (store.cart) avec compteur dans header
 *   - Modal panier avec ajustement quantités + total + checkout
 *   - Checkout simulé (toast confirmation)
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';
import { confirmModal } from '../services/dialog.js';
import { CATEGORIES, PRODUCTS, getProduct, searchProducts, relatedProducts, countByCategory, LANG_LABELS } from '../data/marketplace.js';
import { onLeavePage } from '../services/page-lifecycle.js';

let activeCategory = 'all';
let query = '';
let detailId = null;
let cartOpen = false;
let lifecycleRegistered = false;

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function formatPrice(p) {
  return `${(p.price || 0).toLocaleString('fr-FR')} ${p.currency || ''}`;
}

function formatStars(rating) {
  const full = Math.floor(rating);
  const half = (rating - full) >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

/* ─── Cart store helpers ───────────────────────────────── */

function getCart() {
  const c = store.get('cart');
  if (!c || !Array.isArray(c.items)) return { items: [] };
  return c;
}

function cartCount() {
  return getCart().items.reduce((s, i) => s + (i.qty || 0), 0);
}

function cartTotal() {
  return getCart().items.reduce((s, i) => {
    const p = getProduct(i.id);
    return s + (p ? p.price * i.qty : 0);
  }, 0);
}

function addToCart(productId) {
  const cart = getCart();
  const existing = cart.items.find(i => i.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.items = [...cart.items, { id: productId, qty: 1, addedAt: new Date().toISOString() }];
  }
  store.set('cart', cart);
}

function setQty(productId, qty) {
  const cart = getCart();
  if (qty <= 0) {
    cart.items = cart.items.filter(i => i.id !== productId);
  } else {
    const existing = cart.items.find(i => i.id === productId);
    if (existing) existing.qty = qty;
  }
  store.set('cart', { ...cart });
}

function clearCart() {
  store.set('cart', { items: [] });
}

/* ─── Render ───────────────────────────────────────────── */

export function renderMarketplace() {
  const counts = countByCategory();
  const filtered = searchProducts(query, activeCategory);

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(45,158,115,0.15); color:var(--kivu-secondary);">
          ${icons.business(28)}
        </span>
        <div>
          <div class="screen-title">Marketplace</div>
          <div class="screen-subtitle">Le commerce africain sans barrières linguistiques</div>
        </div>
      </div>
      <button class="mp-cart-btn" data-action="mp-open-cart" aria-label="Mon panier">
        🛒
        ${cartCount() > 0 ? `<span class="mp-cart-btn__badge">${cartCount()}</span>` : ''}
      </button>
    </div>

    <!-- Hero stats -->
    <div class="mp-hero card mb-md">
      <div class="mp-hero__bg"></div>
      <div class="mp-hero__inner">
        <div class="mp-hero__chip">🌍 24 produits · 12 pays · 8 catégories</div>
        <h2 class="font-display font-bold text-xl mb-xs" style="color:white;">
          Découvre le meilleur de l'Afrique
        </h2>
        <p class="text-sm" style="color:rgba(255,255,255,0.92); margin-bottom:10px;">
          Artisans, agriculteurs, créateurs — tous traduits automatiquement par KIVU.
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="card mb-md dict-search">
      <span class="dict-search__icon">${icons.search(18)}</span>
      <input id="mp-search-input"
             class="dict-search__input"
             placeholder="Cherche un produit, vendeur, pays…"
             value="${escapeAttr(query)}"
             autocomplete="off"
             spellcheck="false"/>
      ${query ? `<button class="dict-search__clear" data-action="mp-clear-search" aria-label="Effacer">${icons.close(16)}</button>` : ''}
    </div>

    <!-- Category pills -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        ${CATEGORIES.map(c => `
          <button class="pill-tab ${activeCategory === c.id ? 'active' : ''}"
                  data-action="mp-cat" data-cat="${c.id}"
                  style="${activeCategory === c.id ? `background:${c.color}; color:white; border-color:${c.color};` : ''}">
            ${c.emoji} ${c.label}${c.id !== 'all' ? ` · ${counts[c.id] || 0}` : ` · ${PRODUCTS.length}`}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Result count -->
    ${(query || activeCategory !== 'all') ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
        ${filtered.length} ${filtered.length > 1 ? 'produits' : 'produit'}
      </div>
    ` : ''}

    <!-- Grid -->
    ${filtered.length === 0 ? `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">🔎</div>
        <div class="empty-state__title">Aucun produit trouvé</div>
        <div class="text-sm text-muted">Essaie un autre filtre ou une autre recherche.</div>
      </div>
    ` : `
      <div class="mp-grid mb-lg">
        ${filtered.map(renderProductCard).join('')}
      </div>
    `}

    ${detailId ? renderDetailModal() : ''}
    ${cartOpen ? renderCartModal() : ''}
  `;
}

function renderProductCard(p) {
  const cat = CATEGORIES.find(c => c.id === p.category);
  return `
    <button class="mp-card" data-action="mp-detail" data-id="${p.id}">
      <div class="mp-card__cover" style="background: ${p.cover};">
        <span class="mp-card__emoji">${p.emoji}</span>
        ${p.lang !== 'fra' && p.lang !== 'fr' ? `<span class="mp-card__lang">🌐 ${LANG_LABELS[p.lang] || p.lang}</span>` : ''}
        ${p.inStock < 10 ? `<span class="mp-card__stock">${p.inStock} restants</span>` : ''}
      </div>
      <div class="mp-card__body">
        <div class="mp-card__name">${escapeHtml(p.name)}</div>
        <div class="mp-card__seller">
          <span>${p.countryFlag}</span>
          <span class="text-xs text-muted">${escapeHtml(p.seller)}</span>
        </div>
        <div class="mp-card__rating">
          <span class="mp-card__stars">${formatStars(p.rating)}</span>
          <span class="text-xs text-muted">(${p.reviews})</span>
        </div>
        <div class="mp-card__price">${formatPrice(p)}</div>
      </div>
    </button>
  `;
}

/* ─── Detail modal ─────────────────────────────────────── */

function renderDetailModal() {
  const p = getProduct(detailId);
  if (!p) return '';
  const cat = CATEGORIES.find(c => c.id === p.category);
  const related = relatedProducts(p.id, 4);
  const inCart = getCart().items.find(i => i.id === p.id);

  return `
    <div class="modal-backdrop" data-action="mp-close-detail">
      <div class="modal-sheet mp-detail" data-stop="true" role="dialog" aria-label="${escapeAttr(p.name)}">
        <button class="modal-close" data-action="mp-close-detail" aria-label="Fermer">${icons.close(20)}</button>

        <div class="mp-detail__hero" style="background: ${p.cover};">
          <div class="mp-detail__emoji">${p.emoji}</div>
          ${p.lang !== 'fra' && p.lang !== 'fr' ? `
            <div class="mp-detail__lang-chip">
              🌐 Auto-traduit du <strong>${LANG_LABELS[p.lang] || p.lang}</strong>
            </div>
          ` : ''}
        </div>

        <div class="mp-detail__body">
          <div class="mp-detail__cat">${cat?.emoji} ${escapeHtml(cat?.label || '')}</div>
          <h2 class="font-display font-bold mp-detail__name">${escapeHtml(p.name)}</h2>

          <div class="mp-detail__seller-row">
            <span class="mp-detail__seller-flag">${p.countryFlag}</span>
            <div style="flex:1;">
              <div class="font-semibold">${escapeHtml(p.seller)}</div>
              <div class="text-xs text-muted">${escapeHtml(p.country)}${p.region ? ` · ${escapeHtml(p.region)}` : ''}</div>
            </div>
            <div style="text-align:right;">
              <div class="mp-card__stars">${formatStars(p.rating)}</div>
              <div class="text-xs text-muted">${p.reviews} avis · ${p.sold} vendus</div>
            </div>
          </div>

          <p class="mp-detail__desc">${escapeHtml(p.description)}</p>

          <div class="mp-detail__price-row">
            <div>
              <div class="mp-detail__price">${formatPrice(p)}</div>
              <div class="text-xs text-muted">≈ ${p.priceUSD || '—'} USD</div>
            </div>
            <div class="mp-detail__stock">
              ${p.inStock > 10 ? '<span style="color:var(--success);">✓ En stock</span>'
                : p.inStock > 0 ? `<span style="color:var(--warning);">⚠ ${p.inStock} restants</span>`
                : '<span style="color:var(--error);">Épuisé</span>'}
            </div>
          </div>

          ${inCart ? `
            <div class="mp-detail__in-cart">
              ✓ Dans ton panier (${inCart.qty})
              <button class="link-btn" data-action="mp-open-cart">Voir le panier</button>
            </div>
          ` : ''}

          <button class="btn btn-primary btn-full mp-detail__cta" data-action="mp-add-cart" data-id="${p.id}"
                  ${p.inStock === 0 ? 'disabled' : ''}>
            🛒 ${inCart ? `Ajouter encore (${inCart.qty + 1})` : 'Ajouter au panier'}
          </button>

          ${related.length > 0 ? `
            <div class="dict-section mt-md">
              <div class="dict-section__title">Produits similaires</div>
              <div class="mp-related">
                ${related.map(r => `
                  <button class="mp-related-card" data-action="mp-detail" data-id="${r.id}"
                          style="--cover: ${r.cover};">
                    <div class="mp-related-card__emoji">${r.emoji}</div>
                    <div class="mp-related-card__name">${escapeHtml(r.name)}</div>
                    <div class="mp-related-card__price">${formatPrice(r)}</div>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ─── Cart modal ───────────────────────────────────────── */

function renderCartModal() {
  const cart = getCart();
  const items = cart.items.map(i => ({ ...i, product: getProduct(i.id) })).filter(i => i.product);
  const total = cartTotal();

  return `
    <div class="modal-backdrop" data-action="mp-close-cart">
      <div class="modal-sheet mp-cart" data-stop="true" role="dialog" aria-label="Mon panier">
        <button class="modal-close" data-action="mp-close-cart" aria-label="Fermer">${icons.close(20)}</button>

        <div class="mp-cart__head">
          <h2 class="font-display font-bold text-lg">🛒 Mon panier</h2>
          ${items.length > 0 ? `<span class="text-xs text-muted">${cartCount()} article${cartCount() > 1 ? 's' : ''}</span>` : ''}
        </div>

        ${items.length === 0 ? `
          <div class="empty-state" style="padding:40px 20px;">
            <div class="empty-state__emoji">🛒</div>
            <div class="empty-state__title">Ton panier est vide</div>
            <div class="text-sm text-muted">Découvre des produits africains uniques.</div>
          </div>
        ` : `
          <div class="mp-cart__list">
            ${items.map(i => `
              <div class="mp-cart__item">
                <div class="mp-cart__item-cover" style="background:${i.product.cover};">
                  <span>${i.product.emoji}</span>
                </div>
                <div class="mp-cart__item-body">
                  <div class="font-semibold">${escapeHtml(i.product.name)}</div>
                  <div class="text-xs text-muted">${i.product.countryFlag} ${escapeHtml(i.product.seller)}</div>
                  <div class="font-bold" style="color:var(--kivu-accent); margin-top:4px;">${formatPrice(i.product)}</div>
                </div>
                <div class="mp-cart__qty">
                  <button class="mp-qty-btn" data-action="mp-qty-dec" data-id="${i.id}">−</button>
                  <span class="mp-qty-val">${i.qty}</span>
                  <button class="mp-qty-btn" data-action="mp-qty-inc" data-id="${i.id}">+</button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="mp-cart__total">
            <div>
              <div class="text-xs text-muted">Total</div>
              <div class="font-display font-bold text-xl" style="color:var(--kivu-accent);">${total.toLocaleString('fr-FR')} FCFA</div>
            </div>
            <button class="btn btn-primary mp-cart__checkout" data-action="mp-checkout">
              Commander →
            </button>
          </div>

          <button class="link-btn text-xs mp-cart__clear" data-action="mp-clear-cart">
            Vider le panier
          </button>
        `}
      </div>
    </div>
  `;
}

/* ─── Mount ───────────────────────────────────────────── */

renderMarketplace.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  if (!lifecycleRegistered) {
    lifecycleRegistered = true;
    onLeavePage('/marketplace', () => {
      activeCategory = 'all';
      query = '';
      detailId = null;
      cartOpen = false;
    });
  }

  const rerender = (preserveFocus = false) => {
    const focusedId = preserveFocus ? document.activeElement?.id : null;
    main.innerHTML = renderMarketplace();
    renderMarketplace.mount();
    if (focusedId) {
      const el = document.getElementById(focusedId);
      if (el) {
        el.focus();
        if (el.value) el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };

  // Search
  const searchInput = document.getElementById('mp-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value;
      rerender(true);
    });
  }
  document.querySelectorAll('[data-action="mp-clear-search"]').forEach(btn =>
    btn.addEventListener('click', () => { query = ''; rerender(); })
  );

  // Category pills
  document.querySelectorAll('[data-action="mp-cat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      fx.click();
      rerender();
    })
  );

  // Open detail
  document.querySelectorAll('[data-action="mp-detail"]').forEach(btn =>
    btn.addEventListener('click', () => {
      detailId = btn.dataset.id;
      cartOpen = false;
      fx.click();
      rerender();
    })
  );

  // Close detail
  document.querySelectorAll('[data-action="mp-close-detail"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="mp-close-detail"]') && !ev.target.closest('[data-action="mp-close-detail"]')) return;
      detailId = null;
      rerender();
    })
  );

  // Add to cart
  document.querySelectorAll('[data-action="mp-add-cart"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const p = getProduct(id);
      if (!p) return;
      addToCart(id);
      fx.coin();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`✓ ${p.name} ajouté au panier`, { type: 'success', duration: 1800 });
      }
      rerender();
    })
  );

  // Open / close cart
  document.querySelectorAll('[data-action="mp-open-cart"]').forEach(btn =>
    btn.addEventListener('click', () => {
      cartOpen = true;
      detailId = null;
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="mp-close-cart"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="mp-close-cart"]') && !ev.target.closest('[data-action="mp-close-cart"]')) return;
      cartOpen = false;
      rerender();
    })
  );

  // Quantity adjust
  document.querySelectorAll('[data-action="mp-qty-inc"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = getCart().items.find(i => i.id === id);
      if (item) setQty(id, item.qty + 1);
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="mp-qty-dec"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = getCart().items.find(i => i.id === id);
      if (item) setQty(id, item.qty - 1);
      fx.click();
      rerender();
    })
  );

  // Clear cart
  document.querySelectorAll('[data-action="mp-clear-cart"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const ok = await confirmModal({
        icon: '🛒',
        title: 'Vider le panier ?',
        message: 'Tous les articles seront retirés.',
        confirmLabel: 'Vider',
        cancelLabel: 'Garder',
        danger: true
      });
      if (!ok) return;
      clearCart();
      rerender();
    })
  );

  // Checkout (mock)
  document.querySelectorAll('[data-action="mp-checkout"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const total = cartTotal();
      const count = cartCount();
      const ok = await confirmModal({
        icon: '💳',
        title: 'Confirmer la commande ?',
        message: `${count} article${count > 1 ? 's' : ''} · ${total.toLocaleString('fr-FR')} FCFA. Tu seras redirigé vers le paiement sécurisé KIVU.`,
        confirmLabel: 'Commander',
        cancelLabel: 'Annuler'
      });
      if (!ok) return;
      // Simulate processing
      fx.success();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`✓ Commande de ${total.toLocaleString('fr-FR')} FCFA confirmée ! Email de suivi envoyé.`, { type: 'success', duration: 4000 });
      }
      clearCart();
      cartOpen = false;
      rerender();
    })
  );

  // Backdrop click to close
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target !== bd) return;
      detailId = null;
      cartOpen = false;
      rerender();
    });
  });

  // Escape closes any modal
  if (detailId || cartOpen) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        detailId = null;
        cartOpen = false;
        document.removeEventListener('keydown', onEsc);
        rerender();
      }
    };
    document.addEventListener('keydown', onEsc);
  }
};
