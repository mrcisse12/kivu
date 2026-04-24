const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

router.post(
  '/signup',
  [
    body('name').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 })
  ],
  authController.signup
);

router.post(
  '/signin',
  [body('email').isEmail(), body('password').exists()],
  authController.signin
);

router.post('/refresh', authController.refresh);
router.post('/signout', authController.signout);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
