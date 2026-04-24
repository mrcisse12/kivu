/**
 * Router minimaliste — hash-based pour compatibilité PWA offline
 */

const listeners = new Set();

export const router = {
  current() {
    const hash = window.location.hash.slice(1);
    return hash || '/';
  },
  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }
};

export function navigate(path) {
  window.location.hash = path;
}

window.addEventListener('hashchange', () => {
  listeners.forEach(cb => cb());
  window.scrollTo(0, 0);
});
