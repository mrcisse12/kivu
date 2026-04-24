const express = require('express');
const router = express.Router();

const LANGUAGES = [
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

router.get('/', (req, res) => {
  const { status, q } = req.query;
  let items = LANGUAGES;
  if (status) items = items.filter(l => l.status === status);
  if (q) items = items.filter(l =>
    l.name.toLowerCase().includes(q.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(q.toLowerCase())
  );
  res.json(items);
});

router.get('/:id', (req, res) => {
  const lang = LANGUAGES.find(l => l.id === req.params.id);
  if (!lang) return res.status(404).json({ error: 'Langue introuvable' });
  res.json(lang);
});

router.get('/:id/resources', (req, res) => {
  res.json({
    courses: 12,
    archives: 47,
    dictionary: { words: 15000, proverbs: 230 },
    voiceModels: 3
  });
});

module.exports = router;
