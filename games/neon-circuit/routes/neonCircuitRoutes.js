const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

router.post('/score', async (req, res) => {
  try {
    const { name, score, level, moves, time } = req.body;
    if (![score, level, moves, time].every((value) => typeof value === 'number' && Number.isFinite(value))) {
      return res.status(400).json({ error: 'score, level, moves and time are required numbers.' });
    }
    const entry = await Score.create({ name: String(name || 'Player').slice(0, 20), score, level, moves, time });
    res.status(201).json({ id: entry._id, saved: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/scores', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const scores = await Score.find().sort({ score: -1, createdAt: -1 }).limit(limit);
    res.json(scores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;