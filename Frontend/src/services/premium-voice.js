/**
 * KIVU — Voix premium IA (TTS neural haute qualité).
 *
 * Lit les voix générées par ElevenLabs (multilingual_v2) ou OpenAI
 * TTS-1-HD via le backend KIVU. Cache automatiquement chaque audio
 * dans la voix-library locale (IndexedDB) pour rejouer instantanément
 * et hors-ligne.
 *
 * Hiérarchie côté speech.js :
 *   1) Voix humaine enregistrée par l'utilisateur (voice-library)
 *   2) Voix premium IA (cache local OU fetch backend)
 *   3) Web Speech API native du navigateur (fallback)
 */

import { api } from './api.js';
import { voiceLibrary } from './voice-library.js';

let supportCache = null;
let supportCacheAt = 0;
const SUPPORT_TTL = 60_000; // re-check support every minute

/** Returns { available, providers, preferred, languages, cache? } or { available:false } if backend unreachable */
export async function checkPremiumSupport(force = false) {
  const now = Date.now();
  if (!force && supportCache && (now - supportCacheAt) < SUPPORT_TTL) return supportCache;
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(api.baseUrl + '/voice/status', { signal: ctrl.signal });
    clearTimeout(timeoutId);
    if (!res.ok) {
      supportCache = { available: false };
    } else {
      const data = await res.json();
      supportCache = {
        available: !!data.available,
        providers: data.providers || {},
        preferred: data.preferred || null,
        languages: data.languages || [],
        cache: data.cache || null
      };
    }
  } catch {
    supportCache = { available: false };
  }
  supportCacheAt = now;
  return supportCache;
}

/**
 * Fetch a premium voice for (text, lang). Returns { blob, source } or null.
 * Auto-caches the blob in voice-library so subsequent calls are instant + offline.
 *
 * source values : 'cache-local' | 'elevenlabs' | 'openai' | null
 */
export async function fetchPremiumVoice(text, lang) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  // 1) Check local IndexedDB cache (works offline, zero latency)
  try {
    const cached = await voiceLibrary.get(lang, trimmed);
    if (cached) return { blob: cached, source: 'cache-local' };
  } catch { /* ignore */ }

  // 2) Fetch from backend
  try {
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 18_000);
    const res = await fetch(api.baseUrl + '/voice/synthesize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed, lang }),
      signal: ctrl.signal
    });
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob || blob.size === 0) return null;
    const provider = res.headers.get('X-Voice-Provider') || 'unknown';

    // 3) Auto-cache locally for instant offline replay
    try {
      await voiceLibrary.save({
        lang,
        text: trimmed,
        blob,
        locutor: provider === 'elevenlabs' ? 'IA Premium (ElevenLabs)' : 'IA Premium (OpenAI)',
        region: 'Auto-cache',
        notes: `Synthèse IA ${provider}`
      });
    } catch { /* cache write failure is non-fatal */ }

    return { blob, source: provider };
  } catch {
    return null;
  }
}

/**
 * Play a premium voice immediately. Returns the source label, or null on error.
 * Cancels any other audio in progress.
 */
let currentAudio = null;
export async function playPremiumVoice(text, lang, { rate = 1.0, volume = 1.0 } = {}) {
  const result = await fetchPremiumVoice(text, lang);
  if (!result) return null;

  if (currentAudio) { try { currentAudio.pause(); } catch {} }
  const url = URL.createObjectURL(result.blob);
  const audio = new Audio(url);
  audio.volume = volume;
  audio.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  currentAudio = audio;

  await new Promise(resolve => {
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = () => { URL.revokeObjectURL(url); resolve(); };
    audio.play().catch(() => { URL.revokeObjectURL(url); resolve(); });
  });
  if (currentAudio === audio) currentAudio = null;
  return result.source;
}

export function cancelPremiumPlayback() {
  if (currentAudio) {
    try { currentAudio.pause(); } catch {}
    currentAudio = null;
  }
}

/** Reset the in-memory support cache (called when settings change) */
export function invalidateSupportCache() {
  supportCache = null;
  supportCacheAt = 0;
}

/** Pre-cache a list of common phrases so they play instantly later. */
export async function preCachePhrases(phrases, { onProgress = null } = {}) {
  let done = 0;
  let cached = 0;
  for (const { text, lang } of phrases) {
    if (await voiceLibrary.has(lang, text)) {
      done++;
      onProgress?.({ done, total: phrases.length, cached });
      continue;
    }
    const result = await fetchPremiumVoice(text, lang);
    if (result) cached++;
    done++;
    onProgress?.({ done, total: phrases.length, cached });
    // Small delay to avoid rate-limiting
    await new Promise(r => setTimeout(r, 200));
  }
  return { done, cached };
}
