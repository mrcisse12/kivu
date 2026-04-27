/**
 * KIVU — Multi-Party : Réunions multilingues simultanées
 *
 * Flux :
 *  1. Vue liste  → bouton "Nouvelle réunion" → modal création
 *  2. Modal      → génère un code salle, choisit ses participants
 *  3. Vue réunion active → transcript live simulé + micro utilisateur
 *                          STT réel + traduction dans chaque langue
 */

import { icons } from '../components/icons.js';
import { store }  from '../store.js';
import { speech } from '../services/speech.js';
import { api }    from '../services/api.js';

/* ─────────────────────────── Constants ─────────────────────── */

const PARTICIPANTS_POOL = [
  { id: 'a', name: 'Aïcha Diallo',  avatar: '👩🏾‍💼', flag: '🇬🇳', lang: 'fra', langName: 'Français'  },
  { id: 'b', name: 'Koffi Mensah',  avatar: '👨🏾‍💼', flag: '🇧🇯', lang: 'fra', langName: 'Français'  },
  { id: 'c', name: 'Amara Traoré',  avatar: '🧑🏾‍💼', flag: '🇲🇱', lang: 'bam', langName: 'Bambara'   },
  { id: 'd', name: 'Fatou Ndiaye',  avatar: '👩🏿‍💼', flag: '🇸🇳', lang: 'wol', langName: 'Wolof'    },
  { id: 'e', name: 'Pierre Mendy',  avatar: '🧑🏿‍💼', flag: '🇬🇼', lang: 'fra', langName: 'Français'  },
  { id: 'f', name: 'Dr. Amina',     avatar: '👩🏾‍⚕️', flag: '🇳🇪', lang: 'hau', langName: 'Haoussa'   },
  { id: 'g', name: 'Kwame Asante',  avatar: '👨🏿‍💼', flag: '🇬🇭', lang: 'eng', langName: 'Anglais'   },
  { id: 'h', name: 'Zanele Dube',   avatar: '👩🏿‍💼', flag: '🇿🇦', lang: 'eng', langName: 'Anglais'   },
];

const UPCOMING = [
  { time: '14:00',        title: 'Conseil d\'administration', count: 6, flags: ['🇨🇮','🇸🇳','🇰🇪'] },
  { time: '16:30',        title: 'Négociation fournisseur',   count: 3, flags: ['🇲🇱','🇳🇪'] },
  { time: 'Demain 09:00', title: 'Consultation médicale',     count: 2, flags: ['🇧🇫','🇫🇷'] }
];

const TEMPLATES = [
  { emoji: '💼', title: 'Business',      color: 'var(--kivu-secondary)' },
  { emoji: '🏥', title: 'Médical',       color: 'var(--error)' },
  { emoji: '🌐', title: 'Diplomatique',  color: 'var(--kivu-primary)' },
  { emoji: '🎓', title: 'Académique',    color: 'var(--kivu-accent)' }
];

// Simulated phrases per participant (cycling demo content)
const SIM_PHRASES = [
  { pid: 'a', text: 'Je propose qu\'on revoit les termes du contrat avant la signature.' },
  { pid: 'c', text: 'N\'ko ka fisa ko i ye kunnafoni in lajɛ.' },   // Bambara: "It's better to check this info"
  { pid: 'd', text: 'Maa ngi dem ci këlëo bii.' },                  // Wolof: "I'm going to the meeting"
  { pid: 'f', text: 'Ya kamata mu tattauna wannan batun a hankali.' }, // Haoussa: "We should discuss this carefully"
  { pid: 'g', text: 'I agree with the proposal. Let\'s proceed.' },
  { pid: 'b', text: 'Le délai nous semble raisonnable pour les deux parties.' },
  { pid: 'h', text: 'We need more time to review the document.' },
  { pid: 'a', text: 'Parfait. Pouvons-nous fixer la prochaine réunion à jeudi ?' },
];

