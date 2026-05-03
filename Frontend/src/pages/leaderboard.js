/**
 * KIVU — Leaderboard mondial.
 *
 * 4 onglets : Jour · Semaine · Mois · All-time
 * 2 portées : Mondial · Mes amis
 *
 * Sans backend partagé : on simule un classement crédible en mélangeant
 *   - L'utilisateur (XP réel)
 *   - Ses amis (xp réels du store)
 *   - Un pool stable de membres KIVU dans le monde, dont les XP varient
 *     de manière déterministe selon la période (basée sur le hash du nom)
 *
 * Le top 3 reçoit un podium animé avec couronne. L'utilisateur est
 * mis en surbrillance et toujours visible (s'il est hors top, on
 * affiche sa ligne flottante en bas).
 */

import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';
import { store } from '../store.js';
import { getFriends } from '../services/friends.js';
import { onLeavePage } from '../services/page-lifecycle.js';

const PERIODS = [
  { id: 'day',     label: 'Jour',      emoji: '☀️' },
  { id: 'week',    label: 'Semaine',   emoji: '📅' },
  { id: 'month',   label: 'Mois',      emoji: '🗓️' },
  { id: 'all',     label: 'All-time',  emoji: '🏆' }
];

const SCOPES = [
  { id: 'world',   label: 'Mondial',   emoji: '🌍' },
  { id: 'friends', label: 'Mes amis',  emoji: '👥' }
];

// 30 membres KIVU à travers l'Afrique + diaspora avec stats stables
const WORLD_POOL = [
  { id: 'p1',  name: 'Aïcha Diallo',     avatar: '👩🏾', country: '🇬🇳', baseXp: 12480, lang: 'wol' },
  { id: 'p2',  name: 'Koffi Mensah',     avatar: '👨🏾', country: '🇧🇯', baseXp: 10950, lang: 'bam' },
  { id: 'p3',  name: 'Amara Traoré',     avatar: '🧑🏾', country: '🇲🇱', baseXp: 9720,  lang: 'swa' },
  { id: 'p4',  name: 'Fatou Ndiaye',     avatar: '👩🏿', country: '🇸🇳', baseXp: 8410,  lang: 'yor' },
  { id: 'p5',  name: 'Pierre Mendy',     avatar: '🧑🏾', country: '🇬🇼', baseXp: 7200,  lang: 'hau' },
  { id: 'p6',  name: 'Awa Cissé',        avatar: '👩🏿', country: '🇲🇱', baseXp: 6840,  lang: 'swa' },
  { id: 'p7',  name: 'Seun Adebayo',     avatar: '👨🏿', country: '🇳🇬', baseXp: 6520,  lang: 'zul' },
  { id: 'p8',  name: 'Marie Kabongo',    avatar: '👩🏾', country: '🇨🇩', baseXp: 6280,  lang: 'lin' },
  { id: 'p9',  name: 'Dr. Nkosi',        avatar: '👨🏿', country: '🇿🇦', baseXp: 5940,  lang: 'ibo' },
  { id: 'p10', name: 'Mamadou Bah',      avatar: '🧑🏿', country: '🇬🇳', baseXp: 5610,  lang: 'bam' },
  { id: 'p11', name: 'Zara Hassan',      avatar: '👩🏾', country: '🇸🇩', baseXp: 5340,  lang: 'amh' },
  { id: 'p12', name: 'Tendai Moyo',      avatar: '👨🏿', country: '🇿🇼', baseXp: 5120,  lang: 'zul' },
  { id: 'p13', name: 'Kwame Asante',     avatar: '🧑🏾', country: '🇬🇭', baseXp: 4890,  lang: 'yor' },
  { id: 'p14', name: 'Esther Mwangi',    avatar: '👩🏿', country: '🇰🇪', baseXp: 4720,  lang: 'swa' },
  { id: 'p15', name: 'Bachir Ali',       avatar: '👨🏾', country: '🇪🇬', baseXp: 4480,  lang: 'amh' },
  { id: 'p16', name: 'Naima Cherif',     avatar: '👩🏽', country: '🇲🇦', baseXp: 4220,  lang: 'wol' },
  { id: 'p17', name: 'Joseph Kabila',    avatar: '👨🏿', country: '🇨🇩', baseXp: 3980,  lang: 'lin' },
  { id: 'p18', name: 'Adaeze Okonkwo',   avatar: '👩🏿', country: '🇳🇬', baseXp: 3740,  lang: 'ibo' },
  { id: 'p19', name: 'Idrissa Konaté',   avatar: '🧑🏿', country: '🇨🇮', baseXp: 3520,  lang: 'dyu' },
  { id: 'p20', name: 'Sophie Mballa',    avatar: '👩🏾', country: '🇨🇲', baseXp: 3290,  lang: 'fra' },
  { id: 'p21', name: 'Lucas Da Silva',   avatar: '👨🏼', country: '🇧🇷', baseXp: 3050,  lang: 'wol' },
  { id: 'p22', name: 'Chioma Eze',       avatar: '👩🏿', country: '🇳🇬', baseXp: 2820,  lang: 'ibo' },
  { id: 'p23', name: 'Babacar Faye',     avatar: '👨🏾', country: '🇸🇳', baseXp: 2640,  lang: 'wol' },
  { id: 'p24', name: 'Maya Johnson',     avatar: '👩🏾', country: '🇺🇸', baseXp: 2410,  lang: 'swa' },
  { id: 'p25', name: 'Issouf Sawadogo',  avatar: '🧑🏿', country: '🇧🇫', baseXp: 2180,  lang: 'bam' },
  { id: 'p26', name: 'Alima Berté',      avatar: '👩🏾', country: '🇲🇱', baseXp: 1960,  lang: 'bam' },
  { id: 'p27', name: 'Théo Razafindra',  avatar: '👨🏾', country: '🇲🇬', baseXp: 1740,  lang: 'fra' },
  { id: 'p28', name: 'Halima Yusuf',     avatar: '👩🏿', country: '🇳🇬', baseXp: 1520,  lang: 'hau' },
  { id: 'p29', name: 'Ousmane Diabaté',  avatar: '🧑🏾', country: '🇲🇱', baseXp: 1320,  lang: 'bam' },
  { id: 'p30', name: 'Lila Ben Salah',   avatar: '👩🏽', country: '🇹🇳', baseXp: 1140,  lang: 'wol' }
];

