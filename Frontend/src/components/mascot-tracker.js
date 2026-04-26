/**
 * KIVU Mascot Eye Tracker — fait suivre la souris/le doigt aux yeux de Kivi.
 *
 * Sans Lottie/Rive : on cible les <circle> pupilles dans les SVG mascotte
 * et on les translate dans la direction du curseur, dans la limite du blanc
 * de l'œil. Bonus : clignement aléatoire toutes les ~4s.
 */

const PUPIL_RADIUS = 4;       // doit matcher le radius dans mascot.js
const TRAVEL = 3;             // amplitude max en pixels SVG

const trackedSvgs = new Set();
let initialized = false;
let lastClientX = window.innerWidth / 2;
let lastClientY = window.innerHeight / 2;

export function setupMascotTracker() {
  if (initialized) return;
  initialized = true;

  // Attache un MutationObserver léger qui scanne les nouvelles mascottes
  const obs = new MutationObserver(() => scanForMascots());
  obs.observe(document.body, { childList: true, subtree: true });

  // Souris + tactile
  document.addEventListener('mousemove', (e) => {
    lastClientX = e.clientX;
    lastClientY = e.clientY;
    updateAllPupils();
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (e.touches[0]) {
      lastClientX = e.touches[0].clientX;
      lastClientY = e.touches[0].clientY;
      updateAllPupils();
    }
  }, { passive: true });

  // Clignement aléatoire toutes les ~4s
  setInterval(blink, 4000);

  // Scan initial
  setTimeout(() => scanForMascots(), 100);
}

function scanForMascots() {
  // Une mascotte = SVG avec aria-hidden="true" contenant 2 cercles pupilles
  // Critère : les SVG fournis par mascot.js avec viewBox="0 0 120 140"
  document.querySelectorAll('svg[viewBox="0 0 120 140"]').forEach(svg => {
    if (trackedSvgs.has(svg)) return;
    // Cherche les pupilles : circle r=5 ou r=4.5 fill=#2D3550 ou #14203A
    const pupils = Array.from(svg.querySelectorAll('circle')).filter(c => {
      const r = parseFloat(c.getAttribute('r')) || 0;
      const fill = c.getAttribute('fill') || '';
      return r >= 4 && r <= 6 && (fill === '#2D3550' || fill === '#14203A');
    });
    if (pupils.length === 2) {
      // Sauvegarde positions originales
      pupils.forEach(p => {
        p.dataset.cx0 = p.getAttribute('cx');
        p.dataset.cy0 = p.getAttribute('cy');
        p.style.transition = 'transform 0.1s ease-out';
        p.style.transformBox = 'fill-box';
        p.style.transformOrigin = 'center';
      });
      trackedSvgs.add(svg);
      // Conserve les pupilles directement sur le SVG pour accès rapide
      svg._pupils = pupils;
      // Position initiale
      updatePupils(svg);
    }
  });

  // Cleanup : retire les SVG qui ne sont plus dans le DOM
  for (const svg of trackedSvgs) {
    if (!document.body.contains(svg)) trackedSvgs.delete(svg);
  }
}

function updateAllPupils() {
  trackedSvgs.forEach(updatePupils);
}

function updatePupils(svg) {
  if (!svg._pupils) return;
  const rect = svg.getBoundingClientRect();
  if (rect.width === 0) return;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = lastClientX - cx;
  const dy = lastClientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return;
  const maxTravel = TRAVEL;
  const tx = (dx / dist) * Math.min(maxTravel, dist / 80);
  const ty = (dy / dist) * Math.min(maxTravel, dist / 80);
  svg._pupils.forEach(p => {
    p.style.transform = `translate(${tx}px, ${ty}px)`;
  });
}

function blink() {
  // Anime un blink en aplatissant temporairement les yeux sur les SVG trackés
  trackedSvgs.forEach(svg => {
    if (!svg._pupils || !svg.isConnected) return;
    // Cherche les blancs des yeux (cercles r=10 ou r=9)
    const whites = Array.from(svg.querySelectorAll('circle')).filter(c => {
      const r = parseFloat(c.getAttribute('r')) || 0;
      const fill = c.getAttribute('fill') || '';
      return r >= 8 && r <= 11 && fill === '#FFFFFF';
    });
    [...whites, ...svg._pupils].forEach(c => {
      c.style.transition = 'transform 0.08s ease-in';
      const orig = c.style.transform || 'none';
      c.style.transform = `${orig} scaleY(0.1)`;
      c.style.transformBox = 'fill-box';
      c.style.transformOrigin = 'center';
      setTimeout(() => {
        c.style.transition = 'transform 0.12s ease-out';
        c.style.transform = orig === 'none' ? '' : orig;
      }, 90);
    });
  });
}
