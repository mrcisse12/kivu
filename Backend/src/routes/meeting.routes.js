const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const meetings = [];

router.get('/', protect, (req, res) => {
  res.json(meetings);
});

router.post('/', protect, (req, res) => {
  const meeting = {
    id: uuidv4(),
    joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    ...req.body,
    host: req.user.id,
    status: 'scheduled',
    createdAt: new Date()
  };
  meetings.push(meeting);
  res.status(201).json(meeting);
});

router.get('/:id', (req, res) => {
  const m = meetings.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Réunion introuvable' });
  res.json(m);
});

router.post('/:id/join', (req, res) => {
  const m = meetings.find(x => x.id === req.params.id);
  if (!m) return res.status(404).json({ error: 'Réunion introuvable' });
  m.participants = m.participants || [];
  m.participants.push({ user: req.body.user, language: req.body.language, joinedAt: new Date() });
  res.json(m);
});

module.exports = router;
