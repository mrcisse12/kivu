/**
 * KIVU — Onboarding interactif (5 étapes + welcome + summary).
 *
 * Au lieu d'un slideshow passif, on construit le profil de l'apprenant :
 *  0. Welcome (Kivi salue)
 *  1. Motivation : pourquoi tu apprends ?
 *  2. Langue cible : que veux-tu apprendre ?
 *  3. Niveau actuel : où en es-tu ?
 *  4. Objectif quotidien : combien de temps par jour ?
 *  5. Summary personnalisé → /login
 *
 * Tout est sauvegardé dans store.user.{motivation, dailyGoalMinutes,
 * level} et store.lessons.targetLang dès la fin, pour que l'utilisateur
 * trouve le path map déjà configuré quand il arrive sur /learn.
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';

const MOTIVATIONS = [
  { id: 'travel',   emoji: '✈️', label: 'Voyager',                 desc: 'Découvrir de nouveaux pays' },
  { id: 'family',   emoji: '👨‍👩‍👧', label: 'Famille',               desc: 'Connecter avec mes proches' },
  { id: 'career',   emoji: '💼', label: 'Carrière',                desc: 'Développer mon business' },
  { id: 'culture',  emoji: '🛡️', label: 'Culture & héritage',     desc: 'Préserver mes racines' },
  { id: 'fun',      emoji: '🎮', label: 'Pour le plaisir',         desc: 'M\'amuser et apprendre' },
  { id: 'school',   emoji: '🎓', label: 'École / études',          desc: 'Réussir mes examens' }
];

const TARGETS = [
  { id: 'swa', name: 'Swahili',   native: 'Kiswahili', flag: '🇹🇿', speakers: 200, gradient: 'linear-gradient(135deg, #1CB0F6, #0E8B9F)' },
  { id: 'wol', name: 'Wolof',     native: 'Wolof',     flag: '🇸🇳', speakers:  10, gradient: 'linear-gradient(135deg, #2D9E73, #58C794)' },
  { id: 'bam', name: 'Bambara',   native: 'Bamanankan', flag: '🇲🇱', speakers: 15, gradient: 'linear-gradient(135deg, #F2952D, #FFB859)' },
  { id: 'hau', name: 'Haoussa',   native: 'Hausa',     flag: '🇳🇬', speakers:  70, gradient: 'linear-gradient(135deg, #8C40AD, #B86BD9)' },
  { id: 'yor', name: 'Yoruba',    native: 'Yorùbá',    flag: '🇳🇬', speakers:  45, gradient: 'linear-gradient(135deg, #EB4D4D, #FF7575)' },
  { id: 'zul', name: 'Zulu',      native: 'isiZulu',   flag: '🇿🇦', speakers:  12, gradient: 'linear-gradient(135deg, #E11D74, #FF6BAA)' },
  { id: 'ibo', name: 'Igbo',      native: 'Asụsụ Igbo', flag: '🇳🇬', speakers: 24, gradient: 'linear-gradient(135deg, #40B3BF, #58C794)' },
  { id: 'lin', name: 'Lingala',   native: 'Lingála',   flag: '🇨🇩', speakers:  20, gradient: 'linear-gradient(135deg, #FACC80, #F2952D)' }
];

const LEVELS = [
  { id: 'beginner',     emoji: '🌱', label: 'Tout débutant',      desc: 'Je ne connais rien à cette langue' },
  { id: 'basics',       emoji: '🌿', label: 'Quelques bases',     desc: 'Je sais saluer et compter' },
  { id: 'intermediate', emoji: '🌳', label: 'Intermédiaire',      desc: 'Je peux tenir une conversation simple' },
  { id: 'advanced',     emoji: '🏆', label: 'Avancé',             desc: 'Je veux perfectionner ma maîtrise' }
];

const GOALS = [
  { id: 'casual',  minutes:  5, label: 'Détendu',  emoji: '☕', desc: '5 min/jour' },
  { id: 'regular', minutes: 10, label: 'Régulier', emoji: '🌟', desc: '10 min/jour' },
  { id: 'serious', minutes: 20, label: 'Sérieux',  emoji: '🔥', desc: '20 min/jour' },
  { id: 'intense', minutes: 30, label: 'Intense',  emoji: '🚀', desc: '30 min/jour ou +' }
];

let step = 0;          // 0 = welcome, 1..4 = questions, 5 = summary
let answers = {
  motivation: null,
  targetLang: null,
  level: null,
  goalId: null
};

const TOTAL_STEPS = 5; // questions only (welcome + summary not counted in progress)

export function renderOnboarding() {
  if (step === 0) return renderWelcome();
  if (step === 1) return renderMotivation();
  if (step === 2) return renderTargetLang();
  if (step === 3) return renderLevel();
  if (step === 4) return renderGoal();
  if (step === 5) return renderSummary();
  return renderWelcome();
}

function shell(content, { showBack = true, showSkip = false, gradient = 'grad-hero' } = {}) {
  const progressPct = step >= 1 && step <= 4 ? ((step) / 4) * 100 : 0;
  return `
    <div class="onboarding-v2 ${gradient ? 'onb-bg-' + gradient : ''}">
      <div class="orb orb--accent" style="width:280px;height:280px;top:-100px;right:-80px;opacity:0.30"></div>
      <div class="orb orb--primary" style="width:220px;height:220px;bottom:-80px;left:-60px;opacity:0.25;animation-delay:-3s;"></div>

      <header class="onb-header">
        ${showBack && step > 0 ? `
          <button class="onb-back" data-action="onb-back" aria-label="Retour">
            ${icons.arrowLeft(20)}
          </button>
        ` : '<div></div>'}

        ${step >= 1 && step <= 4 ? `
          <div class="onb-progress">
            <div class="onb-progress__fill" style="width:${progressPct}%;"></div>
          </div>
        ` : '<div class="onb-brand">KIVU</div>'}

        ${showSkip ? `
          <button class="onb-skip" data-action="onb-skip">Passer</button>
        ` : '<div></div>'}
      </header>

      <main class="onb-body">
        ${content}
      </main>
    </div>
  `;
}

// ----- Step 0 : Welcome -------------------------------------------------
function renderWelcome() {
  return shell(`
    <div class="onb-mascot animate-float">${mascot.waving(180)}</div>
    <span class="chip chip-white">2 000+ langues africaines</span>
    <h1 class="onb-title">Bienvenue dans KIVU</h1>
    <p class="onb-sub">Je suis Kivi, ton compagnon. Je vais te poser 4 questions pour préparer ton parcours sur mesure.</p>
    <div class="onb-actions">
      <button class="btn btn-white btn-full onb-cta" data-action="onb-next">
        Commencer
        ${icons.arrowRight(18)}
      </button>
      <button class="onb-link" data-action="onb-skip">Plus tard</button>
    </div>
  `, { showBack: false, showSkip: false, gradient: 'grad-hero' });
}

// ----- Step 1 : Motivation ----------------------------------------------
function renderMotivation() {
  return shell(`
    <h2 class="onb-question">Pourquoi apprendre une langue africaine&nbsp;?</h2>
    <p class="onb-question-sub">Choisis ce qui te ressemble le plus. Tu pourras changer plus tard.</p>

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
  `, { showBack: true, showSkip: true, gradient: 'grad-savanna' });
}

// ----- Step 2 : Target language -----------------------------------------
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
  `, { showBack: true, showSkip: true, gradient: 'grad-sunset' });
}

// ----- Step 3 : Level ---------------------------------------------------
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
  `, { showBack: true, showSkip: true, gradient: 'grad-royal' });
}

// ----- Step 4 : Daily goal ----------------------------------------------
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
  `, { showBack: true, showSkip: true, gradient: 'grad-savanna' });
}

// ----- Step 5 : Personalized summary ------------------------------------
function renderSummary() {
  const motivation = MOTIVATIONS.find(m => m.id === answers.motivation);
  const target     = TARGETS.find(t => t.id === answers.targetLang);
  const level      = LEVELS.find(l => l.id === answers.level);
  const goal       = GOALS.find(g => g.id === answers.goalId);

  return shell(`
    <div class="onb-mascot animate-scale-in">${mascot.cheering(160)}</div>
    <span class="chip chip-white">Ton parcours est prêt</span>
    <h1 class="onb-title" style="font-size:24px;">Parfait, on est paré&nbsp;!</h1>

    <div class="onb-summary">
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
  `, { showBack: true, showSkip: false, gradient: 'grad-hero' });
}

// ----- Lifecycle --------------------------------------------------------
function rerender() {
  document.getElementById('app').innerHTML = `<main class="screen">${renderOnboarding()}</main>`;
  renderOnboarding.mount();
}

renderOnboarding.mount = () => {
  document.querySelectorAll('[data-action="onb-back"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (step > 0) { step--; rerender(); }
    })
  );

  document.querySelectorAll('[data-action="onb-next"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (step < 5) { step++; rerender(); }
    })
  );

  document.querySelectorAll('[data-action="onb-skip"]').forEach(btn =>
    btn.addEventListener('click', () => {
      finishWithDefaults();
    })
  );

  document.querySelectorAll('[data-action="onb-finish"]').forEach(btn =>
    btn.addEventListener('click', () => {
      persistAndContinue();
    })
  );

  document.querySelectorAll('[data-action="pick-motivation"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.motivation = btn.dataset.id;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="pick-target"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.targetLang = btn.dataset.id;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="pick-level"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.level = btn.dataset.id;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="pick-goal"]').forEach(btn =>
    btn.addEventListener('click', () => {
      answers.goalId = btn.dataset.id;
      rerender();
    })
  );
};

function persistAndContinue() {
  // Save the personalized profile
  const u = store.get('user') || {};
  const motivation = MOTIVATIONS.find(m => m.id === answers.motivation);
  const goal = GOALS.find(g => g.id === answers.goalId);
  store.set('user', {
    ...u,
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

  // Mark onboarding done
  store.set('onboardingCompleted', true);
  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast('Profil créé ! 🔥', { type: 'success' });
  }
  navigate('/login');
}

function finishWithDefaults() {
  const u = store.get('user') || {};
  if (!u.dailyGoalMinutes) {
    store.set('user', { ...u, dailyGoalMinutes: 10, level: 'beginner' });
  }
  store.set('onboardingCompleted', true);
  navigate('/login');
}
