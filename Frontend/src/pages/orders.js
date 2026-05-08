/**
 * KIVU — Mes commandes.
 *
 * Liste de toutes les commandes passées sur le Marketplace, avec :
 *  - Stats (nombre, actives, livrées, total dépensé)
 *  - Filtre par statut (tout/actives/livrées/annulées)
 *  - Carte par commande avec timeline visuel
 *  - Détail au clic (modal) avec items, total, tracking, actions
 *  - Annulation possible si pas encore expédiée
 *  - Re-commander un article (ajoute au panier)
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';
import { confirmModal } from '../services/dialog.js';
import { onLeavePage } from '../services/page-lifecycle.js';
import { listOrders, getOrder, cancelOrder, ordersStats, ORDER_STATUSES } from '../services/marketplace-orders.js';

let activeFilter = 'all'; // all | active | delivered | cancelled
let detailOrderId = null;
let lifecycleRegistered = false;
let storeUnsub = null;

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function fmtPrice(n, currency = 'FCFA') {
  return `${(n || 0).toLocaleString('fr-FR')} ${currency}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtRelTime(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
}

function statusProgress(status) {
  return ['confirmed','preparing','shipped','delivered'].indexOf(status);
}

function filterOrders(orders) {
  if (activeFilter === 'active')    return orders.filter(o => !['delivered','cancelled'].includes(o.status));
  if (activeFilter === 'delivered') return orders.filter(o => o.status === 'delivered');
  if (activeFilter === 'cancelled') return orders.filter(o => o.status === 'cancelled');
  return orders;
}

/* ─── Render ───────────────────────────────────────────── */

