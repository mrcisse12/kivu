/**
 * KIVU — Page Stats personnelles détaillées.
 *
 * 4 onglets :
 *   • Vue d'ensemble  — résumé hebdo
 *   • Progression     — graphes XP/leçons/temps (7j, 30j, 1 an)
 *   • Récompenses     — badges débloqués + timeline
 *   • Voyage          — heatmap calendrier + jalons
 */

import Chart from 'chart.js/auto';
import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';

const PERIODS = [
  { id: '7d',  label: '7 jours',  days: 7   },
  { id: '30d', label: '30 jours', days: 30  },
  { id: '1y',  label: '1 an',     days: 365 }
];

let activeTab = 'overview';
let activePeriod = '7d';
let charts = []; // Chart.js instances to destroy on rerender

const ALL_BADGES = [
  { id: 'first_lesson',   icon: '🎓', label: 'Premier pas',    desc: 'Complétez votre 1ère leçon',         cond: s => (s.lessons?.completed?.length || 0) >= 1 },
  { id: 'streak_3',       icon: '🔥', label: 'Flamme',         desc: '3 jours de suite',                    cond: s => (s.user?.stats?.streak || 0) >= 3 },
  { id: 'streak_7',       icon: '🔥', label: 'Feu sacré',      desc: '7 jours de suite',                    cond: s => (s.user?.stats?.streak || 0) >= 7 },
  { id: 'streak_30',      icon: '🌟', label: 'Incandescent',   desc: '30 jours de suite',                   cond: s => (s.user?.stats?.streak || 0) >= 30 },
  { id: 'xp_500',         icon: '⚡', label: 'Étincelle',      desc: '500 XP',                              cond: s => (s.user?.stats?.xp || 0) >= 500 },
  { id: 'xp_5000',        icon: '⚡', label: 'Énergie',        desc: '5 000 XP',                            cond: s => (s.user?.stats?.xp || 0) >= 5000 },
  { id: 'perfect_lesson', icon: '💎', label: 'Perfection',     desc: 'Leçon sans faute',                    cond: s => (s.lessons?.completed || []).some(c => c.perfect) },
  { id: 'lessons_10',     icon: '📚', label: 'Studieux',       desc: '10 leçons finies',                    cond: s => (s.lessons?.completed?.length || 0) >= 10 },
  { id: 'lessons_30',     icon: '🏆', label: 'Champion',       desc: '30 leçons finies',                    cond: s => (s.lessons?.completed?.length || 0) >= 30 },
  { id: 'story_1',        icon: '📖', label: 'Conteur',        desc: '1ère histoire lue',                   cond: s => (s.stories?.completed?.length || 0) >= 1 },
  { id: 'words_50',       icon: '💬', label: 'Vocabulaire',    desc: '50 mots appris',                      cond: s => (s.user?.stats?.wordsLearned || 0) >= 50 },
  { id: 'translator',     icon: '🗣️', label: 'Traducteur',     desc: '1ère traduction',                     cond: s => (s.user?.stats?.translationsCount || 0) >= 1 },
  { id: 'contributor',    icon: '🛡️', label: 'Gardien',        desc: '1ère contribution',                   cond: s => (s.user?.stats?.contributionsCount || 0) >= 1 },
  { id: 'level_5',        icon: '🚀', label: 'Lancé',          desc: 'Niveau 5',                            cond: s => (s.user?.stats?.level || 1) >= 5 },
  { id: 'level_10',       icon: '🌍', label: 'Africain',       desc: 'Niveau 10',                           cond: s => (s.user?.stats?.level || 1) >= 10 },
  { id: 'early_bird',     icon: '🦅', label: 'Pionnier',       desc: 'Membre fondateur',                    cond: _s => true }
];

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function isoDate(d) { return d.toISOString().slice(0, 10); }

function lastNDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

function destroyCharts() {
  charts.forEach(c => { try { c.destroy(); } catch {} });
  charts = [];
}

/* ─── Aggregations ──────────────────────────────────────── */

function getDailyXp(days) {
  const completed = (store.get('lessons')?.completed || []);
  return days.map(d => {
    const dayItems = completed.filter(c => (c.date || '').slice(0, 10) === d);
    return dayItems.reduce((s, c) => s + (c.score || 0) * 12 + (c.perfect ? 5 : 0), 0);
  });
}

function getDailyLessons(days) {
  const completed = (store.get('lessons')?.completed || []);
  return days.map(d => completed.filter(c => (c.date || '').slice(0, 10) === d).length);
}

