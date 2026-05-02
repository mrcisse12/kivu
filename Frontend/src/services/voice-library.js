/**
 * KIVU — Bibliothèque de voix humaines réelles.
 *
 * Stockage local d'enregistrements audio dans IndexedDB.
 * Chaque enregistrement est indexé par une clé `${lang}:${normalizedText}`
 * pour pouvoir le récupérer instantanément quand on veut prononcer
 * un mot ou une phrase dans une langue donnée.
 *
 * API :
 *   await voiceLibrary.save({ lang, text, blob, locutor, region })
 *   await voiceLibrary.get(lang, text)              → Blob | null
 *   await voiceLibrary.has(lang, text)              → boolean
 *   await voiceLibrary.delete(id)
 *   await voiceLibrary.list({ lang? })              → Array<entry>
 *   await voiceLibrary.stats()                       → { total, byLang, totalBytes }
 *   await voiceLibrary.exportAll()                   → Blob (JSON manifest + base64 audio)
 *   await voiceLibrary.importAll(jsonBlob)
 *
 * Évènements :
 *   voiceLibrary.subscribe(cb) — appelé après chaque save/delete/import
 */

const DB_NAME = 'kivu-voices';
const DB_VERSION = 1;
const STORE = 'recordings';

let dbPromise = null;
const listeners = new Set();

/* ─── DB initialization ────────────────────────────────── */

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB non supporté par ce navigateur'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('byLang', 'lang', { unique: false });
        store.createIndex('byKey',  'key',  { unique: true  });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
  return dbPromise;
}

function tx(mode = 'readonly') {
  return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
}

/* ─── Helpers ──────────────────────────────────────────── */

function normalizeText(text) {
  return String(text || '').trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s'-]/gu, '')
    .replace(/\s+/g, ' ');
}

function makeKey(lang, text) {
  return `${(lang || '').toLowerCase()}:${normalizeText(text)}`;
}

function genId() {
  return 'v_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function notify() {
  listeners.forEach(cb => { try { cb(); } catch {} });
}

/* ─── Public API ───────────────────────────────────────── */

export const voiceLibrary = {

  /** Save (or overwrite) a recording. Returns the saved entry. */
  async save({ lang, text, blob, locutor = '', region = '', notes = '' }) {
    if (!lang || !text || !blob) throw new Error('lang, text and blob required');
    const key = makeKey(lang, text);
    const store = await tx('readwrite');
    // If a recording exists for this key, update it
    const existing = await new Promise((res, rej) => {
      const req = store.index('byKey').get(key);
      req.onsuccess = () => res(req.result);
      req.onerror   = () => rej(req.error);
    });
    const entry = {
      id: existing?.id || genId(),
      key,
      lang,
      text: String(text).trim(),
      blob,
      mime: blob.type || 'audio/webm',
      size: blob.size,
      duration: 0, // optional, can be filled by caller
      locutor: locutor.trim(),
      region: region.trim(),
      notes: notes.trim(),
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await new Promise((res, rej) => {
      const store2 = openDB().then(db => {
        const t = db.transaction(STORE, 'readwrite');
        const s = t.objectStore(STORE);
        const r = s.put(entry);
        r.onsuccess = () => res();
        r.onerror   = () => rej(r.error);
      });
      // store2 is a promise — handle if it rejects
      store2.catch(rej);
    });
    notify();
    return entry;
  },

  /** Returns the blob for the given lang+text, or null. */
  async get(lang, text) {
    try {
      const key = makeKey(lang, text);
      const store = await tx();
      return await new Promise((res, rej) => {
        const req = store.index('byKey').get(key);
        req.onsuccess = () => res(req.result?.blob || null);
        req.onerror   = () => rej(req.error);
      });
    } catch { return null; }
  },

  /** Returns the full entry object (without the blob) for diagnostics. */
  async getEntry(lang, text) {
    try {
      const key = makeKey(lang, text);
      const store = await tx();
      return await new Promise((res, rej) => {
        const req = store.index('byKey').get(key);
        req.onsuccess = () => {
          const e = req.result;
          if (!e) return res(null);
          // Strip blob to keep it light
          const { blob, ...meta } = e;
          res({ ...meta, hasAudio: !!blob });
        };
        req.onerror = () => rej(req.error);
      });
    } catch { return null; }
  },

  /** True if a recording exists for this lang+text. */
  async has(lang, text) {
    return !!(await this.get(lang, text));
  },

  /** Delete by ID. */
  async delete(id) {
    const store = await tx('readwrite');
    await new Promise((res, rej) => {
      const r = store.delete(id);
      r.onsuccess = () => res();
      r.onerror   = () => rej(r.error);
    });
    notify();
  },

  /** Delete by lang+text (helper). */
  async deleteByText(lang, text) {
    const entry = await this.getEntry(lang, text);
    if (entry) await this.delete(entry.id);
  },

  /** List entries (most recent first). Optional { lang } filter. */
  async list({ lang = null } = {}) {
    const store = await tx();
    return await new Promise((res, rej) => {
      const out = [];
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) {
          // Sort by updatedAt desc
          out.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
          return res(out);
        }
        const v = cur.value;
        if (!lang || v.lang === lang) {
          // Strip blob to keep memory low; expose hasAudio + audioUrl on demand
          const { blob, ...meta } = v;
          out.push({ ...meta, hasAudio: !!blob });
        }
        cur.continue();
      };
      req.onerror = () => rej(req.error);
    });
  },

  /** Read a blob URL (call URL.revokeObjectURL when done). */
  async getURL(id) {
    const store = await tx();
    return await new Promise((res, rej) => {
      const r = store.get(id);
      r.onsuccess = () => {
        const e = r.result;
        if (!e || !e.blob) return res(null);
        res(URL.createObjectURL(e.blob));
      };
      r.onerror = () => rej(r.error);
    });
  },

  /** Aggregate stats for the admin dashboard. */
  async stats() {
    const store = await tx();
    return await new Promise((res, rej) => {
      const out = { total: 0, byLang: {}, totalBytes: 0 };
      const req = store.openCursor();
      req.onsuccess = (e) => {
        const cur = e.target.result;
        if (!cur) return res(out);
        const v = cur.value;
        out.total += 1;
        out.totalBytes += (v.size || v.blob?.size || 0);
        out.byLang[v.lang] = (out.byLang[v.lang] || 0) + 1;
        cur.continue();
      };
      req.onerror = () => rej(req.error);
    });
  },

  /** Subscribe to library mutations. Returns an unsubscribe function. */
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  /** Exposed normalizer for callers (so admin search uses the same logic). */
  normalize: normalizeText,
  makeKey
};
