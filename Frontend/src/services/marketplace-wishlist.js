/**
 * KIVU — Marketplace wishlist (favoris produits).
 *
 * Petit service simple : { ids: [productId,...] } persisté dans
 * store.marketplaceWishlist.
 */

import { store } from '../store.js';

function getState() {
  return store.get('marketplaceWishlist') || { ids: [] };
}

export function isWished(productId) {
  return new Set(getState().ids).has(productId);
}

export function toggleWish(productId) {
  const state = getState();
  const set = new Set(state.ids);
  if (set.has(productId)) set.delete(productId);
  else set.add(productId);
  store.set('marketplaceWishlist', { ids: [...set] });
  return set.has(productId);
}

export function listWished() {
  return [...getState().ids];
}

export function wishCount() {
  return (getState().ids || []).length;
}
