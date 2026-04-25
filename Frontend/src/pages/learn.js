import Chart from 'chart.js/auto';
import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { buildQuiz, LANG_LABELS } from '../data/flashcards.js';
import { speech } from '../services/speech.js';
import { mascot, mascotBubble } from '../components/mascot.js';
import { UNITS, buildCurriculum } from '../data/lessons.js';
import { openLesson } from './lesson-player.js';

const QUESTS = [
  { title: 'Marché de Dakar',      sub: 'Négocie avec un vendeur de fruits',   emoji: '🥭', xp: 150, progress: 0.33, color: 'var(--kivu-accent)' },
  { title: 'Premier rendez-vous',  sub: 'Fais connaissance avec un ami',        emoji: '☕', xp: 100, progress: 0.60, color: 'var(--kivu-secondary)' },
  { title: 'Taxi à Abidjan',       sub: 'Indique ta destination',               emoji: '🚕', xp: 120, progress: 0,    color: 'var(--kivu-primary)' },
  { title: 'À l’hôpital',          sub: 'Décris tes symptômes',                 emoji: '🏥', xp: 200, progress: 0,    color: 'var(--error)' }
];

// Catégories d'apprentissage : emojis OK (gamification)
const SKILLS = [
  { name: 'Salutations', level: 12, max: 15, color: '#174E9C', emoji: '👋' },
  { name: 'Nombres',     level: 8,  max: 15, color: '#2D9E73', emoji: '🔢' },
  { name: 'Nourriture',  level: 6,  max: 15, color: '#F2952D', emoji: '🍽️' },
  { name: 'Famille',     level: 10, max: 15, color: '#8C40AD', emoji: '👨‍👩‍👧' },
  { name: 'Voyage',      level: 4,  max: 15, color: '#408CE6', emoji: '✈️' },
  { name: 'Travail',     level: 3,  max: 15, color: '#40B3BF', emoji: '💼' }
];

const BADGES = [
  { title: 'Première conversation', emoji: '💬', unlocked: true },
  { title: '100 mots appris',       emoji: '📚', unlocked: true },
  { title: 'Série 7 jours',         emoji: '🔥', unlocked: true },
  { title: 'Polyglotte',            emoji: '🌍', unlocked: false },
  { title: 'Maître conteur',        emoji: '👑', unlocked: false },
  { title: 'Gardien culturel',      emoji: '🛡️', unlocked: false }
];

const LEADERBOARD = [
  { rank: 1,  name: 'Fatou D.',  flag: '🇸🇳', xp: 14580, avatar: '👩🏾' },
  { rank: 2,  name: 'Kofi A.',   flag: '🇬🇭', xp: 13204, avatar: '👨🏿' },
  { rank: 3,  name: 'Amina B.',  flag: '🇲🇱', xp: 12890, avatar: '👩🏾‍🦱' },
  { rank: 4,  name: 'Sékou T.',  flag: '🇬🇳', xp: 11500, avatar: '👨🏾' },
  { rank: 42, name: 'Vous',      flag: '🇨🇮', xp: 2340,  avatar: '🧑🏾', isMe: true }
];

const TABS = [
  { id: 'path',        label: 'Parcours' },
  { id: 'quiz',        label: 'Quiz' },
  { id: 'quests',      label: 'Quêtes' },
  { id: 'skills',      label: 'Compétences' },
  { id: 'badges',      label: 'Badges' },
  { id: 'leaderboard', label: 'Classement' },
  { id: 'progress',    label: 'Progression' }
];

let activeTab = 'path';

// Quiz state
let quizLang = 'swa';
let quizQuestions = null;
let quizIndex = 0;
let quizScore = 0;
let quizAnswered = null;     // selected option for current question
let quizFinished = false;

