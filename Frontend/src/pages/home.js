import { store } from '../store.js';
import { LANGUAGES } from '../data/languages.js';
import { ENTRIES } from '../data/dictionary.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { speech } from '../services/speech.js';
import { t } from '../i18n/index.js';

// Tuiles fonctionnalités — emojis catégorie autorisés (gamification visuelle)
// MAIS l'icône principale dans la nav reste SVG pour le côté premium.
function features() {
  return [
    { path: '/translate',     emoji: '🗣️', color: 'var(--color-translation)',  title: t('features.translation'),   desc: t('features.translationDesc') },
    { path: '/learn',         emoji: '🎓', color: 'var(--color-learning)',     title: t('features.learning'),      desc: t('features.learningDesc') },
    { path: '/preserve',      emoji: '🛡️', color: 'var(--color-preservation)', title: t('features.preservation'),  desc: t('features.preservationDesc') },
    { path: '/business',      emoji: '💼', color: 'var(--color-business)',     title: t('features.business'),      desc: t('features.businessDesc') },
    { path: '/multi-party',   emoji: '🤝', color: 'var(--color-multiparty)',   title: t('features.multiparty'),    desc: t('features.multipartyDesc') },
    { path: '/assistant',     emoji: '✨', color: 'var(--color-assistant)',    title: t('features.assistant'),     desc: t('features.assistantDesc') },
    { path: '/diaspora',      emoji: '💙', color: 'var(--color-diaspora)',     title: t('features.diaspora'),      desc: t('features.diasporaDesc') },
    { path: '/accessibility', emoji: '♿', color: 'var(--color-accessibility)', title: t('features.accessibility'), desc: t('features.accessibilityDesc') }
  ];
}

