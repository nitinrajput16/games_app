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
app.use('/games/tetris', express.static(path.join(__dirname, 'games/tetris/public')));
app.use('/games/minesweeper', express.static(path.join(__dirname, 'games/minesweeper/public')));
app.use('/games/rock-paper-scissors', express.static(path.join(__dirname, 'games/rock-paper-scissors/public')));
app.use('/games/2048', express.static(path.join(__dirname, 'games/2048/public')));
app.use('/games/pong', express.static(path.join(__dirname, 'games/pong/public')));
app.use('/games/whack-a-mole', express.static(path.join(__dirname, 'games/whack-a-mole/public')));
app.use('/games/flappy-bird', express.static(path.join(__dirname, 'games/flappy-bird/public')));
app.use('/games/connect-four', express.static(path.join(__dirname, 'games/connect-four/public')));
app.use('/games/hangman', express.static(path.join(__dirname, 'games/hangman/public')));
app.use('/games/typing-speed', express.static(path.join(__dirname, 'games/typing-speed/public')));
app.use('/games/coin-flip', express.static(path.join(__dirname, 'games/coin-flip/public')));
app.use('/games/simon-says', express.static(path.join(__dirname, 'games/simon-says/public')));
app.use('/games/color-match', express.static(path.join(__dirname, 'games/color-match/public')));

// 3) APIs (all on this one server)
app.get('/api/games', (req, res) => {
  res.json({ games });
});
// Keep the static catalog usable if the primary API route is unavailable.
app.get('/games-fallback.json', (req, res) => {
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
