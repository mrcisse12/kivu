import { LANGUAGES } from '../data/languages.js';
import { icons } from '../components/icons.js';
import { recorder } from '../services/recorder.js';

const CATEGORIES = [
  { emoji: '📖', title: 'Contes & légendes', count: 1247, color: 'var(--kivu-primary)' },
  { emoji: '💬', title: 'Proverbes',         count: 847,  color: 'var(--kivu-tertiary)' },
  { emoji: '🎵', title: 'Chants & musique',  count: 523,  color: 'var(--kivu-accent)' },
  { emoji: '✨', title: 'Cérémonies',         count: 234,  color: 'var(--kivu-secondary)' },
  { emoji: '🌿', title: 'Savoir médicinal',  count: 156,  color: 'var(--success)' },
  { emoji: '⏳', title: 'Histoire orale',    count: 412,  color: 'var(--info)' }
];

// State
let isRecording = false;
let session = null;
let elapsedMs = 0;
let elapsedTimer = null;
let recordingError = null;
let savingFor = null;  // tmp record awaiting title

export function renderPreserve() {
  const endangered = LANGUAGES.filter(l => ['endangered','critical','vulnerable'].includes(l.status));
  const myRecordings = recorder.list();

  return `
    <div class="screen-header">
      <div>
        <div class="screen-title">Préservation</div>
        <div class="screen-subtitle">L'héritage de l'humanité, éternel</div>
      </div>
    </div>

    <div class="hero-card grad-royal mb-md" style="position:relative; overflow:hidden;">
      <span class="orb orb--purple" style="width:160px;height:160px;top:-60px;right:-40px;opacity:0.4"></span>
      <div style="position:relative;z-index:1;">
        <span class="chip chip-white mb-sm">Mission sacrée</span>
        <div class="text-2xl font-bold mt-xs" data-counter="483">483</div>
        <div class="text-sm mt-xs" style="opacity:0.92;">langues sauvegardées</div>
        <div class="text-xs mt-xs" style="opacity:0.78;">Grâce à 127 000 contributeurs à travers le monde.</div>
        <div class="grid grid-3 mt-md preserve-stats">
          <div><div class="font-bold text-lg">1 247</div><div class="text-xs" style="opacity:0.85">h d'audio</div></div>
          <div><div class="font-bold text-lg">84 K</div><div class="text-xs" style="opacity:0.85">mots</div></div>
          <div><div class="font-bold text-lg">317</div><div class="text-xs" style="opacity:0.85">proverbes</div></div>
        </div>
      </div>
    </div>

    <!-- Live recording widget -->
    <div class="card recorder-card mb-md ${isRecording ? 'recorder-card--recording' : ''}">
      <div class="flex justify-between items-center mb-sm">
        <div class="flex items-center gap-xs">
          <span class="recorder-pulse ${isRecording ? 'is-on' : ''}"></span>
          <div>
            <div class="font-bold">${isRecording ? 'Enregistrement…' : 'Enregistrer ma langue'}</div>
            <div class="text-xs text-muted">
              ${isRecording
                ? 'Parlez clairement. Votre voix sera préservée.'
                : 'Histoires, proverbes, chants — partagez votre héritage.'}
            </div>
          </div>
        </div>
        <div class="recorder-time">${recorder.formatDuration(elapsedMs)}</div>
      </div>

      <div class="flex gap-xs">
        ${isRecording ? `
          <button class="btn btn-primary btn-full" data-action="stop-recording" style="background:var(--error);">
            <span style="display:inline-flex;gap:8px;align-items:center;justify-content:center;">
              ${icons.close(18, 'white')} Arrêter et sauvegarder
            </span>
          </button>
        ` : `
          <button class="btn btn-primary btn-full" data-action="start-recording"
                  ${!recorder.supported ? 'disabled' : ''}
                  style="background:var(--kivu-tertiary);">
            <span style="display:inline-flex;gap:8px;align-items:center;justify-content:center;">
              ${icons.mic(18, 'white')} Démarrer l'enregistrement
            </span>
          </button>
        `}
      </div>

      ${!recorder.supported ? `
        <div class="text-xs mt-sm" style="color:var(--warning);">
          MediaRecorder non supporté par ce navigateur. Utilisez Chrome, Edge ou Safari récent.
        </div>` : ''}
      ${recordingError ? `<div class="text-xs mt-sm" style="color:var(--error);">${recordingError}</div>` : ''}

      ${savingFor ? renderSaveForm() : ''}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Archives culturelles</h2>
    <div class="grid grid-2 mb-lg">
      ${CATEGORIES.map(c => `
        <button class="feature-tile">
          <div class="feature-icon" style="background:${c.color}1a; color:${c.color};">
            <span aria-hidden="true">${c.emoji}</span>
          </div>
          <div class="feature-title">${c.title}</div>
          <div class="feature-desc">${c.count} contributions</div>
        </button>
      `).join('')}
    </div>

    <div class="section-head mb-sm">
      <h2 class="font-display font-bold text-lg">Langues en péril</h2>
      <span class="chip chip-error">${endangered.length} langues</span>
    </div>
    <div class="flex flex-col gap-xs mb-lg">
      ${endangered.map(l => `
        <div class="list-row endangered-row">
          <div class="avatar avatar--endangered">${l.flag}</div>
          <div style="flex:1; min-width:0;">
            <div class="font-semibold">${l.name} <span class="text-xs text-muted">· ${l.nativeName}</span></div>
            <div class="text-xs text-status">
              ${statusLabel(l.status)} — ${(l.speakers/1000).toFixed(0)} K locuteurs
            </div>
          </div>
          <button class="icon-btn icon-btn--sm" style="color:var(--kivu-tertiary);" aria-label="Contribuer">
            ${icons.plus(20)}
          </button>
        </div>
      `).join('')}
    </div>

    <h2 class="font-display font-bold text-lg mb-sm">Mon archive familiale</h2>
    ${myRecordings.length === 0 ? `
      <div class="empty-state mb-lg">
        <span class="empty-state__emoji">🎙️</span>
        <div class="empty-state__title">Aucun enregistrement encore</div>
        <div class="text-sm">Démarrez votre premier enregistrement plus haut.</div>
      </div>
    ` : `
      <div class="flex flex-col gap-xs mb-lg">
        ${myRecordings.map(r => renderRecording(r)).join('')}
      </div>
    `}
  `;
}

