import { icons } from '../components/icons.js';

let messages = [
  { from: 'ai',   content: 'Bonjour Amadou ! Prêt pour ta leçon du jour ? Aujourd\'hui on apprend à marchander en Haussa.' },
  { from: 'user', content: 'Oui, je vais au marché plus tard' },
  { from: 'ai',   content: 'Parfait ! Commençons par le vocabulaire essentiel. En Haussa, "combien ça coûte ?" se dit "Nawa ne?". Essayez de répéter.' }
];

const SUGGESTIONS = [
  'Leçon du jour',
  'Parler au marché',
  'Politesse',
  'Chiffres'
];

const CONTEXT_CHIPS = [
  { emoji: '📍', label: 'Marché proche', color: 'accent' },
  { emoji: '📖', label: 'Haussa niv. 3', color: 'primary' },
  { emoji: '🔥', label: '12 j de série',  color: 'error' }
];

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
        ${CONTEXT_CHIPS.map(c => `
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
  if (m.from === 'ai') {
    return `
      <div class="bubble-row bubble-row--ai">
        <span class="bubble-avatar bubble-avatar--ai" aria-hidden="true">${icons.assistant(18, 'white')}</span>
        <div class="bubble bubble--ai">${m.content}</div>
      </div>
    `;
  }
  return `
    <div class="bubble-row bubble-row--user">
      <div class="bubble bubble--user">${m.content}</div>
      <span class="bubble-avatar bubble-avatar--user" aria-hidden="true">🧑🏾</span>
    </div>
  `;
}

renderAssistant.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const input = document.getElementById('assistant-input');

  function send(text) {
    if (!text || !text.trim()) return;
    messages.push({ from: 'user', content: text.trim() });
    rerender(true);

    setTimeout(() => {
      messages.push({
        from: 'ai',
        content: 'Excellent ! Essayons : "Yaya ne mangoro?" (Combien coûte la mangue ?)'
      });
      rerender(true);
    }, 900);
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

  // auto-scroll on first paint
  const stream = document.getElementById('chat-stream');
  if (stream) stream.scrollTop = stream.scrollHeight;
};
