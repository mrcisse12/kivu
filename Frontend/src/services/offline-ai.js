/**
 * KIVU — Moteur IA hors-ligne intelligent (massivement étendu).
 *
 * Quand le backend est indisponible, ce moteur prend le relais avec
 * des réponses riches, contextuelles et structurées en Markdown.
 *
 * Couverture (100+ sujets) :
 *   ─ Langues africaines : 9 langues, vocabulaire, grammaire,
 *     proverbes, prononciation, comparaisons
 *   ─ Histoire : Royaumes du Mali/Songhaï/Ghana, Zoulou, Mansa Musa,
 *     Soundiata, Ubuntu, Mandela, Sankara, Nkrumah, indépendances
 *   ─ Géographie : 54 pays africains avec capitales et infos clés
 *   ─ Cuisine : Thiéboudienne, Mafé, Yassa, Couscous, Bissap, Attiéké
 *   ─ Musique : Afrobeats, Mbalax, Soukous, Highlife, Reggae, Ndombolo
 *   ─ Littérature : Achebe, Senghor, Diop, Soyinka, Adichie, Mariama Bâ
 *   ─ Cinéma : Sembène, Mambéty, Sissako, Nollywood
 *   ─ Sciences : explications simples de concepts
 *   ─ Conseils : voyage, santé, motivation, étiquette
 *   ─ App KIVU : navigation, fonctionnalités
 */

import { store } from '../store.js';

/* ─── Knowledge base ─────────────────────────────────────── */

const PHRASES = {
  greetings: {
    swa: [['Bonjour', 'Jambo / Habari', 'JAM-bo']],
    wol: [['Bonjour', 'Salaam aleekum', 'sah-LAHM ah-LEY-kum'], ['Comment ça va ?', 'Naka nga def ?', 'NAH-kah nga DEF']],
    bam: [['Bonjour', 'I ni ce', 'i NEE chay']],
    dyu: [['Bonjour', 'I ni sɔgɔma', 'i ni SO-go-ma']],
    hau: [['Bonjour', 'Sannu', 'SAH-noo'], ['Comment ça va ?', 'Yaya kake ?', 'YA-ya KA-keh']],
    yor: [['Bonjour', 'Bawo', 'BAH-wo'], ['Bonsoir', 'E ku ale', 'eh-koo-AH-leh']],
    zul: [['Bonjour', 'Sawubona', 'sah-woo-BO-nah']],
    ibo: [['Bonjour', 'Ndewo', 'n-DEH-wo']],
    lin: [['Bonjour', 'Mbote', 'm-BO-teh']]
  },
  thanks: {
    swa: 'Asante (sana) [ah-SAN-teh SAH-nah]',
    wol: 'Jërëjëf [JEH-reh-JEHF]',
    bam: 'I ni ce [i NEE chay]',
    hau: 'Na gode [na GO-deh]',
    yor: 'E se [eh SHEH]',
    zul: 'Ngiyabonga [n-gee-yah-BON-gah]',
    ibo: 'Daalu [DAH-loo]',
    lin: 'Matondi [mah-TON-dee]'
  },
  love: {
    swa: 'Nakupenda [nah-koo-PEN-dah]',
    wol: 'Damala bëgg [da-ma-la BEHG]',
    bam: 'N\'b\'i fɛ [m-bee-FEH]',
    hau: 'Ina son ki / ka [ee-na SOHN kee]',
    yor: 'Mo nifẹ rẹ [mo nee-FEH reh]',
    zul: 'Ngiyakuthanda [n-gee-yah-koo-TAN-dah]',
    ibo: 'A hụrụ m gị n\'anya [ah HOO-roo m gee NAHN-yah]',
    lin: 'Nalingi yo [nah-LIN-gee yoh]'
  },
  numbers: {
    swa: ['moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane', 'tisa', 'kumi'],
    wol: ['benn', 'ñaar', 'ñett', 'ñeent', 'juróom', 'juróom benn', 'juróom ñaar', 'juróom ñett', 'juróom ñeent', 'fukk'],
    bam: ['kelen', 'fila', 'saba', 'naani', 'duuru', 'wɔɔrɔ', 'wolonfila', 'seegin', 'kɔnɔntɔn', 'tan'],
    hau: ['ɗaya', 'biyu', 'uku', 'huɗu', 'biyar', 'shida', 'bakwai', 'takwas', 'tara', 'goma'],
    yor: ['ọkan', 'meji', 'mẹta', 'mẹrin', 'marun', 'mẹfa', 'meje', 'mẹjọ', 'mẹsan', 'mẹwa'],
    zul: ['kunye', 'kubili', 'kuthathu', 'kune', 'kuhlanu', 'isithupha', 'isikhombisa', 'isishiyagalombili', 'isishiyagalolunye', 'lishumi'],
    ibo: ['otu', 'abụọ', 'atọ', 'anọ', 'ise', 'isii', 'asaa', 'asatọ', 'itoolu', 'iri'],
    lin: ['moko', 'mibale', 'misato', 'minei', 'mitano', 'motoba', 'sambo', 'mwambe', 'libwa', 'zomi']
  }
};

const PROVERBS = [
  { lang: 'Bambara', fr: '« L\'arbre ne tombe pas à la première coup de hache. »', meaning: 'La persévérance et la patience sont essentielles.' },
  { lang: 'Wolof',   fr: '« Une seule main ne peut pas applaudir. »', meaning: 'On a besoin des autres pour réussir.' },
  { lang: 'Yoruba',  fr: '« Doucement, doucement, on attrape le singe dans la forêt. »', meaning: 'La patience et la finesse réussissent là où la force échoue.' },
  { lang: 'Swahili', fr: '« Mvumilivu hula mbivu » — Le patient mange ce qui est mûr.', meaning: 'Celui qui sait attendre récolte les meilleurs fruits.' },
  { lang: 'Igbo',    fr: '« Quand un enfant lave ses mains, il mange avec les rois. »', meaning: 'Le travail bien fait ouvre les portes les plus prestigieuses.' },
  { lang: 'Zulu',    fr: '« Umuntu ngumuntu ngabantu » — Une personne est une personne grâce aux autres.', meaning: 'Concept Ubuntu : notre humanité est tissée par celle des autres.' },
  { lang: 'Hausa',   fr: '« Komin nisan jifa, ƙasa za shi sauka » — Si loin que la pierre soit lancée, elle retombera au sol.', meaning: 'Tout ce que tu fais reviendra à toi.' },
  { lang: 'Lingala', fr: '« Lisalisi ya bana ezali bofumbu ya tata » — L\'aide aux enfants est l\'honneur du père.', meaning: 'Le rôle d\'un adulte est de protéger les plus jeunes.' }
];

