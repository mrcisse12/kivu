/**
 * KIVU — Assistant IA conversationnel premium.
 *
 * - Conversations multiples persistées avec drawer
 * - Welcome screen avec 6 exemples de prompts
 * - Markdown renderer (titres, gras, listes, code)
 * - Typewriter effect simulé (caractère par caractère)
 * - Bouton stop / regenerate / copy / nouvelle conversation
 * - Voice input (mic)
 * - TTS auto sur réponse (toggle)
 * - Affiche le modèle utilisé (Anthropic Sonnet, OpenAI, Offline)
 */

import { icons } from '../components/icons.js';
import { store } from '../store.js';
import { speech } from '../services/speech.js';
import { fx } from '../services/audio-fx.js';
import { renderMarkdown, stripMarkdown } from '../services/markdown.js';
import { offlineReply, isNetworkError } from '../services/offline-ai.js';
import { confirmModal } from '../services/dialog.js';
import { api } from '../services/api.js';
import {
  listConversations,
  getActiveConversation,
  setActiveConversation,
  newConversation,
  deleteConversation,
  pushMessage,
  updateLastMessage,
  popLastMessage,
  sendToAssistant,
  streamFromAssistant,
  WELCOME_EXAMPLES
} from '../services/assistant.js';

let drawerOpen = false;
let isStreaming = false;
let streamCancel = null;
let lastProvider = '';
let lastModel = '';
let inputValue = '';
let speakReplies = false;   // TTS auto-read AI replies

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return `${d} j`;
}

function providerBadge() {
  if (!lastProvider) return '';
  const labels = {
    anthropic: { name: 'Claude Sonnet 4.5', color: '#D97757', icon: '✨', online: true },
    openai:    { name: 'GPT-4o',            color: '#10A37F', icon: '🤖', online: true },
    offline:   { name: 'Mode hors-ligne',   color: '#999',    icon: '📴', online: false }
  };
  const meta = labels[lastProvider] || labels.offline;
  // When in offline mode, the badge becomes a button that re-tests connection
  if (!meta.online) {
    return `
      <button class="ai-provider-badge ai-provider-badge--retry" data-action="retry-online"
              style="--provider-color: ${meta.color};" title="Réessayer la connexion">
        ${meta.icon} ${meta.name}
        <span class="ai-provider-badge__retry">↻</span>
      </button>
    `;
  }
  return `
    <span class="ai-provider-badge" style="--provider-color: ${meta.color};">
      ${meta.icon} ${meta.name}
    </span>
  `;
}

/* ─── Main render ──────────────────────────────────────── */