function getDailyMinutes(days) {
  const completed = (store.get('lessons')?.completed || []);
  return days.map(d => completed.filter(c => (c.date || '').slice(0, 10) === d).length * 5);
}

function getStreakDates() {
  const completed = (store.get('lessons')?.completed || []);
  const set = new Set();
  completed.forEach(c => { if (c.date) set.add(c.date.slice(0, 10)); });
  return set;
}

function computeStats() {
  const user = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const tr = store.get('translation') || {};
  const stories = store.get('stories') || {};
  const friends = store.get('friends') || {};
  const dictionary = store.get('dictionary') || {};

  const completed = lessons.completed || [];
  const today = isoDate(new Date());
  const last7 = lastNDays(7);
  const last30 = lastNDays(30);

  const todayXp = getDailyXp([today]).reduce((a,b) => a+b, 0);
  const week7Xp = getDailyXp(last7).reduce((a,b) => a+b, 0);
  const month30Xp = getDailyXp(last30).reduce((a,b) => a+b, 0);

  // Average per active day this month
  const activeDays30 = last30.filter(d =>
    completed.some(c => (c.date || '').slice(0, 10) === d)
  ).length;
  const avgPerActiveDay = activeDays30 > 0 ? Math.round(month30Xp / activeDays30) : 0;

  // Best streak ever (computed from completed dates)
  const dates = [...new Set(completed.map(c => (c.date || '').slice(0, 10)))].filter(Boolean).sort();
  let bestStreak = 0; let cur = 0; let prev = null;
  dates.forEach(d => {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86_400_000;
      if (diff === 1) cur++; else cur = 1;
    } else cur = 1;
    bestStreak = Math.max(bestStreak, cur);
    prev = d;
  });

  return {
    user, lessons, completed,
    todayXp, week7Xp, month30Xp, avgPerActiveDay,
    bestStreak,
    perfectCount: completed.filter(c => c.perfect).length,
    storiesCount: (stories.completed || []).length,
    translationsCount: user.stats?.translationsCount || 0,
    favoriteWords: (dictionary.favorites || []).length,
    contributionsCount: user.stats?.contributionsCount || 0,
    friendsCount: (friends.list || []).length,
    activeDaysMonth: activeDays30
  };
}

/* ─── Render ───────────────────────────────────────────── */

