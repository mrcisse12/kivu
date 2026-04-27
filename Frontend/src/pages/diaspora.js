/**
 * KIVU — Diaspora : Familles connectées, cultures préservées
 *
 * Fonctionnalités :
 *  • Arbre familial illustré sur 3 générations
 *  • Appel vidéo simulé avec sous-titres bilingues live (TTS + STT)
 *  • Messages vocaux enregistrables + lecture
 *  • Parcours héritage 30 jours
 *  • Histoires de famille avec TTS
 */

import { icons }    from '../components/icons.js';
import { speech }   from '../services/speech.js';
import { api }      from '../services/api.js';
import { store }    from '../store.js';
import { recorder } from '../services/recorder.js';

/* ── Constants ──────────────────────────────────────────────── */

const FAMILY = ['👵🏾','👴🏾','👨🏾','👩🏾','🧒🏾','👶🏾'];
const CITIES = [
  { flag: '🇫🇷', city: 'Paris' },
  { flag: '🇸🇳', city: 'Dakar' },
  { flag: '🇨🇮', city: 'Abidjan' },
  { flag: '🇺🇸', city: 'New York' }
];

const CONTACTS = [
  { id: 'grandma', avatar: '👵🏾', name: 'Mamie Awa',         city: 'Dakar',       lang: 'wol', langName: 'Wolof',   online: true },
  { id: 'uncle',   avatar: '👨🏾',  name: 'Oncle Koffi',       city: 'Abidjan',     lang: 'fra', langName: 'Français', online: true },
  { id: 'cousin',  avatar: '👩🏾',  name: 'Cousine Fanta',     city: 'Bamako',      lang: 'bam', langName: 'Bambara', online: false },
  { id: 'dad',     avatar: '👴🏾',  name: 'Grand-père Moussa', city: 'Paris',       lang: 'fra', langName: 'Français', online: false },
];

const STORIES = [
  { avatar: '👴🏾', title: 'L\'histoire du village',      author: 'Grand-père Moussa', lang: 'bam', langName: 'Bambara', duration: '1 h 17 min',
    ttsText: 'Il était une fois, dans un village au bord du fleuve Niger...' },
  { avatar: '👵🏾', title: 'Le conte du lièvre rusé',      author: 'Grand-mère Awa',   lang: 'wol', langName: 'Wolof',   duration: '22 min',
    ttsText: 'Nit ku baax dañu ko bëgg. Il était une fois un lièvre très malin...' },
  { avatar: '👩🏾‍🍳', title: 'Recette du Thieboudienne',   author: 'Tante Fatou',      lang: 'wol', langName: 'Wolof',   duration: '35 min',
    ttsText: 'Le thieboudienne est le plat national sénégalais. Voici la recette traditionnelle de ma mère...' },
];

// Simulated call phrases from the contact
const CALL_PHRASES = {
  grandma: [
    { text: 'Nanga def yow? Maa ngi di xaar la ci diine.', lang: 'fra', translation: 'Comment vas-tu ? Je t\'attendais depuis ce matin.' },
    { text: 'Demal ci Dakar ak sama bëre nit ñu bëgg.', lang: 'fra', translation: 'Viens à Dakar avec les gens qu\'on aime.' },
    { text: 'Baal ma, sama gëm du soxor ci sa mbir.', lang: 'fra', translation: 'Excuse-moi, ma foi ne vacille pas face à tes affaires.' },
  ],
  uncle: [
    { text: 'Tout va bien à Abidjan. On t\'attend pour les fêtes.', lang: 'fra', translation: 'Everything is fine in Abidjan. We\'re waiting for you for the holidays.' },
    { text: 'Les enfants grandissent vite, tu seras surpris.', lang: 'fra', translation: 'The children grow up fast, you\'ll be surprised.' },
  ],
};

/* ── State ──────────────────────────────────────────────────── */

