/**
 * KIVU Speech — wrappers Web Speech API premium.
 *
 * Encapsule SpeechRecognition (STT) + SpeechSynthesis (TTS) avec :
 *  - Détection de support
 *  - Mapping langue interne KIVU (3 lettres) → BCP-47 navigateur
 *  - Sélection automatique de la **meilleure voix humaine** dispo
 *    (Google Neural / Microsoft Natural / Amazon / Apple Premium > standard)
 *  - Intégration des voix premium IA (ElevenLabs / OpenAI TTS) si activé
 *  - Cache des voix pour éviter le re-tri à chaque appel
 *  - Gestion d'erreur propre
 */

/** Returns true if user enabled premium IA voices in settings.
    Read directly from localStorage to avoid circular import with store.js */
function isPremiumVoiceEnabled() {
  try {
    const raw = localStorage.getItem('kivu.state');
    if (!raw) return false;
    const state = JSON.parse(raw);
    return state?.preferences?.premiumVoice === true;
  } catch {
    return false;
  }
}

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

/* ─── Per-language voice profiles ──────────────────────────
   Each African language gets a personality : preferred gender,
   warmth, locale fallback chain, and TTS rate/pitch tuning that
   feels natural for that language.

   `chain` is a list of BCP-47 locales tried in order. The first
   one that has a voice available is used.
   `genderPref` favors male/female voices when available.
   `rate` / `pitch` are global multipliers for that language.
*/
const VOICE_PROFILES = {
  // African Bantu languages — warmer, slower, female preferred
  swa: { chain: ['sw-KE', 'sw-TZ', 'sw', 'en-KE', 'en-NG'], genderPref: 'female', rate: 0.92, pitch: 1.05 },
  zul: { chain: ['zu-ZA', 'zu', 'en-ZA', 'af-ZA'],          genderPref: 'female', rate: 0.92, pitch: 1.0  },
  lin: { chain: ['fr-CD', 'fr-CG', 'fr-FR'],                genderPref: 'female', rate: 0.95, pitch: 1.05 },
  // West African — French fallback with regional accent if available
  wol: { chain: ['fr-SN', 'fr-FR', 'fr'],                   genderPref: 'female', rate: 0.95, pitch: 1.05 },
  bam: { chain: ['fr-ML', 'fr-BF', 'fr-FR', 'fr'],          genderPref: 'female', rate: 0.95, pitch: 1.0  },
  dyu: { chain: ['fr-CI', 'fr-FR', 'fr'],                   genderPref: 'female', rate: 0.95, pitch: 1.05 },
  // Nigerian languages — try native, fall back to en-NG
  hau: { chain: ['ha-NG', 'ha', 'en-NG', 'en-GB'],          genderPref: 'male',   rate: 0.95, pitch: 0.95 },
  yor: { chain: ['yo-NG', 'yo', 'en-NG', 'en-GB'],          genderPref: 'female', rate: 0.92, pitch: 1.05 },
  ibo: { chain: ['ig-NG', 'ig', 'en-NG', 'en-GB'],          genderPref: 'female', rate: 0.95, pitch: 1.05 },
  // Horn of Africa
  amh: { chain: ['am-ET', 'am', 'en-GB'],                   genderPref: 'female', rate: 0.95, pitch: 1.0  },
  // Burkina-Bisa fallback
  bis: { chain: ['fr-BF', 'fr-FR', 'fr'],                   genderPref: 'female', rate: 0.95, pitch: 1.05 },
  // Major UI languages
  fra: { chain: ['fr-FR', 'fr-CA', 'fr-BE', 'fr'],          genderPref: 'female', rate: 1.0,  pitch: 1.0  },
  eng: { chain: ['en-US', 'en-GB', 'en-AU', 'en'],          genderPref: 'female', rate: 1.0,  pitch: 1.0  },
  ara: { chain: ['ar-SA', 'ar-EG', 'ar-MA', 'ar'],          genderPref: 'female', rate: 0.95, pitch: 1.0  },
  por: { chain: ['pt-BR', 'pt-PT', 'pt'],                   genderPref: 'female', rate: 1.0,  pitch: 1.0  }
};

function getProfile(kivuCode) {
  return VOICE_PROFILES[kivuCode] || VOICE_PROFILES.fra;
}

