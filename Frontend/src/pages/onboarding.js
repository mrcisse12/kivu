/**
 * KIVU — Onboarding spectaculaire (9 étapes).
 *
 *  0. Welcome (Kivi salue)
 *  1. Prénom (saisie texte)
 *  2. Avatar (12 emojis)
 *  3. Langue maternelle (15 langues)
 *  4. Langue à apprendre (8 langues africaines)
 *  5. Motivation (6 raisons)
 *  6. Niveau actuel (4 paliers)
 *  7. Objectif quotidien (4 paliers)
 *  8. Summary personnalisé → /login
 *
 * Auto-save à chaque step (rechargement = reprise au même endroit).
 * Animations slide horizontales (forward/back).
 * Validation par étape (CTA disabled si pas de choix).
 * Sons sur sélection / passage / terminer.
 * Confetti + badge "Pionnier" sur l'écran final.
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { fx } from '../services/audio-fx.js';
import { notifications } from '../services/notifications.js';

/* ─── Data ────────────────────────────────────────────────── */

const AVATARS = [
  '👩🏾','👨🏾','🧑🏾','👩🏿','👨🏿','🧑🏿',
  '👩🏼','👨🏼','🧑🏼','👩🏽','👨🏽','🧑🏽'
];

const MOTHER_TONGUES = [
  { id: 'fra', name: 'Français',   native: 'Français',     flag: '🇫🇷' },
  { id: 'eng', name: 'Anglais',    native: 'English',      flag: '🇬🇧' },
  { id: 'ara', name: 'Arabe',      native: 'العربية',      flag: '🇸🇦' },
  { id: 'por', name: 'Portugais',  native: 'Português',    flag: '🇵🇹' },
  { id: 'wol', name: 'Wolof',      native: 'Wolof',        flag: '🇸🇳' },
  { id: 'bam', name: 'Bambara',    native: 'Bamanankan',   flag: '🇲🇱' },
  { id: 'dyu', name: 'Dioula',     native: 'Jula',         flag: '🇨🇮' },
  { id: 'swa', name: 'Swahili',    native: 'Kiswahili',    flag: '🇹🇿' },
  { id: 'hau', name: 'Haoussa',    native: 'Hausa',        flag: '🇳🇬' },
  { id: 'yor', name: 'Yoruba',     native: 'Yorùbá',       flag: '🇳🇬' },
  { id: 'zul', name: 'Zulu',       native: 'isiZulu',      flag: '🇿🇦' },
  { id: 'ibo', name: 'Igbo',       native: 'Asụsụ Igbo',   flag: '🇳🇬' },
  { id: 'lin', name: 'Lingala',    native: 'Lingála',      flag: '🇨🇩' },
  { id: 'amh', name: 'Amharique',  native: 'አማርኛ',         flag: '🇪🇹' },
  { id: 'other', name: 'Autre',    native: 'Other',         flag: '🌍' }
];

const MOTIVATIONS = [
  { id: 'travel',   emoji: '✈️',     label: 'Voyager',                desc: 'Découvrir de nouveaux pays' },
  { id: 'family',   emoji: '👨‍👩‍👧', label: 'Famille',               desc: 'Connecter avec mes proches' },
  { id: 'career',   emoji: '💼',     label: 'Carrière',               desc: 'Développer mon business' },
  { id: 'culture',  emoji: '🛡️',     label: 'Culture & héritage',     desc: 'Préserver mes racines' },
  { id: 'fun',      emoji: '🎮',     label: 'Pour le plaisir',        desc: "M'amuser et apprendre" },
  { id: 'school',   emoji: '🎓',     label: 'École / études',         desc: 'Réussir mes examens' }
];

