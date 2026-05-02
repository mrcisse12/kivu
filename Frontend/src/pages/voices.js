/**
 * KIVU — Page admin "Bibliothèque vocale".
 *
 * Permet aux administrateurs / locuteurs natifs d'enregistrer des
 * mots et phrases en voix humaine pour chaque langue. Ces enregistrements
 * remplacent automatiquement la TTS dans toute l'app.
 *
 * Fonctionnalités :
 *   - Stats agrégées (total, par langue, espace utilisé)
 *   - Recherche + filtre par langue
 *   - Liste de toutes les voix avec preview audio
 *   - Bouton flottant "Nouvelle voix" → modal :
 *       1) Saisir texte + langue + locuteur
 *       2) Enregistrer au micro (avec niveau visuel) OU uploader un fichier
 *       3) Re-écouter le résultat avant de valider
 *       4) Sauver dans IndexedDB
 *   - Suppression individuelle
 *   - Export / import du jeu de données
 */

import { icons } from '../components/icons.js';
import { fx } from '../services/audio-fx.js';
import { confirmModal } from '../services/dialog.js';
import { voiceLibrary } from '../services/voice-library.js';
import { voiceRecorder } from '../services/voice-recorder.js';

const LANGS = [
  { id: 'swa', name: 'Swahili',  flag: '🇹🇿' },
  { id: 'wol', name: 'Wolof',    flag: '🇸🇳' },
  { id: 'bam', name: 'Bambara',  flag: '🇲🇱' },
  { id: 'dyu', name: 'Dioula',   flag: '🇨🇮' },
  { id: 'hau', name: 'Haoussa',  flag: '🇳🇬' },
  { id: 'yor', name: 'Yoruba',   flag: '🇳🇬' },
  { id: 'zul', name: 'Zulu',     flag: '🇿🇦' },
  { id: 'ibo', name: 'Igbo',     flag: '🇳🇬' },
  { id: 'lin', name: 'Lingala',  flag: '🇨🇩' },
  { id: 'fra', name: 'Français', flag: '🇫🇷' },
  { id: 'eng', name: 'Anglais',  flag: '🇬🇧' }
];

let entries = [];
let stats = { total: 0, byLang: {}, totalBytes: 0 };
let filterLang = 'all';
let query = '';
let modalOpen = false;
let unsubscribe = null;
let initialDataLoaded = false; // prevents infinite mount recursion

// Modal state
let mForm = { lang: 'swa', text: '', locutor: '', region: '' };
let mRecording = false;
let mRecorderSession = null;
let mLevel = 0;
let mElapsedMs = 0;
let mElapsedTimer = null;
let mPreviewUrl = null;
let mPreviewBlob = null;

/* ─── Helpers ──────────────────────────────────────────── */

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) { return escapeHtml(s); }

