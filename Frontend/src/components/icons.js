/**
 * KIVU — Icônes SVG vectorielles épurées
 * Utilisées pour la navigation principale et les actions CORE.
 * Les emojis restent réservés aux drapeaux, gamification, feedback.
 */

const I = (path, viewBox = '0 0 24 24') =>
  (size = 24, color = 'currentColor') => `
    <svg width="${size}" height="${size}" viewBox="${viewBox}" fill="none"
         stroke="${color}" stroke-width="1.8" stroke-linecap="round"
         stroke-linejoin="round" aria-hidden="true">
      ${path}
    </svg>`;

export const icons = {
  // Navigation principale (premium SVG, pas d'emojis)
  home: I(`<path d="M3 11.5L12 4l9 7.5"/><path d="M5 10.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9.5"/>`),
  translate: I(`<path d="M5 8h12"/><path d="M9 4v4"/><path d="M11 16l-2-7-2 7"/><path d="M7 14h4"/><path d="M14 20l3-7 3 7"/><path d="M15 18h4"/>`),
  learn: I(`<path d="M22 9L12 4 2 9l10 5 10-5z"/><path d="M6 11v5a6 6 0 0012 0v-5"/><path d="M22 9v6"/>`),
  preserve: I(`<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z"/><path d="M9 12l2 2 4-4"/>`),
  profile: I(`<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-8 8-8s8 3.5 8 8"/>`),

  // Actions secondaires
  business: I(`<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2"/><path d="M3 12h18"/>`),
  multiparty: I(`<circle cx="9" cy="9" r="3"/><circle cx="17" cy="9" r="3"/><path d="M3 19a6 6 0 0112 0"/><path d="M14 19a6 6 0 016-6"/>`),
  assistant: I(`<path d="M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z"/>`),
  diaspora: I(`<path d="M12 21s-7-5-7-11a7 7 0 0114 0c0 6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>`),
  accessibility: I(`<circle cx="12" cy="4" r="2"/><path d="M5 9l7-1 7 1"/><path d="M9 22l3-9 3 9"/><path d="M9 13h6"/>`),

  // Utilitaires
  search: I(`<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/>`),
  bell: I(`<path d="M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21h4"/>`),
  settings: I(`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/>`),
  arrowRight: I(`<path d="M5 12h14"/><path d="M13 5l7 7-7 7"/>`),
  arrowLeft: I(`<path d="M19 12H5"/><path d="M11 19l-7-7 7-7"/>`),
  swap: I(`<path d="M7 16V4M7 4L3 8M7 4l4 4"/><path d="M17 8v12M17 20l-4-4M17 20l4-4"/>`),
  mic: I(`<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0014 0"/><path d="M12 18v3"/>`),
  micOff: I(`<path d="M2 2l20 20"/><path d="M9 9v3a3 3 0 003 3"/><path d="M15 13.5V6a3 3 0 00-6 0v.5"/><path d="M5 11a7 7 0 008 6.93"/><path d="M19 11a7 7 0 01-1 3.5"/><path d="M12 18v3"/>`),
  speaker: I(`<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a4 4 0 010 7"/><path d="M18 5a8 8 0 010 14"/>`),
  copy: I(`<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 012-2h10"/>`),
  share: I(`<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5L8.6 10.5"/>`),
  check: I(`<path d="M5 12l5 5L20 7"/>`),
  close: I(`<path d="M6 6l12 12M18 6L6 18"/>`),
  plus: I(`<path d="M12 5v14M5 12h14"/>`),
  chevronRight: I(`<path d="M9 6l6 6-6 6"/>`),
  chevronDown: I(`<path d="M6 9l6 6 6-6"/>`),
  globe: I(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a13 13 0 010 18M12 3a13 13 0 000 18"/>`),
  send: I(`<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>`),
  camera: I(`<path d="M3 8h3l2-2h8l2 2h3a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z"/><circle cx="12" cy="13" r="3.5"/>`),
  archive: I(`<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/><path d="M10 12h4"/>`),
  heart: I(`<path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>`),
  chat: I(`<path d="M21 12a8 8 0 01-11 7.42L3 21l1.58-7A8 8 0 1121 12z"/>`),
  trophy: I(`<path d="M8 21h8M12 17v4"/><path d="M7 4h10v6a5 5 0 01-10 0V4z"/><path d="M5 4H3a2 2 0 002 4M19 4h2a2 2 0 01-2 4"/>`),
  flame: I(`<path d="M12 22a7 7 0 007-7c0-3-2-5-3-6 0 4-3 5-5 5s-2-2-1-5C6 11 5 13 5 15a7 7 0 007 7z"/>`),
  star: I(`<path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>`),
  zap: I(`<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>`),
  book: I(`<path d="M4 4a2 2 0 012-2h12v18H6a2 2 0 01-2-2V4z"/><path d="M4 18a2 2 0 012-2h12"/>`),
  users: I(`<circle cx="9" cy="8" r="3.5"/><path d="M3 21a6 6 0 0112 0"/><circle cx="17" cy="8" r="3"/><path d="M21 21a5 5 0 00-5-5"/>`),
  signal: I(`<rect x="3" y="14" width="3" height="7" rx="1"/><rect x="9" y="9" width="3" height="12" rx="1"/><rect x="15" y="4" width="3" height="17" rx="1"/>`),
  lock: I(`<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>`),
  wifiOff: I(`<path d="M2 2l20 20"/><path d="M5 12.5a10 10 0 0114 0"/><path d="M8.5 16a5 5 0 017 0"/><circle cx="12" cy="20" r=".5"/>`),
  eye: I(`<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>`),
  ear: I(`<path d="M6 12a6 6 0 0112 0v3a3 3 0 01-3 3h-1a2 2 0 01-2-2v-2a2 2 0 012-2"/>`),
  hand: I(`<path d="M9 11V5a2 2 0 014 0v6"/><path d="M13 11V4a2 2 0 014 0v9"/><path d="M17 11V6a2 2 0 014 0v9a7 7 0 01-14 0v-3a2 2 0 014 0v1"/>`)
};
