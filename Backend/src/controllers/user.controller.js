const User = require('../models/User.model');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'avatarEmoji', 'country', 'countryFlag', 'preferredLanguage', 'motherTongue'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
    res.json(user);
  } catch (err) { next(err); }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.user.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.addLearningLanguage = async (req, res, next) => {
  try {
    const { languageId } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.learningLanguages.includes(languageId)) {
      user.learningLanguages.push(languageId);
      await user.save();
    }
    res.json(user.learningLanguages);
  } catch (err) { next(err); }
};

exports.removeLearningLanguage = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    user.learningLanguages = user.learningLanguages.filter(l => l !== req.params.lang);
    await user.save();
    res.json(user.learningLanguages);
  } catch (err) { next(err); }
};

exports.updateSubscription = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const validPlans = ['free', 'starter', 'pro', 'family', 'enterprise'];
    if (!validPlans.includes(plan)) return res.status(400).json({ error: 'Plan invalide' });
    const user = await User.findByIdAndUpdate(req.user.id, { subscription: plan }, { new: true });
    res.json(user);
  } catch (err) { next(err); }
};