function formatBytes(n) {
  if (!n) return '0 ko';
  if (n < 1024)        return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} ko`;
  return `${(n / 1024 / 1024).toFixed(1)} Mo`;
}

function formatMs(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function langInfo(id) {
  return LANGS.find(l => l.id === id) || { id, name: id?.toUpperCase(), flag: '🌍' };
}

async function refreshData() {
  entries = await voiceLibrary.list({ lang: filterLang === 'all' ? null : filterLang });
  stats = await voiceLibrary.stats();
  if (query.trim()) {
    const q = voiceLibrary.normalize(query);
    entries = entries.filter(e =>
      voiceLibrary.normalize(e.text).includes(q) ||
      e.locutor?.toLowerCase().includes(q.toLowerCase())
    );
  }
}

/* ─── Render ───────────────────────────────────────────── */

export function renderVoices() {
  const langStatRows = LANGS
    .map(l => ({ ...l, count: stats.byLang[l.id] || 0 }))
    .sort((a, b) => b.count - a.count)
    .filter(l => l.count > 0);

  return `
    <div class="screen-header">
      <div class="flex items-center gap-sm">
        <span class="screen-icon" style="background:rgba(140,64,173,0.15); color:var(--kivu-tertiary);">
          ${icons.speaker(28)}
        </span>
        <div>
          <div class="screen-title">Voix humaines</div>
          <div class="screen-subtitle">Bibliothèque audio · enregistrements de locuteurs natifs</div>
        </div>
      </div>
    </div>

    ${renderStatsBanner(langStatRows)}

    <div class="voices-toolbar mb-md">
      <div class="voices-search">
        <span class="voices-search__icon">${icons.search(18)}</span>
        <input id="voices-search-input"
               class="voices-search__input"
               placeholder="Chercher un mot ou un locuteur…"
               value="${escapeAttr(query)}"
               autocomplete="off"
               spellcheck="false"/>
      </div>
      <div class="voices-filter scroll-x">
        <div class="scroll-x-row">
          <button class="pill-tab ${filterLang === 'all' ? 'active' : ''}" data-action="vx-filter" data-lang="all">
            🌍 Tout · ${stats.total}
          </button>
          ${LANGS.filter(l => stats.byLang[l.id]).map(l => `
            <button class="pill-tab ${filterLang === l.id ? 'active' : ''}" data-action="vx-filter" data-lang="${l.id}">
              ${l.flag} ${l.name} · ${stats.byLang[l.id]}
            </button>
          `).join('')}
        </div>
      </div>
    </div>

    ${renderEntries()}

    <button class="voices-fab" data-action="vx-new" aria-label="Nouvel enregistrement">
      ${icons.mic(24, 'white')}
      <span class="voices-fab__label">Nouvelle voix</span>
    </button>

    ${modalOpen ? renderModal() : ''}
  `;
}

function renderStatsBanner(langStats) {
  return `
    <div class="voices-stats mb-md">
      <div class="voices-stat">
        <div class="voices-stat__value">${stats.total}</div>
        <div class="voices-stat__label">Voix</div>
      </div>
      <div class="voices-stat">
        <div class="voices-stat__value">${Object.keys(stats.byLang).length}</div>
        <div class="voices-stat__label">Langues</div>
      </div>
      <div class="voices-stat voices-stat--accent">
        <div class="voices-stat__value">${formatBytes(stats.totalBytes)}</div>
        <div class="voices-stat__label">Stockage</div>
      </div>
    </div>
  `;
}

function renderEntries() {
  if (!entries.length) {
    return `
      <div class="empty-state mb-lg">
        <div class="empty-state__emoji">🎙️</div>
        <div class="empty-state__title">${stats.total === 0 ? 'Aucune voix enregistrée' : 'Aucun résultat'}</div>
        <div class="text-sm text-muted">${stats.total === 0
          ? 'Enregistre la première voix humaine en touchant le bouton micro.'
          : 'Essaie un autre filtre ou une autre recherche.'}</div>
      </div>
    `;
  }
  return `
    <div class="text-xs text-muted mb-sm" style="padding:0 4px;">
      ${entries.length} voix · ${filterLang === 'all' ? 'toutes langues' : langInfo(filterLang).name}
    </div>
    <div class="voices-grid mb-lg">
      ${entries.map(renderVoiceCard).join('')}
    </div>
  `;
}

function renderVoiceCard(e) {
  const info = langInfo(e.lang);
  return `
    <div class="voice-card" data-id="${e.id}">
      <div class="voice-card__head">
        <span class="voice-card__flag">${info.flag}</span>
        <div style="flex:1; min-width:0;">
          <div class="voice-card__lang">${info.name}</div>
          <div class="voice-card__text" title="${escapeAttr(e.text)}">${escapeHtml(e.text)}</div>
        </div>
        <button class="voice-card__play" data-action="vx-play" data-id="${e.id}" aria-label="Écouter">
          ${icons.speaker(20, 'white')}
        </button>
      </div>
      <div class="voice-card__meta">
        ${e.locutor ? `<span>👤 ${escapeHtml(e.locutor)}</span>` : ''}
        ${e.region ? `<span>📍 ${escapeHtml(e.region)}</span>` : ''}
        <span>${formatBytes(e.size || 0)}</span>
      </div>
      <div class="voice-card__actions">
        <button class="link-btn text-xs" data-action="vx-download" data-id="${e.id}">${icons.download(12)} Exporter</button>
        <button class="link-btn text-xs" data-action="vx-delete" data-id="${e.id}" style="color:var(--error);">${icons.trash(12)} Supprimer</button>
      </div>
    </div>
  `;
}

function renderModal() {
  const canSave = !!mPreviewBlob && mForm.text.trim().length >= 1 && mForm.lang;
  return `
    <div class="modal-backdrop" data-action="vx-close-modal">
      <div class="modal-sheet voice-modal" data-stop="true" role="dialog" aria-label="Nouvelle voix">
        <button class="modal-close" data-action="vx-close-modal" aria-label="Fermer">${icons.close(20)}</button>
        <h2 class="font-display font-bold text-lg mb-md">Nouvelle voix humaine</h2>

        <!-- Form -->
        <div class="form-group">
          <label class="form-label">Texte à prononcer</label>
          <input id="vx-text" class="form-input" type="text"
                 placeholder="Ex : Jambo, Ndewo, Bonjour…"
                 value="${escapeAttr(mForm.text)}" maxlength="120" autofocus/>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1;">
            <label class="form-label">Langue</label>
            <select id="vx-lang" class="form-input">
              ${LANGS.map(l => `<option value="${l.id}" ${mForm.lang === l.id ? 'selected' : ''}>${l.flag} ${l.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="flex:1;">
            <label class="form-label">Locuteur (optionnel)</label>
            <input id="vx-locutor" class="form-input" type="text"
                   placeholder="Ex : Aïcha D."
                   value="${escapeAttr(mForm.locutor)}" maxlength="60"/>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Région (optionnel)</label>
          <input id="vx-region" class="form-input" type="text"
                 placeholder="Ex : Dakar, Lagos, Nairobi…"
                 value="${escapeAttr(mForm.region)}" maxlength="60"/>
        </div>

        <!-- Recording control -->
        <div class="voice-modal__record ${mRecording ? 'is-recording' : ''}">
          <div class="voice-meter" style="--lvl: ${mLevel}%;">
            <div class="voice-meter__bar"></div>
          </div>
          <div class="voice-modal__record-row">
            <button class="voice-rec-btn ${mRecording ? 'is-recording' : ''}"
                    data-action="vx-toggle-rec" type="button"
                    aria-label="${mRecording ? 'Arrêter' : 'Enregistrer'}">
              ${mRecording ? '⏹' : icons.mic(24, 'white')}
            </button>
            <div style="flex:1;">
              <div class="font-bold">${mRecording ? 'Enregistrement en cours…' : (mPreviewBlob ? 'Aperçu prêt' : 'Touche pour enregistrer')}</div>
              <div class="text-xs text-muted">${mRecording ? formatMs(mElapsedMs) + ' · parle clairement' : (mPreviewBlob ? formatBytes(mPreviewBlob.size) : 'Ou importe un fichier audio')}</div>
            </div>
            <input type="file" id="vx-upload" accept="audio/*" style="display:none;"/>
            <button class="icon-btn icon-btn--sm" data-action="vx-upload" title="Importer un fichier">
              ${icons.download(18)}
            </button>
          </div>

          ${mPreviewBlob ? `
            <div class="voice-preview">
              <audio src="${mPreviewUrl}" controls style="width:100%;"></audio>
            </div>
          ` : ''}
        </div>

        <!-- Actions -->
        <div class="flex gap-sm mt-md">
          <button class="btn btn-ghost btn-full" data-action="vx-close-modal">Annuler</button>
          <button class="btn btn-primary btn-full" data-action="vx-save" ${canSave ? '' : 'disabled'}>
            Enregistrer la voix
          </button>
        </div>

        <div class="text-xs text-muted mt-sm" style="text-align:center;">
          Les voix sont stockées localement (IndexedDB) et utilisées à la place de la TTS.
        </div>
      </div>
    </div>
  `;
}

/* ─── Mount ────────────────────────────────────────────── */

renderVoices.mount = async () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = async (preserveFocus = false) => {
    const focusedId = preserveFocus ? document.activeElement?.id : null;
    const selStart = focusedId ? document.getElementById(focusedId)?.selectionStart : null;
    await refreshData();
    main.innerHTML = renderVoices();
    renderVoices.mount();
    if (focusedId) {
      const el = document.getElementById(focusedId);
      if (el) {
        el.focus();
        if (selStart != null && el.setSelectionRange) {
          try { el.setSelectionRange(selStart, selStart); } catch {}
        }
      }
    }
  };

  // Refresh data in the background (fire-and-forget, no recursive mount)
  // The first paint shows the empty state, then a single rerender
  // happens when data is ready. This prevents the infinite mount loop.
  refreshData().then(() => {
    // Only rerender if user is still on the voices page (didn't navigate away)
    if (document.querySelector('.voices-fab') || document.querySelector('.voices-stats')) {
      const m = document.querySelector('main.screen');
      if (m) {
        m.innerHTML = renderVoices();
        attachListeners();
      }
    }
  }).catch(() => {});

  attachListeners();

  // Subscribe to library changes — only once
  if (!unsubscribe) {
    unsubscribe = voiceLibrary.subscribe(() => {
      // Only rerender if we're still on the voices page
      if (document.querySelector('.voices-fab') || document.querySelector('.voices-stats')) {
        rerender();
      }
    });
  }

  // Helper that attaches all interactive listeners to the current DOM
  function attachListeners() {

  /* ── Search ── */
  const searchInput = document.getElementById('voices-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      query = searchInput.value;
      rerender(true);
    });
  }

  /* ── Filter pills ── */
  document.querySelectorAll('[data-action="vx-filter"]').forEach(btn =>
    btn.addEventListener('click', () => {
      filterLang = btn.dataset.lang;
      fx.click();
      rerender();
    })
  );

  /* ── Play voice ── */
  document.querySelectorAll('[data-action="vx-play"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const url = await voiceLibrary.getURL(id);
      if (!url) return;
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      audio.play().catch(() => URL.revokeObjectURL(url));
      fx.click();
    })
  );

  /* ── Download voice ── */
  document.querySelectorAll('[data-action="vx-download"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const entry = entries.find(e => e.id === id);
      const url = await voiceLibrary.getURL(id);
      if (!url || !entry) return;
      const a = document.createElement('a');
      a.href = url;
      const safe = (entry.text || 'voice').replace(/[^a-z0-9]+/gi, '_').slice(0, 30);
      const ext = (entry.mime || '').includes('mp4') ? 'mp4' : (entry.mime || '').includes('ogg') ? 'ogg' : 'webm';
      a.download = `kivu-${entry.lang}-${safe}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    })
  );

  /* ── Delete voice ── */
  document.querySelectorAll('[data-action="vx-delete"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const entry = entries.find(e => e.id === id);
      const ok = await confirmModal({
        icon: '🗑️',
        title: 'Supprimer cette voix ?',
        message: `« ${entry?.text || ''} » sera retiré de la bibliothèque. La TTS automatique reprendra pour ce mot.`,
        confirmLabel: 'Supprimer',
        cancelLabel: 'Garder',
        danger: true
      });
      if (!ok) return;
      await voiceLibrary.delete(id);
      rerender();
    })
  );

  /* ── Open modal ── */
  document.querySelectorAll('[data-action="vx-new"]').forEach(btn =>
    btn.addEventListener('click', () => {
      modalOpen = true;
      mForm = { lang: filterLang !== 'all' ? filterLang : 'swa', text: '', locutor: '', region: '' };
      mPreviewBlob = null;
      if (mPreviewUrl) URL.revokeObjectURL(mPreviewUrl);
      mPreviewUrl = null;
      mLevel = 0;
      mElapsedMs = 0;
      fx.click();
      rerender();
    })
  );

  /* ── Close modal ── */
  document.querySelectorAll('[data-action="vx-close-modal"]').forEach(el =>
    el.addEventListener('click', (ev) => {
      if (ev.target.closest('[data-stop="true"]') && !ev.target.matches('[data-action="vx-close-modal"]') && !ev.target.closest('[data-action="vx-close-modal"]')) return;
      cleanupModal();
      modalOpen = false;
      rerender();
    })
  );
  document.querySelectorAll('.modal-backdrop').forEach(bd => {
    bd.addEventListener('click', (ev) => {
      if (ev.target === bd) {
        cleanupModal();
        modalOpen = false;
        rerender();
      }
    });
  });

  /* ── Modal form inputs ── */
  document.getElementById('vx-text')?.addEventListener('input', (e) => {
    mForm.text = e.target.value;
    // Soft re-render of just the save button enabled state
    const btn = document.querySelector('[data-action="vx-save"]');
    const canSave = !!mPreviewBlob && e.target.value.trim().length >= 1 && mForm.lang;
    if (btn) {
      if (canSave) btn.removeAttribute('disabled'); else btn.setAttribute('disabled', '');
    }
  });
  document.getElementById('vx-lang')?.addEventListener('change', (e) => { mForm.lang = e.target.value; });
  document.getElementById('vx-locutor')?.addEventListener('input', (e) => { mForm.locutor = e.target.value; });
  document.getElementById('vx-region')?.addEventListener('input', (e) => { mForm.region = e.target.value; });

  /* ── Toggle recording ── */
  document.querySelectorAll('[data-action="vx-toggle-rec"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (mRecording) {
        // Stop
        try {
          const { blob } = await mRecorderSession.stop();
          mPreviewBlob = blob;
          if (mPreviewUrl) URL.revokeObjectURL(mPreviewUrl);
          mPreviewUrl = URL.createObjectURL(blob);
          fx.success();
        } catch (e) {
          if (window.__KIVU__?.toast) window.__KIVU__.toast('Erreur d\'enregistrement', { type: 'error' });
        }
        mRecording = false;
        if (mElapsedTimer) clearInterval(mElapsedTimer);
        rerender();
        return;
      }
      // Start
      if (!voiceRecorder.isSupported()) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Enregistrement non supporté par ce navigateur', { type: 'warning' });
        return;
      }
      try {
        mRecorderSession = await voiceRecorder.start({
          onLevel: (lvl) => {
            mLevel = lvl;
            // Lightweight DOM update on the meter without full rerender
            const meter = document.querySelector('.voice-meter');
            if (meter) meter.style.setProperty('--lvl', lvl + '%');
          }
        });
        mRecording = true;
        mElapsedMs = 0;
        if (mElapsedTimer) clearInterval(mElapsedTimer);
        const startTs = Date.now();
        mElapsedTimer = setInterval(() => {
          mElapsedMs = Date.now() - startTs;
          // Update only the elapsed text
          const el = document.querySelector('.voice-modal__record-row .text-muted');
          if (el && mRecording) el.textContent = `${formatMs(mElapsedMs)} · parle clairement`;
        }, 250);
        fx.click();
        rerender();
      } catch (e) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast(e.message || 'Permission micro refusée', { type: 'error' });
      }
    })
  );

  /* ── Upload file ── */
  document.querySelectorAll('[data-action="vx-upload"]').forEach(btn =>
    btn.addEventListener('click', () => {
      document.getElementById('vx-upload')?.click();
    })
  );
  document.getElementById('vx-upload')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/')) {
      if (window.__KIVU__?.toast) window.__KIVU__.toast('Sélectionne un fichier audio', { type: 'warning' });
      return;
    }
    mPreviewBlob = file;
    if (mPreviewUrl) URL.revokeObjectURL(mPreviewUrl);
    mPreviewUrl = URL.createObjectURL(file);
    fx.success();
    rerender();
  });

  /* ── Save ── */
  document.querySelectorAll('[data-action="vx-save"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      // Refresh form values from DOM (in case user typed without our handler being called)
      mForm.text = document.getElementById('vx-text')?.value || mForm.text;
      mForm.lang = document.getElementById('vx-lang')?.value || mForm.lang;
      mForm.locutor = document.getElementById('vx-locutor')?.value || '';
      mForm.region = document.getElementById('vx-region')?.value || '';

      if (!mPreviewBlob || !mForm.text.trim() || !mForm.lang) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Texte + audio requis', { type: 'warning' });
        return;
      }
      try {
        await voiceLibrary.save({
          lang: mForm.lang,
          text: mForm.text.trim(),
          blob: mPreviewBlob,
          locutor: mForm.locutor.trim(),
          region: mForm.region.trim()
        });
        fx.success();
        if (window.__KIVU__?.toast) {
          window.__KIVU__.toast(`Voix enregistrée : « ${mForm.text.trim()} » ${langInfo(mForm.lang).flag}`, { type: 'success', duration: 2400 });
        }
        cleanupModal();
        modalOpen = false;
        rerender();
      } catch (e) {
        if (window.__KIVU__?.toast) window.__KIVU__.toast('Échec de la sauvegarde', { type: 'error' });
      }
    })
  );

  /* ── Escape closes modal ── */
  if (modalOpen) {
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        cleanupModal();
        modalOpen = false;
        document.removeEventListener('keydown', onEsc);
        rerender();
      }
    };
    document.addEventListener('keydown', onEsc);
  }
  } // end attachListeners
};

function cleanupModal() {
  if (mRecording && mRecorderSession) {
    try { mRecorderSession.cancel(); } catch {}
    mRecording = false;
  }
  if (mElapsedTimer) {
    clearInterval(mElapsedTimer);
    mElapsedTimer = null;
  }
  if (mPreviewUrl) {
    URL.revokeObjectURL(mPreviewUrl);
    mPreviewUrl = null;
  }
  mPreviewBlob = null;
  mLevel = 0;
}