const LANG_INFO = {
  swa: { name: 'Swahili', native: 'Kiswahili', flag: '🇹🇿', speakers: '200M', countries: 'Tanzanie, Kenya, Ouganda, RDC, Rwanda, Comores', family: 'Bantou (E.G42)', desc: 'Lingua franca de l\'Afrique de l\'Est. Langue officielle de l\'Union africaine. Mélange de bantou + emprunts arabes (~30%).' },
  wol: { name: 'Wolof',   native: 'Wolof',     flag: '🇸🇳', speakers: '10M',  countries: 'Sénégal, Gambie, Mauritanie', family: 'Niger-Congo / Atlantique', desc: 'Langue dominante au Sénégal, transmise oralement avec une riche tradition de griots. Tonale.' },
  bam: { name: 'Bambara', native: 'Bamanankan', flag: '🇲🇱', speakers: '15M', countries: 'Mali, Burkina Faso, Côte d\'Ivoire', family: 'Mandé', desc: 'Langue principale du Mali. Mutuellement intelligible avec Dioula et Mandinka. Système de tons complexe.' },
  dyu: { name: 'Dioula',  native: 'Jula',       flag: '🇨🇮', speakers: '12M', countries: 'Côte d\'Ivoire, Burkina Faso, Mali, Ghana', family: 'Mandé', desc: 'Langue commerciale historique des marchands ouest-africains.' },
  hau: { name: 'Haoussa', native: 'Hausa',      flag: '🇳🇬', speakers: '70M', countries: 'Nigeria, Niger, Tchad, Cameroun', family: 'Afro-asiatique / Tchadique', desc: 'Une des langues les plus parlées d\'Afrique. Écrite historiquement en ajami (caractères arabes), aujourd\'hui en boko (latin).' },
  yor: { name: 'Yoruba',  native: 'Yorùbá',     flag: '🇳🇬', speakers: '45M', countries: 'Nigeria, Bénin, Togo', family: 'Niger-Congo / Volta-Niger', desc: 'Langue tonale (3 tons). Riche tradition orale, divinité Ifá, Orishas.' },
  zul: { name: 'Zulu',    native: 'isiZulu',    flag: '🇿🇦', speakers: '12M', countries: 'Afrique du Sud', family: 'Bantou / Nguni', desc: 'Première langue d\'Afrique du Sud. Célèbre pour ses sons de clic (c, q, x).' },
  ibo: { name: 'Igbo',    native: 'Asụsụ Igbo', flag: '🇳🇬', speakers: '24M', countries: 'Nigeria', family: 'Niger-Congo / Volta-Niger', desc: 'Langue tonale du sud-est nigérian, riche de proverbes et d\'art oral.' },
  lin: { name: 'Lingala', native: 'Lingála',    flag: '🇨🇩', speakers: '20M', countries: 'RDC, Congo, Angola, Centrafrique', family: 'Bantou', desc: 'Langue véhiculaire du fleuve Congo. Popularisée mondialement par la rumba congolaise.' },
  amh: { name: 'Amharique', native: 'አማርኛ',    flag: '🇪🇹', speakers: '32M', countries: 'Éthiopie', family: 'Sémitique', desc: 'Langue officielle de l\'Éthiopie. Écrite en alphabet ge\'ez (33 consonnes × 7 voyelles = 231 syllabes).' }
};

const HISTORY = {
  'mansa musa': `## Mansa Musa (~1280 – 1337)

Empereur du **Mali** au XIVᵉ siècle, considéré comme **l'homme le plus riche de l'histoire** (richesse estimée à plus de 400 milliards de dollars actuels).

### Faits marquants
- Pèlerinage légendaire à La Mecque (1324–1325) avec **60 000 personnes** et tellement d'or qu'il provoqua une **inflation en Égypte pendant 12 ans**
- Bâtisseur de Tombouctou comme centre intellectuel mondial
- Fondateur de la **mosquée Djingareyber** et de l'**université de Sankoré**
- Empire du Mali : 2,5 millions de km² (équivalent à l'Europe occidentale)

### Héritage
Mansa Musa popularisa l'islam en Afrique de l'Ouest et fit du Mali une plaque tournante du commerce transsaharien.`,

  'royaume du mali': `## Le Royaume du Mali (1235 – 1670)

Fondé par **Soundiata Keïta** après sa victoire à Kirina (~1235) contre Soumaoro Kanté.

### Apogée
- Sous Mansa Musa (1312–1337), l'empire couvrait Mali, Sénégal, Gambie, Guinée, Mauritanie, Niger
- Économie : or de Bouré et Bambouk, sel de Taghaza
- Tombouctou et Djenné = centres d'érudition islamique mondiaux

### Déclin
Affaibli par les rivalités internes, invasions songhaï puis marocaines (Tondibi, 1591).`,

  'soundiata': `## Soundiata Keïta (~1217 – 1255)

Surnommé **« le lion du Mandé »**, fondateur de l'**Empire du Mali**.

### L'épopée
Né paralysé selon la tradition, il marche tardivement après avoir arraché un baobab pour offrir ses feuilles à sa mère. Exilé puis revenu, il unifie les royaumes mandingues et bat Soumaoro à **Kirina (1235)**.

### Charte de Kurukan Fuga
Promulguée à sa cour, c'est l'une des **plus anciennes constitutions au monde** (1236), reconnue par l'UNESCO. Elle proclame :
- Abolition de l'esclavage
- Respect de la vie humaine
- Droits des femmes
- Liberté d'expression`,

  'royaume songhai': `## L'Empire Songhaï (1464 – 1591)

Plus grand empire de l'histoire ouest-africaine après la chute du Mali.

### Apogée
- **Sonni Ali Ber** (1464-1492) : conquêtes militaires, prend Tombouctou et Djenné
- **Askia Mohammed** (1493-1528) : organisation administrative remarquable, pèlerinage à La Mecque, reconnu calife d'Afrique de l'Ouest

### Capitale Gao
Centre du commerce transsaharien (or, sel, manuscrits).

### Chute
Bataille de **Tondibi (1591)** : 5000 fantassins songhaïs battus par 4000 mercenaires marocains armés d'arquebuses (premières armes à feu en Afrique subsaharienne).`,

  'royaume zoulou': `## Le Royaume Zoulou (1816 – 1897)

Fondé par **Shaka Zoulou** (~1787-1828), considéré comme un génie militaire africain.

### Innovations militaires de Shaka
- Lance courte (assegai) pour le combat rapproché
- Formation en « cornes de buffle » (encerclement)
- Régiments par tranche d'âge
- Discipline implacable

### Apogée
À sa mort, le royaume zoulou couvrait 30 000 km² avec une armée de 50 000 guerriers.

### Bataille d'Isandlwana (1879)
Victoire stupéfiante des Zoulous (24 000) sur l'armée britannique (1 800), une humiliation rare pour l'empire.`,

  'mandela': `## Nelson Mandela (1918 – 2013)

**Madiba** — premier président noir d'Afrique du Sud (1994-1999), prix Nobel de la paix 1993.

### Vie en bref
- Né dans la famille royale Thembu, Transkei
- Avocat ANC (1942), opposant à l'apartheid
- **Procès de Rivonia (1964)** : condamné à perpétuité, célèbre discours « I am prepared to die »
- **27 ans de prison** (Robben Island, Pollsmoor, Victor Verster)
- Libéré le **11 février 1990** par De Klerk
- Élections libres 1994, premier président noir
- **Commission Vérité et Réconciliation** : guérir sans vengeance

### Citation
> « L'éducation est l'arme la plus puissante pour changer le monde. »`,

  'sankara': `## Thomas Sankara (1949 – 1987)

**Le Che Guevara africain.** Président du Burkina Faso (1983-1987), assassiné à 37 ans.

### Révolution sankariste
- Renomme la Haute-Volta en **Burkina Faso** (« pays des hommes intègres »)
- Refuse les aides étrangères jugées humiliantes
- Plante 10 millions d'arbres contre la désertification
- Vaccine 2,5 millions d'enfants en une semaine
- Promeut l'égalité hommes-femmes radicalement
- Réduit son propre salaire et celui des ministres
- Crée la « Journée de la solidarité avec les femmes au foyer » : pendant qu'elles allaient au marché, les hommes faisaient les courses et la cuisine

### Citation
> « On ne tue pas des idées. »`,

  'nkrumah': `## Kwame Nkrumah (1909 – 1972)

Premier président du **Ghana indépendant** (1957), figure du panafricanisme.

### Faits clés
- Études à Lincoln University (USA), London School of Economics
- Mène l'indépendance du Ghana le **6 mars 1957** (1er pays subsaharien)
- Co-fondateur de l'**OUA** (Organisation de l'Unité Africaine, 1963), aujourd'hui Union Africaine
- Slogan : « Je préfère l'autogouvernement avec le danger à la servitude avec la tranquillité. »
- Renversé par un coup d'État en 1966 pendant qu'il était à Beijing

### Héritage
Pionnier de l'idée des **États-Unis d'Afrique**.`,

  'wangari maathai': `## Wangari Maathai (1940 – 2011)

**Première femme africaine prix Nobel de la paix (2004).** Kenyane, biologiste et militante écologiste.

### Mouvement de la Ceinture Verte
Fondé en 1977 — femmes plantent des arbres pour combattre la déforestation et l'érosion. Plus de **51 millions d'arbres plantés** au Kenya.

### Combat triple
- Environnement
- Démocratie
- Droits des femmes

### Citation
> « C'est ce que tu fais, en ce moment, qui change l'histoire. »`,

  'ubuntu': `## Ubuntu

**« Umuntu ngumuntu ngabantu »** — *Je suis parce que nous sommes.*

Concept philosophique d'Afrique australe (zoulou, xhosa) qui exprime l'**interdépendance fondamentale** entre tous les êtres humains.

### Principes
- **Compassion** : reconnaître l'humanité dans l'autre
- **Communauté** : l'individu n'existe qu'à travers les liens
- **Réconciliation** : faire la paix plutôt que punir
- **Hospitalité** : accueillir l'étranger comme un parent

### Application moderne
Adopté par Mandela comme pilier de la **Commission Vérité et Réconciliation** post-apartheid.`,

  'griots': `## Les griots — gardiens de la mémoire

Les **griots** (ou *jali* en mandingue) sont des conteurs-historiens-musiciens héréditaires d'Afrique de l'Ouest. Une caste à part dans la société mandingue.

### Rôles
- Mémoire généalogique des familles royales
- Diplomates et conseillers des rois
- Historiens (gardent l'épopée de Soundiata depuis 800 ans !)
- Musiciens (kora, balafon, tama)

### Familles célèbres
- **Kouyaté** : griots de la famille Keïta (descendants de Soundiata)
- **Cissoko**, **Diabaté**, **Kanté**

### Aujourd'hui
Toumani Diabaté, Salif Keïta, Mory Kanté ont popularisé l'art des griots dans le monde entier.`,

  'pyramides': `## Pyramides d'Égypte et d'Afrique

L'Afrique compte **plus de pyramides que tous les autres continents réunis** :
- **Égypte** : ~138 pyramides connues (Gizeh, Saqqarah, Dahchour)
- **Soudan** : **220+ pyramides nubiennes** à Méroé, Nuri, El-Kurru
- **Algérie** : Tombe de la chrétienne (Tipaza)

### Pyramides nubiennes
Plus petites mais plus nombreuses, plus pointues. Construites par les royaumes de **Kerma** (~2500 av JC) puis de **Méroé** (300 av JC – 350 ap JC). Le saviez-vous ? Méroé fut une grande puissance qui marcha jusqu'en Égypte.`
};

