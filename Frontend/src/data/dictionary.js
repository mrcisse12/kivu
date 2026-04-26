/**
 * KIVU — Dictionnaire visuel.
 *
 * Chaque entrée = 1 mot français + ses traductions, une catégorie,
 * une icône emoji et une couleur d'accent. Les emojis suffisent comme
 * "image visuelle" — légers, accessibles, pas de fichiers à charger.
 */

export const CATEGORIES = [
  { id: 'all',       label: 'Tout',         emoji: '🌍', color: '#666E85' },
  { id: 'greetings', label: 'Salutations',  emoji: '👋', color: '#1CB0F6' },
  { id: 'food',      label: 'Nourriture',   emoji: '🍽️', color: '#FF9600' },
  { id: 'family',    label: 'Famille',      emoji: '👨‍👩‍👧', color: '#8C40AD' },
  { id: 'numbers',   label: 'Nombres',      emoji: '🔢', color: '#2D9E73' },
  { id: 'travel',    label: 'Voyage',       emoji: '🚌', color: '#FACC80' },
  { id: 'body',      label: 'Corps',        emoji: '👤', color: '#EB4D4D' },
  { id: 'nature',    label: 'Nature',       emoji: '🌳', color: '#58C794' },
  { id: 'home',      label: 'Maison',       emoji: '🏠', color: '#40B3BF' },
  { id: 'work',      label: 'Travail',      emoji: '💼', color: '#174E9C' }
];

