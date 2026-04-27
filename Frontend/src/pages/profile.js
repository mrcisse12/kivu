/**
 * KIVU — Page Profil complète
 *
 * • Hero card avec ring XP circulaire animé (SVG conic-gradient)
 * • Calendrier de série (14 jours) dérivé des lessons complétées
 * • Galerie de 18 badges KIVU avec états earned/locked
 * • Barres de progression par langue
 * • Mini-classement top-5
 * • Modal "Modifier le profil" fonctionnelle
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { navigate } from '../router.js';
import { t } from '../i18n/index.js';

/* ─────────────────────────── Constants ─────────────────────────── */

const LANG_INFO = {
  fra: { flag: '🇫🇷', name: 'Français',  color: '#4285F4' },
  eng: { flag: '🇬🇧', name: 'Anglais',   color: '#34A853' },
  swa: { flag: '🇹🇿', name: 'Swahili',   color: '#EA4335' },
  wol: { flag: '🇸🇳', name: 'Wolof',     color: '#FF9600' },
  bam: { flag: '🇲🇱', name: 'Bambara',   color: '#9B59B6' },
  dyu: { flag: '🇨🇮', name: 'Dioula',    color: '#1CB0F6' },
  hau: { flag: '🇳🇬', name: 'Haoussa',   color: '#E74C3C' },
  yor: { flag: '🇳🇬', name: 'Yoruba',    color: '#2ECC71' },
};

const MENU = [
  { label: 'Paramètres',               icon: icons.settings,      color: 'var(--kivu-primary)',   path: '/settings' },
  { label: 'Abonnement',               icon: icons.star,          color: 'var(--kivu-accent)',    path: '/settings' },
  { label: 'Accessibilité',            icon: icons.accessibility, color: 'var(--color-accessibility)', path: '/accessibility' },
  { label: 'Confidentialité',          icon: icons.lock,          color: 'var(--success)',        path: '/settings' },
  { label: 'À propos',                 icon: icons.heart,         color: 'var(--error)',          path: '/settings' },
];

// 18 KIVU badges — condition evaluated against live store data
const ALL_BADGES = [
  { id: 'first_lesson',   icon: '🎓', label: 'Premier pas',    desc: 'Complétez votre 1ère leçon',   cond: s => (s.lessons?.completed?.length || 0) >= 1 },
  { id: 'streak_3',       icon: '🔥', label: 'Flamme',         desc: '3 jours de suite',              cond: s => (s.user?.stats?.streak || 0) >= 3 },
  { id: 'streak_7',       icon: '🔥', label: 'Feu sacré',      desc: '7 jours de suite',              cond: s => (s.user?.stats?.streak || 0) >= 7 },
  { id: 'streak_30',      icon: '🌟', label: 'Incandescent',   desc: '30 jours de suite',             cond: s => (s.user?.stats?.streak || 0) >= 30 },
  { id: 'xp_500',         icon: '⚡', label: 'Étincelle',      desc: 'Gagnez 500 XP',                 cond: s => (s.user?.stats?.xp || 0) >= 500 },
  { id: 'xp_5000',        icon: '⚡', label: 'Énergie',        desc: 'Gagnez 5 000 XP',               cond: s => (s.user?.stats?.xp || 0) >= 5000 },
  { id: 'perfect_lesson', icon: '💎', label: 'Perfection',     desc: 'Réussissez une leçon sans faute', cond: s => (s.lessons?.completed || []).some(c => c.perfect) },
  { id: 'lessons_10',     icon: '📚', label: 'Studieux',       desc: 'Finissez 10 leçons',            cond: s => (s.lessons?.completed?.length || 0) >= 10 },
  { id: 'lessons_30',     icon: '🏆', label: 'Champion',       desc: 'Finissez 30 leçons',            cond: s => (s.lessons?.completed?.length || 0) >= 30 },
  { id: 'story_1',        icon: '📖', label: 'Conteur',        desc: 'Lisez votre 1ère histoire',     cond: s => (s.storiesProgress?.completed?.length || 0) >= 1 },
  { id: 'stories_5',      icon: '📖', label: 'Griot',          desc: 'Lisez 5 histoires',             cond: s => (s.storiesProgress?.completed?.length || 0) >= 5 },
  { id: 'words_50',       icon: '💬', label: 'Vocabulaire',    desc: 'Apprenez 50 mots',              cond: s => (s.user?.stats?.wordsLearned || 0) >= 50 },
  { id: 'words_200',      icon: '💬', label: 'Polyglotte',     desc: 'Apprenez 200 mots',             cond: s => (s.user?.stats?.wordsLearned || 0) >= 200 },
  { id: 'translator',     icon: '🗣️', label: 'Traducteur',     desc: '1ère traduction réussie',       cond: s => (s.user?.stats?.translationsCount || 0) >= 1 },
  { id: 'contributor',    icon: '🛡️', label: 'Gardien',        desc: '1ère contribution préservation',cond: s => (s.user?.stats?.contributionsCount || 0) >= 1 },
  { id: 'level_5',        icon: '🚀', label: 'Lancé',          desc: 'Atteignez le niveau 5',         cond: s => (s.user?.stats?.level || 1) >= 5 },
  { id: 'level_10',       icon: '🌍', label: 'Africain',       desc: 'Atteignez le niveau 10',        cond: s => (s.user?.stats?.level || 1) >= 10 },
  { id: 'early_bird',     icon: '🦅', label: 'Pionnier',       desc: 'Membre fondateur de KIVU',      cond: _s => true },  // everyone gets this one
];

