/**
 * KIVU — Curriculum 30 jours, style Duolingo.
 *
 * 30 leçons structurées en 6 unités de 5 leçons chacune.
 * Chaque leçon contient 5 à 7 exercices de 4 types différents :
 *   - multiple-choice : QCM "Comment dit-on X en Y ?"
 *   - listen          : écoute via TTS, choisis le mot entendu
 *   - type            : tape la traduction
 *   - match           : associe les paires (FR ↔ langue cible)
 *
 * La langue cible est celle stockée dans store.translation.targetLanguage,
 * mais on fournit aussi des prompts FR pour rester accessible.
 */

import { PHRASES, LANG_LABELS } from './flashcards.js';

export const UNITS = [
  { id: 1, theme: '🌅', title: 'Premiers pas',         color: '#174E9C', desc: 'Salutations & politesse' },
  { id: 2, theme: '🍽️', title: 'Vie quotidienne',       color: '#F2952D', desc: 'Manger, boire, voyager' },
  { id: 3, theme: '👨‍👩‍👧', title: 'Famille & amis',     color: '#2D9E73', desc: 'Liens & émotions' },
  { id: 4, theme: '🛒', title: 'Marché & argent',        color: '#8C40AD', desc: 'Acheter, négocier' },
  { id: 5, theme: '🏥', title: 'Urgences & santé',       color: '#EB4D4D', desc: 'Demander de l\'aide' },
  { id: 6, theme: '🌍', title: 'Maître conversationnel', color: '#40B3BF', desc: 'Tout mettre en pratique' }
];

// Helpers ----------------------------------------------------------------
function pickPhrase(idx) { return PHRASES[idx % PHRASES.length]; }

function buildMC(phrase, targetLang) {
  const correct = phrase[targetLang];
  const distractors = PHRASES
    .filter(p => p[targetLang] && p[targetLang] !== correct)
    .map(p => p[targetLang]);
  // shuffle distractors
  for (let i = distractors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [distractors[i], distractors[j]] = [distractors[j], distractors[i]];
  }
  const options = [correct, ...distractors.slice(0, 3)];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return {
    type: 'multiple-choice',
    prompt: 'Comment dit-on en %LANG% :',
    question: phrase.fr,
    correct,
    options
  };
}

function buildListen(phrase, targetLang) {
  return {
    type: 'listen',
    prompt: 'Écoutez et choisissez le mot correspondant',
    speak: phrase[targetLang],
    correct: phrase.fr,
    options: shuffleSlice(PHRASES.map(p => p.fr).filter(t => t !== phrase.fr), 3).concat(phrase.fr).sort(() => Math.random() - 0.5)
  };
}

function buildType(phrase, targetLang) {
  return {
    type: 'type',
    prompt: 'Tapez la traduction',
    question: phrase.fr,
    correct: phrase[targetLang]
  };
}

function buildMatch(targetLang, count = 4) {
  const sample = shuffleSlice(PHRASES, count);
  return {
    type: 'match',
    prompt: 'Associez les paires',
    pairs: sample.map(p => ({ fr: p.fr, target: p[targetLang] }))
  };
}

function shuffleSlice(arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

/**
 * Génère les 30 leçons en interleaving les 4 types d'exercices.
 * IMPORTANT : appelé à chaque ouverture pour avoir des distracteurs frais.
 */
export function buildCurriculum(targetLang = 'swa') {
  const lessons = [];
  for (let day = 1; day <= 30; day++) {
    const unitId = Math.ceil(day / 5);
    const unit = UNITS.find(u => u.id === unitId);
    const exerciseCount = 5 + (day % 3); // 5, 6 ou 7 exos
    const exercises = [];

    // Choisis 5-7 phrases différentes pour cette leçon, déterministes par day
    const offsets = Array.from({ length: exerciseCount }, (_, i) => (day * 3 + i) % PHRASES.length);
    offsets.forEach((o, i) => {
      const phrase = pickPhrase(o);
      // Intercale les types : MC, Listen, Type, MC, Listen, Type, Match
      const typeIdx = i % 3;
      let ex;
      if (typeIdx === 0) ex = buildMC(phrase, targetLang);
      else if (typeIdx === 1) ex = buildListen(phrase, targetLang);
      else ex = buildType(phrase, targetLang);
      exercises.push(ex);
    });
    // Termine par un match si la leçon fait 6+ exercices
    if (exerciseCount >= 6) exercises.push(buildMatch(targetLang, 4));

    lessons.push({
      id: day,
      day,
      unitId,
      unitTheme: unit.theme,
      unitColor: unit.color,
      unitTitle: unit.title,
      title: lessonTitle(day),
      xpReward: 20 + (day * 2),
      exercises
    });
  }
  return lessons;
}

function lessonTitle(day) {
  const titles = [
    'Bonjour, le monde !',         // 1
    'Merci & politesse',           // 2
    'Comment ça va ?',             // 3
    'Au revoir',                   // 4
    'Récap unité 1',               // 5
    'À table',                     // 6
    'L\'eau et la vie',            // 7
    'Voyager léger',               // 8
    'Le marché du matin',          // 9
    'Récap unité 2',               // 10
    'Ma famille',                  // 11
    'Les amis sincères',           // 12
    'Émotions du cœur',            // 13
    'Génération de sages',         // 14
    'Récap unité 3',               // 15
    'Acheter au marché',           // 16
    'Compter en monnaie locale',   // 17
    'Marchander avec le sourire',  // 18
    'L\'art du troc',              // 19
    'Récap unité 4',               // 20
    'Dire qu\'on est malade',      // 21
    'Demander de l\'aide',         // 22
    'Chez le médecin',             // 23
    'Plantes médicinales',         // 24
    'Récap unité 5',               // 25
    'Tenir une conversation',      // 26
    'Raconter une histoire',       // 27
    'Argumenter avec respect',     // 28
    'Réciter un proverbe',         // 29
    'Diplôme du polyglotte'        // 30
  ];
  return titles[day - 1] || `Leçon ${day}`;
}

export { LANG_LABELS };
