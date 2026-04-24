import { store } from '../store.js';
import { LANGUAGES } from '../data/languages.js';

export function renderHome() {
  const user = store.get('user');
  const greeting = computeGreeting();
  const endangered = LANGUAGES.filter(l => l.status === 'endangered' || l.status === 'critical');

  const xpPct = (user.stats.xp / user.stats.nextLevelXP * 100).toFixed(0);

  return `
    <div class="screen-header animate-slide-down">
      <div>
        <div class="text-sm text-muted">${greeting} ✨</div>
        <div class="screen-title">${user.name.split(' ')[0]} <span class="text-gradient">•</span></div>
      </div>
      <button class="icon-btn" aria-label="Notifications">
        🔔
        <span style="position:absolute; transform:translate(12px,-12px); width:8px; height:8px; background:var(--error); border-radius:50%; box-shadow:0 0 0 3px var(--bg);"></span>
      </button>
    </div>

    <!-- Hero XP Card avec orbs décoratifs animés -->
    <div class="hero-card grad-hero mb-md animate-scale-in" style="position:relative; overflow:hidden;">
      <span class="orb orb--accent" style="width:160px; height:160px; top:-60px; right:-40px;"></span>
      <span class="orb orb--primary" style="width:120px; height:120px; bottom:-50px; left:-30px; animation-delay:-4s;"></span>

      <div style="position:relative; z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <div class="flex items-center gap-xs">
            <span style="font-size:18px;" class="animate-breathe">🔥</span>
            <span class="text-sm" style="opacity:0.92; font-weight:600;">Série de ${user.stats.streak} jours</span>
          </div>
          <span class="badge-live" style="background:rgba(255,255,255,0.18); color:white;">Live</span>
        </div>

        <div class="flex gap-lg mb-md">
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.xp}">${user.stats.xp.toLocaleString('fr-FR')}</div>
            <div class="text-xs" style="opacity:0.85; letter-spacing:0.5px;">XP</div>
          </div>
          <div>
            <div class="text-2xl font-bold">${user.stats.level}</div>
            <div class="text-xs" style="opacity:0.85; letter-spacing:0.5px;">Niveau</div>
          </div>
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.wordsLearned}">${user.stats.wordsLearned}</div>
            <div class="text-xs" style="opacity:0.85; letter-spacing:0.5px;">Mots</div>
          </div>
        </div>

        <div class="progress-bar mb-xs" style="background:rgba(255,255,255,0.22);">
          <div class="progress-fill" style="width: ${xpPct}%; background:linear-gradient(90deg, #FFB859, #FFFFFF);"></div>
        </div>
        <div class="flex justify-between text-xs" style="opacity:0.92;">
          <span>Niveau ${user.stats.level} — Maître Conversationnel</span>
          <span class="font-bold">${xpPct}%</span>
        </div>
      </div>
    </div>

    <!-- Featured action -->
    <button class="card mb-md" style="display:flex; width:100%; text-align:left; gap:12px; align-items:center;" data-nav="/translate">
      <span style="
        width:60px;height:60px;border-radius:50%;
        background:var(--grad-sunset); color:white;
        display:flex; align-items:center; justify-content:center; font-size:26px;
      ">🎙️</span>
      <div style="flex:1">
        <div class="font-bold text-md">Traduction Vocale</div>
        <div class="text-xs text-muted">Parlez, écoutez, comprenez — instantané</div>
      </div>
      <span class="text-muted">›</span>
    </button>

    <!-- Features Grid -->
    <h2 class="font-display font-bold text-lg mb-sm mt-lg">Nos 8 Révolutions</h2>
    <div class="grid grid-2 mb-lg">
      ${renderFeatureTile('/translate', '🎙️', 'var(--color-translation)', 'Traduction', 'Voix temps réel')}
      ${renderFeatureTile('/learn', '🎓', 'var(--color-learning)', 'Apprentissage', 'Quêtes gamifiées')}
      ${renderFeatureTile('/preserve', '🛡️', 'var(--color-preservation)', 'Préservation', 'Archive éternelle')}
      ${renderFeatureTile('/business', '💼', 'var(--color-business)', 'Business', 'Commerce multilingue')}
      ${renderFeatureTile('/multi-party', '👥', 'var(--color-multiparty)', 'Multi-Party', 'Réunions multilangues')}
      ${renderFeatureTile('/assistant', '✨', 'var(--color-assistant)', 'AI Tutor', 'Assistant personnel')}
      ${renderFeatureTile('/diaspora', '💙', 'var(--color-diaspora)', 'Diaspora', 'Familles connectées')}
      ${renderFeatureTile('/accessibility', '♿', 'var(--color-accessibility)', 'Accessibilité', 'Pour tous, partout')}
    </div>

    <!-- Impact Stats -->
    <h2 class="font-display font-bold text-lg mb-sm">Impact KIVU en temps réel</h2>
    <div class="grid grid-3 mb-lg">
      ${renderImpact('2 047', 'Langues actives', 'var(--kivu-primary)', '🌍')}
      ${renderImpact('127M', 'Personnes connectées', 'var(--kivu-accent)', '👥')}
      ${renderImpact('483', 'Langues sauvées', 'var(--kivu-tertiary)', '🛡️')}
    </div>

    <!-- Daily Challenge -->
    <div class="hero-card grad-sunset mb-lg">
      <div class="flex justify-between items-center mb-sm">
        <span class="chip chip-white">⚡ Défi du jour</span>
        <span class="chip chip-white">+150 XP</span>
      </div>
      <h3 class="text-lg font-bold mb-xs">Apprenez 5 salutations en Swahili</h3>
      <div class="flex justify-between items-center">
        <span class="text-sm" style="opacity:0.9">3 / 5 complétées</span>
        <button class="btn btn-white" data-nav="/learn">Continuer</button>
      </div>
    </div>

    <!-- Endangered Languages -->
    <div class="flex justify-between items-center mb-sm">
      <div>
        <h2 class="font-display font-bold text-lg">Langues à sauver</h2>
        <div class="text-xs text-muted">Chaque voix compte, chaque culture mérite d'exister</div>
      </div>
    </div>

    <div class="scroll-x mb-lg">
      <div class="scroll-x-row">
        ${endangered.map(lang => `
          <div class="card" style="min-width:170px; display:flex; flex-direction:column; gap:8px;">
            <div class="flex justify-between items-center">
              <span style="font-size:36px">${lang.flag}</span>
              <span style="color:var(--error)">⚠️</span>
            </div>
            <div>
              <div class="font-bold">${lang.name}</div>
              <div class="text-xs text-muted">${lang.nativeName}</div>
            </div>
            <div class="text-xs text-muted">👤 ${formatSpeakers(lang.speakers)}</div>
            <button class="btn btn-primary" style="padding:6px 14px; font-size:12px;" data-nav="/preserve">Contribuer</button>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Community -->
    <h2 class="font-display font-bold text-lg mb-sm">Communauté KIVU</h2>
    <div class="flex flex-col gap-xs">
      ${renderCommunityPost('👵🏾', 'Mamie Awa', 'a enregistré 12 proverbes Wolof', 'il y a 3h')}
      ${renderCommunityPost('👨🏾‍🎓', 'Koffi', 'a terminé le niveau 15 en Dioula', 'il y a 5h')}
      ${renderCommunityPost('👩🏾‍⚕️', 'Dr. Amina', 'a aidé 47 patients via KIVU', 'hier')}
    </div>
  `;
}

function renderFeatureTile(path, icon, color, title, desc) {
  return `
    <button class="feature-tile" data-nav="${path}">
      <div class="feature-icon" style="background: ${color}22; color: ${color};">${icon}</div>
      <div class="feature-title">${title}</div>
      <div class="feature-desc">${desc}</div>
    </button>
  `;
}

function renderImpact(value, label, color, icon) {
  return `
    <div class="stat-card">
      <div style="color:${color}; font-size:20px; margin-bottom:4px;">${icon}</div>
      <div class="stat-value">${value}</div>
      <div class="stat-label">${label}</div>
    </div>
  `;
}

function renderCommunityPost(avatar, name, action, time) {
  return `
    <div class="list-row">
      <div class="avatar">${avatar}</div>
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
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/**
 * Appelé par le router après chaque render('/') pour animer les
 * compteurs et autres micro-interactions — optionnel mais beau.
 */
renderHome.mount = function afterHomeRender() {
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
};

function formatSpeakers(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M locuteurs`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}K locuteurs`;
  return `${count} locuteurs`;
}
