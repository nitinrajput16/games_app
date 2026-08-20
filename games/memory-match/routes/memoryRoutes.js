const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// Save a completed memory-match score to the leaderboard
router.post('/score', async (req, res) => {
  try {
    const { name, score, moves, pairs, time, gridSize } = req.body;
    if (typeof score !== 'number' || typeof moves !== 'number' || typeof pairs !== 'number') {
      return res.status(400).json({ error: 'score, moves and pairs are required numbers.' });
    }

    const entry = new Score({
      name: String(name || 'Player').slice(0, 20),
      score,
      moves,
      pairs,
      time,
      gridSize
    });
    await entry.save();

    res.status(201).json({ id: entry._id, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get the top leaderboard entries (higher score = better)
router.get('/scores', async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
    const scores = await Score.find()
      .sort({ score: -1 })
      .limit(limit);
    res.json(scores);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;