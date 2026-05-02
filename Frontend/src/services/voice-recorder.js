/**
 * KIVU — Enregistreur vocal en navigateur.
 *
 * Wrapper léger autour de MediaRecorder pour capturer un audio
 * depuis le micro de l'utilisateur. Renvoie un Blob (audio/webm
 * ou audio/mp4 selon le navigateur).
 *
 * Usage :
 *   const session = await voiceRecorder.start({ onLevel: pct => ... });
 *   // … plus tard
 *   const { blob, durationMs } = await session.stop();
 */

function pickMime() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/wav'
  ];
  for (const m of candidates) {
    try { if (MediaRecorder.isTypeSupported(m)) return m; } catch {}
  }
  return ''; // let the browser choose
}

export const voiceRecorder = {
  /** True if MediaRecorder + getUserMedia are supported. */
  isSupported() {
    return typeof window !== 'undefined' &&
           typeof MediaRecorder !== 'undefined' &&
           !!navigator.mediaDevices?.getUserMedia;
  },

  /**
   * Start a recording session.
   * @param {object} opts
   * @param {(levelPct:number)=>void} [opts.onLevel] called ~30Hz with mic level 0-100
   * @returns {Promise<{ stop: ()=>Promise<{blob:Blob,durationMs:number}>, cancel: ()=>void }>}
   */
  async start({ onLevel = null } = {}) {
    if (!this.isSupported()) {
      throw new Error('MediaRecorder non disponible sur ce navigateur');
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (err) {
      throw new Error('Permission micro refusée — autorise l\'accès dans ton navigateur.');
    }

    const mime = pickMime();
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});
    const chunks = [];
    const startTs = Date.now();
    let stopped = false;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    /* ── Audio level monitoring (simple peak-meter) ── */
    let audioCtx = null;
    let rafId = null;
    if (onLevel) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        const data = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        const tick = () => {
          if (stopped) return;
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);
          const pct = Math.min(100, Math.round(rms * 220));
          try { onLevel(pct); } catch {}
          rafId = requestAnimationFrame(tick);
        };
        tick();
      } catch { /* level meter is optional */ }
    }

    recorder.start(100);

    return {
      /** Stop and return the recorded blob + duration. */
      stop() {
        return new Promise((resolve, reject) => {
          if (stopped) {
            reject(new Error('Already stopped'));
            return;
          }
          stopped = true;
          recorder.onstop = () => {
            // Cleanup
            if (rafId) cancelAnimationFrame(rafId);
            try { audioCtx?.close(); } catch {}
            stream.getTracks().forEach(t => t.stop());
            const blob = new Blob(chunks, { type: mime || 'audio/webm' });
            resolve({ blob, durationMs: Date.now() - startTs });
          };
          recorder.onerror = (e) => reject(e.error || e);
          try { recorder.stop(); } catch (e) { reject(e); }
        });
      },
      /** Abort without producing a blob. */
      cancel() {
        stopped = true;
        if (rafId) cancelAnimationFrame(rafId);
        try { audioCtx?.close(); } catch {}
        try { recorder.stop(); } catch {}
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }
};
