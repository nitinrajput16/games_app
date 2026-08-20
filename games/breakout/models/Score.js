const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  name: { type: String, default: 'Player' },
  score: { type: Number, required: true },
  level: { type: Number, required: true },
  bricks: { type: Number, required: true },
  difficulty: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BreakoutScore', scoreSchema);