// Translated versions shown in the transcript for each utterance
const SIM_TRANSLATIONS = {
  'Je propose qu\'on revoit les termes du contrat avant la signature.': 'I propose we review the contract terms before signing.',
  'N\'ko ka fisa ko i ye kunnafoni in lajɛ.': '→ Il vaut mieux vérifier cette information.',
  'Maa ngi dem ci këlëo bii.': '→ Je vais à la réunion aujourd\'hui.',
  'Ya kamata mu tattauna wannan batun a hankali.': '→ Nous devons discuter de cela soigneusement.',
  'I agree with the proposal. Let\'s proceed.': '→ Je suis d\'accord. Allons-y.',
  'Le délai nous semble raisonnable pour les deux parties.': 'The deadline seems reasonable for both parties.',
  'We need more time to review the document.': '→ Nous avons besoin de plus de temps pour revoir le document.',
  'Parfait. Pouvons-nous fixer la prochaine réunion à jeudi ?': 'Perfect. Can we schedule the next meeting on Thursday?',
};

/* ─────────────────────────── State ─────────────────────────── */

let view        = 'list';   // 'list' | 'create' | 'meeting'
let roomCode    = '';
let meetingTitle = '';
let activeParticipants = [];
let transcript  = [];
let simIndex    = 0;
let simTimer    = null;
let elapsedSec  = 0;
let elapsedTimer = null;
let isSpeaking  = false;
let stopListening = null;
let isJoining   = false;
let joinCode    = '';

function genCode() {
  return Math.random().toString(36).substring(2, 5).toUpperCase() + '-' +
         Math.random().toString(36).substring(2, 5).toUpperCase();
}

/* ─────────────────────────── Helpers ───────────────────────── */

function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2,'0');
  const s = String(sec % 60).padStart(2,'0');
  return `${m}:${s}`;
}

function getUser() { return store.get('user') || {}; }

/* ─────────────────────────── Renders ───────────────────────── */

