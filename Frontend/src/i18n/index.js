/**
 * KIVU — i18n minimaliste, 5 langues mondiales :
 *   Français · English · Kiswahili · العربية (RTL) · Wolof
 *
 * Pas de dépendance externe. La fonction t(key) renvoie la traduction
 * dans la langue active (préférence utilisateur). Format : dot-paths.
 *
 * Le Wolof est conservé comme symbole fort de la mission KIVU :
 * une app de langues africaines qui les utilise VRAIMENT comme UI.
 *
 * L'arabe active automatiquement le mode RTL (sens droite-à-gauche)
 * sur le document HTML.
 */

import { fr } from './fr.js';
import { en } from './en.js';
import { sw } from './sw.js';
import { ar } from './ar.js';
import { wo } from './wo.js';

const DICTIONARIES = { fr, en, sw, ar, wo };

// Langues à sens droite-à-gauche
const RTL_LANGS = new Set(['ar']);

let currentLang = 'fr';

const listeners = new Set();

/** Applique l'attribut dir="rtl|ltr" + classe sur <html> */
function applyDir(lang) {
  const isRtl = RTL_LANGS.has(lang);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.classList.toggle('is-rtl', isRtl);
}

/** Initialise depuis localStorage avant le premier rendu. */
export function initI18n(lang) {
  if (lang && DICTIONARIES[lang]) {
    currentLang = lang;
    document.documentElement.lang = lang;
    applyDir(lang);
  } else {
    applyDir(currentLang);
  }
}

/** Change la langue d'interface en runtime. */
export function setLang(lang) {
  if (!DICTIONARIES[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang;
  applyDir(lang);
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
  { id: 'fr', name: 'Français',  native: 'Français',  flag: '🇫🇷' },
  { id: 'en', name: 'English',   native: 'English',   flag: '🇬🇧' },
  { id: 'sw', name: 'Swahili',   native: 'Kiswahili', flag: '🇹🇿' },
  { id: 'ar', name: 'العربية',   native: 'العربية',   flag: '🇸🇦' },
  { id: 'wo', name: 'Wolof',     native: 'Wolof',     flag: '🇸🇳' }
];
