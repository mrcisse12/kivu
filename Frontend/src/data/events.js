/**
 * KIVU — Calendrier des événements culturels africains
 *
 * Mélange de fêtes nationales, festivals, journées internationales
 * et célébrations linguistiques. Format mois (1-12) + jour pour
 * permettre une rotation annuelle.
 */

export const CULTURAL_EVENTS = [
  // Janvier
  { month: 1,  day: 1,   name: 'Nouvel An',                   region: 'Afrique', emoji: '🎆', desc: 'Nouvelle année, nouveau départ.' },
  { month: 1,  day: 12,  name: 'Indépendance Tanzanie',       region: 'Tanzanie 🇹🇿', emoji: '🎉', desc: 'Célébration de l\'unification du Tanganyika et de Zanzibar.' },

  // Février
  { month: 2,  day: 21,  name: 'Journée Internationale de la Langue Maternelle', region: 'Mondial 🌍', emoji: '🗣️', desc: 'Préservation et promotion de la diversité linguistique.' },

  // Mars
  { month: 3,  day: 6,   name: 'Indépendance du Ghana',       region: 'Ghana 🇬🇭', emoji: '🎉', desc: 'Premier pays subsaharien indépendant en 1957.' },
  { month: 3,  day: 20,  name: 'Journée Internationale de la Francophonie', region: 'Mondial 🌍', emoji: '🇫🇷', desc: 'Célébration de la langue française dans le monde.' },
  { month: 3,  day: 21,  name: 'Journée Mondiale de la Poésie', region: 'Mondial 🌍', emoji: '📜', desc: 'Hommage aux griots et conteurs africains.' },

  // Avril
  { month: 4,  day: 4,   name: 'Indépendance du Sénégal',     region: 'Sénégal 🇸🇳', emoji: '🎉', desc: '4 avril 1960 — Fête nationale.' },
  { month: 4,  day: 27,  name: 'Freedom Day',                 region: 'Afrique du Sud 🇿🇦', emoji: '🎉', desc: 'Premières élections démocratiques en 1994.' },

  // Mai
  { month: 5,  day: 1,   name: 'Fête du Travail',             region: 'Mondial 🌍', emoji: '⚒️', desc: 'Célébration des travailleurs.' },
  { month: 5,  day: 25,  name: 'Journée Mondiale de l\'Afrique', region: 'Afrique 🌍', emoji: '🌍', desc: 'Création de l\'Organisation de l\'Unité Africaine en 1963.' },
  { month: 5,  day: 28,  name: 'Festival Pan-Africain de Musique', region: 'Brazzaville 🇨🇬', emoji: '🥁', desc: 'FESPAM — célébration des musiques africaines.' },

  // Juin
  { month: 6,  day: 16,  name: 'Journée de l\'Enfant Africain', region: 'Afrique 🌍', emoji: '🧒🏾', desc: 'Mémoire des enfants de Soweto, 1976.' },
  { month: 6,  day: 26,  name: 'Indépendance de Madagascar',  region: 'Madagascar 🇲🇬', emoji: '🎉', desc: '26 juin 1960 — Fête nationale.' },

  // Juillet
  { month: 7,  day: 4,   name: 'Indépendance du Rwanda',      region: 'Rwanda 🇷🇼', emoji: '🎉', desc: 'Jour de la libération.' },
  { month: 7,  day: 18,  name: 'Journée Internationale Nelson Mandela', region: 'Mondial 🌍', emoji: '✊🏾', desc: '67 minutes pour faire le bien.' },

  // Août
  { month: 8,  day: 7,   name: 'Indépendance Côte d\'Ivoire', region: 'Côte d\'Ivoire 🇨🇮', emoji: '🎉', desc: '7 août 1960 — Fête nationale.' },
  { month: 8,  day: 23,  name: 'Journée Internationale du Souvenir de la Traite Négrière', region: 'Mondial 🌍', emoji: '🕊️', desc: 'Mémoire et abolition.' },

  // Septembre
  { month: 9,  day: 8,   name: 'Journée Internationale de l\'Alphabétisation', region: 'Mondial 🌍', emoji: '📚', desc: 'Pour un accès universel à l\'éducation.' },
  { month: 9,  day: 24,  name: 'Heritage Day',                region: 'Afrique du Sud 🇿🇦', emoji: '🎨', desc: 'Célébration de la diversité culturelle sud-africaine.' },

  // Octobre
  { month: 10, day: 1,   name: 'Indépendance du Nigeria',     region: 'Nigeria 🇳🇬', emoji: '🎉', desc: 'Fête nationale nigériane.' },
  { month: 10, day: 24,  name: 'Indépendance de la Zambie',   region: 'Zambie 🇿🇲', emoji: '🎉', desc: '24 octobre 1964.' },

  // Novembre
  { month: 11, day: 11,  name: 'Indépendance de l\'Angola',   region: 'Angola 🇦🇴', emoji: '🎉', desc: '11 novembre 1975.' },
  { month: 11, day: 28,  name: 'Journée Mondiale du Patrimoine Audiovisuel', region: 'Mondial 🌍', emoji: '🎞️', desc: 'Préserver les voix et images du passé.' },

  // Décembre
  { month: 12, day: 1,   name: 'Indépendance République Centrafricaine', region: 'RCA 🇨🇫', emoji: '🎉', desc: 'Fête nationale.' },
  { month: 12, day: 16,  name: 'Day of Reconciliation',       region: 'Afrique du Sud 🇿🇦', emoji: '🤝', desc: 'Réconciliation post-apartheid.' },
  { month: 12, day: 25,  name: 'Noël',                        region: 'Mondial 🌍', emoji: '🎄', desc: 'Joyeuses fêtes !' },
  { month: 12, day: 26,  name: 'Kwanzaa débute',              region: 'Diaspora 🌍', emoji: '🕯️', desc: 'Célébration des racines africaines (jusqu\'au 1er janvier).' },
];

/** Return events occurring within `windowDays` from today (default 30). */
export function upcomingEvents(windowDays = 30) {
  const now = new Date();
  const year = now.getFullYear();
  const todayMs = new Date(year, now.getMonth(), now.getDate()).getTime();
  const horizonMs = todayMs + windowDays * 86_400_000;

  const augmented = CULTURAL_EVENTS.map(ev => {
    // This year's date for the event
    let evDate = new Date(year, ev.month - 1, ev.day);
    // If it's already passed by more than 1 day, use next year
    if (evDate.getTime() < todayMs - 86_400_000) {
      evDate = new Date(year + 1, ev.month - 1, ev.day);
    }
    return { ...ev, date: evDate, ms: evDate.getTime() };
  });

  return augmented
    .filter(ev => ev.ms <= horizonMs)
    .sort((a, b) => a.ms - b.ms);
}

/** Returns the next single event (for home page teaser). */
export function nextEvent() {
  const upcoming = upcomingEvents(365);
  return upcoming[0] || null;
}

/** Today's events (for celebration banner). */
export function todayEvents() {
  const now = new Date();
  return CULTURAL_EVENTS.filter(ev => ev.month === now.getMonth() + 1 && ev.day === now.getDate());
}

export function daysUntil(date) {
  const ms = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.round(ms / 86_400_000));
}