export function renderLearn() {
  const user = store.get('user');
  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Apprendre</div>
        <div class="screen-subtitle">Joue, gagne, parle couramment</div>
      </div>
    </div>

    <!-- XP Ring Hero -->
    <div class="hero-card grad-savanna mb-md learn-hero" style="position:relative; overflow:hidden;">
      <span class="orb orb--green" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.4"></span>
      <div class="learn-hero__inner">
        <div class="learn-hero__ring">
          <canvas id="xp-ring" width="110" height="110" aria-label="Progression vers le niveau suivant"></canvas>
        </div>
        <div class="learn-hero__text">
          <div class="font-bold text-lg">Maître conversationnel</div>
          <div class="text-sm" style="opacity:0.92">${user.stats.xp.toLocaleString('fr-FR')} / ${user.stats.nextLevelXP.toLocaleString('fr-FR')} XP</div>
          <div class="flex gap-xs mt-md flex-wrap">
            <span class="chip chip-white">🔥 ${user.stats.streak} j</span>
            <span class="chip chip-white">📖 ${user.stats.wordsLearned} mots</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        ${TABS.map(t => `
          <button class="pill-tab ${activeTab === t.id ? 'active' : ''}"
                  data-action="tab-${t.id}">${t.label}</button>
        `).join('')}
      </div>
    </div>

    ${activeTab === 'path'        ? renderPathTab()        : ''}
    ${activeTab === 'quests'      ? renderQuestsTab()      : ''}
    ${activeTab === 'quiz'        ? renderQuizTab()        : ''}
    ${activeTab === 'skills'      ? renderSkillsTab()      : ''}
    ${activeTab === 'badges'      ? renderBadgesTab()      : ''}
    ${activeTab === 'leaderboard' ? renderLeaderboardTab() : ''}
    ${activeTab === 'progress'    ? renderProgressTab()    : ''}
  `;
}

function renderPathTab() {
  const lessonsState = store.get('lessons') || { currentDay: 1, completed: [], targetLang: 'swa', hearts: 5 };
  const targetLang = lessonsState.targetLang || 'swa';
  const langInfo = LANG_LABELS[targetLang];
  const completed = new Map((lessonsState.completed || []).map(c => [c.id, c]));
  const currentDay = lessonsState.currentDay || 1;

  return `
    <!-- Header path -->
    <div class="path-hero card mb-md" style="position:relative; overflow:hidden;">
      <span class="orb orb--green" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.35"></span>
      <div style="position:relative; z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <div>
            <div class="text-xs text-muted">Vous apprenez</div>
            <div class="font-display font-bold text-xl">
              <span class="lang-flag-sm">${langInfo.flag}</span> ${langInfo.name}
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" data-action="path-change-lang">Changer</button>
        </div>
        <div class="flex gap-md path-stats">
          <div><span class="font-bold">${(lessonsState.completed || []).length}</span><span class="text-xs text-muted"> / 30</span><div class="text-xs text-muted">Leçons</div></div>
          <div><span class="font-bold">❤ ${lessonsState.hearts ?? 5}</span><div class="text-xs text-muted">Vies</div></div>
          <div><span class="font-bold">🔥 ${(store.get('user').stats.streak)}</span><div class="text-xs text-muted">Série</div></div>
        </div>
      </div>
    </div>

    <!-- Language picker (collapsed) -->
    <div id="path-lang-picker" class="card mb-md" hidden>
      <div class="font-bold mb-sm">Choisir une langue cible</div>
      <div class="grid grid-2 quiz-lang-grid">
        ${Object.entries(LANG_LABELS).filter(([id]) => id !== 'en').map(([id, info]) => `
          <button class="quiz-lang-btn ${targetLang === id ? 'active' : ''}"
                  data-action="path-set-lang" data-lang="${id}">
            <span class="lang-flag-sm">${info.flag}</span>
            <span class="font-semibold">${info.name}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Snake path -->
    <div class="lesson-path">
      ${UNITS.map(unit => renderUnit(unit, completed, currentDay)).join('')}
    </div>
  `;
}

function renderUnit(unit, completed, currentDay) {
  // Unit covers 5 days: (unit.id-1)*5 + 1 .. unit.id*5
  const start = (unit.id - 1) * 5 + 1;
  const end = unit.id * 5;
  const days = [];
  for (let d = start; d <= end; d++) days.push(d);

  return `
    <div class="lesson-unit">
      <div class="lesson-unit__banner" style="background:linear-gradient(135deg, ${unit.color}, ${unit.color}aa);">
        <div class="flex items-center gap-sm">
          <span style="font-size:32px;">${unit.theme}</span>
          <div>
            <div class="text-xs" style="opacity:0.85;">Unité ${unit.id}</div>
            <div class="font-display font-bold text-lg">${unit.title}</div>
            <div class="text-xs" style="opacity:0.85;">${unit.desc}</div>
          </div>
        </div>
      </div>
      <div class="lesson-unit__nodes">
        ${days.map((d, i) => renderNode(d, i, unit, completed, currentDay)).join('')}
      </div>
    </div>
  `;
}

function renderNode(day, indexInUnit, unit, completed, currentDay) {
  const isDone = completed.has(day);
  const isCurrent = day === currentDay && !isDone;
  const isLocked = day > currentDay;
  const isPerfect = isDone && completed.get(day).perfect;

  // Snake layout: alternate offset
  const offset = indexInUnit % 2 === 0 ? 0 : 60;
  const offsetReverse = indexInUnit % 4 === 2 ? -60 : indexInUnit % 4 === 3 ? -30 : indexInUnit % 4 === 1 ? 30 : 0;

  let cls = 'lesson-node';
  if (isDone)    cls += ' lesson-node--done';
  if (isCurrent) cls += ' lesson-node--current';
  if (isLocked)  cls += ' lesson-node--locked';
  if (isPerfect) cls += ' lesson-node--perfect';

  let content;
  if (isLocked) content = icons.lock(22, 'currentColor');
  else if (isPerfect) content = `<span style="font-size:22px;">⭐</span>`;
  else if (isDone) content = icons.check(22, 'currentColor');
  else content = `<span class="font-bold">${day}</span>`;

  const label = isCurrent ? 'COMMENCER' : isLocked ? '' : isDone ? 'Terminé' : `Jour ${day}`;

  return `
    <div class="lesson-node-wrap" style="margin-left:${offsetReverse}px;">
      ${isCurrent ? `<div class="lesson-node-cta">${label}</div>` : ''}
      <button class="${cls}"
              data-action="${isLocked ? 'lesson-locked' : 'lesson-start'}"
              data-day="${day}"
              style="--node-color: ${unit.color};"
              ${isLocked ? 'disabled' : ''}>
        ${content}
      </button>
      <div class="lesson-node-day">J${day}</div>
    </div>
  `;
}

function renderQuizTab() {
  const langInfo = LANG_LABELS[quizLang];

  if (!quizQuestions) {
    // Setup screen
    return `
      <div class="card mb-md quiz-card">
        <div class="text-center mb-md">
          <div class="quiz-mascot animate-float" aria-hidden="true">${mascot.waving(110)}</div>
          <h2 class="font-display font-bold text-xl mt-sm">Quiz flashcards</h2>
          <div class="text-sm text-muted">5 phrases, +${langInfo.xpPerCorrect} XP par bonne réponse</div>
        </div>
        <div class="font-semibold mb-xs">Choisissez une langue</div>
        <div class="grid grid-2 mb-md quiz-lang-grid">
          ${Object.entries(LANG_LABELS).map(([id, info]) => `
            <button class="quiz-lang-btn ${quizLang === id ? 'active' : ''}"
                    data-action="quiz-lang" data-lang="${id}">
              <span class="lang-flag-sm">${info.flag}</span>
              <span class="font-semibold">${info.name}</span>
            </button>
          `).join('')}
        </div>
        <button class="btn btn-primary btn-full" data-action="quiz-start"
                style="background:var(--kivu-accent);">
          Démarrer le quiz
        </button>
      </div>
    `;
  }

  if (quizFinished) {
    const total = quizQuestions.length;
    const pct = Math.round((quizScore / total) * 100);
    const xpGained = quizScore * langInfo.xpPerCorrect;
    const emotion = pct >= 80 ? 'cheering' : pct >= 50 ? 'happy' : 'sad';
    const reward = pct === 100 ? '🏆' : pct >= 80 ? '🌟' : pct >= 50 ? '🎉' : '💪';
    const message = pct === 100 ? 'Parfait ! Tu as tout juste !'
                  : pct >= 80  ? 'Excellent ! Tu maîtrises bien.'
                  : pct >= 50  ? 'Bien joué, continue à pratiquer.'
                               : 'Pas grave, on retente ensemble.';
    return `
      <div class="card mb-md quiz-card text-center">
        <div class="quiz-mascot animate-scale-in" aria-hidden="true">${mascot[emotion](120)}</div>
        <h2 class="font-display font-bold text-xl mt-sm">Quiz terminé ! ${reward}</h2>
        <div class="text-sm text-muted">${message}</div>
        <div class="text-lg mt-md"><span class="font-bold text-gradient" style="font-size:36px;">${quizScore}/${total}</span></div>
        <div class="text-sm text-muted">Score : ${pct}%</div>
        <div class="chip chip-accent mt-md">+${xpGained} XP gagnés</div>
        <div class="flex gap-xs mt-md">
          <button class="btn btn-ghost btn-full" data-action="quiz-reset">Choisir une langue</button>
          <button class="btn btn-primary btn-full" data-action="quiz-restart"
                  style="background:var(--kivu-accent);">Recommencer</button>
        </div>
      </div>
    `;
  }

  const q = quizQuestions[quizIndex];
  const progress = ((quizIndex) / quizQuestions.length) * 100;

  return `
    <div class="card mb-md quiz-card">
      <div class="flex justify-between items-center mb-sm">
        <span class="text-xs text-muted">Question ${quizIndex + 1} / ${quizQuestions.length}</span>
        <span class="chip chip-accent">${langInfo.flag} ${langInfo.name}</span>
      </div>
      <div class="progress-bar progress-bar--thin mb-md">
        <div class="progress-fill" style="width:${progress}%; background:var(--kivu-accent);"></div>
      </div>

      <div class="quiz-question">
        <div class="text-sm text-muted mb-xs">Comment dit-on en ${langInfo.name} :</div>
        <div class="font-display font-bold text-2xl">« ${q.question} »</div>
      </div>

      <div class="quiz-options mt-md">
        ${q.options.map((opt, i) => {
          let cls = 'quiz-option';
          if (quizAnswered != null) {
            if (opt === q.target) cls += ' is-correct';
            else if (opt === quizAnswered) cls += ' is-wrong';
            else cls += ' is-disabled';
          }
          return `
            <button class="${cls}"
                    data-action="quiz-answer"
                    data-option="${escapeAttr(opt)}"
                    ${quizAnswered != null ? 'disabled' : ''}>
              <span class="quiz-option__letter">${String.fromCharCode(65 + i)}</span>
              <span class="quiz-option__text">${escapeAttr(opt)}</span>
              ${quizAnswered != null && opt === q.target ? `<span class="quiz-option__icon">${icons.check(18, 'white')}</span>` : ''}
              ${quizAnswered != null && opt === quizAnswered && opt !== q.target ? `<span class="quiz-option__icon">${icons.close(18, 'white')}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>

      ${quizAnswered != null ? `
        <div class="quiz-feedback mt-md ${quizAnswered === q.target ? 'is-correct' : 'is-wrong'}">
          <span class="quiz-feedback__mascot" aria-hidden="true">
            ${quizAnswered === q.target ? mascot.cheering(56) : mascot.sad(56)}
          </span>
          <div class="quiz-feedback__text">
            ${quizAnswered === q.target
              ? `<div class="font-bold">Bravo ! 🔥</div><div class="text-sm">+${langInfo.xpPerCorrect} XP gagnés</div>`
              : `<div class="font-bold">Presque !</div><div class="text-sm">La bonne réponse est <em>« ${escapeAttr(q.target)} »</em></div>`}
          </div>
        </div>
        <div class="flex gap-xs mt-sm">
          <button class="btn btn-ghost btn-full" data-action="quiz-listen">
            <span style="display:inline-flex;gap:8px;align-items:center;justify-content:center;">
              ${icons.speaker(16)} Écouter
            </span>
          </button>
          <button class="btn btn-primary btn-full" data-action="quiz-next"
                  style="background:var(--kivu-accent);">
            ${quizIndex === quizQuestions.length - 1 ? 'Voir le score' : 'Suivant'}
          </button>
        </div>
      ` : ''}
    </div>
  `;
}

function escapeAttr(s) {
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function renderQuestsTab() {
  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Quêtes du jour</h2>
      <span class="chip chip-accent">⚡ ${QUESTS.length} actives</span>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${QUESTS.map(q => `
        <button class="card quest-card">
          <span class="quest-emoji" style="background:${q.color}1f;">${q.emoji}</span>
          <div class="quest-body">
            <div class="font-bold">${q.title}</div>
            <div class="text-xs text-muted">${q.sub}</div>
            <div class="flex items-center gap-xs mt-xs">
              <div class="progress-bar progress-bar--thin">
                <div class="progress-fill" style="width:${q.progress * 100}%; background:${q.color};"></div>
              </div>
              <span class="text-xs font-semibold" style="color:${q.color}; white-space:nowrap;">+${q.xp} XP</span>
            </div>
          </div>
          <span class="quest-arrow" style="color:${q.color};">${icons.chevronRight(20)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderSkillsTab() {
  return `
    <h2 class="font-display font-bold text-lg mb-sm">Vos compétences</h2>
    <div class="grid grid-2 mb-lg">
      ${SKILLS.map(s => `
        <div class="card skill-card">
          <div class="flex justify-between items-center mb-sm">
            <span class="skill-emoji" style="background:${s.color}1f; color:${s.color};">${s.emoji}</span>
            <span class="text-xs text-muted">${s.level}/${s.max}</span>
          </div>
          <div class="font-bold mb-xs">${s.name}</div>
          <div class="progress-bar progress-bar--thin">
            <div class="progress-fill" style="width:${(s.level / s.max) * 100}%; background:${s.color};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBadgesTab() {
  const unlocked = BADGES.filter(b => b.unlocked).length;
  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Vos badges</h2>
      <span class="chip chip-primary">${unlocked} / ${BADGES.length}</span>
    </div>
    <div class="grid grid-3 mb-lg">
      ${BADGES.map(b => `
        <div class="card badge-card ${b.unlocked ? 'badge-card--unlocked' : 'badge-card--locked'}">
          <div class="badge-medal">${b.emoji}</div>
          <div class="text-xs font-semibold">${b.title}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLeaderboardTab() {
  return `
    <h2 class="font-display font-bold text-lg mb-sm">Classement de la semaine</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${LEADERBOARD.map(r => `
        <div class="list-row leaderboard-row ${r.isMe ? 'leaderboard-row--me' : ''}">
          <span class="leaderboard-rank ${r.rank <= 3 ? 'leaderboard-rank--top' : ''}">#${r.rank}</span>
          <div class="avatar">${r.avatar}</div>
          <div style="flex:1">
            <div class="font-semibold">${r.name} <span class="lang-flag-sm">${r.flag}</span></div>
            <div class="text-xs text-muted">${r.xp.toLocaleString('fr-FR')} XP</div>
          </div>
          ${r.rank === 1 ? '<span class="leaderboard-medal">🥇</span>' : ''}
          ${r.rank === 2 ? '<span class="leaderboard-medal">🥈</span>' : ''}
          ${r.rank === 3 ? '<span class="leaderboard-medal">🥉</span>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

function renderProgressTab() {
  return `
    <div class="card mb-md">
      <div class="font-bold mb-sm">XP acquis (7 derniers jours)</div>
      <canvas id="progress-chart" height="200"></canvas>
    </div>
    <div class="card mb-lg">
      <div class="font-bold mb-sm">Temps d'apprentissage / jour (min)</div>
      <canvas id="time-chart" height="180"></canvas>
    </div>
  `;
}

renderLearn.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderLearn();
    renderLearn.mount();
  };

  // Tabs (event delegation propre)
  TABS.forEach(t => {
    document.querySelectorAll(`[data-action="tab-${t.id}"]`).forEach(el =>
      el.addEventListener('click', () => {
        if (activeTab === t.id) return;
        activeTab = t.id;
        rerender();
      })
    );
  });

  // ==== Path interactions ====
  document.querySelectorAll('[data-action="lesson-start"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const day = parseInt(btn.dataset.day, 10);
      const lessonsState = store.get('lessons') || {};
      if ((lessonsState.hearts ?? 5) === 0) {
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Plus de vies ! Revenez dans quelques heures ou abonnez-vous Pro.', { type: 'warning', duration: 3000 });
        }
        return;
      }
      openLesson(day);
    })
  );

  document.querySelectorAll('[data-action="lesson-locked"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Terminez les leçons précédentes pour débloquer celle-ci.', { type: 'info', duration: 2000 });
      }
    })
  );

  document.querySelectorAll('[data-action="path-change-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const picker = document.getElementById('path-lang-picker');
      if (picker) picker.hidden = !picker.hidden;
    })
  );

  document.querySelectorAll('[data-action="path-set-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      const lessonsState = store.get('lessons') || {};
      // Reset progression when switching language so the user starts fresh
      store.set('lessons', { ...lessonsState, targetLang: lang, completed: [], currentDay: 1 });
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`Vous apprenez maintenant ${LANG_LABELS[lang].name}`, { type: 'success' });
      }
      rerender();
    })
  );

  // ==== Quiz interactions ====
  document.querySelectorAll('[data-action="quiz-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      quizLang = btn.dataset.lang;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="quiz-start"]').forEach(btn =>
    btn.addEventListener('click', () => {
      quizQuestions = buildQuiz(quizLang, 5);
      quizIndex = 0;
      quizScore = 0;
      quizAnswered = null;
      quizFinished = false;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="quiz-answer"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (quizAnswered != null) return;
      const opt = btn.dataset.option;
      quizAnswered = opt;
      const q = quizQuestions[quizIndex];
      if (opt === q.target) {
        quizScore++;
        if (window.__KIVU__?.toast)
          window.__KIVU__.toast(`Bravo ! 🔥 +${LANG_LABELS[quizLang].xpPerCorrect} XP`, { type: 'success', duration: 1300 });
      }
      // Auto-pronounce the correct answer for learning
      if (speech.ttsSupported) {
        setTimeout(() => speech.speak(q.target, quizLang), 400);
      }
      rerender();
    })
  );

  document.querySelectorAll('[data-action="quiz-listen"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const q = quizQuestions[quizIndex];
      if (q && speech.ttsSupported) speech.speak(q.target, quizLang);
    })
  );

  document.querySelectorAll('[data-action="quiz-next"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (quizIndex >= quizQuestions.length - 1) {
        quizFinished = true;
        // Persist XP earned to user stats
        const xp = quizScore * LANG_LABELS[quizLang].xpPerCorrect;
        store.update('user', u => ({
          ...u,
          stats: { ...u.stats, xp: u.stats.xp + xp, wordsLearned: u.stats.wordsLearned + quizScore }
        }));
      } else {
        quizIndex++;
        quizAnswered = null;
      }
      rerender();
    })
  );

  document.querySelectorAll('[data-action="quiz-reset"]').forEach(btn =>
    btn.addEventListener('click', () => {
      quizQuestions = null;
      quizFinished = false;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="quiz-restart"]').forEach(btn =>
    btn.addEventListener('click', () => {
      quizQuestions = buildQuiz(quizLang, 5);
      quizIndex = 0;
      quizScore = 0;
      quizAnswered = null;
      quizFinished = false;
      rerender();
    })
  );

  // XP Ring (canvas raw)
  const ring = document.getElementById('xp-ring');
  if (ring) {
    const user = store.get('user');
    const progress = Math.min(1, user.stats.xp / user.stats.nextLevelXP);
    const ctx = ring.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ring.width = 110 * dpr; ring.height = 110 * dpr;
    ring.style.width = '110px'; ring.style.height = '110px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 110, 110);
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath(); ctx.arc(55, 55, 46, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(55, 55, 46, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px Nunito, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(user.stats.level, 55, 50);
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Niveau', 55, 73);
  }

  // Charts
  if (activeTab === 'progress') {
    const palette = {
      grid: 'rgba(20,32,58,0.06)',
      axis: '#9AA0B0'
    };
    const baseOpts = {
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#14203A', cornerRadius: 8, padding: 10 } },
      scales: {
        y: { beginAtZero: true, grid: { color: palette.grid }, ticks: { color: palette.axis } },
        x: { grid: { display: false }, ticks: { color: palette.axis } }
      }
    };

    const p = document.getElementById('progress-chart');
    if (p) new Chart(p, {
      type: 'line',
      data: {
        labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
        datasets: [{
          label: 'XP',
          data: [120, 180, 95, 210, 150, 280, 320],
          borderColor: '#174E9C',
          backgroundColor: 'rgba(23,78,156,0.14)',
          fill: true, tension: 0.4, borderWidth: 3, pointRadius: 5,
          pointBackgroundColor: '#174E9C', pointBorderColor: 'white', pointBorderWidth: 2
        }]
      },
      options: baseOpts
    });

    const t = document.getElementById('time-chart');
    if (t) new Chart(t, {
      type: 'bar',
      data: {
        labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
        datasets: [{
          label: 'minutes',
          data: [12, 25, 8, 32, 22, 45, 38],
          backgroundColor: ['#F2952D','#FFB859','#F2952D','#FFB859','#F2952D','#FFB859','#F2952D'],
          borderRadius: 10,
          borderSkipped: false
        }]
      },
      options: baseOpts
    });
  }
};