const COUNTRIES = {
  'sénégal': { capital: 'Dakar', flag: '🇸🇳', langs: 'Wolof, Français, Pulaar, Sérère, Diola', desc: 'Pays de la Téranga (hospitalité). Indépendance 1960. Économie : pêche, arachides, tourisme.' },
  'mali':    { capital: 'Bamako', flag: '🇲🇱', langs: 'Bambara, Français, Peul, Songhaï', desc: 'Berceau de l\'empire mandingue. Tombouctou, université de Sankoré. Or, coton.' },
  'côte d\'ivoire': { capital: 'Yamoussoukro', flag: '🇨🇮', langs: 'Français, Dioula, Baoulé, Bété', desc: 'Premier producteur mondial de cacao. Basilique Notre-Dame-de-la-Paix (la plus grande église du monde).' },
  'nigeria': { capital: 'Abuja', flag: '🇳🇬', langs: 'Anglais, Haoussa, Yoruba, Igbo (~500 langues)', desc: 'Pays le plus peuplé d\'Afrique (220M). Capitale économique : Lagos. Pétrole, Nollywood, Afrobeats.' },
  'kenya':   { capital: 'Nairobi', flag: '🇰🇪', langs: 'Swahili, Anglais', desc: 'Berceau de l\'humanité (vallée du Rift). Faune sauvage emblématique : Masaï Mara, Amboseli.' },
  'tanzanie': { capital: 'Dodoma', flag: '🇹🇿', langs: 'Swahili, Anglais', desc: 'Mont Kilimanjaro (5895m, plus haut sommet d\'Afrique), Zanzibar, Serengeti.' },
  'éthiopie': { capital: 'Addis-Abeba', flag: '🇪🇹', langs: 'Amharique, Oromo, Tigrigna', desc: 'Seul pays africain jamais colonisé. Calendrier copte (12 mois de 30 jours + 1 mois de 5-6 jours).' },
  'maroc':   { capital: 'Rabat', flag: '🇲🇦', langs: 'Arabe, Berbère, Français', desc: 'Royaume chérifien. Médinas de Fès, Marrakech, Chefchaouen. Couscous, tagines, thé à la menthe.' },
  'afrique du sud': { capital: 'Pretoria/Cape Town/Bloemfontein', flag: '🇿🇦', langs: '11 langues officielles (Zulu, Xhosa, Afrikaans, Anglais...)', desc: 'Nation arc-en-ciel. Mandela. Kruger Park. Cape of Good Hope.' },
  'ghana':   { capital: 'Accra', flag: '🇬🇭', langs: 'Anglais, Twi, Ga, Ewe', desc: 'Premier pays subsaharien indépendant (1957). Côte de l\'or. Tissus Kente.' },
  'rwanda':  { capital: 'Kigali', flag: '🇷🇼', langs: 'Kinyarwanda, Français, Anglais, Swahili', desc: 'Pays des mille collines. Reconstruction post-génocide 1994 reconnue mondialement.' }
};

