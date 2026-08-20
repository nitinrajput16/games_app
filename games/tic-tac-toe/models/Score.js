const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  name: { type: String, default: 'Player' },
  score: { type: Number, required: true },
  result: { type: String, required: true },
  mode: { type: String, required: true },
  difficulty: { type: String, required: true },
  moves: { type: Number, required: true },
  time: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TicTacToeScore', scoreSchema);