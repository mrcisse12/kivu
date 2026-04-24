export function renderMultiParty() {
  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span style="width:56px;height:56px;border-radius:50%;background:rgba(89,128,235,0.15);color:var(--color-multiparty);display:flex;align-items:center;justify-content:center;font-size:24px">👥</span>
        <div>
          <div class="screen-title">Multi-Party</div>
          <div class="screen-subtitle">Réunions en toutes les langues, simultanément</div>
        </div>
      </div>
    </div>

    <div class="grid grid-2 mb-md">
      <button class="btn" style="background:var(--color-multiparty);color:white;padding:20px 12px;flex-direction:column;">
        <span style="font-size:22px">🎥</span>
        <span>Nouvelle réunion</span>
      </button>
      <button class="btn" style="background:rgba(89,128,235,0.15);color:var(--color-multiparty);padding:20px 12px;flex-direction:column;">
        <span style="font-size:22px">🔗</span>
        <span>Rejoindre</span>
      </button>
    </div>

    <!-- Active meeting -->
    <div class="card mb-md" style="border:2px solid rgba(51,179,102,0.3)">
      <div class="flex items-center gap-xs mb-sm">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--success)"></span>
        <span class="text-xs font-bold" style="color:var(--success)">EN COURS</span>
        <span class="text-xs text-muted" style="margin-left:auto">04:23</span>
      </div>
      <div class="font-bold text-md mb-sm">Fusion Amani × Kivu</div>
      <div class="flex items-center gap-xs mb-sm">
        ${renderParticipant('👨🏾‍💼','🇨🇮')}
        ${renderParticipant('👩🏾‍💼','🇸🇳')}
        ${renderParticipant('🧑🏾‍💼','🇰🇪')}
        ${renderParticipant('👨🏿‍💼','🇳🇬')}
        <span style="width:36px;height:36px;border-radius:50%;background:var(--text-secondary);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;margin-left:-12px">+3</span>
        <button class="btn" style="margin-left:auto;background:var(--color-multiparty);color:white;padding:8px 16px;font-size:13px">Rejoindre</button>
      </div>
      <div class="flex items-center gap-xs">
        <span>🇨🇮</span><span>🇸🇳</span><span>🇰🇪</span><span>🇳🇬</span><span>🇬🇭</span><span>🇲🇱</span>
        <span class="text-xs text-primary" style="margin-left:auto">🌍 7 langues simultanées</span>
      </div>
    </div>

    <!-- Upcoming -->
    <h2 class="font-display font-bold text-lg mb-sm">Prochaines réunions</h2>
    <div class="flex flex-col gap-xs mb-lg">
      ${renderMeeting('14:00', 'Conseil d\'administration', 6, ['🇨🇮','🇸🇳','🇰🇪'])}
      ${renderMeeting('16:30', 'Négociation fournisseur', 3, ['🇲🇱','🇳🇪'])}
      ${renderMeeting('Demain 09:00', 'Consultation médicale', 2, ['🇧🇫','🇫🇷'])}
    </div>

    <!-- Templates -->
    <h2 class="font-display font-bold text-lg mb-sm">Modèles rapides</h2>
    <div class="scroll-x">
      <div class="scroll-x-row">
        ${renderTemplate('💼','Réunion business','var(--kivu-secondary)')}
        ${renderTemplate('🏥','Consultation médicale','var(--error)')}
        ${renderTemplate('🌐','Négociation diplomatique','var(--kivu-primary)')}
        ${renderTemplate('🎓','Cours académique','var(--kivu-accent)')}
      </div>
    </div>
  `;
}

function renderParticipant(emoji, flag) {
  return `
    <span style="position:relative;margin-left:-12px;">
      <span style="width:36px;height:36px;border-radius:50%;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid white">${emoji}</span>
      <span style="position:absolute;bottom:-4px;right:-4px;font-size:14px">${flag}</span>
    </span>
  `;
}

function renderMeeting(time, title, participants, flags) {
  return `
    <div class="list-row">
      <div style="width:70px;padding:8px;background:rgba(89,128,235,0.15);color:var(--color-multiparty);border-radius:var(--r-md);text-align:center;font-weight:600;font-size:12px">${time}</div>
      <div style="flex:1">
        <div class="font-semibold">${title}</div>
        <div class="text-xs text-muted">${flags.join(' ')} · ${participants} participants</div>
      </div>
      <span class="text-muted">›</span>
    </div>
  `;
}

function renderTemplate(icon, title, color) {
  return `
    <button class="card" style="min-width:150px;text-align:left;">
      <div style="font-size:24px;color:${color};margin-bottom:8px">${icon}</div>
      <div class="font-semibold text-sm">${title}</div>
    </button>
  `;
}
