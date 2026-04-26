/**
 * KIVU — i18n minimaliste, 3 langues : Français / English / Wolof.
 *
 * Pas de dépendance externe. La fonction t(key) renvoie la traduction
 * dans la langue active (préférence utilisateur). Format : dot-paths.
 *
 * Wolof = symbole fort. Choisir le wolof comme langue d'interface
 * pour une app de langues africaines = la preuve qu'on en parle pas
 * QUE des langues africaines, on les utilise vraiment.
 */

import { fr } from './fr.js';
import { en } from './en.js';
import { wo } from './wo.js';

const DICTIONARIES = { fr, en, wo };

let currentLang = 'fr';

const listeners = new Set();

/** Initialise depuis localStorage avant le premier rendu. */
export function initI18n(lang) {
  if (lang && DICTIONARIES[lang]) {
    currentLang = lang;
    document.documentElement.lang = lang;
  }
}

/** Change la langue d'interface en runtime. */
export function setLang(lang) {
  if (!DICTIONARIES[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  listeners.forEach(cb => cb(lang));
}

export function getLang() {
  return currentLang;
}

export function onLangChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Traduit une clé. Tombe sur français si manquante. Supporte interpolation {var}.
 * Exemple : t('home.greeting', { name: 'Amadou' })
 */
export function t(key, vars = {}) {
  const dict = DICTIONARIES[currentLang] || fr;
  const fallback = fr;

  const lookup = (d) => {
    const parts = key.split('.');
    let cur = d;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) cur = cur[p];
      else return undefined;
    }
    return typeof cur === 'string' ? cur : undefined;
  };

  let str = lookup(dict) ?? lookup(fallback) ?? key;

  // Interpolation {name}
  for (const [k, v] of Object.entries(vars)) {
    str = str.replaceAll(`{${k}}`, v);
  }
  return str;
}

export const LANGS_AVAILABLE = [
  { id: 'fr', name: 'Français', native: 'Français', flag: '🇫🇷' },
  { id: 'en', name: 'English',  native: 'English',  flag: '🇬🇧' },
  { id: 'wo', name: 'Wolof',    native: 'Wolof',    flag: '🇸🇳' }
];
