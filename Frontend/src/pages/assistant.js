import { icons } from '../components/icons.js';
import { store } from '../store.js';
import { speech } from '../services/speech.js';
import { api }   from '../services/api.js';

/* ── Contextual AI response engine ─────────────────────────── */
// Keyword-based dispatch — gives realistic, varied replies
const AI_RULES = [
  // Greetings
  { re: /^(bonjour|salut|hello|bonsoir|hi\b)/i, replies: [
    'Bonjour ! 🌍 Prêt à explorer une nouvelle langue africaine aujourd\'hui ?',
    'Salut ! Kivi est là pour t\'aider. Quelle langue veux-tu apprendre aujourd\'hui ?',
  ]},
  // Market / shopping
  { re: /march[eé]|achet|vend|prix|combien|fcfa|monnaie/i, replies: [
    'Super contexte ! En Swahili : **"Bei gani?"** = Combien ça coûte ? 🛒\nEssaie de le répéter à voix haute !',
    'En Haoussa, au marché tu peux dire : **"Nawa ne?"** (combien ?) et **"Yi arha"** (c\'est trop cher). 💰',
    'En Dioula : **"Joli foli yen?"** = Combien ça coûte ? C\'est la phrase essentielle du marché ! 🥭',
  ]},
  // Greetings / politeness
  { re: /polites|bonjour|saluer|accueillir|bienvenu/i, replies: [
    'En Wolof : **"Nanga def ?"** = Comment vas-tu ? Et la réponse : **"Maa ngi fi rekk"** (Je suis là, juste ici) 🤝',
    'En Swahili : **"Habari yako ?"** = Comment ça va ? → **"Nzuri sana !"** (Très bien !)',
  ]},
  // Numbers
  { re: /chiffr|nomb|compt|1|2|3|4|5/i, replies: [
    '🔢 En Swahili, de 1 à 5 : moja, mbili, tatu, nne, tano. Répétons ensemble !',
    'En Haoussa : ɗaya (1), biyu (2), uku (3), huɗu (4), biyar (5). Tu veux continuer jusqu\'à 10 ?',
  ]},
  // Food
  { re: /mang[eé]r|nourriture|repas|faim|soif|eau|boire|pain|riz/i, replies: [
    'En Swahili : **"Chakula"** = nourriture, **"Maji"** = eau, **"Njaa"** = faim. 🍚\nTu veux le menu complet ?',
    'En Wolof : **"Lekk"** = manger, **"Dëkk"** = vivre, **"Ndox"** = eau. La survie en 3 mots ! 💧',
  ]},
  // Travel
  { re: /voyage|trajet|route|aller|venir|partir|ici|là|où/i, replies: [
    '🧭 En Swahili : **"Wapi...?"** = Où est... ? Ex : **"Wapi hospitali ?"** = Où est l\'hôpital ?',
    'En Haoussa : **"Ina..."** = Où est... ? **"Ina gida ?"** = Où est la maison ? Très utile en voyage !',
  ]},
  // Lesson / learning
  { re: /leçon|apprendre|exercice|quiz|test|pratique|niveau/i, replies: [
    '📚 Tu peux aller dans la section **Apprentissage** pour suivre ta leçon du jour avec des quiz interactifs !',
    'Je vois que tu es motivé ! 🔥 Ta prochaine leçon t\'attend dans l\'onglet **Apprendre**. Veux-tu un avant-goût ici ?',
  ]},
  // Default (catch-all, varied)
  { re: /./, replies: [
    'Intéressant ! Quelle langue africaine veux-tu explorer — Swahili 🇹🇿, Haoussa 🇳🇬, Wolof 🇸🇳, ou Dioula 🇨🇮 ?',
    '💡 Bon à savoir ! Je peux t\'enseigner des phrases pratiques, des proverbes ou t\'aider avec ta leçon du jour.',
    'Je t\'écoute ! Tu veux apprendre du vocabulaire, pratiquer une conversation, ou comprendre la culture ?',
    'Super ! Dis-moi dans quel contexte tu veux utiliser cette langue — je t\'adapte l\'apprentissage. 🌍',
  ]},
];

function getAiReply(userText) {
  for (const rule of AI_RULES) {
    if (rule.re.test(userText)) {
      const pool = rule.replies;
      return pool[Math.floor(Math.random() * pool.length)];
    }
  }
  return 'Je réfléchis… 🤔';
}

