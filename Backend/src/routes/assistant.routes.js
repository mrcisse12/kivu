const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.post('/chat', async (req, res, next) => {
  try {
    const { message, context } = req.body;
    const reply = generateContextualReply(message, context);
    res.json({ reply, suggestions: ['Leçon du jour', 'Parler au marché', 'Politesse'] });
  } catch (err) { next(err); }
});

router.get('/suggestions', (req, res) => {
  const { context } = req.query;
  const map = {
    market: ['Apprends à marchander', 'Vocabulaire des prix', 'Négociation polie'],
    hospital: ['Décrire ses symptômes', 'Urgence médicale', 'Rendez-vous'],
    travel: ['Demander son chemin', 'Commander à manger', 'Transport public']
  };
  res.json({ suggestions: map[context] || ['Leçon du jour'] });
});

router.post('/daily-lesson', protect, (req, res) => {
  res.json({
    title: 'Leçon du jour — Salutations Haoussa',
    words: ['Sannu', 'Ya kake?', 'Ina lafiya', 'Na gode'],
    xp: 50
  });
});

function generateContextualReply(message, context) {
  const lower = (message || '').toLowerCase();
  if (lower.includes('marché') || lower.includes('vendre')) {
    return 'Parfait ! Pour marchander en Haoussa, essayez : "Nawa ne?" (Combien ça coûte ?). Voulez-vous pratiquer ?';
  }
  if (lower.includes('bonjour')) {
    return 'Excellent ! En Swahili, "Habari" = Bonjour. En Wolof, "Nanga def". Laquelle voulez-vous apprendre en premier ?';
  }
  return 'Je suis votre tuteur KIVU. Dites-moi ce que vous voulez apprendre aujourd\'hui !';
}

module.exports = router;
