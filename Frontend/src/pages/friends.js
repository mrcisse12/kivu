/**
 * KIVU — Page Mes Amis
 *
 * Trois onglets :
 *   • Mes amis    — liste triée online-first / xp-desc + actions
 *   • Activité    — mini-feed combiné (mes actions + amis)
 *   • Découvrir   — pool de membres KIVU à ajouter
 *
 * Header : carte "Mon code KIVU" + bouton Copier + bouton Ajouter (modal).
 * Détail ami : modal avec stats + envoyer un encouragement.
 */

import { store } from '../store.js';
import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';
import { confirmModal } from '../services/dialog.js';
import {
  ensureUserCode,
  getFriends,
  getFriend,
  getSuggestions,
  addFriend,
  addFriendByCode,
  removeFriend,
  dismissSuggestion,
  getActivityFeed,
  reactToActivity,
  sendEncouragement,
  ENCOURAGEMENTS
} from '../services/friends.js';

const LANG_LABELS = {
  swa: 'Swahili', wol: 'Wolof', bam: 'Bambara', dyu: 'Dioula',
  hau: 'Haoussa', yor: 'Yoruba', zul: 'Zulu', ibo: 'Igbo', lin: 'Lingala'
};
const LANG_FLAGS = {
  swa: '🇹🇿', wol: '🇸🇳', bam: '🇲🇱', dyu: '🇨🇮',
  hau: '🇳🇬', yor: '🇳🇬', zul: '🇿🇦', ibo: '🇳🇬', lin: '🇨🇩'
};

let activeTab = 'list';        // 'list' | 'activity' | 'discover'
let addModalOpen = false;
let addCodeInput = '';
let addError = null;
let detailFriendId = null;     // friend currently in detail view
let encModalFriendId = null;   // friend currently being encouraged

/* ─── Helpers ─────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'à l\'instant';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/* ─── Main render ─────────────────────────────────────── */

