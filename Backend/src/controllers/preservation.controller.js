const MOCK_ARCHIVES = [
  { id: 'a1', title: 'Contes Wolof — Mamie Awa', languageId: 'wol', category: 'stories', duration: 2520, contributor: 'Awa Diop', createdAt: new Date() },
  { id: 'a2', title: 'Proverbes Bambara', languageId: 'bam', category: 'proverbs', duration: 1680, contributor: 'Ibrahim Koné', createdAt: new Date() },
  { id: 'a3', title: 'Cérémonie du mariage Dioula', languageId: 'dyu', category: 'ceremonies', duration: 4620, contributor: 'Chef de village', createdAt: new Date() }
];

exports.listArchives = async (req, res, next) => {
  const { languageId, category } = req.query;
  let items = MOCK_ARCHIVES;
  if (languageId) items = items.filter(a => a.languageId === languageId);
  if (category) items = items.filter(a => a.category === category);
  res.json(items);
};

exports.getArchive = async (req, res, next) => {
  const item = MOCK_ARCHIVES.find(a => a.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Archive introuvable' });
  res.json(item);
};

exports.createArchive = async (req, res, next) => {
  const { title, languageId, category, duration, transcription } = req.body;
  const newItem = {
    id: `a${Date.now()}`,
    title, languageId, category,
    duration: parseFloat(duration) || 0,
    transcription,
    contributor: req.user?.id || 'anonymous',
    audioUrl: req.file?.path,
    createdAt: new Date()
  };
  MOCK_ARCHIVES.unshift(newItem);
  res.status(201).json(newItem);
};

exports.likeArchive = async (req, res, next) => {
  res.json({ success: true });
};

exports.listCategories = async (req, res, next) => {
  res.json([
    { id: 'stories', name: 'Contes & Légendes', count: 1247 },
    { id: 'proverbs', name: 'Proverbes', count: 847 },
    { id: 'songs', name: 'Chants & Musique', count: 523 },
    { id: 'ceremonies', name: 'Cérémonies', count: 234 },
    { id: 'medicinal', name: 'Savoir médicinal', count: 156 },
    { id: 'oralHistory', name: 'Histoire orale', count: 412 }
  ]);
};

exports.listEndangered = async (req, res, next) => {
  res.json([
    { id: 'bib', name: 'Bissa', flag: '🇧🇫', speakers: 50_000, status: 'endangered' },
    { id: 'kru', name: 'Kru', flag: '🇱🇷', speakers: 30_000, status: 'critical' },
    { id: 'dng', name: 'Dangme', flag: '🇬🇭', speakers: 20_000, status: 'critical' },
    { id: 'snk', name: 'Soninké', flag: '🇲🇱', speakers: 1_300_000, status: 'vulnerable' }
  ]);
};

exports.getStats = async (req, res, next) => {
  res.json({
    languagesSaved: 483,
    totalContributors: 127_000,
    totalAudioHours: 1247,
    wordsArchived: 84_000,
    proverbsArchived: 317
  });
};
