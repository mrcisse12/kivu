const Quest = require('../models/Quest.model');
const User = require('../models/User.model');

const MOCK_QUESTS = [
  { id: 'q1', title: 'Marché de Dakar', description: 'Négocie avec un vendeur de fruits', language: 'swa', difficulty: 'beginner', xpReward: 150, icon: '🥭', category: 'commerce' },
  { id: 'q2', title: 'Premier Rendez-vous', description: 'Fais connaissance avec un ami', language: 'swa', difficulty: 'beginner', xpReward: 100, icon: '☕', category: 'greetings' },
  { id: 'q3', title: 'Taxi à Abidjan', description: 'Indique ta destination', language: 'dyu', difficulty: 'beginner', xpReward: 120, icon: '🚕', category: 'travel' },
  { id: 'q4', title: 'À l\'hôpital', description: 'Décris tes symptômes', language: 'wol', difficulty: 'intermediate', xpReward: 200, icon: '🏥', category: 'medical' }
];

exports.listQuests = async (req, res, next) => {
  try {
    const { language, category, difficulty } = req.query;
    let quests = MOCK_QUESTS;
    if (language) quests = quests.filter(q => q.language === language);
    if (category) quests = quests.filter(q => q.category === category);
    if (difficulty) quests = quests.filter(q => q.difficulty === difficulty);
    res.json(quests);
  } catch (err) { next(err); }
};

exports.getQuest = async (req, res, next) => {
  const quest = MOCK_QUESTS.find(q => q.id === req.params.id);
  if (!quest) return res.status(404).json({ error: 'Quête introuvable' });
  res.json(quest);
};

exports.completeQuest = async (req, res, next) => {
  try {
    const quest = MOCK_QUESTS.find(q => q.id === req.params.id);
    if (!quest) return res.status(404).json({ error: 'Quête introuvable' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    user.stats.xp += quest.xpReward;
    user.stats.level = Math.floor(user.stats.xp / 500) + 1;
    user.stats.lastActivity = new Date();
    await user.save();

    res.json({
      quest,
      newStats: user.stats,
      xpEarned: quest.xpReward
    });
  } catch (err) { next(err); }
};

exports.getProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user.stats);
  } catch (err) { next(err); }
};

exports.getBadges = async (req, res, next) => {
  res.json([
    { id: 'b1', title: 'Première Conversation', icon: '💬', rarity: 'common', unlocked: true },
    { id: 'b2', title: '100 Mots Appris', icon: '📚', rarity: 'rare', unlocked: true },
    { id: 'b3', title: 'Série 7 jours', icon: '🔥', rarity: 'rare', unlocked: true },
    { id: 'b4', title: 'Polyglotte', icon: '🌍', rarity: 'epic', unlocked: false },
    { id: 'b5', title: 'Maître Conteur', icon: '👑', rarity: 'legendary', unlocked: false }
  ]);
};

exports.getLeaderboard = async (req, res, next) => {
  res.json([
    { rank: 1, name: 'Fatou D.', country: '🇸🇳', xp: 14580 },
    { rank: 2, name: 'Kofi A.', country: '🇬🇭', xp: 13204 },
    { rank: 3, name: 'Amina B.', country: '🇲🇱', xp: 12890 }
  ]);
};

exports.submitPractice = async (req, res, next) => {
  const { questId, stepId, answer } = req.body;
  const isCorrect = answer && answer.length > 0;
  res.json({
    correct: isCorrect,
    xpEarned: isCorrect ? 10 : 0,
    feedback: isCorrect ? 'Parfait ! Continue comme ça 🎉' : 'Presque ! Essaye encore.'
  });
};