export function renderFriends() {
  const code = ensureUserCode();
  const user = store.get('user') || {};
  const friends = getFriends();
  const suggestions = getSuggestions();
  const activity = getActivityFeed(30);

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Mes amis</div>
        <div class="screen-subtitle">Apprenez ensemble, restez motivés</div>
      </div>
    </div>

    <!-- Mon code KIVU -->
    <div class="card friends-code-card mb-md">
      <div class="friends-code-card__top">
        <div class="friends-code-card__avatar">${user.avatar || '🧑🏾'}</div>
        <div style="flex:1; min-width:0;">
          <div class="text-xs friends-code-card__label">Ton code KIVU</div>
          <div class="friends-code-card__code">${escapeHtml(code)}</div>
          <div class="text-xs" style="opacity:0.85;">Partage ce code pour qu'on t'ajoute</div>
        </div>
        <div class="friends-code-card__actions">
          <button class="icon-btn icon-btn--sm" data-action="copy-code" title="Copier mon code" aria-label="Copier mon code">
            ${icons.copy(16, 'currentColor')}
          </button>
          <button class="icon-btn icon-btn--sm" data-action="share-code" title="Partager" aria-label="Partager">
            ${icons.share(16, 'currentColor')}
          </button>
        </div>
      </div>
      <button class="btn btn-white btn-full" data-action="open-add-modal" style="margin-top:12px;">
        ${icons.plus(16)} Ajouter un ami
      </button>
    </div>

    <!-- Tabs -->
    <div class="friends-tabs mb-md">
      ${renderTab('list',     'Mes amis',  '👥', friends.length)}
      ${renderTab('activity', 'Activité',  '✨', activity.length)}
      ${renderTab('discover', 'Découvrir', '🌍', suggestions.length)}
    </div>

    ${renderActiveTab(friends, activity, suggestions)}

    ${addModalOpen ? renderAddModal() : ''}
    ${detailFriendId ? renderDetailModal() : ''}
    ${encModalFriendId ? renderEncouragementModal() : ''}
  `;
}

function renderTab(id, label, emoji, count) {
  const active = activeTab === id;
  return `
    <button class="friends-tab ${active ? 'is-active' : ''}" data-action="friends-tab" data-tab="${id}">
      <span class="friends-tab__emoji" aria-hidden="true">${emoji}</span>
      <span class="friends-tab__label">${label}</span>
      <span class="friends-tab__count">${count}</span>
    </button>
  `;
}

function renderActiveTab(friends, activity, suggestions) {
  if (activeTab === 'list')     return renderFriendsList(friends);
  if (activeTab === 'activity') return renderActivityFeed(activity);
  return renderSuggestions(suggestions);
}

/* ─── Tab: Friends list ───────────────────────────────── */

function renderFriendsList(friends) {
  if (!friends.length) {
    return `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">👥</div>
        <div class="empty-state__title">Pas encore d'amis sur KIVU</div>
        <div class="text-sm text-muted mb-md">Ajoute des membres pour t'encourager mutuellement.</div>
        <button class="btn btn-primary" data-action="friends-tab" data-tab="discover">
          🌍 Découvrir des membres
        </button>
      </div>
    `;
  }
  return `
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
      ${friends.length} ami${friends.length > 1 ? 's' : ''} · ${friends.filter(f => f.online).length} en ligne
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${friends.map(f => renderFriendRow(f)).join('')}
    </div>
  `;
}

function renderFriendRow(f) {
  const lang = LANG_LABELS[f.learning] || f.learning?.toUpperCase() || '';
  const flag = LANG_FLAGS[f.learning] || '🌍';
  return `
    <button class="friend-row" data-action="friend-detail" data-id="${f.id}">
      <div class="friend-row__avatar">
        <span aria-hidden="true">${f.avatar}</span>
        ${f.online ? '<span class="friend-online-dot" title="En ligne"></span>' : ''}
      </div>
      <div class="friend-row__body">
        <div class="font-semibold">${escapeHtml(f.name)} <span class="text-xs text-muted">${f.countryFlag}</span></div>
        <div class="text-xs text-muted">
          ${flag} ${lang}
          <span style="margin: 0 6px; opacity:0.4;">·</span>
          🔥 ${f.streak}
          <span style="margin: 0 6px; opacity:0.4;">·</span>
          Niv. ${f.level}
        </div>
      </div>
      <div class="friend-row__xp">
        <div class="font-bold" style="color: var(--kivu-accent);">${(f.xp || 0).toLocaleString('fr-FR')}</div>
        <div class="text-xs text-muted">XP</div>
      </div>
    </button>
  `;
}

/* ─── Tab: Activity feed ──────────────────────────────── */

function renderActivityFeed(activity) {
  if (!activity.length) {
    return `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">✨</div>
        <div class="empty-state__title">Aucune activité pour l'instant</div>
        <div class="text-sm text-muted">L'activité de tes amis apparaîtra ici.</div>
      </div>
    `;
  }
  return `
    <div class="flex flex-col gap-xs mb-lg">
      ${activity.map(a => renderActivityRow(a)).join('')}
    </div>
  `;
}

function renderActivityRow(a) {
  const friend = a.friend;
  const reactionEntries = Object.entries(a.reactions || {});
  return `
    <div class="activity-row">
      <div class="activity-row__avatar">
        <span aria-hidden="true">${a.icon || (friend ? friend.avatar : '✨')}</span>
      </div>
      <div class="activity-row__body">
        <div class="text-sm">
          ${friend ? `<strong>${escapeHtml(friend.name.split(' ')[0])}</strong>` : '<strong>Toi</strong>'}
          ${escapeHtml(a.text)}
        </div>
        <div class="text-xs text-muted">${relTime(a.date)}</div>
        ${reactionEntries.length ? `
          <div class="activity-reactions">
            ${reactionEntries.map(([em, n]) => `
              <span class="reaction-chip">${em} ${n > 1 ? n : ''}</span>
            `).join('')}
          </div>
        ` : ''}
      </div>
      ${friend ? `
        <button class="icon-btn icon-btn--sm" data-action="quick-react" data-id="${a.id}" title="Encourager">
          ${icons.heart(16)}
        </button>
      ` : ''}
    </div>
  `;
}

/* ─── Tab: Discover (suggestions) ─────────────────────── */

function renderSuggestions(suggestions) {
  if (!suggestions.length) {
    return `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">🌍</div>
        <div class="empty-state__title">Tu connais déjà tout le monde !</div>
        <div class="text-sm text-muted">Tous les membres suggérés ont été ajoutés ou écartés.</div>
      </div>
    `;
  }
  return `
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
      ${suggestions.length} membre${suggestions.length > 1 ? 's' : ''} de la communauté KIVU
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${suggestions.map(f => renderSuggestionCard(f)).join('')}
    </div>
  `;
}

function renderSuggestionCard(f) {
  const lang = LANG_LABELS[f.learning] || f.learning?.toUpperCase() || '';
  return `
    <div class="suggestion-card">
      <div class="suggestion-card__avatar">
        <span aria-hidden="true">${f.avatar}</span>
        ${f.online ? '<span class="friend-online-dot"></span>' : ''}
      </div>
      <div class="suggestion-card__body">
        <div class="font-semibold">${escapeHtml(f.name)} ${f.countryFlag}</div>
        <div class="text-xs text-muted mb-xs">
          ${LANG_FLAGS[f.learning] || '🌍'} ${lang} · 🔥 ${f.streak} · Niv. ${f.level}
        </div>
        <div class="text-xs" style="color:var(--text-secondary); font-style:italic;">
          ${escapeHtml(f.hint || '')}
        </div>
      </div>
      <div class="suggestion-card__actions">
        <button class="btn btn-primary btn-sm" data-action="add-suggestion" data-id="${f.id}"
                style="white-space:nowrap;">
          ${icons.plus(14)} Ajouter
        </button>
        <button class="link-btn text-xs" data-action="dismiss-suggestion" data-name="${escapeAttr(f.name)}">
          Masquer
        </button>
      </div>
    </div>
  `;
}

/* ─── Modal: Add friend by code ───────────────────────── */

function renderAddModal() {
  return `
    <div class="modal-backdrop" data-action="close-add-modal">
      <div class="modal-sheet" data-stop="true" role="dialog" aria-label="Ajouter un ami">
        <div class="modal-handle"></div>
        <h2 class="font-display font-bold text-lg mb-sm">Ajouter un ami</h2>
        <p class="text-sm text-muted mb-md">Saisis son code KIVU. Format : <strong>KIVU-XXX-NNNN</strong></p>

        <div class="form-group">
          <input id="add-code-input"
                 class="form-input"
                 type="text"
                 placeholder="KIVU-AKD-1248"
                 value="${escapeAttr(addCodeInput)}"
                 autocomplete="off"
                 autocapitalize="characters"
                 maxlength="14"
                 style="text-transform: uppercase; letter-spacing: 0.6px; font-family: ui-monospace, 'Courier New', monospace; font-size: 1.05rem;"
                 autofocus/>
          ${addError ? `<div class="form-error" style="color: var(--error); font-size: 0.8rem; margin-top: 6px;">${escapeHtml(addError)}</div>` : ''}
        </div>

        <div class="flex gap-sm mt-md">
          <button class="btn btn-ghost btn-full" data-action="close-add-modal">Annuler</button>
          <button class="btn btn-primary btn-full" data-action="confirm-add-code">Ajouter</button>
        </div>

        <div class="text-xs text-muted mt-md" style="text-align:center;">
          Pas de code ? Va dans l'onglet <strong>Découvrir</strong> pour trouver des membres.
        </div>
      </div>
    </div>
  `;
}

/* ─── Modal: Friend detail ────────────────────────────── */

function renderDetailModal() {
  const f = getFriend(detailFriendId);
  if (!f) return '';
  const lang = LANG_LABELS[f.learning] || f.learning?.toUpperCase() || '';
  return `
    <div class="modal-backdrop" data-action="close-detail">
      <div class="modal-sheet friend-detail" data-stop="true" role="dialog" aria-label="${escapeAttr(f.name)}">
        <button class="modal-close" data-action="close-detail" aria-label="Fermer">${icons.close(20)}</button>

        <div class="friend-detail__hero">
          <div class="friend-detail__avatar">
            <span aria-hidden="true">${f.avatar}</span>
            ${f.online ? '<span class="friend-online-dot friend-online-dot--lg"></span>' : ''}
          </div>
          <div class="font-display font-bold" style="font-size: 1.4rem;">${escapeHtml(f.name)}</div>
          <div class="text-sm text-muted">${f.countryFlag} ${escapeHtml(f.country || '')}</div>
          <div class="friend-detail__code">${escapeHtml(f.code)}</div>
        </div>

        <div class="grid grid-3 friend-detail__stats">
          <div class="stat-card stat-card--mini">
            <div class="stat-emoji">⚡</div>
            <div class="stat-value">${(f.xp || 0).toLocaleString('fr-FR')}</div>
            <div class="stat-label">XP</div>
          </div>
          <div class="stat-card stat-card--mini">
            <div class="stat-emoji">🔥</div>
            <div class="stat-value">${f.streak || 0}</div>
            <div class="stat-label">Série</div>
          </div>
          <div class="stat-card stat-card--mini">
            <div class="stat-emoji">📈</div>
            <div class="stat-value">${f.level || 1}</div>
            <div class="stat-label">Niveau</div>
          </div>
        </div>

        <div class="card mb-md" style="background: var(--surface);">
          <div class="text-xs text-muted mb-xs">Apprend</div>
          <div class="font-semibold">${LANG_FLAGS[f.learning] || '🌍'} ${lang}</div>
        </div>

        ${f.hint ? `
          <div class="card mb-md" style="background: var(--surface);">
            <div class="text-xs text-muted mb-xs">À propos</div>
            <div class="text-sm" style="font-style: italic;">«${escapeHtml(f.hint)}»</div>
          </div>
        ` : ''}

        <div class="flex gap-sm">
          <button class="btn btn-primary btn-full" data-action="open-encourage" data-id="${f.id}"
                  style="background: var(--kivu-accent); border-color: #E08600; border-bottom-color: #C77400;">
            🔥 Encourager
          </button>
          <button class="btn btn-ghost" data-action="remove-friend" data-id="${f.id}"
                  style="color: var(--error);" title="Retirer cet ami">
            ${icons.trash(18)}
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ─── Modal: Send encouragement ────────────────────────── */

function renderEncouragementModal() {
  const f = getFriend(encModalFriendId);
  if (!f) return '';
  return `
    <div class="modal-backdrop" data-action="close-encourage">
      <div class="modal-sheet" data-stop="true" role="dialog" aria-label="Encourager ${escapeAttr(f.name)}">
        <div class="modal-handle"></div>
        <div style="text-align:center;">
          <div style="font-size: 56px; margin-bottom: 8px;" aria-hidden="true">${f.avatar}</div>
          <h2 class="font-display font-bold text-lg">Envoie un encouragement à ${escapeHtml(f.name.split(' ')[0])}</h2>
          <p class="text-sm text-muted mb-md">Touche un emoji pour l'envoyer instantanément.</p>
        </div>

        <div class="encourage-grid">
          ${ENCOURAGEMENTS.map(em => `
            <button class="encourage-btn" data-action="send-encouragement" data-id="${f.id}" data-emoji="${em}"
                    aria-label="Envoyer ${em}">
              <span aria-hidden="true">${em}</span>
            </button>
          `).join('')}
        </div>

        <button class="btn btn-ghost btn-full mt-md" data-action="close-encourage">Annuler</button>
      </div>
    </div>
  `;
}

/* ─── Mount / interactions ─────────────────────────────── */

renderFriends.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = (preserveFocus = false) => {
    const focusedId = preserveFocus ? document.activeElement?.id : null;
    main.innerHTML = renderFriends();
    renderFriends.mount();
    if (focusedId) {
      const el = document.getElementById(focusedId);
      if (el) {
        el.focus();
        if (el.value) el.setSelectionRange(el.value.length, el.value.length);
      }
    }
  };

  // ── Tabs ─────────────────────────────────────────────
  document.querySelectorAll('[data-action="friends-tab"]').forEach(btn =>
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      fx.click();
      rerender();
    })
  );

  // ── Copy / Share KIVU code ───────────────────────────
  document.querySelectorAll('[data-action="copy-code"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const code = ensureUserCode();
      try {
        await navigator.clipboard.writeText(code);
        fx.coin();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`Code copié : ${code}`, { type: 'success', duration: 2000 });
        }
      } catch {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Impossible de copier', { type: 'error' });
      }
    })
  );
  document.querySelectorAll('[data-action="share-code"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const code = ensureUserCode();
      const text = `Rejoins-moi sur KIVU pour apprendre les langues africaines ! Mon code : ${code}`;
      if (navigator.share) {
        try {
          await navigator.share({ title: 'KIVU', text });
          fx.coin();
        } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(text);
          if (window.__KIVU__?.toast) window.__KIVU__.toast('Message copié', { type: 'success', duration: 2000 });
        } catch {}
      }
    })
  );

  // ── Add modal ────────────────────────────────────────
  document.querySelectorAll('[data-action="open-add-modal"]').forEach(btn =>
    btn.addEventListener('click', () => {
      addModalOpen = true;
      addCodeInput = '';
      addError = null;
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="close-add-modal"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      // Ignore clicks on the modal-sheet itself (data-stop)
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="close-add-modal"]')) return;
      addModalOpen = false;
      addError = null;
      rerender();
    })
  );
  const codeInput = document.getElementById('add-code-input');
  if (codeInput) {
    codeInput.addEventListener('input', () => {
      addCodeInput = codeInput.value.toUpperCase();
      // Don't rerender — just track value
    });
    codeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.querySelector('[data-action="confirm-add-code"]')?.click();
      }
    });
  }
  document.querySelectorAll('[data-action="confirm-add-code"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const input = document.getElementById('add-code-input');
      const value = input ? input.value : addCodeInput;
      const result = addFriendByCode(value);
      if (result.ok) {
        addModalOpen = false;
        addError = null;
        fx.success();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`${result.friend.name} ajouté à tes amis ! 🎉`, { type: 'success', duration: 2500 });
        }
      } else {
        addError = result.error;
        addCodeInput = value;
        fx.wrong();
      }
      rerender();
    })
  );

  // ── Friend detail modal ──────────────────────────────
  document.querySelectorAll('[data-action="friend-detail"]').forEach(btn =>
    btn.addEventListener('click', () => {
      detailFriendId = btn.dataset.id;
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="close-detail"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="close-detail"]') && !ev.target.closest('[data-action="close-detail"]')) return;
      detailFriendId = null;
      rerender();
    })
  );
  document.querySelectorAll('[data-action="remove-friend"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const f = getFriend(id);
      if (!f) return;
      const ok = await confirmModal({
        icon: f.avatar,
        title: `Retirer ${f.name} ?`,
        message: 'Vous ne verrez plus son activité ni ses encouragements.',
        confirmLabel: 'Retirer',
        cancelLabel: 'Garder',
        danger: true
      });
      if (!ok) return;
      removeFriend(id);
      detailFriendId = null;
      if (window.__KIVU__?.toast) {
        window.__KIVU__.toast(`${f.name} retiré de tes amis`, { type: 'info', duration: 2000 });
      }
      rerender();
    })
  );

  // ── Encouragement modal ──────────────────────────────
  document.querySelectorAll('[data-action="open-encourage"]').forEach(btn =>
    btn.addEventListener('click', () => {
      encModalFriendId = btn.dataset.id;
      detailFriendId = null;
      fx.click();
      rerender();
    })
  );
  document.querySelectorAll('[data-action="close-encourage"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="close-encourage"]') && !ev.target.closest('[data-action="close-encourage"]')) return;
      encModalFriendId = null;
      rerender();
    })
  );
  document.querySelectorAll('[data-action="send-encouragement"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const emoji = btn.dataset.emoji;
      sendEncouragement(id, emoji);
      encModalFriendId = null;
      fx.coin();
      const f = getFriend(id);
      if (window.__KIVU__?.toast && f) {
        window.__KIVU__.toast(`${emoji} envoyé à ${f.name.split(' ')[0]} !`, { type: 'success', duration: 1800 });
      }
      rerender();
    })
  );

  // ── Quick react from feed ────────────────────────────
  document.querySelectorAll('[data-action="quick-react"]').forEach(btn =>
    btn.addEventListener('click', () => {
      reactToActivity(btn.dataset.id, '🔥');
      fx.click();
      rerender();
    })
  );

  // ── Add suggestion ───────────────────────────────────
  document.querySelectorAll('[data-action="add-suggestion"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const sug = getSuggestions().find(s => s.id === id);
      if (sug && addFriend(sug)) {
        fx.success();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`${sug.name} ajouté ! 🎉`, { type: 'success', duration: 2000 });
        }
      } else {
        fx.wrong();
      }
      rerender();
    })
  );

  // ── Dismiss suggestion ───────────────────────────────
  document.querySelectorAll('[data-action="dismiss-suggestion"]').forEach(btn =>
    btn.addEventListener('click', () => {
      dismissSuggestion(btn.dataset.name);
      fx.click();
      rerender();
    })
  );

  // ── Backdrop click to close modals ───────────────────
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target !== bd) return;
      addModalOpen = false;
      detailFriendId = null;
      encModalFriendId = null;
      rerender();
    });
  });

  // ── Escape closes any modal ──────────────────────────
  if (addModalOpen || detailFriendId || encModalFriendId) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        addModalOpen = false;
        detailFriendId = null;
        encModalFriendId = null;
        document.removeEventListener('keydown', onEsc);
        rerender();
      }
    };
    document.addEventListener('keydown', onEsc);
  }
};
