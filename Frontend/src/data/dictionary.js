/**
 * KIVU — Dictionnaire visuel.
 *
 * Chaque entrée : 1 mot français + ses traductions, une catégorie,
 * un emoji, un identifiant stable (pour favoris/récents) et,
 * pour les entrées principales, un exemple d'utilisation.
 *
 * Format : { id, fr, swa, wol, bam, hau, yor, zul, ibo, en,
 *            category, emoji, example? }
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
  { id: 'work',      label: 'Travail',      emoji: '💼', color: '#174E9C' },
  { id: 'time',      label: 'Temps',        emoji: '⏰', color: '#F2952D' },
  { id: 'feelings',  label: 'Émotions',     emoji: '😊', color: '#FF6B9D' }
];

// Helper: build slug-id from French (stable across renames as long as fr stays)
const slug = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Each raw entry — id is auto-generated below.
const RAW = [
  // ─── SALUTATIONS ─────────────────────────────────────
  { fr: 'Bonjour',          swa: 'Jambo',        wol: 'Salaam aleekum', bam: 'I ni ce',     hau: 'Sannu',        yor: 'Bawo',          zul: 'Sawubona',      ibo: 'Ndewo',         en: 'Hello',        category: 'greetings', emoji: '👋', example: { fr: 'Bonjour mon ami !', en: 'Hello my friend!' } },
  { fr: 'Au revoir',        swa: 'Kwaheri',      wol: 'Ba beneen yoon', bam: "K'an b'a fo",  hau: 'Sai an jima',  yor: 'O dabọ',        zul: 'Sala kahle',    ibo: 'Ka ọ dị',       en: 'Goodbye',      category: 'greetings', emoji: '👋' },
  { fr: 'Merci',            swa: 'Asante',       wol: 'Jërëjëf',        bam: 'I ni ce',     hau: 'Na gode',      yor: 'E se',          zul: 'Ngiyabonga',    ibo: 'Daalu',         en: 'Thank you',    category: 'greetings', emoji: '🙏', example: { fr: 'Merci beaucoup !', en: 'Thank you very much!' } },
  { fr: 'Oui',              swa: 'Ndiyo',        wol: 'Waaw',           bam: 'Awɔ',         hau: 'Ee',           yor: 'Bẹẹni',         zul: 'Yebo',          ibo: 'Ee',            en: 'Yes',          category: 'greetings', emoji: '✅' },
  { fr: 'Non',              swa: 'Hapana',       wol: 'Déedéet',        bam: 'Ayi',         hau: "A'a",          yor: 'Bẹẹkọ',         zul: 'Cha',           ibo: 'Mba',           en: 'No',           category: 'greetings', emoji: '❌' },
  { fr: 'Comment ça va ?',  swa: 'Habari yako?', wol: 'Naka nga def?',  bam: 'I ka kéne?',  hau: 'Yaya kake?',   yor: 'Bawo ni?',      zul: 'Unjani?',       ibo: 'Kedu?',         en: 'How are you?', category: 'greetings', emoji: '💬' },
  { fr: "S'il vous plaît",  swa: 'Tafadhali',    wol: 'Su la neexee',   bam: 'I ni ce',     hau: 'Don Allah',    yor: 'Jọwọ',          zul: 'Sicela',        ibo: 'Biko',          en: 'Please',       category: 'greetings', emoji: '🤲' },
  { fr: 'Pardon',           swa: 'Samahani',     wol: 'Baal ma',        bam: 'Hakɛto',      hau: 'Yi haƙuri',    yor: 'Mafurahuni',    zul: 'Uxolo',         ibo: 'Ndo',           en: 'Sorry',        category: 'greetings', emoji: '🙇' },
  { fr: 'Bienvenue',        swa: 'Karibu',       wol: 'Dalal ak jàmm',  bam: 'I bisimila',  hau: 'Maraba',       yor: 'Ẹ ku abọ',      zul: 'Wamukelekile',  ibo: 'Nnọọ',          en: 'Welcome',      category: 'greetings', emoji: '🌟' },
  { fr: 'Bonne nuit',       swa: 'Usiku mwema',  wol: 'Fanaan ak jàmm', bam: 'I ni su',     hau: 'Barka da dare', yor: 'O daaro',      zul: 'Ulale kahle',   ibo: 'Ka chi foo',    en: 'Good night',   category: 'greetings', emoji: '🌙' },

  // ─── NOURRITURE ───────────────────────────────────────
  { fr: 'Eau',              swa: 'Maji',         wol: 'Ndox',           bam: 'Ji',          hau: 'Ruwa',         yor: 'Omi',           zul: 'Amanzi',        ibo: 'Mmiri',         en: 'Water',        category: 'food',      emoji: '💧', example: { fr: "Je voudrais de l'eau", en: 'I would like some water' } },
  { fr: 'Pain',             swa: 'Mkate',        wol: 'Mburu',          bam: 'Buru',        hau: 'Burodi',       yor: 'Buredi',        zul: 'Isinkwa',       ibo: 'Achịcha',       en: 'Bread',        category: 'food',      emoji: '🍞' },
  { fr: 'Riz',              swa: 'Wali',         wol: 'Ceeb',           bam: 'Maro',        hau: 'Shinkafa',     yor: 'Iresi',         zul: 'Irayisi',       ibo: 'Osikapa',       en: 'Rice',         category: 'food',      emoji: '🍚' },
  { fr: 'Viande',           swa: 'Nyama',        wol: 'Yapp',           bam: 'Sogo',        hau: 'Nama',         yor: 'Eran',          zul: 'Inyama',        ibo: 'Anụ',           en: 'Meat',         category: 'food',      emoji: '🥩' },
  { fr: 'Poisson',          swa: 'Samaki',       wol: 'Jën',            bam: 'Jɛgɛ',        hau: 'Kifi',         yor: 'Ẹja',           zul: 'Ifishi',        ibo: 'Azụ',           en: 'Fish',         category: 'food',      emoji: '🐟' },
  { fr: 'Mangue',           swa: 'Embe',         wol: 'Mango',          bam: 'Mango',       hau: 'Mangwaro',     yor: 'Mangoro',       zul: 'Umango',        ibo: 'Mango',         en: 'Mango',        category: 'food',      emoji: '🥭' },
  { fr: 'Café',             swa: 'Kahawa',       wol: 'Kafe',           bam: 'Kafe',        hau: 'Kofi',         yor: 'Kọfi',          zul: 'Ikhofi',        ibo: 'Kọfị',          en: 'Coffee',       category: 'food',      emoji: '☕' },
  { fr: 'Thé',              swa: 'Chai',         wol: 'Atayya',         bam: 'Te',          hau: 'Shayi',        yor: 'Tii',           zul: 'Itiye',         ibo: 'Tii',           en: 'Tea',          category: 'food',      emoji: '🍵' },
  { fr: 'Lait',             swa: 'Maziwa',       wol: 'Meew',           bam: 'Nɔnɔ',        hau: 'Madara',       yor: 'Wàrà',          zul: 'Ubisi',         ibo: 'Mmiri ara',     en: 'Milk',         category: 'food',      emoji: '🥛' },
  { fr: 'Sucre',            swa: 'Sukari',       wol: 'Sukër',          bam: 'Sukaro',      hau: 'Sukari',       yor: 'Suga',          zul: 'Ushukela',      ibo: 'Shuga',         en: 'Sugar',        category: 'food',      emoji: '🍯' },
  { fr: 'Sel',              swa: 'Chumvi',       wol: 'Xorom',          bam: 'Kɔgɔ',        hau: 'Gishiri',      yor: 'Iyọ̀',          zul: 'Usawoti',       ibo: 'Nnu',           en: 'Salt',         category: 'food',      emoji: '🧂' },

  // ─── FAMILLE ──────────────────────────────────────────
  { fr: 'Famille',          swa: 'Familia',      wol: 'Njabootu',       bam: 'Du',          hau: 'Iyali',        yor: 'Ẹbi',           zul: 'Umndeni',       ibo: 'Ezinụlọ',       en: 'Family',       category: 'family',    emoji: '👨‍👩‍👧‍👦' },
  { fr: 'Mère',             swa: 'Mama',         wol: 'Yaay',           bam: 'Ba',          hau: 'Uwa',          yor: 'Iya',           zul: 'Umama',         ibo: 'Nne',           en: 'Mother',       category: 'family',    emoji: '👩' },
  { fr: 'Père',             swa: 'Baba',         wol: 'Baay',           bam: 'Fa',          hau: 'Baba',         yor: 'Baba',          zul: 'Ubaba',         ibo: 'Nna',           en: 'Father',       category: 'family',    emoji: '👨' },
  { fr: 'Enfant',           swa: 'Mtoto',        wol: 'Doom',           bam: 'Den',         hau: 'Yaro',         yor: 'Ọmọ',           zul: 'Ingane',        ibo: 'Nwa',           en: 'Child',        category: 'family',    emoji: '🧒' },
  { fr: 'Frère',            swa: 'Kaka',        wol: 'Mag',             bam: 'Kɔrɔ',        hau: 'Yaya',         yor: 'Arakunrin',     zul: 'Umfowethu',     ibo: 'Nwanne nwoke',  en: 'Brother',      category: 'family',    emoji: '👦' },
  { fr: 'Sœur',             swa: 'Dada',        wol: 'Jigéen',          bam: 'Bara',        hau: 'Yar uwa',      yor: 'Arabinrin',     zul: 'Udadewethu',    ibo: 'Nwanne nwanyị', en: 'Sister',       category: 'family',    emoji: '👧' },
  { fr: 'Ami',              swa: 'Rafiki',       wol: 'Xarit',          bam: 'Teri',        hau: 'Aboki',        yor: 'Ọrẹ',           zul: 'Umngane',       ibo: 'Enyi',          en: 'Friend',       category: 'family',    emoji: '🫂' },
  { fr: 'Grand-mère',       swa: 'Bibi',         wol: 'Maam',           bam: 'Mama',        hau: 'Kaka',         yor: 'Iya agba',      zul: 'Ugogo',         ibo: 'Nne ochie',     en: 'Grandmother',  category: 'family',    emoji: '👵' },
  { fr: 'Grand-père',       swa: 'Babu',         wol: 'Mam',            bam: 'Mokɔrɔ',      hau: 'Kaka',         yor: 'Baba agba',     zul: 'Umkhulu',       ibo: 'Nna ochie',     en: 'Grandfather',  category: 'family',    emoji: '👴' },

  // ─── NOMBRES ──────────────────────────────────────────
  { fr: 'Un',               swa: 'Moja',         wol: 'Benn',           bam: 'Kelen',       hau: 'Daya',         yor: 'Ọkan',          zul: 'Kunye',         ibo: 'Otu',           en: 'One',          category: 'numbers',   emoji: '1️⃣' },
  { fr: 'Deux',             swa: 'Mbili',        wol: 'Ñaar',           bam: 'Fila',        hau: 'Biyu',         yor: 'Meji',          zul: 'Kubili',        ibo: 'Abụọ',          en: 'Two',          category: 'numbers',   emoji: '2️⃣' },
  { fr: 'Trois',            swa: 'Tatu',         wol: 'Ñett',           bam: 'Saba',        hau: 'Uku',          yor: 'Mẹta',          zul: 'Kuthathu',      ibo: 'Atọ',           en: 'Three',        category: 'numbers',   emoji: '3️⃣' },
  { fr: 'Quatre',           swa: 'Nne',          wol: 'Ñeent',          bam: 'Naani',       hau: 'Hudu',         yor: 'Mẹrin',         zul: 'Kune',          ibo: 'Anọ',           en: 'Four',         category: 'numbers',   emoji: '4️⃣' },
  { fr: 'Cinq',             swa: 'Tano',         wol: 'Juróom',         bam: 'Duuru',       hau: 'Biyar',        yor: 'Marun',         zul: 'Kuhlanu',       ibo: 'Ise',           en: 'Five',         category: 'numbers',   emoji: '5️⃣' },
  { fr: 'Six',              swa: 'Sita',         wol: 'Juróom benn',    bam: 'Wɔɔrɔ',       hau: 'Shida',        yor: 'Mẹfa',          zul: 'Isithupha',     ibo: 'Isii',          en: 'Six',          category: 'numbers',   emoji: '6️⃣' },
  { fr: 'Sept',             swa: 'Saba',         wol: 'Juróom ñaar',    bam: 'Wolonfila',   hau: 'Bakwai',       yor: 'Meje',          zul: 'Isikhombisa',   ibo: 'Asaa',          en: 'Seven',        category: 'numbers',   emoji: '7️⃣' },
  { fr: 'Huit',             swa: 'Nane',         wol: 'Juróom ñett',    bam: 'Seegin',      hau: 'Takwas',       yor: 'Mẹjọ',          zul: 'Isishiyagalombili', ibo: 'Asatọ',     en: 'Eight',        category: 'numbers',   emoji: '8️⃣' },
  { fr: 'Neuf',             swa: 'Tisa',         wol: 'Juróom ñeent',   bam: 'Kɔnɔntɔn',    hau: 'Tara',         yor: 'Mẹsan',         zul: 'Isishiyagalolunye', ibo: 'Itoolu',     en: 'Nine',         category: 'numbers',   emoji: '9️⃣' },
  { fr: 'Dix',              swa: 'Kumi',         wol: 'Fukk',           bam: 'Tan',         hau: 'Goma',         yor: 'Mẹwa',          zul: 'Lishumi',       ibo: 'Iri',           en: 'Ten',          category: 'numbers',   emoji: '🔟' },

  // ─── VOYAGE ───────────────────────────────────────────
  { fr: 'Aller',            swa: 'Kwenda',       wol: 'Dem',            bam: 'Taga',        hau: 'Tafiya',       yor: 'Lọ',            zul: 'Hamba',         ibo: 'Gaa',           en: 'Go',           category: 'travel',    emoji: '🚶' },
  { fr: 'Voiture',          swa: 'Gari',         wol: 'Woto',           bam: 'Mobili',      hau: 'Mota',         yor: 'Ọkọ ayọkẹlẹ',   zul: 'Imoto',         ibo: 'Ụgbọ ala',      en: 'Car',          category: 'travel',    emoji: '🚗' },
  { fr: 'Bus',              swa: 'Basi',         wol: 'Bis',            bam: 'Bus',         hau: 'Bas',          yor: 'Ọkọ akero',     zul: 'Ibhasi',        ibo: 'Bọs',           en: 'Bus',          category: 'travel',    emoji: '🚌' },
  { fr: 'Avion',            swa: 'Ndege',        wol: 'Ropplaan',       bam: 'Awyɔn',       hau: 'Jirgin sama',  yor: 'Ọkọ ofurufu',   zul: 'Indiza',        ibo: 'Ụgbọ elu',      en: 'Plane',        category: 'travel',    emoji: '✈️' },
  { fr: 'Marché',           swa: 'Soko',         wol: 'Marsé',          bam: 'Sugu',        hau: 'Kasuwa',       yor: 'Ọja',           zul: 'Imakethe',      ibo: 'Ahịa',          en: 'Market',       category: 'travel',    emoji: '🛒', example: { fr: 'Allons au marché', en: "Let's go to the market" } },
  { fr: 'Train',            swa: 'Treni',        wol: 'Saxaar',         bam: 'Sisikalan',   hau: 'Jirgin ƙasa',  yor: 'Ọkọ ojuirin',   zul: 'Isitimela',     ibo: 'Ụgbọ oloko',    en: 'Train',        category: 'travel',    emoji: '🚆' },
  { fr: 'Hôtel',            swa: 'Hoteli',       wol: 'Otel',           bam: 'Otɛli',       hau: 'Otal',         yor: 'Hotẹẹli',       zul: 'Ihhotela',      ibo: 'Họtel',         en: 'Hotel',        category: 'travel',    emoji: '🏨' },

  // ─── MAISON ───────────────────────────────────────────
  { fr: 'Maison',           swa: 'Nyumba',       wol: 'Kër',            bam: 'So',          hau: 'Gida',         yor: 'Ile',           zul: 'Indlu',         ibo: 'Ụlọ',           en: 'House',        category: 'home',      emoji: '🏠' },
  { fr: 'Lit',              swa: 'Kitanda',      wol: 'Lal',            bam: 'Daladala',    hau: 'Gado',         yor: 'Ibusun',        zul: 'Umbhede',       ibo: 'Akwa',          en: 'Bed',          category: 'home',      emoji: '🛏️' },
  { fr: 'Cuisine',          swa: 'Jiko',         wol: 'Waañ',           bam: 'Tobiliso',    hau: 'Kicin',        yor: 'Ile idana',     zul: 'Ikhishi',       ibo: 'Kichin',        en: 'Kitchen',      category: 'home',      emoji: '🍳' },
  { fr: 'Porte',            swa: 'Mlango',       wol: 'Buntu',          bam: 'Da',          hau: 'Ƙofa',         yor: 'Ilẹkun',        zul: 'Umnyango',      ibo: 'Ọnụ ụzọ',       en: 'Door',         category: 'home',      emoji: '🚪' },
  { fr: 'Fenêtre',          swa: 'Dirisha',      wol: 'Palanteer',      bam: 'Finɛtɛrɛ',    hau: 'Taga',         yor: 'Fèrèsé',        zul: 'Iwindi',        ibo: 'Mpio',          en: 'Window',       category: 'home',      emoji: '🪟' },

  // ─── CORPS ────────────────────────────────────────────
  { fr: 'Tête',             swa: 'Kichwa',       wol: 'Bopp',           bam: 'Kun',         hau: 'Kai',          yor: 'Ori',           zul: 'Ikhanda',       ibo: 'Isi',           en: 'Head',         category: 'body',      emoji: '🗣️' },
  { fr: 'Main',             swa: 'Mkono',        wol: 'Loxo',           bam: 'Bolo',        hau: 'Hannu',        yor: 'Ọwọ',           zul: 'Isandla',       ibo: 'Aka',           en: 'Hand',         category: 'body',      emoji: '✋' },
  { fr: 'Pied',             swa: 'Mguu',         wol: 'Tànk',           bam: 'Sen',         hau: 'Ƙafa',         yor: 'Ẹsẹ',           zul: 'Unyawo',        ibo: 'Ụkwụ',          en: 'Foot',         category: 'body',      emoji: '🦶' },
  { fr: 'Yeux',             swa: 'Macho',        wol: 'Bët',            bam: 'Ɲa',          hau: 'Idanu',        yor: 'Ojú',           zul: 'Amehlo',        ibo: 'Anya',          en: 'Eyes',         category: 'body',      emoji: '👁️' },
  { fr: 'Cœur',             swa: 'Moyo',         wol: 'Xol',            bam: 'Dusu',        hau: 'Zuciya',       yor: 'Ọkàn',          zul: 'Inhliziyo',     ibo: 'Obi',           en: 'Heart',        category: 'body',      emoji: '❤️' },
  { fr: 'Bouche',           swa: 'Mdomo',        wol: 'Gémmiñ',         bam: 'Da',          hau: 'Baki',         yor: 'Ẹnu',           zul: 'Umlomo',        ibo: 'Ọnụ',           en: 'Mouth',        category: 'body',      emoji: '👄' },
  { fr: 'Oreille',          swa: 'Sikio',        wol: 'Nopp',           bam: 'Tulo',        hau: 'Kunne',        yor: 'Eti',           zul: 'Indlebe',       ibo: 'Ntị',           en: 'Ear',          category: 'body',      emoji: '👂' },

  // ─── NATURE ───────────────────────────────────────────
  { fr: 'Soleil',           swa: 'Jua',          wol: 'Jant',           bam: 'Tile',        hau: 'Rana',         yor: 'Ọrùn',          zul: 'Ilanga',        ibo: 'Anyanwụ',       en: 'Sun',          category: 'nature',    emoji: '☀️' },
  { fr: 'Lune',             swa: 'Mwezi',        wol: 'Weer',           bam: 'Kalo',        hau: 'Wata',         yor: 'Òṣùpá',         zul: 'Inyanga',       ibo: 'Ọnwa',          en: 'Moon',         category: 'nature',    emoji: '🌙' },
  { fr: 'Pluie',            swa: 'Mvua',         wol: 'Taw',            bam: 'Sanji',       hau: 'Ruwan sama',   yor: 'Òjò',           zul: 'Imvula',        ibo: 'Mmiri ozuzo',   en: 'Rain',         category: 'nature',    emoji: '🌧️' },
  { fr: 'Arbre',            swa: 'Mti',          wol: 'Garab',          bam: 'Yiri',        hau: 'Itace',        yor: 'Igi',           zul: 'Isihlahla',     ibo: 'Osisi',         en: 'Tree',         category: 'nature',    emoji: '🌳' },
  { fr: 'Animal',           swa: 'Mnyama',       wol: 'Mala',           bam: 'Bagan',       hau: 'Dabba',        yor: 'Ẹranko',        zul: 'Isilwane',      ibo: 'Anụmanụ',       en: 'Animal',       category: 'nature',    emoji: '🦁' },
  { fr: 'Mer',              swa: 'Bahari',       wol: 'Géej',           bam: 'Kɔgɔji',      hau: 'Teku',         yor: 'Òkun',          zul: 'Ulwandle',      ibo: 'Oké osimiri',   en: 'Sea',          category: 'nature',    emoji: '🌊' },
  { fr: 'Étoile',           swa: 'Nyota',        wol: 'Biddiw',         bam: 'Dolo',        hau: 'Tauraro',      yor: 'Ìràwọ̀',         zul: 'Inkanyezi',     ibo: 'Kpakpando',     en: 'Star',         category: 'nature',    emoji: '⭐' },
  { fr: 'Vent',             swa: 'Upepo',        wol: 'Ngelaw',         bam: 'Foɲɔn',       hau: 'Iska',         yor: 'Atẹgun',        zul: 'Umoya',         ibo: 'Ifufe',         en: 'Wind',         category: 'nature',    emoji: '💨' },

  // ─── TRAVAIL ──────────────────────────────────────────
  { fr: 'Travail',          swa: 'Kazi',         wol: 'Ligéey',         bam: 'Baara',       hau: 'Aiki',         yor: 'Iṣẹ',           zul: 'Umsebenzi',     ibo: 'Ọrụ',           en: 'Work',         category: 'work',      emoji: '💼' },
  { fr: 'Argent',           swa: 'Pesa',         wol: 'Xaalis',         bam: 'Wari',        hau: 'Kuɗi',         yor: 'Owó',           zul: 'Imali',         ibo: 'Ego',           en: 'Money',        category: 'work',      emoji: '💰' },
  { fr: 'École',            swa: 'Shule',        wol: 'Daara',          bam: 'Kalanso',     hau: 'Makaranta',    yor: 'Ile-iwe',       zul: 'Isikole',       ibo: 'Akwụkwọ',       en: 'School',       category: 'work',      emoji: '🏫' },
  { fr: 'Livre',            swa: 'Kitabu',       wol: 'Téere',          bam: 'Gafe',        hau: 'Littafi',      yor: 'Iwe',           zul: 'Incwadi',       ibo: 'Akwụkwọ',       en: 'Book',         category: 'work',      emoji: '📖' },
  { fr: 'Téléphone',        swa: 'Simu',         wol: 'Telefon',        bam: 'Telefɔni',    hau: 'Waya',         yor: 'Foonu',         zul: 'Ucingo',        ibo: 'Ekwentị',       en: 'Phone',        category: 'work',      emoji: '📱' },
  { fr: 'Médecin',          swa: 'Daktari',      wol: 'Doktoor',        bam: 'Dɔkɔtɔrɔ',    hau: 'Likita',       yor: 'Dokita',        zul: 'Udokotela',     ibo: 'Dọkịta',        en: 'Doctor',       category: 'work',      emoji: '👨‍⚕️' },

  // ─── TEMPS ────────────────────────────────────────────
  { fr: 'Aujourd\'hui',     swa: 'Leo',          wol: 'Tey',            bam: 'Bi',          hau: 'Yau',          yor: 'Loni',          zul: 'Namhlanje',     ibo: 'Taa',           en: 'Today',        category: 'time',      emoji: '📅' },
  { fr: 'Demain',           swa: 'Kesho',        wol: 'Suba',           bam: 'Sini',        hau: 'Gobe',         yor: 'Lọla',          zul: 'Kusasa',        ibo: 'Echi',          en: 'Tomorrow',     category: 'time',      emoji: '➡️' },
  { fr: 'Hier',             swa: 'Jana',         wol: 'Démb',           bam: 'Kunu',        hau: 'Jiya',         yor: 'Ana',           zul: 'Izolo',         ibo: 'Nnyaafụ',       en: 'Yesterday',    category: 'time',      emoji: '⬅️' },
  { fr: 'Maintenant',       swa: 'Sasa',         wol: 'Léegi',          bam: 'Sisan',       hau: 'Yanzu',        yor: 'Bayi',          zul: 'Manje',         ibo: 'Ugbu a',        en: 'Now',          category: 'time',      emoji: '⏱️' },
  { fr: 'Matin',            swa: 'Asubuhi',      wol: 'Suba',           bam: 'Sɔgɔma',      hau: 'Safiya',       yor: 'Owurọ',         zul: 'Ekuseni',       ibo: 'Ụtụtụ',         en: 'Morning',      category: 'time',      emoji: '🌅' },
  { fr: 'Soir',             swa: 'Jioni',        wol: 'Ngoon',          bam: 'Wula',        hau: 'Maraice',      yor: 'Aṣalẹ',         zul: 'Kusihlwa',      ibo: 'Mgbede',        en: 'Evening',      category: 'time',      emoji: '🌆' },

  // ─── ÉMOTIONS ─────────────────────────────────────────
  { fr: 'Heureux',          swa: 'Furaha',       wol: 'Béggal',         bam: 'Nisɔndiya',   hau: 'Farin ciki',   yor: 'Inu didun',     zul: 'Jabule',        ibo: 'Obi ụtọ',       en: 'Happy',        category: 'feelings',  emoji: '😊' },
  { fr: 'Triste',           swa: 'Huzuni',       wol: 'Naqar',          bam: 'Dusukasi',    hau: 'Baƙin ciki',   yor: 'Ibanuje',       zul: 'Lusizi',        ibo: 'Mwute',         en: 'Sad',          category: 'feelings',  emoji: '😢' },
  { fr: 'Amour',            swa: 'Upendo',       wol: 'Mbëggeel',       bam: 'Kanu',        hau: 'Ƙauna',        yor: 'Ifẹ',           zul: 'Uthando',       ibo: 'Ịhụnanya',      en: 'Love',         category: 'feelings',  emoji: '💖' },
  { fr: 'Peur',             swa: 'Hofu',         wol: 'Tiit',           bam: 'Siran',       hau: 'Tsoro',        yor: 'Iberu',         zul: 'Ukwesaba',      ibo: 'Egwu',          en: 'Fear',         category: 'feelings',  emoji: '😨' },
  { fr: 'Rire',             swa: 'Kicheko',     wol: 'Reet',            bam: 'Yele',        hau: 'Dariya',       yor: 'Ẹrin',          zul: 'Uhleko',        ibo: 'Ọchị',          en: 'Laughter',     category: 'feelings',  emoji: '😂' },
  { fr: 'Beau',             swa: 'Nzuri',        wol: 'Rafet',          bam: 'Ɲumanba',     hau: 'Kyakkyawa',    yor: 'Ẹlẹwà',         zul: 'Muhle',         ibo: 'Mara mma',      en: 'Beautiful',    category: 'feelings',  emoji: '✨' }
];

// Auto-id all entries (deterministic from fr) so favorites/recents stay stable
export const ENTRIES = RAW.map(e => ({ id: slug(e.fr), ...e }));

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

/** Get entry by id */
export function getEntry(id) {
  return ENTRIES.find(e => e.id === id);
}

/** Return up to N entries from the same category, excluding the one with `id` */
export function relatedEntries(id, limit = 5) {
  const e = getEntry(id);
  if (!e) return [];
  return ENTRIES.filter(x => x.category === e.category && x.id !== id).slice(0, limit);
}

/** How many entries per category (for category landing) */
export function countByCategory() {
  const map = {};
  ENTRIES.forEach(e => { map[e.category] = (map[e.category] || 0) + 1; });
  return map;
}
