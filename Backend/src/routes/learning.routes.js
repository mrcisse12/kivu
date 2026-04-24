const express = require('express');
const router = express.Router();
const learningController = require('../controllers/learning.controller');
const { protect } = require('../middleware/auth');

router.get('/quests', learningController.listQuests);
router.get('/quests/:id', learningController.getQuest);
router.post('/quests/:id/complete', protect, learningController.completeQuest);
router.get('/progress', protect, learningController.getProgress);
router.get('/badges', protect, learningController.getBadges);
router.get('/leaderboard', learningController.getLeaderboard);
router.post('/practice', protect, learningController.submitPractice);

module.exports = router;