export function renderAssistant() {
  const active = getActiveConversation();
  const conversations = listConversations();
  const isEmpty = !active || (active.messages || []).length === 0;

  return `
    <div class="assistant-page">
      <!-- Header -->
      <header class="assistant-header">
        <button class="icon-btn" data-action="toggle-drawer" aria-label="Conversations" title="Mes conversations">
          ${icons.users(20)}
          ${conversations.length > 0 ? `<span class="ai-conv-count">${conversations.length}</span>` : ''}
        </button>
        <div class="assistant-header__title">
          <span class="screen-icon assistant-header__icon">
            ${icons.assistant(22, 'white')}
          </span>
          <div>
            <div class="font-display font-bold" style="font-size:1.05rem; line-height:1.2;">Kivi</div>
            <div class="text-xs text-muted" style="line-height:1.2;">${active && (active.messages || []).length > 0 ? escapeHtml(active.title) : 'Assistant IA'}</div>
          </div>
        </div>
        <div class="flex items-center gap-xs">
          ${providerBadge()}
          <button class="icon-btn" data-action="new-chat" aria-label="Nouvelle conversation" title="Nouvelle conversation">
            ${icons.plus(20)}
          </button>
        </div>
      </header>

      <!-- Conversations drawer -->
      ${drawerOpen ? renderDrawer(conversations, active?.id) : ''}

      <!-- Messages stream -->
      <div class="assistant-stream" id="assistant-stream">
        ${isEmpty ? renderWelcome() : renderMessages(active.messages)}
        ${isStreaming ? renderTypingBubble() : ''}
      </div>

      <!-- Input -->
      <div class="assistant-input-wrap">
        ${isStreaming ? `
          <button class="btn btn-ghost btn-sm assistant-stop"
                  data-action="stop-stream" style="margin-bottom: 8px;">
            ⏹ Arrêter la génération
          </button>
        ` : ''}
        <div class="chat-input">
          <button class="icon-btn icon-btn--mic" data-action="voice-input" aria-label="Dictée vocale" title="Dictée vocale">
            ${icons.mic(20, 'currentColor')}
          </button>
          <textarea id="assistant-input"
                    class="form-input chat-input__field assistant-textarea"
                    placeholder="Pose ta question à Kivi… (Maj+Entrée pour ligne)"
                    rows="1"
                    aria-label="Message">${escapeHtml(inputValue)}</textarea>
          <button class="icon-btn icon-btn--send" data-action="send" aria-label="Envoyer"
                  ${isStreaming ? 'disabled' : ''}>
            ${icons.send(20, 'white')}
          </button>
        </div>
        <div class="assistant-foot text-xs text-muted">
          <button class="link-btn" data-action="toggle-tts" style="font-weight: 600;">
            ${speakReplies ? '🔊 Lecture audio active' : '🔇 Lecture audio'}
          </button>
          <span style="opacity:0.6;">·</span>
          <span>Kivi peut se tromper — vérifie les infos importantes.</span>
        </div>
      </div>
    </div>
  `;
}

/* ─── Welcome screen ───────────────────────────────────── */

