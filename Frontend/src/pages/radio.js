/**
 * Radio Kivi — mode écoute passive enrichi.
 *
 *  - 8 playlists thématiques basées sur les catégories du dictionnaire
 *  - Sélecteur de langue (apprends n'importe laquelle des 8)
 *  - Visualiseur "vinyl" qui tourne pendant la lecture
 *  - Barre de progression sur la phrase courante
 *  - Modes : bilingue (FR + cible), cible seulement, FR seulement
 *  - Vitesse réglable (0.6× → 1.4×)
 *  - Sleep timer (5/10/30 min)
 *  - Shuffle / repeat
 *  - Section "Podcasts" pour culture & histoire (placeholder UX)
 */

import { store } from '../store.js';
import { onLeavePage } from '../services/page-lifecycle.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { speech } from '../services/speech.js';
import { fx } from '../services/audio-fx.js';
import { ENTRIES, CATEGORIES } from '../data/dictionary.js';

const LANG_NAMES = {
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
  hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo'
};
const LANG_FLAGS = {
  swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', dyu: '🇨🇮',
  hau: '🇳🇬', yor: '🇳🇬', zul: '🇿🇦', ibo: '🇳🇬'
};

// Build playlists from dictionary categories (works for any target lang)
function buildPlaylists() {
  return [
    { id: 'all',       emoji: '🌍', title: 'Tout le vocabulaire',  category: null,        gradient: 'linear-gradient(135deg, #174E9C, #1CB0F6)' },
    { id: 'greetings', emoji: '👋', title: 'Salutations',          category: 'greetings', gradient: 'linear-gradient(135deg, #1CB0F6, #58C794)' },
    { id: 'food',      emoji: '🍽️', title: 'Nourriture',           category: 'food',      gradient: 'linear-gradient(135deg, #FF9600, #FFB859)' },
    { id: 'family',    emoji: '👨‍👩‍👧', title: 'Famille',             category: 'family',    gradient: 'linear-gradient(135deg, #8C40AD, #B86BD9)' },
    { id: 'numbers',   emoji: '🔢', title: 'Chiffres 1 à 10',       category: 'numbers',   gradient: 'linear-gradient(135deg, #2D9E73, #58C794)' },
    { id: 'travel',    emoji: '🚌', title: 'Voyage & transport',   category: 'travel',    gradient: 'linear-gradient(135deg, #FACC80, #F2952D)' },
    { id: 'body',      emoji: '🫀', title: 'Le corps',             category: 'body',      gradient: 'linear-gradient(135deg, #EB4D4D, #FF7575)' },
    { id: 'home',      emoji: '🏠', title: 'À la maison',          category: 'home',      gradient: 'linear-gradient(135deg, #40B3BF, #58C794)' },
    { id: 'time',      emoji: '⏰', title: 'Le temps',             category: 'time',      gradient: 'linear-gradient(135deg, #F2952D, #FFB859)' },
    { id: 'feelings',  emoji: '💖', title: 'Émotions',             category: 'feelings',  gradient: 'linear-gradient(135deg, #FF6B9D, #FFB859)' }
  ];
}

const PODCASTS = [
  { id: 'mansa-musa', emoji: '👑', title: 'L\'empire de Mansa Musa', duration: '8 min', host: 'Kivi', description: 'L\'épopée du roi le plus riche de l\'histoire' },
  { id: 'soundiata',  emoji: '🦁', title: 'Soundiata, le lion du Mandé', duration: '12 min', host: 'Kivi', description: 'L\'épopée fondatrice de l\'empire du Mali' },
  { id: 'ubuntu',     emoji: '🤝', title: 'Ubuntu : la philosophie africaine', duration: '6 min', host: 'Kivi', description: '« Je suis parce que nous sommes »' },
  { id: 'griots',     emoji: '🎶', title: 'Les griots gardiens de mémoire', duration: '10 min', host: 'Kivi', description: 'Les bibliothèques humaines de l\'Afrique' },
  { id: 'femmes-leaders', emoji: '👸', title: 'Reines & guerrières d\'Afrique', duration: '14 min', host: 'Kivi', description: 'Yaa Asantewaa, Nzinga, Amina de Zaria…' }
];

