/**
 * KIVU — Authentification.
 *
 * Page plein écran style Duolingo : grande mascotte, choix entre Email,
 * Google, Apple. Le backend Flask expose /auth/signup et /auth/signin
 * (Bearer JWT). Pour Google/Apple on simule l'OAuth (le jury verra l'UX
 * complète sans dépendre de credentials externes).
 */

import { store } from '../store.js';
import { navigate } from '../router.js';
import { icons } from '../components/icons.js';
import { mascot } from '../components/mascot.js';
import { api } from '../services/api.js';
import { sync } from '../services/sync.js';
import { t } from '../i18n/index.js';

let mode = 'choice';   // 'choice' | 'email-login' | 'email-signup'
let email = '';
let password = '';
let name = '';
let busy = false;
let error = null;

export function renderLogin() {
  return `
    <div class="login-screen">
      <div class="login-bg-orbs">
        <div class="orb orb--accent" style="width:280px; height:280px; top:-100px; right:-60px;"></div>
        <div class="orb orb--primary" style="width:220px; height:220px; bottom:-80px; left:-40px; animation-delay:-3s;"></div>
      </div>

      <header class="login-header">
        ${mode !== 'choice' ? `
          <button class="lesson-close" data-action="login-back" aria-label="Retour">
            ${icons.arrowLeft(22)}
          </button>
        ` : '<div></div>'}
        <div class="login-brand">
          <span style="background:var(--grad-hero); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; font-family:var(--font-display); font-weight:800; font-size:22px; letter-spacing:2px;">KIVU</span>
        </div>
        <div></div>
      </header>

      <main class="login-body">
        ${mode === 'choice'        ? renderChoice() : ''}
        ${mode === 'email-login'   ? renderEmailLogin() : ''}
        ${mode === 'email-signup'  ? renderEmailSignup() : ''}
      </main>
    </div>
  `;
}

function renderChoice() {
  return `
    <div class="login-mascot animate-float">${mascot.waving(150)}</div>
    <h1 class="login-title">Bienvenue dans KIVU</h1>
    <p class="login-sub">2 000+ langues africaines, dans une app mondiale.</p>

    <div class="login-actions">
      <button class="oauth-btn oauth-btn--google" data-action="oauth-google">
        ${googleIcon()}
        <span>Continuer avec Google</span>
      </button>

      <button class="oauth-btn oauth-btn--apple" data-action="oauth-apple">
        ${appleIcon()}
        <span>Continuer avec Apple</span>
      </button>

      <div class="login-divider"><span>ou</span></div>

      <button class="btn btn-primary btn-full" data-action="show-signup"
              style="background:var(--kivu-primary);">
        Créer un compte
      </button>
      <button class="btn btn-ghost btn-full" data-action="show-login">
        J'ai déjà un compte
      </button>

      <div class="login-skip">
        <button class="link-btn" data-action="skip-auth">
          Continuer sans compte ${icons.chevronRight(14)}
        </button>
      </div>
    </div>

    <p class="login-legal">
      En continuant vous acceptez les <a href="#">CGU</a> et la <a href="#">politique de confidentialité</a>.
    </p>
  `;
}

function renderEmailLogin() {
  return `
    <div class="login-mascot">${mascot.thinking(110)}</div>
    <h1 class="login-title">Bon retour parmi nous</h1>
    <p class="login-sub">Connectez-vous pour reprendre votre apprentissage.</p>

    <form class="login-form" data-action="email-login-submit">
      <label class="form-group">
        <span class="form-label">Email</span>
        <input class="form-input" type="email" name="email"
               value="${escapeAttr(email)}"
               placeholder="vous@exemple.com" autocomplete="email" required/>
      </label>
      <label class="form-group">
        <span class="form-label">Mot de passe</span>
        <input class="form-input" type="password" name="password"
               value="${escapeAttr(password)}"
               placeholder="••••••••" autocomplete="current-password" required minlength="6"/>
      </label>

      ${error ? `<div class="login-error">${escapeHtml(error)}</div>` : ''}

      <button class="btn btn-primary btn-full mt-md" type="submit"
              style="background:var(--kivu-primary);"
              ${busy ? 'disabled' : ''}>
        ${busy ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>

    <div class="login-switch">
      <span class="text-sm text-muted">Nouveau sur KIVU ?</span>
      <button class="link-btn" data-action="show-signup">Créer un compte</button>
    </div>
  `;
}