const TARGETS = [
  { id: 'swa', name: 'Swahili',   native: 'Kiswahili',   flag: '🇹🇿', speakers: 200, gradient: 'linear-gradient(135deg, #1CB0F6, #0E8B9F)' },
  { id: 'wol', name: 'Wolof',     native: 'Wolof',        flag: '🇸🇳', speakers:  10, gradient: 'linear-gradient(135deg, #2D9E73, #58C794)' },
  { id: 'bam', name: 'Bambara',   native: 'Bamanankan',   flag: '🇲🇱', speakers:  15, gradient: 'linear-gradient(135deg, #F2952D, #FFB859)' },
  { id: 'hau', name: 'Haoussa',   native: 'Hausa',        flag: '🇳🇬', speakers:  70, gradient: 'linear-gradient(135deg, #8C40AD, #B86BD9)' },
  { id: 'yor', name: 'Yoruba',    native: 'Yorùbá',       flag: '🇳🇬', speakers:  45, gradient: 'linear-gradient(135deg, #EB4D4D, #FF7575)' },
  { id: 'zul', name: 'Zulu',      native: 'isiZulu',      flag: '🇿🇦', speakers:  12, gradient: 'linear-gradient(135deg, #E11D74, #FF6BAA)' },
  { id: 'ibo', name: 'Igbo',      native: 'Asụsụ Igbo',   flag: '🇳🇬', speakers:  24, gradient: 'linear-gradient(135deg, #40B3BF, #58C794)' },
  { id: 'lin', name: 'Lingala',   native: 'Lingála',      flag: '🇨🇩', speakers:  20, gradient: 'linear-gradient(135deg, #FACC80, #F2952D)' }
];

const LEVELS = [
  { id: 'beginner',     emoji: '🌱', label: 'Tout débutant',  desc: 'Je ne connais rien à cette langue' },
  { id: 'basics',       emoji: '🌿', label: 'Quelques bases', desc: 'Je sais saluer et compter' },
  { id: 'intermediate', emoji: '🌳', label: 'Intermédiaire',  desc: 'Je peux tenir une conversation simple' },
  { id: 'advanced',     emoji: '🏆', label: 'Avancé',         desc: 'Je veux perfectionner ma maîtrise' }
];

const GOALS = [
  { id: 'casual',  minutes:  5, label: 'Détendu',  emoji: '☕', desc: '5 min/jour' },
  { id: 'regular', minutes: 10, label: 'Régulier', emoji: '🌟', desc: '10 min/jour' },
  { id: 'serious', minutes: 20, label: 'Sérieux',  emoji: '🔥', desc: '20 min/jour' },
  { id: 'intense', minutes: 30, label: 'Intense',  emoji: '🚀', desc: '30 min/jour ou +' }
];

const STEP_GRADIENTS = [
  'grad-hero',    // 0 welcome
  'grad-royal',   // 1 name
  'grad-sunset',  // 2 avatar
  'grad-savanna', // 3 mother tongue
  'grad-sunset',  // 4 target lang
  'grad-savanna', // 5 motivation
  'grad-royal',   // 6 level
  'grad-savanna', // 7 goal
  'grad-hero'     // 8 summary
];

const TOTAL_QUESTIONS = 7; // steps 1..7 (excludes welcome + summary)
const STORAGE_KEY = 'kivu.onboarding.draft';

/* ─── State ───────────────────────────────────────────────── */

let step = 0;
let direction = 'forward';   // 'forward' | 'back' — for slide animation
let answers = loadDraft();

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (typeof d.step === 'number') step = Math.max(0, Math.min(8, d.step));
      return {
        name: d.name || '',
        avatar: d.avatar || null,
        motherTongue: d.motherTongue || null,
        targetLang: d.targetLang || null,
        motivation: d.motivation || null,
        level: d.level || null,
        goalId: d.goalId || null
      };
    }
  } catch {}
  return {
    name: '',
    avatar: null,
    motherTongue: null,
    targetLang: null,
    motivation: null,
    level: null,
    goalId: null
  };
}

function saveDraft() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, step }));
  } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

/* ─── Validation ─────────────────────────────────────────── */

