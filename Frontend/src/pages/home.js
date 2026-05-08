import { store } from '../store.js';
import { LANGUAGES } from '../data/languages.js';
import { ENTRIES } from '../data/dictionary.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { speech } from '../services/speech.js';
import { upcomingEvents, todayEvents, daysUntil } from '../data/events.js';
import { getFriends, getActivityFeed } from '../services/friends.js';
import { PRODUCTS } from '../data/marketplace.js';
import { STORIES } from '../data/stories.js';
import { buildCurriculum, LANG_LABELS } from '../data/lessons.js';
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
    </div>

    <!-- Hero XP Card avec orbs décoratifs animés + sheen sweep -->
    <div class="hero-card grad-hero mb-md animate-scale-in" style="position:relative;">
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
          <button class="hero-stat" data-nav="/stats" aria-label="Voir mes XP">
            <div class="text-2xl font-bold" data-counter="${user.stats.xp}">${user.stats.xp.toLocaleString('fr-FR')}</div>
            <div class="text-xs hero-stat-label">${t('home.xp')}</div>
          </button>
          <button class="hero-stat" data-nav="/profile" aria-label="Voir mon niveau">
            <div class="text-2xl font-bold">${user.stats.level}</div>
            <div class="text-xs hero-stat-label">${t('home.level')}</div>
          </button>
          <button class="hero-stat" data-nav="/dictionary" aria-label="Voir mes mots">
            <div class="text-2xl font-bold" data-counter="${user.stats.wordsLearned}">${user.stats.wordsLearned}</div>
            <div class="text-xs hero-stat-label">${t('home.words')}</div>
          </button>
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

    <!-- Continue learning (only if user has progress) -->
    ${renderContinueCard()}

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

    <!-- Trending: Marketplace -->
    ${renderMarketplacePreview()}

    <!-- Trending: Stories -->
    ${renderStoriesPreview()}

    <!-- Événements culturels africains -->
    ${renderEventsTeaser()}

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

    <!-- Communauté & amis -->
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">${t('home.sectionCommunity')}</h2>
      <button class="link-btn text-xs" data-nav="/friends">Voir tous &rsaquo;</button>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderCommunityPosts()}
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

/* ─── New v2 sections ──────────────────────────────────── */

function renderContinueCard() {
  const lessons = store.get('lessons') || {};
  const completedCount = (lessons.completed || []).length;
  const targetLang = lessons.targetLang || 'swa';
  const langInfo = LANG_LABELS[targetLang];
  if (!langInfo) return '';
  const currentDay = lessons.currentDay || 1;

  // Show only if user has at least 1 completed lesson (otherwise the
  // featured-action below is enough)
  if (completedCount < 1) return '';

  // Build curriculum to find the current lesson
  const curriculum = buildCurriculum(targetLang);
  const currentLesson = curriculum.find(l => l.day === currentDay) || curriculum[0];
  if (!currentLesson) return '';

  // Progress: completed / 30
  const progressPct = Math.min(100, Math.round((completedCount / 30) * 100));

  return `
    <button class="card continue-card mb-md" data-nav="/lesson/${currentDay}"
            style="background: linear-gradient(135deg, ${langInfo.color}15, ${langInfo.color}05); border-color: ${langInfo.color}40;">
      <div class="continue-card__top">
        <div class="continue-card__icon" style="background: ${langInfo.color};">
          ${langInfo.flag}
        </div>
        <div class="continue-card__body">
          <div class="text-xs continue-card__label">Reprendre où tu t'étais arrêté</div>
          <div class="font-display font-bold continue-card__title">Leçon ${currentDay} · ${escapeHtml(langInfo.name)}</div>
          <div class="text-xs text-muted">${escapeHtml(currentLesson.unit || '')}</div>
        </div>
        <span class="continue-card__arrow">▶</span>
      </div>
      <div class="continue-card__progress">
        <div class="continue-card__progress-bar">
          <div class="continue-card__progress-fill" style="width:${progressPct}%; background: ${langInfo.color};"></div>
        </div>
        <div class="text-xs text-muted">${completedCount} / 30 leçons · ${progressPct}%</div>
      </div>
    </button>
  `;
}