let callState   = null; // null | { contactId, phraseIdx, subtitles, calling }
let voiceMsg    = null; // { recording: bool, blob: Blob?, session: ? }
let isRecordingVoice = false;
let voiceSession = null;
let voiceMsgs   = []; // [{ id, contactId, text, translation, mine: bool, date }]
let stopStt     = null;

/* ── Helpers ────────────────────────────────────────────────── */

function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── Renders ────────────────────────────────────────────────── */

function renderCallView(contact) {
  const user  = store.get('user') || {};
  const sub   = callState?.subtitles || [];
  const ringing = callState?.calling;

  return `
    <div class="diaspora-call" id="diaspora-call">
      <!-- Video area -->
      <div class="call-video-area">
        <!-- Remote video (simulated) -->
        <div class="call-remote">
          <div class="call-remote__face">${contact.avatar}</div>
          ${ringing ? `
            <div class="call-ringing">
              <div class="ringing-dot"></div><div class="ringing-dot"></div><div class="ringing-dot"></div>
              <div class="text-sm" style="color:white; margin-top:8px;">Appel en cours…</div>
            </div>
          ` : `
            <div class="call-remote__name">${escHtml(contact.name)}</div>
            <div class="call-remote__city">${contact.city} · ${contact.langName}</div>
          `}
        </div>
        <!-- Self preview -->
        <div class="call-self">
          <div class="call-self__face">${user.avatar || '🧑🏾'}</div>
        </div>
      </div>

      <!-- Live subtitles -->
      <div class="call-subtitles" id="call-subtitles">
        ${sub.map((s,i) => `
          <div class="call-sub ${s.mine ? 'call-sub--mine' : ''} ${i === sub.length-1 ? 'call-sub--fresh' : ''}">
            <div class="call-sub__text">${escHtml(s.text)}</div>
            ${s.translation ? `<div class="call-sub__trans">${escHtml(s.translation)}</div>` : ''}
          </div>
        `).join('')}
        ${sub.length === 0 && !ringing ? `
          <div class="call-sub-hint">Les sous-titres apparaîtront ici en temps réel</div>
        ` : ''}
      </div>

      <!-- Controls -->
      <div class="call-controls">
        <button class="call-btn call-btn--mute" data-action="diaspora-speak" aria-label="Parler">
          ${icons.mic(20, 'white')}
        </button>
        <button class="call-btn call-btn--end" data-action="diaspora-end-call" aria-label="Raccrocher">
          ${icons.close(22, 'white')}
        </button>
        <button class="call-btn call-btn--vol" data-action="diaspora-replay" aria-label="Rejouer">
          ${icons.speaker(20, 'white')}
        </button>
      </div>
    </div>
  `;
}

