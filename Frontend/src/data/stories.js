/**
 * KIVU — Stories d'apprentissage immersives.
 *
 * Format : chaque histoire est une série de chapitres. Chaque chapitre contient
 * une scène (illustration emoji + couleur), une suite de répliques par
 * personnage, puis une question de compréhension.
 *
 * Les répliques sont taguées avec leur langue ; le Story Player les lit en
 * TTS dans la voix appropriée. Le mode bilingue affiche aussi la traduction
 * française sous la réplique.
 *
 * Inspiration : Duolingo Stories, mais avec contes africains authentiques.
 */

export const STORIES = [
  {
    id: 'lievre-ruse',
    title: 'Le lièvre rusé',
    unit: 'Contes ancestraux',
    language: 'wol',
    flag: '🇸🇳',
    cover: '🐰',
    coverGradient: 'linear-gradient(135deg, #F2952D, #FFB859)',
    duration: '4 min',
    xp: 80,
    description: "Un lièvre malin trompe un éléphant et un hippopotame au bord du fleuve Sénégal.",
    characters: {
      narrator: { name: 'Narrateur', avatar: '👤', color: '#666E85' },
      lievre:   { name: 'Le lièvre', avatar: '🐰', color: '#F2952D' },
      elephant: { name: 'L\'éléphant', avatar: '🐘', color: '#174E9C' },
      hippo:    { name: 'L\'hippo', avatar: '🦛', color: '#2D9E73' }
    },
    chapters: [
      {
        title: 'Au bord du fleuve',
        scene: { emoji: '🌅', bg: 'linear-gradient(180deg, #FFB859 0%, #F2952D 100%)' },
        lines: [
          { speaker: 'narrator', text: 'Au bord du fleuve Sénégal, un lièvre rusé cherche à traverser.', lang: 'fra' },
          { speaker: 'lievre',   text: 'Salaam aleekum, ami éléphant !', lang: 'wol', tr: 'Bonjour, ami éléphant !' },
          { speaker: 'elephant', text: 'Maleekum salaam, petit lièvre. Naka nga def ?', lang: 'wol', tr: 'Salut petit lièvre. Comment vas-tu ?' },
          { speaker: 'lievre',   text: 'Maa ngi fi rekk. Je veux faire un concours.', lang: 'wol', tr: 'Je vais bien. Je veux faire un concours.' }
        ],
        question: {
          prompt: 'Comment le lièvre dit-il "bonjour" ?',
          options: ['Salaam aleekum', 'Maleekum salaam', 'Naka nga def', 'Jërëjëf'],
          correct: 'Salaam aleekum'
        }
      },
      {
        title: 'Le défi',
        scene: { emoji: '💪', bg: 'linear-gradient(180deg, #58C794 0%, #2D9E73 100%)' },
        lines: [
          { speaker: 'lievre',   text: 'Toi et l\'hippo, vous êtes les plus forts.', lang: 'fra' },
          { speaker: 'elephant', text: 'Waaw, c\'est vrai !', lang: 'wol', tr: 'Oui, c\'est vrai !' },
          { speaker: 'lievre',   text: 'Tirons une corde — qui tire le plus fort ?', lang: 'fra' },
          { speaker: 'elephant', text: 'Awo ! Je suis prêt.', lang: 'wol', tr: 'D\'accord ! Je suis prêt.' }
        ],
        question: {
          prompt: 'Que veut faire le lièvre ?',
          options: ['Un concours de force', 'Une chanson', 'Un repas'],
          correct: 'Un concours de force'
        }
      },
      {
        title: 'La ruse',
        scene: { emoji: '🎭', bg: 'linear-gradient(180deg, #B86BD9 0%, #8C40AD 100%)' },
        lines: [
          { speaker: 'narrator', text: 'Le lièvre attache la corde à l\'éléphant et court chez l\'hippo.', lang: 'fra' },
          { speaker: 'lievre',   text: 'Hippo, défi de force avec moi !', lang: 'fra' },
          { speaker: 'hippo',    text: 'Waaw, tire ! Je vais gagner !', lang: 'wol', tr: 'Oui, tire ! Je vais gagner !' },
          { speaker: 'narrator', text: 'L\'éléphant et l\'hippo tirent — sans savoir qu\'ils s\'affrontent !', lang: 'fra' }
        ],
        question: {
          prompt: 'Qui tire vraiment la corde ?',
          options: ['L\'éléphant et l\'hippo', 'Le lièvre seul', 'Personne'],
          correct: 'L\'éléphant et l\'hippo'
        }
      },
      {
        title: 'La leçon',
        scene: { emoji: '🌟', bg: 'linear-gradient(180deg, #3395DA 0%, #174E9C 100%)' },
        lines: [
          { speaker: 'elephant', text: 'Comment ce lièvre a-t-il pu nous tromper ?', lang: 'fra' },
          { speaker: 'hippo',    text: 'L\'intelligence est plus forte que la taille.', lang: 'fra' },
          { speaker: 'narrator', text: 'Proverbe wolof : « Xel a la sax, du doole. »', lang: 'wol', tr: 'C\'est l\'esprit qui compte, pas la force.' },
          { speaker: 'lievre',   text: 'Jërëjëf, mes amis ! Au revoir !', lang: 'wol', tr: 'Merci, mes amis ! Au revoir !' }
        ],
        question: {
          prompt: 'Quel est le message du conte ?',
          options: ['L\'intelligence vaut mieux que la force', 'Il faut être grand', 'Le lièvre est gentil'],
          correct: 'L\'intelligence vaut mieux que la force'
        }
      }
    ]
  },
  {
    id: 'marche-dakar',
    title: 'Au marché de Sandaga',
    unit: 'Vie quotidienne',
    language: 'wol',
    flag: '🇸🇳',
    cover: '🛒',
    coverGradient: 'linear-gradient(135deg, #2D9E73, #58C794)',
    duration: '3 min',
    xp: 60,
    description: "Awa marchande des mangues au marché de Sandaga avec un vendeur sympathique.",
    characters: {
      narrator: { name: 'Narrateur', avatar: '👤', color: '#666E85' },
      awa:      { name: 'Awa',       avatar: '👩🏾', color: '#F2952D' },
      vendeur:  { name: 'Le vendeur', avatar: '👨🏾‍🌾', color: '#2D9E73' }
    },
    chapters: [
      {
        title: 'L\'arrivée au marché',
        scene: { emoji: '🥭', bg: 'linear-gradient(180deg, #FFB859 0%, #2D9E73 100%)' },
        lines: [
          { speaker: 'narrator', text: 'Awa entre dans le marché de Sandaga, à Dakar.', lang: 'fra' },
          { speaker: 'awa',      text: 'Salaam aleekum !', lang: 'wol', tr: 'Bonjour !' },
          { speaker: 'vendeur',  text: 'Maleekum salaam ! Naka nga def ?', lang: 'wol', tr: 'Bonjour ! Comment vas-tu ?' },
          { speaker: 'awa',      text: 'Maa ngi fi. Combien la mangue ?', lang: 'wol', tr: 'Je vais bien. Combien la mangue ?' }
        ],
        question: {
          prompt: 'Que demande Awa ?',
          options: ['Le prix de la mangue', 'L\'heure', 'Le chemin'],
          correct: 'Le prix de la mangue'
        }
      },
      {
        title: 'La négociation',
        scene: { emoji: '💰', bg: 'linear-gradient(180deg, #FACC80 0%, #F2952D 100%)' },
        lines: [
          { speaker: 'vendeur', text: '500 FCFA la pièce.', lang: 'fra' },
          { speaker: 'awa',     text: 'C\'est trop ! 300 FCFA ?', lang: 'fra' },
          { speaker: 'vendeur', text: 'Waaw, 400 FCFA, mon dernier prix.', lang: 'wol', tr: 'D\'accord, 400 FCFA, mon dernier prix.' },
          { speaker: 'awa',     text: 'Awo ! Donnez-moi 5 mangues.', lang: 'wol', tr: 'D\'accord ! Donnez-moi 5 mangues.' }
        ],
        question: {
          prompt: 'À quel prix Awa achète-t-elle finalement ?',
          options: ['400 FCFA pièce', '500 FCFA pièce', '300 FCFA pièce'],
          correct: '400 FCFA pièce'
        }
      },
      {
        title: 'Au revoir',
        scene: { emoji: '👋', bg: 'linear-gradient(180deg, #58C794 0%, #2D9E73 100%)' },
        lines: [
          { speaker: 'awa',     text: 'Jërëjëf beaucoup !', lang: 'wol', tr: 'Merci beaucoup !' },
          { speaker: 'vendeur', text: 'Ñoo ko bokk. Ba beneen yoon !', lang: 'wol', tr: 'De rien. À la prochaine !' },
          { speaker: 'narrator', text: 'Awa repart avec ses mangues, le sourire aux lèvres.', lang: 'fra' }
        ],
        question: {
          prompt: '"Jërëjëf" signifie ?',
          options: ['Merci', 'Bonjour', 'Au revoir'],
          correct: 'Merci'
        }
      }
    ]
  },
  {
    id: 'famille-amani',
    title: 'La famille Amani',
    unit: 'Famille & émotions',
    language: 'swa',
    flag: '🇹🇿',
    cover: '👨‍👩‍👧',
    coverGradient: 'linear-gradient(135deg, #174E9C, #3395DA)',
    duration: '4 min',
    xp: 70,
    description: "Mama Amani présente sa famille à un visiteur français à Dar es Salaam.",
    characters: {
      narrator: { name: 'Narrateur', avatar: '👤', color: '#666E85' },
      mama:     { name: 'Mama Amani', avatar: '👵🏾', color: '#8C40AD' },
      pierre:   { name: 'Pierre',     avatar: '👨🏼', color: '#174E9C' },
      enfant:   { name: 'Petit Joseph', avatar: '🧒🏾', color: '#F2952D' }
    },
    chapters: [
      {
        title: 'Bienvenue à Dar es Salaam',
        scene: { emoji: '🌆', bg: 'linear-gradient(180deg, #3395DA 0%, #174E9C 100%)' },
        lines: [
          { speaker: 'mama',   text: 'Karibu, Pierre ! Bienvenue chez nous.', lang: 'swa', tr: 'Bienvenue, Pierre !' },
          { speaker: 'pierre', text: 'Asante sana, Mama Amani.', lang: 'swa', tr: 'Merci beaucoup, Mama Amani.' },
          { speaker: 'mama',   text: 'Habari yako ?', lang: 'swa', tr: 'Comment vas-tu ?' },
          { speaker: 'pierre', text: 'Nzuri sana !', lang: 'swa', tr: 'Très bien !' }
        ],
        question: {
          prompt: '"Karibu" signifie ?',
          options: ['Bienvenue', 'Au revoir', 'Merci'],
          correct: 'Bienvenue'
        }
      },
      {
        title: 'La famille',
        scene: { emoji: '👨‍👩‍👧', bg: 'linear-gradient(180deg, #B86BD9 0%, #8C40AD 100%)' },
        lines: [
          { speaker: 'mama',   text: 'Voici ma familia : mon mari, mes 3 enfants.', lang: 'fra' },
          { speaker: 'enfant', text: 'Jambo ! Mimi ni Joseph.', lang: 'swa', tr: 'Bonjour ! Je suis Joseph.' },
          { speaker: 'pierre', text: 'Jambo Joseph ! Quel âge as-tu ?', lang: 'fra' },
          { speaker: 'enfant', text: 'Mimi ni miaka saba !', lang: 'swa', tr: 'J\'ai 7 ans !' }
        ],
        question: {
          prompt: '"Familia" en swahili signifie ?',
          options: ['Famille', 'Amis', 'Maison'],
          correct: 'Famille'
        }
      },
      {
        title: 'Le repas partagé',
        scene: { emoji: '🍽️', bg: 'linear-gradient(180deg, #F2952D 0%, #FFB859 100%)' },
        lines: [
          { speaker: 'mama',   text: 'Karibu chakula ! Le repas est prêt.', lang: 'swa', tr: 'Bienvenue à table !' },
          { speaker: 'pierre', text: 'Ça sent très bon !', lang: 'fra' },
          { speaker: 'mama',   text: 'C\'est notre ugali maison.', lang: 'fra' },
          { speaker: 'narrator', text: 'En Tanzanie, partager un repas = partager le cœur.', lang: 'fra' }
        ],
        question: {
          prompt: 'Que partage-t-on chez les Amani ?',
          options: ['Un repas', 'De l\'argent', 'Des cadeaux'],
          correct: 'Un repas'
        }
      }
    ]
  },
  {
    id: 'baobab-sage',
    title: 'Le baobab et le sage',
    unit: 'Contes ancestraux',
    language: 'bam',
    flag: '🇲🇱',
    cover: '🌳',
    coverGradient: 'linear-gradient(135deg, #2D9E73, #174E9C)',
    duration: '4 min',
    xp: 80,
    description: "Un sage Bambara enseigne à un jeune homme la patience sous le baobab millénaire.",
    characters: {
      narrator: { name: 'Narrateur', avatar: '👤', color: '#666E85' },
      sage:     { name: 'Le sage',  avatar: '👴🏾', color: '#8C40AD' },
      jeune:    { name: 'Le jeune', avatar: '🧑🏾', color: '#F2952D' }
    },
    chapters: [
      {
        title: 'À l\'ombre du baobab',
        scene: { emoji: '🌳', bg: 'linear-gradient(180deg, #FFB859 0%, #2D9E73 100%)' },
        lines: [
          { speaker: 'narrator', text: 'Un jeune homme arrive au village, pressé.', lang: 'fra' },
          { speaker: 'jeune',    text: 'I ni ce, vieux sage !', lang: 'bam', tr: 'Bonjour, vieux sage !' },
          { speaker: 'sage',     text: 'I ni ce. Que cherches-tu ?', lang: 'bam', tr: 'Bonjour. Que cherches-tu ?' },
          { speaker: 'jeune',    text: 'Je veux la richesse, vite !', lang: 'fra' }
        ],
        question: {
          prompt: 'Que cherche le jeune homme ?',
          options: ['La richesse', 'L\'amour', 'La paix'],
          correct: 'La richesse'
        }
      },
      {
        title: 'L\'enseignement',
        scene: { emoji: '🎓', bg: 'linear-gradient(180deg, #B86BD9 0%, #8C40AD 100%)' },
        lines: [
          { speaker: 'sage',  text: 'Vois ce baobab. Il a 1 000 ans.', lang: 'fra' },
          { speaker: 'jeune', text: 'Et alors ?', lang: 'fra' },
          { speaker: 'sage',  text: 'Il a poussé lentement. Comme la sagesse.', lang: 'fra' },
          { speaker: 'sage',  text: 'Du, c\'est la patience.', lang: 'bam', tr: 'La famille, c\'est la patience.' }
        ],
        question: {
          prompt: 'Que symbolise le baobab ?',
          options: ['La patience', 'La force', 'La richesse'],
          correct: 'La patience'
        }
      },
      {
        title: 'Le retour',
        scene: { emoji: '🌅', bg: 'linear-gradient(180deg, #3395DA 0%, #174E9C 100%)' },
        lines: [
          { speaker: 'jeune',    text: 'I ni ce, sage. Je comprends.', lang: 'bam', tr: 'Merci, sage. Je comprends.' },
          { speaker: 'narrator', text: 'Il rentre chez lui, calme. Le baobab veille.', lang: 'fra' },
          { speaker: 'sage',     text: 'Proverbe Bambara : « La patience cuit la pierre. »', lang: 'fra' }
        ],
        question: {
          prompt: 'Que signifie le proverbe ?',
          options: ['Tout vient à qui sait attendre', 'La pierre est dure', 'Il faut cuisiner'],
          correct: 'Tout vient à qui sait attendre'
        }
      }
    ]
  },
  {
    id: 'medecin-village',
    title: 'Le médecin du village',
    unit: 'Urgences & santé',
    language: 'hau',
    flag: '🇳🇬',
    cover: '🏥',
    coverGradient: 'linear-gradient(135deg, #EB4D4D, #FF7575)',
    duration: '3 min',
    xp: 70,
    description: "Un docteur français comprend un patient haoussa grâce à KIVU.",
    characters: {
      narrator: { name: 'Narrateur', avatar: '👤', color: '#666E85' },
      docteur:  { name: 'Dr. Marie', avatar: '👩🏼‍⚕️', color: '#174E9C' },
      patient:  { name: 'Aliou',     avatar: '👨🏿', color: '#F2952D' }
    },
    chapters: [
      {
        title: 'À la clinique',
        scene: { emoji: '🏥', bg: 'linear-gradient(180deg, #58C794 0%, #2D9E73 100%)' },
        lines: [
          { speaker: 'docteur', text: 'Sannu Aliou. Que se passe-t-il ?', lang: 'hau', tr: 'Bonjour Aliou. Que se passe-t-il ?' },
          { speaker: 'patient', text: 'Sannu Doctor. Ina jin ciwo.', lang: 'hau', tr: 'Bonjour Docteur. J\'ai mal.' },
          { speaker: 'docteur', text: 'Où ?', lang: 'fra' },
          { speaker: 'patient', text: 'Ciki na yana zafi.', lang: 'hau', tr: 'J\'ai mal au ventre.' }
        ],
        question: {
          prompt: 'Où Aliou a-t-il mal ?',
          options: ['Au ventre', 'À la tête', 'Aux pieds'],
          correct: 'Au ventre'
        }
      },
      {
        title: 'L\'examen',
        scene: { emoji: '💊', bg: 'linear-gradient(180deg, #FFB859 0%, #F2952D 100%)' },
        lines: [
          { speaker: 'docteur', text: 'Depuis quand ?', lang: 'fra' },
          { speaker: 'patient', text: 'Tun jiya.', lang: 'hau', tr: 'Depuis hier.' },
          { speaker: 'docteur', text: 'Bois beaucoup d\'eau, prends ce médicament.', lang: 'fra' },
          { speaker: 'patient', text: 'Na gode, doctor !', lang: 'hau', tr: 'Merci, docteur !' }
        ],
        question: {
          prompt: '"Na gode" signifie ?',
          options: ['Merci', 'Au revoir', 'Bonjour'],
          correct: 'Merci'
        }
      },
      {
        title: 'La gratitude',
        scene: { emoji: '💙', bg: 'linear-gradient(180deg, #3395DA 0%, #174E9C 100%)' },
        lines: [
          { speaker: 'narrator', text: 'Grâce à KIVU, le docteur a tout compris.', lang: 'fra' },
          { speaker: 'patient',  text: 'KIVU ya cece rayuwata.', lang: 'hau', tr: 'KIVU a sauvé ma vie.' },
          { speaker: 'docteur',  text: 'L\'union par la langue, c\'est la vie.', lang: 'fra' }
        ],
        question: {
          prompt: 'Quel est le message ?',
          options: ['La traduction sauve des vies', 'Les médecins sont gentils', 'Boire de l\'eau'],
          correct: 'La traduction sauve des vies'
        }
      }
    ]
  }
];

export function getStory(id) {
  return STORIES.find(s => s.id === id);
}