export function renderHome() {
  const user = store.get('user');
  const greeting = computeGreeting();
  const endangered = LANGUAGES.filter(l => l.status === 'endangered' || l.status === 'critical');
  const xpPct = (user.stats.xp / user.stats.nextLevelXP * 100).toFixed(0);
  const firstName = user.name.split(' ')[0];

  return `
    <div class="screen-header animate-slide-down">
      <div>
        <div class="text-sm text-muted">${greeting}</div>
        <div class="screen-title">${firstName}</div>
      </div>
      <button class="icon-btn icon-btn--bell" aria-label="${t('common.new')}">
        ${icons.bell(22)}
        <span class="notification-dot" aria-hidden="true"></span>
      </button>
    </div>

    <!-- Hero XP Card avec orbs décoratifs animés -->
    <div class="hero-card grad-hero mb-md animate-scale-in" style="position:relative; overflow:hidden;">
      <span class="orb orb--accent" style="width:160px; height:160px; top:-60px; right:-40px;"></span>
      <span class="orb orb--primary" style="width:120px; height:120px; bottom:-50px; left:-30px; animation-delay:-4s;"></span>

      <div style="position:relative; z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <div class="flex items-center gap-xs">
            <span style="font-size:18px;" class="animate-breathe" aria-hidden="true">🔥</span>
            <span class="text-sm" style="opacity:0.92; font-weight:600;">${t('home.streakDays', { count: user.stats.streak })}</span>
          </div>
          <span class="badge-live" style="background:rgba(255,255,255,0.18); color:white;">${t('common.live')}</span>
        </div>

        <div class="flex gap-lg mb-md">
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.xp}">${user.stats.xp.toLocaleString('fr-FR')}</div>
            <div class="text-xs hero-stat-label">${t('home.xp')}</div>
          </div>
          <div>
            <div class="text-2xl font-bold">${user.stats.level}</div>
            <div class="text-xs hero-stat-label">${t('home.level')}</div>
          </div>
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.wordsLearned}">${user.stats.wordsLearned}</div>
            <div class="text-xs hero-stat-label">${t('home.words')}</div>
          </div>
        </div>

        <div class="progress-bar mb-xs" style="background:rgba(255,255,255,0.22);">
          <div class="progress-fill" style="width: ${xpPct}%; background:linear-gradient(90deg, #FFB859, #FFFFFF);"></div>
        </div>
        <div class="flex justify-between text-xs" style="opacity:0.92;">
          <span>${t('home.level')} ${user.stats.level} — ${t('home.levelMaster')}</span>
          <span class="font-bold">${xpPct}%</span>
        </div>
      </div>
    </div>

    <!-- Mascotte de bienvenue -->
    <div class="card mascot-greeting mb-md">
      <div class="mascot-greeting__avatar animate-float" aria-hidden="true">${mascot.waving(80)}</div>
      <div class="mascot-greeting__body">
        <div class="font-bold">${t('home.greetingMascot', { name: firstName })}</div>
        <div class="text-xs text-muted">${t('home.greetingMascotSub', { streak: user.stats.streak })}</div>
      </div>
      <button class="btn btn-primary btn-sm" data-nav="/learn"
              style="background:var(--kivu-accent); flex-shrink:0;">${t('common.continue')}</button>
    </div>

    <!-- Daily goal -->
    ${renderDailyGoal(user)}

    <!-- Action principale -->
    <button class="card featured-action mb-md" data-nav="/translate">
      <span class="featured-action__icon">${icons.mic(28, 'white')}</span>
      <div class="featured-action__body">
        <div class="font-bold text-md">${t('home.startTranslation')}</div>
        <div class="text-xs text-muted">${t('home.startTranslationDesc')}</div>
      </div>
      <span class="featured-action__arrow">${icons.chevronRight(20)}</span>
    </button>

    <!-- Grille des 8 fonctionnalités -->
    <div class="section-head mb-sm mt-lg">
      <h2 class="font-display font-bold text-lg">${t('home.sectionFeatures')}</h2>
      <span class="text-xs text-muted">${t('home.sectionFeaturesSub')}</span>
    </div>
    <div class="grid grid-2 mb-lg">
      ${features().map(f => renderFeatureTile(f)).join('')}
    </div>

    <!-- Impact en temps réel -->
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">${t('home.sectionImpact')}</h2>
      <span class="badge-live">${t('common.live')}</span>
    </div>
    <div class="grid grid-3 mb-lg">
      ${renderImpact('2 047', t('home.impactLanguages'), 'var(--kivu-primary)', icons.globe)}
      ${renderImpact('127M',  t('home.impactPeople'),    'var(--kivu-accent)',  icons.users)}
      ${renderImpact('483',   t('home.impactSaved'),     'var(--kivu-tertiary)', icons.preserve)}
    </div>

    <!-- Défi du jour -->
    ${renderDailyChallenge()}

    <!-- Langues à sauver -->
    <div class="section-head mb-sm">
      <div>
        <h2 class="font-display font-bold text-lg">Langues à sauver</h2>
        <div class="text-xs text-muted">Chaque voix compte. Chaque culture mérite d'exister.</div>
      </div>
      <button class="link-btn" data-nav="/preserve">Tout voir ${icons.chevronRight(14)}</button>
    </div>

    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${endangered.map(lang => `
          <div class="card endangered-card">
            <div class="flex justify-between items-center">
              <span class="lang-flag-xl">${lang.flag}</span>
              <span class="chip chip-error">${lang.status === 'critical' ? 'Critique' : 'Menacée'}</span>
            </div>
            <div>
              <div class="font-bold">${lang.name}</div>
              <div class="text-xs text-muted">${lang.nativeName}</div>
            </div>
            <div class="text-xs text-muted">${formatSpeakers(lang.speakers)}</div>
            <button class="btn btn-primary btn-sm" data-nav="/preserve">Contribuer</button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Mot du jour -->
    ${renderWordOfDay()}

    <!-- Radio Kivi + Stories -->
    <div class="grid grid-2 mb-md">
      <button class="card radio-promo" data-nav="/radio" style="background:#1CB0F6; color:white; border-color:#1899D6; border-bottom-color:#1899D6;">
        <span class="radio-promo__icon" style="background:white; color:#1CB0F6;">${icons.speaker(24, 'currentColor')}</span>
        <div style="flex:1; text-align:left;">
          <div class="font-bold" style="color:white;">${t('home.radioCard')}</div>
          <div class="text-xs" style="opacity:0.92;">${t('home.radioCardSub')}</div>
        </div>
      </button>
      <button class="card radio-promo" data-nav="/stories" style="background:#FF9600; color:white; border-color:#E08600; border-bottom-color:#E08600;">
        <span class="radio-promo__icon" style="background:white; color:#FF9600;">${icons.book(24, 'currentColor')}</span>
        <div style="flex:1; text-align:left;">
          <div class="font-bold" style="color:white;">${t('home.storiesCard')}</div>
          <div class="text-xs" style="opacity:0.92;">${t('home.storiesCardSub')}</div>
        </div>
      </button>
    </div>

    <!-- Communauté -->
    <h2 class="font-display font-bold text-lg mb-sm">${t('home.sectionCommunity')}</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderCommunityPost('👵🏾', 'Mamie Awa', 'a enregistré 12 proverbes Wolof', 'il y a 3 h')}
      ${renderCommunityPost('👨🏾‍🎓', 'Koffi', 'a terminé le niveau 15 en Dioula', 'il y a 5 h')}
      ${renderCommunityPost('👩🏾‍⚕️', 'Dr. Amina', 'a aidé 47 patients via KIVU', 'hier')}
    </div>
  `;
}

function renderDailyGoal(user) {
  const goal = user.dailyGoalMinutes || 10;
  // Real computation: each completed lesson today ≈ 5 minutes
  const today = new Date().toISOString().slice(0, 10);
  const lessons = store.get('lessons') || {};
  const lessonsToday = (lessons.completed || []).filter(c =>
    (c.date || '').slice(0, 10) === today
  ).length;
  const todayMinutes = Math.min(goal, lessonsToday * 5);
  const pct = Math.round((todayMinutes / goal) * 100);
  const remaining = Math.max(0, goal - todayMinutes);
  const ringDeg = (todayMinutes / goal) * 360;
  return `
    <div class="card daily-goal mb-md">
      <div class="daily-goal__ring" style="--ring-deg:${ringDeg}deg;">
        <div class="daily-goal__ring-inner">
          <div class="daily-goal__ring-value">${todayMinutes}</div>
          <div class="daily-goal__ring-unit">/ ${goal} min</div>
        </div>
      </div>
      <div class="daily-goal__body">
        <div class="font-bold">Objectif du jour</div>
        <div class="text-xs text-muted">
          ${pct >= 100
            ? 'Bravo, objectif atteint ! 🔥'
            : remaining + ' min restantes pour garder ta série'}
        </div>
        <div class="progress-bar progress-bar--thin mt-sm">
          <div class="progress-fill" style="width:${pct}%; background:var(--grad-hero);"></div>
        </div>
      </div>
    </div>
  `;
}

function renderDailyChallenge() {
  // Real challenge: complete N lessons today
  const today = new Date().toISOString().slice(0, 10);
  const lessons = store.get('lessons') || {};
  const LANG_LABELS_SHORT = { swa:'Swahili', wol:'Wolof', bam:'Bambara', hau:'Haoussa', yor:'Yoruba', zul:'Zulu', ibo:'Igbo', fra:'Français' };
  const lang = lessons.targetLang || 'swa';
  const langName = LANG_LABELS_SHORT[lang] || lang;
  const todayDone = (lessons.completed || []).filter(c => (c.date || '').slice(0, 10) === today).length;
  const target = 3; // 3 leçons = défi du jour
  const pct = Math.min(100, Math.round((todayDone / target) * 100));
  const done = todayDone >= target;
  return `
    <div class="hero-card grad-sunset mb-lg" style="position:relative; overflow:hidden;">
      <span class="orb orb--accent" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.3"></span>
      <div style="position:relative;z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <span class="chip chip-white">⚡ Défi du jour</span>
          <span class="chip chip-white">+${done ? '🏆 Terminé !' : '150 XP'}</span>
        </div>
        <h3 class="text-lg font-bold mb-xs">
          ${done ? '🎉 Défi accompli !' : `Terminez ${target} leçons de ${langName} aujourd'hui`}
        </h3>
        <div class="flex justify-between items-center mt-sm">
          <div>
            <div class="progress-bar" style="background:rgba(255,255,255,0.22); max-width:160px;">
              <div class="progress-fill" style="width:${pct}%; background:white;"></div>
            </div>
            <span class="text-xs mt-xs" style="opacity:0.92">${todayDone} / ${target} leçons complétées</span>
          </div>
          ${done
            ? `<span class="chip chip-white">✓ Bravo !</span>`
            : `<button class="btn btn-white" data-nav="/learn">Continuer</button>`}
        </div>
      </div>
    </div>
  `;
}

function renderWordOfDay() {
  // Pick a deterministic daily word (changes each day, same for whole day)
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000);
  const entry = ENTRIES[dayOfYear % ENTRIES.length];
  const user = store.get('user') || {};
  const lang = user.preferredLanguage || 'swa';
  // Show user's learning language translation + English
  const LANG_NAMES_SHORT = { swa:'Swahili', wol:'Wolof', bam:'Bambara', hau:'Haoussa', yor:'Yoruba', zul:'Zulu', ibo:'Igbo', en:'Anglais', fra:'Français', dyu:'Dioula' };
  const LANG_FLAGS_MAP = { swa:'🇹🇿', wol:'🇸🇳', bam:'🇲🇱', hau:'🇳🇬', yor:'🇳🇬', zul:'🇿🇦', ibo:'🇳🇬', en:'🇬🇧' };
  const langCode = ['swa','wol','bam','hau','yor','zul','ibo'].includes(lang) ? lang : 'swa';
  const translation = entry[langCode] || entry.swa;
  const flag = LANG_FLAGS_MAP[langCode] || '🌍';
  const langName = LANG_NAMES_SHORT[langCode] || 'Swahili';

  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Mot du jour</h2>
      <span class="chip chip-primary">📅 Quotidien</span>
    </div>
    <div class="card wotd-card mb-lg" data-action="wotd-speak"
         style="background:linear-gradient(135deg, #1CB0F630 0%, #FF960010 100%); border-color: #1CB0F640; cursor:pointer;">
      <div class="flex items-center gap-md">
        <div class="wotd-emoji" aria-hidden="true">${entry.emoji}</div>
        <div style="flex:1;">
          <div class="font-display font-bold text-2xl">${entry.fr}</div>
          <div class="text-sm text-muted mb-sm">${entry.en} <span class="text-tertiary">·</span> ${entry.category}</div>
          <div class="flex gap-sm flex-wrap">
            <span class="chip chip-primary">${flag} ${langName} : <strong>${translation}</strong></span>
            ${entry.en !== translation ? `<span class="chip chip-ghost">🇬🇧 ${entry.en}</span>` : ''}
          </div>
        </div>
        <button class="icon-btn" aria-label="Écouter la prononciation" style="flex-shrink:0;">
          ${icons.speaker(20)}
        </button>
      </div>
    </div>
  `;
}