function renderVoiceMessages() {
  if (voiceMsgs.length === 0 && !isRecordingVoice) return '';
  return `
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Messages vocaux</div>
        <span class="text-xs text-muted">${voiceMsgs.length} message${voiceMsgs.length !== 1 ? 's' : ''}</span>
      </div>
      <div class="flex flex-col gap-xs">
        ${voiceMsgs.map(m => `
          <div class="voice-msg ${m.mine ? 'voice-msg--mine' : ''}">
            <div class="voice-msg__avatar">${m.mine ? (store.get('user')?.avatar || '🧑🏾') : m.avatar}</div>
            <div class="voice-msg__body">
              <div class="text-xs font-semibold text-muted mb-xs">${m.mine ? 'Vous' : escHtml(m.name)}</div>
              <div class="voice-msg__text">${escHtml(m.text)}</div>
              ${m.translation ? `<div class="voice-msg__trans">${escHtml(m.translation)}</div>` : ''}
            </div>
            <button class="icon-btn icon-btn--sm" style="color:var(--color-diaspora);"
                    data-action="diaspora-play-msg" data-text="${escHtml(m.text)}" data-lang="${m.lang}"
                    aria-label="Écouter">
              ${icons.speaker(16)}
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderDiaspora() {
  if (callState) {
    const contact = CONTACTS.find(c => c.id === callState.contactId);
    if (contact) return renderCallView(contact);
  }

  return `
    <div class="screen-header animate-slide-down">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(64,179,191,0.15); color:var(--color-diaspora);">
          ${icons.diaspora(28)}
        </span>
        <div>
          <div class="screen-title">Diaspora</div>
          <div class="screen-subtitle">Familles connectées, cultures vivantes</div>
        </div>
      </div>
    </div>

    <!-- Family tree hero -->
    <div class="hero-card mb-md diaspora-hero" style="position:relative; overflow:hidden;">
      <span class="orb" style="background:#7DD3D8; width:140px;height:140px;top:-50px;right:-30px;opacity:0.4"></span>
      <div style="position:relative; z-index:1;">
        <span class="chip chip-white mb-sm">🌳 Mon arbre familial</span>
        <div class="text-2xl font-bold mt-xs">3 générations · 12 membres</div>
        <div class="family-stack mt-md">
          ${FAMILY.map(e => `<span class="family-avatar">${e}</span>`).join('')}
        </div>
        <div class="family-cities">
          ${CITIES.map(c => `<span class="family-city"><span class="lang-flag-sm">${c.flag}</span> ${c.city}</span>`).join('')}
        </div>
      </div>
    </div>

    <!-- Contacts list -->
    <div class="card mb-md">
      <div class="font-bold mb-sm">Famille en ligne</div>
      <div class="flex flex-col gap-xs">
        ${CONTACTS.map(c => `
          <div class="list-row">
            <div class="contact-avatar-wrap">
              <span class="contact-avatar">${c.avatar}</span>
              <span class="contact-status ${c.online ? 'is-online' : ''}"></span>
            </div>
            <div style="flex:1; min-width:0;">
              <div class="font-semibold">${escHtml(c.name)}</div>
              <div class="text-xs text-muted">${c.city} · ${c.langName}</div>
            </div>
            <div class="flex gap-xs">
              <button class="icon-btn icon-btn--sm ${c.online ? '' : 'opacity-50'}"
                      data-action="diaspora-call" data-cid="${c.id}"
                      style="color:var(--color-diaspora);" aria-label="Appel vidéo">
                ${icons.camera(18)}
              </button>
              <button class="icon-btn icon-btn--sm"
                      data-action="diaspora-voice-msg" data-cid="${c.id}"
                      style="color:var(--kivu-tertiary);" aria-label="Message vocal">
                ${icons.mic(18)}
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Voice messages -->
    ${renderVoiceMessages()}

    <!-- Recording indicator -->
    ${isRecordingVoice ? `
      <div class="card mb-md recording-indicator">
        <div class="flex items-center gap-sm">
          <span class="recorder-pulse is-on"></span>
          <div>
            <div class="font-bold">Enregistrement en cours…</div>
            <div class="text-xs text-muted">Parlez maintenant — touchez Arrêter pour envoyer</div>
          </div>
          <button class="btn btn-sm" data-action="diaspora-stop-voice"
                  style="background:var(--error); color:white; margin-left:auto;">
            Arrêter
          </button>
        </div>
      </div>
    ` : ''}

    <!-- Stories de famille -->
    <h2 class="font-display font-bold text-lg mb-sm">Histoires de famille</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${STORIES.map((s,i) => `
        <div class="list-row">
          <div class="avatar" style="background:rgba(64,179,191,0.15)">${s.avatar}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${escHtml(s.title)}</div>
            <div class="text-xs text-muted">par ${escHtml(s.author)} · ${s.langName}</div>
            <div class="text-xs" style="color:var(--color-diaspora);">${s.duration}</div>
          </div>
          <button class="icon-btn icon-btn--play" data-action="diaspora-play-story"
                  data-idx="${i}" aria-label="Écouter">
            ${icons.speaker(20, 'white')}
          </button>
        </div>
      `).join('')}
    </div>

    <!-- Heritage journey -->
    <div class="card heritage-journey mb-lg">
      <div class="flex items-center gap-xs mb-sm">
        <span class="font-bold">Parcours héritage</span>
        <span class="chip chip-primary" style="margin-left:auto;">30 jours</span>
      </div>
      <p class="text-sm text-muted mb-sm">
        Redécouvrez la langue de vos ancêtres en 30 jours. Contes, proverbes et leçons quotidiennes.
      </p>
      <div class="journey-days mb-md">
        ${[1,2,3,4,5,6,7].map(day => `
          <div class="journey-day">
            <span class="journey-dot ${day <= 3 ? 'done' : day === 4 ? 'current' : ''}">
              ${day <= 3 ? icons.check(14, 'white') : day}
            </span>
            <span class="text-xs text-muted">J${day}</span>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-full" style="background:var(--color-diaspora);"
              data-nav="/learn">
        Continuer jour 4 →
      </button>
    </div>
  `;
}

/* ── Mount ──────────────────────────────────────────────────── */

renderDiaspora.mount = function () {
  const main = document.querySelector('main.screen');
  if (!main) return;

  function rerender() {
    main.innerHTML = renderDiaspora();
    renderDiaspora.mount();
  }

  /* ── Video call ────────────────────────────────────────────── */
  document.querySelectorAll('[data-action="diaspora-call"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const cid = btn.dataset.cid;
      const contact = CONTACTS.find(c => c.id === cid);
      if (!contact) return;

      callState = { contactId: cid, phraseIdx: 0, subtitles: [], calling: true };
      document.body.classList.add('in-meeting');
      rerender();

      // Simulate dial → answer after 2s
      setTimeout(() => {
        if (!callState) return;
        callState.calling = false;
        rerender();
        // Start simulated remote speech after 1s
        setTimeout(() => scheduleNextPhrase(contact, rerender), 1000);
      }, 2000);
    })
  );

  document.querySelectorAll('[data-action="diaspora-end-call"]').forEach(btn =>
    btn.addEventListener('click', () => {
      callState = null;
      document.body.classList.remove('in-meeting');
      stopStt?.(); stopStt = null;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="diaspora-speak"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!callState || !speech.sttSupported) {
        // Simulate user speaking
        const demoText = 'Bonjour mamie ! Tout va bien, je t\'appelle depuis Paris.';
        addSubtitle({ text: demoText, translation: null, mine: true });
        renderSubtitles();
        return;
      }
      const user = store.get('user') || {};
      const lang = user.preferredLanguage || 'fra';
      stopStt = speech.startListening(lang, {
        onResult: async ({ text, isFinal }) => {
          if (!isFinal || !text.trim()) return;
          stopStt = null;
          let translation = null;
          try {
            const res = await api.translate(text.trim(), lang, 'fra');
            translation = res.translatedText !== text.trim() ? res.translatedText : null;
          } catch { /* offline */ }
          addSubtitle({ text: text.trim(), translation, mine: true });
          renderSubtitles();
        },
        onError: () => { stopStt = null; },
        onEnd:   () => {}
      });
    })
  );

  document.querySelectorAll('[data-action="diaspora-replay"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const sub = callState?.subtitles;
      if (!sub?.length) return;
      const last = sub[sub.length - 1];
      if (!last.mine && last.text) speech.speak(last.text, 'fra');
    })
  );

  /* ── Voice messages ────────────────────────────────────────── */
  document.querySelectorAll('[data-action="diaspora-voice-msg"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const cid = btn.dataset.cid;
      if (isRecordingVoice) return;
      if (!recorder.supported) {
        // Simulate for demo
        simulateIncomingVoiceMsg(cid);
        return;
      }
      isRecordingVoice = true;
      try {
        voiceSession = await recorder.start();
        rerender();
      } catch {
        isRecordingVoice = false;
        rerender();
      }
    })
  );

  document.querySelectorAll('[data-action="diaspora-stop-voice"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!voiceSession) { isRecordingVoice = false; rerender(); return; }
      const blob = await voiceSession.stop();
      isRecordingVoice = false;
      voiceSession = null;

      const user = store.get('user') || {};
      const lang = user.preferredLanguage || 'fra';
      // Simulate STT of the recording
      const demoText = 'Je vous envoie ce message pour vous dire que tout va bien ici. Je pense à vous.';
      let translation = null;
      try {
        const res = await api.translate(demoText, lang, 'wol');
        translation = res.translatedText;
      } catch { translation = 'Yëgg na ngeen di am jàmm. Dangay xam ni mangi song ngeen.'; }

      voiceMsgs.push({
        id: Date.now(), contactId: 'self', mine: true,
        avatar: user.avatar || '🧑🏾', name: user.name || 'Vous',
        text: demoText, translation, lang, date: new Date().toISOString()
      });
      rerender();

      // Simulate reply after 2s
      setTimeout(() => simulateIncomingVoiceMsg(null), 2000);
    })
  );

  document.querySelectorAll('[data-action="diaspora-play-msg"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const { text, lang } = btn.dataset;
      if (text) speech.speak(text, lang || 'fra');
    })
  );

  /* ── Stories TTS ───────────────────────────────────────────── */
  document.querySelectorAll('[data-action="diaspora-play-story"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      const story = STORIES[idx];
      if (!story) return;
      speech.speak(story.ttsText, 'fra');
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`Lecture : ${story.title}`, { type: 'info', duration: 2000 });
      }
    })
  );
};

