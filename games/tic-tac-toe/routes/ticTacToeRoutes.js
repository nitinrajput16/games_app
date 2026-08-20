const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

router.post('/score', async (req, res) => {
  try {
    const { name, score, result, mode, difficulty, moves, time } = req.body;
    if (![score, moves, time].every((value) => typeof value === 'number' && Number.isFinite(value))) {
      return res.status(400).json({ error: 'score, moves and time are required numbers.' });
    }
    if (!['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ error: 'result must be win, loss or draw.' });
    }
    const entry = await Score.create({
      name: String(name || 'Player').slice(0, 20),
      score,
      result,
      mode: String(mode || 'computer'),
      difficulty: String(difficulty || 'hard'),
      moves,
      time
    });
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