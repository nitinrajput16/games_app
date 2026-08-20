const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  name: { type: String, default: 'Player' },
  score: { type: Number, required: true },
  moves: { type: Number, required: true },
  pairs: { type: Number, required: true },
  time: { type: Number, required: true }, // seconds
  gridSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MemoryScore', scoreSchema);