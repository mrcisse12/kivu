/**
 * KIVU — Mascotte vectorielle "Kivi", esprit du Lac Kivu.
 *
 * Personnage rond et bienveillant inspiré des couleurs du drapeau africain
 * et du baobab. Disponible en plusieurs émotions pour le feedback :
 *   - happy   : encouragement par défaut
 *   - cheering: bonne réponse, célébration
 *   - sad     : mauvaise réponse (mais reste mignon)
 *   - thinking: en cours de réflexion
 *   - sleeping: streak perdu / inactif
 *   - waving  : bienvenue / accueil
 *
 * Toutes les variantes partagent le même body. Seuls les yeux/bouche/accessoires
 * changent — comme Duo l'orange/Duo l'oiseau de Duolingo, mais propre à KIVU.
 */

const PALETTE = {
  body:        '#174E9C',  // Bleu Lac Kivu
  bodyLight:   '#3395DA',
  bodyDark:    '#0A3F72',
  accent:      '#F2952D',  // Orange savane
  white:       '#FFFFFF',
  ink:         '#14203A',
  cheek:       '#FFB859'
};

function svgWrap(content, size = 120, viewBox = '0 0 120 140') {
  return `<svg width="${size}" height="${size * 140 / 120}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${content}</svg>`;
}

// Corps de base (réutilisé dans toutes les emotions)
function body() {
  return `
    <defs>
      <linearGradient id="kivi-body-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${PALETTE.bodyLight}"/>
        <stop offset="1" stop-color="${PALETTE.body}"/>
      </linearGradient>
      <radialGradient id="kivi-shine" cx="0.3" cy="0.25" r="0.5">
        <stop offset="0" stop-color="rgba(255,255,255,0.45)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0)"/>
      </radialGradient>
    </defs>
    <!-- Ombre portée -->
    <ellipse cx="60" cy="130" rx="32" ry="5" fill="rgba(20,32,58,0.18)"/>
    <!-- Corps (forme goutte type baobab simplifié) -->
    <path d="M60 14
             C 28 14, 16 42, 18 70
             C 19 90, 30 110, 42 118
             C 50 124, 70 124, 78 118
             C 90 110, 101 90, 102 70
             C 104 42, 92 14, 60 14 Z"
          fill="url(#kivi-body-grad)"/>
    <!-- Reflet brillant -->
    <ellipse cx="48" cy="46" rx="22" ry="18" fill="url(#kivi-shine)"/>
    <!-- Joues orangées -->
    <circle cx="34" cy="80" r="6" fill="${PALETTE.cheek}" opacity="0.55"/>
    <circle cx="86" cy="80" r="6" fill="${PALETTE.cheek}" opacity="0.55"/>
  `;
}

// Variantes d'yeux
const eyes = {
  open: `
    <circle cx="46" cy="62" r="9" fill="${PALETTE.white}"/>
    <circle cx="74" cy="62" r="9" fill="${PALETTE.white}"/>
    <circle cx="48" cy="64" r="4.5" fill="${PALETTE.ink}"/>
    <circle cx="76" cy="64" r="4.5" fill="${PALETTE.ink}"/>
    <circle cx="49" cy="62" r="1.6" fill="${PALETTE.white}"/>
    <circle cx="77" cy="62" r="1.6" fill="${PALETTE.white}"/>
  `,
  cheering: `
    <!-- Yeux fermés/sourire arc -->
    <path d="M40 64 Q46 56 54 64" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M68 64 Q74 56 82 64" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
  `,
  sad: `
    <circle cx="46" cy="64" r="8" fill="${PALETTE.white}"/>
    <circle cx="74" cy="64" r="8" fill="${PALETTE.white}"/>
    <circle cx="46" cy="66" r="4" fill="${PALETTE.ink}"/>
    <circle cx="74" cy="66" r="4" fill="${PALETTE.ink}"/>
    <!-- Larme -->
    <path d="M40 74 Q42 80 44 74 L44 80 Q42 84 40 80 Z" fill="${PALETTE.bodyLight}" opacity="0.8"/>
  `,
  thinking: `
    <circle cx="46" cy="62" r="9" fill="${PALETTE.white}"/>
    <circle cx="74" cy="62" r="9" fill="${PALETTE.white}"/>
    <circle cx="50" cy="62" r="4.5" fill="${PALETTE.ink}"/>
    <circle cx="78" cy="62" r="4.5" fill="${PALETTE.ink}"/>
    <circle cx="51" cy="60" r="1.6" fill="${PALETTE.white}"/>
    <circle cx="79" cy="60" r="1.6" fill="${PALETTE.white}"/>
  `,
  sleeping: `
    <path d="M40 62 Q46 66 54 62" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M68 62 Q74 66 82 62" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="92" y="40" font-family="Nunito,sans-serif" font-size="14" font-weight="800" fill="${PALETTE.bodyLight}">z</text>
    <text x="100" y="30" font-family="Nunito,sans-serif" font-size="11" font-weight="800" fill="${PALETTE.bodyLight}">z</text>
  `
};

// Variantes de bouche
const mouths = {
  smile:  `<path d="M52 84 Q60 92 68 84" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  bigSmile: `<path d="M48 82 Q60 96 72 82 Q60 90 48 82 Z" fill="${PALETTE.ink}"/>
             <path d="M50 86 Q60 94 70 86" stroke="${PALETTE.cheek}" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  frown:  `<path d="M52 92 Q60 84 68 92" stroke="${PALETTE.ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  open:   `<ellipse cx="60" cy="86" rx="5" ry="6" fill="${PALETTE.ink}"/>`,
  zen:    `<path d="M55 86 L65 86" stroke="${PALETTE.ink}" stroke-width="3" stroke-linecap="round"/>`
};

// Accessoires
const props = {
  hand_wave: `
    <g transform="translate(96,72) rotate(15)">
      <ellipse cx="0" cy="0" rx="10" ry="13" fill="${PALETTE.bodyLight}"/>
      <path d="M-6 -2 Q0 -8 6 -2" stroke="${PALETTE.white}" stroke-width="1.5" fill="none"/>
    </g>
  `,
  trophy: `
    <g transform="translate(85,32)">
      <path d="M-8 -10 L8 -10 L6 0 Q0 6 -6 0 Z" fill="${PALETTE.accent}"/>
      <rect x="-4" y="0" width="8" height="6" fill="${PALETTE.accent}"/>
      <rect x="-7" y="6" width="14" height="3" fill="${PALETTE.bodyDark}"/>
      <text x="0" y="-2" text-anchor="middle" font-size="9" fill="${PALETTE.white}" font-weight="800">★</text>
    </g>
  `
};

export const mascot = {
  /** Heureux par défaut. */
  happy(size = 120) {
    return svgWrap(body() + eyes.open + mouths.smile, size);
  },
  /** Tu viens de faire quelque chose de bien — on célèbre */
  cheering(size = 120) {
    return svgWrap(body() + eyes.cheering + mouths.bigSmile + props.trophy, size);
  },
  /** Mauvaise réponse — empathie, pas de honte */
  sad(size = 120) {
    return svgWrap(body() + eyes.sad + mouths.frown, size);
  },
  /** Au repos, en train de penser */
  thinking(size = 120) {
    return svgWrap(body() + eyes.thinking + mouths.zen, size);
  },
  /** Streak perdu, viens reprendre l'app */
  sleeping(size = 120) {
    return svgWrap(body() + eyes.sleeping + mouths.zen, size);
  },
  /** Bienvenue, salut de la main */
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
