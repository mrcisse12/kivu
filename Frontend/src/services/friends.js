/**
 * KIVU — Système d'amis (mode local).
 *
 * Sans backend partagé, on simule une expérience sociale convaincante :
 *   - Chaque utilisateur a un code KIVU unique stable (KIVU-XXX-NNNN)
 *   - Pool de "membres KIVU" suggérés (diaspora africaine + locuteurs)
 *   - L'utilisateur peut ajouter par code (fictif ou suggéré) — l'API
 *     simulée résout le code vers un profil du pool ou en génère un.
 *   - Encouragements (emojis) journalisés et notifiés.
 *   - Mini-feed d'activité = amis combinés à mes propres actions.
 */

import { store } from '../store.js';
import { notifications } from './notifications.js';

const SAMPLE_FRIENDS = [
  { name: 'Aïcha Diallo',    avatar: '👩🏾', country: 'Guinée',          countryFlag: '🇬🇳', learning: 'wol', level: 12, xp: 4280, streak: 18, online: true,  hint: 'Apprend le Wolof depuis 6 mois' },
  { name: 'Koffi Mensah',    avatar: '👨🏾', country: 'Bénin',           countryFlag: '🇧🇯', learning: 'bam', level: 9,  xp: 3120, streak: 11, online: true,  hint: 'Passionné de la culture mandingue' },
  { name: 'Amara Traoré',    avatar: '🧑🏾', country: 'Mali',            countryFlag: '🇲🇱', learning: 'swa', level: 7,  xp: 2340, streak: 5,  online: false, hint: 'Voyage souvent en Afrique de l\'Est' },
  { name: 'Fatou Ndiaye',    avatar: '👩🏿', country: 'Sénégal',         countryFlag: '🇸🇳', learning: 'yor', level: 14, xp: 5120, streak: 24, online: true,  hint: 'Étudiante en linguistique' },
  { name: 'Pierre Mendy',    avatar: '🧑🏾', country: 'Guinée-Bissau',   countryFlag: '🇬🇼', learning: 'hau', level: 6,  xp: 1820, streak: 3,  online: false, hint: 'Aime apprendre des proverbes' },
  { name: 'Awa Cissé',       avatar: '👩🏿', country: 'Mali',            countryFlag: '🇲🇱', learning: 'swa', level: 4,  xp: 1280, streak: 7,  online: true,  hint: 'Première semaine sur KIVU' },
  { name: 'Seun Adebayo',    avatar: '👨🏿', country: 'Nigeria',         countryFlag: '🇳🇬', learning: 'zul', level: 11, xp: 3960, streak: 15, online: false, hint: 'Travaille à Johannesburg' },
  { name: 'Marie Kabongo',   avatar: '👩🏾', country: 'RD Congo',        countryFlag: '🇨🇩', learning: 'lin', level: 8,  xp: 2680, streak: 9,  online: true,  hint: 'Préserve les chants Lingala' },
  { name: 'Dr. Nkosi',       avatar: '👨🏿', country: 'Afrique du Sud',  countryFlag: '🇿🇦', learning: 'ibo', level: 16, xp: 6420, streak: 32, online: true,  hint: 'Polyglotte, parle 6 langues' },
  { name: 'Mamadou Bah',     avatar: '🧑🏿', country: 'Guinée',          countryFlag: '🇬🇳', learning: 'bam', level: 5,  xp: 1540, streak: 6,  online: false, hint: 'Étudie en France' }
];

const ACTIVITY_TEMPLATES = {
  lesson:        ['a complété une nouvelle leçon', 'vient de terminer la leçon du jour', 'a réussi une leçon parfaite ✨'],
  streak:        ['continue sa série 🔥', 'maintient une série incroyable', 'bat son record de série !'],
  level:         ['a atteint un nouveau niveau 🚀', 'a passé un palier'],
  contribution:  ['a enregistré un proverbe', 'a contribué à la préservation', 'a partagé un mot rare'],
  story:         ['a découvert une nouvelle histoire 📖', 'lit une histoire en ce moment'],
  encouragement: ['t\'a envoyé un encouragement']
};

const ENCOURAGEMENT_EMOJIS = ['🔥', '👏', '❤️', '💪', '⭐', '👍', '🎉', '🚀'];

/* ─── KIVU Code generation ─────────────────────────── */

