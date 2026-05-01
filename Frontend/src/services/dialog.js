/**
 * KIVU — Modal dialogs (confirm + prompt) avec design cohérent.
 *
 * Remplace les `confirm()` et `prompt()` natifs par des modales
 * stylisées qui s'intègrent au design KIVU. Promesse-friendly :
 *
 *   const ok = await confirmModal({ title: '...', message: '...' });
 *   const value = await promptModal({ title: '...', placeholder: '...' });
 */

import { fx } from './audio-fx.js';

let backdropEl = null;

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function ensureContainer() {
  if (backdropEl) return backdropEl;
  backdropEl = document.createElement('div');
  backdropEl.className = 'kivu-dialog-backdrop';
  document.body.appendChild(backdropEl);
  return backdropEl;
}

function teardown() {
  if (backdropEl) {
    backdropEl.classList.add('is-leaving');
    setTimeout(() => {
      if (backdropEl) {
        backdropEl.remove();
        backdropEl = null;
      }
    }, 200);
  }
}

/**
 * Show a confirmation dialog. Resolves to true if confirmed, false otherwise.
 *
 * @param {Object} opts
 * @param {string} opts.title          Header text (e.g. "Supprimer ?")
 * @param {string} [opts.message]      Sub-text below title
 * @param {string} [opts.confirmLabel] Default "Confirmer"
 * @param {string} [opts.cancelLabel]  Default "Annuler"
 * @param {string} [opts.icon]         Emoji shown above title (e.g. "🗑️")
 * @param {boolean} [opts.danger]      Style confirm button as danger (red)
 * @returns {Promise<boolean>}
 */
export function confirmModal({
  title = 'Confirmer ?',
  message = '',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  icon = null,
  danger = false
} = {}) {
  return new Promise(resolve => {
    const root = ensureContainer();
    root.innerHTML = `
      <div class="kivu-dialog kivu-dialog--in" role="alertdialog" aria-modal="true" aria-labelledby="kdlg-title">
        ${icon ? `<div class="kivu-dialog__icon">${escapeHtml(icon)}</div>` : ''}
        <h2 class="kivu-dialog__title" id="kdlg-title">${escapeHtml(title)}</h2>
        ${message ? `<p class="kivu-dialog__msg">${escapeHtml(message)}</p>` : ''}
        <div class="kivu-dialog__actions">
          <button class="btn btn-ghost btn-full kivu-dialog__cancel" type="button">${escapeHtml(cancelLabel)}</button>
          <button class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-full kivu-dialog__confirm" type="button" autofocus>${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    requestAnimationFrame(() => root.classList.add('is-open'));

    const cleanup = (result) => {
      teardown();
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { fx.click(); cleanup(false); }
      else if (e.key === 'Enter') { fx.click(); cleanup(true); }
    };
    document.addEventListener('keydown', onKey);

    root.querySelector('.kivu-dialog__cancel')?.addEventListener('click', () => { fx.click(); cleanup(false); });
    root.querySelector('.kivu-dialog__confirm')?.addEventListener('click', () => { fx.click(); cleanup(true); });
    root.addEventListener('click', (e) => {
      if (e.target === root) { fx.click(); cleanup(false); }
    });
    // Auto-focus the confirm button
    setTimeout(() => root.querySelector('.kivu-dialog__confirm')?.focus(), 50);
  });
}

/**
 * Show an input prompt dialog. Resolves to the entered value, or null if cancelled.
 *
 * @param {Object} opts
 * @param {string} opts.title           Header text
 * @param {string} [opts.message]       Sub-text below title
 * @param {string} [opts.placeholder]   Input placeholder
 * @param {string} [opts.defaultValue]  Pre-filled value
 * @param {string} [opts.confirmLabel]  Default "Valider"
 * @param {string} [opts.cancelLabel]   Default "Annuler"
 * @param {string} [opts.icon]          Emoji shown above title
 * @param {(v:string)=>string|null} [opts.validate] Validator returning error message or null
 * @param {string} [opts.inputType]     Input type (default "text")
 * @param {string} [opts.transform]     "uppercase" | "lowercase" | undefined
 * @returns {Promise<string|null>}
 */
export function promptModal({
  title = 'Saisis une valeur',
  message = '',
  placeholder = '',
  defaultValue = '',
  confirmLabel = 'Valider',
  cancelLabel = 'Annuler',
  icon = null,
  validate = null,
  inputType = 'text',
  transform = null
} = {}) {
  return new Promise(resolve => {
    const root = ensureContainer();
    const transformStyle = transform === 'uppercase'
      ? 'text-transform: uppercase; letter-spacing: 0.6px;'
      : transform === 'lowercase'
        ? 'text-transform: lowercase;' : '';
    root.innerHTML = `
      <div class="kivu-dialog kivu-dialog--in" role="dialog" aria-modal="true" aria-labelledby="kdlg-title">
        ${icon ? `<div class="kivu-dialog__icon">${escapeHtml(icon)}</div>` : ''}
        <h2 class="kivu-dialog__title" id="kdlg-title">${escapeHtml(title)}</h2>
        ${message ? `<p class="kivu-dialog__msg">${escapeHtml(message)}</p>` : ''}
        <div class="kivu-dialog__field">
          <input class="form-input kivu-dialog__input" type="${escapeHtml(inputType)}"
                 placeholder="${escapeHtml(placeholder)}"
                 value="${escapeHtml(defaultValue)}"
                 style="${transformStyle}"
                 autocomplete="off"
                 autofocus/>
          <div class="kivu-dialog__error" hidden></div>
        </div>
        <div class="kivu-dialog__actions">
          <button class="btn btn-ghost btn-full kivu-dialog__cancel" type="button">${escapeHtml(cancelLabel)}</button>
          <button class="btn btn-primary btn-full kivu-dialog__confirm" type="button">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    requestAnimationFrame(() => root.classList.add('is-open'));

    const input = root.querySelector('.kivu-dialog__input');
    const errorEl = root.querySelector('.kivu-dialog__error');

    const cleanup = (result) => {
      teardown();
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };
    const tryConfirm = () => {
      let value = input?.value || '';
      if (transform === 'uppercase') value = value.toUpperCase();
      else if (transform === 'lowercase') value = value.toLowerCase();
      value = value.trim();
      if (validate) {
        const err = validate(value);
        if (err) {
          if (errorEl) {
            errorEl.textContent = err;
            errorEl.removeAttribute('hidden');
          }
          fx.wrong();
          return;
        }
      }
      fx.click();
      cleanup(value);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') { fx.click(); cleanup(null); }
      else if (e.key === 'Enter') { e.preventDefault(); tryConfirm(); }
    };
    document.addEventListener('keydown', onKey);

    root.querySelector('.kivu-dialog__cancel')?.addEventListener('click', () => { fx.click(); cleanup(null); });
    root.querySelector('.kivu-dialog__confirm')?.addEventListener('click', tryConfirm);
    root.addEventListener('click', (e) => {
      if (e.target === root) { fx.click(); cleanup(null); }
    });
    setTimeout(() => input?.focus(), 50);
  });
}
