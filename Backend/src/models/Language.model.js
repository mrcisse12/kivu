const mongoose = require('mongoose');

const languageSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },      // ISO code
  name: { type: String, required: true },                  // Nom français
  nativeName: { type: String, required: true },            // Nom natif
  flag: { type: String, required: true },
  family: { type: String, required: true },
  speakers: { type: Number, required: true },
  countries: [{ type: String }],
  status: {
    type: String,
    enum: ['international', 'lingua', 'healthy', 'vulnerable', 'endangered', 'critical', 'extinct'],
    default: 'healthy'
  },
  hasVoiceSupport: { type: Boolean, default: false },
  hasLearningCourse: { type: Boolean, default: false },
  isOfflineAvailable: { type: Boolean, default: false },
  contributorsCount: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Language', languageSchema);