function renderList() {
  return `
    <div class="screen-header animate-slide-down">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(89,128,235,0.15); color:var(--color-multiparty);">
          ${icons.multiparty(28)}
        </span>
        <div>
          <div class="screen-title">Multi-Party</div>
          <div class="screen-subtitle">Réunions en toutes les langues, simultanément</div>
        </div>
      </div>
    </div>

    <!-- CTA Buttons -->
    <div class="grid grid-2 mb-md">
      <button class="btn btn-cta" data-action="mp-new"
              style="background:var(--color-multiparty); color:white;">
        <span class="btn-cta__icon">${icons.camera(20, 'white')}</span>
        Nouvelle réunion
      </button>
      <button class="btn btn-cta btn-cta--ghost" data-action="mp-join"
              style="background:rgba(89,128,235,0.12); color:var(--color-multiparty);">
        <span class="btn-cta__icon">${icons.users(20)}</span>
        Rejoindre
      </button>
    </div>

    <!-- Active meeting card -->
    <div class="card mb-md meeting-card meeting-card--live">
      <div class="flex items-center gap-xs mb-sm">
        <span class="badge-live">En cours</span>
        <span class="text-xs text-muted" style="margin-left:auto">04:23 ⏱</span>
      </div>
      <div class="font-bold text-md mb-sm">Fusion Amani × KIVU</div>
      <div class="participants-stack mb-sm">
        ${PARTICIPANTS_POOL.slice(0,4).map(p => `
          <span class="participant" title="${p.name} — ${p.langName}">
            <span class="participant__avatar">${p.avatar}</span>
            <span class="participant__flag">${p.flag}</span>
          </span>
        `).join('')}
        <span class="participant participant--more">+3</span>
        <button class="btn btn-primary btn-sm" data-action="mp-join-demo"
                style="margin-left:auto; background:var(--color-multiparty);">
          Rejoindre
        </button>
      </div>
      <div class="flex items-center gap-xs flex-wrap">
        ${PARTICIPANTS_POOL.slice(0,4).map(p => `<span class="lang-flag-sm">${p.flag}</span>`).join('')}
        <span class="lang-flag-sm">🇬🇭</span>
        <span class="lang-flag-sm">🇲🇱</span>
        <span class="text-xs" style="color:var(--color-multiparty); margin-left:auto;">7 langues simultanées</span>
      </div>
    </div>

    <!-- Upcoming -->
    <h2 class="font-display font-bold text-lg mb-sm">Prochaines réunions</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${UPCOMING.map(m => `
        <div class="list-row meeting-row">
          <div class="meeting-time">${m.time}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${escHtml(m.title)}</div>
            <div class="text-xs text-muted">${m.flags.join(' ')} · ${m.count} participants</div>
          </div>
          <span class="text-tertiary">${icons.chevronRight(18)}</span>
        </div>
      `).join('')}
    </div>

    <!-- Templates -->
    <h2 class="font-display font-bold text-lg mb-sm">Modèles rapides</h2>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${TEMPLATES.map(t => `
          <button class="card template-card" data-action="mp-new" aria-label="${t.title}">
            <span class="template-emoji" style="color:${t.color};">${t.emoji}</span>
            <div class="font-semibold text-sm">${t.title}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Stats -->
    <div class="hero-card grad-royal mb-lg" style="position:relative; overflow:hidden;">
      <span class="orb" style="background:#5980EB; width:150px;height:150px;top:-60px;right:-30px;opacity:0.3;"></span>
      <div style="position:relative; z-index:1;">
        <span class="chip chip-white mb-sm">Impact mondial</span>
        <div class="grid grid-3 mt-sm">
          <div><div class="font-bold text-xl">2 047</div><div class="text-xs" style="opacity:0.85">Langues</div></div>
          <div><div class="font-bold text-xl">98%</div><div class="text-xs" style="opacity:0.85">Précision</div></div>
          <div><div class="font-bold text-xl">&lt;200ms</div><div class="text-xs" style="opacity:0.85">Latence</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderCreate() {
  const user = getUser();
  return `
    <div class="screen-header">
      <button class="lesson-close" data-action="mp-back" aria-label="Retour">
        ${icons.arrowLeft(22)}
      </button>
      <div class="screen-title">Nouvelle réunion</div>
      <div></div>
    </div>

    <div class="card mb-md text-center">
      <div style="font-size:48px; margin-bottom:8px;">📡</div>
      <div class="font-display font-bold text-xl mb-xs">Votre code de salle</div>
      <div class="mp-code">${roomCode}</div>
      <div class="text-xs text-muted mb-md">Partagez ce code avec les participants</div>
      <button class="btn btn-ghost btn-sm" data-action="mp-copy-code">
        ${icons.copy(14)} Copier le code
      </button>
    </div>

    <div class="card mb-md">
      <label class="form-group">
        <span class="form-label">Titre de la réunion</span>
        <input class="form-input" id="mp-title-input" type="text"
               placeholder="Ex : Conseil d'administration Q2"
               value="${escHtml(meetingTitle)}"/>
      </label>
    </div>

    <div class="card mb-md">
      <div class="font-bold mb-sm">Participants (${activeParticipants.length} / 8)</div>
      <div class="mp-participants-grid">
        ${PARTICIPANTS_POOL.map(p => {
          const sel = activeParticipants.some(a => a.id === p.id);
          return `
            <button class="mp-participant-btn ${sel ? 'is-selected' : ''}"
                    data-action="mp-toggle-participant" data-pid="${p.id}">
              <span style="font-size:24px;">${p.avatar}</span>
              <span class="text-xs font-semibold mt-xs">${p.name.split(' ')[0]}</span>
              <span class="text-xs text-muted">${p.flag} ${p.langName}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>

    <button class="btn btn-primary btn-full mb-lg" data-action="mp-start"
            style="background:var(--color-multiparty);"
            ${activeParticipants.length < 1 ? 'disabled' : ''}>
      ${icons.camera(18, 'white')} Démarrer la réunion
    </button>
  `;
}

function renderMeeting() {
  const user  = getUser();
  const myAvatar = user.avatar || '🧑🏾';
  const myName   = (user.name || 'Vous').split(' ')[0];

  return `
    <div class="mp-meeting-shell">
      <!-- Top bar -->
      <div class="mp-topbar">
        <div>
          <div class="mp-topbar__title">${escHtml(meetingTitle) || 'Réunion KIVU'}</div>
          <div class="mp-topbar__code">${roomCode} · <span class="mp-elapsed">${fmtTime(elapsedSec)}</span></div>
        </div>
        <div class="flex gap-xs">
          <span class="badge-live">En direct</span>
          <button class="btn btn-sm" data-action="mp-end"
                  style="background:var(--error); color:white; border-color:transparent;">
            Quitter
          </button>
        </div>
      </div>

      <!-- Participants row -->
      <div class="mp-participants-bar scroll-x">
        <div class="scroll-x-row gap-sm">
          <!-- Me -->
          <div class="mp-pcard ${isSpeaking ? 'is-speaking' : ''}">
            <div class="mp-pcard__avatar">${myAvatar}</div>
            <div class="mp-pcard__name">${myName}</div>
            <div class="mp-pcard__lang">${icons.mic(10)} Vous</div>
          </div>
          ${activeParticipants.map(p => `
            <div class="mp-pcard" id="pcard-${p.id}">
              <div class="mp-pcard__avatar">${p.avatar}</div>
              <div class="mp-pcard__name">${p.name.split(' ')[0]}</div>
              <div class="mp-pcard__lang">${p.flag} ${p.langName}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Transcript -->
      <div class="mp-transcript" id="mp-transcript">
        ${transcript.map(renderTranscriptLine).join('')}
        ${transcript.length === 0 ? `
          <div class="mp-transcript__empty">
            <div style="font-size:36px;">🎙️</div>
            <div class="font-semibold">La réunion vient de commencer</div>
            <div class="text-xs text-muted mt-xs">Les traductions apparaîtront ici en temps réel</div>
          </div>
        ` : ''}
      </div>

      <!-- Bottom controls -->
      <div class="mp-controls">
        <div class="mp-mic-wrap">
          <button class="mp-mic-btn ${isSpeaking ? 'is-active' : ''}"
                  data-action="mp-speak" aria-label="${isSpeaking ? 'Arrêter' : 'Parler'}">
            ${isSpeaking ? icons.micOff(24, 'white') : icons.mic(24, 'white')}
          </button>
          <span class="text-xs text-muted">${isSpeaking ? 'Écoute…' : 'Parler'}</span>
        </div>

        <div class="mp-info">
          <div class="text-sm font-bold">${activeParticipants.length + 1} participants</div>
          <div class="text-xs text-muted">${new Set(activeParticipants.map(p=>p.lang)).size + 1} langues</div>
        </div>

        <button class="icon-btn icon-btn--sm" data-action="mp-end"
                style="background:var(--error)1a; color:var(--error);" aria-label="Quitter">
          ${icons.close(20)}
        </button>
      </div>
    </div>
  `;
}

function renderTranscriptLine(line) {
  const isMe = line.pid === 'me';
  return `
    <div class="mp-line ${isMe ? 'mp-line--me' : ''} ${line.fresh ? 'mp-line--fresh' : ''}">
      <div class="mp-line__avatar">${line.avatar}</div>
      <div class="mp-line__body">
        <div class="mp-line__meta">
          <span class="mp-line__name">${escHtml(line.name)}</span>
          <span class="mp-line__lang">${line.flag} ${line.langName}</span>
        </div>
        <div class="mp-line__text">${escHtml(line.text)}</div>
        ${line.translation ? `<div class="mp-line__trans">${escHtml(line.translation)}</div>` : ''}
      </div>
    </div>
  `;
}

/* ─────────────────────────── Main render ───────────────────── */

export function renderMultiParty() {
  if (view === 'create')  return renderCreate();
  if (view === 'meeting') return renderMeeting();
  return renderList();
}

/* ─────────────────────────── Mount ─────────────────────────── */

renderMultiParty.mount = function () {
  const main = document.querySelector('main.screen');
  if (!main) return;

  function rerender() {
    main.innerHTML = renderMultiParty();
    renderMultiParty.mount();
  }

  /* ── List view ─────────────────────────────────────────────── */
  document.querySelectorAll('[data-action="mp-new"]').forEach(btn =>
    btn.addEventListener('click', () => {
      roomCode = genCode();
      meetingTitle = '';
      activeParticipants = PARTICIPANTS_POOL.slice(0, 4);
      view = 'create';
      rerender();
    })
  );

  document.querySelectorAll('[data-action="mp-join-demo"]').forEach(btn =>
    btn.addEventListener('click', () => {
      roomCode = 'FUS-ION';
      meetingTitle = 'Fusion Amani × KIVU';
      activeParticipants = [...PARTICIPANTS_POOL];
      startMeeting(rerender);
    })
  );

  document.querySelectorAll('[data-action="mp-join"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const code = prompt('Entrez le code de la réunion :')?.trim().toUpperCase();
      if (!code) return;
      roomCode = code;
      meetingTitle = `Réunion ${code}`;
      activeParticipants = PARTICIPANTS_POOL.slice(0, 3);
      startMeeting(rerender);
    })
  );

  /* ── Create view ───────────────────────────────────────────── */
  document.querySelectorAll('[data-action="mp-back"]').forEach(btn =>
    btn.addEventListener('click', () => { view = 'list'; rerender(); })
  );

  document.querySelectorAll('[data-action="mp-copy-code"]').forEach(btn =>
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(roomCode).then(() => {
        if (window.__KIVU__?.toast) window.__KIVU__.toast(`Code copié : ${roomCode}`, { type: 'success' });
      });
    })
  );

  document.querySelectorAll('[data-action="mp-toggle-participant"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const pid = btn.dataset.pid;
      const p = PARTICIPANTS_POOL.find(p => p.id === pid);
      if (!p) return;
      const idx = activeParticipants.findIndex(a => a.id === pid);
      if (idx === -1) {
        if (activeParticipants.length >= 7) {
          if (window.__KIVU__?.toast) window.__KIVU__.toast('Maximum 7 participants + vous', { type: 'warning' });
          return;
        }
        activeParticipants.push(p);
      } else {
        activeParticipants.splice(idx, 1);
      }
      rerender();
    })
  );

  // Save title on input
  const titleInput = document.getElementById('mp-title-input');
  if (titleInput) {
    titleInput.addEventListener('input', () => { meetingTitle = titleInput.value; });
  }

  document.querySelectorAll('[data-action="mp-start"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const t = document.getElementById('mp-title-input')?.value.trim();
      if (t) meetingTitle = t;
      if (!meetingTitle) meetingTitle = 'Réunion KIVU';
      startMeeting(rerender);
    })
  );

  /* ── Meeting view ──────────────────────────────────────────── */
  document.querySelectorAll('[data-action="mp-end"]').forEach(btn =>
    btn.addEventListener('click', () => endMeeting(rerender))
  );

  document.querySelectorAll('[data-action="mp-speak"]').forEach(btn =>
    btn.addEventListener('click', () => handleSpeak(rerender))
  );

  // Tick elapsed time in DOM without full rerender
  if (view === 'meeting' && elapsedTimer) {
    const el = document.querySelector('.mp-elapsed');
    if (el) el.textContent = fmtTime(elapsedSec);
  }

  // Auto-scroll transcript
  const transcript_el = document.getElementById('mp-transcript');
  if (transcript_el) transcript_el.scrollTop = transcript_el.scrollHeight;
};