function canContinue() {
  switch (step) {
    case 0: return true;                              // welcome
    case 1: return (answers.name || '').trim().length >= 2;
    case 2: return !!answers.avatar;
    case 3: return !!answers.motherTongue;
    case 4: return !!answers.targetLang;
    case 5: return !!answers.motivation;
    case 6: return !!answers.level;
    case 7: return !!answers.goalId;
    case 8: return true;                              // summary
    default: return false;
  }
}

/* ─── Render helpers ─────────────────────────────────────── */

function escapeAttr(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escapeHtml(s) { return escapeAttr(s); }

export function renderOnboarding() {
  const renderers = [
    renderWelcome,      // 0
    renderName,         // 1
    renderAvatar,       // 2
    renderMotherTongue, // 3
    renderTargetLang,   // 4
    renderMotivation,   // 5
    renderLevel,        // 6
    renderGoal,         // 7
    renderSummary       // 8
  ];
  const fn = renderers[step] || renderWelcome;
  return fn();
}

function shell(content, { showBack = true, showSkip = false } = {}) {
  const gradient = STEP_GRADIENTS[step] || 'grad-hero';
  const inQuestion = step >= 1 && step <= TOTAL_QUESTIONS;
  const progressPct = inQuestion ? (step / TOTAL_QUESTIONS) * 100 : 0;
  return `
    <div class="onboarding-v2 onb-bg-${gradient}" data-step="${step}" data-direction="${direction}">
      <div class="orb orb--accent" style="width:280px;height:280px;top:-100px;right:-80px;opacity:0.30"></div>
      <div class="orb orb--primary" style="width:220px;height:220px;bottom:-80px;left:-60px;opacity:0.25;animation-delay:-3s;"></div>

      <header class="onb-header">
        ${showBack && step > 0 ? `
          <button class="onb-back" data-action="onb-back" aria-label="Retour">
            ${icons.arrowLeft(20)}
          </button>
        ` : '<div></div>'}

        ${inQuestion ? `
          <div class="onb-progress" aria-label="Étape ${step} sur ${TOTAL_QUESTIONS}">
            <div class="onb-progress__fill" style="width:${progressPct}%;"></div>
            <span class="onb-progress__label">${step}/${TOTAL_QUESTIONS}</span>
          </div>
        ` : '<div class="onb-brand">KIVU</div>'}

        ${showSkip ? `
          <button class="onb-skip" data-action="onb-skip">Passer</button>
        ` : '<div></div>'}
      </header>

      <main class="onb-body onb-slide" key="step-${step}">
        ${content}
      </main>
    </div>
  `;
}

/* ─── Step 0 : Welcome ───────────────────────────────────── */
function renderWelcome() {
  return shell(`
    <div class="onb-mascot animate-float">${mascot.waving(180)}</div>
    <span class="chip chip-white">2 000+ langues africaines</span>
    <h1 class="onb-title">Bienvenue dans KIVU</h1>
    <p class="onb-sub">Je suis Kivi, ton compagnon. En 7 questions, je prépare ton parcours sur mesure.</p>
    <div class="onb-actions">
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Commencer
        ${icons.arrowRight(18)}
      </button>
      <button class="onb-link" data-action="onb-skip">Plus tard</button>
    </div>
  `, { showBack: false, showSkip: false });
}

/* ─── Step 1 : Name ──────────────────────────────────────── */
function renderName() {
  const valid = canContinue();
  return shell(`
    <div class="onb-mascot-sm animate-float">${mascot.happy(120)}</div>
    <h2 class="onb-question">Comment t'appelles-tu&nbsp;?</h2>
    <p class="onb-question-sub">Ton prénom me permettra de personnaliser tes encouragements.</p>

    <div class="onb-input-wrap">
      <input id="onb-name-input"
             class="onb-input"
             type="text"
             placeholder="Ton prénom"
             value="${escapeAttr(answers.name)}"
             autocapitalize="words"
             autocomplete="given-name"
             maxlength="32"
             autofocus/>
      <span class="onb-input-hint ${valid ? 'is-ok' : ''}">
        ${valid ? '✓ Parfait' : 'Au moins 2 lettres'}
      </span>
    </div>

    <button class="btn btn-white btn-full onb-cta ${valid ? '' : 'is-disabled'}"
            data-action="onb-next" ${valid ? '' : 'disabled'}>
      Continuer ${icons.arrowRight(18)}
    </button>
  `, { showBack: true, showSkip: true });
}

/* ─── Step 2 : Avatar ────────────────────────────────────── */
function renderAvatar() {
  return shell(`
    <h2 class="onb-question">Choisis ton avatar</h2>
    <p class="onb-question-sub">Tu pourras le changer dans ton profil.</p>

    <div class="onb-avatar-grid">
      ${AVATARS.map(av => `
        <button class="onb-avatar-btn ${answers.avatar === av ? 'is-selected' : ''}"
                data-action="pick-avatar" data-avatar="${av}"
                aria-label="Choisir ${av}">
          <span aria-hidden="true">${av}</span>
        </button>
      `).join('')}
    </div>

    ${answers.avatar ? `
      <div class="onb-preview animate-scale-in">
        <div class="onb-preview__avatar">${answers.avatar}</div>
        <div>
          <div class="text-xs onb-summary-label">Salut !</div>
          <div class="font-bold">${escapeHtml(answers.name || 'toi')}</div>
        </div>
      </div>
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>
    ` : `
      <button class="btn btn-white btn-full onb-cta is-disabled" disabled>
        Choisis un avatar
      </button>
    `}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 3 : Mother tongue ─────────────────────────────── */
function renderMotherTongue() {
  return shell(`
    <h2 class="onb-question">Quelle est ta langue maternelle&nbsp;?</h2>
    <p class="onb-question-sub">Pour adapter mes traductions et mes explications.</p>

    <div class="onb-mt-grid">
      ${MOTHER_TONGUES.map(l => `
        <button class="onb-mt-card ${answers.motherTongue === l.id ? 'is-selected' : ''}"
                data-action="pick-mother-tongue" data-id="${l.id}">
          <span class="onb-mt-flag" aria-hidden="true">${l.flag}</span>
          <div class="onb-mt-body">
            <div class="font-bold">${l.name}</div>
            <div class="text-xs onb-mt-native">${l.native}</div>
          </div>
          ${answers.motherTongue === l.id ? `<span class="onb-mt-check">${icons.check(14, 'white')}</span>` : ''}
        </button>
      `).join('')}
    </div>

    ${answers.motherTongue ? `
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>` : ''}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 4 : Target language ───────────────────────────── */
function renderTargetLang() {
  return shell(`
    <h2 class="onb-question">Quelle langue veux-tu apprendre&nbsp;?</h2>
    <p class="onb-question-sub">8 langues officiellement supportées. D'autres arrivent !</p>

    <div class="lang-target-grid">
      ${TARGETS.map(l => `
        <button class="lang-target-card ${answers.targetLang === l.id ? 'active' : ''}"
                data-action="pick-target" data-id="${l.id}"
                style="--card-grad: ${l.gradient};">
          <span class="lang-target-card__flag">${l.flag}</span>
          <div class="lang-target-card__body">
            <div class="font-bold">${l.name}</div>
            <div class="text-xs">${l.native}</div>
            <div class="text-xs lang-target-card__speakers">${l.speakers} M locuteurs</div>
          </div>
          ${answers.targetLang === l.id ? `<span class="lang-target-card__check">${icons.check(14, 'white')}</span>` : ''}
        </button>
      `).join('')}
    </div>

    ${answers.targetLang ? `
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>` : ''}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 5 : Motivation ────────────────────────────────── */
function renderMotivation() {
  return shell(`
    <h2 class="onb-question">Pourquoi apprendre une langue africaine&nbsp;?</h2>
    <p class="onb-question-sub">Choisis ce qui te ressemble le plus.</p>

    <div class="choice-grid">
      ${MOTIVATIONS.map(m => `
        <button class="choice-card ${answers.motivation === m.id ? 'active' : ''}"
                data-action="pick-motivation" data-id="${m.id}">
          <span class="choice-card__emoji">${m.emoji}</span>
          <div class="choice-card__body">
            <div class="font-bold">${m.label}</div>
            <div class="text-xs text-muted">${m.desc}</div>
          </div>
          <span class="choice-card__check">${icons.check(16, 'white')}</span>
        </button>
      `).join('')}
    </div>

    ${answers.motivation ? `
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>` : ''}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 6 : Level ─────────────────────────────────────── */
function renderLevel() {
  const lang = TARGETS.find(t => t.id === answers.targetLang);
  return shell(`
    <h2 class="onb-question">Ton niveau en ${lang?.name || 'cette langue'}&nbsp;?</h2>
    <p class="onb-question-sub">Sois honnête, c'est pour adapter ton parcours.</p>

    <div class="level-grid">
      ${LEVELS.map(l => `
        <button class="level-card ${answers.level === l.id ? 'active' : ''}"
                data-action="pick-level" data-id="${l.id}">
          <span class="level-card__emoji">${l.emoji}</span>
          <div class="level-card__body">
            <div class="font-bold">${l.label}</div>
            <div class="text-xs text-muted">${l.desc}</div>
          </div>
        </button>
      `).join('')}
    </div>

    ${answers.level ? `
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>` : ''}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 7 : Daily goal ────────────────────────────────── */
function renderGoal() {
  return shell(`
    <h2 class="onb-question">Combien de temps par jour&nbsp;?</h2>
    <p class="onb-question-sub">Choisis un objectif réaliste. La régularité bat l'intensité.</p>

    <div class="goal-grid">
      ${GOALS.map(g => `
        <button class="goal-card ${answers.goalId === g.id ? 'active' : ''}"
                data-action="pick-goal" data-id="${g.id}">
          <div class="goal-card__icon">${g.emoji}</div>
          <div class="goal-card__minutes">${g.minutes}</div>
          <div class="text-xs">min / jour</div>
          <div class="font-bold mt-xs">${g.label}</div>
        </button>
      `).join('')}
    </div>

    ${answers.goalId ? `
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Continuer ${icons.arrowRight(18)}
      </button>` : ''}
  `, { showBack: true, showSkip: true });
}

/* ─── Step 8 : Personalized summary ──────────────────────── */
function renderSummary() {
  const motherTongue = MOTHER_TONGUES.find(m => m.id === answers.motherTongue);
  const target       = TARGETS.find(t => t.id === answers.targetLang);
  const motivation   = MOTIVATIONS.find(m => m.id === answers.motivation);
  const level        = LEVELS.find(l => l.id === answers.level);
  const goal         = GOALS.find(g => g.id === answers.goalId);
  const firstName    = (answers.name || '').split(' ')[0] || 'toi';

  return shell(`
    <div class="onb-mascot animate-scale-in">${mascot.cheering(160)}</div>
    <span class="chip chip-white">Ton parcours est prêt</span>
    <h1 class="onb-title" style="font-size:24px;">Bravo ${escapeHtml(firstName)}&nbsp;!</h1>

    <div class="onb-summary">
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${answers.avatar || '🧑🏾'}</span>
        <div>
          <div class="text-xs onb-summary-label">Toi</div>
          <div class="font-bold">${escapeHtml(answers.name || 'Apprenant·e')}</div>
        </div>
      </div>
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${motherTongue?.flag || '🌍'}</span>
        <div>
          <div class="text-xs onb-summary-label">Tu parles</div>
          <div class="font-bold">${motherTongue?.name || ''}</div>
        </div>
      </div>
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${target?.flag || '🌍'}</span>
        <div>
          <div class="text-xs onb-summary-label">Tu apprendras</div>
          <div class="font-bold">${target?.name || ''} <span class="text-xs">(${target?.native || ''})</span></div>
        </div>
      </div>
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${motivation?.emoji || '✨'}</span>
        <div>
          <div class="text-xs onb-summary-label">Pour</div>
          <div class="font-bold">${motivation?.label || ''}</div>
        </div>
      </div>
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${level?.emoji || '🌱'}</span>
        <div>
          <div class="text-xs onb-summary-label">Niveau</div>
          <div class="font-bold">${level?.label || ''}</div>
        </div>
      </div>
      <div class="onb-summary-row">
        <span class="onb-summary-emoji">${goal?.emoji || '🌟'}</span>
        <div>
          <div class="text-xs onb-summary-label">Objectif</div>
          <div class="font-bold">${goal?.minutes || 10} min / jour</div>
        </div>
      </div>
    </div>

    <div class="onb-actions">
      <button class="btn btn-white btn-full onb-cta" data-action="onb-finish">
        Créer mon compte ${icons.arrowRight(18)}
      </button>
    </div>

    <p class="text-xs text-center" style="opacity:0.85; margin-top:14px;">
      Tu pourras tout modifier dans Paramètres.
    </p>
  `, { showBack: true, showSkip: false });
}

/* ─── Confetti (local, doesn't depend on lesson-player) ──── */
function launchOnbConfetti(count = 80) {
  const COLORS = ['#174E9C','#F2952D','#FFB859','#2D9E73','#8C40AD','#EB4D4D','#1CB0F6','#FF9600'];
  const wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  document.body.appendChild(wrap);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.cssText = [
      `left: ${Math.random() * 100}%`,
      `background: ${COLORS[i % COLORS.length]}`,
      `width: ${6 + Math.random() * 8}px`,
      `height: ${6 + Math.random() * 8}px`,
      `border-radius: ${Math.random() > 0.5 ? '50%' : '2px'}`,
      `animation-delay: ${Math.random() * 0.8}s`,
      `animation-duration: ${1.8 + Math.random() * 1}s`
    ].join(';');
    wrap.appendChild(p);
  }
  setTimeout(() => wrap.remove(), 3200);
}

/* ─── Lifecycle / interactions ──────────────────────────── */

function rerender(dir = 'forward') {
  direction = dir;
  saveDraft();
  document.getElementById('app').innerHTML = `<main class="screen">${renderOnboarding()}</main>`;
  renderOnboarding.mount();
}

function goNext() {
  if (!canContinue()) {
    fx.wrong();
    return;
  }
  if (step < 8) {
    fx.click();
    step++;
    rerender('forward');
  }
}
function goBack() {
  if (step > 0) {
    fx.click();
    step--;
    rerender('back');
  }
}

renderOnboarding.mount = () => {
  // Back / Next / Skip / Finish
  document.querySelectorAll('[data-action="onb-back"]').forEach(btn =>
    btn.addEventListener('click', goBack)
  );
  document.querySelectorAll('[data-action="onb-next"]').forEach(btn =>
    btn.addEventListener('click', goNext)
  );
  document.querySelectorAll('[data-action="onb-skip"]').forEach(btn =>
    btn.addEventListener('click', () => {
      fx.click();
      finishWithDefaults();
    })
  );
  document.querySelectorAll('[data-action="onb-finish"]').forEach(btn =>
    btn.addEventListener('click', () => {
      persistAndContinue();
    })
  );

  // Name input (live update, Enter to advance)
  const nameInput = document.getElementById('onb-name-input');
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      answers.name = nameInput.value;
      // Update hint + button state without full rerender (preserve focus)
      const hint = document.querySelector('.onb-input-hint');
      const cta = document.querySelector('.onb-cta');
      const valid = canContinue();
      if (hint) {
        hint.classList.toggle('is-ok', valid);
        hint.textContent = valid ? '✓ Parfait' : 'Au moins 2 lettres';
      }
      if (cta) {
        cta.classList.toggle('is-disabled', !valid);
        if (valid) cta.removeAttribute('disabled'); else cta.setAttribute('disabled', '');
      }
      saveDraft();
    });
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && canContinue()) {
        e.preventDefault();
        goNext();
      }
    });
  }

  // Avatar picker
  document.querySelectorAll('[data-action="pick-avatar"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.avatar = btn.dataset.avatar;
      fx.coin();
      rerender('none');
    })
  );

  // Mother tongue
  document.querySelectorAll('[data-action="pick-mother-tongue"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.motherTongue = btn.dataset.id;
      fx.click();
      rerender('none');
    })
  );

  // Target lang
  document.querySelectorAll('[data-action="pick-target"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.targetLang = btn.dataset.id;
      fx.click();
      rerender('none');
    })
  );

  // Motivation
  document.querySelectorAll('[data-action="pick-motivation"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.motivation = btn.dataset.id;
      fx.click();
      rerender('none');
    })
  );

  // Level
  document.querySelectorAll('[data-action="pick-level"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.level = btn.dataset.id;
      fx.click();
      rerender('none');
    })
  );

  // Goal
  document.querySelectorAll('[data-action="pick-goal"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.goalId = btn.dataset.id;
      fx.click();
      rerender('none');
    })
  );

  // Trigger summary celebration once per arrival
  if (step === 8 && !renderOnboarding._summaryCelebrated) {
    renderOnboarding._summaryCelebrated = true;
    setTimeout(() => {
      launchOnbConfetti(60);
      fx.success();
    }, 350);
  }
  if (step !== 8) renderOnboarding._summaryCelebrated = false;
};

/* ─── Persistence ───────────────────────────────────────── */

function persistAndContinue() {
  fx.levelUp();
  launchOnbConfetti(120);

  const u = store.get('user') || {};
  const motherTongue = MOTHER_TONGUES.find(m => m.id === answers.motherTongue);
  const motivation   = MOTIVATIONS.find(m => m.id === answers.motivation);
  const goal         = GOALS.find(g => g.id === answers.goalId);

  store.set('user', {
    ...u,
    name: (answers.name || '').trim() || u.name || 'Ami·e',
    avatar: answers.avatar || u.avatar || '🧑🏾',
    motherTongue: answers.motherTongue || u.motherTongue || 'fra',
    motherTongueLabel: motherTongue?.name || null,
    motivation: answers.motivation || null,
    motivationLabel: motivation?.label || null,
    level: answers.level || 'beginner',
    dailyGoalMinutes: goal?.minutes || 10
  });

  // Pre-configure the lessons path with the chosen language
  const lessons = store.get('lessons') || {};
  store.set('lessons', {
    ...lessons,
    targetLang: answers.targetLang || 'swa',
    completed: lessons.completed || [],
    currentDay: lessons.currentDay || 1,
    hearts: lessons.hearts ?? 5
  });

  // Mark onboarding done + clear draft
  store.set('onboardingCompleted', true);
  clearDraft();

  // Welcome notification with their name
  const firstName = ((answers.name || '').split(' ')[0] || 'Ami·e');
  notifications.push({
    type: 'achievement',
    icon: '🦅',
    title: `Bienvenue ${firstName} !`,
    body: 'Badge Pionnier débloqué — tu fais partie des premiers explorateurs KIVU.',
    actionPath: '/learn'
  });

  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast(`Profil créé, bienvenue ${firstName} ! 🔥`, { type: 'success', duration: 3000 });
  }

  // Slight delay so the user sees the confetti before route change
  setTimeout(() => navigate('/login'), 1100);
}

function finishWithDefaults() {
  const u = store.get('user') || {};
  if (!u.dailyGoalMinutes) {
    store.set('user', { ...u, dailyGoalMinutes: 10, level: 'beginner' });
  }
  store.set('onboardingCompleted', true);
  clearDraft();
  navigate('/login');
}
