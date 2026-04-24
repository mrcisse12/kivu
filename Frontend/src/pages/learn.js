import Chart from 'chart.js/auto';
import { store } from '../store.js';

const QUESTS = [
  { title: 'Marché de Dakar', sub: 'Négocie avec un vendeur de fruits', icon: '🥭', xp: 150, progress: 0.33, color: 'var(--kivu-accent)' },
  { title: 'Premier Rendez-vous', sub: 'Fais connaissance avec un ami', icon: '☕', xp: 100, progress: 0.60, color: 'var(--kivu-secondary)' },
  { title: 'Taxi à Abidjan', sub: 'Indique ta destination', icon: '🚕', xp: 120, progress: 0, color: 'var(--kivu-primary)' },
  { title: 'À l\'hôpital', sub: 'Décris tes symptômes', icon: '🏥', xp: 200, progress: 0, color: 'var(--error)' }
];

const SKILLS = [
  { name: 'Salutations', level: 12, max: 15, color: '#174E9C', icon: '👋' },
  { name: 'Nombres', level: 8, max: 15, color: '#2D9E73', icon: '🔢' },
  { name: 'Nourriture', level: 6, max: 15, color: '#F2952D', icon: '🍽️' },
  { name: 'Famille', level: 10, max: 15, color: '#8C40AD', icon: '👨‍👩‍👧' },
  { name: 'Voyage', level: 4, max: 15, color: '#408CE6', icon: '✈️' },
  { name: 'Travail', level: 3, max: 15, color: '#40B3BF', icon: '💼' }
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
    <div class="hero-card grad-savanna mb-md" style="display:flex; gap:20px; align-items:center;">
      <div style="width:100px; position:relative;">
        <canvas id="xp-ring" width="100" height="100"></canvas>
      </div>
      <div>
        <div class="font-bold text-lg">Maître Conversationnel</div>
        <div class="text-sm" style="opacity:0.9">${user.stats.xp.toLocaleString('fr-FR')} / ${user.stats.nextLevelXP.toLocaleString('fr-FR')} XP</div>
        <div class="flex gap-xs mt-md">
          <span class="chip chip-white">🔥 ${user.stats.streak}j</span>
          <span class="chip chip-white">📖 ${user.stats.wordsLearned}</span>
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row" style="padding:4px 0;">
        ${renderTab('quests', 'Quêtes')}
        ${renderTab('skills', 'Compétences')}
        ${renderTab('badges', 'Badges')}
        ${renderTab('leaderboard', 'Classement')}
        ${renderTab('progress', 'Progression')}
      </div>
    </div>

    ${activeTab === 'quests' ? renderQuestsTab() : ''}
    ${activeTab === 'skills' ? renderSkillsTab() : ''}
    ${activeTab === 'badges' ? renderBadgesTab() : ''}
    ${activeTab === 'leaderboard' ? renderLeaderboardTab() : ''}
    ${activeTab === 'progress' ? renderProgressTab() : ''}
  `;
}

function renderTab(id, label) {
  const active = activeTab === id;
  return `
    <button
      style="padding:10px 18px; border-radius:999px; font-weight:600; font-size:13px;
        ${active ? 'background: var(--kivu-accent); color: white;' : 'background: var(--surface); color: var(--text-secondary); box-shadow: var(--shadow-sm);'}"
      data-action="tab-${id}">${label}</button>
  `;
}

function renderQuestsTab() {
  return `
    <div class="flex justify-between items-center mb-sm">
      <h2 class="font-display font-bold text-lg">Quêtes du jour</h2>
      <span class="chip chip-accent">🚩 ${QUESTS.length} actives</span>
    </div>
    <div class="flex flex-col gap-xs">
      ${QUESTS.map(q => `
        <button class="card" style="display:flex; width:100%; text-align:left; gap:12px; align-items:center;">
          <span style="width:58px;height:58px;border-radius:50%;background:${q.color}22;display:flex;align-items:center;justify-content:center;font-size:30px">${q.icon}</span>
          <div style="flex:1">
            <div class="font-bold">${q.title}</div>
            <div class="text-xs text-muted">${q.sub}</div>
            <div class="flex items-center gap-xs mt-xs">
              <div class="progress-bar" style="flex:1; background: rgba(0,0,0,0.08); height:6px;">
                <div class="progress-fill" style="width:${q.progress * 100}%; background:${q.color}"></div>
              </div>
              <span class="text-xs" style="color:${q.color}">+${q.xp} XP</span>
            </div>
          </div>
          <span style="font-size:28px; color:${q.color}">${q.progress > 0 ? '▶️' : '🔓'}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderSkillsTab() {
  return `
    <div class="grid grid-2">
      ${SKILLS.map(s => `
        <div class="card">
          <div class="flex justify-between items-center mb-sm">
            <span style="width:40px;height:40px;border-radius:50%;background:${s.color}22;color:${s.color};display:flex;align-items:center;justify-content:center;font-size:18px">${s.icon}</span>
            <span class="text-xs text-muted">${s.level}/${s.max}</span>
          </div>
          <div class="font-bold mb-xs">${s.name}</div>
          <div class="progress-bar" style="background:rgba(0,0,0,0.08); height:6px;">
            <div class="progress-fill" style="width:${(s.level / s.max) * 100}%; background:${s.color}"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBadgesTab() {
  const badges = [
    { title: 'Première Conversation', icon: '💬', unlocked: true },
    { title: '100 Mots Appris', icon: '📚', unlocked: true },
    { title: 'Série 7 jours', icon: '🔥', unlocked: true },
    { title: 'Polyglotte', icon: '🌍', unlocked: false },
    { title: 'Maître Conteur', icon: '👑', unlocked: false },
    { title: 'Gardien Cultural', icon: '🛡️', unlocked: false }
  ];
  return `
    <div class="grid grid-3">
      ${badges.map(b => `
        <div class="card" style="text-align:center;">
          <div style="
            width:64px;height:64px;margin:0 auto 6px;border-radius:50%;
            background: ${b.unlocked ? 'rgba(242,149,45,0.15)' : 'rgba(0,0,0,0.05)'};
            display:flex;align-items:center;justify-content:center;font-size:32px;
            opacity:${b.unlocked ? 1 : 0.35};
          ">${b.icon}</div>
          <div class="text-xs font-semibold" style="color:${b.unlocked ? 'var(--text-primary)' : 'var(--text-tertiary)'}">${b.title}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLeaderboardTab() {
  const rows = [
    { rank: 1, name: 'Fatou D.', flag: '🇸🇳', xp: 14580, avatar: '👩🏾' },
    { rank: 2, name: 'Kofi A.', flag: '🇬🇭', xp: 13204, avatar: '👨🏿' },
    { rank: 3, name: 'Amina B.', flag: '🇲🇱', xp: 12890, avatar: '👩🏾‍🦱' },
    { rank: 4, name: 'Sekou T.', flag: '🇬🇳', xp: 11500, avatar: '👨🏾' },
    { rank: 42, name: 'Vous', flag: '🇨🇮', xp: 2340, avatar: '🧑🏾', isMe: true }
  ];
  return `
    <div class="flex flex-col gap-xs">
      ${rows.map(r => `
        <div class="list-row" style="${r.isMe ? 'border: 2px solid var(--kivu-primary); background:rgba(23,78,156,0.05);' : ''}">
          <span class="font-bold text-lg" style="width:36px; text-align:center; color:${r.rank <= 3 ? 'var(--kivu-accent)' : 'var(--text-primary)'}">#${r.rank}</span>
          <div class="avatar">${r.avatar}</div>
          <div style="flex:1">
            <div class="font-semibold">${r.name} ${r.flag}</div>
            <div class="text-xs text-muted">${r.xp.toLocaleString('fr-FR')} XP</div>
          </div>
          ${r.rank <= 3 ? '<span style="font-size:24px">🏅</span>' : ''}
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
    <div class="card">
      <div class="font-bold mb-sm">Temps d'apprentissage / jour</div>
      <canvas id="time-chart" height="180"></canvas>
    </div>
  `;
}

renderLearn.mount = () => {
  // Tabs
  ['quests', 'skills', 'badges', 'leaderboard', 'progress'].forEach(id => {
    document.addEventListener(`tab-${id}`, () => {
      activeTab = id;
      document.querySelector('main.screen').innerHTML = renderLearn();
      renderLearn.mount();
    }, { once: true });
  });

  // XP Ring
  const ring = document.getElementById('xp-ring');
  if (ring) {
    const user = store.get('user');
    const progress = user.stats.xp / user.stats.nextLevelXP;
    const ctx = ring.getContext('2d');
    ctx.clearRect(0, 0, 100, 100);
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath(); ctx.arc(50, 50, 42, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'white';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(50, 50, 42, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 28px Nunito';
    ctx.textAlign = 'center';
    ctx.fillText(user.stats.level, 50, 56);
    ctx.font = '10px Inter';
    ctx.fillText('Niv.', 50, 72);
  }

  // Progress charts
  if (activeTab === 'progress') {
    const p = document.getElementById('progress-chart');
    if (p) new Chart(p, {
      type: 'line',
      data: {
        labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
        datasets: [{
          label: 'XP', data: [120, 180, 95, 210, 150, 280, 320],
          borderColor: '#174E9C',
          backgroundColor: 'rgba(23,78,156,0.12)',
          fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
    const t = document.getElementById('time-chart');
    if (t) new Chart(t, {
      type: 'bar',
      data: {
        labels: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
        datasets: [{
          label: 'minutes', data: [12, 25, 8, 32, 22, 45, 38],
          backgroundColor: 'rgba(242,149,45,0.85)',
          borderRadius: 8
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
};