/* ── Private helpers ────────────────────────────────────────── */

function addSubtitle(entry) {
  if (!callState) return;
  callState.subtitles.push(entry);
  if (callState.subtitles.length > 6) callState.subtitles.shift();
}

function renderSubtitles() {
  const el = document.getElementById('call-subtitles');
  if (!el || !callState) return;
  const sub = callState.subtitles;
  el.innerHTML = sub.map((s,i) => `
    <div class="call-sub ${s.mine ? 'call-sub--mine' : ''} ${i === sub.length-1 ? 'call-sub--fresh' : ''}">
      <div class="call-sub__text">${escHtml(s.text)}</div>
      ${s.translation ? `<div class="call-sub__trans">${escHtml(s.translation)}</div>` : ''}
    </div>
  `).join('');
  el.scrollTop = el.scrollHeight;
}

function scheduleNextPhrase(contact, rerender) {
  if (!callState) return;
  const phrases = CALL_PHRASES[contact.id] || CALL_PHRASES.grandma;
  const phrase  = phrases[callState.phraseIdx % phrases.length];
  callState.phraseIdx++;

  addSubtitle({ text: phrase.text, translation: phrase.translation, mine: false });
  renderSubtitles();

  // TTS speak the phrase
  if (speech.ttsSupported) speech.speak(phrase.text, 'fra');

  // Schedule next phrase in 5–8s
  setTimeout(() => scheduleNextPhrase(contact, rerender), 5000 + Math.random() * 3000);
}

function simulateIncomingVoiceMsg(cid) {
  const contact = CONTACTS.find(c => c.id === cid) || CONTACTS[0];
  const msgs = [
    'Nanga def yow? Maa ngi di xaar la. Dafa tangaaw ci Dakar tey.',
    'Je pense à toi. Reviens bientôt, la famille t\'attend.',
    'I ka kene? N\'ko ka fisa ko i ye n\'ko la, n teri.',
  ];
  const text = msgs[Math.floor(Math.random() * msgs.length)];
  voiceMsgs.push({
    id: Date.now(), mine: false,
    avatar: contact.avatar, name: contact.name,
    text, translation: 'Comment vas-tu ? Je t\'attendais. Il fait chaud à Dakar aujourd\'hui.',
    lang: contact.lang, contactId: contact.id, date: new Date().toISOString()
  });

  const main = document.querySelector('main.screen');
  if (main && !callState) {
    main.innerHTML = renderDiaspora();
    renderDiaspora.mount();
  }

  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast(`Message vocal de ${contact.name}`, { type: 'info' });
  }
}
