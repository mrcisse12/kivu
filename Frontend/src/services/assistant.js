/**
 * KIVU — Service Assistant IA conversationnel.
 *
 * Gère :
 *   - Conversations multiples persistées dans store.assistant.conversations
 *   - Active conversation auto-créée si inexistante
 *   - Auto-titre généré depuis le premier message utilisateur
 *   - Envoi de messages → backend → réponse IA
 *   - Contexte utilisateur injecté (prénom, niveau, langue)
 */

import { store } from '../store.js';
import { api } from './api.js';

const MAX_TITLE_LEN = 38;

function getState() {
  return store.get('assistant') || { conversations: [], activeId: null };
}

function genId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function makeTitle(firstUserMessage) {
  const t = (firstUserMessage || '').trim().replace(/\s+/g, ' ');
  if (!t) return 'Nouvelle discussion';
  if (t.length <= MAX_TITLE_LEN) return t;
  return t.slice(0, MAX_TITLE_LEN - 1) + '…';
}

/** Get all conversations sorted by updatedAt desc. */
export function listConversations() {
  return [...(getState().conversations || [])].sort((a, b) => {
    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
  });
}

export function getActiveConversation() {
  const s = getState();
  if (!s.activeId) return null;
  return (s.conversations || []).find(c => c.id === s.activeId) || null;
}

export function setActiveConversation(id) {
  store.update('assistant', a => ({ ...(a || {}), activeId: id }));
}

/** Create a fresh conversation and make it active. */
export function newConversation() {
  const id = genId();
  const conv = {
    id,
    title: 'Nouvelle discussion',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  store.update('assistant', a => ({
    ...(a || {}),
    conversations: [conv, ...((a?.conversations) || [])],
    activeId: id
  }));
  return conv;
}

export function deleteConversation(id) {
  store.update('assistant', a => {
    const list = (a?.conversations || []).filter(c => c.id !== id);
    return {
      ...(a || {}),
      conversations: list,
      activeId: a?.activeId === id ? (list[0]?.id || null) : a?.activeId
    };
  });
}

export function renameConversation(id, title) {
  store.update('assistant', a => ({
    ...(a || {}),
    conversations: (a?.conversations || []).map(c =>
      c.id === id ? { ...c, title: (title || 'Sans titre').slice(0, 60), updatedAt: new Date().toISOString() } : c
    )
  }));
}

/** Append a message to the active conversation. Auto-create if needed. */
export function pushMessage({ role, content }) {
  let active = getActiveConversation();
  if (!active) active = newConversation();
  store.update('assistant', a => ({
    ...(a || {}),
    conversations: (a?.conversations || []).map(c => {
      if (c.id !== active.id) return c;
      const messages = [...(c.messages || []), { role, content, ts: new Date().toISOString() }];
      // Auto-title from first user message
      let title = c.title;
      if (title === 'Nouvelle discussion' && role === 'user') {
        title = makeTitle(content);
      }
      return { ...c, messages, title, updatedAt: new Date().toISOString() };
    })
  }));
}

/** Replace last message with an updated version (for streaming) */
export function updateLastMessage(content) {
  const active = getActiveConversation();
  if (!active) return;
  store.update('assistant', a => ({
    ...(a || {}),
    conversations: (a?.conversations || []).map(c => {
      if (c.id !== active.id) return c;
      const messages = [...(c.messages || [])];
      if (messages.length === 0) return c;
      messages[messages.length - 1] = { ...messages[messages.length - 1], content };
      return { ...c, messages, updatedAt: new Date().toISOString() };
    })
  }));
}

/** Drop the last message (e.g. on regenerate). */
export function popLastMessage() {
  const active = getActiveConversation();
  if (!active) return null;
  let popped = null;
  store.update('assistant', a => ({
    ...(a || {}),
    conversations: (a?.conversations || []).map(c => {
      if (c.id !== active.id) return c;
      const messages = [...(c.messages || [])];
      popped = messages.pop();
      return { ...c, messages, updatedAt: new Date().toISOString() };
    })
  }));
  return popped;
}

/** Build the user context object for the backend system prompt */
function buildUserContext() {
  const u = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const LANG_NAMES = {
    swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
    hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo',
    lin: 'Lingala', fra: 'Français', eng: 'Anglais', amh: 'Amharique', ara: 'Arabe', por: 'Portugais'
  };
  return {
    name: u.name || '',
    motherTongue: LANG_NAMES[u.motherTongue] || u.motherTongueLabel || '',
    learning: LANG_NAMES[lessons.targetLang] || '',
    level: u.level || '',
    streak: u.stats?.streak || 0,
    xp: u.stats?.xp || 0
  };
}

/**
 * Send the conversation to the backend and return the assistant reply.
 * Caps history to last 20 turns. Returns { reply, provider, model }.
 */
export async function sendToAssistant() {
  const active = getActiveConversation();
  if (!active) throw new Error('No active conversation');

  const messages = (active.messages || [])
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))
    .slice(-20);

  const userContext = buildUserContext();
  const targetLanguage = userContext.motherTongue ? 'fra' : 'fra'; // always FR for now

  const res = await api.post('/assistant/chat', {
    messages,
    targetLanguage,
    userContext
  });

  return {
    reply: res.reply || '',
    provider: res.provider || 'unknown',
    model: res.model || ''
  };
}

/** Welcome examples shown when conversation is empty */
export const WELCOME_EXAMPLES = [
  { emoji: '🌍', label: 'Voyager en Afrique de l\'Ouest', prompt: 'Donne-moi 8 phrases essentielles à connaître en Wolof pour un voyage de 2 semaines au Sénégal, avec leur prononciation phonétique.' },
  { emoji: '📖', label: 'Histoire et culture',          prompt: 'Raconte-moi l\'histoire du Royaume du Mali à l\'époque de Mansa Musa, en 5 paragraphes structurés.' },
  { emoji: '🎓', label: 'Apprentissage personnalisé',   prompt: 'Crée un plan d\'apprentissage de 4 semaines pour atteindre un niveau A1 en Swahili, avec des objectifs hebdomadaires.' },
  { emoji: '💬', label: 'Proverbes & sagesse',          prompt: 'Donne-moi 5 proverbes Bambara avec leur traduction française et leur signification culturelle.' },
  { emoji: '🍲', label: 'Cuisine africaine',            prompt: 'Comment préparer un Thiéboudienne authentique, étape par étape ?' },
  { emoji: '🎵', label: 'Musique & art',                prompt: 'Présente-moi 5 artistes contemporains de la diaspora africaine, en mentionnant leur style et leur impact.' }
];