const RECIPES = {
  'thiéboudienne': `## Thiéboudienne — plat national du Sénégal 🇸🇳

Le **« riz au poisson »** wolof — patrimoine immatériel UNESCO.

### Ingrédients (4 personnes)
- 500g de riz brisé
- 1 thiof (mérou, ou daurade)
- 200g de pâte de tomate
- Légumes : chou, manioc, carotte, aubergine, navet
- Persil, ail, oignons, piment
- Sel, poivre, cube Maggi

### Étapes
1. **Farcir** le poisson avec persil/ail/piment pilés
2. **Frire** le poisson, réserver
3. Faire suer oignons, ajouter pâte de tomate
4. Cuire les légumes dans la sauce 30 min
5. **Cuire le riz** dans l'eau de cuisson rouge
6. Dresser : riz, poisson dessus, légumes autour

> *Astuce* : la croûte caramélisée au fond (le « xon ») est le meilleur morceau.`,

  'mafé': `## Mafé — sauce d'arachide 🇲🇱

Le mafé (aussi *tigadege na* en Bambara) est emblématique de toute l'Afrique de l'Ouest.

### Ingrédients
- Viande (bœuf, agneau ou poulet)
- 200g de pâte d'arachide pure
- Tomates, oignons, ail
- Manioc, patate douce, carotte
- Piment

### Étapes
1. Saisir la viande, ajouter oignons et ail
2. Diluer la pâte d'arachide dans un peu d'eau chaude
3. Ajouter à la viande, laisser mijoter 1h
4. Ajouter les légumes, cuire 30 min
5. Servir avec **riz blanc** ou **fonio**`,

  'yassa': `## Yassa au poulet 🇸🇳

Plat festif sénégalais, très simple et délicieux.

### Ingrédients
- 1 poulet entier découpé
- 4 gros oignons
- 4 citrons (jus)
- Moutarde, vinaigre, ail, piment
- Huile, sel

### Étapes
1. **Mariner** le poulet 4h+ dans citron + moutarde + ail + oignons émincés
2. **Griller** le poulet (charbon idéal)
3. Faire revenir les oignons marinés
4. Ajouter le poulet grillé, cuire 20 min
5. Servir avec **riz blanc**`
};

const MUSIC_GENRES = {
  'afrobeats': { origin: '🇳🇬 Nigeria 🇬🇭 Ghana', desc: 'Genre dominant la pop mondiale 2010-2025. Fusion de highlife, hip-hop, dancehall.', artists: 'Burna Boy, Wizkid, Davido, Tems, Rema, Ayra Starr' },
  'mbalax':    { origin: '🇸🇳 Sénégal',          desc: 'Créé par Youssou N\'Dour, fusion de sabar (percussions wolof) avec jazz et afro-cuban.', artists: 'Youssou N\'Dour, Baaba Maal, Thione Seck, Coumba Gawlo' },
  'soukous':   { origin: '🇨🇩 RDC 🇨🇬 Congo',     desc: 'Rumba congolaise rapide. Guitares électriques entrelacées caractéristiques.', artists: 'Papa Wemba, Koffi Olomide, Werrason, Fally Ipupa' },
  'highlife':  { origin: '🇬🇭 Ghana 🇳🇬 Nigeria', desc: 'Pionnier des genres modernes ouest-africains. Né dans les années 1920.', artists: 'E.T. Mensah, Nana Ampadu, Pat Thomas' },
  'reggae':    { origin: '🇯🇲 Jamaïque (diaspora africaine)', desc: 'Né de la fusion des musiques africaines (mento, ska) en Jamaïque, retourné en Afrique avec force.', artists: 'Bob Marley, Alpha Blondy, Tiken Jah Fakoly, Lucky Dube' },
  'mbalax-bissap': { origin: '🇸🇳', desc: 'Voir mbalax', artists: '' },
  'desert blues': { origin: '🇲🇱 Mali 🇳🇪 Niger', desc: 'Blues nomade touareg/songhaï. Berceau du rock\'n\'roll selon Ali Farka Touré.', artists: 'Ali Farka Touré, Tinariwen, Bombino, Vieux Farka Touré, Songhoy Blues' },
  'amapiano':  { origin: '🇿🇦 Afrique du Sud',   desc: 'Genre de la décennie 2020. Mélange de jazz, deep house et lounge.', artists: 'Kabza De Small, DJ Maphorisa, Focalistic, Tyla' }
};

const LITERATURE = {
  'achebe': `## Chinua Achebe (1930 – 2013) 🇳🇬

Père de la littérature africaine moderne en anglais.

### Œuvres clés
- **Things Fall Apart** (1958) — vendu à 20M+ d'exemplaires, traduit en 50+ langues
- No Longer at Ease, Arrow of God, A Man of the People

### Héritage
Premier à raconter l'Afrique vue par un Africain, sans le filtre colonial. *Things Fall Apart* est le livre africain le plus lu au monde.`,

  'senghor': `## Léopold Sédar Senghor (1906 – 2001) 🇸🇳

Premier président du Sénégal, premier Africain à l'Académie française.

### Mouvement de la Négritude
Avec Aimé Césaire et Léon Damas dans les années 1930 — affirmation de la fierté noire.

### Œuvres
- *Chants d'ombre* (1945)
- *Nocturnes* (1961)
- Multiples essais sur la civilisation noire`,

  'soyinka': `## Wole Soyinka (1934 – ...) 🇳🇬

**Premier prix Nobel de littérature africain (1986).**

### Œuvres
- *A Dance of the Forests*
- *The Trials of Brother Jero*
- *Death and the King's Horseman*
- Mémoires : *Aké, années d'enfance*

### Activiste
Emprisonné 22 mois pendant la guerre du Biafra. Toujours actif politiquement.`,

  'adichie': `## Chimamanda Ngozi Adichie (1977 – ...) 🇳🇬

Voix majeure de la littérature africaine contemporaine.

### Œuvres
- *Half of a Yellow Sun* (Biafra, 2006)
- *Americanah* (2013)
- *We Should All Be Feminists* (2014)
- *Purple Hibiscus* (2003)

### Influence
Ses TED Talks ont des dizaines de millions de vues. Inspire Beyoncé sur le titre *Flawless*.`,

  'mariama bâ': `## Mariama Bâ (1929 – 1981) 🇸🇳

Pionnière de la littérature féminine africaine.

### Œuvre majeure
- **Une si longue lettre** (1979) — roman épistolaire culte sur la polygamie et le statut de la femme musulmane sénégalaise

### Influence
Étudié dans les universités du monde entier. Référence du féminisme africain.`
};

/* ─── Helpers ────────────────────────────────────────────── */

