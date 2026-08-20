require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

mongoose.set('bufferCommands', false);

const games = require('./games');

// Game modules (each game keeps its own routes/models under games/<id>/)
const mazeRoutes = require('./games/maze-runner/routes/mazeRoutes');
const snakeRoutes = require('./games/snake-arena/routes/snakeRoutes');
const memoryRoutes = require('./games/memory-match/routes/memoryRoutes');
const breakoutRoutes = require('./games/breakout/routes/breakoutRoutes');
const sudokuRoutes = require('./games/sudoku/routes/sudokuRoutes');
const ticTacToeRoutes = require('./games/tic-tac-toe/routes/ticTacToeRoutes');
const gravitySwitchRoutes = require('./games/gravity-switch/routes/gravitySwitchRoutes');
const neonCircuitRoutes = require('./games/neon-circuit/routes/neonCircuitRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 1) Central game-library front-end (served at /)
app.use(express.static(path.join(__dirname, 'public')));

// 2) Each game's assets are mounted at /games/<id>/
app.use('/games/maze-runner', express.static(path.join(__dirname, 'games/maze-runner/public')));
app.use('/games/snake-arena', express.static(path.join(__dirname, 'games/snake-arena/public')));
app.use('/games/memory-match', express.static(path.join(__dirname, 'games/memory-match/public')));
app.use('/games/breakout', express.static(path.join(__dirname, 'games/breakout/public')));
app.use('/games/sudoku', express.static(path.join(__dirname, 'games/sudoku/public')));
app.use('/games/tic-tac-toe', express.static(path.join(__dirname, 'games/tic-tac-toe/public')));
app.use('/games/gravity-switch', express.static(path.join(__dirname, 'games/gravity-switch/public')));
app.use('/games/neon-circuit', express.static(path.join(__dirname, 'games/neon-circuit/public')));

// 3) APIs (all on this one server)
app.get('/api/games', (req, res) => {
  res.json({ games });
});
app.use('/api/maze', mazeRoutes);
app.use('/api/snake', snakeRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/breakout', breakoutRoutes);
app.use('/api/sudoku', sudokuRoutes);
app.use('/api/tic-tac-toe', ticTacToeRoutes);
app.use('/api/gravity-switch', gravitySwitchRoutes);
app.use('/api/neon-circuit', neonCircuitRoutes);

app.listen(PORT, () => {
  const live = games.filter((g) => g.status === 'live').length;
  console.log(`Game library running on http://localhost:${PORT}`);
  console.log(`${games.length} games registered (${live} live).`);
});

// Optional persistence — same Atlas cluster shared by all games
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => console.log('MongoDB connected'))
    .catch(() => console.error('MongoDB unavailable; persistence routes will return an error. Check MONGODB_URI and Atlas network access.'));
} else {
  console.warn('MONGODB_URI is not set; persistence routes are unavailable.');
}