let activePeriod = 'week';
let activeScope = 'world';
let lifecycleRegistered = false;

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) + s.charCodeAt(i);
  return Math.abs(h);
}

/** Compute XP for a member during a given period.
 *  Pool members get a deterministic but varied amount.
 *  The user gets their REAL xp (with derived day/week/month splits).
 */
function periodXp(member, period, isUser = false, realStats = null) {
  if (isUser && realStats) {
    const totalXp = realStats.xp || 0;
    const completed = realStats.completed || [];
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    const xpPerLesson = (c) => Math.max(15, (c.score || 0) * 12 + (c.perfect ? 5 : 0));
    if (period === 'all') return totalXp;
    if (period === 'day') {
      return completed.filter(c => (c.date || '').slice(0, 10) === today).reduce((s, c) => s + xpPerLesson(c), 0);
    }
    if (period === 'week') {
      return completed.filter(c => (c.date || '') >= sevenDaysAgo).reduce((s, c) => s + xpPerLesson(c), 0);
    }
    if (period === 'month') {
      return completed.filter(c => (c.date || '') >= thirtyDaysAgo).reduce((s, c) => s + xpPerLesson(c), 0);
    }
  }
  // Pool: derive period XP from baseXp using stable hash
  const base = member.baseXp || 1000;
  const h = hashStr((member.id || member.name) + period);
  // Day = 0.5–4% of base, Week = 6–18%, Month = 25–55%, All = 100%
  const ratios = { day: 0.005 + (h % 100) / 2500, week: 0.06 + (h % 200) / 1666, month: 0.25 + (h % 300) / 1000, all: 1 };
  return Math.round(base * (ratios[period] || 1));
}

function getEntries() {
  const user = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const realStats = { xp: user.stats?.xp || 0, completed: lessons.completed || [] };

  const me = {
    id: 'me',
    name: (user.name || '').split(' ')[0] + ' (vous)',
    avatar: user.avatar || '🧑🏾',
    country: user.countryFlag || '🌍',
    baseXp: user.stats?.xp || 0,
    isMe: true,
    online: true
  };
  me.xp = periodXp(me, activePeriod, true, realStats);

  let entries = [];
  if (activeScope === 'world') {
    entries = WORLD_POOL.map(p => ({ ...p, xp: periodXp(p, activePeriod) }));
  } else {
    // Friends scope: use real friends as pool
    const friends = getFriends();
    entries = friends.map(f => ({
      id: f.id,
      name: f.name,
      avatar: f.avatar,
      country: f.countryFlag || '🌍',
      online: f.online,
      baseXp: f.xp || 0,
      xp: periodXp({ id: f.id, baseXp: f.xp || 0 }, activePeriod)
    }));
  }

  entries.push(me);
  // Sort by xp desc — ties broken by name
  entries.sort((a, b) => b.xp - a.xp || (a.name || '').localeCompare(b.name || ''));
  // Assign rank
  entries.forEach((e, i) => { e.rank = i + 1; });
  return entries;
}

/* ─── Render ───────────────────────────────────────────── */

