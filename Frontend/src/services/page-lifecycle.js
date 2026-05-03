/**
 * KIVU — Page lifecycle helpers.
 *
 * Permet aux pages d'enregistrer un cleanup() qui sera appelé
 * automatiquement quand l'utilisateur navigue ailleurs.
 *
 * Usage :
 *   onLeavePage('/voices', () => {
 *     // reset module state, unsubscribe, destroy charts...
 *   });
 *
 * Le helper appelle cleanup quand location.hash sort du pattern
 * matching (exact ou commence-par).
 */

const cleanups = new Map(); // routePath → Set<Function>

function getActivePath() {
  return (location.hash || '').replace(/^#/, '') || '/';
}

let lastPath = getActivePath();

window.addEventListener('hashchange', () => {
  const newPath = getActivePath();
  if (newPath === lastPath) return;
  // Run cleanups for routes we're leaving
  for (const [path, set] of cleanups.entries()) {
    const wasOnThisPage = lastPath === path || lastPath.startsWith(path + '/');
    const stillOnThisPage = newPath === path || newPath.startsWith(path + '/');
    if (wasOnThisPage && !stillOnThisPage) {
      set.forEach(fn => { try { fn(); } catch (e) { console.warn('cleanup err:', e); } });
    }
  }
  lastPath = newPath;
});

/** Register a cleanup function for the given route. Returns unregister fn. */
export function onLeavePage(routePath, fn) {
  if (!cleanups.has(routePath)) cleanups.set(routePath, new Set());
  cleanups.get(routePath).add(fn);
  return () => cleanups.get(routePath)?.delete(fn);
}