function renderSaveForm() {
  return `
    <div class="save-form mt-sm">
      <div class="text-sm font-semibold mb-xs">Donnez un titre à votre enregistrement</div>
      <input id="record-title-input"
             class="form-input"
             placeholder="Ex : Le conte du lièvre rusé en Wolof"
             autofocus/>
      <div class="flex gap-xs mt-sm">
        <button class="btn btn-ghost btn-sm" data-action="cancel-save">Annuler</button>
        <button class="btn btn-primary btn-sm" data-action="confirm-save"
                style="background:var(--kivu-tertiary); margin-left:auto;">Sauvegarder</button>
      </div>
    </div>
  `;
}

function renderRecording(r) {
  return `
    <div class="list-row recording-row" data-rec-id="${r.id}">
      <button class="recording-play"
              data-action="play-record" data-rec-id="${r.id}"
              aria-label="Lire">
        ${icons.speaker(18, 'white')}
      </button>
      <div style="flex:1; min-width:0;">
        <div class="font-semibold text-sm">${escapeHtml(r.title)}</div>
        <div class="text-xs text-muted">
          ${recorder.formatDuration(r.durationMs)} · ${formatDate(r.createdAt)}
        </div>
      </div>
      <button class="icon-btn icon-btn--sm" data-action="delete-record" data-rec-id="${r.id}"
              aria-label="Supprimer">
        ${icons.close(18)}
      </button>
    </div>
  `;
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return ''; }
}

function statusLabel(s) {
  if (s === 'critical')   return 'Critique';
  if (s === 'endangered') return 'Menacée';
  return 'Vulnérable';
}

renderPreserve.mount = () => {
  const main = document.querySelector('main.screen');
  if (!main) return;

  const rerender = () => {
    main.innerHTML = renderPreserve();
    renderPreserve.mount();
  };

  document.querySelectorAll('[data-action="start-recording"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      try {
        recordingError = null;
        elapsedMs = 0;
        session = await recorder.start();
        isRecording = true;
        elapsedTimer = setInterval(() => {
          elapsedMs += 250;
          const t = document.querySelector('.recorder-time');
          if (t) t.textContent = recorder.formatDuration(elapsedMs);
        }, 250);
        rerender();
        if (window.__KIVU__?.toast)
          window.__KIVU__.toast('Enregistrement démarré', { type: 'success', duration: 1400 });
      } catch (err) {
        recordingError = err?.name === 'NotAllowedError'
          ? 'Microphone refusé. Autorisez l\'accès dans le navigateur.'
          : `Erreur : ${err?.message || err}`;
        rerender();
      }
    })
  );

  document.querySelectorAll('[data-action="stop-recording"]').forEach(btn =>
    btn.addEventListener('click', async () => {
      if (!session) return;
      clearInterval(elapsedTimer);
      const blob = await session.stop();
      const dataUrl = await recorder.blobToDataUrl(blob);
      savingFor = {
        id: 'rec_' + Date.now(),
        durationMs: elapsedMs,
        createdAt: new Date().toISOString(),
        dataUrl,
        size: blob.size
      };
      session = null;
      isRecording = false;
      rerender();
      // focus the title input
      setTimeout(() => document.getElementById('record-title-input')?.focus(), 50);
    })
  );

  document.querySelectorAll('[data-action="confirm-save"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const title = document.getElementById('record-title-input')?.value?.trim()
        || `Enregistrement du ${formatDate(savingFor.createdAt)}`;
      recorder.save({ ...savingFor, title });
      savingFor = null;
      elapsedMs = 0;
      rerender();
      if (window.__KIVU__?.toast)
        window.__KIVU__.toast('Sauvegardé dans votre archive', { type: 'success' });
    })
  );

  document.querySelectorAll('[data-action="cancel-save"]').forEach(btn =>
    btn.addEventListener('click', () => {
      savingFor = null;
      elapsedMs = 0;
      rerender();
    })
  );

  document.querySelectorAll('[data-action="play-record"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.recId;
      const rec = recorder.list().find(r => r.id === id);
      if (!rec) return;
      const audio = new Audio(rec.dataUrl);
      audio.play().catch(err => {
        if (window.__KIVU__?.toast)
          window.__KIVU__.toast('Impossible de lire l\'audio : ' + err.message, { type: 'error' });
      });
    })
  );

  document.querySelectorAll('[data-action="delete-record"]').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = btn.dataset.recId;
      if (!confirm('Supprimer cet enregistrement ?')) return;
      recorder.delete(id);
      rerender();
    })
  );
};
