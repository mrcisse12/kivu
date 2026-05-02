/**
 * KIVU — Traducteur hors-ligne (basé sur le dictionnaire local).
 *
 * Quand le backend n'est pas joignable, on traduit en exploitant
 * les entrées du dictionnaire (~80 mots/expressions × 8 langues).
 * Algorithme :
 *   1. Détection de "phrase entière" exacte (insensible à la casse / accents)
 *   2. Détection mot-par-mot pour les phrases composées
 *   3. Si rien ne matche → retourne le texte original avec une note
 */

import { ENTRIES } from '../data/dictionary.js';

const LANG_KEYS = ['fr', 'en', 'swa', 'wol', 'bam', 'hau', 'yor', 'zul', 'ibo', 'lin', 'dyu'];

// Map app language codes (3-char) → dictionary keys (2-3 char)
const APP_TO_DICT = {
  fra: 'fr', eng: 'en',
  swa: 'swa', wol: 'wol', bam: 'bam', hau: 'hau',
  yor: 'yor', zul: 'zul', ibo: 'ibo', lin: 'lin',
  dyu: 'bam' // Dioula proche du Bambara
};

function normalize(s) {
  return String(s || '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Build an in-memory lookup index { langKey: { normalized: entry } } once */
let LOOKUP = null;
function buildLookup() {
  if (LOOKUP) return LOOKUP;
  LOOKUP = {};
  for (const lang of LANG_KEYS) {
    LOOKUP[lang] = {};
    for (const e of ENTRIES) {
      const v = e[lang];
      if (v) LOOKUP[lang][normalize(v)] = e;
    }
  }
  return LOOKUP;
}

/**
 * Find an entry by trying multiple source languages in order.
 * This makes the translator robust when users type in French even
 * when the source language is set to an African one.
 */
function lookupFlexible(normalized, primaryKey) {
  const lookup = buildLookup();
  // Order : declared source first, then French, English, then all others
  const order = [primaryKey, 'fr', 'en', ...LANG_KEYS.filter(l => l !== primaryKey && l !== 'fr' && l !== 'en')];
  for (const lang of order) {
    const entry = lookup[lang]?.[normalized];
    if (entry) return { entry, foundIn: lang };
  }
  return null;
}

/**
 * Translate text from `fromAppLang` (3-char) to `toAppLang`.
 * Returns { translatedText, confidence, offline: true, source: 'dictionary' }
 * or null if no translation could be found (callers should display an error).
 *
 * Smart fallback : if no match in declared source language, also tries
 * French, English, then all other languages. If translating from a non-
 * declared source, we lower confidence accordingly.
 */
export function offlineTranslate(text, fromAppLang, toAppLang) {
  const fromKey = APP_TO_DICT[fromAppLang] || 'fr';
  const toKey = APP_TO_DICT[toAppLang];
  if (!toKey || !text || !text.trim()) return null;

  const norm = normalize(text);

  // 1) Exact whole-phrase match (with smart source fallback)
  const direct = lookupFlexible(norm, fromKey);
  if (direct && direct.entry[toKey]) {
    const matchedSource = direct.foundIn === fromKey;
    return {
      translatedText: direct.entry[toKey],
      confidence: matchedSource ? 0.95 : 0.78,
      offline: true,
      source: matchedSource ? 'dictionary' : `dictionary-from-${direct.foundIn}`,
      durationMs: 0
    };
  }

  // 2) Word-by-word translation with smart fallback per word
  const words = text.split(/(\s+|[.,!?;:])/);
  let foundAny = false;
  let allMatchedDeclaredSource = true;
  const translatedWords = words.map(w => {
    if (!w.trim()) return w;
    const punct = /^[.,!?;:]+$/.test(w);
    if (punct) return w;
    const normalizedWord = normalize(w);
    const found = lookupFlexible(normalizedWord, fromKey);
    if (found && found.entry[toKey]) {
      foundAny = true;
      if (found.foundIn !== fromKey) allMatchedDeclaredSource = false;
      const tr = found.entry[toKey];
      if (w[0] === w[0].toUpperCase() && tr.length > 0) {
        return tr[0].toUpperCase() + tr.slice(1);
      }
      return tr;
    }
    return w; // unknown word → keep original
  });

  if (foundAny) {
    return {
      translatedText: translatedWords.join(''),
      confidence: allMatchedDeclaredSource ? 0.55 : 0.42,
      offline: true,
      source: 'dictionary-words',
      durationMs: 0
    };
  }

  // 3) Nothing matched
  return null;
}

/** True if the error looks like a network error (so caller can fall back) */
export function isNetworkError(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return msg.includes('failed to fetch') ||
         msg.includes('networkerror') ||
         msg.includes('network request failed') ||
         msg.includes('load failed') ||
         err.name === 'TypeError';
}