/** Build a stable 3-letter prefix from name (initials or first 3 chars). */
function namePrefix(name) {
  const clean = (name || 'KIVU').trim().toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z\s]/g, '');
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0] + (parts[2]?.[0] || parts[1][1] || parts[0][1] || 'X')).slice(0, 3).padEnd(3, 'X');
  }
  return (clean.replace(/\s/g, '').slice(0, 3) || 'KIV').padEnd(3, 'X');
}

/** Simple deterministic hash to a 4-digit number from name + salt. */
function hashCode(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
  return Math.abs(h);
}

/** Generate a stable KIVU code for a user. */
export function generateKivuCode(name, salt = '') {
  const prefix = namePrefix(name);
  const num = (hashCode((name || '') + salt) % 9000) + 1000;
  return `KIVU-${prefix}-${num}`;
}

/** Ensure the current user has a KIVU code. Idempotent. */
export function ensureUserCode() {
  const u = store.get('user') || {};
  if (u.code) return u.code;
  // Use a stable salt (today + name) so the code is regenerated only once
  const code = generateKivuCode(u.name || 'KIVU', String(Date.now()));
  store.update('user', cur => ({ ...cur, code }));
  return code;
}

/* ─── Friends list management ──────────────────────── */

function getFriendsState() {
  return store.get('friends') || { list: [], activity: [], received: [], suggestionsHidden: [], seeded: false };
}

/** Seed the suggestion pool with stable codes (called once). */
export function seedSuggestions() {
  const cur = getFriendsState();
  if (cur.seeded) return;
  store.set('friends', { ...cur, seeded: true });
}

/** Get list of suggested friends NOT already added and NOT hidden. */
export function getSuggestions() {
  const state = getFriendsState();
  const addedNames = new Set((state.list || []).map(f => f.name));
  const hidden = new Set(state.suggestionsHidden || []);
  return SAMPLE_FRIENDS
    .filter(f => !addedNames.has(f.name) && !hidden.has(f.name))
    .map(f => ({
      ...f,
      id: 'fr_' + f.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      code: generateKivuCode(f.name, f.country)
    }));
}

/** Hide a suggestion (don't show again unless reset) */
export function dismissSuggestion(name) {
  store.update('friends', s => ({
    ...(s || {}),
    suggestionsHidden: [...new Set([...(s?.suggestionsHidden || []), name])]
  }));
}

/** Friends list (sorted: online first, then by xp desc). */
export function getFriends() {
  const state = getFriendsState();
  return [...(state.list || [])].sort((a, b) => {
    if (a.online !== b.online) return b.online - a.online;
    return (b.xp || 0) - (a.xp || 0);
  });
}

export function getFriend(id) {
  return (getFriendsState().list || []).find(f => f.id === id);
}

/** Add a friend (from a suggestion or a code lookup). */
export function addFriend(friendData) {
  const state = getFriendsState();
  const exists = (state.list || []).some(f => f.id === friendData.id || f.name === friendData.name);
  if (exists) return false;
  const friend = {
    ...friendData,
    addedAt: new Date().toISOString()
  };
  const list = [friend, ...(state.list || [])];
  // Generate a recent activity for the friend
  const activity = generateInitialActivity(friend);
  store.set('friends', {
    ...state,
    list,
    activity: [activity, ...(state.activity || [])].slice(0, 100)
  });
  return true;
}

/** Add a friend by KIVU code. Looks up suggestion pool first, else creates a stub. */
export function addFriendByCode(code) {
  const cleaned = (code || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned.startsWith('KIVU-') || cleaned.length < 12) {
    return { ok: false, error: 'Code invalide. Format attendu : KIVU-XXX-NNNN' };
  }
  // Check pool
  const pool = SAMPLE_FRIENDS.map(f => ({ ...f, id: 'fr_' + f.name.toLowerCase().replace(/[^a-z0-9]/g, ''), code: generateKivuCode(f.name, f.country) }));
  const found = pool.find(f => f.code === cleaned);
  if (found) {
    if (addFriend(found)) return { ok: true, friend: found };
    return { ok: false, error: 'Cet ami est déjà dans ta liste' };
  }
  // Generate a stub friend from the code
  const stub = {
    id: 'fr_code_' + cleaned.replace(/[^A-Z0-9]/g, '').toLowerCase(),
    code: cleaned,
    name: 'Ami KIVU ' + cleaned.split('-').slice(-1)[0],
    avatar: ['🧑🏾','👩🏾','👨🏾','🧑🏿'][hashCode(cleaned) % 4],
    country: 'Inconnu',
    countryFlag: '🌍',
    learning: ['swa','wol','bam','hau','yor','zul','ibo'][hashCode(cleaned + 'l') % 7],
    level: (hashCode(cleaned + 'lv') % 14) + 1,
    xp: ((hashCode(cleaned + 'xp') % 50) + 5) * 100,
    streak: hashCode(cleaned + 's') % 20,
    online: hashCode(cleaned + 'o') % 2 === 0,
    hint: 'Membre KIVU rejoint via code'
  };
  if (addFriend(stub)) return { ok: true, friend: stub };
  return { ok: false, error: 'Impossible d\'ajouter cet ami' };
}

