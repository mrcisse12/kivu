const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  avatarEmoji: { type: String, default: '🧑🏾' },
  country: { type: String, default: '' },
  countryFlag: { type: String, default: '🌍' },
  preferredLanguage: { type: String, default: 'fra' },
  motherTongue: { type: String, default: null },
  learningLanguages: [{ type: String }],
  subscription: {
    type: String,
    enum: ['free', 'starter', 'pro', 'family', 'enterprise'],
    default: 'free'
  },
  stats: {
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    streak: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    badgesCount: { type: Number, default: 0 },
    translationsCount: { type: Number, default: 0 },
    contributionsCount: { type: Number, default: 0 },
    rank: { type: Number, default: 0 }
  },
  role: { type: String, enum: ['user', 'admin', 'linguist'], default: 'user' }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
