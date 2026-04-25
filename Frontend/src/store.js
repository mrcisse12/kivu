/**
 * Store global réactif — localStorage persistent
 */

const STORAGE_KEY = 'kivu.state';

const defaultState = {
  onboardingCompleted: false,
  user: {
    name: 'Amadou Diallo',
    email: 'amadou@kivu.africa',
    avatar: '🧑🏾',
    country: 'Côte d\'Ivoire',
    countryFlag: '🇨🇮',
    preferredLanguage: 'fra',
    motherTongue: 'dyu',
    learningLanguages: ['swa', 'wol', 'bam'],
    subscription: 'pro',
    stats: {
      xp: 2340,
      level: 8,
      nextLevelXP: 3600,
      streak: 12,
      wordsLearned: 47,
      badgesCount: 23,
      translationsCount: 147,
      contributionsCount: 18,
      rank: 42
    }
  },
  translation: {
    sourceLanguage: 'dyu',
    targetLanguage: 'bam',
    history: []
  },
  preferences: {
    darkMode: false,
    fontSize: 1.0,
    highContrast: false,
    offlineOnly: false
  },
  // Progrès leçons style Duolingo
  lessons: {
    targetLang: 'swa',
    completed: [],            // [{ id, score, perfect, date }]
    currentDay: 1,            // prochaine leçon à faire
    hearts: 5,                // vies (régénèrent toutes les 4h)
    heartsRegenAt: null       // ISO date de la prochaine régénération
  },
  // Stories complétées (id strings)
  stories: {
    completed: []
  }
};

const listeners = new Set();
let state = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export const store = {
  get(key) {
    return key ? state[key] : state;
  },
  set(key, value) {
    state = { ...state, [key]: value };
    persist();
    listeners.forEach(cb => cb(state));
  },
  update(key, updater) {
    state = { ...state, [key]: updater(state[key]) };
    persist();
    listeners.forEach(cb => cb(state));
  },
  subscribe(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  reset() {
    state = defaultState;
    persist();
    listeners.forEach(cb => cb(state));
  }
};
