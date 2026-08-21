const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Maze = require('../models/Maze');

// Keep the game playable when MongoDB is not configured or is temporarily down.
// These entries are process-local and are intentionally only a fallback; MongoDB
// remains the durable history store when it is available.
const localMazes = new Map();
let localMazeSequence = 0;

function databaseIsReady() {
  return mongoose.connection.readyState === 1;
}

function createLocalId() {
  localMazeSequence += 1;
  return `local-${Date.now()}-${localMazeSequence}`;
}

function localMazeSummary(maze) {
  return {
    _id: maze._id,
    width: maze.width,
    height: maze.height,
    difficulty: maze.difficulty,
    solutionLength: maze.solutionLength ?? null,
    createdAt: maze.createdAt
  };
}

// ---------- Maze generation (recursive backtracker) ----------
function generateMaze(width, height) {
  // Ensure odd dimensions for proper wall/path grid
  if (width % 2 === 0) width++;
  if (height % 2 === 0) height++;

  const grid = Array.from({ length: height }, () => Array(width).fill(0));

  function carve(x, y) {
    grid[y][x] = 1;
    const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
    for (let i = dirs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
    }
    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && grid[ny][nx] === 0) {
        grid[y + dy / 2][x + dx / 2] = 1;
        carve(nx, ny);
      }
    }
  }

  carve(1, 1);
  grid[1][0] = 1;              // start opening
  grid[height - 2][width - 1] = 1; // end opening

  return {
    grid,
    width,
    height,
    start: { x: 0, y: 1 },
    end: { x: width - 1, y: height - 2 }
  };
}

// ---------- BFS solver (guarantees shortest path) ----------
function solveMaze(grid, start, end) {
  const height = grid.length;
  const width = grid[0].length;
  const visited = Array.from({ length: height }, () => Array(width).fill(false));
  const prev = Array.from({ length: height }, () => Array(width).fill(null));
  const queue = [[start.x, start.y]];
  visited[start.y][start.x] = true;

  const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];

  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === end.x && y === end.y) break;

    for (const [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          grid[ny][nx] === 1 && !visited[ny][nx]) {
        visited[ny][nx] = true;
        prev[ny][nx] = [x, y];
        queue.push([nx, ny]);
      }
    }
  }

  if (!visited[end.y][end.x]) return null; // unsolvable (shouldn't happen)

  const path = [];
  let cur = [end.x, end.y];
  while (cur) {
    path.push({ x: cur[0], y: cur[1] });
    cur = prev[cur[1]][cur[0]];
  }
  return path.reverse();
}

// ---------- Routes ----------

// Generate a new maze and persist it when MongoDB is available.
router.post('/generate', async (req, res) => {
  try {
    const difficulty = Math.min(Math.max(parseInt(req.body.difficulty) || 3, 1), 5);
    const size = difficulty * 6 + 9; // scales with difficulty
    const { grid, width, height, start, end } = generateMaze(size, size);

    if (databaseIsReady()) {
      const maze = new Maze({ width, height, difficulty, grid, start, end });
      await maze.save();
      return res.json({ id: String(maze._id), width, height, difficulty, grid, start, end });
    }

    const id = createLocalId();
    const maze = { _id: id, width, height, difficulty, grid, start, end, solutionLength: null, createdAt: new Date() };
    localMazes.set(id, maze);
    while (localMazes.size > 20) localMazes.delete(localMazes.keys().next().value);
    return res.json({ id, width, height, difficulty, grid, start, end });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solve a maze by id
router.post('/solve/:id', async (req, res) => {
  try {
    const maze = req.params.id.startsWith('local-')
      ? localMazes.get(req.params.id)
      : databaseIsReady() ? await Maze.findById(req.params.id) : null;
    if (!maze) return res.status(404).json({ error: 'Maze not found' });

    const path = solveMaze(maze.grid, maze.start, maze.end);
    if (!path) return res.status(422).json({ error: 'No solution found' });

    maze.solutionLength = path.length;
    if (!req.params.id.startsWith('local-')) await maze.save();

    res.json({ path, length: path.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Solve an ad-hoc maze without needing it saved first
router.post('/solve-inline', (req, res) => {
  try {
    const { grid, start, end } = req.body;
    const path = solveMaze(grid, start, end);
    if (!path) return res.status(422).json({ error: 'No solution found' });
    res.json({ path, length: path.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get maze history
router.get('/history', async (req, res) => {
  try {
    if (!databaseIsReady()) {
      return res.json(Array.from(localMazes.values()).reverse().map(localMazeSummary));
    }
    const mazes = await Maze.find()
      .select('-grid')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(mazes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single maze by id
router.get('/:id', async (req, res) => {
  try {
    const maze = req.params.id.startsWith('local-')
      ? localMazes.get(req.params.id)
      : databaseIsReady() ? await Maze.findById(req.params.id) : null;
    if (!maze) return res.status(404).json({ error: 'Maze not found' });
    res.json(maze);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
