import { store } from '../store.js';
import { LANGUAGES } from '../data/languages.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';

// Tuiles fonctionnalités — emojis catégorie autorisés (gamification visuelle)
// MAIS l'icône principale dans la nav reste SVG pour le côté premium.
const FEATURES = [
  { path: '/translate',     emoji: '🗣️', color: 'var(--color-translation)',  title: 'Traduction',    desc: 'Voix temps réel' },
  { path: '/learn',         emoji: '🎓', color: 'var(--color-learning)',     title: 'Apprentissage', desc: 'Quêtes gamifiées' },
  { path: '/preserve',      emoji: '🛡️', color: 'var(--color-preservation)', title: 'Préservation',  desc: 'Archive éternelle' },
  { path: '/business',      emoji: '💼', color: 'var(--color-business)',     title: 'Business',      desc: 'Commerce multilingue' },
  { path: '/multi-party',   emoji: '🤝', color: 'var(--color-multiparty)',   title: 'Multi-Party',   desc: 'Réunions multilangues' },
  { path: '/assistant',     emoji: '✨', color: 'var(--color-assistant)',    title: 'AI Tutor',      desc: 'Assistant personnel' },
  { path: '/diaspora',      emoji: '💙', color: 'var(--color-diaspora)',     title: 'Diaspora',      desc: 'Familles connectées' },
  { path: '/accessibility', emoji: '♿', color: 'var(--color-accessibility)', title: 'Accessibilité', desc: 'Pour tous, partout' }
];

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
      <button class="icon-btn icon-btn--bell" aria-label="Notifications">
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
            <span class="text-sm" style="opacity:0.92; font-weight:600;">Série de ${user.stats.streak} jours</span>
          </div>
          <span class="badge-live" style="background:rgba(255,255,255,0.18); color:white;">En direct</span>
        </div>

        <div class="flex gap-lg mb-md">
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.xp}">${user.stats.xp.toLocaleString('fr-FR')}</div>
            <div class="text-xs hero-stat-label">XP</div>
          </div>
          <div>
            <div class="text-2xl font-bold">${user.stats.level}</div>
            <div class="text-xs hero-stat-label">Niveau</div>
          </div>
          <div>
            <div class="text-2xl font-bold" data-counter="${user.stats.wordsLearned}">${user.stats.wordsLearned}</div>
            <div class="text-xs hero-stat-label">Mots</div>
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

    <!-- Mascotte de bienvenue -->
    <div class="card mascot-greeting mb-md">
      <div class="mascot-greeting__avatar animate-float" aria-hidden="true">${mascot.waving(80)}</div>
      <div class="mascot-greeting__body">
        <div class="font-bold">Salut ${firstName} !</div>
        <div class="text-xs text-muted">Continue ta série de ${user.stats.streak} jours — il te reste 5 minutes aujourd'hui pour la garder.</div>
      </div>
      <button class="btn btn-primary btn-sm" data-nav="/learn"
              style="background:var(--kivu-accent); flex-shrink:0;">Continuer</button>
    </div>

    <!-- Action principale -->
    <button class="card featured-action mb-md" data-nav="/translate">
      <span class="featured-action__icon">${icons.mic(28, 'white')}</span>
      <div class="featured-action__body">
        <div class="font-bold text-md">Démarrer une traduction</div>
        <div class="text-xs text-muted">Parlez, écoutez, comprenez — instantané</div>
      </div>
      <span class="featured-action__arrow">${icons.chevronRight(20)}</span>
    </button>

    <!-- Grille des 8 fonctionnalités -->
    <div class="section-head mb-sm mt-lg">
      <h2 class="font-display font-bold text-lg">Nos 8 révolutions</h2>
      <span class="text-xs text-muted">Tout, en une seule app</span>
    </div>
    <div class="grid grid-2 mb-lg">
      ${FEATURES.map(f => renderFeatureTile(f)).join('')}
    </div>

    <!-- Impact en temps réel -->
    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Impact KIVU</h2>
      <span class="badge-live">En direct</span>
    </div>
    <div class="grid grid-3 mb-lg">
      ${renderImpact('2 047', 'Langues actives', 'var(--kivu-primary)', icons.globe)}
      ${renderImpact('127M', 'Personnes',         'var(--kivu-accent)',  icons.users)}
      ${renderImpact('483',   'Langues sauvées',  'var(--kivu-tertiary)', icons.preserve)}
    </div>

    <!-- Défi du jour -->
    <div class="hero-card grad-sunset mb-lg" style="position:relative; overflow:hidden;">
      <span class="orb orb--accent" style="width:140px;height:140px;top:-50px;right:-30px;opacity:0.3"></span>
      <div style="position:relative;z-index:1;">
        <div class="flex justify-between items-center mb-sm">
          <span class="chip chip-white">⚡ Défi du jour</span>
          <span class="chip chip-white">+150 XP</span>
        </div>
        <h3 class="text-lg font-bold mb-xs">Apprenez 5 salutations en Swahili</h3>
        <div class="flex justify-between items-center mt-sm">
          <div>
            <div class="progress-bar" style="background:rgba(255,255,255,0.22); max-width:160px;">
              <div class="progress-fill" style="width:60%; background:white;"></div>
            </div>
            <span class="text-xs mt-xs" style="opacity:0.92">3 / 5 complétées</span>
          </div>
          <button class="btn btn-white" data-nav="/learn">Continuer</button>
        </div>
      </div>
    </div>

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

    <!-- Radio Kivi -->
    <button class="card radio-promo mb-md" data-nav="/radio">
      <span class="radio-promo__icon">${icons.speaker(28, 'white')}</span>
      <div style="flex:1; text-align:left;">
        <div class="font-bold">Radio Kivi</div>
        <div class="text-xs text-muted">Apprenez en faisant la cuisine, en marchant</div>
      </div>
      <span class="chip chip-accent">Nouveau</span>
    </button>

    <!-- Communauté -->
    <h2 class="font-display font-bold text-lg mb-sm">Communauté KIVU</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderCommunityPost('👵🏾', 'Mamie Awa', 'a enregistré 12 proverbes Wolof', 'il y a 3 h')}
      ${renderCommunityPost('👨🏾‍🎓', 'Koffi', 'a terminé le niveau 15 en Dioula', 'il y a 5 h')}
      ${renderCommunityPost('👩🏾‍⚕️', 'Dr. Amina', 'a aidé 47 patients via KIVU', 'hier')}
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
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

function formatSpeakers(count) {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)} M locuteurs`;
  if (count >= 1_000) return `${Math.round(count / 1_000)} K locuteurs`;
  return `${count} locuteurs`;
}

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
