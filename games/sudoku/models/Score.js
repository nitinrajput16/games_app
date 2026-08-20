const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema({
  name: { type: String, default: 'Player' },
  score: { type: Number, required: true },
  difficulty: { type: String, required: true },
  mistakes: { type: Number, required: true },
  hints: { type: Number, required: true },
  time: { type: Number, required: true }, // seconds
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SudokuScore', scoreSchema);