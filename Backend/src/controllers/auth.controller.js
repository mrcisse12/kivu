const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { validationResult } = require('express-validator');

const generateToken = (userId) => jwt.sign(
  { id: userId },
  process.env.JWT_SECRET || 'dev-secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
);

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, preferredLanguage, motherTongue, country, countryFlag } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email déjà utilisé' });

    const user = await User.create({
      name, email, password,
      preferredLanguage: preferredLanguage || 'fra',
      motherTongue: motherTongue || null,
      country, countryFlag
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarEmoji: user.avatarEmoji,
      preferredLanguage: user.preferredLanguage,
      subscription: user.subscription,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

exports.signin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }
    user.stats.lastActivity = new Date();
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatarEmoji: user.avatarEmoji,
      preferredLanguage: user.preferredLanguage,
      subscription: user.subscription,
      stats: user.stats,
      token: generateToken(user._id)
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res) => {
  res.json({ message: 'Endpoint refresh' });
};

exports.signout = async (req, res) => {
  res.json({ message: 'Déconnecté' });
};

exports.forgotPassword = async (req, res) => {
  res.json({ message: 'Un email a été envoyé si le compte existe' });
};