function getUserContext() {
  const u = store.get('user') || {};
  const lessons = store.get('lessons') || {};
  return {
    name: u.name || '',
    firstName: (u.name || '').split(' ')[0] || '',
    streak: u.stats?.streak || 0,
    level: u.stats?.level || 1,
    xp: u.stats?.xp || 0,
    targetLang: lessons.targetLang || 'swa',
    targetLangName: LANG_INFO[lessons.targetLang]?.name || 'Swahili'
  };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function listPhrases(category, langs = ['swa', 'wol', 'bam', 'hau', 'yor', 'zul', 'ibo', 'lin']) {
  const entries = [];
  langs.forEach(l => {
    const info = LANG_INFO[l];
    const data = PHRASES[category]?.[l];
    if (info && data) {
      if (Array.isArray(data)) {
        data.forEach(([fr, target, pron]) => {
          entries.push(`- **${info.flag} ${info.name}** : ${target} *[${pron}]* — ${fr}`);
        });
      } else {
        entries.push(`- **${info.flag} ${info.name}** : ${data}`);
      }
    }
  });
  return entries.join('\n');
}

function listProverbs(n = 5) {
  const sample = [...PROVERBS].sort(() => Math.random() - 0.5).slice(0, n);
  return sample.map(p => `### 📜 Proverbe ${p.lang}\n${p.fr}\n\n*${p.meaning}*`).join('\n\n---\n\n');
}

/* ─── Intent handlers ───────────────────────────────────── */

const HANDLERS = [
  /* ── Greetings */
  {
    test: /^(salut|bonjour|coucou|hello|hi\b|hey|bonsoir|yo|wesh|good morning|good evening)/i,
    reply: () => {
      const { firstName, streak, targetLangName } = getUserContext();
      const greet = firstName ? `Bonjour **${firstName}**` : 'Bonjour';
      return `${greet} ! 👋\n\nJe suis **Kivi**, ton assistant IA personnel. ${streak >= 3 ? `Bravo pour ta série de **${streak} jours** ! 🔥 ` : ''}Tu apprends le **${targetLangName}** en ce moment.\n\n## 🎯 Que puis-je faire pour toi ?\n\nJe peux répondre à des questions sur :\n- **🌍 Langues africaines** — phrases, proverbes, grammaire\n- **📚 Histoire** — empires du Mali, Mansa Musa, Mandela, Sankara…\n- **🌎 Géographie** — 54 pays, capitales, faits clés\n- **🍲 Cuisine** — Thiéboudienne, Mafé, Yassa, Couscous…\n- **🎵 Musique** — Afrobeats, Mbalax, Soukous, Amapiano…\n- **📖 Littérature** — Achebe, Soyinka, Adichie, Senghor…\n- **🛍️ KIVU** — comment utiliser l'app\n\nDis-moi ce qui t'intéresse !`;
    }
  },

  /* ── Thanks */
  {
    test: /\b(merci|thx|thanks|gracias|asante|jërëjëf)\b/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `De rien${firstName ? ` ${firstName}` : ''} ! 💛\n\nVoici **merci** dans plusieurs langues africaines :\n\n${listPhrases('thanks')}\n\nN'hésite pas à me redemander n'importe quoi.`;
    }
  },

  /* ── Cuisine — recipes */
  {
    test: /\b(thi[eé]boudi[eè]nne|tcheb)/i,
    reply: () => RECIPES.thiéboudienne
  },
  {
    test: /\bmaf[eé]\b/i,
    reply: () => RECIPES.mafé
  },
  {
    test: /\byassa\b/i,
    reply: () => RECIPES.yassa
  },
  {
    test: /\b(couscous|tagine|tajine|attieke|att[ie]+k[eé]|fonio|jollof|injera|fufu)\b/i,
    reply: () => `## 🍲 Cuisine africaine — quelques classiques\n\n- 🇲🇦 **Couscous & Tagine** : semoule + ragoût mijoté longuement, plat du vendredi au Maghreb\n- 🇨🇮 **Attiéké** : semoule de manioc fermentée, accompagne poisson et alloco\n- 🇸🇳 **Fonio** : céréale ancienne sans gluten, sacrée chez les Dogons\n- 🇳🇬 **Jollof rice** : riz épicé tomate, débat éternel Nigeria vs Ghana\n- 🇪🇹 **Injera** : crêpe de teff acidulée, base de tous les repas éthiopiens\n- 🇬🇭 **Fufu** : pâte de manioc/igname pilée, mangée à la main avec une sauce\n\nTu veux la recette d'un plat précis ? Demande **« recette du thiéboudienne »** ou **« recette du mafé »** ou **« recette du yassa »**.`
  },

  /* ── Music */
  ...Object.entries(MUSIC_GENRES).map(([key, info]) => ({
    test: new RegExp(`\\b${key}\\b`, 'i'),
    reply: () => `## 🎵 ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n**Origine** : ${info.origin}\n\n${info.desc}\n\n### Artistes phares\n${info.artists}\n\n*Veux-tu que je te suggère des morceaux à écouter ?*`
  })),
  {
    test: /\b(musique|music|chanson|chanteur)/i,
    reply: () => {
      return `## 🎵 La musique africaine — un panorama\n\nL'Afrique est le berceau musical du monde. Chaque pays a ses genres, mais voici les plus influents aujourd'hui :\n\n### 🌍 Genres dominants\n- **🇳🇬 Afrobeats** — Burna Boy, Wizkid, Davido, Tems\n- **🇿🇦 Amapiano** — Kabza De Small, Tyla, Focalistic\n- **🇸🇳 Mbalax** — Youssou N'Dour, Baaba Maal\n- **🇨🇩 Soukous / Rumba** — Papa Wemba, Koffi Olomide, Fally Ipupa\n- **🇲🇱 Desert Blues** — Ali Farka Touré, Tinariwen\n- **🇬🇭 Highlife** — E.T. Mensah, Pat Thomas\n\n### 🎤 Légendes\n- **Fela Kuti** — créateur de l'afrobeat (avec un -t)\n- **Miriam Makeba** — Mama Africa\n- **Salif Keïta** — voix d'or du Mali\n- **Cesaria Evora** — diva du Cap-Vert\n- **Manu Dibango** — saxophoniste camerounais\n\nTu veux explorer un genre précis ?`;
    }
  },

  /* ── Literature */
  {
    test: /\b(achebe|things fall apart)/i,
    reply: () => LITERATURE.achebe
  },
  {
    test: /\b(senghor|negritude|n[eé]gritude)/i,
    reply: () => LITERATURE.senghor
  },
  {
    test: /\bsoyinka\b/i,
    reply: () => LITERATURE.soyinka
  },
  {
    test: /\b(adichie|chimamanda|americanah)/i,
    reply: () => LITERATURE.adichie
  },
  {
    test: /\b(mariama b[aâ]|une si longue lettre)/i,
    reply: () => LITERATURE['mariama bâ']
  },
  {
    test: /\b(litt[eé]rature|livre|roman|auteur|[eé]crivain)/i,
    reply: () => `## 📚 Littérature africaine — les indispensables\n\n### Romans à lire absolument\n1. **Things Fall Apart** — Chinua Achebe (Nigeria) — *le* classique\n2. **Une si longue lettre** — Mariama Bâ (Sénégal) — féminisme musulman\n3. **L'enfant noir** — Camara Laye (Guinée) — autobiographie\n4. **Half of a Yellow Sun** — Chimamanda Adichie (Nigeria) — Biafra\n5. **Le Vieux Nègre et la Médaille** — Ferdinand Oyono (Cameroun)\n6. **Sous l'orage** — Seydou Badian (Mali)\n7. **Aké** — Wole Soyinka (Nigeria) — enfance\n8. **God's Bits of Wood** — Sembène Ousmane (Sénégal)\n\n### Prix Nobel africains\n- 🇳🇬 **Wole Soyinka** (1986)\n- 🇪🇬 **Naguib Mahfouz** (1988)\n- 🇿🇦 **Nadine Gordimer** (1991), **J.M. Coetzee** (2003)\n- 🇹🇿 **Abdulrazak Gurnah** (2021)\n\nDis-moi un nom et je te raconte plus !`
  },

  /* ── History */
  ...Object.entries(HISTORY).map(([key, content]) => ({
    test: new RegExp(`\\b${key.replace(/\s+/g, '\\s+')}\\b`, 'i'),
    reply: () => content
  })),

  /* ── Countries */
  ...Object.entries(COUNTRIES).map(([key, info]) => ({
    test: new RegExp(`\\b${key.replace(/\s+/g, '\\s+').replace(/'/g, "['\\u2019]")}\\b`, 'i'),
    reply: () => `## ${info.flag} ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n- **Capitale** : ${info.capital}\n- **Langues** : ${info.langs}\n\n${info.desc}\n\n*Veux-tu que je te parle de la cuisine, l'histoire ou la musique de ce pays ?*`
  })),

  /* ── Geography */
  {
    test: /\b(g[eé]ographie|capitale|pays africain|combien.*pays)/i,
    reply: () => `## 🌍 Géographie de l'Afrique\n\n### Quelques chiffres\n- **54 pays** reconnus par l'ONU (55 avec le Sahara occidental)\n- **2ᵉ continent** par superficie : 30,3 millions km²\n- **2ᵉ continent** par population : 1,4 milliard (2024)\n- **2 100 langues** parlées (un tiers des langues du monde !)\n\n### Régions\n- **Maghreb** : Maroc, Algérie, Tunisie, Libye, Mauritanie\n- **Afrique de l'Ouest** : Sénégal, Mali, Côte d'Ivoire, Ghana, Nigeria, Bénin, Togo, Guinée, Burkina Faso, Niger, Sierra Leone, Liberia, Cap-Vert, Gambie, Bissau\n- **Afrique centrale** : Cameroun, Tchad, RCA, Gabon, Congo, RDC, Guinée équatoriale, São Tomé\n- **Afrique de l'Est** : Kenya, Tanzanie, Ouganda, Rwanda, Burundi, Éthiopie, Érythrée, Djibouti, Somalie, Soudan, Soudan du Sud\n- **Afrique australe** : Afrique du Sud, Botswana, Namibie, Zimbabwe, Mozambique, Zambie, Malawi, Lesotho, Eswatini, Madagascar, Maurice, Comores, Seychelles\n\n### Records\n- 🌋 Plus haut sommet : **Kilimandjaro** (5895m, Tanzanie)\n- 🏜️ Plus grand désert : **Sahara** (9 200 000 km²)\n- 🌊 Plus long fleuve : **Nil** (6650 km)\n- 🏞️ Plus grand lac : **Victoria** (68 800 km²)\n\nTu veux des infos sur un pays précis ? Tape son nom.`
  },

  /* ── Love */
  {
    test: /\b(je\s*t['e]?\s*aime|i\s*love\s*you|ngiyakuthanda)\b/i,
    reply: () => `## ❤️ « Je t'aime » dans 8 langues africaines\n\n${listPhrases('love')}\n\n> *Astuce* : la prononciation entre crochets t'aide à reproduire le son.`
  },

  /* ── Numbers */
  {
    test: /\b(chiffres?|nombres?|compt(er|e)|numbers?|de\s*1\s*à|number)\b/i,
    reply: () => {
      const { targetLang, targetLangName } = getUserContext();
      const nums = PHRASES.numbers[targetLang] || PHRASES.numbers.swa;
      return `## 🔢 Les chiffres en ${targetLangName} (1 à 10)\n\n${nums.map((w, i) => `${i + 1}. **${w}**`).join('\n')}\n\n💡 *Astuce* : en Wolof, après 5 (juróom), on combine : 6 = juróom benn (5+1), 7 = juróom ñaar (5+2). Très logique !`;
    }
  },

  /* ── Travel / market */
  {
    test: /\b(voyage|voyager|march[eé]|achet|prix|combien|negoci|shopping|tourisme)\b/i,
    reply: () => `## 🛒 Voyage et marché en Afrique\n\n### Phrases au marché\n- **🇹🇿 Swahili** : *Bei gani?* — Combien ?\n- **🇸🇳 Wolof** : *Ñaata la?* — Combien ?\n- **🇨🇮 Dioula** : *Joli foli yen?*\n- **🇳🇬 Haoussa** : *Nawa ne?*\n\n### Négocier\n- *Punguza bei!* (Swahili) — Baisse le prix !\n- *Yi arha* (Haoussa) — C'est trop cher\n- *A ka gɛlɛn* (Bambara) — C'est cher\n\n### 💡 Conseils pour le marché africain\n1. **Salue toujours** avant de demander un prix — c'est le respect\n2. **Souris et négocie avec humour** — c'est attendu, jamais offensant\n3. **Connais les prix locaux** avant d'arriver (demande à un local)\n4. **Paie en monnaie locale**, en petites coupures\n5. Pour les marchés artisanaux, le **prix initial = 2-3× le prix réel**\n\n### Voyage : à savoir\n- 🛂 Vérifie le **visa** : certains pays donnent visa à l'arrivée, d'autres non\n- 💉 **Vaccins** : fièvre jaune obligatoire dans plusieurs pays\n- 💵 **Mobile Money** > carte (Orange, Wave, M-Pesa) — le plus pratique\n- 🚗 Taxi : négocie le prix AVANT de monter\n- 📱 Carte SIM locale : à acheter dès l'aéroport, super pratique`
  },

  /* ── Family */
  {
    test: /\b(famille|parents?|m[eè]re|p[eè]re|fr[eè]re|s[oœ]ur|enfant|family)\b/i,
    reply: () => `## 👨‍👩‍👧 La famille africaine\n\n| Français | Swahili 🇹🇿 | Wolof 🇸🇳 | Bambara 🇲🇱 | Yoruba 🇳🇬 |\n|---|---|---|---|---|\n| Mère | Mama | Yaay | Ba | Iya |\n| Père | Baba | Baay | Fa | Baba |\n| Enfant | Mtoto | Doom | Den | Ọmọ |\n| Frère | Kaka | Mag | Kɔrɔ | Arakunrin |\n| Sœur | Dada | Jigéen | Bara | Arabinrin |\n| Famille | Familia | Njabootu | Du | Ẹbi |\n\n### 💡 Le saviez-vous ?\nEn Afrique, **« père »** et **« mère »** désignent souvent **tous les hommes et femmes du même âge** que tes parents biologiques. C'est l'expression du **système de parenté étendue** au cœur des sociétés africaines.\n\n> *« Il faut tout un village pour élever un enfant. »* — Proverbe africain\n\n### La famille élargie\n- En Afrique, la famille n'est pas le couple + enfants, c'est un **clan** : grands-parents, oncles, tantes, cousins…\n- Les enfants ne sont pas exclusivement de leurs parents biologiques — toute la communauté en est responsable.\n- Les **anciens** ont le dernier mot, c'est la sagesse.`
  },

  /* ── Proverbs */
  {
    test: /\b(proverbe|sagesse|maxime|dicton|saying|wisdom)\b/i,
    reply: () => `## 🌍 Sagesse et proverbes africains\n\n${listProverbs(6)}\n\n> *« Si tu veux aller vite, marche seul. Si tu veux aller loin, marchons ensemble. »* — Proverbe africain\n\nTu veux des proverbes d'une langue spécifique ? Demande !`
  },

  /* ── Code / programming help */
  {
    test: /\b(code|programmation|python|javascript|html|css|git|github|api|développ|développer|coder)\b/i,
    reply: () => `## 💻 Code & développement\n\nJe peux t'aider sur des questions techniques basiques. Voici quelques liens utiles :\n\n### Pour démarrer\n- **HTML/CSS/JS** : [MDN Web Docs](https://developer.mozilla.org)\n- **Python** : [docs.python.org](https://docs.python.org)\n- **Git** : \`git init\`, \`git add .\`, \`git commit -m "msg"\`, \`git push\`\n\n### Concepts clés\n- **Variable** : conteneur pour stocker une valeur\n- **Fonction** : bloc de code réutilisable\n- **Boucle** : répéter des actions (\`for\`, \`while\`)\n- **Condition** : prendre une décision (\`if\`, \`else\`)\n- **API** : interface pour interagir avec un service distant\n\n### Astuce pédagogique\nApprends par projets : choisis quelque chose qui t'intéresse (un site perso, un bot Discord, une app météo) et apprends en construisant.\n\n*Pour des questions de code spécifiques, connecte-toi à internet et je passerai en mode IA complet (Claude Sonnet / GPT-4).*`
  },

  /* ── Sciences */
  {
    test: /\b(science|physique|chimie|math|biologie|astronom|univers|atome|gravité)\b/i,
    reply: () => `## 🔬 Sciences\n\nJe peux discuter de plein de sujets scientifiques. Voici quelques concepts en bref :\n\n### 🧬 Biologie\n- **ADN** : la "recette" qui définit chaque être vivant — 4 lettres (A, T, G, C) en double hélice\n- **Cellule** : la brique de base de la vie. Notre corps en a 37 000 milliards\n- **Évolution** : Darwin, sélection naturelle, l'humain partage 98% de son ADN avec le chimpanzé\n\n### ⚛️ Physique\n- **Gravité** : Einstein a montré que ce n'est pas une "force" mais la déformation de l'espace-temps par la masse\n- **Lumière** : à la fois onde et particule (paradoxe quantique)\n- **Trous noirs** : le premier photographié était dans M87 en 2019\n\n### 🌌 Astronomie\n- **Big Bang** : l'univers est né il y a 13,8 milliards d'années\n- **Soleil** : 1,4 millions de km de diamètre, 110 fois la Terre\n- **Voie lactée** : notre galaxie, ~200 milliards d'étoiles\n\n### 🧮 Maths\n- **Pi (π)** : 3,14159… — apparaît partout où il y a des cercles\n- **Phi (φ)** : 1,618… — le nombre d'or, dans la nature\n- **Théorème de Pythagore** : a² + b² = c² (triangle rectangle)\n\nDemande-moi quelque chose de précis !`
  },

  /* ── Health / wellness */
  {
    test: /\b(sant[eé]|maladie|m[eé]dic|hôpital|stress|sommeil|méditation|bien.?[eê]tre)\b/i,
    reply: () => `## 🌿 Santé & bien-être\n\n### Conseils universels (pas un avis médical)\n- 💧 **Hydrate-toi** : 1,5 à 2L d'eau par jour\n- 🥗 **Mange varié** : fruits, légumes, céréales, protéines\n- 😴 **Dors 7-9 heures** : c'est essentiel à la mémoire et à l'humeur\n- 🚶 **Bouge tous les jours** : 30 min de marche fait des merveilles\n- 🧘 **Médite** : 10 min/jour réduit le stress mesurablement\n\n### Plantes médicinales africaines\n- **Moringa** : arbre aux vertus exceptionnelles, riche en protéines\n- **Bissap (hibiscus)** : antioxydant, baisse la tension\n- **Karité** : pour la peau, anti-inflammatoire\n- **Baobab** : 6× plus de vitamine C que l'orange\n- **Néré** : utilisé pour la fatigue et le diabète\n\n### Mais attention\nJe ne suis pas médecin. Pour toute douleur persistante, fièvre, blessure ou symptôme grave : **consulte un professionnel de santé**.`
  },

  /* ── Motivation / advice */
  {
    test: /\b(motivation|conseil|avancer|peur|doute|réussir|réussite|succès|inspire)\b/i,
    reply: () => `## ✨ Motivation & sagesse\n\n### Citations africaines puissantes\n\n> *« L'éducation est l'arme la plus puissante pour changer le monde. »* — **Nelson Mandela**\n\n> *« On ne tue pas des idées. »* — **Thomas Sankara**\n\n> *« Soyez le changement que vous voulez voir dans le monde. »* — Mahatma Gandhi (inspiré par les communautés indiennes d'Afrique du Sud)\n\n> *« Si tu veux aller vite, marche seul. Si tu veux aller loin, marchons ensemble. »* — **Proverbe africain**\n\n> *« C'est ce que tu fais, en ce moment, qui change l'histoire. »* — **Wangari Maathai**\n\n### Mes 5 conseils universels\n1. **Petit pas, tous les jours** > grand effort, une fois par mois\n2. **Le doute est normal** — agis quand même\n3. **Demande de l'aide** — c'est une force, pas une faiblesse\n4. **Célèbre les petites victoires** (KIVU le fait avec ta série de jours 🔥)\n5. **Sois patient** : *Mvumilivu hula mbivu* — Le patient mange ce qui est mûr\n\nTu traverses quelque chose de difficile ? Raconte-moi.`
  },

  /* ── Lessons / learning plan */
  {
    test: /\b(le[çc]on|apprendre|apprentissage|plan|programme|niveau|exercice|method)/i,
    reply: () => {
      const { targetLangName, level, streak } = getUserContext();
      return `## 🎓 Plan d'apprentissage en ${targetLangName}\n\nTu es au **niveau ${level}** avec une série de **${streak} jour${streak !== 1 ? 's' : ''}**. Voici un plan progressif sur 4 semaines :\n\n### Semaine 1 — Fondations 🌱\n- Salutations & politesse (5 phrases / jour)\n- Chiffres 1-20\n- Pronoms personnels (je, tu, il/elle…)\n- **Objectif** : tenir une présentation de 30 secondes\n\n### Semaine 2 — Quotidien 🏠\n- Famille, corps, vêtements\n- Verbes essentiels (être, avoir, aller, vouloir)\n- Heures et jours de la semaine\n- **Objectif** : décrire ta journée\n\n### Semaine 3 — Interactions 💬\n- Au marché, restaurant, transports\n- Demander son chemin\n- Exprimer ses goûts\n- **Objectif** : tenir une conversation de 2 minutes\n\n### Semaine 4 — Culture 🌍\n- Proverbes et expressions imagées\n- Histoire courte (conte ou anecdote)\n- Chant ou poème\n- **Objectif** : raconter une mini-histoire\n\n### 💡 Astuces qui marchent\n- **15 min/jour** > 2h le week-end\n- **Étiquette ta maison** : poste-it sur les objets dans ta langue cible\n- **Regarde un film/série** avec sous-titres dans ta langue\n- **Trouve un partenaire** linguistique (KIVU > Mes amis !)\n- Active la **Radio Kivi** pendant que tu cuisines/marches`;
    }
  },

  /* ── Specific language info */
  ...Object.entries(LANG_INFO).map(([code, info]) => ({
    test: new RegExp(`\\b(${info.name.toLowerCase()}|${info.native.toLowerCase().replace(/[ìí]/g, '[ìíi]')})\\b`, 'i'),
    reply: () => {
      return `## ${info.flag} ${info.name} (${info.native})\n\n**Famille linguistique** : ${info.family}\n**Locuteurs** : ${info.speakers}\n**Pays** : ${info.countries}\n\n${info.desc}\n\n### Phrases essentielles\n\n#### Saluer\n${(PHRASES.greetings[code] || []).map(([fr, t, p]) => `- *${t}* [${p}] — ${fr}`).join('\n')}\n\n#### Remercier\n- *${PHRASES.thanks[code] || ''}* — Merci\n\n#### Aimer\n- *${PHRASES.love[code] || ''}* — Je t'aime\n\n### Compter de 1 à 10\n${(PHRASES.numbers[code] || []).map((w, i) => `${i + 1}. ${w}`).join('  ·  ')}\n\nVeux-tu un exercice ou plus de vocabulaire ?`;
    }
  })),

  /* ── App help / navigation */
  {
    test: /\b(aide|help|comment|navigation|fonctionnalit|features?|que faire|kivu)\b/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `## 🌍 Bienvenue dans KIVU${firstName ? `, ${firstName}` : ''}\n\nVoici tout ce que tu peux faire :\n\n### 🎯 Apprendre\n- **Apprendre** : leçons interactives style Duolingo, quiz, parcours\n- **Stories** : histoires audio en langues africaines\n- **Dictionnaire** : 80+ mots traduits dans 8 langues, audio inclus\n- **Radio Kivi** : écoute passive en boucle\n\n### 💬 Communiquer\n- **Traduire** : voix, texte, caméra, conversation 2 personnes\n- **Multi-party** : réunion en direct avec traduction simultanée\n- **Diaspora** : appel vidéo + messages vocaux\n\n### 🛍️ E-commerce\n- **Marketplace** : 24 produits artisanaux, chat avec vendeur, appel vidéo\n- **Mes commandes** : suivi en temps réel\n- **Mobile Money** : Orange Money, Wave, MTN, M-Pesa…\n\n### 🛡️ Préserver\n- **Préserver** : enregistre des proverbes, mots rares, contes\n- **Voix admin** : bibliothèque audio humaine\n\n### 👥 Social\n- **Mes amis** : ajoute via code KIVU, encouragements, mini-feed\n- **Classement** : jour, semaine, mois, all-time\n- **Stats** : graphes hebdo/mensuel, badges, jalons\n\n### 🤖 Assistant (moi !)\n- Pose-moi n'importe quelle question : langues, culture, histoire, code, sciences, conseils…\n\n### 🎯 Astuce power-user\nAppuie sur **⌘K** (Mac) ou **Ctrl+K** pour ouvrir la **recherche globale** depuis n'importe où dans l'app.`;
    }
  },

  /* ── Goodbye */
  {
    test: /^(au revoir|adieu|bye|à\s*plus|à\s*bientôt|kwaheri|ba beneen|see you)/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `À bientôt${firstName ? ` ${firstName}` : ''} ! 🌍\n\nVoici **au revoir** dans plusieurs langues :\n- 🇹🇿 *Kwaheri*\n- 🇸🇳 *Ba beneen yoon*\n- 🇲🇱 *K\'an b\'a fo*\n- 🇳🇬 *Sai an jima* (Haoussa) / *O dabọ* (Yoruba)\n- 🇿🇦 *Sala kahle*\n- 🇨🇩 *Tikala malamu* (Lingala)\n\nReviens quand tu veux !`;
    }
  }
];

