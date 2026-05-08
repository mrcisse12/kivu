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
import { isWished, toggleWish, listWished, wishCount } from '../services/marketplace-wishlist.js';
import { openConversation, sendUserMessage, getConversation, listConversations as listChats, markRead, deleteConversation, unreadCount as chatUnread } from '../services/marketplace-chat.js';
import { createOrder } from '../services/marketplace-orders.js';
import { speech } from '../services/speech.js';
import { navigate } from '../router.js';
import { openPaymentModal } from '../components/payment-modal.js';

let activeCategory = 'all';
let query = '';
let detailId = null;
let cartOpen = false;
let chatConvId = null;        // active conversation ID
let chatListOpen = false;      // showing the list of all chats
let chatDraft = '';            // current message being typed
let callOpen = null;           // { sellerId, sellerName, type: 'voice'|'video' }
let callConnectedAt = null;    // timestamp when call connected (for duration)
let viewMode = 'all';          // 'all' | 'wishlist'
let lifecycleRegistered = false;
let storeUnsub = null;

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

function fmtRelTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} j`;
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
  const wishedIds = new Set(listWished());
  const filtered = viewMode === 'wishlist'
    ? PRODUCTS.filter(p => wishedIds.has(p.id))
    : searchProducts(query, activeCategory);
  const unread = chatUnread();

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm" style="flex:1; min-width:0;">
        <span class="screen-icon" style="background:rgba(45,158,115,0.15); color:var(--kivu-secondary);">
          ${icons.business(28)}
        </span>
        <div style="min-width:0;">
          <div class="screen-title">Marketplace</div>
          <div class="screen-subtitle">Commerce africain sans frontière</div>
        </div>
      </div>
      <div class="flex gap-xs items-center" style="flex-shrink:0;">
        <button class="mp-icon-btn" data-action="mp-open-chat-list" aria-label="Mes messages" title="Messages">
          💬
          ${unread > 0 ? `<span class="mp-cart-btn__badge">${unread}</span>` : ''}
        </button>
        <button class="mp-icon-btn" data-nav="/orders" aria-label="Mes commandes" title="Mes commandes">
          📦
        </button>
        <button class="mp-cart-btn" data-action="mp-open-cart" aria-label="Mon panier">
          🛒
          ${cartCount() > 0 ? `<span class="mp-cart-btn__badge">${cartCount()}</span>` : ''}
        </button>
      </div>
    </div>

    <div class="mp-view-tabs mb-sm">
      <button class="seg-tab ${viewMode === 'all' ? 'active' : ''}" data-action="mp-view" data-view="all">
        🌍 Tout
      </button>
      <button class="seg-tab ${viewMode === 'wishlist' ? 'active' : ''}" data-action="mp-view" data-view="wishlist">
        ❤️ Favoris${wishCount() > 0 ? ` · ${wishCount()}` : ''}
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
    ${chatListOpen ? renderChatListModal() : ''}
    ${chatConvId ? renderChatModal() : ''}
    ${callOpen ? renderCallModal() : ''}
  `;
}

