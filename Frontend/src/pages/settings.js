/**
 * KIVU — Page Paramètres complète
 *
 * Volets :
 *  - Apparence (thème clair/sombre/auto, taille texte, contraste)
 *  - Abonnement (FREE / STARTER / PRO / FAMILY) — paywall propre
 *  - Compte (nom, email, langue maternelle)
 *  - Notifications (rappels, série, leçons)
 *  - Hors-ligne & stockage (taille cache, packs téléchargés)
 *  - Confidentialité & sécurité
 *  - À propos
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { recorder } from '../services/recorder.js';
import { t, setLang, getLang, LANGS_AVAILABLE } from '../i18n/index.js';
import { PALETTES, DENSITIES, applyPalette, applyDensity, applyContrast } from '../theme.js';
import { sync } from '../services/sync.js';

function sections() {
  return [
    { id: 'language',     label: t('settings.sections.language'),     icon: 'globe' },
    { id: 'appearance',   label: t('settings.sections.appearance'),   icon: 'eye' },
    { id: 'subscription', label: t('settings.sections.subscription'), icon: 'star' },
    { id: 'account',      label: t('settings.sections.account'),      icon: 'profile' },
    { id: 'notifications', label: t('settings.sections.notifications'), icon: 'bell' },
    { id: 'storage',      label: t('settings.sections.storage'),      icon: 'archive' },
    { id: 'privacy',      label: t('settings.sections.privacy'),      icon: 'lock' },
    { id: 'about',        label: t('settings.sections.about'),        icon: 'heart' }
  ];
}

let activeSection = 'language';

const PLANS = [
  {
    id: 'free',
    name: 'KIVU Free',
    price: '0',
    period: 'gratuit pour toujours',
    accent: 'var(--text-secondary)',
    perks: [
      '30 min de traduction / jour',
      '1 langue d\'apprentissage',
      'Quêtes basiques',
      'Mode hors-ligne limité'
    ]
  },
  {
    id: 'starter',
    name: 'KIVU Starter',
    price: '2 000',
    period: 'FCFA / mois',
    accent: 'var(--kivu-primary)',
    perks: [
      'Traduction illimitée',
      '3 langues d\'apprentissage',
      'Toutes les quêtes',
      'Mode hors-ligne complet',
      'Sans publicité'
    ]
  },
  {
    id: 'pro',
    name: 'KIVU Pro',
    price: '5 000',
    period: 'FCFA / mois',
    badge: 'POPULAIRE',
    accent: 'var(--kivu-accent)',
    gradient: 'var(--grad-sunset)',
    perks: [
      'Tout dans Starter',
      'Famille — 5 personnes',
      'AI Tutor personnel',
      'Cérémonies & savoir ancestral',
      'Service prioritaire',
      'Service client en 200+ langues'
    ]
  },
  {
    id: 'family',
    name: 'KIVU Family',
    price: '10 000',
    period: 'FCFA / mois',
    accent: 'var(--kivu-tertiary)',
    perks: [
      'Tout dans Pro',
      'Famille — 10 personnes',
      'Outils d\'enseignement',
      'Archive privée illimitée',
      'Heritage Pass diaspora'
    ]
  }
];

export function renderSettings() {
  const prefs = store.get('preferences') || {};
  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">${t('settings.title')}</div>
        <div class="screen-subtitle">${t('settings.subtitle')}</div>
      </div>
    </div>

    <!-- Section pills -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row tabs-row">
        ${sections().map(s => `
          <button class="pill-tab ${activeSection === s.id ? 'active' : ''}"
                  data-action="settings-section" data-section="${s.id}">
            <span style="display:inline-flex;gap:6px;align-items:center;">
              ${icons[s.icon]?.(16) || ''}
              ${s.label}
            </span>
          </button>
        `).join('')}
      </div>
    </div>

    ${activeSection === 'language'      ? renderLanguage()           : ''}
    ${activeSection === 'appearance'    ? renderAppearance(prefs)    : ''}
    ${activeSection === 'subscription'  ? renderSubscription()       : ''}
    ${activeSection === 'account'       ? renderAccount()            : ''}
    ${activeSection === 'notifications' ? renderNotifications(prefs) : ''}
    ${activeSection === 'storage'       ? renderStorage()            : ''}
    ${activeSection === 'privacy'       ? renderPrivacy()            : ''}
    ${activeSection === 'about'         ? renderAbout()              : ''}
  `;
}

function renderLanguage() {
  const cur = getLang();
  return `
    <div class="card mb-md">
      <div class="font-bold text-lg mb-xs">${t('settings.language.title')}</div>
      <div class="text-xs text-muted mb-sm">${t('settings.language.desc')}</div>

      <div class="lang-cards">
        ${LANGS_AVAILABLE.map(l => `
          <button class="lang-card ${cur === l.id ? 'active' : ''}"
                  data-action="set-ui-lang" data-lang="${l.id}">
            <span class="lang-card__flag">${l.flag}</span>
            <div class="lang-card__body">
              <div class="font-bold">${l.name}</div>
              <div class="text-xs text-muted">${l.native}</div>
            </div>
            ${cur === l.id ? `<span class="lang-card__check">${icons.check(18, 'white')}</span>` : ''}
          </button>
        `).join('')}
      </div>
    </div>

    <div class="card mb-md">
      <div class="mascot-bubble">
        <div class="mascot-bubble__avatar">${mascot.thinking(64)}</div>
        <div class="mascot-bubble__speech">
          <div class="font-bold">Wolof = sax !</div>
          <div class="text-xs text-muted mt-xs">Une app de langues africaines doit pouvoir s'utiliser dans une langue africaine. C'est notre engagement.</div>
        </div>
      </div>
    </div>
  `;
}

function renderAppearance(prefs) {
  const theme = prefs.theme || 'auto';
  const palette = prefs.palette || 'kivu';
  const density = prefs.density || 'normal';
  return `
    <!-- Theme -->
    <div class="card mb-md">
      <div class="font-bold text-lg mb-sm">${t('settings.theme.title')}</div>
      <div class="grid grid-3 mb-md theme-grid">
        ${[
          { id: 'light', label: t('settings.theme.light'), preview: 'theme-preview--light' },
          { id: 'dark',  label: t('settings.theme.dark'),  preview: 'theme-preview--dark' },
          { id: 'auto',  label: t('settings.theme.auto'),  preview: 'theme-preview--auto' }
        ].map(opt => `
          <button class="theme-card ${theme === opt.id ? 'active' : ''}"
                  data-action="set-theme" data-theme="${opt.id}">
            <div class="theme-preview ${opt.preview}"></div>
            <div class="font-semibold text-sm">${opt.label}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Palette de couleurs -->
    <div class="card mb-md">
      <div class="font-bold text-lg mb-xs">Couleur principale</div>
      <div class="text-xs text-muted mb-sm">Personnalisez l'identité visuelle de KIVU.</div>
      <div class="palette-grid">
        ${PALETTES.map(p => `
          <button class="palette-swatch ${palette === p.id ? 'active' : ''}"
                  data-action="set-palette" data-id="${p.id}"
                  aria-label="${p.name}">
            <span class="palette-swatch__chip" style="background:${p.gradHero};">
              ${palette === p.id ? icons.check(18, 'white') : ''}
            </span>
            <span class="palette-swatch__label">${p.emoji} ${p.name}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Densité d'affichage -->
    <div class="card mb-md">
      <div class="font-bold text-lg mb-xs">Densité d'affichage</div>
      <div class="text-xs text-muted mb-sm">Quantité d'espace entre les éléments.</div>
      <div class="density-grid">
        ${DENSITIES.map(d => `
          <button class="density-card ${density === d.id ? 'active' : ''}"
                  data-action="set-density" data-id="${d.id}">
            <div class="density-preview density-preview--${d.id}">
              <span></span><span></span><span></span>
            </div>
            <div class="font-semibold text-sm">${d.label}</div>
          </button>
        `).join('')}
      </div>
    </div>

    <!-- Reste : font size + animations + contrast -->
    <div class="card mb-md">
      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--kivu-primary);">${icons.eye(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">${t('settings.fontSize')}</div>
          <div class="text-xs text-muted">${(prefs.fontSize || 1).toFixed(2)}×</div>
        </div>
        <input type="range" min="0.85" max="1.5" step="0.05"
               value="${prefs.fontSize || 1}"
               class="a11y-slider"
               data-action="set-font-size" aria-label="${t('settings.fontSize')}"/>
      </div>

      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--kivu-accent);">${icons.zap(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">Réduire les animations</div>
          <div class="text-xs text-muted">Moins de mouvements</div>
        </div>
        ${toggle('reducedMotion', prefs.reducedMotion)}
      </div>

      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--success);">${icons.check(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">Contraste élevé</div>
          <div class="text-xs text-muted">Pour une meilleure lisibilité</div>
        </div>
        ${toggle('highContrast', prefs.highContrast)}
      </div>
    </div>
  `;
}

function renderSubscription() {
  const user = store.get('user');
  const current = user.subscription || 'free';
  return `
    <div class="card subscription-banner mb-md">
      <div class="mascot-bubble">
        <div class="mascot-bubble__avatar">${mascot.cheering(72)}</div>
        <div class="mascot-bubble__speech">
          <div class="font-bold">Soutenez les langues africaines.</div>
          <div class="text-xs text-muted mt-xs">Chaque abonnement finance la préservation de langues menacées.</div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-sm mb-lg">
      ${PLANS.map(p => renderPlan(p, current)).join('')}
    </div>

    <div class="card text-center mb-lg" style="background:var(--bg);">
      <div class="text-xs text-muted">Paiement sécurisé · Annulez à tout moment</div>
      <div class="flex gap-xs justify-center mt-sm">
        <span class="chip chip-ghost">Mobile Money</span>
        <span class="chip chip-ghost">Wave</span>
        <span class="chip chip-ghost">Carte</span>
      </div>
    </div>
  `;
}

function renderPlan(p, current) {
  const isCurrent = p.id === current;
  return `
    <div class="plan-card ${isCurrent ? 'plan-card--active' : ''}"
         style="${p.gradient ? `background:${p.gradient}; color:white;` : ''}">
      ${p.badge ? `<span class="plan-badge">${p.badge}</span>` : ''}
      <div class="flex justify-between items-center mb-sm">
        <div>
          <div class="font-bold text-lg">${p.name}</div>
          <div class="text-xs" style="opacity:0.85;">${p.period}</div>
        </div>
        <div class="text-right">
          <div class="font-display font-bold" style="font-size:28px;">${p.price}</div>
          ${p.id !== 'free' ? '<div class="text-xs" style="opacity:0.85;">FCFA/mois</div>' : ''}
        </div>
      </div>
      <ul class="plan-perks">
        ${p.perks.map(perk => `
          <li><span class="plan-check">${icons.check(14, p.gradient ? 'white' : p.accent)}</span>${perk}</li>
        `).join('')}
      </ul>
      <button class="btn ${isCurrent ? 'btn-ghost' : (p.gradient ? 'btn-white' : 'btn-primary')} btn-full mt-md"
              data-action="select-plan" data-plan="${p.id}"
              ${isCurrent ? 'disabled' : ''}
              ${!p.gradient && !isCurrent ? `style="background:${p.accent};"` : ''}>
        ${isCurrent ? 'Plan actuel' : (p.id === 'free' ? 'Rétrograder' : 'Passer à ' + p.name)}
      </button>
    </div>
  `;
}

function renderAccount() {
  const u = store.get('user');
  return `
    <div class="card mb-md">
      <div class="text-center mb-md">
        <div class="profile-avatar-wrap" style="margin:0 auto 12px;">
          <div class="profile-avatar">${u.avatar}</div>
          <span class="profile-verify">${icons.check(16, 'white')}</span>
        </div>
        <div class="font-bold text-lg">${u.name}</div>
        <div class="text-sm text-muted">${u.email}</div>
      </div>

      <div class="settings-form">
        <label class="form-group">
          <span class="form-label">Nom complet</span>
          <input class="form-input" data-action="set-account" data-field="name" value="${u.name}"/>
        </label>
        <label class="form-group">
          <span class="form-label">Email</span>
          <input class="form-input" data-action="set-account" data-field="email" value="${u.email}"/>
        </label>
        <label class="form-group">
          <span class="form-label">Pays</span>
          <input class="form-input" data-action="set-account" data-field="country" value="${u.country}"/>
        </label>
        <label class="form-group">
          <span class="form-label">Langue maternelle</span>
          <select class="form-input" data-action="set-account" data-field="motherTongue">
            ${['fra','eng','swa','wol','bam','dyu','hau','yor','zul','ibo'].map(id => `
              <option value="${id}" ${u.motherTongue === id ? 'selected' : ''}>${langName(id)}</option>
            `).join('')}
          </select>
        </label>
      </div>
    </div>

    <div class="card mb-md">
      <button class="btn btn-ghost btn-full" data-action="cloud-sync-now">
        ${icons.signal(16)} Synchroniser maintenant
      </button>
      <div class="text-xs text-muted mt-xs" style="text-align:center;">
        Vos progrès se synchronisent automatiquement entre vos appareils.
      </div>
    </div>

    <div class="card mb-md">
      <button class="btn btn-ghost btn-full" data-action="logout">
        ${icons.arrowLeft(16)} Se déconnecter
      </button>
    </div>

    <div class="card mb-md" style="border:1px solid rgba(235,77,77,0.25);">
      <div class="font-bold text-error" style="color:var(--error);">Zone dangereuse</div>
      <div class="text-xs text-muted mb-sm">Réinitialiser supprime votre profil local et l'historique.</div>
      <button class="btn btn-ghost" style="border:1px solid var(--error); color:var(--error);"
              data-action="reset-account">Réinitialiser le compte</button>
    </div>
  `;
}

function renderNotifications(prefs) {
  const n = prefs.notifications || {};
  return `
    <div class="card mb-md">
      <div class="font-bold text-lg mb-sm">Notifications</div>

      ${notifRow('Rappel de leçon quotidien',  'dailyReminder',  n.dailyReminder !== false, 'Garde ta série de jours active')}
      ${notifRow('Série en danger',            'streakWarning',  n.streakWarning !== false, 'Alerte avant minuit')}
      ${notifRow('Nouvelle leçon disponible',  'newLesson',      n.newLesson !== false,     'Selon ton niveau')}
      ${notifRow('Activité de la communauté',  'community',      n.community || false,      'Nouveaux contributeurs, défis')}
      ${notifRow('Promotions & abonnement',    'marketing',      n.marketing || false,      'Réductions, événements')}
    </div>

    <div class="card mb-md">
      <div class="font-bold text-md mb-sm">Heure du rappel</div>
      <input type="time" class="form-input" value="${n.reminderTime || '19:00'}"
             data-action="set-reminder-time" style="max-width:160px;"/>
    </div>
  `;
}

function notifRow(label, key, value, desc) {
  return `
    <div class="settings-row">
      <span class="settings-row__icon" style="color:var(--kivu-primary);">${icons.bell(20)}</span>
      <div class="settings-row__body">
        <div class="font-semibold">${label}</div>
        <div class="text-xs text-muted">${desc}</div>
      </div>
      ${toggle(`notifications.${key}`, value)}
    </div>
  `;
}

function renderStorage() {
  const recordings = recorder.list();
  const totalSize = recordings.reduce((sum, r) => sum + (r.size || 0), 0);
  const sizeMb = (totalSize / 1024 / 1024).toFixed(2);

  return `
    <div class="card mb-md">
      <div class="font-bold text-lg mb-sm">Stockage local</div>

      <div class="storage-row">
        <span class="storage-row__icon" style="background:rgba(140,64,173,0.15); color:var(--kivu-tertiary);">${icons.mic(20)}</span>
        <div style="flex:1;">
          <div class="font-semibold">Mes enregistrements</div>
          <div class="text-xs text-muted">${recordings.length} fichiers · ${sizeMb} Mo</div>
        </div>
      </div>

      <div class="storage-row">
        <span class="storage-row__icon" style="background:rgba(23,78,156,0.15); color:var(--kivu-primary);">${icons.archive(20)}</span>
        <div style="flex:1;">
          <div class="font-semibold">Cache PWA</div>
          <div class="text-xs text-muted">Pages, dictionnaire, leçons hors-ligne</div>
        </div>
        <button class="btn btn-ghost btn-sm" data-action="clear-pwa-cache">Vider</button>
      </div>
    </div>

    <div class="card mb-md">
      <div class="font-bold text-md mb-sm">Packs hors-ligne</div>
      <div class="text-xs text-muted mb-sm">Téléchargez des langues pour les utiliser sans data.</div>
      ${['Swahili','Wolof','Bambara','Haoussa','Yoruba'].map(lang => `
        <div class="settings-row">
          <span class="settings-row__icon" style="color:var(--kivu-secondary);">${icons.signal(20)}</span>
          <div class="settings-row__body">
            <div class="font-semibold">${lang}</div>
            <div class="text-xs text-muted">~ 12 Mo</div>
          </div>
          <button class="btn btn-primary btn-sm" data-action="download-pack" data-lang="${lang}"
                  style="background:var(--kivu-secondary);">Télécharger</button>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPrivacy() {
  return `
    <div class="card mb-md">
      <div class="font-bold text-lg mb-sm">Confidentialité & sécurité</div>

      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--success);">${icons.lock(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">Chiffrement E2E des traductions sensibles</div>
          <div class="text-xs text-muted">Activé par défaut</div>
        </div>
        <span class="chip chip-success">Activé</span>
      </div>

      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--info);">${icons.eye(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">Authentification biométrique</div>
          <div class="text-xs text-muted">Empreinte ou Face ID</div>
        </div>
        ${toggle('biometric', false)}
      </div>

      <div class="settings-row">
        <span class="settings-row__icon" style="color:var(--warning);">${icons.signal(20)}</span>
        <div class="settings-row__body">
          <div class="font-semibold">Mode anonyme</div>
          <div class="text-xs text-muted">Aucune donnée envoyée au serveur</div>
        </div>
        ${toggle('anonymousMode', false)}
      </div>

      <div class="settings-row">
        <button class="btn btn-ghost btn-full" data-action="export-data">
          ${icons.archive(16)} Exporter mes données
        </button>
      </div>

      <div class="settings-row">
        <button class="btn btn-ghost btn-full" style="color:var(--error); border:1px solid var(--error);"
                data-action="delete-data">
          ${icons.close(16)} Supprimer mes données
        </button>
      </div>
    </div>
  `;
}

function renderAbout() {
  return `
    <div class="card mb-md text-center">
      <div class="mascot-greeting__avatar animate-float" style="margin:8px auto;">${mascot.waving(120)}</div>
      <div class="font-display font-bold text-2xl mt-sm">KIVU</div>
      <div class="text-sm text-muted">v 2.0 — Science Fest Africa 2026</div>
      <div class="text-sm mt-md">
        <em>Unir l'Afrique par la langue.</em>
      </div>
    </div>

    <div class="card mb-md">
      <div class="font-bold mb-sm">Notre mission</div>
      <p class="text-sm text-muted">
        KIVU rend les 2 000+ langues africaines accessibles, vivantes et préservées.
        Chaque langue qui meurt est une partie de l'humanité qui s'éteint.
      </p>
    </div>

    <div class="flex flex-col gap-xs mb-lg">
      ${aboutLink('Conditions générales',     'terms')}
      ${aboutLink('Politique de confidentialité', 'privacy')}
      ${aboutLink('Centre d\'aide',           'help')}
      ${aboutLink('Nous contacter',           'contact')}
      ${aboutLink('Crédits & remerciements',  'credits')}
    </div>
  `;
}

function aboutLink(label, _id) {
  return `
    <button class="list-row menu-item">
      <span class="menu-icon" style="background:rgba(23,78,156,0.10); color:var(--kivu-primary);">${icons.book(18)}</span>
      <span style="flex:1;">${label}</span>
      <span class="text-tertiary">${icons.chevronRight(18)}</span>
    </button>
  `;
}

function toggle(key, value) {
  return `
    <button class="toggle-switch ${value ? 'on' : ''}"
            data-action="toggle-pref" data-key="${key}"
            aria-pressed="${!!value}" aria-label="${key}">
      <span class="toggle-switch__thumb"></span>
    </button>
  `;
}

function langName(id) {
  return ({
    fra: 'Français', eng: 'Anglais', swa: 'Swahili',
    wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
    hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo'
  })[id] || id;
}

renderSettings.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderSettings();
    renderSettings.mount();
  };

  // Section pills
  document.querySelectorAll('[data-action="settings-section"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeSection = btn.dataset.section;
      rerender();
    })
  );

  // Theme cards
  document.querySelectorAll('[data-action="set-theme"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, theme });
      applyTheme(theme);
      rerender();
    })
  );

  // Palette swatches
  document.querySelectorAll('[data-action="set-palette"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, palette: id });
      applyPalette(id);
      const p = PALETTES.find(x => x.id === id);
      if (window.__KIVU__?.toast && p) {
        window.__KIVU__.toast(`Palette : ${p.name}`, { type: 'success', duration: 1400 });
      }
      rerender();
    })
  );

  // Density cards
  document.querySelectorAll('[data-action="set-density"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, density: id });
      applyDensity(id);
      rerender();
    })
  );

  // UI language
  document.querySelectorAll('[data-action="set-ui-lang"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, uiLang: lang });
      setLang(lang); // triggers global re-render via onLangChange
      if (window.__KIVU__?.toast) {
        const name = LANGS_AVAILABLE.find(l => l.id === lang)?.native || lang;
        window.__KIVU__.toast(`Interface : ${name}`, { type: 'success', duration: 1400 });
      }
    })
  );

  // Font size slider
  document.querySelectorAll('[data-action="set-font-size"]').forEach(input =>
    input.addEventListener('input', () => {
      const prefs = store.get('preferences') || {};
      store.set('preferences', { ...prefs, fontSize: Number(input.value) });
      document.documentElement.style.setProperty('--root-font-size', `${input.value * 16}px`);
    })
  );

  // Generic toggle
  document.querySelectorAll('[data-action="toggle-pref"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      const prefs = store.get('preferences') || {};
      // Support nested keys like 'notifications.dailyReminder'
      const path = key.split('.');
      const next = { ...prefs };
      let cursor = next;
      for (let i = 0; i < path.length - 1; i++) {
        cursor[path[i]] = { ...(cursor[path[i]] || {}) };
        cursor = cursor[path[i]];
      }
      const last = path[path.length - 1];
      cursor[last] = !cursor[last];
      store.set('preferences', next);
      // Side effects for known keys
      if (key === 'highContrast') applyContrast(cursor[last]);
      if (key === 'reducedMotion') document.documentElement.dataset.reducedMotion = cursor[last] ? 'true' : 'false';
      rerender();
    })
  );

  // Reminder time
  document.querySelectorAll('[data-action="set-reminder-time"]').forEach(input =>
    input.addEventListener('change', () => {
      const prefs = store.get('preferences') || {};
      store.set('preferences', {
        ...prefs,
        notifications: { ...(prefs.notifications || {}), reminderTime: input.value }
      });
    })
  );

  // Plan selection — paid plans go to /checkout, free goes back instantly
  document.querySelectorAll('[data-action="select-plan"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const plan = btn.dataset.plan;
      if (plan === 'free') {
        const u = store.get('user');
        store.set('user', { ...u, subscription: 'free' });
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Plan KIVU Free activé', { type: 'info' });
        }
        rerender();
      } else {
        // Paid plan → checkout flow
        location.hash = '#/checkout/' + plan;
      }
    })
  );

  // Account fields
  document.querySelectorAll('[data-action="set-account"]').forEach(input =>
    input.addEventListener('change', () => {
      const u = store.get('user');
      store.set('user', { ...u, [input.dataset.field]: input.value });
    })
  );

  document.querySelectorAll('[data-action="reset-account"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!confirm('Réinitialiser votre compte ? Cette action est irréversible.')) return;
      store.reset();
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Compte réinitialisé', { type: 'info' });
    })
  );

  // Logout — pousse une dernière sync avant de partir
  document.querySelectorAll('[data-action="logout"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Se déconnecter ?')) return;
      try { await sync.pushNow(); } catch { /* offline ok */ }
      localStorage.removeItem('kivu.token');
      store.set('authToken', null);
      store.set('onboardingCompleted', false);
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Déconnecté', { type: 'info' });
      setTimeout(() => location.hash = '#/login', 100);
    })
  );

  // Manual cloud sync
  document.querySelectorAll('[data-action="cloud-sync-now"]').forEach(btn =>
    btn.addEventListener('click', () => sync.syncNow())
  );

  // Storage
  document.querySelectorAll('[data-action="clear-pwa-cache"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!confirm('Vider tout le cache hors-ligne ?')) return;
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Cache vidé', { type: 'success' });
      }
    })
  );

  document.querySelectorAll('[data-action="download-pack"]').forEach(btn =>
    btn.addEventListener('click', () => {
      btn.textContent = 'Téléchargement…';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = 'Téléchargé ✓';
        if (window.__KIVU__?.toast)
          window.__KIVU__.toast(`Pack ${btn.dataset.lang} téléchargé`, { type: 'success' });
      }, 1200);
    })
  );

  // Privacy
  document.querySelectorAll('[data-action="export-data"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const data = JSON.stringify(store.get(), null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kivu-export.json';
      a.click();
      URL.revokeObjectURL(url);
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Données exportées', { type: 'success' });
    })
  );

  document.querySelectorAll('[data-action="delete-data"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (!confirm('Supprimer toutes vos données ? Action irréversible.')) return;
      localStorage.clear();
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Données supprimées', { type: 'info' });
      setTimeout(() => location.reload(), 500);
    })
  );
};

/** Applique le thème immédiatement sur <html data-theme="..."> */
export function applyTheme(theme) {
  const root = document.documentElement;
  let resolved = theme;
  if (theme === 'auto') {
    resolved = window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.dataset.theme = resolved;
}