/* ─────────────────────────── Meeting logic ─────────────────── */

function startMeeting(rerender) {
  transcript  = [];
  simIndex    = 0;
  elapsedSec  = 0;
  isSpeaking  = false;
  view        = 'meeting';
  rerender();

  // Elapsed clock
  elapsedTimer = setInterval(() => {
    elapsedSec++;
    const el = document.querySelector('.mp-elapsed');
    if (el) el.textContent = fmtTime(elapsedSec);
  }, 1000);

  // Simulate participants speaking every 4s
  simTimer = setInterval(() => simulateNext(rerender), 3800);
  // First one quickly
  setTimeout(() => simulateNext(rerender), 1200);
}

function endMeeting(rerender) {
  clearInterval(simTimer);  simTimer = null;
  clearInterval(elapsedTimer); elapsedTimer = null;
  stopListening?.(); stopListening = null;
  isSpeaking = false;
  view = 'list';
  transcript = [];
  elapsedSec = 0;
  rerender();
  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast('Réunion terminée', { type: 'info', duration: 1800 });
  }
}

function simulateNext(rerender) {
  if (isSpeaking) return; // Don't overlap with user
  const phrase = SIM_PHRASES[simIndex % SIM_PHRASES.length];
  simIndex++;

  const p = activeParticipants.find(a => a.id === phrase.pid) || activeParticipants[0];
  if (!p) return;

  // Highlight speaking card
  document.querySelectorAll('.mp-pcard').forEach(el => el.classList.remove('is-speaking'));
  const card = document.getElementById(`pcard-${p.id}`);
  if (card) card.classList.add('is-speaking');

  const line = {
    pid:        p.id,
    name:       p.name,
    avatar:     p.avatar,
    flag:       p.flag,
    langName:   p.langName,
    text:       phrase.text,
    translation: SIM_TRANSLATIONS[phrase.text] || null,
    fresh:      true,
  };
  transcript.push(line);
  if (transcript.length > 40) transcript.shift(); // keep it bounded

  // Update only transcript section for performance
  const el = document.getElementById('mp-transcript');
  if (el) {
    el.innerHTML = transcript.map(renderTranscriptLine).join('');
    el.scrollTop = el.scrollHeight;
  } else {
    rerender();
  }

  // Remove "fresh" highlight after 1.5s
  setTimeout(() => {
    line.fresh = false;
    const el2 = document.getElementById('mp-transcript');
    if (el2) el2.innerHTML = transcript.map(renderTranscriptLine).join('');
    card?.classList.remove('is-speaking');
  }, 1500);
}