export function renderStats() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(28,176,246,0.15); color:var(--kivu-primary);">
          ${icons.signal(28)}
        </span>
        <div>
          <div class="screen-title">Mes statistiques</div>
          <div class="screen-subtitle">Visualise ton parcours d'apprentissage</div>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="stats-tabs mb-md">
      ${renderTab('overview', 'Vue d\'ensemble', '📊')}
      ${renderTab('progress', 'Progression',     '📈')}
      ${renderTab('rewards',  'Récompenses',     '🏆')}
      ${renderTab('journey',  'Parcours',        '🗺️')}
    </div>

    ${activeTab === 'overview' ? renderOverview() : ''}
    ${activeTab === 'progress' ? renderProgress() : ''}
    ${activeTab === 'rewards'  ? renderRewards()  : ''}
    ${activeTab === 'journey'  ? renderJourney()  : ''}
  `;
}

function renderTab(id, label, emoji) {
  const active = activeTab === id;
  return `
    <button class="stats-tab ${active ? 'is-active' : ''}" data-action="stats-tab" data-tab="${id}">
      <span class="stats-tab__emoji">${emoji}</span>
      <span class="stats-tab__label">${label}</span>
    </button>
  `;
}

/* ─── Tab: Overview ────────────────────────────────────── */

function renderOverview() {
  const s = computeStats();
  const user = s.user;
  const stats = user.stats || {};
  const xpPct = Math.round(Math.min(100, (stats.xp / (stats.nextLevelXP || 500)) * 100));
  const firstName = (user.name || 'Toi').split(' ')[0];

  return `
    <!-- Hero summary -->
    <div class="stats-hero card mb-md">
      <div class="stats-hero__greeting">
        <span class="stats-hero__avatar">${user.avatar || '🧑🏾'}</span>
        <div>
          <div class="text-sm" style="opacity:0.85;">Bonjour ${escapeHtml(firstName)}</div>
          <div class="font-display font-bold text-xl">${stats.xp?.toLocaleString('fr-FR') || 0} XP</div>
        </div>
      </div>
      <div class="stats-hero__bar">
        <div class="stats-hero__bar-fill" style="width:${xpPct}%;"></div>
      </div>
      <div class="text-xs" style="opacity:0.85;">Niveau ${stats.level || 1} → ${stats.nextLevelXP?.toLocaleString('fr-FR') || 500} XP pour le suivant</div>
    </div>

    <!-- Quick stats grid (this week vs all-time) -->
    <div class="stats-grid mb-md">
      ${kpiCard('🔥', stats.streak || 0, 'Série actuelle', s.bestStreak ? `Record : ${s.bestStreak} j` : null)}
      ${kpiCard('⚡', s.week7Xp.toLocaleString('fr-FR'), 'XP cette semaine', `${s.todayXp} aujourd'hui`)}
      ${kpiCard('📚', s.completed.length, 'Leçons finies', `${s.perfectCount} parfaites 💎`)}
      ${kpiCard('📖', s.storiesCount, 'Histoires lues', null)}
      ${kpiCard('🗣️', s.translationsCount, 'Traductions', null)}
      ${kpiCard('🫂', s.friendsCount, 'Amis KIVU', null)}
    </div>

    <!-- This week mini chart -->
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Activité de la semaine</div>
        <span class="chip chip-primary">${s.week7Xp} XP</span>
      </div>
      <div class="chart-wrap" style="height:160px;">
        <canvas id="overview-week-chart"></canvas>
      </div>
    </div>

    <!-- Personal records -->
    <div class="card mb-md">
      <div class="font-bold mb-sm">📌 Tes records personnels</div>
      <div class="record-list">
        ${recordRow('🔥 Plus longue série',  `${s.bestStreak} jour${s.bestStreak > 1 ? 's' : ''}`)}
        ${recordRow('⚡ Meilleur jour XP',   `${Math.max(...getDailyXp(lastNDays(365)), 0)} XP`)}
        ${recordRow('💎 Leçons parfaites',   `${s.perfectCount}`)}
        ${recordRow('📊 Moy. jour actif',    `${s.avgPerActiveDay} XP`)}
        ${recordRow('🌟 Jours actifs (30j)', `${s.activeDaysMonth} / 30`)}
      </div>
    </div>
  `;
}

function kpiCard(emoji, value, label, sub) {
  return `
    <div class="kpi-card">
      <div class="kpi-card__emoji">${emoji}</div>
      <div class="kpi-card__value">${value}</div>
      <div class="kpi-card__label">${label}</div>
      ${sub ? `<div class="kpi-card__sub">${sub}</div>` : ''}
    </div>
  `;
}

function recordRow(label, value) {
  return `
    <div class="record-row">
      <span class="record-row__label">${label}</span>
      <span class="record-row__value">${value}</span>
    </div>
  `;
}

/* ─── Tab: Progress (charts) ──────────────────────────── */

function renderProgress() {
  return `
    <div class="seg-tabs mb-md" style="width:100%; display:grid; grid-template-columns:repeat(3,1fr);">
      ${PERIODS.map(p => `
        <button class="seg-tab ${activePeriod === p.id ? 'active' : ''}" data-action="stats-period" data-period="${p.id}" style="text-align:center;">
          ${p.label}
        </button>
      `).join('')}
    </div>

    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">XP gagnés</div>
        <span class="chip chip-accent" id="xp-period-total">—</span>
      </div>
      <div class="chart-wrap" style="height:200px;">
        <canvas id="xp-period-chart"></canvas>
      </div>
    </div>

    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Leçons complétées</div>
        <span class="chip chip-primary" id="lessons-period-total">—</span>
      </div>
      <div class="chart-wrap" style="height:200px;">
        <canvas id="lessons-period-chart"></canvas>
      </div>
    </div>

    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Temps d'apprentissage</div>
        <span class="chip chip-success" id="minutes-period-total">—</span>
      </div>
      <div class="chart-wrap" style="height:200px;">
        <canvas id="minutes-period-chart"></canvas>
      </div>
    </div>
  `;
}

/* ─── Tab: Rewards ─────────────────────────────────────── */

function renderRewards() {
  const state = store.get();
  const earned = ALL_BADGES.filter(b => b.cond(state));
  const locked = ALL_BADGES.filter(b => !b.cond(state));
  const pct = Math.round((earned.length / ALL_BADGES.length) * 100);

  return `
    <div class="card mb-md rewards-hero">
      <div class="rewards-hero__icon">🏆</div>
      <div style="flex:1;">
        <div class="font-display font-bold text-lg">Badges débloqués</div>
        <div class="text-xs" style="opacity:0.92;">${earned.length} / ${ALL_BADGES.length} (${pct}%)</div>
        <div class="rewards-hero__bar">
          <div class="rewards-hero__bar-fill" style="width:${pct}%;"></div>
        </div>
      </div>
    </div>

    ${earned.length > 0 ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase;">Débloqués</div>
      <div class="badges-grid mb-md">
        ${earned.map(b => `
          <div class="badge-cell badge-cell--earned" title="${escapeHtml(b.label)}: ${escapeHtml(b.desc)}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-label">${escapeHtml(b.label)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${locked.length > 0 ? `
      <div class="text-xs text-muted mb-sm" style="padding:0 4px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase;">À débloquer</div>
      <div class="badges-grid mb-lg">
        ${locked.map(b => `
          <div class="badge-cell badge-cell--locked" title="${escapeHtml(b.desc)}">
            <div class="badge-icon">🔒</div>
            <div class="badge-label">${escapeHtml(b.label)}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

/* ─── Tab: Journey (heatmap calendar + milestones) ─────── */

function renderJourney() {
  const completed = store.get('lessons')?.completed || [];
  const dateSet = getStreakDates();
  // Build a 12-week grid (84 days)
  const days = lastNDays(84);
  const dayCounts = days.map(d => completed.filter(c => (c.date || '').slice(0, 10) === d).length);
  const maxCount = Math.max(1, ...dayCounts);

  // Group into weeks (7 days each)
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).map((d, idx) => ({
      date: d,
      count: dayCounts[i + idx]
    })));
  }

  // Milestones from completed lessons
  const milestones = [];
  if (completed.length >= 1) milestones.push({ icon: '🎓', label: 'Première leçon complétée', date: completed[0]?.date });
  const stats = store.get('user')?.stats || {};
  if (stats.streak >= 7)  milestones.push({ icon: '🔥', label: '7 jours consécutifs', date: 'En cours' });
  if (stats.xp >= 1000)   milestones.push({ icon: '⚡', label: '1 000 XP atteint', date: '—' });
  if (stats.level >= 5)   milestones.push({ icon: '🚀', label: 'Niveau 5', date: '—' });
  if (completed.some(c => c.perfect)) milestones.push({ icon: '💎', label: 'Première leçon parfaite', date: '—' });
  const stories = store.get('stories')?.completed?.length || 0;
  if (stories >= 1)       milestones.push({ icon: '📖', label: 'Première histoire lue', date: '—' });

  return `
    <div class="card mb-md">
      <div class="section-head mb-sm">
        <div class="font-bold">Heatmap d'activité</div>
        <span class="text-xs text-muted">12 semaines</span>
      </div>
      <div class="heatmap" role="grid" aria-label="Activité des 84 derniers jours">
        ${weeks.map(week => `
          <div class="heatmap__week">
            ${week.map(day => {
              const intensity = day.count / maxCount;
              const cls = intensity === 0 ? 'heatmap__cell--empty' :
                          intensity < 0.34 ? 'heatmap__cell--low' :
                          intensity < 0.67 ? 'heatmap__cell--mid' : 'heatmap__cell--high';
              return `<div class="heatmap__cell ${cls}" title="${day.date} · ${day.count} leçon${day.count > 1 ? 's' : ''}"></div>`;
            }).join('')}
          </div>
        `).join('')}
      </div>
      <div class="heatmap__legend">
        <span class="text-xs text-muted">Moins</span>
        <div class="heatmap__cell heatmap__cell--empty"></div>
        <div class="heatmap__cell heatmap__cell--low"></div>
        <div class="heatmap__cell heatmap__cell--mid"></div>
        <div class="heatmap__cell heatmap__cell--high"></div>
        <span class="text-xs text-muted">Plus</span>
      </div>
    </div>

    <div class="card mb-md">
      <div class="font-bold mb-sm">🗺️ Tes jalons</div>
      ${milestones.length === 0 ? `
        <div class="text-sm text-muted" style="text-align:center; padding:20px 0;">
          Tu n'as pas encore de jalons. Termine ta première leçon pour commencer !
        </div>
      ` : `
        <div class="milestone-list">
          ${milestones.map(m => `
            <div class="milestone-row">
              <span class="milestone-row__icon">${m.icon}</span>
              <div style="flex:1;">
                <div class="font-semibold">${escapeHtml(m.label)}</div>
                <div class="text-xs text-muted">${m.date ? new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

/* ─── Mount + Charts ───────────────────────────────────── */

renderStats.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  destroyCharts();

  const rerender = () => {
    destroyCharts();
    main.innerHTML = renderStats();
    renderStats.mount();
  };

  // Tabs
  document.querySelectorAll('[data-action="stats-tab"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      fx.click();
      rerender();
    })
  );

  // Period switch (progress tab)
  document.querySelectorAll('[data-action="stats-period"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activePeriod = btn.dataset.period;
      fx.click();
      rerender();
    })
  );

  // Render charts based on active tab
  if (activeTab === 'overview') {
    setTimeout(() => mountOverviewChart(), 50);
  } else if (activeTab === 'progress') {
    setTimeout(() => mountProgressCharts(), 50);
  }
};

function mountOverviewChart() {
  const ctx = document.getElementById('overview-week-chart');
  if (!ctx) return;
  const days = lastNDays(7);
  const xpData = getDailyXp(days);
  const labels = days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase() + new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(1, 3));

  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data: xpData,
        backgroundColor: getCss('--kivu-accent', '#F2952D'),
        borderRadius: 6,
        barPercentage: 0.7
      }]
    },
    options: chartOptions(true)
  });
  charts.push(chart);
}

