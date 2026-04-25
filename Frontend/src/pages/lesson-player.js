/**
 * KIVU — Lesson Player (style Duolingo)
 * Plein écran, traverse les exercices d'une leçon avec barre de progression,
 * cœurs, mascotte Kivi qui réagit, audio TTS.
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { buildCurriculum, LANG_LABELS } from '../data/lessons.js';
import { speech } from '../services/speech.js';
import { mascot } from '../components/mascot.js';
import { icons } from '../components/icons.js';

let currentLesson = null;
let exerciseIndex = 0;
let answer = null;            // selected answer for current exercise
let typed = '';
let matched = {};             // { fr → target } for match exercises
let mistakes = 0;
let lessonStartHearts = 5;
let isFinished = false;

export function openLesson(day) {
  const targetLang = (store.get('lessons')?.targetLang) || 'swa';
  const curriculum = buildCurriculum(targetLang);
  currentLesson = curriculum.find(l => l.day === day) || curriculum[0];
  exerciseIndex = 0;
  answer = null;
  typed = '';
  matched = {};
  mistakes = 0;
  lessonStartHearts = (store.get('lessons')?.hearts) ?? 5;
  isFinished = false;
  navigate(`/lesson/${day}`);
}

export function renderLessonPlayer() {
  const day = parseInt(window.location.hash.split('/')[2] || '1', 10);
  if (!currentLesson || currentLesson.day !== day) {
    const targetLang = (store.get('lessons')?.targetLang) || 'swa';
    const curriculum = buildCurriculum(targetLang);
    currentLesson = curriculum.find(l => l.day === day) || curriculum[0];
    exerciseIndex = 0;
    answer = null;
    typed = '';
    matched = {};
    mistakes = 0;
    lessonStartHearts = (store.get('lessons')?.hearts) ?? 5;
    isFinished = false;
  }

  if (isFinished) return renderCompletion();

  const total = currentLesson.exercises.length;
  const ex = currentLesson.exercises[exerciseIndex];
  const progress = ((exerciseIndex) / total) * 100;
  const hearts = (store.get('lessons')?.hearts) ?? 5;
  const targetLang = (store.get('lessons')?.targetLang) || 'swa';
  const langLabel = LANG_LABELS[targetLang] || { name: 'Swahili', flag: '🇹🇿' };

  return `
    <div class="lesson-player">
      <!-- Top bar -->
      <header class="lesson-top">
        <button class="lesson-close" data-action="lesson-quit" aria-label="Quitter">
          ${icons.close(22)}
        </button>
        <div class="lesson-progress">
          <div class="lesson-progress__fill" style="width:${progress}%;"></div>
        </div>
        <div class="lesson-hearts" aria-label="${hearts} vies restantes">
          <span style="color:var(--error); font-size:18px;">❤</span>
          <span class="font-bold">${hearts}</span>
        </div>
      </header>

      <!-- Body -->
      <main class="lesson-body">
        <div class="text-xs text-muted" style="text-align:center;">
          ${currentLesson.unitTheme} ${currentLesson.unitTitle} — ${langLabel.flag} ${langLabel.name}
        </div>
        <h2 class="lesson-prompt">${formatPrompt(ex.prompt, langLabel.name)}</h2>

        ${ex.type === 'multiple-choice' ? renderMC(ex)     : ''}
        ${ex.type === 'listen'           ? renderListen(ex) : ''}
        ${ex.type === 'type'             ? renderType(ex)   : ''}
        ${ex.type === 'match'            ? renderMatch(ex)  : ''}
      </main>

      <!-- Bottom action bar -->
      <footer class="lesson-foot ${answer != null && ex.type !== 'match' ? (isAnswerCorrect(ex) ? 'lesson-foot--correct' : 'lesson-foot--wrong') : ''}">
        ${renderFootContent(ex)}
      </footer>
    </div>
  `;
}

function formatPrompt(prompt, langName) {
  return prompt.replace('%LANG%', langName);
}

// ----- Exercise renderers -----------------------------------------------
function renderMC(ex) {
  return `
    <div class="lesson-question-card">
      <div class="lesson-question-text">« ${escapeHtml(ex.question)} »</div>
    </div>
    <div class="lesson-options">
      ${ex.options.map((opt, i) => {
        let cls = 'lesson-option';
        if (answer != null) {
          if (opt === ex.correct) cls += ' is-correct';
          else if (opt === answer) cls += ' is-wrong';
          else cls += ' is-disabled';
        }
        return `
          <button class="${cls}"
                  data-action="lesson-pick" data-value="${escapeAttr(opt)}"
                  ${answer != null ? 'disabled' : ''}>
            <span class="lesson-option__letter">${String.fromCharCode(65 + i)}</span>
            <span class="lesson-option__text">${escapeHtml(opt)}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderListen(ex) {
  return `
    <div class="lesson-listen-card">
      <button class="lesson-listen-btn" data-action="lesson-replay">
        <span class="lesson-listen-icon">${icons.speaker(36, 'white')}</span>
        <span class="text-sm">Écouter</span>
      </button>
    </div>
    <div class="lesson-options">
      ${ex.options.map((opt, i) => {
        let cls = 'lesson-option lesson-option--small';
        if (answer != null) {
          if (opt === ex.correct) cls += ' is-correct';
          else if (opt === answer) cls += ' is-wrong';
          else cls += ' is-disabled';
        }
        return `
          <button class="${cls}"
                  data-action="lesson-pick" data-value="${escapeAttr(opt)}"
                  ${answer != null ? 'disabled' : ''}>
            <span class="lesson-option__text">${escapeHtml(opt)}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderType(ex) {
  const isAnswered = answer != null;
  const correct = isAnswered && isAnswerCorrect(ex);
  return `
    <div class="lesson-question-card">
      <div class="lesson-question-text">« ${escapeHtml(ex.question)} »</div>
    </div>
    <div class="lesson-type-wrapper">
      <input type="text"
             id="lesson-type-input"
             class="lesson-type-input ${isAnswered ? (correct ? 'is-correct' : 'is-wrong') : ''}"
             value="${escapeAttr(typed)}"
             placeholder="Tapez votre traduction…"
             ${isAnswered ? 'disabled' : ''}
             autocomplete="off"
             autocapitalize="off"
             autofocus/>
      ${isAnswered && !correct ? `
        <div class="lesson-type-correct">
          La bonne réponse : <strong>${escapeHtml(ex.correct)}</strong>
        </div>
      ` : ''}
    </div>
  `;
}

function renderMatch(ex) {
  // Build two columns
  const lefts = ex.pairs.map(p => p.fr);
  const rights = [...ex.pairs.map(p => p.target)];
  // shuffle right column once per render of this exercise
  if (!ex._shuffledRights) {
    ex._shuffledRights = [...rights].sort(() => Math.random() - 0.5);
  }
  const checkAll = lefts.every(fr => matched[fr]);
  return `
    <div class="lesson-match-grid">
      <div class="lesson-match-col">
        ${lefts.map(fr => {
          const isMatched = !!matched[fr];
          const isSelected = answer === 'L:' + fr;
          return `
            <button class="lesson-match-tile ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''}"
                    data-action="lesson-match-left" data-value="${escapeAttr(fr)}"
                    ${isMatched ? 'disabled' : ''}>
              ${escapeHtml(fr)}
            </button>
          `;
        }).join('')}
      </div>
      <div class="lesson-match-col">
        ${ex._shuffledRights.map(t => {
          const matchedFr = Object.entries(matched).find(([_, v]) => v === t)?.[0];
          const isMatched = !!matchedFr;
          const isSelected = answer === 'R:' + t;
          return `
            <button class="lesson-match-tile ${isMatched ? 'is-matched' : ''} ${isSelected ? 'is-selected' : ''}"
                    data-action="lesson-match-right" data-value="${escapeAttr(t)}"
                    ${isMatched ? 'disabled' : ''}>
              ${escapeHtml(t)}
            </button>
          `;
        }).join('')}
      </div>
    </div>
    ${checkAll ? `
      <div class="lesson-match-done">
        ${mascotMini('cheering')}
        <div class="font-bold mt-xs">Toutes associées !</div>
      </div>
    ` : ''}
  `;
}

function mascotMini(emotion) {
  return `<div style="width:64px;height:75px;display:inline-flex;align-items:center;">${mascot[emotion](64)}</div>`;
}

// ----- Bottom bar -------------------------------------------------------
function renderFootContent(ex) {
  if (ex.type === 'match') {
    const allDone = ex.pairs.every(p => matched[p.fr] === p.target);
    return `
      <button class="btn btn-primary btn-full" data-action="lesson-next"
              ${allDone ? '' : 'disabled'}
              style="background:var(--kivu-accent);">
        ${exerciseIndex === currentLesson.exercises.length - 1 ? 'Terminer la leçon' : 'Continuer'}
      </button>
    `;
  }

  if (answer == null) {
    if (ex.type === 'type') {
      return `
        <button class="btn btn-primary btn-full" data-action="lesson-check-type"
                style="background:var(--kivu-accent);">
          Vérifier
        </button>
      `;
    }
    return `<div class="text-xs text-muted">Choisissez une réponse</div>`;
  }

  const correct = isAnswerCorrect(ex);
  return `
    <div class="lesson-foot__feedback">
      <span class="lesson-foot__mascot">${mascotMini(correct ? 'cheering' : 'sad')}</span>
      <div class="lesson-foot__text">
        <div class="font-bold">${correct ? 'Excellent !' : 'Pas tout à fait.'}</div>
        ${!correct ? `<div class="text-sm">Bonne réponse : <strong>${escapeHtml(ex.correct)}</strong></div>` : `<div class="text-sm">+${currentLesson.xpReward / currentLesson.exercises.length | 0} XP</div>`}
      </div>
    </div>
    <button class="btn btn-primary btn-full mt-sm" data-action="lesson-next"
            style="background:${correct ? 'var(--success)' : 'var(--error)'};">
      ${exerciseIndex === currentLesson.exercises.length - 1 ? 'Terminer la leçon' : 'Continuer'}
    </button>
  `;
}

function renderCompletion() {
  const total = currentLesson.exercises.length;
  const correct = total - mistakes;
  const perfect = mistakes === 0;
  const xp = currentLesson.xpReward;
  return `
    <div class="lesson-player">
      <header class="lesson-top">
        <div></div>
        <div class="lesson-progress"><div class="lesson-progress__fill" style="width:100%;"></div></div>
        <div></div>
      </header>
      <main class="lesson-body lesson-completion">
        <div class="lesson-completion__mascot">${mascot[perfect ? 'cheering' : correct >= total / 2 ? 'happy' : 'thinking'](150)}</div>
        <h2 class="font-display font-bold" style="font-size:32px;">
          ${perfect ? 'Leçon parfaite !' : 'Leçon terminée !'}
        </h2>
        <div class="text-sm text-muted">${correct} / ${total} bonnes réponses</div>

        <div class="lesson-rewards">
          <div class="reward-card">
            <div class="reward-icon" style="background:rgba(242,149,45,0.15); color:var(--kivu-accent);">⭐</div>
            <div class="font-bold text-lg">+${xp}</div>
            <div class="text-xs text-muted">XP gagnés</div>
          </div>
          <div class="reward-card">
            <div class="reward-icon" style="background:rgba(235,77,77,0.15); color:var(--error);">🔥</div>
            <div class="font-bold text-lg">${(store.get('user').stats.streak)}</div>
            <div class="text-xs text-muted">Jours de série</div>
          </div>
          ${perfect ? `
            <div class="reward-card">
              <div class="reward-icon" style="background:rgba(140,64,173,0.15); color:var(--kivu-tertiary);">💎</div>
              <div class="font-bold text-lg">+5</div>
              <div class="text-xs text-muted">Bonus parfait</div>
            </div>` : ''}
        </div>
      </main>
      <footer class="lesson-foot">
        <button class="btn btn-primary btn-full" data-action="lesson-finish"
                style="background:var(--kivu-accent);">
          Continuer mon parcours
        </button>
      </footer>
    </div>
  `;
}

// ----- Helpers ----------------------------------------------------------
function isAnswerCorrect(ex) {
  if (ex.type === 'type') {
    return normalize(answer) === normalize(ex.correct);
  }
  return answer === ex.correct;
}

function normalize(s) {
  return (s || '').toString().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

// ----- Mount ------------------------------------------------------------
renderLessonPlayer.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderLessonPlayer();
    renderLessonPlayer.mount();
  };

  // Auto-play TTS for listen exercise
  if (currentLesson && !isFinished) {
    const ex = currentLesson.exercises[exerciseIndex];
    if (ex && ex.type === 'listen' && !ex._played && speech.ttsSupported) {
      ex._played = true;
      const targetLang = store.get('lessons')?.targetLang || 'swa';
      setTimeout(() => speech.speak(ex.speak, targetLang), 300);
    }
    if (ex && ex.type === 'type') {
      setTimeout(() => document.getElementById('lesson-type-input')?.focus(), 50);
    }
  }

  document.querySelectorAll('[data-action="lesson-quit"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!isFinished && exerciseIndex > 0) {
        if (!confirm('Quitter la leçon ? Votre progression sera perdue.')) return;
      }
      navigate('/learn');
    })
  );

  document.querySelectorAll('[data-action="lesson-pick"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (answer != null) return;
      answer = btn.dataset.value;
      const ex = currentLesson.exercises[exerciseIndex];
      if (!isAnswerCorrect(ex)) {
        mistakes++;
        loseHeart();
      } else {
        // play correct answer for learning
        if (ex.type === 'multiple-choice' && speech.ttsSupported) {
          const targetLang = store.get('lessons')?.targetLang || 'swa';
          setTimeout(() => speech.speak(ex.correct, targetLang), 300);
        }
      }
      rerender();
    })
  );

  document.querySelectorAll('[data-action="lesson-replay"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const ex = currentLesson.exercises[exerciseIndex];
      const targetLang = store.get('lessons')?.targetLang || 'swa';
      if (ex && speech.ttsSupported) speech.speak(ex.speak, targetLang);
    })
  );

  const typeInput = document.getElementById('lesson-type-input');
  if (typeInput) {
    typeInput.addEventListener('input', () => { typed = typeInput.value; });
    typeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.querySelector('[data-action="lesson-check-type"]')?.click();
      }
    });
  }

  document.querySelectorAll('[data-action="lesson-check-type"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const input = document.getElementById('lesson-type-input');
      if (!input) return;
      typed = input.value.trim();
      if (!typed) return;
      answer = typed;
      const ex = currentLesson.exercises[exerciseIndex];
      if (!isAnswerCorrect(ex)) {
        mistakes++;
        loseHeart();
      } else if (speech.ttsSupported) {
        const targetLang = store.get('lessons')?.targetLang || 'swa';
        setTimeout(() => speech.speak(ex.correct, targetLang), 200);
      }
      rerender();
    })
  );

  // Match exercise
  document.querySelectorAll('[data-action="lesson-match-left"]').forEach(btn =>
    btn.addEventListener('click', () => onMatchClick('L', btn.dataset.value, rerender))
  );
  document.querySelectorAll('[data-action="lesson-match-right"]').forEach(btn =>
    btn.addEventListener('click', () => onMatchClick('R', btn.dataset.value, rerender))
  );

  document.querySelectorAll('[data-action="lesson-next"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (exerciseIndex >= currentLesson.exercises.length - 1) {
        finishLesson();
      } else {
        exerciseIndex++;
        answer = null;
        typed = '';
        rerender();
      }
    })
  );

  document.querySelectorAll('[data-action="lesson-finish"]').forEach(btn =>
    btn.addEventListener('click', () => navigate('/learn'))
  );
};

function onMatchClick(side, value, rerender) {
  const ex = currentLesson.exercises[exerciseIndex];
  if (!ex || ex.type !== 'match') return;

  // Track current selection in `answer` as 'L:foo' or 'R:bar'
  const key = side + ':' + value;

  if (!answer) {
    answer = key;
    rerender();
    return;
  }
  // If user clicks the same side again, replace selection
  const [prevSide, prevValue] = answer.split(/:(.+)/);
  if (prevSide === side) {
    answer = key;
    rerender();
    return;
  }
  // We have a pair: left + right
  const fr     = prevSide === 'L' ? prevValue : value;
  const target = prevSide === 'R' ? prevValue : value;
  const pair = ex.pairs.find(p => p.fr === fr);
  if (pair && pair.target === target) {
    matched[fr] = target;
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('Bonne paire ! 🔥', { type: 'success', duration: 900 });
    }
  } else {
    mistakes++;
    loseHeart();
    if (window.__KIVU__?.toast) {
      window.__KIVU__.toast('Pas la bonne paire', { type: 'error', duration: 1200 });
    }
  }
  answer = null;
  rerender();
}

function loseHeart() {
  const lessons = store.get('lessons') || {};
  const next = Math.max(0, (lessons.hearts ?? 5) - 1);
  store.set('lessons', { ...lessons, hearts: next, heartsRegenAt: next < 5 ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() : null });
}

function finishLesson() {
  isFinished = true;
  const lessons = store.get('lessons') || {};
  const completed = [...(lessons.completed || [])];
  const already = completed.find(c => c.id === currentLesson.id);
  const score = currentLesson.exercises.length - mistakes;
  const perfect = mistakes === 0;
  if (already) {
    already.score = Math.max(already.score || 0, score);
    already.perfect = already.perfect || perfect;
  } else {
    completed.push({
      id: currentLesson.id,
      score,
      perfect,
      date: new Date().toISOString()
    });
  }
  const newCurrentDay = Math.max(lessons.currentDay || 1, currentLesson.day + 1);
  store.set('lessons', { ...lessons, completed, currentDay: newCurrentDay });

  // XP for user
  const u = store.get('user');
  const xpGain = currentLesson.xpReward + (perfect ? 5 : 0);
  store.set('user', {
    ...u,
    stats: {
      ...u.stats,
      xp: u.stats.xp + xpGain,
      wordsLearned: u.stats.wordsLearned + score
    }
  });

  // re-render
  const main = document.querySelector('main.screen');
  if (main) main.innerHTML = renderLessonPlayer();
  renderLessonPlayer.mount();
}
