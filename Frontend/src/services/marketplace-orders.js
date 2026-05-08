/**
 * KIVU — Marketplace orders service.
 *
 * Cycle de vie d'une commande :
 *   1. confirmed   — Vendeur notifié, attend de préparer
 *   2. preparing   — En cours de préparation
 *   3. shipped     — Expédié, tracking dispo
 *   4. delivered   — Livré (final)
 *
 * Les statuts progressent automatiquement via un timer simulé pour
 * démontrer l'expérience complète sans attendre des jours réels :
 *   confirmed → preparing  : après 5s
 *   preparing → shipped    : après 10s
 *   shipped   → delivered  : après 20s
 *
 * Chaque transition envoie une notification.
 */

import { store } from '../store.js';
import { notifications } from './notifications.js';
import { getProduct } from '../data/marketplace.js';

const STAGE_DURATIONS = { confirmed: 5_000, preparing: 10_000, shipped: 20_000 };

const STATUS_META = {
  confirmed: { label: 'Confirmée',    emoji: '✅', color: '#1CB0F6', desc: 'Le vendeur a reçu votre commande.' },
  preparing: { label: 'En préparation', emoji: '📦', color: '#FF9600', desc: 'Le vendeur prépare votre colis.' },
  shipped:   { label: 'Expédiée',     emoji: '🚚', color: '#8C40AD', desc: 'Votre colis est en route.' },
  delivered: { label: 'Livrée',       emoji: '🎉', color: '#2D9E73', desc: 'Profitez bien de votre commande !' },
  cancelled: { label: 'Annulée',      emoji: '❌', color: '#EB4D4D', desc: 'Cette commande a été annulée.' }
};

export const ORDER_STATUSES = STATUS_META;

function getState() {
  return store.get('marketplaceOrders') || { list: [] };
}

function saveState(state) {
  store.set('marketplaceOrders', state);
}

function genOrderId() {
  // KIVU-2026-XXXXX format (familiar, scannable)
  const yr = new Date().getFullYear();
  const code = Math.floor(Math.random() * 90000 + 10000);
  return `KIVU-${yr}-${code}`;
}

function nowIso() { return new Date().toISOString(); }

/* ─── Public API ──────────────────────────────────────────── */

/**
 * Create a new order from cart items.
 * Each item = { id, qty, ... } with the productId reference.
 */
export function createOrder(cartItems, paymentMethod = 'KIVU Pay') {
  const items = (cartItems || [])
    .map(i => {
      const p = getProduct(i.id);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        emoji: p.emoji,
        cover: p.cover,
        seller: p.seller,
        country: p.country,
        countryFlag: p.countryFlag,
        price: p.price,
        currency: p.currency,
        qty: i.qty
      };
    })
    .filter(Boolean);

  if (!items.length) return null;

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = subtotal >= 100000 ? 0 : Math.round(subtotal * 0.05); // free over 100k FCFA
  const total = subtotal + shipping;

  const order = {
    id: genOrderId(),
    items,
    subtotal,
    shipping,
    total,
    currency: items[0].currency || 'FCFA',
    paymentMethod,
    status: 'confirmed',
    timeline: [
      { status: 'confirmed', ts: nowIso(), note: 'Commande passée. Le vendeur a été notifié.' }
    ],
    createdAt: nowIso(),
    estimatedDelivery: new Date(Date.now() + 7 * 86400000).toISOString(),
    trackingId: 'KV' + Math.random().toString(36).slice(2, 10).toUpperCase()
  };

  const state = getState();
  state.list = [order, ...(state.list || [])];
  saveState(state);

  // Notify
  notifications.push({
    type: 'system',
    icon: '🎉',
    title: `Commande ${order.id} confirmée`,
    body: `${items.length} article${items.length > 1 ? 's' : ''} · ${total.toLocaleString('fr-FR')} ${order.currency}`,
    actionPath: '/orders'
  });

  // Schedule status progression
  scheduleAdvance(order.id, 'preparing');

  return order;
}

/** List all orders (most recent first) */
export function listOrders() {
  return [...(getState().list || [])].sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function getOrder(id) {
  return (getState().list || []).find(o => o.id === id) || null;
}

export function cancelOrder(id) {
  const state = getState();
  const order = state.list.find(o => o.id === id);
  if (!order || ['delivered', 'cancelled'].includes(order.status)) return false;
  order.status = 'cancelled';
  order.timeline.push({
    status: 'cancelled',
    ts: nowIso(),
    note: 'Commande annulée par l\'acheteur.'
  });
  saveState(state);
  notifications.push({
    type: 'system',
    icon: '❌',
    title: `Commande ${id} annulée`,
    body: 'Le remboursement sera traité sous 3-5 jours ouvrés.',
    actionPath: '/orders'
  });
  return true;
}

/** Stats for /orders page header */
export function ordersStats() {
  const list = getState().list || [];
  return {
    total: list.length,
    active: list.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: list.filter(o => o.status === 'delivered').length,
    totalSpent: list.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)
  };
}

/* ─── Status progression ──────────────────────────────────── */

function scheduleAdvance(orderId, nextStatus) {
  const delay = STAGE_DURATIONS[
    nextStatus === 'preparing' ? 'confirmed' :
    nextStatus === 'shipped'   ? 'preparing' :
    nextStatus === 'delivered' ? 'shipped' : 'confirmed'
  ];
  setTimeout(() => {
    advance(orderId, nextStatus);
  }, delay);
}

function advance(orderId, nextStatus) {
  const state = getState();
  const order = state.list.find(o => o.id === orderId);
  if (!order) return;
  // If order was cancelled, stop progression
  if (order.status === 'cancelled') return;
  // Don't backtrack
  const seq = ['confirmed', 'preparing', 'shipped', 'delivered'];
  const curIdx = seq.indexOf(order.status);
  const nextIdx = seq.indexOf(nextStatus);
  if (nextIdx <= curIdx) return;

  order.status = nextStatus;
  order.timeline.push({
    status: nextStatus,
    ts: nowIso(),
    note: STATUS_META[nextStatus].desc
  });
  saveState(state);

  notifications.push({
    type: 'system',
    icon: STATUS_META[nextStatus].emoji,
    title: `Commande ${order.id} : ${STATUS_META[nextStatus].label}`,
    body: STATUS_META[nextStatus].desc,
    actionPath: '/orders'
  });

  // Schedule next stage
  if (nextStatus === 'preparing') scheduleAdvance(orderId, 'shipped');
  else if (nextStatus === 'shipped') scheduleAdvance(orderId, 'delivered');
}

/** Re-arm any pending status transitions on app load */
export function reinitOrderProgressions() {
  const list = getState().list || [];
  list.forEach(order => {
    if (order.status === 'confirmed') scheduleAdvance(order.id, 'preparing');
    else if (order.status === 'preparing') scheduleAdvance(order.id, 'shipped');
    else if (order.status === 'shipped') scheduleAdvance(order.id, 'delivered');
  });
}