// Format : { fr, swa, wol, bam, hau, yor, zul, ibo, en, category, emoji }
export const ENTRIES = [
  // SALUTATIONS
  { fr: 'Bonjour',         swa: 'Jambo',     wol: 'Salaam aleekum', bam: 'I ni ce',    hau: 'Sannu',     yor: 'Bawo',  zul: 'Sawubona',     ibo: 'Ndewo',  en: 'Hello',     category: 'greetings', emoji: '👋' },
  { fr: 'Au revoir',       swa: 'Kwaheri',   wol: 'Ba beneen yoon', bam: "K'an b'a fo", hau: 'Sai an jima', yor: 'O dabọ',  zul: 'Sala kahle', ibo: 'Ka ọ dị', en: 'Goodbye',  category: 'greetings', emoji: '👋' },
  { fr: 'Merci',           swa: 'Asante',    wol: 'Jërëjëf',        bam: 'I ni ce',    hau: 'Na gode',   yor: 'E se',  zul: 'Ngiyabonga',   ibo: 'Daalu',  en: 'Thank you', category: 'greetings', emoji: '🙏' },
  { fr: 'Oui',             swa: 'Ndiyo',     wol: 'Waaw',           bam: 'Awɔ',        hau: 'Ee',        yor: 'Bẹẹni', zul: 'Yebo',         ibo: 'Ee',     en: 'Yes',       category: 'greetings', emoji: '✅' },
  { fr: 'Non',             swa: 'Hapana',    wol: 'Déedéet',        bam: 'Ayi',        hau: "A'a",       yor: 'Bẹẹkọ', zul: 'Cha',          ibo: 'Mba',    en: 'No',        category: 'greetings', emoji: '❌' },
  { fr: 'Comment ça va ?', swa: 'Habari yako?', wol: 'Naka nga def?', bam: 'I ka kéne?', hau: 'Yaya kake?', yor: 'Bawo ni?', zul: 'Unjani?', ibo: 'Kedu?', en: 'How are you?', category: 'greetings', emoji: '💬' },
  { fr: 'S\'il vous plaît', swa: 'Tafadhali', wol: 'Su la neexee',   bam: 'I ni ce',    hau: 'Don Allah', yor: 'Jọwọ',  zul: 'Sicela',       ibo: 'Biko',   en: 'Please',    category: 'greetings', emoji: '🤲' },
  { fr: 'Pardon',          swa: 'Samahani',  wol: 'Baal ma',        bam: 'Hakɛto',     hau: 'Yi haƙuri', yor: 'Mafurahuni', zul: 'Uxolo',  ibo: 'Ndo',    en: 'Sorry',     category: 'greetings', emoji: '🙇' },

  // NOURRITURE
  { fr: 'Eau',             swa: 'Maji',      wol: 'Ndox',           bam: 'Ji',         hau: 'Ruwa',      yor: 'Omi',   zul: 'Amanzi',       ibo: 'Mmiri',  en: 'Water',     category: 'food',      emoji: '💧' },
  { fr: 'Pain',            swa: 'Mkate',     wol: 'Mburu',          bam: 'Buru',       hau: 'Burodi',    yor: 'Buredi', zul: 'Isinkwa',      ibo: 'Achịcha', en: 'Bread',    category: 'food',      emoji: '🍞' },
  { fr: 'Riz',             swa: 'Wali',      wol: 'Ceeb',           bam: 'Maro',       hau: 'Shinkafa',  yor: 'Iresi', zul: 'Irayisi',      ibo: 'Osikapa', en: 'Rice',     category: 'food',      emoji: '🍚' },
  { fr: 'Viande',          swa: 'Nyama',     wol: 'Yapp',           bam: 'Sogo',       hau: 'Nama',      yor: 'Eran',  zul: 'Inyama',       ibo: 'Anụ',    en: 'Meat',      category: 'food',      emoji: '🥩' },
  { fr: 'Poisson',         swa: 'Samaki',    wol: 'Jën',            bam: 'Jɛgɛ',       hau: 'Kifi',      yor: 'Ẹja',   zul: 'Ifishi',       ibo: 'Azụ',    en: 'Fish',      category: 'food',      emoji: '🐟' },
  { fr: 'Mangue',          swa: 'Embe',      wol: 'Mango',          bam: 'Mango',      hau: 'Mangwaro',  yor: 'Mangoro', zul: 'Umango',     ibo: 'Mango',  en: 'Mango',     category: 'food',      emoji: '🥭' },
  { fr: 'Café',            swa: 'Kahawa',    wol: 'Kafe',           bam: 'Kafe',       hau: 'Kofi',      yor: 'Kọfi',  zul: 'Ikhofi',       ibo: 'Kọfị',   en: 'Coffee',    category: 'food',      emoji: '☕' },
  { fr: 'Thé',             swa: 'Chai',      wol: 'Atayya',         bam: 'Te',         hau: 'Shayi',     yor: 'Tii',   zul: 'Itiye',        ibo: 'Tii',    en: 'Tea',       category: 'food',      emoji: '🍵' },

  // FAMILLE
  { fr: 'Famille',         swa: 'Familia',   wol: 'Njabootu',       bam: 'Du',         hau: 'Iyali',     yor: 'Ẹbi',   zul: 'Umndeni',      ibo: 'Ezinụlọ', en: 'Family',   category: 'family',    emoji: '👨‍👩‍👧‍👦' },
  { fr: 'Mère',            swa: 'Mama',      wol: 'Yaay',           bam: 'Ba',         hau: 'Uwa',       yor: 'Iya',   zul: 'Umama',        ibo: 'Nne',    en: 'Mother',    category: 'family',    emoji: '👩' },
  { fr: 'Père',            swa: 'Baba',      wol: 'Baay',           bam: 'Fa',         hau: 'Baba',      yor: 'Baba',  zul: 'Ubaba',        ibo: 'Nna',    en: 'Father',    category: 'family',    emoji: '👨' },
  { fr: 'Enfant',          swa: 'Mtoto',     wol: 'Doom',           bam: 'Den',        hau: 'Yaro',      yor: 'Ọmọ',   zul: 'Ingane',       ibo: 'Nwa',    en: 'Child',     category: 'family',    emoji: '🧒' },
  { fr: 'Frère',           swa: 'Kaka',      wol: 'Mag',            bam: 'Kɔrɔ',       hau: 'Yaya',      yor: 'Arakunrin', zul: 'Umfowethu', ibo: 'Nwanne nwoke', en: 'Brother', category: 'family', emoji: '👦' },
  { fr: 'Sœur',            swa: 'Dada',      wol: 'Jigéen',         bam: 'Bara',       hau: 'Yar uwa',   yor: 'Arabinrin', zul: 'Udadewethu', ibo: 'Nwanne nwanyị', en: 'Sister', category: 'family', emoji: '👧' },
  { fr: 'Ami',             swa: 'Rafiki',    wol: 'Xarit',          bam: 'Teri',       hau: 'Aboki',     yor: 'Ọrẹ',   zul: 'Umngane',      ibo: 'Enyi',   en: 'Friend',    category: 'family',    emoji: '🫂' },

  // NOMBRES
  { fr: 'Un',              swa: 'Moja',      wol: 'Benn',           bam: 'Kelen',      hau: 'Daya',      yor: 'Ọkan',  zul: 'Kunye',        ibo: 'Otu',    en: 'One',       category: 'numbers',   emoji: '1️⃣' },
  { fr: 'Deux',            swa: 'Mbili',     wol: 'Ñaar',           bam: 'Fila',       hau: 'Biyu',      yor: 'Meji',  zul: 'Kubili',       ibo: 'Abụọ',   en: 'Two',       category: 'numbers',   emoji: '2️⃣' },
  { fr: 'Trois',           swa: 'Tatu',      wol: 'Ñett',           bam: 'Saba',       hau: 'Uku',       yor: 'Mẹta',  zul: 'Kuthathu',     ibo: 'Atọ',    en: 'Three',     category: 'numbers',   emoji: '3️⃣' },
  { fr: 'Cinq',            swa: 'Tano',      wol: 'Juróom',         bam: 'Duuru',      hau: 'Biyar',     yor: 'Marun', zul: 'Kuhlanu',      ibo: 'Ise',    en: 'Five',      category: 'numbers',   emoji: '5️⃣' },
  { fr: 'Dix',             swa: 'Kumi',      wol: 'Fukk',           bam: 'Tan',        hau: 'Goma',      yor: 'Mẹwa',  zul: 'Lishumi',      ibo: 'Iri',    en: 'Ten',       category: 'numbers',   emoji: '🔟' },

  // VOYAGE
  { fr: 'Aller',           swa: 'Kwenda',    wol: 'Dem',            bam: 'Taga',       hau: 'Tafiya',    yor: 'Lọ',    zul: 'Hamba',        ibo: 'Gaa',    en: 'Go',        category: 'travel',    emoji: '🚶' },
  { fr: 'Voiture',         swa: 'Gari',      wol: 'Woto',           bam: 'Mobili',     hau: 'Mota',      yor: 'Ọkọ ayọkẹlẹ', zul: 'Imoto', ibo: 'Ụgbọ ala', en: 'Car',     category: 'travel',    emoji: '🚗' },
  { fr: 'Bus',             swa: 'Basi',      wol: 'Bis',            bam: 'Bus',        hau: 'Bas',       yor: 'Ọkọ akero', zul: 'Ibhasi', ibo: 'Bọs',    en: 'Bus',       category: 'travel',    emoji: '🚌' },
  { fr: 'Avion',           swa: 'Ndege',     wol: 'Ropplaan',       bam: 'Awyɔn',      hau: 'Jirgin sama', yor: 'Ọkọ ofurufu', zul: 'Indiza', ibo: 'Ụgbọ elu', en: 'Plane', category: 'travel', emoji: '✈️' },
  { fr: 'Marché',          swa: 'Soko',      wol: 'Marsé',          bam: 'Sugu',       hau: 'Kasuwa',    yor: 'Ọja',   zul: 'Imakethe',     ibo: 'Ahịa',   en: 'Market',    category: 'travel',    emoji: '🛒' },
  { fr: 'Maison',          swa: 'Nyumba',    wol: 'Kër',            bam: 'So',         hau: 'Gida',      yor: 'Ile',   zul: 'Indlu',        ibo: 'Ụlọ',    en: 'House',     category: 'home',      emoji: '🏠' },
  { fr: 'Lit',             swa: 'Kitanda',   wol: 'Lal',            bam: 'Daladala',   hau: 'Gado',      yor: 'Ibusun', zul: 'Umbhede',     ibo: 'Akwa',   en: 'Bed',       category: 'home',      emoji: '🛏️' },

  // CORPS
  { fr: 'Tête',            swa: 'Kichwa',    wol: 'Bopp',           bam: 'Kun',        hau: 'Kai',       yor: 'Ori',   zul: 'Ikhanda',      ibo: 'Isi',    en: 'Head',      category: 'body',      emoji: '🗣️' },
  { fr: 'Main',            swa: 'Mkono',     wol: 'Loxo',           bam: 'Bolo',       hau: 'Hannu',     yor: 'Ọwọ',   zul: 'Isandla',      ibo: 'Aka',    en: 'Hand',      category: 'body',      emoji: '✋' },
  { fr: 'Pied',            swa: 'Mguu',      wol: 'Tànk',           bam: 'Sen',        hau: 'Ƙafa',      yor: 'Ẹsẹ',   zul: 'Unyawo',       ibo: 'Ụkwụ',   en: 'Foot',      category: 'body',      emoji: '🦶' },
  { fr: 'Yeux',            swa: 'Macho',     wol: 'Bët',            bam: 'Ɲa',         hau: 'Idanu',     yor: 'Ojú',   zul: 'Amehlo',       ibo: 'Anya',   en: 'Eyes',      category: 'body',      emoji: '👁️' },
  { fr: 'Cœur',            swa: 'Moyo',      wol: 'Xol',            bam: 'Dusu',       hau: 'Zuciya',    yor: 'Ọkàn',  zul: 'Inhliziyo',    ibo: 'Obi',    en: 'Heart',     category: 'body',      emoji: '❤️' },

  // NATURE
  { fr: 'Soleil',          swa: 'Jua',       wol: 'Jant',           bam: 'Tile',       hau: 'Rana',      yor: 'Ọrùn',  zul: 'Ilanga',       ibo: 'Anyanwụ', en: 'Sun',     category: 'nature',    emoji: '☀️' },
  { fr: 'Lune',            swa: 'Mwezi',     wol: 'Weer',           bam: 'Kalo',       hau: 'Wata',      yor: 'Òṣùpá', zul: 'Inyanga',      ibo: 'Ọnwa',   en: 'Moon',      category: 'nature',    emoji: '🌙' },
  { fr: 'Pluie',           swa: 'Mvua',      wol: 'Taw',            bam: 'Sanji',      hau: 'Ruwan sama', yor: 'Òjò',  zul: 'Imvula',       ibo: 'Mmiri ozuzo', en: 'Rain', category: 'nature',    emoji: '🌧️' },
  { fr: 'Arbre',           swa: 'Mti',       wol: 'Garab',          bam: 'Yiri',       hau: 'Itace',     yor: 'Igi',   zul: 'Isihlahla',    ibo: 'Osisi',  en: 'Tree',      category: 'nature',    emoji: '🌳' },
  { fr: 'Animal',          swa: 'Mnyama',    wol: 'Mala',           bam: 'Bagan',      hau: 'Dabba',     yor: 'Ẹranko', zul: 'Isilwane',    ibo: 'Anụmanụ', en: 'Animal',   category: 'nature',    emoji: '🦁' },

  // TRAVAIL
  { fr: 'Travail',         swa: 'Kazi',      wol: 'Ligéey',         bam: 'Baara',      hau: 'Aiki',      yor: 'Iṣẹ',   zul: 'Umsebenzi',    ibo: 'Ọrụ',    en: 'Work',      category: 'work',      emoji: '💼' },
  { fr: 'Argent',          swa: 'Pesa',      wol: 'Xaalis',         bam: 'Wari',       hau: 'Kuɗi',      yor: 'Owó',   zul: 'Imali',        ibo: 'Ego',    en: 'Money',     category: 'work',      emoji: '💰' },
  { fr: 'École',           swa: 'Shule',     wol: 'Daara',          bam: 'Kalanso',    hau: 'Makaranta', yor: 'Ile-iwe', zul: 'Isikole',    ibo: 'Akwụkwọ', en: 'School',   category: 'work',      emoji: '🏫' }
];

/** Filtre + recherche full-text minimaliste sur toutes les langues. */
export function searchEntries(query, category = 'all') {
  const q = (query || '').trim().toLowerCase();
  const folded = q.normalize('NFD').replace(/[̀-ͯ]/g, '');
  return ENTRIES.filter(e => {
    if (category !== 'all' && e.category !== category) return false;
    if (!folded) return true;
    const haystack = [e.fr, e.swa, e.wol, e.bam, e.hau, e.yor, e.zul, e.ibo, e.en]
      .join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return haystack.includes(folded);
  });
}