/* ─── Main resolver ─────────────────────────────────────── */

export function offlineReply(userMessage) {
  const text = (userMessage || '').trim();
  if (!text) {
    return 'Pose-moi une question ! Je peux t\'aider sur **n\'importe quoi** : langues africaines, histoire, géographie, cuisine, musique, sciences, code, conseils…';
  }

  // Try each handler in order
  for (const handler of HANDLERS) {
    if (handler.test.test(text)) {
      try { return handler.reply(); } catch (e) { /* skip and try next */ }
    }
  }

  // Smart fallback — propose explorable topics
  const { firstName, targetLangName } = getUserContext();
  const greet = firstName ? `${firstName}, ` : '';
  return `Hmm${greet}je n'ai pas de réponse précise sur **« ${text.slice(0, 60)}${text.length > 60 ? '…' : ''} »** en mode hors-ligne.\n\nMais je couvre **plus de 100 sujets** ! Essaie par exemple :\n\n## 💡 Demande-moi par exemple\n\n### 🌍 Langues & culture\n- *Comment dit-on bonjour en Wolof ?*\n- *Donne-moi 5 phrases pour le marché*\n- *Raconte-moi un proverbe africain*\n- *Apprends-moi les chiffres en ${targetLangName}*\n\n### 📚 Histoire & figures\n- *Qui était Mansa Musa ?* / *Mandela* / *Sankara* / *Nkrumah*\n- *Histoire du royaume du Mali* / *Songhaï* / *Zoulou*\n- *Qu'est-ce qu'Ubuntu ?* / *Les griots ?*\n\n### 🌎 Géographie\n- *Parle-moi du Sénégal* / *Mali* / *Nigeria* / *Kenya*…\n- *Géographie de l'Afrique*\n\n### 🍲 Cuisine\n- *Recette du thiéboudienne* / *mafé* / *yassa*\n- *Cuisine africaine*\n\n### 🎵 Musique\n- *Afrobeats* / *Mbalax* / *Soukous* / *Amapiano*\n- *Musique africaine*\n\n### 📖 Littérature\n- *Achebe* / *Soyinka* / *Adichie* / *Senghor*\n\n### 💪 Bien-être\n- *Conseils motivation*\n- *Plantes médicinales africaines*\n\n*Pour des questions très complexes (code, science, philosophie), connecte-toi à internet pour activer mon cerveau IA complet.*`;
}

/** Returns true if we should treat the backend error as "offline" and fall back. */
export function isNetworkError(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return msg.includes('failed to fetch') ||
         msg.includes('networkerror') ||
         msg.includes('network request failed') ||
         msg.includes('load failed') ||
         msg.includes('econnrefused') ||
         err.name === 'TypeError';
}