function renderEmailSignup() {
  return `
    <div class="login-mascot">${mascot.cheering(110)}</div>
    <h1 class="login-title">Rejoignez KIVU</h1>
    <p class="login-sub">Créez votre compte en quelques secondes.</p>

    <form class="login-form" data-action="email-signup-submit">
      <label class="form-group">
        <span class="form-label">Nom complet</span>
        <input class="form-input" type="text" name="name"
               value="${escapeAttr(name)}"
               placeholder="Awa Diop" autocomplete="name" required/>
      </label>
      <label class="form-group">
        <span class="form-label">Email</span>
        <input class="form-input" type="email" name="email"
               value="${escapeAttr(email)}"
               placeholder="vous@exemple.com" autocomplete="email" required/>
      </label>
      <label class="form-group">
        <span class="form-label">Mot de passe</span>
        <input class="form-input" type="password" name="password"
               value="${escapeAttr(password)}"
               placeholder="6 caractères minimum" autocomplete="new-password" required minlength="6"/>
      </label>

      ${error ? `<div class="login-error">${escapeHtml(error)}</div>` : ''}

      <button class="btn btn-primary btn-full mt-md" type="submit"
              style="background:var(--kivu-accent);"
              ${busy ? 'disabled' : ''}>
        ${busy ? 'Création…' : 'Créer mon compte'}
      </button>
    </form>

    <div class="login-switch">
      <span class="text-sm text-muted">Déjà inscrit ?</span>
      <button class="link-btn" data-action="show-login">Se connecter</button>
    </div>
  `;
}

function googleIcon() {
  return `
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.66-.06-1.29-.16-1.91H12v3.62h5.4a4.62 4.62 0 0 1-2 3.04v2.51h3.24a9.78 9.78 0 0 0 2.96-7.26z"/>
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.42l-3.24-2.51c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"/>
      <path fill="#FBBC05" d="M6.41 13.91A6 6 0 0 1 6.1 12c0-.66.11-1.31.31-1.91V7.5H3.07a10 10 0 0 0 0 9l3.34-2.59z"/>
      <path fill="#EA4335" d="M12 5.97c1.47 0 2.78.51 3.81 1.5l2.86-2.86A10 10 0 0 0 12 2 10 10 0 0 0 3.07 7.5l3.34 2.59C7.2 7.73 9.4 5.97 12 5.97z"/>
    </svg>
  `;
}

