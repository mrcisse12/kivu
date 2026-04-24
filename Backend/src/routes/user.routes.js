const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');

router.get('/me', protect, ctrl.getMe);
router.put('/me', protect, ctrl.updateMe);
router.delete('/me', protect, ctrl.deleteMe);
router.post('/me/languages', protect, ctrl.addLearningLanguage);
router.delete('/me/languages/:lang', protect, ctrl.removeLearningLanguage);
router.put('/me/subscription', protect, ctrl.updateSubscription);

module.exports = router;
