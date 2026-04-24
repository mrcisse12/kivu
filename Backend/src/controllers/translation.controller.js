const Translation = require('../models/Translation.model');
const translationService = require('../services/translation.service');

exports.translate = async (req, res, next) => {
  try {
    const { text, sourceLanguage, targetLanguage, mode } = req.body;
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'text et targetLanguage requis' });
    }
    const result = await translationService.translateText({
      text, sourceLanguage, targetLanguage, mode: mode || 'text'
    });
    if (req.user) {
      Translation.create({
        user: req.user.id,
        sourceText: text,
        translatedText: result.translatedText,
        sourceLanguage: result.detectedLanguage,
        targetLanguage,
        confidence: result.confidence,
        mode: mode || 'text'
      }).catch(() => {});
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.detectLanguage = async (req, res, next) => {
  try {
    const { text } = req.body;
    const detected = await translationService.detectLanguage(text);
    res.json({ detectedLanguage: detected });
  } catch (err) { next(err); }
};

exports.translateVoice = async (req, res, next) => {
  try {
    const { audio, sourceLanguage, targetLanguage } = req.body;
    const result = await translationService.translateAudio({ audio, sourceLanguage, targetLanguage });
    res.json(result);
  } catch (err) { next(err); }
};

exports.translateFromImage = async (req, res, next) => {
  try {
    const { image, targetLanguage } = req.body;
    const result = await translationService.translateImage({ image, targetLanguage });
    res.json(result);
  } catch (err) { next(err); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const history = await Translation.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(history);
  } catch (err) { next(err); }
};

exports.deleteHistoryItem = async (req, res, next) => {
  try {
    await Translation.deleteOne({ _id: req.params.id, user: req.user.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

exports.getOfflinePack = async (req, res, next) => {
  try {
    const pack = await translationService.getOfflinePack(req.params.languageId);
    res.json(pack);
  } catch (err) { next(err); }
};