function renderProductCard(p) {
  const cat = CATEGORIES.find(c => c.id === p.category);
  const wished = isWished(p.id);
  return `
    <div class="mp-card-wrap">
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
      <button class="mp-card__wish ${wished ? 'is-wished' : ''}"
              data-action="mp-wish" data-id="${p.id}"
              aria-label="${wished ? 'Retirer des favoris' : 'Ajouter aux favoris'}"
              title="${wished ? 'Favori' : 'Ajouter aux favoris'}">
        ${wished ? '❤️' : '🤍'}
      </button>
    </div>
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
            <div style="flex:1; min-width:0;">
              <div class="font-semibold">${escapeHtml(p.seller)}</div>
              <div class="text-xs text-muted">${escapeHtml(p.country)}${p.region ? ` · ${escapeHtml(p.region)}` : ''}</div>
            </div>
            <div style="text-align:right;">
              <div class="mp-card__stars">${formatStars(p.rating)}</div>
              <div class="text-xs text-muted">${p.reviews} avis · ${p.sold} vendus</div>
            </div>
          </div>

          <div class="mp-detail__contact-row">
            <button class="mp-contact-btn mp-contact-btn--chat" data-action="mp-chat-seller" data-id="${p.id}">
              💬 Discuter
            </button>
            <button class="mp-contact-btn mp-contact-btn--voice" data-action="mp-call-seller" data-id="${p.id}" data-type="voice">
              📞 Appel
            </button>
            <button class="mp-contact-btn mp-contact-btn--video" data-action="mp-call-seller" data-id="${p.id}" data-type="video">
              📹 Vidéo
            </button>
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

          <div class="flex gap-sm">
            <button class="btn btn-primary mp-detail__cta" data-action="mp-add-cart" data-id="${p.id}"
                    style="flex:1;"
                    ${p.inStock === 0 ? 'disabled' : ''}>
              🛒 ${inCart ? `Ajouter encore (${inCart.qty + 1})` : 'Ajouter au panier'}
            </button>
            <button class="mp-icon-btn mp-icon-btn--lg ${isWished(p.id) ? 'is-wished' : ''}"
                    data-action="mp-wish" data-id="${p.id}"
                    aria-label="${isWished(p.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
              ${isWished(p.id) ? '❤️' : '🤍'}
            </button>
          </div>

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

/* ─── Chat list modal (all conversations) ─────────────── */

function renderChatListModal() {
  const chats = listChats();
  return `
    <div class="modal-backdrop" data-action="mp-close-chat-list">
      <div class="modal-sheet mp-chat-list" data-stop="true" role="dialog" aria-label="Mes messages">
        <button class="modal-close" data-action="mp-close-chat-list" aria-label="Fermer">${icons.close(20)}</button>
        <h2 class="font-display font-bold text-lg mb-md">💬 Mes conversations</h2>

        ${chats.length === 0 ? `
          <div class="empty-state" style="padding:30px 0;">
            <div class="empty-state__emoji">💬</div>
            <div class="empty-state__title">Aucune conversation</div>
            <div class="text-sm text-muted">Touche "Discuter" sur un produit pour démarrer.</div>
          </div>
        ` : `
          <div class="mp-chat-list__items">
            ${chats.map(c => {
              const lastMsg = c.messages[c.messages.length - 1];
              const unread = c.messages.filter(m => m.from === 'seller' && !m.read).length;
              const product = c.productId ? getProduct(c.productId) : null;
              return `
                <button class="mp-chat-list__item" data-action="mp-open-chat" data-id="${c.id}">
                  <span class="mp-chat-list__avatar">${product ? product.emoji : '🛍️'}</span>
                  <div style="flex:1; min-width:0; text-align:left;">
                    <div class="font-semibold" style="display:flex; gap:6px; align-items:center;">
                      ${escapeHtml(c.sellerName)}
                      ${unread > 0 ? `<span class="mp-chat-unread-pill">${unread}</span>` : ''}
                    </div>
                    <div class="text-xs text-muted" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 100%;">
                      ${lastMsg.from === 'user' ? 'Toi : ' : ''}${escapeHtml(lastMsg.text.slice(0, 60))}${lastMsg.text.length > 60 ? '…' : ''}
                    </div>
                  </div>
                  <div class="text-xs text-muted" style="flex-shrink:0;">${fmtRelTime(lastMsg.ts)}</div>
                </button>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

/* ─── Chat modal (active conversation) ─────────────────── */

function renderChatModal() {
  const conv = getConversation(chatConvId);
  if (!conv) return '';
  const product = conv.productId ? getProduct(conv.productId) : null;

  return `
    <div class="modal-backdrop" data-action="mp-close-chat">
      <div class="modal-sheet mp-chat" data-stop="true" role="dialog" aria-label="Chat avec ${escapeAttr(conv.sellerName)}">
        <header class="mp-chat__head">
          <button class="modal-close" data-action="mp-close-chat" aria-label="Fermer">${icons.close(20)}</button>
          <div class="mp-chat__avatar">${product ? product.emoji : '🛍️'}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-bold">${escapeHtml(conv.sellerName)}</div>
            <div class="text-xs text-muted">
              <span class="mp-chat__online-dot"></span> En ligne · répond en ~2 min
            </div>
          </div>
          <button class="mp-icon-btn" data-action="mp-call-from-chat" data-type="voice" aria-label="Appel vocal">📞</button>
          <button class="mp-icon-btn" data-action="mp-call-from-chat" data-type="video" aria-label="Appel vidéo">📹</button>
        </header>

        ${product ? `
          <div class="mp-chat__product">
            <span class="mp-chat__product-emoji" style="background: ${product.cover};">${product.emoji}</span>
            <div style="flex:1; min-width:0;">
              <div class="font-semibold" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(product.name)}</div>
              <div class="text-xs text-muted">${formatPrice(product)}</div>
            </div>
          </div>
        ` : ''}

        <div class="mp-chat__messages" id="mp-chat-messages">
          ${conv.messages.map(renderChatBubble).join('')}
        </div>

        <div class="mp-chat__input-wrap">
          <input id="mp-chat-input" class="mp-chat__input"
                 type="text" placeholder="Écris un message…"
                 value="${escapeAttr(chatDraft)}"
                 autocomplete="off" maxlength="500"/>
          <button class="mp-chat__send" data-action="mp-send-message"
                  ${!chatDraft.trim() ? 'disabled' : ''} aria-label="Envoyer">
            ${icons.send(18, 'white')}
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderChatBubble(m) {
  if (m.from === 'user') {
    return `
      <div class="mp-bubble-row mp-bubble-row--user">
        <div class="mp-bubble mp-bubble--user">${escapeHtml(m.text)}</div>
      </div>
    `;
  }
  return `
    <div class="mp-bubble-row mp-bubble-row--seller">
      <div class="mp-bubble mp-bubble--seller">${escapeHtml(m.text)}</div>
    </div>
  `;
}

/* ─── Voice/Video call modal ───────────────────────────── */

function renderCallModal() {
  if (!callOpen) return '';
  const product = callOpen.productId ? getProduct(callOpen.productId) : null;
  const isVideo = callOpen.type === 'video';
  const isConnected = !!callConnectedAt;
  const duration = isConnected ? Math.floor((Date.now() - callConnectedAt) / 1000) : 0;
  const mins = Math.floor(duration / 60).toString().padStart(2, '0');
  const secs = (duration % 60).toString().padStart(2, '0');

  return `
    <div class="mp-call ${isVideo ? 'mp-call--video' : 'mp-call--voice'}" data-stop="true">
      <div class="mp-call__bg" ${product ? `style="background: ${product.cover};"` : ''}></div>

      <div class="mp-call__top">
        <div class="text-xs" style="opacity:0.85; letter-spacing:0.6px; text-transform:uppercase;">
          KIVU ${isVideo ? 'Vidéo' : 'Audio'} sécurisé · E2E chiffré
        </div>
        <div class="font-display font-bold" style="font-size:1.4rem; color:white;">${escapeHtml(callOpen.sellerName)}</div>
        <div class="text-xs" style="opacity:0.85;">
          ${isConnected ? `<span class="mp-call__dot"></span> En appel · ${mins}:${secs}` : 'Appel en cours…'}
        </div>
      </div>

      <div class="mp-call__avatar-wrap">
        ${isVideo ? `
          <div class="mp-call__video">
            <span class="mp-call__avatar-emoji">${product ? product.emoji : '👤'}</span>
            ${isConnected ? '<div class="mp-call__live-pill">🔴 LIVE</div>' : ''}
          </div>
        ` : `
          <div class="mp-call__voice-avatar ${isConnected ? 'is-connected' : 'is-ringing'}">
            <div class="mp-call__voice-pulse"></div>
            <div class="mp-call__voice-pulse mp-call__voice-pulse--2"></div>
            <span class="mp-call__avatar-emoji">${product ? product.emoji : '👤'}</span>
          </div>
        `}
      </div>

      <div class="mp-call__actions">
        <button class="mp-call__btn mp-call__btn--mute" aria-label="Mute" title="Microphone">🎙️</button>
        ${isVideo ? '<button class="mp-call__btn" aria-label="Caméra" title="Caméra">📷</button>' : ''}
        <button class="mp-call__btn mp-call__btn--end" data-action="mp-end-call" aria-label="Raccrocher" title="Raccrocher">📵</button>
        <button class="mp-call__btn" data-action="mp-call-to-chat" aria-label="Chat" title="Passer au chat">💬</button>
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
      chatListOpen = false;
      chatConvId = null;
      chatDraft = '';
      callOpen = null;
      callConnectedAt = null;
      viewMode = 'all';
      stopCallTicker();
      speech.cancelSpeech();
      if (storeUnsub) { try { storeUnsub(); } catch {} storeUnsub = null; }
    });
  }

  // Live update when chats / wishlist / cart change in another tab
  if (!storeUnsub) {
    storeUnsub = store.subscribe(() => {
      // Only rerender if user is still on /marketplace and not actively typing
      if (document.querySelector('.mp-grid, .empty-state')) {
        const isTyping = document.activeElement?.id === 'mp-search-input' ||
                         document.activeElement?.id === 'mp-chat-input';
        if (!isTyping) {
          const m = document.querySelector('main.screen');
          if (m) {
            m.innerHTML = renderMarketplace();
            renderMarketplace.mount();
          }
        }
      }
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

  // Checkout — opens the premium payment modal, creates the order
  // with the actual payment method used
  document.querySelectorAll('[data-action="mp-checkout"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const total = cartTotal();
      const count = cartCount();
      cartOpen = false;
      rerender();
      const result = await openPaymentModal({
        amount: total,
        currency: 'FCFA',
        description: `${count} article${count > 1 ? 's' : ''} · livraison incluse`
      });
      if (!result || !result.success) return;
      // Create the order with the real payment method label
      const paymentLabel = result.maskedDisplay
        ? `${result.methodLabel} · ${result.maskedDisplay}`
        : result.methodLabel;
      const order = createOrder(getCart().items, paymentLabel);
      if (!order) return;
      // Persist the txId on the order for the receipt
      try {
        const orders = store.get('marketplaceOrders') || { list: [] };
        const o = orders.list.find(x => x.id === order.id);
        if (o) {
          o.txId = result.txId;
          store.set('marketplaceOrders', orders);
        }
      } catch {}
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`🎉 Commande ${order.id} confirmée !`, { type: 'success', duration: 3500 });
      }
      clearCart();
      rerender();
      // Navigate to orders page so user sees the timeline live
      setTimeout(() => navigate('/orders'), 600);
    })
  );

  // ─── View tabs (all / wishlist) ──────────────────────
  document.querySelectorAll('[data-action="mp-view"]').forEach(btn =>
    btn.addEventListener('click', () => {
      viewMode = btn.dataset.view;
      fx.click();
      rerender();
    })
  );

  // ─── Wishlist toggle ──────────────────────────────────
  document.querySelectorAll('[data-action="mp-wish"]').forEach(btn =>
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const id = btn.dataset.id;
      const wished = toggleWish(id);
      fx.click();
      if (window.__KIVU__?.toast && wished) {
        window.__KIVU__.toast('❤️ Ajouté aux favoris', { type: 'success', duration: 1400 });
      }
      rerender();
    })
  );

  // ─── Chat: open list ──────────────────────────────────
  document.querySelectorAll('[data-action="mp-open-chat-list"]').forEach(btn =>
    btn.addEventListener('click', () => {
      chatListOpen = true;
      detailId = null;
      cartOpen = false;
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="mp-close-chat-list"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="mp-close-chat-list"]') && !ev.target.closest('[data-action="mp-close-chat-list"]')) return;
      chatListOpen = false;
      rerender();
    })
  );

  // ─── Chat: start conversation from product ───────────
  document.querySelectorAll('[data-action="mp-chat-seller"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const product = getProduct(btn.dataset.id);
      if (!product) return;
      const sellerId = 'seller_' + (product.seller || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const conv = openConversation(sellerId, product.seller, product.id);
      chatConvId = conv.id;
      detailId = null;
      chatListOpen = false;
      chatDraft = '';
      markRead(conv.id);
      fx.click();
      rerender();
    })
  );

  // ─── Chat: open existing conversation from list ──────
  document.querySelectorAll('[data-action="mp-open-chat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      chatConvId = btn.dataset.id;
      chatListOpen = false;
      chatDraft = '';
      markRead(chatConvId);
      fx.click();
      rerender();
    })
  );

  // ─── Chat: close ─────────────────────────────────────
  document.querySelectorAll('[data-action="mp-close-chat"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="mp-close-chat"]') && !ev.target.closest('[data-action="mp-close-chat"]')) return;
      chatConvId = null;
      chatDraft = '';
      rerender();
    })
  );

  // ─── Chat: input + send ─────────────────────────────
  const chatInput = document.getElementById('mp-chat-input');
  if (chatInput) {
    chatInput.addEventListener('input', () => {
      chatDraft = chatInput.value;
      const sendBtn = document.querySelector('[data-action="mp-send-message"]');
      if (sendBtn) {
        if (chatDraft.trim()) sendBtn.removeAttribute('disabled');
        else sendBtn.setAttribute('disabled', '');
      }
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && chatDraft.trim()) {
        e.preventDefault();
        sendChatMessage();
      }
    });
    // Auto-focus + scroll to bottom
    setTimeout(() => {
      chatInput.focus();
      const stream = document.getElementById('mp-chat-messages');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }, 50);
  }
  document.querySelectorAll('[data-action="mp-send-message"]').forEach(btn =>
    btn.addEventListener('click', sendChatMessage)
  );

  function sendChatMessage() {
    if (!chatConvId || !chatDraft.trim()) return;
    sendUserMessage(chatConvId, chatDraft.trim());
    chatDraft = '';
    fx.click();
    rerender();
  }

  // ─── Voice/Video call from product detail ───────────
  document.querySelectorAll('[data-action="mp-call-seller"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const product = getProduct(btn.dataset.id);
      if (!product) return;
      callOpen = {
        sellerId: 'seller_' + (product.seller || '').toLowerCase().replace(/[^a-z0-9]/g, '_'),
        sellerName: product.seller,
        productId: product.id,
        type: btn.dataset.type
      };
      callConnectedAt = null;
      detailId = null;
      fx.click();
      rerender();
      // Simulate ringing → connected after 2.4s
      setTimeout(() => {
        if (callOpen) {
          callConnectedAt = Date.now();
          fx.coin();
          rerender();
          // Live duration update every second
          startCallTicker();
          // Seller speaks an initial greeting via TTS
          if (speech.ttsSupported) {
            const product = getProduct(callOpen.productId);
            const greeting = `Bonjour ! Bienvenue sur KIVU. Je suis ${callOpen.sellerName.split(' ')[0]}. Comment puis-je vous aider avec ${product?.name || 'ce produit'} ?`;
            setTimeout(() => speech.speak(greeting, 'fra'), 600);
          }
        }
      }, 2400);
    })
  );

  // From chat → call
  document.querySelectorAll('[data-action="mp-call-from-chat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const conv = getConversation(chatConvId);
      if (!conv) return;
      callOpen = {
        sellerId: conv.sellerId,
        sellerName: conv.sellerName,
        productId: conv.productId,
        type: btn.dataset.type
      };
      callConnectedAt = null;
      chatConvId = null;
      fx.click();
      rerender();
      setTimeout(() => {
        if (callOpen) {
          callConnectedAt = Date.now();
          fx.coin();
          rerender();
          startCallTicker();
        }
      }, 2400);
    })
  );

  // End call
  document.querySelectorAll('[data-action="mp-end-call"]').forEach(btn =>
    btn.addEventListener('click', () => {
      stopCallTicker();
      const duration = callConnectedAt ? Math.floor((Date.now() - callConnectedAt) / 1000) : 0;
      if (window.__KIVU__?.toast && duration > 0) {
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        window.__KIVU__.toast(`📞 Appel terminé · ${m}:${s.toString().padStart(2, '0')}`, { type: 'info', duration: 2400 });
      }
      callOpen = null;
      callConnectedAt = null;
      speech.cancelSpeech();
      fx.click();
      rerender();
    })
  );

  // Switch from call to chat
  document.querySelectorAll('[data-action="mp-call-to-chat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!callOpen) return;
      const conv = openConversation(callOpen.sellerId, callOpen.sellerName, callOpen.productId);
      stopCallTicker();
      speech.cancelSpeech();
      callOpen = null;
      callConnectedAt = null;
      chatConvId = conv.id;
      markRead(conv.id);
      fx.click();
      rerender();
    })
  );

  // Backdrop click closes any modal
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target !== bd) return;
      detailId = null;
      cartOpen = false;
      chatListOpen = false;
      chatConvId = null;
      rerender();
    });
  });

  // Escape closes any modal (call requires explicit end)
  if (detailId || cartOpen || chatListOpen || chatConvId) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        detailId = null;
        cartOpen = false;
        chatListOpen = false;
        chatConvId = null;
        document.removeEventListener('keydown', onEsc);
        rerender();
      }
    };
    document.addEventListener('keydown', onEsc);
  }
};

/* ─── Call timer ───────────────────────────────────────── */

let callTickerId = null;
function startCallTicker() {
  stopCallTicker();
  callTickerId = setInterval(() => {
    // Refresh duration display only if call modal is on screen
    const mainEl = document.querySelector('.mp-call');
    if (!mainEl) {
      stopCallTicker();
      return;
    }
    if (!callConnectedAt) return;
    const dur = Math.floor((Date.now() - callConnectedAt) / 1000);
    const mins = Math.floor(dur / 60).toString().padStart(2, '0');
    const secs = (dur % 60).toString().padStart(2, '0');
    const txt = mainEl.querySelector('.mp-call__top .text-xs:last-child');
    if (txt) txt.innerHTML = `<span class="mp-call__dot"></span> En appel · ${mins}:${secs}`;
  }, 1000);
}
function stopCallTicker() {
  if (callTickerId) { clearInterval(callTickerId); callTickerId = null; }
}
