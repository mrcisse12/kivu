/**
 * KIVU Speech — wrappers Web Speech API.
 *
 * Encapsule SpeechRecognition (STT) + SpeechSynthesis (TTS) avec :
 *  - détection de support
 *  - mapping langue interne KIVU (3 lettres) → BCP-47 navigateur
 *  - sélection automatique de la "meilleure" voix dispo dans la locale cible
 *  - gestion d'erreur propre
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

// ---- Detection ---------------------------------------------------------
const Recognition =
  typeof window !== 'undefined' &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export const speech = {
  sttSupported: !!Recognition,
  ttsSupported: typeof window !== 'undefined' && 'speechSynthesis' in window,

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
   * Synthétise et joue le texte dans la langue cible.
   * @param {string} text
   * @param {string} kivuLang
   */
  speak(text, kivuLang, { rate = 0.95, pitch = 1, volume = 1 } = {}) {
    if (!this.ttsSupported || !text) return;
    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    const bcp = toBcp47(kivuLang);
    u.lang = bcp;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;

    // Tente de trouver une voix native pour cette locale
    const voices = window.speechSynthesis.getVoices();
    const exact = voices.find(v => v.lang === bcp);
    const langOnly = voices.find(v => v.lang.startsWith(bcp.split('-')[0]));
    const chosen = exact || langOnly;
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
