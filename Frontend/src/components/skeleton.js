/**
 * KIVU — Skeleton loaders.
 *
 * Petits utilitaires HTML pour afficher des placeholders animés
 * pendant le chargement async de données. Le shimmer est purement
 * CSS — aucun JS de polling.
 *
 * Usage :
 *   import { skeletonCard, skeletonRow, skeletonGrid } from './skeleton.js';
 *   container.innerHTML = skeletonGrid(6);  // pendant le fetch
 */

export function skeletonLine({ width = '100%', height = '14px', rounded = '4px' } = {}) {
  return `<div class="kivu-skel" style="width:${width}; height:${height}; border-radius:${rounded};"></div>`;
}

export function skeletonCircle(size = 40) {
  return `<div class="kivu-skel" style="width:${size}px; height:${size}px; border-radius:999px; flex-shrink:0;"></div>`;
}

export function skeletonRow() {
  return `
    <div class="kivu-skel-row">
      ${skeletonCircle(40)}
      <div style="flex:1; display:flex; flex-direction:column; gap:6px;">
        ${skeletonLine({ width: '60%' })}
        ${skeletonLine({ width: '40%', height: '12px' })}
      </div>
    </div>
  `;
}

export function skeletonCard() {
  return `
    <div class="kivu-skel-card">
      ${skeletonLine({ height: '100px', rounded: '12px' })}
      ${skeletonLine({ width: '70%' })}
      ${skeletonLine({ width: '50%', height: '12px' })}
    </div>
  `;
}

export function skeletonGrid(count = 4) {
  return `
    <div class="kivu-skel-grid">
      ${Array.from({ length: count }, () => skeletonCard()).join('')}
    </div>
  `;
}

export function skeletonStat() {
  return `
    <div class="kivu-skel-stat">
      ${skeletonLine({ width: '40%', height: '24px' })}
      ${skeletonLine({ width: '60%', height: '10px' })}
    </div>
  `;
}
