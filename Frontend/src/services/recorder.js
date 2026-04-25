/**
 * KIVU Recorder — capture audio via MediaRecorder API et stocke localement.
 * Permet d'enregistrer "ma grand-mère qui parle Wolof" depuis le téléphone.
 */

const STORAGE_KEY = 'kivu.recordings';

export const recorder = {
  supported: typeof window !== 'undefined' &&
             !!navigator.mediaDevices?.getUserMedia &&
             typeof MediaRecorder !== 'undefined',

  async start() {
    if (!this.supported) throw new Error('MediaRecorder non supporté');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Préfère opus/webm pour la qualité+taille, fallback sinon
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      .find(t => MediaRecorder.isTypeSupported(t)) || '';

    const chunks = [];
    const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    mr.start(250);

    return {
      mediaRecorder: mr,
      stream,
      mimeType: mr.mimeType || mimeType,
      stop: () => new Promise((resolve) => {
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop());
          const blob = new Blob(chunks, { type: mr.mimeType || mimeType });
          resolve(blob);
        };
        mr.stop();
      })
    };
  },

  /** Convert blob to base64 data URL — small & easily JSON-serializable. */
  async blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  },

  /** Liste persistée dans localStorage. */
  list() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  },

  save(record) {
    const list = this.list();
    list.unshift(record);
    // limite raisonnable: 25 enregistrements
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 25)));
  },

  delete(id) {
    const list = this.list().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  /** Format millis -> "0:42" */
  formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const mm = Math.floor(s / 60);
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }
};
