/**
 * KIVU Backend — Serveur principal
 * Plateforme mondiale de traduction et d'apprentissage linguistique
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/error');
const rateLimiter = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const translationRoutes = require('./routes/translation.routes');
const learningRoutes = require('./routes/learning.routes');
const preservationRoutes = require('./routes/preservation.routes');
const languageRoutes = require('./routes/language.routes');
const businessRoutes = require('./routes/business.routes');
const meetingRoutes = require('./routes/meeting.routes');
const diasporaRoutes = require('./routes/diaspora.routes');
const assistantRoutes = require('./routes/assistant.routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] }
});

// Security & parsing middleware
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(rateLimiter);

// Health
app.get('/', (req, res) => {
  res.json({
    name: 'KIVU API',
    version: '1.0.0',
    status: 'operational',
    mission: 'Unir 7 milliards de personnes à travers 2000+ langues africaines',
    endpoints: [
      '/api/v1/auth',
      '/api/v1/users',
      '/api/v1/translation',
      '/api/v1/learning',
      '/api/v1/preservation',
      '/api/v1/languages',
      '/api/v1/business',
      '/api/v1/meetings',
      '/api/v1/diaspora',
      '/api/v1/assistant'
    ]
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes v1
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/translation', translationRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/preservation', preservationRoutes);
app.use('/api/v1/languages', languageRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/diaspora', diasporaRoutes);
app.use('/api/v1/assistant', assistantRoutes);

// 404 + error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO — Real-time multi-party meetings
io.on('connection', (socket) => {
  console.log(`✓ Client connected: ${socket.id}`);

  socket.on('join-meeting', ({ meetingId, user, language }) => {
    socket.join(meetingId);
    io.to(meetingId).emit('participant-joined', { user, language, socketId: socket.id });
  });

  socket.on('audio-stream', async ({ meetingId, audio, sourceLanguage }) => {
    // Forward audio to all participants (they get translated on-device)
    socket.to(meetingId).emit('audio-received', {
      audio, sourceLanguage, senderId: socket.id, timestamp: Date.now()
    });
  });

  socket.on('translation', ({ meetingId, text, sourceLanguage }) => {
    socket.to(meetingId).emit('translation-received', {
      text, sourceLanguage, senderId: socket.id, timestamp: Date.now()
    });
  });

  socket.on('leave-meeting', ({ meetingId }) => {
    socket.leave(meetingId);
    io.to(meetingId).emit('participant-left', { socketId: socket.id });
  });

  socket.on('disconnect', () => {
    console.log(`✗ Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🌍  KIVU API — ${new Date().toLocaleString('fr-FR').padEnd(42)} ║
║                                                               ║
║   ⚡  Listening on port ${String(PORT).padEnd(37)} ║
║   🔗  http://localhost:${PORT}${' '.repeat(38 - String(PORT).length)} ║
║                                                               ║
║   Mission: Unir l'Afrique par la langue.                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
})();

module.exports = { app, io };