export function renderLeaderboard() {
  const entries = getEntries();
  const meIndex = entries.findIndex(e => e.isMe);
  const myEntry = meIndex >= 0 ? entries[meIndex] : null;
  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3, 50);
  const myInRest = myEntry && meIndex >= 3 && meIndex < 50;

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(255,150,0,0.15); color:var(--kivu-accent);">
          ${icons.trophy(28)}
        </span>
        <div>
          <div class="screen-title">Classement</div>
          <div class="screen-subtitle">Compare-toi à la communauté KIVU</div>
        </div>
      </div>
    </div>

    <!-- Scope (world / friends) -->
    <div class="seg-tabs lb-scope mb-md" role="tablist">
      ${SCOPES.map(s => `
        <button class="seg-tab ${activeScope === s.id ? 'active' : ''}"
                data-action="lb-scope" data-scope="${s.id}">
          ${s.emoji} ${s.label}
        </button>
      `).join('')}
    </div>

    <!-- Period (day/week/month/all) -->
    <div class="lb-period mb-md">
      ${PERIODS.map(p => `
        <button class="lb-period-btn ${activePeriod === p.id ? 'is-active' : ''}"
                data-action="lb-period" data-period="${p.id}">
          <span class="lb-period-btn__emoji" aria-hidden="true">${p.emoji}</span>
          <span class="lb-period-btn__label">${p.label}</span>
        </button>
      `).join('')}
    </div>

    ${entries.length === 0 ? renderEmpty() : `
      <!-- Podium top 3 -->
      ${renderPodium(top3)}

      <!-- Rest of leaderboard -->
      <div class="lb-list mb-md">
        ${rest.length === 0 ? `
          <div class="text-xs text-muted" style="text-align:center; padding: 16px;">Pas d'autres participants pour cette période.</div>
        ` : rest.map(e => renderRow(e)).join('')}
      </div>

      <!-- Floating "you" row if outside top 50 -->
      ${myEntry && !myInRest && meIndex >= 3 ? `
        <div class="lb-me-floating">
          <div class="lb-me-floating__inner">
            ${renderRow({ ...myEntry, rank: meIndex + 1 })}
          </div>
        </div>
      ` : ''}

      <!-- Stats footer -->
      <div class="lb-footer">
        <div class="text-xs text-muted">
          📊 ${entries.length} participants${activeScope === 'world' ? ' dans le monde' : ' dans tes amis'}
          ${myEntry ? ` · Tu es <strong>#${meIndex + 1}</strong>` : ''}
        </div>
      </div>
    `}
  `;
}

function renderEmpty() {
  return `
    <div class="empty-state mb-lg">
      <div class="empty-state__emoji">${activeScope === 'friends' ? '👥' : '🏆'}</div>
      <div class="empty-state__title">${activeScope === 'friends' ? 'Pas encore d\'amis' : 'Aucun participant'}</div>
      <div class="text-sm text-muted mb-md">
        ${activeScope === 'friends'
          ? 'Ajoute des amis dans l\'onglet Amis pour voir un classement entre vous.'
          : 'Aucune activité enregistrée pour cette période.'}
      </div>
      ${activeScope === 'friends' ? '<button class="btn btn-primary" data-nav="/friends">Ajouter des amis</button>' : ''}
    </div>
  `;
}

function renderPodium(top3) {
  // Order on screen: 2nd | 1st | 3rd
  const order = [top3[1], top3[0], top3[2]].filter(Boolean);
  const positions = { 0: 'silver', 1: 'gold', 2: 'bronze' };
  return `
    <div class="lb-podium mb-md">
      ${order.map((e, i) => {
        const realRank = e === top3[0] ? 1 : e === top3[1] ? 2 : 3;
        const medal = realRank === 1 ? '🥇' : realRank === 2 ? '🥈' : '🥉';
        return `
          <div class="lb-podium__col lb-podium__col--${positions[i]} ${e.isMe ? 'is-me' : ''}">
            ${realRank === 1 ? '<div class="lb-podium__crown" aria-hidden="true">👑</div>' : ''}
            <div class="lb-podium__avatar" aria-hidden="true">${e.avatar}</div>
            <div class="lb-podium__name">${escapeHtml(e.name)} ${e.country || ''}</div>
            <div class="lb-podium__xp">${(e.xp || 0).toLocaleString('fr-FR')} XP</div>
            <div class="lb-podium__step">
              <span class="lb-podium__rank">${medal}</span>
              <span class="lb-podium__pos">#${realRank}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRow(e) {
  return `
    <div class="lb-row ${e.isMe ? 'is-me' : ''}">
      <div class="lb-row__rank ${e.rank <= 10 ? 'is-top' : ''}">${e.rank}</div>
      <div class="lb-row__avatar">
        <span aria-hidden="true">${e.avatar}</span>
        ${e.online ? '<span class="friend-online-dot"></span>' : ''}
      </div>
      <div class="lb-row__body">
        <div class="font-semibold">${escapeHtml(e.name)} ${e.country || ''}</div>
      </div>
      <div class="lb-row__xp">
        <div class="font-bold" style="color: var(--kivu-accent);">${(e.xp || 0).toLocaleString('fr-FR')}</div>
        <div class="text-xs text-muted">XP</div>
      </div>
    </div>
  `;
}

/* ─── Mount ───────────────────────────────────────────── */

renderLeaderboard.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  if (!lifecycleRegistered) {
    lifecycleRegistered = true;
    onLeavePage('/leaderboard', () => {
      activePeriod = 'week';
      activeScope = 'world';
    });
  }

  const rerender = () => {
    main.innerHTML = renderLeaderboard();
    renderLeaderboard.mount();
  };

  document.querySelectorAll('[data-action="lb-scope"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeScope = btn.dataset.scope;
      fx.click();
      rerender();
    })
  );

  document.querySelectorAll('[data-action="lb-period"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activePeriod = btn.dataset.period;
      fx.click();
      rerender();
    })
  );
};