function appleIcon() {
  return `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function rerender() {
  const main = document.querySelector('main.screen');
  if (main) main.innerHTML = renderLogin();
  renderLogin.mount();
}

renderLogin.mount = () => {
  // Back button
  document.querySelectorAll('[data-action="login-back"]').forEach(btn =>
    btn.addEventListener('click', () => {
      mode = 'choice'; error = null; rerender();
    })
  );

  document.querySelectorAll('[data-action="show-login"]').forEach(btn =>
    btn.addEventListener('click', () => { mode = 'email-login'; error = null; rerender(); })
  );
  document.querySelectorAll('[data-action="show-signup"]').forEach(btn =>
    btn.addEventListener('click', () => { mode = 'email-signup'; error = null; rerender(); })
  );

  // Skip without account → just mark onboarding done with a guest user
  document.querySelectorAll('[data-action="skip-auth"]').forEach(btn =>
    btn.addEventListener('click', () => {
      store.set('user', { ...(store.get('user') || {}), guest: true });
      store.set('authToken', null);
      navigate('/');
    })
  );

  // OAuth — mocked (the jury sees the UX, no external creds needed)
  document.querySelectorAll('[data-action="oauth-google"]').forEach(btn =>
    btn.addEventListener('click', () => mockOauth('Google', 'demo.google@kivu.africa', 'Aïcha Diallo', '👩🏾'))
  );
  document.querySelectorAll('[data-action="oauth-apple"]').forEach(btn =>
    btn.addEventListener('click', () => mockOauth('Apple', 'demo.apple@kivu.africa', 'Pierre Mendy', '🧑🏾'))
  );

  // Email login submit
  document.querySelectorAll('form[data-action="email-login-submit"]').forEach(form =>
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      email = fd.get('email')?.toString().trim() || '';
      password = fd.get('password')?.toString() || '';
      if (!email || password.length < 6) {
        error = 'Email ou mot de passe invalide.'; rerender(); return;
      }
      busy = true; error = null; rerender();
      try {
        const res = await api.post('/auth/signin', { email, password });
        completeAuth(res, 'Connexion réussie');
      } catch (err) {
        error = err?.message || 'Identifiants incorrects';
        busy = false; rerender();
      }
    })
  );

  // Email signup submit
  document.querySelectorAll('form[data-action="email-signup-submit"]').forEach(form =>
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      name     = fd.get('name')?.toString().trim() || '';
      email    = fd.get('email')?.toString().trim() || '';
      password = fd.get('password')?.toString() || '';
      if (!name || !email || password.length < 6) {
        error = 'Tous les champs sont requis (mot de passe ≥ 6 caractères).';
        rerender(); return;
      }
      busy = true; error = null; rerender();
      try {
        const res = await api.post('/auth/signup', { name, email, password });
        completeAuth(res, `Bienvenue ${name.split(' ')[0]} !`);
      } catch (err) {
        error = err?.message || 'Création impossible';
        busy = false; rerender();
      }
    })
  );
};

function mockOauth(provider, mockEmail, mockName, mockAvatar) {
  busy = true; error = null; rerender();
  // Simulate network round-trip
  setTimeout(async () => {
    try {
      // Try signup first; if email exists fall back to mock-signin
      let res;
      try {
        res = await api.post('/auth/signup', {
          name: mockName,
          email: mockEmail,
          password: 'oauth-' + provider.toLowerCase() + '-mock'
        });
      } catch {
        res = await api.post('/auth/signin', {
          email: mockEmail,
          password: 'oauth-' + provider.toLowerCase() + '-mock'
        });
      }
      // Override avatar with the OAuth one
      if (res?.user) res.user.avatar = mockAvatar;
      completeAuth(res, `Connecté via ${provider}`);
    } catch (err) {
      // Backend offline — create a local guest user with the OAuth identity
      const fakeUser = {
        id: 'oauth-' + Date.now(),
        name: mockName,
        email: mockEmail,
        avatar: mockAvatar,
        country: 'Côte d\'Ivoire',
        countryFlag: '🇨🇮',
        provider,
        guest: false,
        preferredLanguage: 'fra',
        motherTongue: 'dyu',
        learningLanguages: ['swa', 'wol'],
        subscription: 'free',
        stats: { xp: 0, level: 1, nextLevelXP: 500, streak: 0, wordsLearned: 0, badgesCount: 0, translationsCount: 0, contributionsCount: 0, rank: 9999 }
      };
      completeAuth({ user: fakeUser, token: 'mock-token-' + Date.now() }, `Connecté via ${provider} (mode démo)`);
    }
  }, 500);
}

function completeAuth(res, toastMsg) {
  if (res?.token) localStorage.setItem('kivu.token', res.token);
  if (res?.user)  store.set('user', res.user);
  store.set('authToken', res?.token || null);
  store.set('onboardingCompleted', true);
  busy = false; error = null;
  // Try to pull any cloud progress for this account so the user picks up
  // where they left off on another device.
  sync.pull().catch(() => { /* offline or first device, no problem */ });
  if (window.__KIVU__?.toast) {
    window.__KIVU__.toast(toastMsg, { type: 'success' });
  }
  navigate('/');
}
