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
 * Translate text from `fromAppLang` (3-char) to `toAppLang`.
 * Returns { translatedText, confidence, offline: true, source: 'dictionary' }
 * or null if no translation could be found (callers should display an error).
 */
export function offlineTranslate(text, fromAppLang, toAppLang) {
  const fromKey = APP_TO_DICT[fromAppLang];
  const toKey = APP_TO_DICT[toAppLang];
  if (!fromKey || !toKey || !text || !text.trim()) return null;

  const lookup = buildLookup();
  const norm = normalize(text);

  // 1) Exact whole-phrase match
  const direct = lookup[fromKey]?.[norm];
  if (direct && direct[toKey]) {
    return {
      translatedText: direct[toKey],
      confidence: 0.95,
      offline: true,
      source: 'dictionary',
      durationMs: 0
    };
  }

  // 2) Word-by-word translation
  const words = text.split(/(\s+|[.,!?;:])/);
  let foundAny = false;
  const translatedWords = words.map(w => {
    if (!w.trim()) return w;
    const punct = /^[.,!?;:]+$/.test(w);
    if (punct) return w;
    const normalizedWord = normalize(w);
    const entry = lookup[fromKey]?.[normalizedWord];
    if (entry && entry[toKey]) {
      foundAny = true;
      // Preserve capitalization of first letter
      const tr = entry[toKey];
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
      confidence: 0.55,
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