export function removeFriend(id) {
  store.update('friends', s => ({
    ...(s || {}),
    list: (s?.list || []).filter(f => f.id !== id),
    activity: (s?.activity || []).filter(a => a.friendId !== id),
    received: (s?.received || []).filter(r => r.from !== id)
  }));
}

/* ─── Activity feed ────────────────────────────────── */

function generateInitialActivity(friend) {
  const tpls = ACTIVITY_TEMPLATES.lesson;
  return {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    friendId: friend.id,
    kind: 'join',
    text: 'a rejoint ton réseau — accueille-le !',
    icon: '🤝',
    date: new Date().toISOString(),
    reactions: {}
  };
}

/** Push a new activity entry (from a friend or self). */
export function pushActivity({ friendId = null, kind = 'lesson', text, icon = '✨' }) {
  const state = getFriendsState();
  const entry = {
    id: 'act_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    friendId, kind, text, icon,
    date: new Date().toISOString(),
    reactions: {}
  };
  store.set('friends', {
    ...state,
    activity: [entry, ...(state.activity || [])].slice(0, 100)
  });
  return entry;
}

/** React to an activity entry with an emoji. */
export function reactToActivity(activityId, emoji) {
  store.update('friends', s => ({
    ...(s || {}),
    activity: (s?.activity || []).map(a => {
      if (a.id !== activityId) return a;
      const reactions = { ...(a.reactions || {}) };
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      return { ...a, reactions };
    })
  }));
}

/** Get activity feed (recent first), enriched with friend info. */
export function getActivityFeed(limit = 30) {
  const state = getFriendsState();
  return (state.activity || [])
    .slice(0, limit)
    .map(a => {
      const friend = a.friendId ? (state.list || []).find(f => f.id === a.friendId) : null;
      return { ...a, friend };
    });
}

/* ─── Encouragements ───────────────────────────────── */

export function sendEncouragement(friendId, emoji = '🔥', message = '') {
  const friend = getFriend(friendId);
  if (!friend) return false;
  // Log activity (visible from "Récents" feed)
  pushActivity({
    friendId,
    kind: 'encouragement',
    text: `Tu as envoyé ${emoji} à ${friend.name}`,
    icon: emoji
  });
  // Simulate friend reaction (1.5–4s later)
  const delay = 1500 + Math.random() * 2500;
  setTimeout(() => {
    const reciprocateEmoji = ENCOURAGEMENT_EMOJIS[Math.floor(Math.random() * ENCOURAGEMENT_EMOJIS.length)];
    pushActivity({
      friendId,
      kind: 'encouragement',
      text: `${friend.name} t'a renvoyé ${reciprocateEmoji} en retour !`,
      icon: reciprocateEmoji
    });
    notifications.push({
      type: 'community',
      icon: reciprocateEmoji,
      title: `${friend.name.split(' ')[0]} t'encourage`,
      body: `«${reciprocateEmoji}» Continue, tu progresses bien !`,
      actionPath: '/friends'
    });
  }, delay);
  return true;
}

export const ENCOURAGEMENTS = ENCOURAGEMENT_EMOJIS;

/* ─── Self-activity tracking (auto from store events) ── */

/** Generate a "you just X" entry visible to your future-self in the feed. */
export function recordSelfActivity({ kind = 'lesson', text, icon = '✨' }) {
  pushActivity({ friendId: null, kind, text, icon });
}