function renderFeatureTile(f) {
  return `
    <button class="feature-tile" data-nav="${f.path}" aria-label="${f.title}">
      <div class="feature-icon" style="background: ${f.color}1a; color: ${f.color};">
        <span aria-hidden="true">${f.emoji}</span>
      </div>
      <div class="feature-title">${f.title}</div>
      <div class="feature-desc">${f.desc}</div>
    </button>
  `;
}

function renderImpact(value, label, color, iconFn) {
  return `
    <div class="stat-card">
      <div class="stat-icon" style="color:${color}; background:${color}14;" aria-hidden="true">${iconFn(20)}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function renderCommunityPost(avatar, name, action, time) {
  return `
    <div class="list-row">
      <div class="avatar" aria-hidden="true">${avatar}</div>
      <div style="flex:1">
        <div class="font-semibold">${name}</div>
        <div class="text-xs text-muted">${action}</div>
      </div>
      <div class="text-xs text-muted">${time}</div>
    </div>
  `;
}

function computeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return t('greeting.morning');
  if (h < 18) return t('greeting.afternoon');
  return t('greeting.evening');
}

function formatSpeakers(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)} M locuteurs`;
  if (count >= 1_000) return `${Math.round(count / 1_000)} K locuteurs`;
  return `${count} locuteurs`;
}

renderHome.mount = function afterHomeRender() {
  // Animated counter
  document.querySelectorAll('[data-counter]').forEach(el => {
    const target = Number(el.dataset.counter);
    if (!Number.isFinite(target) || target <= 0) return;
    const duration = 900;
    const start = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const value = Math.round(target * eased);
      el.textContent = value.toLocaleString('fr-FR');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });

  // Word of the Day — speak on click
  document.querySelectorAll('[data-action="wotd-speak"]').forEach(el => {
    el.addEventListener('click', () => {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86_400_000);
      const entry = ENTRIES[dayOfYear % ENTRIES.length];
      const user = store.get('user') || {};
      const lang = ['swa','wol','bam','hau','yor','zul','ibo'].includes(user.preferredLanguage) ? user.preferredLanguage : 'swa';
      const word = entry[lang] || entry.swa;
      // Try to import speech lazily to avoid circular dependency issues
      if (speech.ttsSupported) {
        speech.speak(word, lang);
      } else if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`${entry.fr} → ${word}`, { type: 'info', duration: 2500 });
      }
    });
  });
};