function renderWelcome() {
  const user = store.get('user') || {};
  const firstName = (user.name || '').split(' ')[0] || 'toi';
  return `
    <div class="ai-welcome">
      <div class="ai-welcome__hero">
        <div class="ai-welcome__icon">${icons.assistant(48, 'white')}</div>
        <h1 class="font-display font-bold" style="font-size: 1.75rem; margin: 16px 0 8px;">
          Bonjour ${escapeHtml(firstName)} 👋
        </h1>
        <p class="text-sm text-muted" style="max-width: 440px; margin: 0 auto 24px;">
          Je suis <strong>Kivi</strong>, ton assistant IA propulsé par <strong>Claude Sonnet 4.5</strong>.
          Pose-moi n'importe quelle question — sur les langues africaines, la culture,
          les sciences, le code, ou tout autre sujet.
        </p>
      </div>

      <div class="ai-welcome__examples">
        <div class="text-xs text-muted mb-sm" style="text-align: center; letter-spacing: 0.6px; text-transform: uppercase; font-weight: 700;">
          Exemples pour démarrer
        </div>
        <div class="grid grid-2" style="gap: 10px;">
          ${WELCOME_EXAMPLES.map(ex => `
            <button class="ai-example-card" data-action="example" data-prompt="${escapeHtml(ex.prompt)}">
              <span class="ai-example-card__emoji" aria-hidden="true">${ex.emoji}</span>
              <div class="ai-example-card__body">
                <div class="font-semibold text-sm">${ex.label}</div>
                <div class="text-xs text-muted ai-example-card__hint">${escapeHtml(ex.prompt)}</div>
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ai-welcome__capabilities">
        <div class="ai-cap"><span aria-hidden="true">🌍</span> 2 000+ langues africaines</div>
        <div class="ai-cap"><span aria-hidden="true">📚</span> Histoire & culture</div>
        <div class="ai-cap"><span aria-hidden="true">💻</span> Code & sciences</div>
        <div class="ai-cap"><span aria-hidden="true">✍️</span> Rédaction & créativité</div>
      </div>
    </div>
  `;
}

/* ─── Messages ─────────────────────────────────────────── */

function renderMessages(messages) {
  return messages.map((m, i) => renderBubble(m, i, messages.length)).join('');
}

function renderBubble(m, index, total) {
  const user = store.get('user');
  const avatar = user?.avatar || '🧑🏾';
  const isLast = index === total - 1;

  if (m.role === 'assistant') {
    const html = renderMarkdown(m.content);
    return `
      <div class="bubble-row bubble-row--ai">
        <span class="bubble-avatar bubble-avatar--ai" aria-hidden="true">${icons.assistant(18, 'white')}</span>
        <div class="bubble bubble--ai">
          <div class="bubble__content">${html}</div>
          <div class="bubble__actions">
            <button class="bubble-action" data-action="copy-msg" data-index="${index}" title="Copier">
              ${icons.copy(14)}
            </button>
            <button class="bubble-action" data-action="speak-msg" data-index="${index}" title="Lire à voix haute">
              ${icons.speaker(14)}
            </button>
            ${isLast ? `
              <button class="bubble-action" data-action="regenerate" title="Régénérer cette réponse">
                ${icons.refresh(14)}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="bubble-row bubble-row--user">
      <div class="bubble bubble--user">${escapeHtml(m.content).replace(/\n/g, '<br>')}</div>
      <span class="bubble-avatar bubble-avatar--user" aria-hidden="true">${avatar}</span>
    </div>
  `;
}

function renderTypingBubble() {
  return `
    <div class="bubble-row bubble-row--ai">
      <span class="bubble-avatar bubble-avatar--ai" aria-hidden="true">${icons.assistant(18, 'white')}</span>
      <div class="bubble bubble--ai bubble--typing">
        <span class="typing-dots"><span></span><span></span><span></span></span>
        <span class="text-xs text-muted" style="margin-left: 8px;">Kivi réfléchit…</span>
      </div>
    </div>
  `;
}

/* ─── Drawer (conversations list) ──────────────────────── */

function renderDrawer(conversations, activeId) {
  return `
    <aside class="ai-drawer" data-stop="true">
      <div class="ai-drawer__head">
        <strong>Mes conversations</strong>
        <button class="icon-btn icon-btn--sm" data-action="toggle-drawer" aria-label="Fermer">
          ${icons.close(18)}
        </button>
      </div>
      <button class="btn btn-primary btn-full" data-action="new-chat" style="margin-bottom: 10px;">
        ${icons.plus(14)} Nouvelle discussion
      </button>
      <div class="ai-drawer__list">
        ${conversations.length === 0 ? `
          <div class="text-xs text-muted" style="text-align: center; padding: 20px 0;">
            Aucune conversation pour l'instant
          </div>
        ` : conversations.map(c => `
          <div class="ai-conv-row ${c.id === activeId ? 'is-active' : ''}">
            <button class="ai-conv-row__main" data-action="open-conv" data-id="${c.id}">
              <div class="ai-conv-row__title">${escapeHtml(c.title)}</div>
              <div class="ai-conv-row__sub">${(c.messages || []).length} message${(c.messages || []).length > 1 ? 's' : ''} · ${relTime(c.updatedAt)}</div>
            </button>
            <button class="icon-btn icon-btn--xs" data-action="del-conv" data-id="${c.id}" aria-label="Supprimer">
              ${icons.trash(14)}
            </button>
          </div>
        `).join('')}
      </div>
    </aside>
  `;
}

/* ─── Mount / interactions ─────────────────────────────── */

function rerender(scrollToBottom = false) {
  const main = document.querySelector('main.screen');
  if (!main) return;
  main.innerHTML = renderAssistant();
  renderAssistant.mount();
  if (scrollToBottom) {
    requestAnimationFrame(() => {
      const stream = document.getElementById('assistant-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    });
  }
}

/** Simulate a typewriter effect on the assistant's reply */
async function typeReply(fullText) {
  const stream = document.getElementById('assistant-stream');
  if (!stream) {
    updateLastMessage(fullText);
    rerender(true);
    return;
  }
  // Find the assistant's last bubble's content node
  const last = stream.querySelector('.bubble-row--ai:last-of-type .bubble__content');
  if (!last) {
    updateLastMessage(fullText);
    rerender(true);
    return;
  }

  const total = fullText.length;
  // Speed: ~600 chars/sec for short, slower for long; capped to not flood RAF
  const chunkSize = Math.max(2, Math.ceil(total / 80));
  const intervalMs = 12;
  let i = 0;
  return new Promise(resolve => {
    const tick = () => {
      if (!isStreaming) {
        // Cancelled — just show full
        updateLastMessage(fullText);
        rerender(true);
        return resolve();
      }
      i = Math.min(total, i + chunkSize);
      const partial = fullText.slice(0, i);
      last.innerHTML = renderMarkdown(partial);
      stream.scrollTop = stream.scrollHeight;
      if (i >= total) {
        // Done — persist the full reply
        updateLastMessage(fullText);
        return resolve();
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

async function send(text) {
  const trimmed = (text || '').trim();
  if (!trimmed || isStreaming) return;

  // Ensure there's an active conversation
  if (!getActiveConversation()) newConversation();

  inputValue = '';
  fx.click();

  // 1. Push user message
  pushMessage({ role: 'user', content: trimmed });

  isStreaming = true;
  rerender(true);

  let reply = '';
  let usedStreaming = false;

  // Try streaming first (best UX — text appears word-by-word)
  try {
    // Push empty assistant bubble immediately so streaming has a place to render
    pushMessage({ role: 'assistant', content: '' });
    rerender(true);

    const result = await streamFromAssistant((chunk, full) => {
      // Live update the last assistant message
      updateLastMessage(full);
      // Re-render the bubble content efficiently
      const stream = document.getElementById('assistant-stream');
      if (stream) {
        const last = stream.querySelector('.bubble-row--ai:last-of-type .bubble__content');
        if (last) {
          last.innerHTML = renderMarkdown(full);
          stream.scrollTop = stream.scrollHeight;
        }
      }
    });
    reply = result.fullText;
    lastProvider = result.provider;
    lastModel = result.model;
    usedStreaming = true;
  } catch (err) {
    // Streaming failed — pop the empty assistant bubble and fall back
    popLastMessage();
    if (isNetworkError(err)) {
      reply = offlineReply(trimmed);
      lastProvider = 'offline';
      lastModel = 'KIVU AI Engine';
    } else {
      // Try non-streaming once more before falling back to offline
      try {
        const result = await sendToAssistant();
        reply = result.reply;
        lastProvider = result.provider;
        lastModel = result.model;
      } catch (err2) {
        if (isNetworkError(err2)) {
          reply = offlineReply(trimmed);
          lastProvider = 'offline';
          lastModel = 'KIVU AI Engine';
        } else {
          reply = `⚠️ Une erreur s'est produite : ${err2?.message || err2}.\n\nLe serveur IA a renvoyé une erreur. Réessaie dans quelques instants.`;
          lastProvider = 'offline';
        }
      }
    }
  }

  if (!usedStreaming) {
    // Push the empty bubble and run the typewriter for non-streaming responses
    pushMessage({ role: 'assistant', content: '' });
    rerender(true);
    await typeReply(reply || 'Pas de réponse.');
  } else {
    // Streaming already filled the bubble — just persist and finalize
    updateLastMessage(reply || 'Pas de réponse.');
  }
  isStreaming = false;
  rerender(true);

  // TTS if enabled
  if (speakReplies && reply && speech.ttsSupported) {
    const plain = stripMarkdown(reply);
    speech.speakAsKivi(plain);
  }
}

renderAssistant.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  // Ensure there's at least one conversation
  if (!getActiveConversation()) {
    const conversations = listConversations();
    if (conversations.length > 0) {
      setActiveConversation(conversations[0].id);
    } else {
      newConversation();
    }
  }

  // Auto-resize textarea
  const textarea = document.getElementById('assistant-input');
  if (textarea) {
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(120, textarea.scrollHeight) + 'px';
    };
    autoResize();
    textarea.addEventListener('input', () => {
      inputValue = textarea.value;
      autoResize();
    });
    textarea.addEventListener('keydown', (e) => {
      // Enter sends, Shift+Enter inserts newline
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send(textarea.value);
      }
    });
    // Auto-focus when not in welcome
    if (getActiveConversation()?.messages?.length > 0) {
      setTimeout(() => textarea.focus(), 50);
    }
  }

  // Send button
  document.querySelectorAll('[data-action="send"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const ta = document.getElementById('assistant-input');
      if (ta) send(ta.value);
    })
  );

  // Stop streaming
  document.querySelectorAll('[data-action="stop-stream"]').forEach(btn =>
    btn.addEventListener('click', () => {
      isStreaming = false;
      fx.click();
      rerender(true);
    })
  );

  // Welcome examples
  document.querySelectorAll('[data-action="example"]').forEach(btn =>
    btn.addEventListener('click', () => send(btn.dataset.prompt))
  );

  // Toggle drawer
  document.querySelectorAll('[data-action="toggle-drawer"]').forEach(btn =>
    btn.addEventListener('click', () => {
      drawerOpen = !drawerOpen;
      fx.click();
      rerender();
    })
  );

  // Retry online mode (when stuck in "Mode hors-ligne")
  document.querySelectorAll('[data-action="retry-online"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      btn.disabled = true;
      btn.classList.add('is-checking');
      const span = btn.querySelector('.ai-provider-badge__retry');
      if (span) span.textContent = '⟳';
      try {
        // Probe the backend health endpoint
        const ctrl = new AbortController();
        const timeoutId = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(api.baseUrl + '/health', {
          signal: ctrl.signal
        }).catch(() => null);
        clearTimeout(timeoutId);
        if (res && res.ok) {
          // Backend is reachable! Reset state and let next message use it
          lastProvider = '';
          fx.success();
          if (window.__KIVU__?.toast) {
            window.__KIVU__.toast('🌐 Backend détecté ! Tape ton prochain message pour activer Claude/GPT-4o.', { type: 'success', duration: 4000 });
          }
        } else {
          if (window.__KIVU__?.toast) {
            window.__KIVU__.toast('Backend toujours injoignable. Vérifie qu\'il tourne sur localhost:5000.', { type: 'warning', duration: 4000 });
          }
        }
      } catch {
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Impossible de joindre le backend.', { type: 'error' });
        }
      }
      rerender();
    })
  );

  // New conversation
  document.querySelectorAll('[data-action="new-chat"]').forEach(btn =>
    btn.addEventListener('click', () => {
      newConversation();
      drawerOpen = false;
      lastProvider = '';
      fx.click();
      rerender(true);
    })
  );

  // Open existing conversation
  document.querySelectorAll('[data-action="open-conv"]').forEach(btn =>
    btn.addEventListener('click', () => {
      setActiveConversation(btn.dataset.id);
      drawerOpen = false;
      fx.click();
      rerender(true);
    })
  );

  // Delete conversation
  document.querySelectorAll('[data-action="del-conv"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const ok = await confirmModal({
        icon: '🗑️',
        title: 'Supprimer cette conversation ?',
        message: 'Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Garder',
        danger: true
      });
      if (!ok) return;
      deleteConversation(btn.dataset.id);
      rerender();
    })
  );

  // Copy message
  document.querySelectorAll('[data-action="copy-msg"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const idx = Number(btn.dataset.index);
      const conv = getActiveConversation();
      const msg = conv?.messages?.[idx];
      if (!msg) return;
      try {
        await navigator.clipboard.writeText(msg.content);
        fx.coin();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast('Réponse copiée ✨', { type: 'success', duration: 1400 });
        }
      } catch {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Impossible de copier', { type: 'error' });
      }
    })
  );

  // Speak message (TTS one-off)
  document.querySelectorAll('[data-action="speak-msg"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      const conv = getActiveConversation();
      const msg = conv?.messages?.[idx];
      if (!msg || !speech.ttsSupported) return;
      const plain = stripMarkdown(msg.content);
      speech.speakAsKivi(plain);
      fx.click();
    })
  );

  // Regenerate last reply
  document.querySelectorAll('[data-action="regenerate"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (isStreaming) return;
      const conv = getActiveConversation();
      if (!conv || !conv.messages?.length) return;
      // Pop last assistant message — previous user message stays.
      // Find that user message to feed offline fallback if needed.
      const lastUser = [...(conv.messages || [])].reverse().find(m => m.role === 'user')?.content || '';
      popLastMessage();
      isStreaming = true;
      fx.click();
      rerender(true);

      let reply = '';
      try {
        const result = await sendToAssistant();
        reply = result.reply;
        lastProvider = result.provider;
        lastModel = result.model;
      } catch (err) {
        if (isNetworkError(err)) {
          reply = offlineReply(lastUser);
          lastProvider = 'offline';
          lastModel = 'KIVU AI Engine';
        } else {
          reply = `⚠️ Erreur : ${err?.message || err}`;
          lastProvider = 'offline';
        }
      }
      // Push empty assistant message, hide typing dots, animate
      pushMessage({ role: 'assistant', content: '' });
      rerender(true);
      await typeReply(reply || 'Pas de réponse.');
      isStreaming = false;
      rerender(true);
    })
  );

  // Toggle TTS auto-read
  document.querySelectorAll('[data-action="toggle-tts"]').forEach(btn =>
    btn.addEventListener('click', () => {
      speakReplies = !speakReplies;
      fx.click();
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(speakReplies ? '🔊 Lecture audio activée' : '🔇 Lecture audio désactivée', { type: 'info', duration: 1400 });
      }
      rerender();
    })
  );

  // Voice input (mic)
  let stopVoiceStt = null;
  document.querySelectorAll('[data-action="voice-input"]').forEach(btn =>
    btn.addEventListener('click', () => {
      if (stopVoiceStt) {
        stopVoiceStt();
        stopVoiceStt = null;
        btn.classList.remove('is-recording');
        return;
      }
      if (!speech.sttSupported) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Reconnaissance vocale non disponible', { type: 'warning' });
        return;
      }
      btn.classList.add('is-recording');
      stopVoiceStt = speech.startListening('fra', {
        onResult: ({ text, isFinal }) => {
          const inputEl = document.getElementById('assistant-input');
          if (inputEl) {
            inputEl.value = text;
            inputValue = text;
          }
          if (isFinal && text.trim()) {
            stopVoiceStt = null;
            btn.classList.remove('is-recording');
            send(text.trim());
          }
        },
        onError: () => { stopVoiceStt = null; btn.classList.remove('is-recording'); },
        onEnd:   () => { stopVoiceStt = null; btn.classList.remove('is-recording'); }
      });
    })
  );

  // Backdrop click closes drawer
  if (drawerOpen) {
    const backdrop = main;
    const onClickAway = (e) => {
      if (!e.target.closest('[data-stop="true"]') && !e.target.closest('[data-action="toggle-drawer"]')) {
        drawerOpen = false;
        backdrop.removeEventListener('click', onClickAway, true);
        rerender();
      }
    };
    setTimeout(() => backdrop.addEventListener('click', onClickAway, true), 0);
  }

  // Auto-scroll on first paint
  const stream = document.getElementById('assistant-stream');
  if (stream) stream.scrollTop = stream.scrollHeight;
};
