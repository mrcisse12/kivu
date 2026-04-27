/**
 * KIVU SyncService — synchronisation cloud du state utilisateur.
 *
 * Triggers :
 *  - sur sign-in   → pull serveur, merge avec local (cf. mergeStates)
 *  - sur événements importants (lesson done, palette change…) → debounced push
 *  - périodique (toutes les 60 s tant que connecté + onglet visible) → push
 *  - manuel via syncNow()
 *
 * Émet des events ('idle' | 'syncing' | 'success' | 'error' | 'offline')
 * pour qu'un indicateur visuel puisse refléter l'état.
 */

import { store } from '../store.js';
import { api, ApiError } from './api.js';

const SYNCED_KEYS = ['preferences', 'lessons', 'storiesProgress', 'storyProgress', 'receipts'];
const PERIODIC_MS = 60_000;
const DEBOUNCE_MS = 1_500;

let lastVersion = 0;
let lastPushedAt = null;
let timer = null;
let debounceTimer = null;
let listeners = new Set();
let status = 'idle'; // idle | syncing | success | error | offline | unauth

function emit(next, extra = {}) {
  status = next;
  listeners.forEach(cb => {
    try { cb(next, extra); } catch { /* ignore */ }
  });
}

function pickSyncedSlice() {
  const state = store.get();
  const out = {};
  for (const k of SYNCED_KEYS) {
    if (state[k] !== undefined) out[k] = state[k];
  }
  // Also persist a few user-level fields (not the whole user — security/size)
  const u = state.user;
  if (u) {
    out.user = {
      name: u.name,
      avatar: u.avatar,
      country: u.country,
      countryFlag: u.countryFlag,
      preferredLanguage: u.preferredLanguage,
      motherTongue: u.motherTongue,
      learningLanguages: u.learningLanguages,
      subscription: u.subscription,
      stats: u.stats,
      motivation: u.motivation,
      level: u.level,
      dailyGoalMinutes: u.dailyGoalMinutes
    };
  }
  return out;
}

/** Apply server payload over local state (merge stratégique). */
function mergeStates(serverPayload) {
  if (!serverPayload || typeof serverPayload !== 'object') return;

  // Preferences : server wins (last user choice across devices)
  if (serverPayload.preferences) {
    const local = store.get('preferences') || {};
    store.set('preferences', { ...local, ...serverPayload.preferences });
  }

  // Lessons : merge completed (union by id, keep best score)
  if (serverPayload.lessons) {
    const local = store.get('lessons') || { completed: [], currentDay: 1, hearts: 5 };
    const remote = serverPayload.lessons;
    const byId = new Map();
    [...(local.completed || []), ...(remote.completed || [])].forEach(c => {
      const prev = byId.get(c.id);
      if (!prev) byId.set(c.id, c);
      else byId.set(c.id, {
        ...prev, ...c,
        score: Math.max(prev.score || 0, c.score || 0),
        perfect: prev.perfect || c.perfect,
        total: prev.total || c.total
      });
    });
    store.set('lessons', {
      ...local,
      ...remote,
      completed: Array.from(byId.values()),
      currentDay: Math.max(local.currentDay || 1, remote.currentDay || 1),
      hearts: Math.min(local.hearts ?? 5, remote.hearts ?? 5)
    });
  }

  // Stories : union of completed
  if (serverPayload.storiesProgress) {
    const local = store.get('storiesProgress') || { completed: [] };
    const remote = serverPayload.storiesProgress;
    const ids = new Set([
      ...(local.completed || []).map(c => c.id),
      ...(remote.completed || []).map(c => c.id)
    ]);
    store.set('storiesProgress', {
      ...local, ...remote,
      completed: [...ids].map(id =>
        (remote.completed || []).find(c => c.id === id) ||
        (local.completed || []).find(c => c.id === id)
      ).filter(Boolean)
    });
  }

  // Receipts : union by id
  if (Array.isArray(serverPayload.receipts)) {
    const local = store.get('receipts') || [];
    const byId = new Map();
    [...local, ...serverPayload.receipts].forEach(r => byId.set(r.id, r));
    store.set('receipts', Array.from(byId.values()));
  }

  // User profile fields : server wins for cross-device consistency
  if (serverPayload.user) {
    const local = store.get('user') || {};
    store.set('user', { ...local, ...serverPayload.user });
  }
}

function isSignedIn() {
  return !!localStorage.getItem('kivu.token');
}

export const sync = {
  status() { return status; },
  lastSyncedAt() { return lastPushedAt; },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  /** Pull serveur puis merge local. À appeler après sign-in. */
  async pull() {
    if (!isSignedIn()) { emit('unauth'); return null; }
    emit('syncing');
    try {
      const data = await api.get('/sync/pull');
      if (data?.exists && data.payload) {
        mergeStates(data.payload);
        lastVersion = data.version || 0;
      }
      lastPushedAt = new Date();
      emit('success', { version: lastVersion });
      return data;
    } catch (err) {
      handleErr(err);
      throw err;
    }
  },

  /** Push immédiat. */
  async pushNow() {
    if (!isSignedIn()) { emit('unauth'); return null; }
    emit('syncing');
    try {
      const payload = pickSyncedSlice();
      const data = await api.post('/sync/push', { payload, clientVersion: lastVersion });
      lastVersion = data?.version || lastVersion + 1;
      lastPushedAt = new Date();
      emit('success', { version: lastVersion });
      return data;
    } catch (err) {
      handleErr(err);
      throw err;
    }
  },

  /** Push debounced (appelle pushNow après DEBOUNCE_MS d'inactivité). */
  pushSoon() {
    if (!isSignedIn()) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      this.pushNow().catch(() => {});
    }, DEBOUNCE_MS);
  },

  /** Démarre la boucle périodique. */
  startPeriodic() {
    if (timer) return;
    timer = setInterval(() => {
      if (!isSignedIn()) return;
      if (document.visibilityState !== 'visible') return;
      this.pushNow().catch(() => {});
    }, PERIODIC_MS);
  },

  stopPeriodic() {
    if (timer) { clearInterval(timer); timer = null; }
  },

  /** Manuel : pull puis push. */
  async syncNow() {
    if (!isSignedIn()) { emit('unauth'); return; }
    try {
      await this.pull();
      await this.pushNow();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Synchronisé avec le cloud', { type: 'success', duration: 1500 });
      }
    } catch {
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast('Échec de la synchronisation', { type: 'error' });
      }
    }
  }
};

function handleErr(err) {
  if (!navigator.onLine) {
    emit('offline');
    return;
  }
  if (err instanceof ApiError && err.status === 401) {
    emit('unauth');
    return;
  }
  emit('error', { message: err?.message });
}

// Auto pause/resume when tab visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isSignedIn()) {
    // Quick pull on focus to catch updates from another device
    sync.pull().catch(() => {});
  }
});

// Online/offline listeners
window.addEventListener('online', () => {
  if (isSignedIn()) sync.pushNow().catch(() => {});
});
window.addEventListener('offline', () => emit('offline'));
