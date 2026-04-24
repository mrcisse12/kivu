export const LANGUAGES = [
  { id: 'fra', name: 'Français', nativeName: 'Français', flag: '🇫🇷', speakers: 300_000_000, status: 'international' },
  { id: 'eng', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', speakers: 1_500_000_000, status: 'international' },
  { id: 'swa', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', speakers: 200_000_000, status: 'lingua' },
  { id: 'yor', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬', speakers: 45_000_000, status: 'healthy' },
  { id: 'wol', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳', speakers: 12_000_000, status: 'healthy' },
  { id: 'bam', name: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱', speakers: 15_000_000, status: 'healthy' },
  { id: 'dyu', name: 'Dioula', nativeName: 'Julakan', flag: '🇨🇮', speakers: 10_000_000, status: 'healthy' },
  { id: 'hau', name: 'Haoussa', nativeName: 'Hausa', flag: '🇳🇬', speakers: 80_000_000, status: 'healthy' },
  { id: 'ibo', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬', speakers: 27_000_000, status: 'healthy' },
  { id: 'amh', name: 'Amharique', nativeName: 'አማርኛ', flag: '🇪🇹', speakers: 57_000_000, status: 'healthy' },
  { id: 'zul', name: 'Zoulou', nativeName: 'isiZulu', flag: '🇿🇦', speakers: 28_000_000, status: 'healthy' },
  { id: 'lin', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', speakers: 40_000_000, status: 'lingua' },
  { id: 'kin', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼', speakers: 12_000_000, status: 'healthy' },
  { id: 'bib', name: 'Bissa', nativeName: 'Bisa', flag: '🇧🇫', speakers: 50_000, status: 'endangered' },
  { id: 'kru', name: 'Kru', nativeName: 'Kru', flag: '🇱🇷', speakers: 30_000, status: 'critical' },
  { id: 'dng', name: 'Dangme', nativeName: 'Dangme', flag: '🇬🇭', speakers: 20_000, status: 'critical' },
  { id: 'snk', name: 'Soninké', nativeName: 'Sooninkanxanne', flag: '🇲🇱', speakers: 1_300_000, status: 'vulnerable' }
];

export function findLanguage(id) {
  return LANGUAGES.find(l => l.id === id) || LANGUAGES[0];
}

export const STATUS_LABELS = {
  international: 'Internationale',
  lingua: 'Langue véhiculaire',
  healthy: 'Vitale',
  vulnerable: 'Vulnérable',
  endangered: 'Menacée',
  critical: 'Critique',
  extinct: 'Éteinte'
};
