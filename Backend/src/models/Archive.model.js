const mongoose = require('mongoose');

const archiveSchema = new mongoose.Schema({
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  languageId: { type: String, required: true },
  category: {
    type: String,
    enum: ['stories', 'proverbs', 'songs', 'ceremonies', 'medicinal', 'oralHistory'],
    required: true
  },
  audioUrl: String,
  transcription: String,
  translations: [{
    languageId: String,
    text: String
  }],
  duration: Number,
  isEndangered: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true },
  tags: [{ type: String }]
}, { timestamps: true });

archiveSchema.index({ languageId: 1, createdAt: -1 });
module.exports = mongoose.model('Archive', archiveSchema);