/* ─── Voice quality scoring ────────────────────────────────
   We rank voices by perceived "humanness" + match to profile.
   - "Microsoft ... Natural" voices in Edge → very high quality
   - "Premium" / "Enhanced" / "Neural" suffixes → top tier
   - "Google" voices in Chrome → neural, natural prosody
   - Apple "Siri" or "Premium" voices → excellent
   - Default voices → lowest score
   - Children/novelty voices → penalized
   - Voice gender matching profile preference → +20
*/
const FEMALE_NAMES = /\b(female|woman|amélie|aurelie|audrey|julie|marie|sophie|charlotte|emma|olivia|chloe|denise|hortense|virginie|samantha|karen|moira|fiona|tessa|vicki|allison|ava|susan|alva|tala|sara|naayf|laila|sahar|lisa|catherine|natasha|hazel|aria|jenny|ana|francisca|joana|paulina|mireia|camila|esperanza|paloma|nicki|natalia|monica|hala)\b/i;
const MALE_NAMES = /\b(male\b|man\b|thomas|paul|nicolas|henri|alex|daniel|tom|fred|jorge|diego|ricardo|hassan|tarik|ahmed|jamal|david|james|john|james|hugo|guillaume|matteo|antonio|diego|enrique|jorge)\b/i;

function inferGender(v) {
  if (!v) return 'unknown';
  if (/\bfemale\b/i.test(v.name)) return 'female';
  if (/\bmale\b/i.test(v.name)) return 'male';
  if (FEMALE_NAMES.test(v.name)) return 'female';
  if (MALE_NAMES.test(v.name)) return 'male';
  return 'unknown';
}

