const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  description: String,
  languages: [{ type: String }],
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    language: String,
    joinedAt: Date
  }],
  startTime: Date,
  endTime: Date,
  status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
  joinCode: { type: String, unique: true, sparse: true },
  transcriptUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
