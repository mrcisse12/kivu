/**
 * seed.js — populate DB with demo content
 * Usage: node src/utils/seed.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User.model');
const Language = require('../models/Language.model');
const Quest = require('../models/Quest.model');
const Archive = require('../models/Archive.model');

const LANGUAGES_SEED = [
  { id: 'fra', name: 'Français', nativeName: 'Français', flag: '🇫🇷', family: 'Indo-européenne', speakers: 300000000, status: 'international', hasVoiceSupport: true, hasLearningCourse: true },
  { id: 'eng', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', family: 'Indo-européenne', speakers: 1500000000, status: 'international', hasVoiceSupport: true, hasLearningCourse: true },
  { id: 'swa', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', family: 'Niger-Congo', speakers: 200000000, status: 'lingua', hasVoiceSupport: true, hasLearningCourse: true },
  { id: 'wol', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳', family: 'Niger-Congo', speakers: 12000000, status: 'healthy', hasVoiceSupport: true, hasLearningCourse: true },
  { id: 'bam', name: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱', family: 'Niger-Congo', speakers: 15000000, status: 'healthy', hasVoiceSupport: true, hasLearningCourse: true },
  { id: 'bib', name: 'Bissa', nativeName: 'Bisa', flag: '🇧🇫', family: 'Niger-Congo', speakers: 50000, status: 'endangered', hasVoiceSupport: false, hasLearningCourse: true }
];

(async () => {
  try {
    await connectDB();
    console.log('🌱 Seeding database...');

    await Language.deleteMany({});
    await Language.insertMany(LANGUAGES_SEED);
    console.log(`  ✓ ${LANGUAGES_SEED.length} langues`);

    console.log('✅ Seed terminé !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
