/**
 * Radio Kivi — mode écoute passive.
 *
 * Lit en boucle les phrases du dictionnaire dans la langue cible,
 * intercalées avec leur traduction française. Idéal pour :
 *   - apprendre en faisant la cuisine, en marchant
 *   - habituer l'oreille à la langue cible
 *   - moments d'attente improductifs
 *
 * Utilise SpeechSynthesis (pas de fichier audio). Reprend depuis le dernier
 * mot lu après une pause/lock.
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { speech, toBcp47 } from '../services/speech.js';
import { PHRASES, LANG_LABELS } from '../data/flashcards.js';

const PLAYLIST_THEMES = [
  { id: 'greetings', emoji: '🌅', title: 'Salutations & politesse',
    keys: ['Bonjour', 'Merci', 'Comment ça va ?', 'Au revoir', 'Oui', 'Non'] },
  { id: 'essentials', emoji: '💧', title: 'Mots essentiels',
    keys: ['Eau', 'Famille', 'Bonjour', 'Merci'] },
  { id: 'all', emoji: '🌍', title: 'Tout le vocabulaire',
    keys: PHRASES.map(p => p.fr) }
];

let isPlaying = false;
let currentPhraseIdx = 0;
let currentPlaylist = 'greetings';
let speedRate = 0.85;
let mode = 'bilingual'; // 'bilingual' (FR + cible) | 'target' (cible seulement)
let loopId = null;

export function renderRadio() {
  const lang = (store.get('lessons')?.targetLang) || 'swa';
  const langInfo = LANG_LABELS[lang] || { name: 'Swahili', flag: '🇹🇿' };
  const playlist = getCurrentPlaylist();
  const phrase = playlist[currentPhraseIdx % playlist.length];

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Radio Kivi</div>
        <div class="screen-subtitle">Apprenez sans effort, juste en écoutant</div>
      </div>
    </div>

    <!-- Now playing card -->
    <div class="radio-now-playing card mb-md">
      <div class="radio-vinyl ${isPlaying ? 'is-playing' : ''}">
        <div class="radio-vinyl__inner">${mascot[isPlaying ? 'cheering' : 'thinking'](80)}</div>
      </div>
      <div class="radio-track">
        <div class="text-xs text-muted">En cours · ${langInfo.flag} ${langInfo.name}</div>
        <div class="font-display font-bold text-xl mt-xs">${phrase ? escapeHtml(phrase[lang] || phrase.fr) : '—'}</div>
        <div class="text-sm text-muted">${phrase ? escapeHtml(phrase.fr) : 'Choisissez une playlist'}</div>
      </div>
    </div>

    <!-- Player controls -->
    <div class="radio-controls card mb-md">
      <button class="radio-ctrl" data-action="radio-prev" aria-label="Précédent">
        ${prevIcon()}
      </button>
      <button class="radio-ctrl radio-ctrl--play"
              data-action="radio-toggle"
              aria-label="${isPlaying ? 'Pause' : 'Lecture'}">
        ${isPlaying ? pauseIcon() : playIcon()}
      </button>
      <button class="radio-ctrl" data-action="radio-next" aria-label="Suivant">
        ${nextIcon()}
      </button>
    </div>

    <!-- Mode + speed -->
    <div class="grid grid-2 mb-md">
      <div class="card">
        <div class="text-xs text-muted mb-xs">Mode</div>
        <div class="flex gap-xs">
          ${[
            { id: 'bilingual', label: 'FR + cible' },
            { id: 'target',    label: 'Cible seul'  }
          ].map(m => `
            <button class="chip ${mode === m.id ? 'chip-accent' : 'chip-ghost'}"
                    data-action="radio-mode" data-mode="${m.id}">${m.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="text-xs text-muted mb-xs">Vitesse · ${speedRate.toFixed(2)}×</div>
        <input type="range" min="0.6" max="1.4" step="0.05"
               value="${speedRate}"
               class="a11y-slider"
               data-action="radio-speed" aria-label="Vitesse"/>
      </div>
    </div>

    <!-- Playlists -->
    <h2 class="font-display font-bold text-lg mb-sm">Playlists</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${PLAYLIST_THEMES.map(p => `
        <button class="list-row playlist-row ${currentPlaylist === p.id ? 'is-active' : ''}"
                data-action="radio-playlist" data-id="${p.id}">
          <div class="playlist-emoji" aria-hidden="true">${p.emoji}</div>
          <div style="flex:1;">
            <div class="font-semibold">${p.title}</div>
            <div class="text-xs text-muted">${p.keys.length} phrases · boucle infinie</div>
          </div>
          <span class="text-tertiary">${currentPlaylist === p.id && isPlaying ? icons.speaker(18, 'currentColor') : icons.chevronRight(18)}</span>
        </button>
      `).join('')}
    </div>

    <!-- Tips -->
    <div class="card radio-tip mb-lg">
      <div class="mascot-bubble">
        <div class="mascot-bubble__avatar">${mascot.thinking(64)}</div>
        <div class="mascot-bubble__speech">
          <div class="font-bold">Astuce de Kivi</div>
          <div class="text-sm text-muted">Mettez vos écouteurs et lancez Radio Kivi pendant
          que vous cuisinez ou marchez. 20 minutes par jour suffisent pour
          que votre oreille s'habitue.</div>
        </div>
      </div>
    </div>
  `;
}

function getCurrentPlaylist() {
  const theme = PLAYLIST_THEMES.find(p => p.id === currentPlaylist);
  if (!theme) return PHRASES;
  return theme.keys.map(k => PHRASES.find(p => p.fr === k)).filter(Boolean);
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}

// SVG icons inline (control symbols)
function playIcon()  { return `<svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M7 5l13 7-13 7z"/></svg>`; }
function pauseIcon() { return `<svg width="36" height="36" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`; }
function prevIcon()  { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5l-12 7 12 7z"/></svg>`; }
function nextIcon()  { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l12 7-12 7z"/></svg>`; }

// ----- Lifecycle --------------------------------------------------------
renderRadio.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderRadio();
    renderRadio.mount();
  };

  document.querySelectorAll('[data-action="radio-toggle"]').forEach(btn =>
    btn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      if (isPlaying) startLoop();
      else stopLoop();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-prev"]').forEach(btn =>
    btn.addEventListener('click', () => { jumpBy(-1); rerender(); })
  );
  document.querySelectorAll('[data-action="radio-next"]').forEach(btn =>
    btn.addEventListener('click', () => { jumpBy(1); rerender(); })
  );

  document.querySelectorAll('[data-action="radio-mode"]').forEach(btn =>
    btn.addEventListener('click', () => { mode = btn.dataset.mode; rerender(); })
  );

  document.querySelectorAll('[data-action="radio-speed"]').forEach(input =>
    input.addEventListener('input', () => {
      speedRate = Number(input.value);
      const label = input.closest('.card')?.querySelector('.text-xs');
      if (label) label.textContent = `Vitesse · ${speedRate.toFixed(2)}×`;
    })
  );

  document.querySelectorAll('[data-action="radio-playlist"]').forEach(btn =>
    btn.addEventListener('click', () => {
      currentPlaylist = btn.dataset.id;
      currentPhraseIdx = 0;
      rerender();
    })
  );
};

function jumpBy(delta) {
  const list = getCurrentPlaylist();
  if (!list.length) return;
  currentPhraseIdx = (currentPhraseIdx + delta + list.length) % list.length;
  if (isPlaying) {
    stopLoop();
    startLoop();
  }
}

async function startLoop() {
  if (loopId) return; // already running
  loopId = setTimeout(loopTick, 100);
}

function stopLoop() {
  if (loopId) {
    clearTimeout(loopId);
    loopId = null;
  }
  speech.cancelSpeech();
}

async function loopTick() {
  if (!isPlaying) return;
  const list = getCurrentPlaylist();
  if (!list.length) { stopLoop(); return; }
  const phrase = list[currentPhraseIdx % list.length];
  const lang = (store.get('lessons')?.targetLang) || 'swa';

  try {
    if (mode === 'bilingual') {
      await speech.speak(phrase.fr, 'fra', { rate: speedRate });
      await wait(250);
      if (!isPlaying) return;
      await speech.speak(phrase[lang] || phrase.fr, lang, { rate: speedRate });
    } else {
      await speech.speak(phrase[lang] || phrase.fr, lang, { rate: speedRate });
    }
  } catch (e) { /* ignore */ }

  if (!isPlaying) return;
  currentPhraseIdx = (currentPhraseIdx + 1) % list.length;

  // Re-render lightly to update "now playing"
  const main = document.querySelector('main.screen');
  if (main) {
    main.innerHTML = renderRadio();
    renderRadio.mount();
  }

  // schedule next
  loopId = setTimeout(loopTick, 600);
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// Stop audio when navigating away
window.addEventListener('hashchange', () => {
  if (!window.location.hash.includes('/radio')) {
    isPlaying = false;
    stopLoop();
  }
});
