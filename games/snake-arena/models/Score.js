const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  name: { type: String, default: 'Player' },
  score: { type: Number, required: true },
  length: { type: Number, required: true },
  difficulty: { type: Number, required: true },
  boardSize: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Score', scoreSchema);