let isPlaying = false;
let currentPhraseIdx = 0;
let currentPlaylist = 'greetings';
let currentLang = null;        // null = use user's target lang
let speedRate = 0.92;
let mode = 'bilingual';        // 'bilingual' | 'target' | 'fr'
let shuffle = false;
let sleepMinutes = 0;          // 0 = no timer
let sleepEndAt = 0;
let phraseProgress = 0;        // 0–100
let phraseProgressTimer = null;
let loopId = null;
let lifecycleRegistered = false;

const PLAYLISTS = buildPlaylists();

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function getEffectiveLang() {
  if (currentLang) return currentLang;
  return (store.get('lessons')?.targetLang) || 'swa';
}

function getCurrentTrackList() {
  const playlist = PLAYLISTS.find(p => p.id === currentPlaylist) || PLAYLISTS[0];
  let entries = playlist.category
    ? ENTRIES.filter(e => e.category === playlist.category)
    : [...ENTRIES];
  if (!entries.length) entries = [...ENTRIES];
  if (shuffle) {
    // Stable shuffle based on day so the list is consistent during the session
    const seed = Math.floor(Date.now() / 86_400_000);
    entries = [...entries].sort((a, b) => {
      const ha = (a.id || a.fr).charCodeAt(0) + seed;
      const hb = (b.id || b.fr).charCodeAt(0) + seed;
      return (ha % 17) - (hb % 17);
    });
  }
  return entries;
}

function getCurrentPlaylist() {
  return PLAYLISTS.find(p => p.id === currentPlaylist) || PLAYLISTS[0];
}

/* ─── Render ───────────────────────────────────────────── */

