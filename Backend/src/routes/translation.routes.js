const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translation.controller');
const { protect } = require('../middleware/auth');

router.post('/translate', translationController.translate);
router.post('/detect', translationController.detectLanguage);
router.post('/voice', translationController.translateVoice);
router.post('/camera', translationController.translateFromImage);
router.get('/history', protect, translationController.getHistory);
router.delete('/history/:id', protect, translationController.deleteHistoryItem);
router.get('/offline-packs/:languageId', translationController.getOfflinePack);

module.exports = router;
