/**
 * Dictionnaire propriétaire KIVU — phrases communes pré-traduites.
 * En production : base de données distribuée sur 2000+ langues.
 */

const DICT = {
  'bonjour': {
    swa: 'Habari', wol: 'Nanga def', bam: 'I ni sɔgɔma', dyu: 'I ni sɔgɔma',
    yor: 'Bawo', hau: 'Sannu', lin: 'Mbote', kin: 'Muraho', zul: 'Sawubona',
    eng: 'Hello', amh: 'ሰላም (Selam)'
  },
  'merci': {
    swa: 'Asante', wol: 'Jërëjëf', bam: 'I ni ce', dyu: 'I ni ce',
    yor: 'E se', hau: 'Na gode', lin: 'Matondi', kin: 'Murakoze', zul: 'Ngiyabonga',
    eng: 'Thank you', amh: 'አመሰግናለሁ'
  },
  'comment allez-vous ?': {
    swa: 'Habari yako?', wol: 'Nanga def?', bam: 'I ka kɛnɛ?',
    yor: 'Báwo ni?', hau: 'Yaya kake?', lin: 'Ozali malamu?',
    eng: 'How are you?'
  },
  'au revoir': {
    swa: 'Kwaheri', wol: 'Ba beneen yoon', bam: 'K\'an bɛn', dyu: 'K\'an bɛn',
    yor: 'O dabo', hau: 'Sai wata rana', eng: 'Goodbye'
  },
  'combien ça coûte ?': {
    swa: 'Bei gani?', wol: 'Ñaata la?', bam: 'A bɛ joli?',
    yor: 'E ló wúlò?', hau: 'Nawa ne?', eng: 'How much?'
  }
};

exports.lookup = (text, sourceLanguage, targetLanguage) => {
  const key = text.trim().toLowerCase();
  if (DICT[key] && DICT[key][targetLanguage]) {
    return DICT[key][targetLanguage];
  }
  return null;
};

exports.getDictionary = () => DICT;