function mountProgressCharts() {
  const period = PERIODS.find(p => p.id === activePeriod) || PERIODS[0];
  const days = lastNDays(period.days);

  // Smaller label resolution for longer periods
  let labels;
  if (period.days <= 7) {
    labels = days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3));
  } else if (period.days <= 30) {
    labels = days.map(d => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit' }));
  } else {
    // Group by month for 1y view
    const byMonth = {};
    const xpDaily = getDailyXp(days);
    const lessonsDaily = getDailyLessons(days);
    const minutesDaily = getDailyMinutes(days);
    days.forEach((d, i) => {
      const m = d.slice(0, 7); // YYYY-MM
      if (!byMonth[m]) byMonth[m] = { xp: 0, lessons: 0, minutes: 0, label: new Date(d).toLocaleDateString('fr-FR', { month: 'short' }) };
      byMonth[m].xp += xpDaily[i];
      byMonth[m].lessons += lessonsDaily[i];
      byMonth[m].minutes += minutesDaily[i];
    });
    const monthKeys = Object.keys(byMonth).sort();
    labels = monthKeys.map(k => byMonth[k].label);
    const xpData = monthKeys.map(k => byMonth[k].xp);
    const lessonsData = monthKeys.map(k => byMonth[k].lessons);
    const minutesData = monthKeys.map(k => byMonth[k].minutes);
    drawChart('xp-period-chart', labels, xpData, getCss('--kivu-accent', '#F2952D'));
    drawChart('lessons-period-chart', labels, lessonsData, getCss('--kivu-primary', '#174E9C'));
    drawChart('minutes-period-chart', labels, minutesData, getCss('--success', '#2D9E73'));
    setEl('xp-period-total', xpData.reduce((a,b)=>a+b,0).toLocaleString('fr-FR') + ' XP');
    setEl('lessons-period-total', lessonsData.reduce((a,b)=>a+b,0) + ' leçons');
    setEl('minutes-period-total', minutesData.reduce((a,b)=>a+b,0) + ' min');
    return;
  }

  const xpData = getDailyXp(days);
  const lessonsData = getDailyLessons(days);
  const minutesData = getDailyMinutes(days);

  drawChart('xp-period-chart', labels, xpData, getCss('--kivu-accent', '#F2952D'));
  drawChart('lessons-period-chart', labels, lessonsData, getCss('--kivu-primary', '#174E9C'));
  drawChart('minutes-period-chart', labels, minutesData, getCss('--success', '#2D9E73'));

  setEl('xp-period-total', xpData.reduce((a,b)=>a+b,0).toLocaleString('fr-FR') + ' XP');
  setEl('lessons-period-total', lessonsData.reduce((a,b)=>a+b,0) + ' leçons');
  setEl('minutes-period-total', minutesData.reduce((a,b)=>a+b,0) + ' min');
}

function drawChart(canvasId, labels, data, color) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return;
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: color,
        borderRadius: 6,
        barPercentage: 0.7
      }]
    },
    options: chartOptions(false)
  });
  charts.push(chart);
}

function chartOptions(simple = false) {
  const textColor = getCss('--text-secondary', '#666E85');
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(20, 32, 58, 0.92)',
        padding: 8,
        cornerRadius: 8,
        titleFont: { weight: 700 },
        bodyFont: { weight: 600 }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { size: 11 } }
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0,0,0,0.06)', drawBorder: false },
        ticks: { color: textColor, font: { size: 11 }, maxTicksLimit: 5 }
      }
    },
    animation: { duration: simple ? 600 : 800 }
  };
}

function getCss(varName, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v || fallback;
  } catch { return fallback; }
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