const MOCK_LEADERBOARD = [
  { rank: 1, name: 'Aïcha Diallo',    flag: '🇬🇳', avatar: '👩🏾', xp: 12480 },
  { rank: 2, name: 'Koffi Mensah',    flag: '🇧🇯', avatar: '👨🏾', xp: 10950 },
  { rank: 3, name: 'Amara Traoré',    flag: '🇲🇱', avatar: '🧑🏾', xp: 9720  },
  { rank: 4, name: 'Fatou Ndiaye',    flag: '🇸🇳', avatar: '👩🏿', xp: 8410  },
  { rank: 5, name: 'Pierre Mendy',    flag: '🇬🇼', avatar: '🧑🏾', xp: 7200  },
];

/* ─────────────────────────── Helpers ───────────────────────────── */

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

/** Returns a Set of ISO dates (YYYY-MM-DD) where at least one lesson was done. */
function completedDates() {
  const completed = store.get('lessons')?.completed || [];
  const set = new Set();
  completed.forEach(c => {
    const raw = c.date || c.completedAt;
    if (raw) {
      try { set.add(isoDate(new Date(raw))); } catch { /* skip bad dates */ }
    }
  });
  return set;
}

/** Last N days as ISO strings, today last. */
function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

/** Conic-gradient SVG ring. Returns an HTML string. */
function xpRing(pct, level) {
  const radius = 52;
  const cx = 64; const cy = 64;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return `
    <svg class="xp-ring-svg" viewBox="0 0 128 128" aria-hidden="true" width="128" height="128">
      <!-- Track -->
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
              stroke="var(--divider)" stroke-width="10" />
      <!-- Progress arc -->
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
              stroke="url(#xpGrad)" stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="${circ}"
              stroke-dashoffset="${offset}"
              transform="rotate(-90 ${cx} ${cy})"
              class="xp-ring-arc" />
      <defs>
        <linearGradient id="xpGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1CB0F6"/>
          <stop offset="100%" stop-color="#FF9600"/>
        </linearGradient>
      </defs>
      <!-- Level label in center -->
      <text x="${cx}" y="${cy - 8}" text-anchor="middle"
            font-family="var(--font-display)" font-weight="800"
            font-size="26" fill="var(--text-primary)">${level}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle"
            font-family="var(--font-body)" font-weight="600"
            font-size="10" fill="var(--text-secondary)">NIVEAU</text>
    </svg>
  `;
}

/* ─────────────────────────── Renderers ─────────────────────────── */