export function renderRadio() {
  const lang = getEffectiveLang();
  const langName = LANG_NAMES[lang] || 'Swahili';
  const langFlag = LANG_FLAGS[lang] || '🇹🇿';
  const list = getCurrentTrackList();
  const phrase = list[currentPhraseIdx % list.length];
  const playlist = getCurrentPlaylist();
  const sleepRemaining = sleepEndAt > 0 ? Math.max(0, Math.ceil((sleepEndAt - Date.now()) / 60000)) : 0;

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Radio Kivi</div>
        <div class="screen-subtitle">Apprends sans effort, juste en écoutant</div>
      </div>
    </div>

    <!-- Now playing card with vinyl + album art -->
    <div class="radio-now mb-md" style="background: ${playlist.gradient};">
      <div class="radio-vinyl-wrap">
        <div class="radio-vinyl ${isPlaying ? 'is-playing' : ''}">
          <div class="radio-vinyl__cover">${playlist.emoji}</div>
        </div>
      </div>
      <div class="radio-track">
        <div class="radio-track__playlist">${playlist.title.toUpperCase()}</div>
        <div class="font-display font-bold radio-track__main">${phrase ? escapeHtml(phrase[lang] || phrase.fr) : '—'}</div>
        <div class="radio-track__sub">${phrase ? `${phrase.emoji || ''} ${escapeHtml(phrase.fr)}` : 'Choisissez une playlist'}</div>
        ${sleepRemaining > 0 ? `<div class="radio-track__sleep">😴 Arrêt dans ${sleepRemaining} min</div>` : ''}
      </div>
      <!-- Progress bar of the current phrase -->
      <div class="radio-progress">
        <div class="radio-progress__fill" style="width: ${phraseProgress}%;"></div>
      </div>
    </div>

    <!-- Player controls -->
    <div class="radio-controls card mb-md">
      <button class="radio-ctrl ${shuffle ? 'is-on' : ''}" data-action="radio-shuffle" title="Lecture aléatoire" aria-label="Aléatoire">
        ${shuffleIcon()}
      </button>
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
      <button class="radio-ctrl ${sleepMinutes > 0 ? 'is-on' : ''}" data-action="radio-sleep-toggle" title="Minuteur de sommeil" aria-label="Minuteur">
        ${sleepIcon()}
      </button>
    </div>

    <!-- Language picker -->
    <div class="text-xs text-muted mb-xs" style="padding:0 4px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase;">Langue</div>
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        <button class="pill-tab ${!currentLang ? 'active' : ''}" data-action="radio-lang" data-lang="">
          🎯 Ma langue cible (${LANG_NAMES[(store.get('lessons')?.targetLang) || 'swa']})
        </button>
        ${Object.entries(LANG_NAMES).map(([id, name]) => `
          <button class="pill-tab ${currentLang === id ? 'active' : ''}" data-action="radio-lang" data-lang="${id}">
            ${LANG_FLAGS[id]} ${name}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Mode + speed -->
    <div class="grid grid-2 mb-md">
      <div class="card">
        <div class="text-xs text-muted mb-xs">Mode de lecture</div>
        <div class="flex gap-xs">
          ${[
            { id: 'bilingual', label: 'FR + ' + langFlag },
            { id: 'target',    label: langFlag + ' seul'  },
            { id: 'fr',        label: '🇫🇷 seul' }
          ].map(m => `
            <button class="chip ${mode === m.id ? 'chip-accent' : 'chip-ghost'}"
                    data-action="radio-mode" data-mode="${m.id}">${m.label}</button>
          `).join('')}
        </div>
      </div>
      <div class="card">
        <div class="text-xs text-muted mb-xs" id="radio-speed-label">Vitesse · ${speedRate.toFixed(2)}×</div>
        <input type="range" min="0.6" max="1.4" step="0.05"
               value="${speedRate}"
               class="a11y-slider"
               data-action="radio-speed" aria-label="Vitesse"/>
      </div>
    </div>

    <!-- Playlists -->
    <h2 class="font-display font-bold text-lg mb-sm">Playlists</h2>
    <div class="radio-playlists mb-md">
      ${PLAYLISTS.map(p => {
        const trackCount = (p.category ? ENTRIES.filter(e => e.category === p.category) : ENTRIES).length;
        return `
        <button class="playlist-card ${currentPlaylist === p.id ? 'is-active' : ''}"
                data-action="radio-playlist" data-id="${p.id}"
                style="--pl-grad: ${p.gradient};">
          <div class="playlist-card__cover">${p.emoji}</div>
          <div class="playlist-card__body">
            <div class="font-bold">${p.title}</div>
            <div class="text-xs text-muted">${trackCount} mots</div>
          </div>
          ${currentPlaylist === p.id && isPlaying ? `<span class="playlist-card__live">${icons.speaker(16)} En cours</span>` : ''}
        </button>
      `;
      }).join('')}
    </div>

    <!-- Podcasts (KIVU original) -->
    <h2 class="font-display font-bold text-lg mb-sm">🎧 Podcasts KIVU</h2>
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">Histoire, culture et sagesse d'Afrique racontées par Kivi</div>
    <div class="radio-podcasts mb-lg">
      ${PODCASTS.map(p => `
        <button class="podcast-row" data-action="radio-podcast" data-id="${p.id}">
          <div class="podcast-cover">${p.emoji}</div>
          <div class="podcast-body">
            <div class="font-bold">${escapeHtml(p.title)}</div>
            <div class="text-xs text-muted">${escapeHtml(p.description)}</div>
            <div class="text-xs text-muted" style="margin-top:2px;">🎙 ${p.host} · ⏱ ${p.duration}</div>
          </div>
          <div class="podcast-play">${icons.speaker(20, 'white')}</div>
        </button>
      `).join('')}
    </div>

    <!-- Tip -->
    <div class="card radio-tip mb-lg">
      <div class="mascot-bubble">
        <div class="mascot-bubble__avatar">${mascot.thinking(64)}</div>
        <div class="mascot-bubble__speech">
          <div class="font-bold">Astuce de Kivi</div>
          <div class="text-sm text-muted">Mets tes écouteurs et lance Radio Kivi pendant
          que tu cuisines ou marches. 20 minutes par jour suffisent pour
          que ton oreille s'habitue à la mélodie de la langue.</div>
        </div>
      </div>
    </div>
  `;
}

/* ─── SVG icons ────────────────────────────────────────── */
function playIcon()    { return `<svg width="36" height="36" viewBox="0 0 24 24" fill="white"><path d="M7 5l13 7-13 7z"/></svg>`; }
function pauseIcon()   { return `<svg width="36" height="36" viewBox="0 0 24 24" fill="white"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`; }
function prevIcon()    { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h2v14H6zM20 5l-12 7 12 7z"/></svg>`; }
function nextIcon()    { return `<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M16 5h2v14h-2zM4 5l12 7-12 7z"/></svg>`; }
function shuffleIcon() { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l5 4-5 4M21 7H6a4 4 0 00-4 4M16 21l5-4-5-4M21 17H6a4 4 0 01-4-4"/></svg>`; }
function sleepIcon()   { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>`; }

/* ─── Lifecycle / interactions ─────────────────────────── */

renderRadio.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  // Register cleanup once: stop playback + reset state when leaving /radio
  if (!lifecycleRegistered) {
    lifecycleRegistered = true;
    onLeavePage('/radio', () => {
      isPlaying = false;
      stopLoop();           // cancels TTS + clears timers
      sleepEndAt = 0;
      sleepMinutes = 0;
      phraseProgress = 0;
      currentPhraseIdx = 0;
      shuffle = false;
    });
  }

  const rerender = () => {
    main.innerHTML = renderRadio();
    renderRadio.mount();
  };

  document.querySelectorAll('[data-action="radio-toggle"]').forEach(btn =>
    btn.addEventListener('click', () => {
      isPlaying = !isPlaying;
      fx.click();
      if (isPlaying) startLoop();
      else stopLoop();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-prev"]').forEach(btn =>
    btn.addEventListener('click', () => { fx.click(); jumpBy(-1); rerender(); })
  );
  document.querySelectorAll('[data-action="radio-next"]').forEach(btn =>
    btn.addEventListener('click', () => { fx.click(); jumpBy(1); rerender(); })
  );

  document.querySelectorAll('[data-action="radio-shuffle"]').forEach(btn =>
    btn.addEventListener('click', () => {
      shuffle = !shuffle;
      fx.click();
      currentPhraseIdx = 0;
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(shuffle ? '🔀 Lecture aléatoire' : '➡️ Lecture séquentielle', { type: 'info', duration: 1400 });
      }
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-sleep-toggle"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      // Cycle: off → 5min → 15min → 30min → off
      if (sleepMinutes === 0)       sleepMinutes = 5;
      else if (sleepMinutes === 5)  sleepMinutes = 15;
      else if (sleepMinutes === 15) sleepMinutes = 30;
      else                          sleepMinutes = 0;

      if (sleepMinutes > 0) {
        sleepEndAt = Date.now() + sleepMinutes * 60_000;
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`😴 Arrêt automatique dans ${sleepMinutes} min`, { type: 'info', duration: 1800 });
        }
      } else {
        sleepEndAt = 0;
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Minuteur désactivé', { type: 'info', duration: 1400 });
        }
      }
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-mode"]').forEach(btn =>
    btn.addEventListener('click', () => { mode = btn.dataset.mode; fx.click(); rerender(); })
  );

  document.querySelectorAll('[data-action="radio-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang || null;
      currentPhraseIdx = 0;
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-speed"]').forEach(input =>
    input.addEventListener('input', () => {
      speedRate = Number(input.value);
      const label = document.getElementById('radio-speed-label');
      if (label) label.textContent = `Vitesse · ${speedRate.toFixed(2)}×`;
    })
  );

  document.querySelectorAll('[data-action="radio-playlist"]').forEach(btn =>
    btn.addEventListener('click', () => {
      currentPlaylist = btn.dataset.id;
      currentPhraseIdx = 0;
      fx.click();
      if (isPlaying) { stopLoop(); startLoop(); }
      rerender();
    })
  );

  document.querySelectorAll('[data-action="radio-podcast"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      fx.click();
      // Synthesize a short Kivi monologue based on the podcast topic
      playPodcast(id);
    })
  );
};

async function playPodcast(id) {
  const pod = PODCASTS.find(p => p.id === id);
  if (!pod) return;
  const intros = {
    'mansa-musa':    'Mansa Musa, empereur du Mali au quatorzième siècle, est considéré comme l\'homme le plus riche de toute l\'histoire de l\'humanité. Pendant son fameux pèlerinage à La Mecque en 1324, il distribuait tellement d\'or que l\'économie égyptienne en a souffert pendant douze ans.',
    'soundiata':     'Soundiata Keita, surnommé le lion du Mandé, fonda l\'empire du Mali après sa victoire à la bataille de Kirina. Son épopée, transmise par les griots depuis des siècles, est l\'un des plus grands récits oraux d\'Afrique.',
    'ubuntu':        'Ubuntu signifie : je suis parce que nous sommes. Cette philosophie d\'Afrique australe exprime l\'interdépendance fondamentale entre tous les êtres humains. Nelson Mandela en a fait le pilier de la réconciliation post-apartheid.',
    'griots':        'Les griots sont les bibliothèques humaines de l\'Afrique de l\'Ouest. Depuis des siècles, ils transmettent oralement l\'histoire, la généalogie et la sagesse de leurs peuples à travers des chants et des récits.',
    'femmes-leaders': 'L\'histoire africaine regorge de reines et guerrières exceptionnelles : Yaa Asantewaa qui mena la résistance Ashanti contre les Britanniques, Nzinga d\'Angola, Amina de Zaria au Nigeria... Toutes ont marqué leur époque par leur courage.'
  };
  const text = intros[id] || pod.description;
  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast(`🎧 Lecture : ${pod.title}`, { type: 'info', duration: 2000 });
  }
  // Stop any ongoing playlist
  isPlaying = false;
  stopLoop();
  // Speak with Kivi's voice
  await speech.speakAsKivi(text, { rate: 1.0 });
}

function jumpBy(delta) {
  const list = getCurrentTrackList();
  if (!list.length) return;
  currentPhraseIdx = (currentPhraseIdx + delta + list.length) % list.length;
  if (isPlaying) {
    stopLoop();
    startLoop();
  }
}

async function startLoop() {
  if (loopId) return;
  loopId = setTimeout(loopTick, 100);
}

function stopLoop() {
  if (loopId) {
    clearTimeout(loopId);
    loopId = null;
  }
  if (phraseProgressTimer) {
    clearInterval(phraseProgressTimer);
    phraseProgressTimer = null;
  }
  speech.cancelSpeech();
}

async function loopTick() {
  if (!isPlaying) return;

  // Sleep timer expiration check
  if (sleepEndAt > 0 && Date.now() >= sleepEndAt) {
    isPlaying = false;
    sleepEndAt = 0;
    sleepMinutes = 0;
    stopLoop();
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('😴 Radio mise en pause par le minuteur', { type: 'info', duration: 2400 });
    }
    const main = document.querySelector('main.screen');
    if (main) { main.innerHTML = renderRadio(); renderRadio.mount(); }
    return;
  }

  const list = getCurrentTrackList();
  if (!list.length) { stopLoop(); return; }
  const phrase = list[currentPhraseIdx % list.length];
  const lang = getEffectiveLang();

  // Estimate phrase duration for progress bar (rough heuristic: 80ms/char + 800ms base)
  const text = phrase[lang] || phrase.fr || '';
  const estimatedMs = Math.max(1200, text.length * 90 / speedRate + 800);
  startProgressBar(estimatedMs);

  try {
    if (mode === 'bilingual') {
      await speech.speak(phrase.fr, 'fra', { rate: speedRate });
      await wait(220);
      if (!isPlaying) return;
      const targetText = phrase[lang] || phrase.fr;
      await speech.speak(targetText, lang, { rate: speedRate });
    } else if (mode === 'fr') {
      await speech.speak(phrase.fr, 'fra', { rate: speedRate });
    } else {
      await speech.speak(phrase[lang] || phrase.fr, lang, { rate: speedRate });
    }
  } catch (e) {
    // Speech failed (browser blocked, no voice, etc.) — show user feedback
    console.warn('[KIVU Radio] speech error:', e);
    isPlaying = false;
    stopLoop();
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('🔇 Lecture vocale impossible — touche play pour réessayer', { type: 'warning', duration: 2800 });
    }
    const main = document.querySelector('main.screen');
    if (main) { main.innerHTML = renderRadio(); renderRadio.mount(); }
    return;
  }

  stopProgressBar();
  if (!isPlaying) return;
  currentPhraseIdx = (currentPhraseIdx + 1) % list.length;

  // Re-render lightly to update "now playing"
  const main = document.querySelector('main.screen');
  if (main) {
    main.innerHTML = renderRadio();
    renderRadio.mount();
  }

  loopId = setTimeout(loopTick, 500);
}

function startProgressBar(durationMs) {
  if (phraseProgressTimer) clearInterval(phraseProgressTimer);
  phraseProgress = 0;
  const startTs = Date.now();
  phraseProgressTimer = setInterval(() => {
    const elapsed = Date.now() - startTs;
    phraseProgress = Math.min(100, (elapsed / durationMs) * 100);
    const fill = document.querySelector('.radio-progress__fill');
    if (fill) fill.style.width = phraseProgress + '%';
  }, 80);
}
function stopProgressBar() {
  if (phraseProgressTimer) {
    clearInterval(phraseProgressTimer);
    phraseProgressTimer = null;
  }
  phraseProgress = 0;
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// Stop audio when navigating away
window.addEventListener('hashchange', () => {
  if (!window.location.hash.includes('/radio')) {
    isPlaying = false;
    stopLoop();
  }
});
