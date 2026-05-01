/**
 * KIVU Speech — wrappers Web Speech API premium.
 *
 * Encapsule SpeechRecognition (STT) + SpeechSynthesis (TTS) avec :
 *  - Détection de support
 *  - Mapping langue interne KIVU (3 lettres) → BCP-47 navigateur
 *  - Sélection automatique de la **meilleure voix humaine** dispo
 *    (Google Neural / Microsoft Natural / Amazon / Apple Premium > standard)
 *  - Cache des voix pour éviter le re-tri à chaque appel
 *  - Gestion d'erreur propre
 */

// Mapping interne (KIVU codes 3 lettres) → BCP-47 navigateur
// Pour les langues africaines mineures où aucune voix n'existe, on tombe sur la
// langue voisine la plus proche (ex: dyu → fr-FR, bis → fr-FR).
const LANG_MAP = {
  fra: 'fr-FR',
  eng: 'en-US',
  swa: 'sw-KE',
  wol: 'fr-SN',  // Pas de voix wolof native — fallback FR Sénégal
  bam: 'fr-ML',
  dyu: 'fr-CI',
  lin: 'fr-CD',
  yor: 'yo-NG',
  hau: 'ha-NG',
  amh: 'am-ET',
  zul: 'zu-ZA',
  ibo: 'ig-NG',
  bis: 'fr-BF'
};

export function toBcp47(kivuCode) {
  return LANG_MAP[kivuCode] || 'fr-FR';
}

/* ─── Voice quality scoring ────────────────────────────────
   We rank voices by perceived "humanness" using known patterns:
   - "Google" voices in Chrome → neural, natural prosody
   - "Microsoft ... Natural" voices in Edge → very high quality
   - "Premium" / "Enhanced" / "Neural" suffixes → top tier
   - Apple "Siri" or "Premium" voices → excellent
   - "Amazon Polly" if present
   - Default voices → lowest score
   - Children/novelty voices → penalized
*/
function voiceScore(v) {
  if (!v) return 0;
  const name = v.name || '';
  let score = 0;

  // Quality keywords
  if (/\bnatural\b/i.test(name))     score += 100;  // Microsoft Natural
  if (/\bneural\b/i.test(name))      score += 90;
  if (/\bpremium\b/i.test(name))     score += 80;
  if (/\benhanced\b/i.test(name))    score += 70;
  if (/\bgoogle\b/i.test(name))      score += 65;   // Google Chrome voices
  if (/\bsiri\b/i.test(name))        score += 60;   // Apple Siri
  if (/\bamazon\b/i.test(name))      score += 55;   // AWS Polly (web embedded)
  if (/\bonline\b/i.test(name))      score += 30;   // Cloud-backed voices

  // Penalize novelty / robotic voices
  if (/\b(novelty|cellos|bells|bubbles|good news|bad news|albert|bahh|deranged|hysterical|trinoids|whisper|zarvox|jester|junior|princess|pipe organ|organ)\b/i.test(name)) score -= 50;
  if (/\beSpeak\b/i.test(name))      score -= 100;  // robotic open-source

  // Local vs cloud: cloud usually better (default flag is set on lower-quality)
  if (v.localService === false)      score += 20;
  if (v.default)                     score -= 5;    // default is usually basic

  // Slight preference for adult-sounding voices (heuristic)
  if (/\b(child|kid|junior)\b/i.test(name)) score -= 30;

  return score;
}

/* ─── Voice cache ─────────────────────────────────────────── */
let cachedVoices = null;
let cachedAt = 0;
const VOICES_TTL = 5_000; // ms

function getAllVoices() {
  if (!('speechSynthesis' in window)) return [];
  const now = Date.now();
  if (!cachedVoices || (now - cachedAt) > VOICES_TTL) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
    cachedAt = now;
  }
  return cachedVoices;
}

// Re-cache on voiceschanged event (Chrome loads async)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoices = window.speechSynthesis.getVoices() || [];
      cachedAt = Date.now();
    });
  } catch { /* older browsers */ }
}

