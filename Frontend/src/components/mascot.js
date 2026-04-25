/**
 * KIVU — Mascotte vectorielle "Kivi", esprit du Lac Kivu.
 *
 * Style : flat 2D, couleurs unies, AUCUN dégradé interne.
 * Inspiré de Duolingo (chouette Duo) mais propre à KIVU et l'Afrique.
 *
 * 6 émotions : happy, cheering, sad, thinking, sleeping, waving.
 * Toutes partagent le même body (silhouette baobab arrondie).
 */

const PALETTE = {
  body:        '#1CB0F6',  // bleu duo
  bodyDk:      '#1899D6',  // ombre/contour body
  belly:       '#E5F6FF',  // ventre clair
  accent:      '#FF9600',  // orange
  accentDk:    '#E08600',
  white:       '#FFFFFF',
  ink:         '#2D3550',  // anthracite (pas full noir)
  cheek:       '#FFB859',
  shadow:      'rgba(45, 53, 80, 0.15)'
};

function svgWrap(content, size = 120, viewBox = '0 0 120 140') {
  return `<svg width="${size}" height="${size * 140 / 120}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
}

// Corps de base flat — silhouette ovale arrondie
function body() {
  return `
    <!-- Ombre portée discrète -->
    <ellipse cx="60" cy="130" rx="32" ry="5" fill="${PALETTE.shadow}"/>

    <!-- Corps principal (forme ovale arrondie) -->
    <path d="M60 14
             C 28 14, 16 42, 18 70
             C 19 90, 30 110, 42 118
             C 50 124, 70 124, 78 118
             C 90 110, 101 90, 102 70
             C 104 42, 92 14, 60 14 Z"
          fill="${PALETTE.body}"
          stroke="${PALETTE.bodyDk}"
          stroke-width="2.5"/>

    <!-- Ventre plus clair (forme ovale au centre) -->
    <ellipse cx="60" cy="92" rx="26" ry="22" fill="${PALETTE.belly}"/>

    <!-- Joues orangées (cercles plats) -->
    <circle cx="34" cy="82" r="6" fill="${PALETTE.cheek}"/>
    <circle cx="86" cy="82" r="6" fill="${PALETTE.cheek}"/>
  `;
}

// Variantes d'yeux (toutes plates, sans dégradé)
const eyes = {
  open: `
    <circle cx="46" cy="62" r="10" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="74" cy="62" r="10" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="48" cy="64" r="5" fill="${PALETTE.ink}"/>
    <circle cx="76" cy="64" r="5" fill="${PALETTE.ink}"/>
    <circle cx="50" cy="62" r="1.8" fill="${PALETTE.white}"/>
    <circle cx="78" cy="62" r="1.8" fill="${PALETTE.white}"/>
  `,
  cheering: `
    <!-- Yeux fermés en arc heureux -->
    <path d="M38 64 Q46 54 54 64" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M66 64 Q74 54 82 64" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  `,
  sad: `
    <circle cx="46" cy="64" r="9" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="74" cy="64" r="9" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="46" cy="67" r="4.5" fill="${PALETTE.ink}"/>
    <circle cx="74" cy="67" r="4.5" fill="${PALETTE.ink}"/>
    <!-- Sourcils inquiets -->
    <path d="M38 56 L52 60" stroke="${PALETTE.ink}" stroke-width="3" stroke-linecap="round"/>
    <path d="M68 60 L82 56" stroke="${PALETTE.ink}" stroke-width="3" stroke-linecap="round"/>
    <!-- Larme -->
    <path d="M40 76 Q40 84 44 84 Q44 78 40 76 Z" fill="${PALETTE.bodyDk}"/>
  `,
  thinking: `
    <circle cx="46" cy="62" r="10" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="74" cy="62" r="10" fill="${PALETTE.white}" stroke="${PALETTE.ink}" stroke-width="2"/>
    <circle cx="50" cy="62" r="5" fill="${PALETTE.ink}"/>
    <circle cx="78" cy="62" r="5" fill="${PALETTE.ink}"/>
  `,
  sleeping: `
    <path d="M38 64 Q46 68 54 64" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M66 64 Q74 68 82 64" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <text x="92" y="40" font-family="Nunito,sans-serif" font-size="16" font-weight="900" fill="${PALETTE.bodyDk}">z</text>
    <text x="100" y="28" font-family="Nunito,sans-serif" font-size="13" font-weight="900" fill="${PALETTE.bodyDk}">z</text>
  `
};

// Bouches (toutes plates)
const mouths = {
  smile:    `<path d="M50 86 Q60 96 70 86" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  bigSmile: `
    <path d="M46 84 Q60 102 74 84" fill="${PALETTE.ink}" stroke="${PALETTE.ink}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 90 Q60 96 70 90" stroke="${PALETTE.cheek}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  `,
  frown:    `<path d="M50 94 Q60 84 70 94" stroke="${PALETTE.ink}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  open:     `<ellipse cx="60" cy="88" rx="6" ry="7" fill="${PALETTE.ink}"/>`,
  zen:      `<path d="M54 88 L66 88" stroke="${PALETTE.ink}" stroke-width="3.5" stroke-linecap="round"/>`
};

// Accessoires plats
const props = {
  hand_wave: `
    <g transform="translate(98,72) rotate(20)">
      <ellipse cx="0" cy="0" rx="11" ry="14" fill="${PALETTE.body}" stroke="${PALETTE.bodyDk}" stroke-width="2"/>
      <path d="M-6 -3 Q0 -8 6 -3" stroke="${PALETTE.white}" stroke-width="2" fill="none" stroke-linecap="round"/>
    </g>
  `,
  trophy: `
    <g transform="translate(86,30)">
      <path d="M-9 -10 L9 -10 L7 1 Q0 7 -7 1 Z" fill="${PALETTE.accent}" stroke="${PALETTE.accentDk}" stroke-width="2" stroke-linejoin="round"/>
      <rect x="-4" y="1" width="8" height="6" fill="${PALETTE.accent}" stroke="${PALETTE.accentDk}" stroke-width="2"/>
      <rect x="-8" y="7" width="16" height="3" fill="${PALETTE.accentDk}"/>
      <text x="0" y="-2" text-anchor="middle" font-size="10" fill="${PALETTE.white}" font-weight="900">★</text>
    </g>
  `
};

export const mascot = {
  happy(size = 120) {
    return svgWrap(body() + eyes.open + mouths.smile, size);
  },
  cheering(size = 120) {
    return svgWrap(body() + eyes.cheering + mouths.bigSmile + props.trophy, size);
  },
  sad(size = 120) {
    return svgWrap(body() + eyes.sad + mouths.frown, size);
  },
  thinking(size = 120) {
    return svgWrap(body() + eyes.thinking + mouths.zen, size);
  },
  sleeping(size = 120) {
    return svgWrap(body() + eyes.sleeping + mouths.zen, size);
  },
  waving(size = 120) {
    return svgWrap(body() + eyes.open + mouths.smile + props.hand_wave, size);
  }
};

/** Composant bulle de dialogue avec mascotte à gauche. */
export function mascotBubble(text, emotion = 'happy', size = 80) {
  return `
    <div class="mascot-bubble">
      <div class="mascot-bubble__avatar">${mascot[emotion](size)}</div>
      <div class="mascot-bubble__speech">${text}</div>
    </div>
  `;
}