function renderStreakCalendar() {
  const days = lastNDays(14);
  const done  = completedDates();
  const today = isoDate(new Date());
  const dayLabels = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  return `
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Calendrier de série</div>
        <span class="text-xs text-muted">14 derniers jours</span>
      </div>
      <div class="streak-cal">
        ${days.map(d => {
          const dt = new Date(d);
          const label = dayLabels[dt.getDay()];
          const isToday  = d === today;
          const isDone   = done.has(d);
          return `
            <div class="streak-cal__cell ${isDone ? 'is-done' : ''} ${isToday ? 'is-today' : ''}">
              <div class="streak-cal__dot" title="${d}"></div>
              <div class="streak-cal__lbl">${label}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderBadges(state) {
  const badges = ALL_BADGES.map(b => ({ ...b, earned: b.cond(state) }));
  const earnedCount = badges.filter(b => b.earned).length;

  return `
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Badges & Récompenses</div>
        <span class="chip chip-primary">${earnedCount} / ${badges.length}</span>
      </div>
      <div class="badges-grid">
        ${badges.map(b => `
          <div class="badge-cell ${b.earned ? 'badge-cell--earned' : 'badge-cell--locked'}"
               title="${b.label}: ${b.desc}">
            <div class="badge-icon" aria-hidden="true">${b.earned ? b.icon : '🔒'}</div>
            <div class="badge-label">${b.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderLangProgress(user) {
  const lessons  = store.get('lessons') || {};
  const completed = lessons.completed || [];
  const langs = [...new Set([
    user.preferredLanguage,
    user.motherTongue,
    ...(user.learningLanguages || [])
  ].filter(Boolean))];

  if (!langs.length) return '';

  // How many lessons completed per target language
  const countByLang = {};
  completed.forEach(c => {
    const id = c.targetLang || user.preferredLanguage;
    countByLang[id] = (countByLang[id] || 0) + 1;
  });

  // Each language: max lessons possible = 30 (curriculum length)
  return `
    <div class="card mb-md">
      <div class="font-bold mb-sm">Progression par langue</div>
      ${langs.map(id => {
        const info = LANG_INFO[id] || { flag: '🌍', name: id, color: 'var(--kivu-primary)' };
        const done = countByLang[id] || 0;
        const pct  = Math.round(Math.min(100, (done / 30) * 100));
        return `
          <div class="lang-progress-row mb-sm">
            <span class="lang-progress-flag" aria-hidden="true">${info.flag}</span>
            <div style="flex:1;">
              <div class="flex justify-between text-sm mb-xs">
                <span class="font-semibold">${info.name}</span>
                <span class="text-muted">${done} / 30 leçons</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill"
                     style="width:${pct}%; background:${info.color}; transition:width 0.8s cubic-bezier(.2,.8,.3,1);">
                </div>
              </div>
            </div>
            <span class="text-xs font-bold" style="color:${info.color}; min-width:34px; text-align:right;">
              ${pct}%
            </span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderLeaderboard(user) {
  const board = [...MOCK_LEADERBOARD];
  // Insert user if not already there
  const myRank = user.stats?.rank || 999;
  const myXP   = user.stats?.xp   || 0;
  const userInTop = board.some(r => r.xp <= myXP);

  return `
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Classement</div>
        <button class="link-btn text-xs" data-nav="/">Voir tout</button>
      </div>
      <div class="flex flex-col gap-xs">
        ${board.map(r => {
          const isMe = myRank === r.rank;
          return `
            <div class="list-row lb-row ${isMe ? 'lb-row--me' : ''}">
              <div class="lb-rank ${r.rank <= 3 ? 'lb-rank--top' : ''}">#${r.rank}</div>
              <div class="avatar" aria-hidden="true">${r.avatar}</div>
              <div style="flex:1;">
                <div class="font-semibold text-sm">${r.name}</div>
                <div class="text-xs text-muted">${r.flag}</div>
              </div>
              <div class="font-bold text-sm" style="color:var(--kivu-accent);">${r.xp.toLocaleString('fr-FR')} XP</div>
            </div>
          `;
        }).join('')}
        ${!userInTop ? `
          <div class="list-row lb-row lb-row--me">
            <div class="lb-rank">#${myRank}</div>
            <div class="avatar" aria-hidden="true">${user.avatar}</div>
            <div style="flex:1;">
              <div class="font-semibold text-sm">${user.name} (vous)</div>
            </div>
            <div class="font-bold text-sm" style="color:var(--kivu-accent);">${myXP.toLocaleString('fr-FR')} XP</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderEditModal(user) {
  return `
    <div class="modal-backdrop" id="edit-profile-modal" role="dialog" aria-modal="true" aria-label="Modifier le profil">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <h2 class="font-display font-bold text-lg mb-md">Modifier le profil</h2>
        <form id="edit-profile-form">
          <label class="form-group">
            <span class="form-label">Nom complet</span>
            <input class="form-input" type="text" name="name"
                   value="${escAttr(user.name)}" required autocomplete="name"/>
          </label>
          <label class="form-group">
            <span class="form-label">Avatar (emoji)</span>
            <div class="avatar-picker">
              ${['👩🏾','👨🏾','🧑🏾','👩🏿','👨🏿','🧑🏿','👩🏼','👨🏼','🧑🏼','👩🏽','👨🏽','🧑🏽'].map(em => `
                <button type="button" class="avatar-pick-btn ${user.avatar === em ? 'is-selected' : ''}"
                        data-avatar="${em}">${em}</button>
              `).join('')}
            </div>
          </label>
          <label class="form-group">
            <span class="form-label">Pays</span>
            <input class="form-input" type="text" name="country"
                   value="${escAttr(user.country || '')}" autocomplete="country-name"/>
          </label>
          <label class="form-group">
            <span class="form-label">Email</span>
            <input class="form-input" type="email" name="email"
                   value="${escAttr(user.email || '')}" autocomplete="email"/>
          </label>

          <div class="flex gap-sm mt-md">
            <button type="button" class="btn btn-ghost btn-full" id="edit-cancel-btn">Annuler</button>
            <button type="submit" class="btn btn-primary btn-full"
                    style="background:var(--kivu-primary);">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function escAttr(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ─────────────────────────── Main render ───────────────────────── */

export function renderProfile() {
  const user    = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const state   = store.get();

  const xpPct   = user.stats
    ? Math.round(Math.min(100, (user.stats.xp / (user.stats.nextLevelXP || 500)) * 100))
    : 0;

  const totalLessons = lessons.completed?.length || 0;
  const subsLabel    = {
    pro:     { label: 'KIVU PRO', color: '#FF9600',   emoji: '👑' },
    family:  { label: 'KIVU Famille', color: '#9B59B6', emoji: '👨‍👩‍👧‍👦' },
    starter: { label: 'KIVU Starter', color: '#1CB0F6', emoji: '🚀' },
    free:    { label: 'KIVU Free', color: 'var(--text-secondary)', emoji: '🆓' },
  }[user.subscription || 'free'];

  const langs = [...new Set([
    user.preferredLanguage,
    user.motherTongue,
    ...(user.learningLanguages || [])
  ].filter(Boolean))];

  return `
    <!-- Header -->
    <div class="screen-header animate-slide-down">
      <div class="screen-title">Profil</div>
      <button class="icon-btn" data-nav="/settings" aria-label="Paramètres">
        ${icons.settings(20)}
      </button>
    </div>

    <!-- Hero Profile Card -->
    <div class="card profile-hero mb-md animate-scale-in">
      <div class="profile-hero__top">
        <!-- XP Ring -->
        <div class="xp-ring-wrap">
          ${xpRing(xpPct, user.stats?.level || 1)}
        </div>

        <!-- Name / info -->
        <div class="profile-hero__info">
          <div class="profile-avatar-lg" aria-label="${escAttr(user.name)}">
            ${user.avatar || '🧑🏾'}
          </div>
          <div class="font-display font-bold text-xl mt-xs">${user.name || 'Utilisateur'}</div>
          <div class="flex items-center gap-xs text-sm text-muted">
            <span>${user.countryFlag || ''}</span>
            <span>${user.country || 'Afrique'}</span>
          </div>
          <div class="flex gap-xs mt-sm">
            <button class="btn btn-ghost btn-sm" id="edit-profile-btn">
              ${icons.settings(14)} Modifier
            </button>
            <button class="btn btn-ghost btn-sm" id="share-profile-btn">
              ${icons.share(14)} Partager
            </button>
          </div>
        </div>
      </div>

      <!-- XP bar below -->
      <div class="mt-md px-xs">
        <div class="flex justify-between text-xs text-muted mb-xs">
          <span>Niveau ${user.stats?.level || 1} — ${user.stats?.xp?.toLocaleString('fr-FR') || 0} XP</span>
          <span>${xpPct}% → Niv. ${(user.stats?.level || 1) + 1}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill xp-bar-fill"
               style="width:${xpPct}%; background: linear-gradient(90deg,#1CB0F6,#FF9600);
                      transition: width 1s cubic-bezier(.2,.8,.3,1);">
          </div>
        </div>
      </div>

      <!-- Sub plan badge -->
      <div class="flex justify-center mt-md">
        <span class="chip" style="background:${subsLabel.color}1a; color:${subsLabel.color}; font-weight:700;">
          ${subsLabel.emoji} ${subsLabel.label}
        </span>
      </div>
    </div>

    <!-- Quick stats -->
    <div class="grid grid-4 mb-md">
      ${miniStat('🔥', user.stats?.streak || 0, 'Série')}
      ${miniStat('⚡', (user.stats?.xp || 0).toLocaleString('fr-FR'), 'XP')}
      ${miniStat('📚', totalLessons, 'Leçons')}
      ${miniStat('🏅', ALL_BADGES.filter(b => b.cond(state)).length, 'Badges')}
    </div>

    <!-- My Languages -->
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Mes langues</div>
        <button class="icon-btn icon-btn--sm" style="color:var(--kivu-primary);" aria-label="Ajouter">
          ${icons.plus(18)}
        </button>
      </div>
      <div class="flex gap-sm flex-wrap">
        ${langs.map(id => {
          const info = LANG_INFO[id] || { flag: '🌍', name: id, color: 'var(--kivu-primary)' };
          return `
            <div class="lang-chip" style="--lc:${info.color};">
              <span>${info.flag}</span>
              <span class="font-semibold">${info.name}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Streak Calendar -->
    ${renderStreakCalendar()}

    <!-- Language Progress -->
    ${renderLangProgress(user)}

    <!-- Badges -->
    ${renderBadges(state)}

    <!-- Mini Leaderboard -->
    ${renderLeaderboard(user)}

    <!-- Menu -->
    <div class="flex flex-col gap-xs mb-lg">
      ${MENU.map(m => `
        <button class="list-row menu-item" data-nav="${m.path}">
          <span class="menu-icon" style="background:${m.color}1a; color:${m.color};">${m.icon(20)}</span>
          <span style="flex:1">${m.label}</span>
          <span class="text-tertiary">${icons.chevronRight(18)}</span>
        </button>
      `).join('')}
    </div>

    <!-- Edit Profile Modal (hidden until triggered) -->
    <div id="edit-modal-container"></div>
  `;
}

/* ─────────────────────────── Helpers ───────────────────────────── */

function miniStat(emoji, value, label) {
  return `
    <div class="stat-card stat-card--mini">
      <div class="stat-emoji" aria-hidden="true">${emoji}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

/* ─────────────────────────── Mount ─────────────────────────────── */

renderProfile.mount = function () {
  // Edit profile button → open modal
  document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
    const user = store.get('user') || {};
    const container = document.getElementById('edit-modal-container');
    if (!container) return;
    container.innerHTML = renderEditModal(user);

    let selectedAvatar = user.avatar || '🧑🏾';

    // Avatar picker
    container.querySelectorAll('.avatar-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedAvatar = btn.dataset.avatar;
        container.querySelectorAll('.avatar-pick-btn').forEach(b => b.classList.remove('is-selected'));
        btn.classList.add('is-selected');
      });
    });

    // Cancel
    document.getElementById('edit-cancel-btn')?.addEventListener('click', () => {
      container.innerHTML = '';
    });

    // Close on backdrop click
    document.getElementById('edit-profile-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'edit-profile-modal') container.innerHTML = '';
    });

    // Submit
    document.getElementById('edit-profile-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name    = fd.get('name')?.toString().trim() || user.name;
      const country = fd.get('country')?.toString().trim() || user.country;
      const email   = fd.get('email')?.toString().trim() || user.email;

      store.set('user', {
        ...user,
        name,
        country,
        email,
        avatar: selectedAvatar,
      });

      container.innerHTML = '';
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Profil mis à jour ✓', { type: 'success', duration: 2000 });
      }
    });
  });

  // Share profile
  document.getElementById('share-profile-btn')?.addEventListener('click', () => {
    const user = store.get('user') || {};
    const text = `Je suis Niveau ${user.stats?.level || 1} sur KIVU avec ${user.stats?.xp || 0} XP ! 🌍 Rejoins-moi : https://kivu.africa`;
    if (navigator.share) {
      navigator.share({ title: 'Mon profil KIVU', text }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Lien copié !', { type: 'success', duration: 1800 });
        }
      });
    }
  });

  // Animate XP ring arc on mount
  requestAnimationFrame(() => {
    const arc = document.querySelector('.xp-ring-arc');
    if (arc) {
      arc.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.2,.8,.3,1)';
    }
    const bar = document.querySelector('.xp-bar-fill');
    if (bar) {
      bar.style.transition = 'width 1s cubic-bezier(.2,.8,.3,1)';
    }
  });
};