export function renderOrders() {
  const orders = listOrders();
  const stats = ordersStats();
  const filtered = filterOrders(orders);

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(45,158,115,0.15); color:var(--kivu-secondary);">
          ${icons.archive(28)}
        </span>
        <div>
          <div class="screen-title">Mes commandes</div>
          <div class="screen-subtitle">Suivi en temps réel</div>
        </div>
      </div>
    </div>

    <div class="orders-stats mb-md">
      <div class="orders-stat"><div class="orders-stat__value">${stats.total}</div><div class="orders-stat__label">Total</div></div>
      <div class="orders-stat orders-stat--active"><div class="orders-stat__value">${stats.active}</div><div class="orders-stat__label">En cours</div></div>
      <div class="orders-stat orders-stat--done"><div class="orders-stat__value">${stats.delivered}</div><div class="orders-stat__label">Livrées</div></div>
      <div class="orders-stat orders-stat--money"><div class="orders-stat__value">${(stats.totalSpent / 1000).toFixed(0)}k</div><div class="orders-stat__label">FCFA dépensés</div></div>
    </div>

    <div class="seg-tabs mb-md" style="width:100%; display:grid; grid-template-columns:repeat(4,1fr);">
      ${[
        { id: 'all', label: 'Toutes' },
        { id: 'active', label: 'En cours' },
        { id: 'delivered', label: 'Livrées' },
        { id: 'cancelled', label: 'Annulées' }
      ].map(t => `
        <button class="seg-tab ${activeFilter === t.id ? 'active' : ''}"
                data-action="orders-filter" data-filter="${t.id}"
                style="text-align:center; padding:8px 6px;">
          ${t.label}
        </button>
      `).join('')}
    </div>

    ${filtered.length === 0 ? renderEmpty() : `
      <div class="orders-list mb-lg">
        ${filtered.map(renderOrderCard).join('')}
      </div>
    `}

    ${detailOrderId ? renderDetailModal() : ''}
  `;
}

function renderEmpty() {
  if (activeFilter === 'all') {
    return `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">📦</div>
        <div class="empty-state__title">Aucune commande pour l'instant</div>
        <div class="text-sm text-muted mb-md">Découvre des produits artisanaux africains uniques.</div>
        <button class="btn btn-primary" data-nav="/marketplace">🛒 Voir le marketplace</button>
      </div>
    `;
  }
  return `
    <div class="empty-state mb-lg">
      <div class="empty-state__emoji">📭</div>
      <div class="empty-state__title">Aucune commande dans cette catégorie</div>
    </div>
  `;
}

function renderOrderCard(order) {
  const meta = ORDER_STATUSES[order.status];
  const progress = statusProgress(order.status);
  const totalProg = order.status === 'cancelled' ? 0 : ((progress + 1) / 4) * 100;
  const itemSummary = order.items.length === 1
    ? `${order.items[0].emoji} ${escapeHtml(order.items[0].name)}`
    : `${order.items.length} articles`;

  return `
    <button class="order-card" data-action="orders-detail" data-id="${order.id}">
      <div class="order-card__head">
        <div>
          <div class="order-card__id">${order.id}</div>
          <div class="text-xs text-muted">${fmtDate(order.createdAt)}</div>
        </div>
        <span class="order-status order-status--${order.status}" style="background: ${meta.color}1A; color: ${meta.color}; border-color: ${meta.color}33;">
          ${meta.emoji} ${meta.label}
        </span>
      </div>

      ${order.status !== 'cancelled' ? `
        <div class="order-progress mb-sm">
          <div class="order-progress__bar"><div class="order-progress__fill" style="width:${totalProg}%; background: ${meta.color};"></div></div>
          <div class="order-progress__steps">
            <span class="${progress >= 0 ? 'is-done' : ''}">✓</span>
            <span class="${progress >= 1 ? 'is-done' : ''}">📦</span>
            <span class="${progress >= 2 ? 'is-done' : ''}">🚚</span>
            <span class="${progress >= 3 ? 'is-done' : ''}">🎉</span>
          </div>
        </div>
      ` : ''}

      <div class="order-card__items">
        <div class="order-card__items-emoji">
          ${order.items.slice(0, 3).map(i => `<span class="order-card__emoji" style="background: ${i.cover};">${i.emoji}</span>`).join('')}
          ${order.items.length > 3 ? `<span class="order-card__emoji-more">+${order.items.length - 3}</span>` : ''}
        </div>
        <div style="flex:1; min-width:0;">
          <div class="font-semibold" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${itemSummary}</div>
          <div class="text-xs text-muted">${order.items[0].countryFlag} ${escapeHtml(order.items[0].seller)}</div>
        </div>
        <div style="text-align:right;">
          <div class="font-bold" style="color:var(--kivu-accent);">${fmtPrice(order.total, order.currency)}</div>
          <div class="text-xs text-muted">${fmtRelTime(order.createdAt)}</div>
        </div>
      </div>
    </button>
  `;
}

function renderDetailModal() {
  const order = getOrder(detailOrderId);
  if (!order) return '';
  const meta = ORDER_STATUSES[order.status];
  const canCancel = !['delivered', 'cancelled', 'shipped'].includes(order.status);

  return `
    <div class="modal-backdrop" data-action="orders-close-detail">
      <div class="modal-sheet order-detail" data-stop="true" role="dialog" aria-label="Détails commande ${order.id}">
        <button class="modal-close" data-action="orders-close-detail" aria-label="Fermer">${icons.close(20)}</button>

        <div class="order-detail__head">
          <div>
            <div class="text-xs text-muted">Commande</div>
            <div class="font-display font-bold text-lg">${order.id}</div>
            <div class="text-xs text-muted">${fmtDate(order.createdAt)}</div>
          </div>
          <span class="order-status order-status--${order.status}" style="background: ${meta.color}1A; color: ${meta.color};">
            ${meta.emoji} ${meta.label}
          </span>
        </div>

        ${order.status !== 'cancelled' ? `
          <div class="order-timeline mb-md">
            ${['confirmed','preparing','shipped','delivered'].map((st, i) => {
              const stMeta = ORDER_STATUSES[st];
              const done = statusProgress(order.status) >= i;
              const tlEntry = order.timeline.find(t => t.status === st);
              return `
                <div class="order-timeline__row ${done ? 'is-done' : ''}">
                  <div class="order-timeline__icon" style="${done ? `background:${stMeta.color};` : ''}">${stMeta.emoji}</div>
                  <div style="flex:1;">
                    <div class="font-semibold">${stMeta.label}</div>
                    <div class="text-xs text-muted">${tlEntry ? fmtRelTime(tlEntry.ts) : 'À venir'}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        <div class="dict-section">
          <div class="dict-section__title">Articles (${order.items.length})</div>
          ${order.items.map(i => `
            <div class="order-item-row">
              <span class="order-item-row__emoji" style="background: ${i.cover};">${i.emoji}</span>
              <div style="flex:1;">
                <div class="font-semibold">${escapeHtml(i.name)}</div>
                <div class="text-xs text-muted">${i.countryFlag} ${escapeHtml(i.seller)} · qté ${i.qty}</div>
              </div>
              <div class="font-bold">${fmtPrice(i.price * i.qty, i.currency)}</div>
            </div>
          `).join('')}
        </div>

        <div class="dict-section">
          <div class="dict-section__title">Détails</div>
          <div class="order-detail__line"><span>Sous-total</span><span>${fmtPrice(order.subtotal, order.currency)}</span></div>
          <div class="order-detail__line"><span>Livraison</span><span>${order.shipping === 0 ? '<span style="color:var(--success);">Offerte</span>' : fmtPrice(order.shipping, order.currency)}</span></div>
          <div class="order-detail__line order-detail__line--total"><span>Total</span><span>${fmtPrice(order.total, order.currency)}</span></div>
          <div class="order-detail__line"><span>Paiement</span><span style="font-size:0.82rem;">${escapeHtml(order.paymentMethod)}</span></div>
          ${order.txId ? `
            <div class="order-detail__line"><span>Transaction</span><span style="font-family:monospace; font-size:0.78rem; color:var(--kivu-primary);">${escapeHtml(order.txId)}</span></div>
          ` : ''}
          ${order.status === 'shipped' ? `
            <div class="order-detail__line"><span>Suivi</span><span style="font-family:monospace; color:var(--kivu-primary);">${order.trackingId}</span></div>
          ` : ''}
          ${order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' ? `
            <div class="order-detail__line"><span>Livraison estimée</span><span>${fmtDate(order.estimatedDelivery)}</span></div>
          ` : ''}
        </div>

        <div class="flex gap-sm mt-md">
          ${canCancel ? `
            <button class="btn btn-ghost btn-full" data-action="orders-cancel" data-id="${order.id}"
                    style="color:var(--error); border-color:var(--error);">
              Annuler
            </button>
          ` : ''}
          <button class="btn btn-primary btn-full" data-nav="/marketplace">
            Continuer mes achats
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ─── Mount ───────────────────────────────────────────── */

renderOrders.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderOrders();
    renderOrders.mount();
  };

  if (!lifecycleRegistered) {
    lifecycleRegistered = true;
    onLeavePage('/orders', () => {
      activeFilter = 'all';
      detailOrderId = null;
      if (storeUnsub) { try { storeUnsub(); } catch {} storeUnsub = null; }
    });
  }

  // Live update when order statuses change
  if (!storeUnsub) {
    storeUnsub = store.subscribe(() => {
      if (document.querySelector('.orders-list, .empty-state')) {
        const m = document.querySelector('main.screen');
        if (m && !detailOrderId) {
          m.innerHTML = renderOrders();
          renderOrders.mount();
        }
      }
    });
  }

  document.querySelectorAll('[data-action="orders-filter"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="orders-detail"]').forEach(btn =>
    btn.addEventListener('click', () => {
      detailOrderId = btn.dataset.id;
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="orders-close-detail"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="orders-close-detail"]') && !ev.target.closest('[data-action="orders-close-detail"]')) return;
      detailOrderId = null;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="orders-cancel"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const ok = await confirmModal({
        icon: '⚠️',
        title: 'Annuler cette commande ?',
        message: 'Le remboursement intégral sera traité sous 3-5 jours ouvrés.',
        confirmLabel: 'Confirmer l\'annulation',
        cancelLabel: 'Garder la commande',
        danger: true
      });
      if (!ok) return;
      cancelOrder(id);
      detailOrderId = null;
      rerender();
    })
  );

  // Backdrop click closes modal
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target !== bd) return;
      detailOrderId = null;
      rerender();
    });
  });
};
