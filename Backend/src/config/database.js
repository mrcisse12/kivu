const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️  MONGO_URI not set — running in memory mode (mocks only)');
    return null;
  }
  try {
    await mongoose.connect(uri);
    console.log('✓ MongoDB connected');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    throw err;
  }
};

module.exports = connectDB;
