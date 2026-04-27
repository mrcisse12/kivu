/**
 * KIVU — Story Player.
 *
 * Plein écran. Avance ligne par ligne, chaque ligne est lue par TTS dans la
 * voix du personnage (langue détectée par `lang`). À la fin du chapitre,
 * pose la question de compréhension. À la fin de l'histoire, montre les
 * récompenses et marque l'histoire complétée.
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { speech } from '../services/speech.js';
import { getStory } from '../data/stories.js';
import { t } from '../i18n/index.js';

let storyId = null;
let chapterIdx = 0;
let lineIdx = 0;
let mode = 'play';        // 'play' (lignes) | 'question' (QCM) | 'done' (fin)
let answer = null;
let mistakes = 0;
let storyState = null;    // cache du store.stories

function ensureLoaded() {
  const id = window.location.hash.split('/')[2];
  if (!id) return false;
  if (storyId !== id) {
    storyId = id;
    chapterIdx = 0;
    lineIdx = 0;
    mode = 'play';
    answer = null;
    mistakes = 0;
  }
  return true;
}

export function renderStoryPlayer() {
  if (!ensureLoaded()) return '<div class="empty-state">Story introuvable</div>';
  const story = getStory(storyId);
  if (!story) {
    return `<div class="empty-state">
      <span class="empty-state__emoji">📖</span>
      <div class="empty-state__title">Histoire non trouvée</div>
      <button class="btn btn-primary mt-md" data-action="story-back">Retour</button>
    </div>`;
  }

  if (mode === 'done') return renderDone(story);
  const chapter = story.chapters[chapterIdx];
  if (mode === 'question') return renderQuestion(story, chapter);
  return renderPlayLine(story, chapter);
}

function chapterProgress(story) {
  const chaptersDone = chapterIdx + (mode === 'done' ? 1 : 0);
  return Math.min(100, ((chaptersDone) / story.chapters.length) * 100);
}

function renderPlayLine(story, chapter) {
  const line = chapter.lines[lineIdx];
  const speaker = story.characters[line.speaker];
  const isNarrator = line.speaker === 'narrator';

  return `
    <div class="story-player">
      <header class="story-top">
        <button class="lesson-close" data-action="story-quit" aria-label="Quitter">
          ${icons.close(22)}
        </button>
        <div class="lesson-progress">
          <div class="lesson-progress__fill" style="width:${chapterProgress(story)}%;"></div>
        </div>
        <div class="story-chapter-label">
          ${t('stories.chapter', { n: chapterIdx + 1, total: story.chapters.length })}
        </div>
      </header>

      <main class="story-stage" style="background:${chapter.scene.bg};">
        <div class="story-scene-emoji">${chapter.scene.emoji}</div>
        <div class="story-chapter-title">${chapter.title}</div>
      </main>

      <section class="story-dialog">
        ${isNarrator ? renderNarratorLine(line) : renderCharacterLine(line, speaker)}
      </section>

      <footer class="story-foot">
        <div class="story-line-counter">
          ${lineIdx + 1} / ${chapter.lines.length}
        </div>
        <div class="flex gap-xs">
          <button class="btn btn-ghost" data-action="story-replay" aria-label="Réécouter">
            ${icons.speaker(18)}
          </button>
          <button class="btn btn-primary btn-full" data-action="story-next">
            ${lineIdx === chapter.lines.length - 1 ? t('stories.question') : t('common.next')}
          </button>
        </div>
      </footer>
    </div>
  `;
}

function renderNarratorLine(line) {
  return `
    <div class="story-narrator-bubble">
      <div class="story-narrator-text">${escapeHtml(line.text)}</div>
    </div>
  `;
}

function renderCharacterLine(line, speaker) {
  return `
    <div class="story-char-row">
      <div class="story-char-avatar" style="background:${speaker.color}1a; border-color:${speaker.color};">
        <span style="font-size:32px;">${speaker.avatar}</span>
      </div>
      <div class="story-char-bubble" style="border-color:${speaker.color}; border-bottom-color:${darken(speaker.color)};">
        <div class="story-char-name" style="color:${speaker.color};">${speaker.name}</div>
        <div class="story-line-text">${escapeHtml(line.text)}</div>
        ${line.tr ? `<div class="story-line-tr">${escapeHtml(line.tr)}</div>` : ''}
        <div class="story-line-lang">
          <span class="chip chip-ghost">${langLabel(line.lang)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderQuestion(story, chapter) {
  const q = chapter.question;
  return `
    <div class="story-player">
      <header class="story-top">
        <button class="lesson-close" data-action="story-quit" aria-label="Quitter">${icons.close(22)}</button>
        <div class="lesson-progress">
          <div class="lesson-progress__fill" style="width:${chapterProgress(story)}%;"></div>
        </div>
        <div class="story-chapter-label">${t('stories.question')}</div>
      </header>

      <main class="story-question-stage">
        <div class="story-question-mascot">${mascot.thinking(110)}</div>
        <h2 class="font-display font-bold" style="font-size:24px; text-align:center;">
          ${escapeHtml(q.prompt)}
        </h2>
      </main>

      <section class="story-question-options">
        ${q.options.map((opt, i) => {
          let cls = 'lesson-option';
          if (answer != null) {
            if (opt === q.correct) cls += ' is-correct';
            else if (opt === answer) cls += ' is-wrong';
            else cls += ' is-disabled';
          }
          return `
            <button class="${cls}"
                    data-action="story-pick" data-value="${escapeAttr(opt)}"
                    ${answer != null ? 'disabled' : ''}>
              <span class="lesson-option__letter">${String.fromCharCode(65 + i)}</span>
              <span class="lesson-option__text">${escapeHtml(opt)}</span>
            </button>
          `;
        }).join('')}
      </section>

      <footer class="story-foot ${answer != null ? (answer === q.correct ? 'lesson-foot--correct' : 'lesson-foot--wrong') : ''}">
        ${renderQuestionFoot(q, story)}
      </footer>
    </div>
  `;
}

function renderQuestionFoot(q, story) {
  if (answer == null) {
    return `<div class="text-xs text-muted">${t('stories.questionPick')}</div>`;
  }
  const correct = answer === q.correct;
  const isLastChapter = chapterIdx === story.chapters.length - 1;
  return `
    <div class="lesson-foot__feedback">
      <span class="lesson-foot__mascot">${mascot[correct ? 'cheering' : 'sad'](64)}</span>
      <div class="lesson-foot__text">
        <div class="font-bold">${correct ? t('lesson.excellent') : t('lesson.notQuite')}</div>
        ${!correct ? `<div class="text-sm">${t('lesson.goodAnswer')} <strong>${escapeHtml(q.correct)}</strong></div>` : '<div class="text-sm">+10 XP</div>'}
      </div>
    </div>
    <button class="btn btn-primary btn-full mt-sm" data-action="story-after-question">
      ${isLastChapter ? t('stories.finish') : t('stories.nextChapter')}
    </button>
  `;
}

function renderDone(story) {
  const total = story.chapters.length;
  const correct = total - mistakes;
  const xp = story.xp + (mistakes === 0 ? 20 : 0);

  return `
    <div class="story-player">
      <header class="story-top">
        <div></div>
        <div class="lesson-progress"><div class="lesson-progress__fill" style="width:100%;"></div></div>
        <div></div>
      </header>
      <main class="lesson-body lesson-completion">
        <div class="lesson-completion__mascot">${mascot[mistakes === 0 ? 'cheering' : 'happy'](150)}</div>
        <h2 class="font-display font-bold" style="font-size:32px;">
          ${t('stories.storyDoneTitle')}
        </h2>
        <div class="text-sm text-muted">${escapeHtml(story.title)}</div>
        <div class="text-sm text-muted mt-xs">${t('lesson.correctAnswers', { n: correct, total })}</div>

        <div class="lesson-rewards">
          <div class="reward-card">
            <div class="reward-icon" style="background:rgba(255,150,0,0.15); color:#E08600;">⭐</div>
            <div class="font-bold text-lg">+${xp}</div>
            <div class="text-xs text-muted">${t('lesson.xpEarned')}</div>
          </div>
          <div class="reward-card">
            <div class="reward-icon" style="background:rgba(28,176,246,0.15); color:#1CB0F6;">📚</div>
            <div class="font-bold text-lg">${total}</div>
            <div class="text-xs text-muted">${t('stories.chaptersRead')}</div>
          </div>
          ${mistakes === 0 ? `
            <div class="reward-card">
              <div class="reward-icon" style="background:rgba(206,130,255,0.15); color:#8C40AD;">💎</div>
              <div class="font-bold text-lg">+20</div>
              <div class="text-xs text-muted">${t('lesson.perfectBonus')}</div>
            </div>` : ''}
        </div>
      </main>
      <footer class="story-foot">
        <button class="btn btn-primary btn-full" data-action="story-finish">${t('stories.backToStories')}</button>
      </footer>
    </div>
  `;
}

// ----- helpers ----------------------------------------------------------
function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function darken(hex) {
  // very simple darken: shift toward black by 15%
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
  r = Math.max(0, r - 38); g = Math.max(0, g - 38); b = Math.max(0, b - 38);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function langLabel(code) {
  return ({
    fra: '🇫🇷 Français', eng: '🇬🇧 English', swa: '🇹🇿 Swahili',
    wol: '🇸🇳 Wolof', bam: '🇲🇱 Bambara', dyu: '🇨🇮 Dioula',
    hau: '🇳🇬 Haoussa', yor: '🇳🇬 Yoruba', zul: '🇿🇦 Zulu', ibo: '🇳🇬 Igbo'
  })[code] || code;
}

// ----- mount ------------------------------------------------------------
renderStoryPlayer.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderStoryPlayer();
    renderStoryPlayer.mount();
  };

  // Auto-play current line via TTS
  if (mode === 'play' && storyId) {
    const story = getStory(storyId);
    const chapter = story?.chapters[chapterIdx];
    const line = chapter?.lines[lineIdx];
    if (line && speech.ttsSupported && !line._spoken) {
      line._spoken = true;
      const speed = line.speaker === 'narrator' ? 0.9 : 0.95;
      setTimeout(() => speech.speak(line.text, line.lang, { rate: speed }), 250);
    }
  }

  document.querySelectorAll('[data-action="story-quit"]').forEach(btn =>
    btn.addEventListener('click', () => {
      speech.cancelSpeech();
      navigate('/stories');
    })
  );

  document.querySelectorAll('[data-action="story-back"]').forEach(btn =>
    btn.addEventListener('click', () => navigate('/stories'))
  );

  document.querySelectorAll('[data-action="story-next"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const story = getStory(storyId);
      const chapter = story.chapters[chapterIdx];
      if (lineIdx < chapter.lines.length - 1) {
        lineIdx++;
        rerender();
      } else {
        // End of chapter -> question
        mode = 'question';
        answer = null;
        rerender();
      }
    })
  );

  document.querySelectorAll('[data-action="story-replay"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const story = getStory(storyId);
      const line = story?.chapters[chapterIdx]?.lines[lineIdx];
      if (line) speech.speak(line.text, line.lang, { rate: 0.92 });
    })
  );

  document.querySelectorAll('[data-action="story-pick"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (answer != null) return;
      answer = btn.dataset.value;
      const story = getStory(storyId);
      const q = story.chapters[chapterIdx].question;
      if (answer !== q.correct) mistakes++;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="story-after-question"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const story = getStory(storyId);
      if (chapterIdx >= story.chapters.length - 1) {
        finishStory(story);
      } else {
        chapterIdx++;
        lineIdx = 0;
        mode = 'play';
        answer = null;
        rerender();
      }
    })
  );

  document.querySelectorAll('[data-action="story-finish"]').forEach(btn =>
    btn.addEventListener('click', () => navigate('/stories'))
  );
};

function finishStory(story) {
  mode = 'done';

  // Persist story completion (also update storiesProgress for badge compatibility)
  const stories = store.get('stories') || { completed: [] };
  const storiesProgress = store.get('storiesProgress') || { completed: [] };
  if (!stories.completed.includes(story.id)) {
    stories.completed = [...stories.completed, story.id];
    store.set('stories', stories);
  }
  if (!storiesProgress.completed?.includes(story.id)) {
    store.set('storiesProgress', {
      ...storiesProgress,
      completed: [...(storiesProgress.completed || []), story.id]
    });
  }

  // XP + streak + level-up (same logic as lesson-player)
  const u = store.get('user');
  const xpGain = story.xp + (mistakes === 0 ? 20 : 0);
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const last = u.stats.lastPlayedDate || '';
  let newStreak = u.stats.streak || 0;
  if (last !== today) {
    newStreak = last === yesterday ? newStreak + 1 : 1;
  }

  let newXP = (u.stats.xp || 0) + xpGain;
  let newLevel = u.stats.level || 1;
  let newNextLevelXP = u.stats.nextLevelXP || 500;
  let leveledUp = false;
  while (newXP >= newNextLevelXP) {
    newLevel++;
    newNextLevelXP = Math.ceil(newNextLevelXP * 1.45 / 100) * 100;
    leveledUp = true;
  }

  store.set('user', {
    ...u,
    stats: {
      ...u.stats,
      xp: newXP,
      level: newLevel,
      nextLevelXP: newNextLevelXP,
      streak: newStreak,
      lastPlayedDate: today
    }
  });

  if (leveledUp && window.__KIVU__?.toast) {
    setTimeout(() => window.__KIVU__.toast(`🎉 Niveau ${newLevel} atteint !`, { type: 'success', duration: 3500 }), 600);
  }

  const main = document.querySelector('main.screen');
  if (main) main.innerHTML = renderStoryPlayer();
  renderStoryPlayer.mount();
}
