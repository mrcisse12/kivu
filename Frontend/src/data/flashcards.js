/**
 * Flashcards KIVU — phrases courantes pour apprentissage interactif.
 * Synchronisé avec Backend-Python/utils/dictionary.py.
 */

export const PHRASES = [
  { fr: 'Bonjour',         en: 'Hello',     swa: 'Jambo',    wol: 'Salaam aleekum', bam: 'I ni ce',  hau: 'Sannu',     yor: 'Bawo',  zul: 'Sawubona',     ibo: 'Ndewo' },
  { fr: 'Merci',           en: 'Thank you', swa: 'Asante',   wol: 'Jërëjëf',        bam: 'I ni ce',  hau: 'Na gode',   yor: 'E se',  zul: 'Ngiyabonga',   ibo: 'Daalu' },
  { fr: 'Comment ça va ?', en: 'How are you?', swa: 'Habari yako?', wol: 'Naka nga def?', bam: 'I ka kéne?', hau: 'Yaya kake?', yor: 'Bawo ni?', zul: 'Unjani?', ibo: 'Kedu?' },
  { fr: 'Au revoir',       en: 'Goodbye',   swa: 'Kwaheri',  wol: 'Ba beneen yoon', bam: "K'an b'a fo", hau: 'Sai an jima', yor: 'O dabọ',  zul: 'Sala kahle', ibo: 'Ka ọ dị' },
  { fr: 'Oui',             en: 'Yes',       swa: 'Ndiyo',    wol: 'Waaw',           bam: 'Awɔ',      hau: 'Ee',        yor: 'Bẹẹni', zul: 'Yebo',         ibo: 'Ee' },
  { fr: 'Non',             en: 'No',        swa: 'Hapana',   wol: 'Déedéet',        bam: 'Ayi',      hau: "A'a",       yor: 'Bẹẹkọ', zul: 'Cha',          ibo: 'Mba' },
  { fr: 'Eau',             en: 'Water',     swa: 'Maji',     wol: 'Ndox',           bam: 'Ji',       hau: 'Ruwa',      yor: 'Omi',   zul: 'Amanzi',       ibo: 'Mmiri' },
  { fr: 'Famille',         en: 'Family',    swa: 'Familia',  wol: 'Njabootu',       bam: 'Du',       hau: 'Iyali',     yor: 'Ẹbi',   zul: 'Umndeni',      ibo: 'Ezinụlọ' }
];

/**
 * Génère un quiz de N questions à choix multiples.
 * Pour chaque question, on prend 1 phrase, on demande de la traduire dans la
 * langue cible, et on propose 3 leurres + la bonne réponse.
 */
export function buildQuiz(targetLang = 'swa', count = 5) {
  const pool = [...PHRASES];
  shuffle(pool);
  return pool.slice(0, count).map((phrase) => {
    const correct = phrase[targetLang];
    const distractorPool = pool
      .filter(p => p[targetLang] && p[targetLang] !== correct)
      .map(p => p[targetLang]);
    shuffle(distractorPool);
    const options = shuffle([correct, ...distractorPool.slice(0, 3)]);
    return {
      question: phrase.fr,
      target: correct,
      options,
      lang: targetLang
    };
  });
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const LANG_LABELS = {
  swa: { name: 'Swahili',   flag: '🇹🇿', xpPerCorrect: 10 },
  wol: { name: 'Wolof',     flag: '🇸🇳', xpPerCorrect: 12 },
  bam: { name: 'Bambara',   flag: '🇲🇱', xpPerCorrect: 12 },
  hau: { name: 'Haoussa',   flag: '🇳🇬', xpPerCorrect: 12 },
  yor: { name: 'Yoruba',    flag: '🇳🇬', xpPerCorrect: 12 },
  zul: { name: 'Zulu',      flag: '🇿🇦', xpPerCorrect: 12 },
  ibo: { name: 'Igbo',      flag: '🇳🇬', xpPerCorrect: 12 },
  en:  { name: 'Anglais',   flag: '🇬🇧', xpPerCorrect: 8 }
};