function renderMarketplacePreview() {
  // Pick 3 products with high ratings
  const top = [...PRODUCTS]
    .filter(p => p.rating >= 4.7)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 6);
  if (top.length === 0) return '';
  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">🛍️ Marketplace tendance</h2>
      <button class="link-btn text-xs" data-nav="/marketplace">Voir tout &rsaquo;</button>
    </div>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${top.map(p => `
          <button class="trend-card" data-nav="/marketplace" aria-label="${escapeAttr(p.name)}">
            <div class="trend-card__cover" style="background: ${p.cover};">
              <span class="trend-card__emoji">${p.emoji}</span>
              <span class="trend-card__country">${p.countryFlag}</span>
            </div>
            <div class="trend-card__body">
              <div class="trend-card__title">${escapeHtml(p.name)}</div>
              <div class="text-xs text-muted">${escapeHtml(p.seller)}</div>
              <div class="trend-card__price">${p.price.toLocaleString('fr-FR')} ${p.currency}</div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function renderStoriesPreview() {
  const completed = (store.get('stories') || {}).completed || [];
  const completedSet = new Set(completed);
  // Recommend stories not yet completed
  const top = STORIES.filter(s => !completedSet.has(s.id)).slice(0, 6);
  if (top.length === 0) return '';
  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">📖 Histoires recommandées</h2>
      <button class="link-btn text-xs" data-nav="/stories">Voir tout &rsaquo;</button>
    </div>
    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${top.map(s => `
          <button class="trend-card trend-card--story" data-nav="/story/${s.id}" aria-label="${escapeAttr(s.title)}">
            <div class="trend-card__cover" style="background: ${s.coverGradient};">
              <span class="trend-card__emoji">${s.cover}</span>
              <span class="trend-card__country">${s.flag}</span>
            </div>
            <div class="trend-card__body">
              <div class="trend-card__title">${escapeHtml(s.title)}</div>
              <div class="text-xs text-muted">${escapeHtml(s.unit || '')}</div>
              <div class="trend-card__chips">
                <span class="chip chip-ghost">${s.duration}</span>
                <span class="chip chip-accent">+${s.xp} XP</span>
              </div>
            </div>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function renderEventsTeaser() {
  const today = todayEvents();
  const upcoming = upcomingEvents(45);

  // If there's an event today — show celebration banner
  if (today.length > 0) {
    const ev = today[0];
    return `
      <div class="card events-card events-card--today mb-lg" style="background:linear-gradient(135deg, #FF9600 0%, #F2952D 100%); color:white; border-color:rgba(255,255,255,0.3); border-bottom-color:#D67A00;">
        <div class="flex items-center gap-md">
          <div class="events-emoji-big" aria-hidden="true">${ev.emoji}</div>
          <div style="flex:1;">
            <div class="text-xs font-semibold" style="opacity:0.85; letter-spacing:0.6px; text-transform:uppercase;">Aujourd'hui en Afrique</div>
            <div class="font-display font-bold text-lg" style="color:white; margin:2px 0 4px;">${ev.name}</div>
            <div class="text-xs" style="opacity:0.92;">${ev.region} · ${ev.desc}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (!upcoming.length) return '';

  // Show next 3 upcoming events
  const next3 = upcoming.slice(0, 3);
  return `
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Événements culturels</h2>
      <span class="chip chip-ghost">🌍 Afrique</span>
    </div>
    <div class="events-list mb-lg">
      ${next3.map(ev => {
        const days = daysUntil(ev.date);
        const dayLabel = days === 0 ? 'Aujourd\'hui' : days === 1 ? 'Demain' : `Dans ${days} jours`;
        const dateStr = ev.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        return `
          <div class="event-row">
            <div class="event-row__date" aria-hidden="true">
              <div class="event-row__day">${ev.date.getDate()}</div>
              <div class="event-row__month">${ev.date.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()}</div>
            </div>
            <div class="event-row__icon" aria-hidden="true">${ev.emoji}</div>
            <div class="event-row__body">
              <div class="font-semibold">${ev.name}</div>
              <div class="text-xs text-muted">${ev.region} · ${dayLabel}</div>
            </div>
          </div>
        `;
      }).join('')}
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

function renderCommunityPosts() {
  const user = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const completedCount = (lessons.completed || []).length;
  const streak = user.stats?.streak || 0;
  const contributions = user.stats?.contributionsCount || 0;
  const firstName = (user.name || 'Vous').split(' ')[0];
  const avatar = user.avatar || '🧑🏾';

  const friends = getFriends();
  const friendActivity = getActivityFeed(20).filter(a => a.friendId && a.friend);

  const posts = [];

  // 1. Friend activity (most recent first) — up to 2 entries
  friendActivity.slice(0, 2).forEach(a => {
    posts.push({
      avatar: a.friend.avatar,
      name: a.friend.name,
      action: a.text,
      time: relTimeShort(a.date)
    });
  });

  // 2. Self achievements (one each)
  if (completedCount > 0) {
    const lang = { swa:'Swahili', wol:'Wolof', bam:'Bambara', hau:'Haoussa', yor:'Yoruba', zul:'Zulu', ibo:'Igbo', dyu:'Dioula' }[lessons.targetLang] || 'Swahili';
    posts.push({ avatar, name: firstName + ' (vous)', action: `a complété ${completedCount} leçon${completedCount > 1 ? 's' : ''} de ${lang}`, time: 'aujourd\'hui' });
  }
  if (streak >= 3) {
    posts.push({ avatar, name: firstName + ' (vous)', action: `maintient une série de ${streak} jours consécutifs 🔥`, time: 'en cours' });
  }
  if (contributions > 0) {
    posts.push({ avatar, name: firstName + ' (vous)', action: `a contribué ${contributions} enregistrement${contributions > 1 ? 's' : ''} de préservation 🛡️`, time: 'récemment' });
  }

  // 3. Friends online status — peeking at members not yet shown
  const seenNames = new Set(posts.map(p => p.name));
  friends.filter(f => f.online && !seenNames.has(f.name)).slice(0, 2).forEach(f => {
    posts.push({
      avatar: f.avatar,
      name: f.name,
      action: `est en ligne · niveau ${f.level} en ${({ swa:'Swahili', wol:'Wolof', bam:'Bambara', hau:'Haoussa', yor:'Yoruba', zul:'Zulu', ibo:'Igbo', dyu:'Dioula', lin:'Lingala' }[f.learning] || 'sa langue cible')}`,
      time: 'en ligne'
    });
  });

  // 4. Fill up to 3 with community pool fallback
  const COMMUNITY_POOL = [
    { avatar: '👵🏾', name: 'Mamie Awa',  action: 'a enregistré 12 proverbes Wolof',     time: 'il y a 3 h' },
    { avatar: '👨🏾‍🎓', name: 'Koffi M.',  action: 'a terminé le niveau 15 en Dioula',    time: 'il y a 5 h' },
    { avatar: '👩🏾‍⚕️', name: 'Dr. Amina', action: 'a traduit 47 termes médicaux',         time: 'hier' },
    { avatar: '👨🏽‍💼', name: 'Seun A.',   action: 'a partagé 8 proverbes Yoruba',         time: 'il y a 2 h' },
    { avatar: '👩🏿‍🎤', name: 'Fatou D.',  action: 'est passée au niveau 20 en Swahili',  time: 'il y a 1 h' }
  ];
  let i = 0;
  while (posts.length < 3 && i < COMMUNITY_POOL.length) {
    const p = COMMUNITY_POOL[i++];
    if (!seenNames.has(p.name)) posts.push(p);
  }

  return posts.slice(0, 3).map(p => renderCommunityPost(p.avatar, p.name, p.action, p.time)).join('');
}

function relTimeShort(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  return `il y a ${d} j`;
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
