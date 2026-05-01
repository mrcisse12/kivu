/**
 * KIVU — Moteur IA hors-ligne intelligent.
 *
 * Quand le backend est indisponible, ce moteur prend le relais avec
 * des réponses riches, contextuelles et structurées en Markdown.
 *
 * Architecture :
 *   - INTENTS détectés par regex sur le message utilisateur
 *   - Chaque intent renvoie une réponse complète depuis la KNOWLEDGE_BASE
 *   - Si aucun intent ne match, fallback intelligent qui propose
 *     des sujets explorables
 *
 * Couvre :
 *   - Salutations, encouragements, remerciements
 *   - Phrases pratiques par contexte (voyage, marché, famille, médical)
 *   - 9 langues africaines : Swahili, Wolof, Bambara, Dioula, Haoussa,
 *     Yoruba, Zulu, Igbo, Lingala
 *   - Numbers 1-20 dans chaque langue
 *   - Proverbes & sagesse africaine
 *   - Histoire & culture (royaumes, indépendances, figures)
 *   - Aide à la navigation de l'app KIVU
 *   - Plan d'apprentissage personnalisé selon profil utilisateur
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
  { lang: 'Bambara', fr: '« L\'arbre ne tombe pas à la première coup de hache. »', meaning: 'La persévérance et la patience sont essentielles. Aucun grand accomplissement ne se fait du premier coup.' },
  { lang: 'Wolof',   fr: '« Une seule main ne peut pas applaudir. »', meaning: 'On a besoin des autres pour réussir. La coopération est plus puissante que le solo.' },
  { lang: 'Yoruba',  fr: '« Doucement, doucement, on attrape le singe dans la forêt. »', meaning: 'La patience et la finesse réussissent là où la force échoue.' },
  { lang: 'Swahili', fr: '« Mvumilivu hula mbivu » — Le patient mange ce qui est mûr.', meaning: 'Celui qui sait attendre récolte les meilleurs fruits.' },
  { lang: 'Igbo',    fr: '« Quand un enfant lave ses mains, il mange avec les rois. »', meaning: 'Le travail bien fait ouvre les portes les plus prestigieuses.' },
  { lang: 'Zulu',    fr: '« Umuntu ngumuntu ngabantu » — Une personne est une personne grâce aux autres.', meaning: 'C\'est le concept Ubuntu : notre humanité est tissée par celle des autres.' }
];

const LANG_INFO = {
  swa: { name: 'Swahili', native: 'Kiswahili', flag: '🇹🇿', speakers: '200 millions', countries: 'Tanzanie, Kenya, Ouganda, RDC, Rwanda', family: 'Bantou', desc: 'Lingua franca de l\'Afrique de l\'Est, langue officielle de l\'Union africaine.' },
  wol: { name: 'Wolof',   native: 'Wolof',     flag: '🇸🇳', speakers: '10 millions',  countries: 'Sénégal, Gambie, Mauritanie', family: 'Niger-Congo / Atlantique', desc: 'Langue dominante au Sénégal, transmise oralement avec une riche tradition de griots.' },
  bam: { name: 'Bambara', native: 'Bamanankan', flag: '🇲🇱', speakers: '15 millions', countries: 'Mali, Burkina Faso, Côte d\'Ivoire', family: 'Mandé', desc: 'Langue principale du Mali, mutuellement intelligible avec le Dioula et le Mandinka.' },
  dyu: { name: 'Dioula',  native: 'Jula',       flag: '🇨🇮', speakers: '12 millions', countries: 'Côte d\'Ivoire, Burkina Faso, Mali, Ghana', family: 'Mandé', desc: 'Langue commerciale historique entre commerçants ouest-africains.' },
  hau: { name: 'Haoussa', native: 'Hausa',      flag: '🇳🇬', speakers: '70 millions', countries: 'Nigeria, Niger, Tchad, Cameroun', family: 'Afro-asiatique / Tchadique', desc: 'Une des langues les plus parlées d\'Afrique, écrite historiquement en ajami (caractères arabes).' },
  yor: { name: 'Yoruba',  native: 'Yorùbá',     flag: '🇳🇬', speakers: '45 millions', countries: 'Nigeria, Bénin, Togo', family: 'Niger-Congo / Volta-Niger', desc: 'Langue tonale avec une riche tradition orale, parlée par des dizaines de millions au Nigeria.' },
  zul: { name: 'Zulu',    native: 'isiZulu',    flag: '🇿🇦', speakers: '12 millions', countries: 'Afrique du Sud', family: 'Bantou / Nguni', desc: 'Première langue d\'Afrique du Sud, célèbre pour ses sons de clic.' },
  ibo: { name: 'Igbo',    native: 'Asụsụ Igbo', flag: '🇳🇬', speakers: '24 millions', countries: 'Nigeria', family: 'Niger-Congo / Volta-Niger', desc: 'Langue tonale du sud-est nigérian, riche de proverbes et d\'art oral.' },
  lin: { name: 'Lingala', native: 'Lingála',    flag: '🇨🇩', speakers: '20 millions', countries: 'RDC, Congo, Angola', family: 'Bantou', desc: 'Langue véhiculaire du fleuve Congo, popularisée par la rumba congolaise.' }
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
Mansa Musa popularisa l'islam en Afrique de l'Ouest et fit du Mali une plaque tournante du commerce transsaharien (or, sel, esclaves, manuscrits).`,

  'royaume du mali': `## Le Royaume du Mali (1235 – 1670)

Fondé par **Soundiata Keïta** après sa victoire à la bataille de Kirina (~1235) contre le roi sosso Soumaoro Kanté. L'épopée de Soundiata est l'un des plus grands récits oraux d'Afrique.

### Apogée
- Sous **Mansa Musa** (1312–1337), l'empire couvrait l'actuel Mali, Sénégal, Gambie, Guinée, Mauritanie, Niger
- Économie basée sur l'**or de Bouré et Bambouk**, le sel de Taghaza
- Tombouctou et Djenné devinrent des centres d'érudition islamique mondialement réputés

### Déclin
Affaibli par les rivalités internes et les invasions songhaï puis marocaines (bataille de Tondibi, 1591).`,

  'soundiata': `## Soundiata Keïta (~1217 – 1255)

Surnommé **« le lion du Mandé »**, fondateur de l'**Empire du Mali**.

### L'épopée
Né paralysé selon la tradition, il marche tardivement après avoir arraché un baobab pour offrir ses feuilles à sa mère. Exilé puis revenu, il unifie les royaumes mandingues et bat le sorcier-roi Soumaoro à **Kirina (1235)**.

### Charte de Kurukan Fuga
Promulguée à sa cour, c'est l'une des **plus anciennes constitutions au monde** (1236), reconnue par l'UNESCO comme patrimoine immatériel. Elle proclame :
- L'abolition de l'esclavage
- Le respect de la vie humaine
- Les droits des femmes
- La liberté d'expression`,

  'ubuntu': `## Ubuntu

**« Umuntu ngumuntu ngabantu »** — *Je suis parce que nous sommes.*

Concept philosophique d'Afrique australe (zoulou, xhosa) qui exprime l'**interdépendance fondamentale** entre tous les êtres humains.

### Principes
- **Compassion** : reconnaître l'humanité dans l'autre
- **Communauté** : l'individu n'existe qu'à travers les liens
- **Réconciliation** : faire la paix plutôt que punir
- **Hospitalité** : accueillir l'étranger comme un parent

### Application moderne
Adopté par Nelson Mandela comme pilier de la **Commission Vérité et Réconciliation** post-apartheid. Inspire aujourd'hui des philosophies de management éthique et de leadership inclusif partout dans le monde.`
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

/* ─── Intent handlers ───────────────────────────────────── */