function voiceScore(v, genderPref = null) {
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
  if (/\b(novelty|cellos|bells|bubbles|good news|bad news|albert|bahh|deranged|hysterical|trinoids|whisper|zarvox|jester|junior|princess|pipe organ|organ|grandma|grandpa|bad)\b/i.test(name)) score -= 50;
  if (/\beSpeak\b/i.test(name))      score -= 100;  // robotic open-source

  // Local vs cloud: cloud usually better (default flag is set on lower-quality)
  if (v.localService === false)      score += 20;
  if (v.default)                     score -= 5;    // default is usually basic

  // Slight preference for adult-sounding voices (heuristic)
  if (/\b(child|kid|junior)\b/i.test(name)) score -= 30;

  // Gender preference matching (+20 when matching profile)
  if (genderPref) {
    const g = inferGender(v);
    if (g === genderPref) score += 25;
    else if (g === 'unknown') score += 0;
    else score -= 10; // wrong gender for this profile
  }

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

/** Pick the best voice given a KIVU language code, using the profile chain. */
function pickVoiceForLang(kivuLang) {
  const voices = getAllVoices();
  if (!voices.length) return { voice: null, profile: getProfile(kivuLang), bcp: toBcp47(kivuLang) };
  const profile = getProfile(kivuLang);

  // Walk the chain — first non-empty match wins
  for (const bcp of profile.chain) {
    const lang2 = bcp.split('-')[0];
    const exact = voices.filter(v => v.lang === bcp);
    const family = voices.filter(v => v.lang.startsWith(lang2 + '-') || v.lang === lang2);
    const candidates = exact.length ? exact : family;
    if (candidates.length) {
      candidates.sort((a, b) => voiceScore(b, profile.genderPref) - voiceScore(a, profile.genderPref));
      return { voice: candidates[0], profile, bcp };
    }
  }
  // Last resort: any voice
  const all = [...voices].sort((a, b) => voiceScore(b, profile.genderPref) - voiceScore(a, profile.genderPref));
  return { voice: all[0] || null, profile, bcp: toBcp47(kivuLang) };
}

/** Legacy helper kept for compatibility. */
function pickBestVoice(bcp47) {
  const voices = getAllVoices();
  if (!voices.length) return null;
  const lang2 = bcp47.split('-')[0];
  const exact = voices.filter(v => v.lang === bcp47);
  const family = voices.filter(v => v.lang.startsWith(lang2 + '-') || v.lang === lang2);
  const candidates = exact.length ? exact : (family.length ? family : voices);
  candidates.sort((a, b) => voiceScore(b) - voiceScore(a));
  return candidates[0] || null;
}

/* ─── Distinctive Kivi voice (the AI assistant) ────────────
   Kivi uses a consistent, recognizable voice across all sessions.
   Preference order :
     1. French-Canadian or French-FR female voice for warmth
     2. Specific names known to be expressive (Amélie, Audrey, Marie, Aurelie)
     3. Microsoft Denise/Brigitte (Natural Edge voices)
     4. Apple Amélie/Thomas (premium Apple voices)
   Pitch slightly higher + slightly slower = friendly tutor feel.
*/
const KIVI_NAME_HINTS = /\b(am[eé]lie|aurelie|audrey|marie|denise|brigitte|julie|charlotte|sophie|emma|sarah|natasha|hortense)\b/i;

function pickKiviVoice() {
  const voices = getAllVoices();
  if (!voices.length) return null;
  // Prefer French female with friendly name hints
  const french = voices.filter(v => v.lang.startsWith('fr'));
  // Score = quality + +50 for matching a known warm-named voice
  const scored = french.map(v => ({
    v,
    s: voiceScore(v, 'female') + (KIVI_NAME_HINTS.test(v.name) ? 50 : 0)
  }));
  scored.sort((a, b) => b.s - a.s);
  return scored[0]?.v || pickBestVoice('fr-FR');
}

const KIVI_PROFILE = { rate: 0.97, pitch: 1.10 }; // friendly, slightly higher pitched

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
    return pickVoiceForLang(kivuLang).voice;
  },

  /** Returns Kivi's distinctive voice (used by the assistant). */
  getKiviVoice() {
    if (!this.ttsSupported) return null;
    return pickKiviVoice();
  },

  /** Returns the language profile (rate/pitch/genderPref/chain). */
  getLanguageProfile(kivuLang) {
    return getProfile(kivuLang);
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
   * Joue le texte. Priorité :
   *   1) Enregistrement humain réel dans la voix-library (si disponible)
   *   2) Sinon, synthèse vocale TTS avec la voix adaptée à la langue
   *
   * @param {string} text
   * @param {string} kivuLang
   * @param {object} opts { rate, pitch, volume, preferredVoiceURI?, profileOverride? }
   * @returns {Promise<{ source: 'human'|'tts'|'none' }>}
   */
  async speak(text, kivuLang, { rate = null, pitch = null, volume = 1.0, preferredVoiceURI = null, profileOverride = null } = {}) {
    if (!text) return { source: 'none' };

    // 1. Try the human-recorded voice library first (always wins, even offline)
    try {
      const { voiceLibrary } = await import('./voice-library.js');
      const blob = await voiceLibrary.get(kivuLang, text);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = volume;
        const playbackRate = rate ?? 1.0;
        audio.playbackRate = Math.max(0.5, Math.min(2, playbackRate));
        if (this.ttsSupported) window.speechSynthesis.cancel();
        if (currentAudio) { try { currentAudio.pause(); } catch {} }
        currentAudio = audio;
        await new Promise(resolve => {
          audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
          audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
          audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
        });
        currentAudio = null;
        return { source: 'human' };
      }
    } catch { /* fall back to premium / TTS */ }

    // 2. Try premium IA voice if enabled in settings
    if (isPremiumVoiceEnabled()) {
      try {
        const { fetchPremiumVoice } = await import('./premium-voice.js');
        const result = await fetchPremiumVoice(text, kivuLang);
        if (result?.blob) {
          const url = URL.createObjectURL(result.blob);
          const audio = new Audio(url);
          audio.volume = volume;
          audio.playbackRate = Math.max(0.5, Math.min(2, rate ?? 1.0));
          if (this.ttsSupported) window.speechSynthesis.cancel();
          if (currentAudio) { try { currentAudio.pause(); } catch {} }
          currentAudio = audio;
          await new Promise(resolve => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
          });
          currentAudio = null;
          return { source: 'premium', provider: result.source };
        }
      } catch { /* fall back to native TTS */ }
    }

    // 3. Fallback: SpeechSynthesis API (TTS) with language-adapted profile
    if (!this.ttsSupported) return { source: 'none' };
    window.speechSynthesis.cancel();

    const { voice, profile, bcp } = pickVoiceForLang(kivuLang);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || bcp;
    u.rate = rate ?? profileOverride?.rate ?? profile.rate;
    u.pitch = pitch ?? profileOverride?.pitch ?? profile.pitch;
    u.volume = volume;

    // Use user-pinned voice if provided, else profile-best
    let chosen = null;
    if (preferredVoiceURI) {
      chosen = getAllVoices().find(v => v.voiceURI === preferredVoiceURI) || null;
    }
    if (!chosen) chosen = voice;
    if (chosen) u.voice = chosen;

    window.speechSynthesis.speak(u);
    await new Promise(resolve => {
      u.onend = resolve;
      u.onerror = resolve;
    });
    return { source: 'tts' };
  },

  /**
   * Speak with the distinctive Kivi voice (the AI assistant).
   * Always uses the same warm female French voice across the app.
   * Uses premium IA voice if enabled in settings.
   */
  async speakAsKivi(text, opts = {}) {
    if (!text) return { source: 'none' };

    // 1. Try premium IA voice with Kivi's signature voice profile
    if (isPremiumVoiceEnabled()) {
      try {
        const { fetchPremiumVoice } = await import('./premium-voice.js');
        const result = await fetchPremiumVoice(text, 'kivi');
        if (result?.blob) {
          if (this.ttsSupported) window.speechSynthesis.cancel();
          if (currentAudio) { try { currentAudio.pause(); } catch {} }
          const url = URL.createObjectURL(result.blob);
          const audio = new Audio(url);
          audio.volume = opts.volume ?? 1.0;
          audio.playbackRate = opts.rate ?? 1.0;
          currentAudio = audio;
          await new Promise(resolve => {
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
            audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
          });
          if (currentAudio === audio) currentAudio = null;
          return { source: 'premium', provider: result.source };
        }
      } catch { /* fall back to native TTS */ }
    }

    // 2. Fallback: Web Speech API with the warm French female voice
    if (!this.ttsSupported) return { source: 'none' };
    window.speechSynthesis.cancel();
    if (currentAudio) { try { currentAudio.pause(); } catch {} }
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickKiviVoice();
    if (voice) {
      u.voice = voice;
      u.lang = voice.lang;
    } else {
      u.lang = 'fr-FR';
    }
    u.rate = opts.rate ?? KIVI_PROFILE.rate;
    u.pitch = opts.pitch ?? KIVI_PROFILE.pitch;
    u.volume = opts.volume ?? 1.0;
    window.speechSynthesis.speak(u);
    await new Promise(resolve => {
      u.onend = resolve;
      u.onerror = resolve;
    });
    return { source: 'tts' };
  },

  /** Same as speak() but never tries the human library — pure TTS. */
  speakTTS(text, kivuLang, opts = {}) {
    if (!this.ttsSupported || !text) return Promise.resolve({ source: 'none' });
    window.speechSynthesis.cancel();
    const { voice, profile, bcp } = pickVoiceForLang(kivuLang);
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice?.lang || bcp;
    u.rate = opts.rate ?? profile.rate;
    u.pitch = opts.pitch ?? profile.pitch;
    u.volume = opts.volume ?? 1.0;
    let chosen = null;
    if (opts.preferredVoiceURI) {
      chosen = getAllVoices().find(v => v.voiceURI === opts.preferredVoiceURI) || null;
    }
    if (!chosen) chosen = voice;
    if (chosen) u.voice = chosen;
    window.speechSynthesis.speak(u);
    return new Promise(resolve => {
      u.onend = () => resolve({ source: 'tts' });
      u.onerror = () => resolve({ source: 'tts' });
    });
  },

  cancelSpeech() {
    if (this.ttsSupported) window.speechSynthesis.cancel();
    if (currentAudio) { try { currentAudio.pause(); currentAudio = null; } catch {} }
  }
};

let currentAudio = null;

/** Pre-warm the voices cache as soon as possible (Chrome async-loads) */
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Trigger initial fetch
  setTimeout(() => getAllVoices(), 50);
  setTimeout(() => getAllVoices(), 500);
  setTimeout(() => getAllVoices(), 2000);
}
