let messages = [
  { from: 'ai', content: 'Bonjour Amadou ! Prêt pour ta leçon du jour ? Aujourd\'hui on va apprendre à marchander en Haussa.' },
  { from: 'user', content: 'Oui, je vais au marché plus tard' },
  { from: 'ai', content: 'Parfait ! Commençons par le vocabulaire essentiel. En Haussa, "combien ça coûte ?" se dit "Nawa ne?". Essayez de répéter.' }
];

export function renderAssistant() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span style="width:56px;height:56px;border-radius:50%;background:rgba(230,90,140,0.15);color:var(--color-assistant);display:flex;align-items:center;justify-content:center;font-size:24px">✨</span>
        <div>
          <div class="screen-title">Assistant</div>
          <div class="screen-subtitle">Ton tuteur IA qui t'apprend en vivant</div>
        </div>
      </div>
    </div>

    <!-- Context bar -->
    <div class="flex gap-xs mb-md scroll-x">
      <span class="chip chip-accent">📍 Marché proche</span>
      <span class="chip chip-primary">📖 Haussa niv.3</span>
      <span class="chip chip-error">🔥 12j série</span>
    </div>

    <!-- Messages -->
    <div class="flex flex-col gap-sm mb-md" style="min-height:50vh">
      ${messages.map(m => renderBubble(m)).join('')}
    </div>

    <!-- Suggestions -->
    <div class="flex gap-xs mb-md scroll-x">
      <button class="chip" style="background:rgba(230,90,140,0.15); color:var(--color-assistant); padding:10px 16px">Leçon du jour</button>
      <button class="chip" style="background:rgba(230,90,140,0.15); color:var(--color-assistant); padding:10px 16px">Parler au marché</button>
      <button class="chip" style="background:rgba(230,90,140,0.15); color:var(--color-assistant); padding:10px 16px">Politesse</button>
      <button class="chip" style="background:rgba(230,90,140,0.15); color:var(--color-assistant); padding:10px 16px">Chiffres</button>
    </div>

    <!-- Input -->
    <div class="flex gap-xs items-center" style="position:sticky;bottom:100px">
      <button class="icon-btn" style="background:rgba(230,90,140,0.15);color:var(--color-assistant)">🎙️</button>
      <input id="assistant-input" class="form-input" style="flex:1;border-radius:999px;box-shadow:var(--shadow-sm);border:none" placeholder="Écris à ton tuteur..." />
      <button class="icon-btn" style="background:var(--color-assistant);color:white" data-action="send-message">➤</button>
    </div>
  `;
}

function renderBubble(m) {
  if (m.from === 'ai') {
    return `
      <div class="flex gap-xs" style="align-items:flex-start">
        <span style="width:34px;height:34px;border-radius:50%;background:rgba(230,90,140,0.15);color:var(--color-assistant);display:flex;align-items:center;justify-content:center">✨</span>
        <div class="card" style="max-width:80%;border-radius:var(--r-lg) var(--r-lg) var(--r-lg) 4px;padding:14px">${m.content}</div>
      </div>
    `;
  }
  return `
    <div class="flex gap-xs" style="align-items:flex-start;flex-direction:row-reverse">
      <span style="font-size:28px">🧑🏾</span>
      <div style="max-width:80%;padding:14px;background:var(--grad-hero);color:white;border-radius:var(--r-lg) var(--r-lg) 4px var(--r-lg);box-shadow:var(--shadow-sm)">${m.content}</div>
    </div>
  `;
}

renderAssistant.mount = () => {
  document.addEventListener('send-message', () => {
    const input = document.getElementById('assistant-input');
    const text = input.value.trim();
    if (!text) return;
    messages.push({ from: 'user', content: text });
    input.value = '';
    document.querySelector('main.screen').innerHTML = renderAssistant();
    renderAssistant.mount();

    setTimeout(() => {
      messages.push({ from: 'ai', content: 'Excellent ! Essayons maintenant : "Yaya ne mangoro?" (Combien coûte la mangue ?)' });
      document.querySelector('main.screen').innerHTML = renderAssistant();
      renderAssistant.mount();
    }, 1000);
  }, { once: true });
};
