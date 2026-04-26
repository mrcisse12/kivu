/**
 * KIVU — Moteur de thème.
 *
 * Permet à l'utilisateur de choisir :
 *  - thème clair / sombre / auto
 *  - couleur primaire (6 palettes inspirées d'Afrique)
 *  - densité d'affichage (compact / normal / spacious)
 *
 * Toute la config est appliquée via des variables CSS sur <html>, donc
 * tout le design system se met à jour en une frame, sans re-render.
 */

// 6 palettes harmonieuses — chaque palette définit primaire + light + dark + gradient
export const PALETTES = [
  {
    id: 'kivu',     name: 'Lac Kivu',     emoji: '🌊',
    primary: '#174E9C', primaryLight: '#3395DA', primaryDark: '#0A3F72',
    accent:  '#F2952D', accentLight:  '#FFB859', accentDark:  '#C76C15',
    gradHero: 'linear-gradient(135deg, #174E9C 0%, #3395DA 50%, #FFB859 100%)'
  },
  {
    id: 'sunset',   name: 'Soleil savane', emoji: '🌅',
    primary: '#F2952D', primaryLight: '#FFB859', primaryDark: '#C76C15',
    accent:  '#EB4D4D', accentLight:  '#FF7575', accentDark:  '#C73838',
    gradHero: 'linear-gradient(135deg, #F2952D 0%, #FFB859 50%, #FFE0A8 100%)'
  },
  {
    id: 'savanna',  name: 'Vert savane',  emoji: '🌿',
    primary: '#2D9E73', primaryLight: '#58C794', primaryDark: '#1A6E4F',
    accent:  '#F2952D', accentLight:  '#FFB859', accentDark:  '#C76C15',
    gradHero: 'linear-gradient(135deg, #2D9E73 0%, #58C794 50%, #F2952D 100%)'
  },
  {
    id: 'royal',    name: 'Pourpre royal', emoji: '👑',
    primary: '#8C40AD', primaryLight: '#B86BD9', primaryDark: '#5E2980',
    accent:  '#F2952D', accentLight:  '#FFB859', accentDark:  '#C76C15',
    gradHero: 'linear-gradient(135deg, #8C40AD 0%, #B86BD9 50%, #FFB859 100%)'
  },
  {
    id: 'ocean',    name: 'Océan',         emoji: '🐬',
    primary: '#0E8B9F', primaryLight: '#40B3BF', primaryDark: '#085F6F',
    accent:  '#F2952D', accentLight:  '#FFB859', accentDark:  '#C76C15',
    gradHero: 'linear-gradient(135deg, #0E8B9F 0%, #40B3BF 50%, #58C794 100%)'
  },
  {
    id: 'cherry',   name: 'Hibiscus',      emoji: '🌺',
    primary: '#E11D74', primaryLight: '#FF6BAA', primaryDark: '#A2104F',
    accent:  '#F2952D', accentLight:  '#FFB859', accentDark:  '#C76C15',
    gradHero: 'linear-gradient(135deg, #E11D74 0%, #FF6BAA 50%, #FFB859 100%)'
  }
];

export const DENSITIES = [
  { id: 'compact',  label: 'Compact',  scale: 0.85 },
  { id: 'normal',   label: 'Normal',   scale: 1.00 },
  { id: 'spacious', label: 'Spacieux', scale: 1.15 }
];

/** Applique une palette en surchargeant les variables CSS root. */
export function applyPalette(paletteId) {
  const p = PALETTES.find(x => x.id === paletteId) || PALETTES[0];
  const root = document.documentElement;
  root.style.setProperty('--kivu-primary',       p.primary);
  root.style.setProperty('--kivu-primary-light', p.primaryLight);
  root.style.setProperty('--kivu-primary-dark',  p.primaryDark);
  root.style.setProperty('--kivu-accent',        p.accent);
  root.style.setProperty('--kivu-accent-light',  p.accentLight);
  root.style.setProperty('--kivu-accent-dark',   p.accentDark);
  root.style.setProperty('--grad-hero',          p.gradHero);
  // sync color-translation (used for the home translation tile)
  root.style.setProperty('--color-translation', p.primary);
  root.dataset.palette = p.id;
}

/** Applique la densité — multiplie les variables --sp-* existantes. */
export function applyDensity(densityId) {
  const d = DENSITIES.find(x => x.id === densityId) || DENSITIES[1];
  const root = document.documentElement;
  // Les variables --sp-* originales : 4 / 8 / 12 / 16 / 24 / 32 / 48
  root.style.setProperty('--sp-xxs', `${4   * d.scale}px`);
  root.style.setProperty('--sp-xs',  `${8   * d.scale}px`);
  root.style.setProperty('--sp-sm',  `${12  * d.scale}px`);
  root.style.setProperty('--sp-md',  `${16  * d.scale}px`);
  root.style.setProperty('--sp-lg',  `${24  * d.scale}px`);
  root.style.setProperty('--sp-xl',  `${32  * d.scale}px`);
  root.style.setProperty('--sp-xxl', `${48  * d.scale}px`);
  root.dataset.density = d.id;
}

/** High contrast : renforce les couleurs de texte + bordures. */
export function applyContrast(enabled) {
  document.documentElement.dataset.contrast = enabled ? 'high' : 'normal';
}
