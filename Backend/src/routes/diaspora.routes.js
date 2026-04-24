const express = require('express');
const router = express.Router();

router.get('/family', (req, res) => {
  res.json({
    members: [
      { name: 'Mamie Awa', relation: 'Grand-mère', location: '🇸🇳 Dakar', language: 'Wolof', avatar: '👵🏾' },
      { name: 'Papa Moussa', relation: 'Père', location: '🇨🇮 Abidjan', language: 'Dioula', avatar: '👨🏾' },
      { name: 'Oncle Ibrahim', relation: 'Oncle', location: '🇫🇷 Paris', language: 'Bambara', avatar: '👨🏾‍🌾' },
      { name: 'Cousin Kofi', relation: 'Cousin', location: '🇺🇸 New York', language: 'Anglais', avatar: '🧑🏾' }
    ],
    generations: 3
  });
});

router.get('/stories', (req, res) => {
  res.json([
    { title: 'L\'histoire du village', author: 'Grand-père Moussa', duration: 4620, language: 'Bambara' },
    { title: 'Le conte du lièvre rusé', author: 'Grand-mère Awa', duration: 1320, language: 'Wolof' },
    { title: 'Recette du Thieboudienne', author: 'Tante Fatou', duration: 2100, language: 'Wolof' }
  ]);
});

router.get('/heritage-journey', (req, res) => {
  res.json({
    currentDay: 3,
    totalDays: 30,
    todayLesson: {
      title: 'Les salutations traditionnelles',
      language: 'Wolof',
      duration: 8,
      xpReward: 100
    }
  });
});

module.exports = router;
