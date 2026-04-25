import Chart from 'chart.js/auto';
import { store } from '../store.js';
import { icons } from '../components/icons.js';

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
  { id: 'quests',      label: 'Quêtes' },
  { id: 'skills',      label: 'Compétences' },
  { id: 'badges',      label: 'Badges' },
  { id: 'leaderboard', label: 'Classement' },
  { id: 'progress',    label: 'Progression' }
];

let activeTab = 'quests';

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

    ${activeTab === 'quests'      ? renderQuestsTab()      : ''}
    ${activeTab === 'skills'      ? renderSkillsTab()      : ''}
    ${activeTab === 'badges'      ? renderBadgesTab()      : ''}
    ${activeTab === 'leaderboard' ? renderLeaderboardTab() : ''}
    ${activeTab === 'progress'    ? renderProgressTab()    : ''}
  `;
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

  // Tabs (event delegation propre)
  TABS.forEach(t => {
    document.querySelectorAll(`[data-action="tab-${t.id}"]`).forEach(el =>
      el.addEventListener('click', () => {
        if (activeTab === t.id) return;
        activeTab = t.id;
        main.innerHTML = renderLearn();
        renderLearn.mount();
      })
    );
  });

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
