const mongoose = require('mongoose');

const mazeSchema = new mongoose.Schema({
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  difficulty: { type: Number, required: true },
  grid: { type: [[Number]], required: true }, // 0 = wall, 1 = path
  start: { x: Number, y: Number },
  end: { x: Number, y: Number },
  solutionLength: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Maze', mazeSchema);