const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sourceText: { type: String, required: true },
  translatedText: { type: String, required: true },
  sourceLanguage: { type: String, required: true },
  targetLanguage: { type: String, required: true },
  confidence: { type: Number, default: 0 },
  mode: { type: String, enum: ['voice', 'text', 'camera', 'conversation'], default: 'text' },
  isOffline: { type: Boolean, default: false },
  duration: Number,
  audioUrl: String
}, { timestamps: true });

translationSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model('Translation', translationSchema);
