/**
 * KIVU — Stories list page.
 * Affiche les histoires disponibles, leur statut (nouveau / en cours / terminé),
 * et permet d'en démarrer une.
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { STORIES } from '../data/stories.js';
import { t } from '../i18n/index.js';

export function renderStories() {
  const completed = (store.get('stories') || {}).completed || [];

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">${t('stories.title')}</div>
        <div class="screen-subtitle">${t('stories.subtitle')}</div>
      </div>
    </div>

    <!-- Mascot intro -->
    <div class="card mascot-greeting mb-md">
      <div class="mascot-greeting__avatar">${mascot.thinking(80)}</div>
      <div class="mascot-greeting__body">
        <div class="font-bold">${t('stories.intro')}</div>
        <div class="text-xs text-muted">${t('stories.introSub')}</div>
      </div>
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">${t('stories.catalog')}</h2>
    <div class="grid grid-2 mb-lg story-grid">
      ${STORIES.map(s => renderStoryCard(s, completed.includes(s.id))).join('')}
    </div>
  `;
}

function renderStoryCard(s, isDone) {
  return `
    <button class="story-card"
            data-action="open-story" data-id="${s.id}"
            style="--story-bg: ${s.coverGradient};">
      <div class="story-cover">
        <span class="story-emoji">${s.cover}</span>
        ${isDone ? '<span class="story-done-badge">✓</span>' : ''}
      </div>
      <div class="story-meta">
        <div class="story-title font-bold">${s.title}</div>
        <div class="text-xs text-muted">${s.unit}</div>
        <div class="story-tags">
          <span class="lang-flag-sm">${s.flag}</span>
          <span class="text-xs text-muted">${s.duration}</span>
          <span class="chip chip-accent">+${s.xp} XP</span>
        </div>
      </div>
    </button>
  `;
}

renderStories.mount = () => {
  document.querySelectorAll('[data-action="open-story"]').forEach(btn =>
    btn.addEventListener('click', () => navigate(`/story/${btn.dataset.id}`))
  );
};