function handleSpeak(rerender) {
  if (isSpeaking) {
    stopListening?.();
    isSpeaking = false;
    rerender();
    return;
  }
  const user = getUser();
  const lang = user.preferredLanguage || 'fra';
  isSpeaking = true;
  rerender();

  if (!speech.sttSupported) {
    // Simulate for demo
    setTimeout(() => {
      isSpeaking = false;
      const demoText = 'Bonjour à tous, je confirme la proposition.';
      const line = {
        pid: 'me', name: user.name || 'Vous', avatar: user.avatar || '🧑🏾',
        flag: user.countryFlag || '🌍', langName: 'Vous',
        text: demoText, translation: 'Hello everyone, I confirm the proposal.',
        fresh: true,
      };
      transcript.push(line);
      if (transcript.length > 40) transcript.shift();
      rerender();
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Message envoyé à tous les participants', { type: 'success' });
    }, 2000);
    return;
  }

  stopListening = speech.startListening(lang, {
    onResult: async ({ text, isFinal }) => {
      if (!isFinal || !text.trim()) return;
      isSpeaking  = false;
      stopListening = null;

      let translation = null;
      try {
        // Translate to English as universal pivot
        const res = await api.translate(text.trim(), lang, 'eng');
        translation = '→ ' + res.translatedText;
      } catch { translation = null; }

      const line = {
        pid: 'me', name: user.name || 'Vous', avatar: user.avatar || '🧑🏾',
        flag: user.countryFlag || '🌍', langName: 'Vous',
        text: text.trim(), translation, fresh: true,
      };
      transcript.push(line);
      if (transcript.length > 40) transcript.shift();
      rerender();

      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Message traduit pour tous les participants', { type: 'success' });
      }
    },
    onError: () => { isSpeaking = false; stopListening = null; rerender(); },
    onEnd:   () => { if (isSpeaking) { isSpeaking = false; rerender(); } }
  });
}
