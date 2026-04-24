const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  prompt: String,
  answer: String,
  hint: String,
  audioUrl: String
});

const questSchema = new mongoose.Schema({
  title: String,
  description: String,
  language: String,
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
  category: { type: String, enum: ['greetings', 'commerce', 'family', 'travel', 'work', 'culture', 'medical'] },
  icon: String,
  xpReward: Number,
  steps: [stepSchema],
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Quest', questSchema);