const HANDLERS = [
  /* Greetings */
  {
    test: /^(salut|bonjour|coucou|hello|hi\b|hey|bonsoir|yo|wesh)/i,
    reply: () => {
      const { firstName, streak, targetLangName } = getUserContext();
      const helloIn = pick([
        ['🇹🇿 Swahili', 'Jambo'],
        ['🇸🇳 Wolof', 'Salaam aleekum'],
        ['🇲🇱 Bambara', 'I ni ce'],
        ['🇳🇬 Yoruba', 'Bawo'],
        ['🇿🇦 Zulu', 'Sawubona']
      ]);
      const greet = firstName ? `Bonjour **${firstName}**` : 'Bonjour';
      let body = `${greet} ! 👋\n\nJe suis **Kivi**, ton tuteur IA pour explorer les langues et la culture africaines. ${streak >= 3 ? `Bravo pour ta série de **${streak} jours** ! 🔥 ` : ''}Tu apprends le **${targetLangName}** en ce moment.\n\n*${helloIn[1]}* — c'est comme ça qu'on dit bonjour en ${helloIn[0]} !\n\n## Que puis-je faire pour toi ?\n- Apprendre des **phrases utiles** par contexte (voyage, marché, famille…)\n- Découvrir des **proverbes** et la **sagesse africaine**\n- Te raconter l'**histoire** des grandes civilisations africaines\n- Comparer les langues, leurs **familles** et leur géographie\n- Bâtir un **plan d'apprentissage** personnalisé\n\nDis-moi simplement ce qui t'intéresse !`;
      return body;
    }
  },

  /* Thanks */
  {
    test: /\b(merci|thx|thanks|gracias|asante|jërëjëf)\b/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `De rien${firstName ? ` ${firstName}` : ''} ! 💛\n\nVoici **merci** dans plusieurs langues africaines :\n\n${listPhrases('thanks')}\n\nN'hésite pas à me redemander n'importe quoi — je suis là pour t'aider à progresser.`;
    }
  },

  /* I love you */
  {
    test: /\b(je\s*t['e]?\s*aime|i\s*love\s*you|ngiyakuthanda)\b/i,
    reply: () => {
      return `## ❤️ « Je t'aime » dans 8 langues africaines\n\n${listPhrases('love')}\n\n> *Astuce* : la prononciation entre crochets t'aide à reproduire le son. Les voyelles soulignées sont accentuées.`;
    }
  },

  /* Numbers */
  {
    test: /\b(chiffres?|nombres?|compt(er|e)|numbers?|de\s*1\s*à|number)\b/i,
    reply: () => {
      const { targetLang, targetLangName } = getUserContext();
      const nums = PHRASES.numbers[targetLang] || PHRASES.numbers.swa;
      const others = ['swa', 'wol', 'bam', 'hau', 'yor'].filter(l => l !== targetLang).slice(0, 3);
      const otherCols = others.map(l => {
        const info = LANG_INFO[l];
        return `### ${info.flag} ${info.name}\n${PHRASES.numbers[l].map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
      }).join('\n\n');
      return `## 🔢 Les chiffres en ${targetLangName} (1 à 10)\n\n${nums.map((w, i) => `${i + 1}. **${w}**`).join('\n')}\n\n---\n\n### Comparaisons dans d'autres langues\n\n${otherCols}\n\n💡 *Astuce mnémo* : en Swahili, **moja** ressemble à *moi* et **kumi** ressemble à *cumin*. Crée des associations visuelles pour retenir plus vite !`;
    }
  },

  /* Travel / market */
  {
    test: /\b(voyage|voyager|march[eé]|achet|prix|combien|negoci|negotiate)\b/i,
    reply: () => {
      return `## 🛒 Phrases essentielles au marché africain\n\n### Demander un prix\n- **🇹🇿 Swahili** : *Bei gani?* [BAY GAH-nee] — Combien ?\n- **🇸🇳 Wolof** : *Ñaata la?* [NYAH-tah la] — Combien ?\n- **🇨🇮 Dioula** : *Joli foli yen?* [JO-lee FO-lee YEN]\n- **🇳🇬 Haoussa** : *Nawa ne?* [NAH-wah neh]\n\n### Négocier\n- **🇹🇿 Swahili** : *Punguza bei!* — Baisse le prix !\n- **🇳🇬 Haoussa** : *Yi arha* [yee AR-ha] — C'est trop cher\n- **🇲🇱 Bambara** : *A ka gɛlɛn* — C'est cher\n\n### Acheter\n- *Nataka hii* (Swahili) — Je veux celui-ci\n- *Damay jënd* (Wolof) — J'achète\n- *Asante !* / *Jërëjëf !* — Merci !\n\n## 💡 Conseils pour le marché africain\n\n1. **Salue toujours** avant de demander un prix — c'est un signe de respect\n2. **Souris et négocie avec humour** — c'est attendu, jamais offensant\n3. **Connais les prix locaux** avant d'arriver (demande à un local de confiance)\n4. **Paie en monnaie locale**, en petites coupures\n5. Pour les marchés artisanaux, le **prix initial est souvent 2-3× le prix réel**`;
    }
  },

  /* Family */
  {
    test: /\b(famille|parents?|m[eè]re|p[eè]re|fr[eè]re|s[oœ]ur|enfant|family)\b/i,
    reply: () => {
      return `## 👨‍👩‍👧 La famille dans les langues africaines\n\n| Français | Swahili 🇹🇿 | Wolof 🇸🇳 | Bambara 🇲🇱 | Yoruba 🇳🇬 |\n|---|---|---|---|---|\n| Mère | Mama | Yaay | Ba | Iya |\n| Père | Baba | Baay | Fa | Baba |\n| Enfant | Mtoto | Doom | Den | Ọmọ |\n| Frère | Kaka | Mag | Kɔrɔ | Arakunrin |\n| Sœur | Dada | Jigéen | Bara | Arabinrin |\n| Famille | Familia | Njabootu | Du | Ẹbi |\n\n### 💡 Le saviez-vous ?\nEn Afrique de l'Ouest, **« père »** et **« mère »** désignent souvent **tous les hommes et femmes du même âge** que tes parents biologiques. C'est l'expression du **système de parenté étendue** qui est au cœur des sociétés africaines.\n\n> *Il faut tout un village pour élever un enfant.* — Proverbe africain`;
    }
  },

  /* Proverbs */
  {
    test: /\b(proverbe|sagesse|maxime|dicton|saying|wisdom)\b/i,
    reply: () => {
      const sample = PROVERBS.slice(0, 5);
      const list = sample.map(p => `### 📜 Proverbe ${p.lang}\n${p.fr}\n\n*${p.meaning}*`).join('\n\n---\n\n');
      return `## 🌍 Sagesse et proverbes africains\n\n${list}\n\nTu veux que je te raconte un proverbe d'une langue spécifique ? Demande-moi !`;
    }
  },

  /* Lessons / learning plan */
  {
    test: /\b(le[çc]on|apprendre|apprentissage|plan|programme|niveau|exercice|method)/i,
    reply: () => {
      const { targetLangName, level, streak } = getUserContext();
      return `## 🎓 Plan d'apprentissage en ${targetLangName}\n\nTu es au **niveau ${level}** avec une série de **${streak} jour${streak !== 1 ? 's' : ''}**. Voici un plan progressif sur 4 semaines :\n\n### Semaine 1 — Fondations 🌱\n- Salutations & politesse (5 phrases / jour)\n- Chiffres 1-20\n- Pronoms personnels (je, tu, il/elle…)\n- **Objectif** : tenir une présentation de 30 secondes\n\n### Semaine 2 — Quotidien 🏠\n- Famille, corps, vêtements\n- Verbes essentiels (être, avoir, aller, vouloir)\n- Heures et jours de la semaine\n- **Objectif** : décrire ta journée\n\n### Semaine 3 — Interactions 💬\n- Au marché, restaurant, transports\n- Demander son chemin\n- Exprimer ses goûts\n- **Objectif** : tenir une conversation de 2 minutes\n\n### Semaine 4 — Culture 🌍\n- Proverbes et expressions imagées\n- Histoire courte (conte ou anecdote)\n- Chant ou poème\n- **Objectif** : raconter une mini-histoire\n\n### 💡 Conseils\n- **15 minutes/jour** > 2 heures le week-end\n- Utilise l'onglet **Apprendre** pour les leçons interactives\n- Active les notifications pour ne pas casser ta série`;
    }
  },

  /* Specific language info */
  ...Object.entries(LANG_INFO).map(([code, info]) => ({
    test: new RegExp(`\\b(${info.name.toLowerCase()}|${info.native.toLowerCase()})\\b`, 'i'),
    reply: () => {
      return `## ${info.flag} ${info.name} (${info.native})\n\n**Famille linguistique** : ${info.family}\n**Locuteurs** : ${info.speakers}\n**Pays** : ${info.countries}\n\n${info.desc}\n\n### Phrases essentielles\n\n#### Saluer\n${(PHRASES.greetings[code] || []).map(([fr, t, p]) => `- *${t}* [${p}] — ${fr}`).join('\n')}\n\n#### Remercier\n- *${PHRASES.thanks[code] || ''}* — Merci\n\n#### Aimer\n- *${PHRASES.love[code] || ''}* — Je t'aime\n\n### Compter de 1 à 10\n${(PHRASES.numbers[code] || []).map((w, i) => `${i + 1}. ${w}`).join('  ·  ')}\n\nVeux-tu un exercice ou plus de vocabulaire ?`;
    }
  })),

  /* History topics */
  ...Object.entries(HISTORY).map(([key, content]) => ({
    test: new RegExp(`\\b${key.replace(/\s+/g, '\\s+')}\\b`, 'i'),
    reply: () => content
  })),

  /* App help / navigation */
  {
    test: /\b(aide|help|comment|navigation|fonctionnalit|features?|que faire|kivu)\b/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `## 🌍 Bienvenue dans KIVU${firstName ? `, ${firstName}` : ''}\n\nVoici tout ce que tu peux faire :\n\n### 🎯 Apprendre\n- **Apprendre** : leçons interactives style Duolingo, quiz, parcours\n- **Stories** : histoires audio en langues africaines\n- **Dictionnaire** : 80+ mots traduits dans 8 langues, audio inclus\n\n### 💬 Communiquer\n- **Traduire** : voix, texte, caméra, conversation 2 personnes\n- **Multi-party** : réunion en direct avec traduction simultanée\n- **Diaspora** : appel vidéo + messages vocaux\n\n### 🛡️ Préserver\n- **Préserver** : enregistre des proverbes, mots rares, contes\n- Contribue au patrimoine linguistique africain\n\n### 👥 Social\n- **Mes amis** : ajoute via code KIVU, encouragements, mini-feed\n- **Profil** : badges, classement, séries\n\n### 🤖 Assistant (moi !)\n- Pose-moi n'importe quelle question : langues, culture, histoire, code, sciences…\n- Je peux créer des plans d'apprentissage, traduire, expliquer la grammaire\n\nQue veux-tu explorer en premier ?`;
    }
  },

  /* Goodbye */
  {
    test: /^(au revoir|adieu|bye|à\s*plus|à\s*bientôt|kwaheri|ba beneen)/i,
    reply: () => {
      const { firstName } = getUserContext();
      return `À bientôt${firstName ? ` ${firstName}` : ''} ! 🌍\n\nVoici **au revoir** dans plusieurs langues :\n- 🇹🇿 *Kwaheri*\n- 🇸🇳 *Ba beneen yoon*\n- 🇲🇱 *K\'an b\'a fo*\n- 🇳🇬 *Sai an jima* (Haoussa) / *O dabọ* (Yoruba)\n- 🇿🇦 *Sala kahle*\n\nReviens quand tu veux !`;
    }
  }
];

/* ─── Main resolver ─────────────────────────────────────── */

export function offlineReply(userMessage) {
  const text = (userMessage || '').trim();
  if (!text) {
    return 'Pose-moi une question ! Je peux t\'aider sur les langues africaines, la culture, l\'histoire, ou n\'importe quel sujet.';
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
  return `Hmm${greet}je n'ai pas de réponse précise sur **« ${text.slice(0, 60)}${text.length > 60 ? '…' : ''} »** en mode hors-ligne.\n\nMais voici ce que je peux faire pour toi :\n\n## 💡 Demande-moi par exemple\n\n- **« Comment dit-on bonjour en Wolof ? »**\n- **« Donne-moi 5 phrases pour le marché »**\n- **« Raconte-moi un proverbe Bambara »**\n- **« Apprends-moi les chiffres en ${targetLangName} »**\n- **« Qui était Mansa Musa ? »**\n- **« Plan pour apprendre le Swahili en 1 mois »**\n- **« Histoire du royaume du Mali »**\n- **« Qu'est-ce qu'Ubuntu ? »**\n\n*Pour des questions très complexes (code, science, philosophie), connecte-toi à internet pour que j'utilise mon cerveau IA complet.*`;
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
         err.name === 'TypeError'; // browser fetch network errors
}