// Render markdown-like bold in bubbles
function formatContent(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

let messages = [
  { from: 'ai', content: 'Bonjour ! Je suis **Kivi**, ton tuteur IA. 🌍\nQuelle langue africaine veux-tu explorer aujourd\'hui ?' }
];

const SUGGESTIONS = [
  'Leçon du jour',
  'Phrases au marché',
  'Salutations',
  'Chiffres 1-10',
  'Nourriture',
  'Voyager'
];

function getContextChips() {
  const user    = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  const streak  = user.stats?.streak || 0;
  const level   = user.stats?.level  || 1;
  const lang    = user.preferredLanguage || 'swa';
  const LANG_NAMES = { fra:'Français', eng:'Anglais', swa:'Swahili', wol:'Wolof', bam:'Bambara', dyu:'Dioula', hau:'Haoussa', yor:'Yoruba' };
  return [
    { emoji: '📖', label: `${LANG_NAMES[lang] || lang} niv. ${level}`, color: 'primary' },
    { emoji: '🔥', label: `${streak} j de série`, color: 'error' },
    { emoji: '⚡', label: `${user.stats?.xp || 0} XP`, color: 'accent' },
  ];
}

export function renderAssistant() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(230,90,140,0.15); color:var(--color-assistant);">
          ${icons.assistant(28)}
        </span>
        <div>
          <div class="screen-title">Assistant IA</div>
          <div class="screen-subtitle">Ton tuteur personnel qui t'apprend en vivant</div>
        </div>
      </div>
    </div>

    <!-- Context bar -->
    <div class="flex gap-xs mb-md scroll-x">
      <div class="scroll-x-row">
        ${getContextChips().map(c => `
          <span class="chip chip-${c.color}">${c.emoji} ${c.label}</span>
        `).join('')}
      </div>
    </div>

    <!-- Messages -->
    <div class="chat-stream mb-md" id="chat-stream">
      ${messages.map(m => renderBubble(m)).join('')}
    </div>

    <!-- Suggestions -->
    <div class="scroll-x mb-md">
      <div class="scroll-x-row">
        ${SUGGESTIONS.map(s => `
          <button class="chip chip-suggestion" data-action="suggest" data-text="${s}">${s}</button>
        `).join('')}
      </div>
    </div>

    <!-- Input -->
    <div class="chat-input">
      <button class="icon-btn icon-btn--mic" aria-label="Dictée vocale">
        ${icons.mic(20, 'currentColor')}
      </button>
      <input id="assistant-input"
             class="form-input chat-input__field"
             placeholder="Écris à ton tuteur…"
             aria-label="Message"/>
      <button class="icon-btn icon-btn--send" data-action="send-message" aria-label="Envoyer">
        ${icons.send(20, 'white')}
      </button>
    </div>
  `;
}

function renderBubble(m) {
  const user = store.get('user');
  const avatar = user?.avatar || '🧑🏾';
  if (m.from === 'ai') {
    return `
      <div class="bubble-row bubble-row--ai">
        <span class="bubble-avatar bubble-avatar--ai" aria-hidden="true">${icons.assistant(18, 'white')}</span>
        <div class="bubble bubble--ai">${m.typing ? '<span class="typing-dots"><span></span><span></span><span></span></span>' : formatContent(m.content)}</div>
      </div>
    `;
  }
  return `
    <div class="bubble-row bubble-row--user">
      <div class="bubble bubble--user">${formatContent(m.content)}</div>
      <span class="bubble-avatar bubble-avatar--user" aria-hidden="true">${avatar}</span>
    </div>
  `;
}

renderAssistant.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const input = document.getElementById('assistant-input');

  function send(text) {
    if (!text || !text.trim()) return;
    const userText = text.trim();
    messages.push({ from: 'user', content: userText });
    // Show typing indicator
    messages.push({ from: 'ai', content: '', typing: true });
    rerender(true);

    // Try backend first, fall back to local AI rules
    const user = store.get('user') || {};
    const lang = user.preferredLanguage || 'fra';
    const apiMessages = messages
      .filter(m => !m.typing)
      .map(m => ({ role: m.from === 'ai' ? 'assistant' : 'user', content: m.content }));

    (async () => {
      let reply;
      try {
        const res = await api.post('/assistant/chat', {
          messages: apiMessages.slice(-8), // last 8 for context
          targetLanguage: lang
        });
        reply = res.reply;
      } catch {
        // Offline / backend down → use local rules
        reply = getAiReply(userText);
      }

      messages = messages.filter(m => !m.typing);
      messages.push({ from: 'ai', content: reply });
      rerender(true);
      if (speech.ttsSupported) {
        const plain = reply.replace(/\*\*/g, '').replace(/<br>/g, ' ').replace(/[🔢🛒💰🥭🤝💧🧭📚🔥💡🌍🤔]/g, '');
        speech.speak(plain, 'fra');
      }
    })();
  }

  function rerender(scroll) {
    main.innerHTML = renderAssistant();
    renderAssistant.mount();
    if (scroll) {
      const stream = document.getElementById('chat-stream');
      if (stream) stream.scrollTop = stream.scrollHeight;
    }
  }

  document.querySelectorAll('[data-action="send-message"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const text = document.getElementById('assistant-input')?.value;
      send(text);
    })
  );

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        send(input.value);
      }
    });
  }

  document.querySelectorAll('[data-action="suggest"]').forEach(btn =>
    btn.addEventListener('click', () => send(btn.dataset.text))
  );

  // Mic button — voice input for assistant
  let stopAssistantStt = null;
  document.querySelectorAll('.icon-btn--mic').forEach(btn =>
    btn.addEventListener('click', () => {
      if (stopAssistantStt) {
        stopAssistantStt();
        stopAssistantStt = null;
        btn.style.color = '';
        return;
      }
      if (!speech.sttSupported) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Reconnaissance vocale non disponible', { type: 'warning' });
        return;
      }
      btn.style.color = 'var(--error)';
      const user = store.get('user') || {};
      const lang = user.preferredLanguage || 'fra';
      stopAssistantStt = speech.startListening(lang, {
        onResult: ({ text, isFinal }) => {
          const inputEl = document.getElementById('assistant-input');
          if (inputEl) inputEl.value = text;
          if (isFinal && text.trim()) {
            stopAssistantStt = null;
            btn.style.color = '';
            send(text.trim());
          }
        },
        onError: () => { stopAssistantStt = null; btn.style.color = ''; },
        onEnd:   () => { stopAssistantStt = null; btn.style.color = ''; }
      });
    })
  );

  // auto-scroll on first paint
  const stream = document.getElementById('chat-stream');
  if (stream) stream.scrollTop = stream.scrollHeight;
};
