const express = require('express');
const router = express.Router();
const Score = require('../models/Score');

// Save a game-over score to the leaderboard
router.post('/score', async (req, res) => {
  try {
    const { name, score, length, difficulty, boardSize } = req.body;
    if (typeof score !== 'number' || typeof length !== 'number') {
      return res.status(400).json({ error: 'score and length are required numbers.' });
    }

    const entry = new Score({
      name: String(name || 'Player').slice(0, 20),
      score,
      length,
      difficulty,
      boardSize
    });
    await entry.save();

    res.status(201).json({ id: entry._id, saved: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get the top leaderboard entries
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