/** Find the best-sounding voice for a given BCP-47 locale. */
function pickBestVoice(bcp47) {
  const voices = getAllVoices();
  if (!voices.length) return null;
  const lang2 = bcp47.split('-')[0]; // 'fr-FR' → 'fr'

  // 1. Voices matching exact locale
  const exact = voices.filter(v => v.lang === bcp47);
  // 2. Voices matching language family (fr-* for fr-FR)
  const family = voices.filter(v => v.lang.startsWith(lang2 + '-') || v.lang === lang2);
  // 3. All voices (last resort)
  const all = voices;

  const candidates = exact.length ? exact : (family.length ? family : all);
  // Sort by quality score desc
  candidates.sort((a, b) => voiceScore(b) - voiceScore(a));
  return candidates[0] || null;
}

/* ─── Detection ──────────────────────────────────────────── */
const Recognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

/* ─── Public API ─────────────────────────────────────────── */
export const speech = {
  sttSupported: !!Recognition,
  ttsSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,

  /**
   * Returns the best voice that will actually be used for this language.
   * Useful for showing the user which voice is active.
   */
  getActiveVoice(kivuLang) {
    if (!this.ttsSupported) return null;
    return pickBestVoice(toBcp47(kivuLang));
  },

  /** List all installed voices (used by settings page voice picker) */
  listVoices() {
    return getAllVoices();
  },

  /**
   * Démarre une session de reconnaissance vocale.
   * @param {string} kivuLang  ex: 'fra', 'swa', 'wol'
   * @param {object} handlers  { onResult, onError, onEnd, interim? }
   * @returns {() => void} fonction stop()
   */
  startListening(kivuLang, { onResult, onError, onEnd, interim = true } = {}) {
    if (!Recognition) {
      onError?.(new Error('SpeechRecognition non supporté par ce navigateur'));
      return () => {};
    }
    const r = new Recognition();
    r.lang = toBcp47(kivuLang);
    r.continuous = false;
    r.interimResults = interim;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let final = '';
      let partial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else partial += text;
      }
      onResult?.({
        text: (final || partial).trim(),
        isFinal: !!final,
        confidence: e.results[e.results.length - 1]?.[0]?.confidence ?? 0
      });
    };

    r.onerror = (e) => onError?.(e.error || e);
    r.onend   = () => onEnd?.();

    try { r.start(); }
    catch (e) { onError?.(e); }

    return () => {
      try { r.stop(); } catch { /* noop */ }
    };
  },

  /**
   * Synthétise et joue le texte avec la meilleure voix humaine disponible.
   * @param {string} text
   * @param {string} kivuLang
   * @param {object} opts { rate, pitch, volume, preferredVoiceURI? }
   */
  speak(text, kivuLang, { rate = 1.0, pitch = 1.0, volume = 1.0, preferredVoiceURI = null } = {}) {
    if (!this.ttsSupported || !text) return Promise.resolve();
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    const bcp = toBcp47(kivuLang);
    u.lang = bcp;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;

    // Use user-pinned voice if provided
    let chosen = null;
    if (preferredVoiceURI) {
      chosen = getAllVoices().find(v => v.voiceURI === preferredVoiceURI) || null;
    }
    if (!chosen) chosen = pickBestVoice(bcp);
    if (chosen) u.voice = chosen;

    window.speechSynthesis.speak(u);
    return new Promise(resolve => {
      u.onend = resolve;
      u.onerror = resolve;
    });
  },

  cancelSpeech() {
    if (this.ttsSupported) window.speechSynthesis.cancel();
  }
};

/** Pre-warm the voices cache as soon as possible (Chrome async-loads) */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Trigger initial fetch
  setTimeout(() => getAllVoices(), 50);
  setTimeout(() => getAllVoices(), 500);
  setTimeout(() => getAllVoices(), 2000);
}
