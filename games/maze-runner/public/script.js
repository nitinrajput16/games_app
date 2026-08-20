const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
const generateBtn = document.getElementById('generateBtn');
const hintBtn = document.getElementById('hintBtn');
const resetBtn = document.getElementById('resetBtn');
const pauseBtn = document.getElementById('pauseBtn');
const difficultySlider = document.getElementById('difficulty');
const difficultyValue = document.getElementById('difficultyValue');
const statusEl = document.getElementById('status');
const historyList = document.getElementById('historyList');
const timerEl = document.getElementById('timer');
const moveCountEl = document.getElementById('moveCount');
const winOverlay = document.getElementById('winOverlay');
const winStats = document.getElementById('winStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const levelSelect = document.getElementById('levelSelect');

let currentMaze = null;   // { id, grid, width, height, start, end }
let hintPath = null;
let player = { x: 0, y: 0 };
let moveCount = 0;
let startTime = null;
let timerInterval = null;
let won = false;
let paused = false;
let elapsedOffset = 0;
let level = 1;
const CELL_SIZE = 20;

function levelBand(value) { return value <= 10 ? 'Easy' : value <= 20 ? 'Medium' : 'Hard'; }
for (let value = 1; value <= 30; value += 1) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = `${String(value).padStart(2, '0')} · ${levelBand(value)}`;
  levelSelect.appendChild(option);
}

difficultySlider.addEventListener('input', () => {
  difficultyValue.textContent = difficultySlider.value;
});

generateBtn.addEventListener('click', generateMaze);
hintBtn.addEventListener('click', showHint);
resetBtn.addEventListener('click', resetPosition);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', () => { if (paused) togglePause(); });
playAgainBtn.addEventListener('click', () => {
  winOverlay.classList.remove('active');
  if (level < 30) { level += 1; levelSelect.value = String(level); }
  generateMaze();
});
helpBtn.addEventListener('click', toggleHelp);
helpCloseBtn.addEventListener('click', toggleHelp);

document.addEventListener('keydown', (e) => {
  if (helpOverlay.classList.contains('active')) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    toggleHelp();
    return;
  }
  if (e.key === 'n' || e.key === 'N' || e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    generateMaze();
    return;
  }
  if (e.key === 'h' || e.key === 'H') {
    e.preventDefault();
    showHint();
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    resetPosition();
    return;
  }

  const map = {
    ArrowUp: 'up', w: 'up', W: 'up',
    ArrowDown: 'down', s: 'down', S: 'down',
    ArrowLeft: 'left', a: 'left', A: 'left',
    ArrowRight: 'right', d: 'right', D: 'right'
  };
  if (map[e.key]) {
    e.preventDefault();
    move(map[e.key]);
  }
});

document.querySelectorAll('.dpad-btn').forEach(btn => {
  btn.addEventListener('click', () => move(btn.dataset.dir));
});

// ---------- Game flow ----------

function setupGame() {
  player = { x: currentMaze.start.x, y: currentMaze.start.y };
  hintPath = null;
  moveCount = 0;
  won = false;
  paused = false;
  elapsedOffset = 0;
  moveCountEl.textContent = '0';
  hintBtn.disabled = false;
  resetBtn.disabled = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = '⏸ Pause';
  pauseOverlay.classList.remove('active');
  drawMaze();
  startTimer();
  focusGameplay();
}

function togglePause() {
  if (!currentMaze || won) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  statusEl.textContent = paused ? 'Paused. Press Esc to continue.' : 'Resumed!';
  if (paused) { elapsedOffset += Date.now() - startTime; stopTimer(); pauseOverlay.classList.add('active'); }
  else { pauseOverlay.classList.remove('active'); startTimer(); }
}

async function generateMaze() {
  statusEl.textContent = 'Generating maze...';
  generateBtn.disabled = true;
  stopTimer();
  try {
    const res = await fetch('/api/maze/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: difficultySlider.value })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate maze');

    currentMaze = data;
    setupGame();
    statusEl.textContent = `Level ${level}/30 (${levelBand(level)}). Maze ready (${data.width}x${data.height}). Navigate to the red tile!`;
    loadHistory();
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    generateBtn.disabled = false;
  }
}

function resetPosition() {
  if (!currentMaze) return;
  player = { x: currentMaze.start.x, y: currentMaze.start.y };
  moveCount = 0;
  hintPath = null;
  won = false;
  elapsedOffset = 0;
  moveCountEl.textContent = '0';
  drawMaze();
  startTimer();
  statusEl.textContent = 'Position reset. Keep going!';
}

function move(dir) {
  if (!currentMaze || won || paused) return;
  const deltas = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const [dx, dy] = deltas[dir];
  const nx = player.x + dx;
  const ny = player.y + dy;

  if (nx < 0 || nx >= currentMaze.width || ny < 0 || ny >= currentMaze.height) return;
  if (currentMaze.grid[ny][nx] !== 1) return; // wall

  player.x = nx;
  player.y = ny;
  moveCount++;
  moveCountEl.textContent = moveCount;
  drawMaze();

  if (player.x === currentMaze.end.x && player.y === currentMaze.end.y) {
    handleWin();
  }
}
function handleWin() {
  won = true;
  stopTimer();
  pauseOverlay.classList.remove('active');
  pauseBtn.disabled = true;
  pauseBtn.textContent = '⏸ Pause';
  const elapsed = ((elapsedOffset + Date.now() - startTime) / 1000).toFixed(1);
  winStats.textContent = `Level ${level}/30 (${levelBand(level)}) · ${moveCount} moves in ${elapsed}s`;
  playAgainBtn.textContent = level < 30 ? 'Next Level ▶' : 'Play Again';
  winOverlay.classList.add('active');
  statusEl.textContent = 'Maze solved!';
}

function startTimer() {
  stopTimer();
  startTime = Date.now();
  timerEl.textContent = (elapsedOffset / 1000).toFixed(1) + 's';
  timerInterval = setInterval(() => {
    const elapsed = (elapsedOffset + Date.now() - startTime) / 1000;
    timerEl.textContent = `${elapsed.toFixed(1)}s`;
  }, 100);
}

function stopTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
}

async function showHint() {
  if (!currentMaze) return;
  hintBtn.disabled = true;
  statusEl.textContent = 'Fetching hint path...';
  try {
    const res = await fetch(`/api/maze/solve/${currentMaze.id}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to solve maze');

    hintPath = data.path;
    drawMaze();
    statusEl.textContent = `Hint shown — shortest path is ${data.length} steps.`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  } finally {
    hintBtn.disabled = false;
  }
}

function drawMaze() {
  if (!currentMaze) return;
  const { grid, width, height, start, end } = currentMaze;

  canvas.width = width * CELL_SIZE;
  canvas.height = height * CELL_SIZE;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (grid[y][x] === 0) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  if (hintPath) {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.5)';
    hintPath.forEach(({ x, y }) => {
      ctx.fillRect(x * CELL_SIZE + 4, y * CELL_SIZE + 4, CELL_SIZE - 8, CELL_SIZE - 8);
    });
  }

  ctx.fillStyle = '#22c55e';
  ctx.fillRect(start.x * CELL_SIZE, start.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(end.x * CELL_SIZE, end.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

  // Player token
  ctx.fillStyle = '#818cf8';
  ctx.beginPath();
  ctx.arc(
    player.x * CELL_SIZE + CELL_SIZE / 2,
    player.y * CELL_SIZE + CELL_SIZE / 2,
    CELL_SIZE / 2.6,
    0, Math.PI * 2
  );
  ctx.fill();
}

// ---------- UI helpers ----------

function focusGameplay() {
  document.body.classList.add('in-game');
  const wrap = document.querySelector('.canvas-wrap');
  if (wrap) {
    const target = wrap.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + wrap.offsetHeight / 2;
    window.scrollTo({ top: Math.max(target, 0), behavior: 'smooth' });
  }
}

function toggleHelp() {
  const isOpen = helpOverlay.classList.contains('active');
  if (isOpen) helpOverlay.classList.remove('active');
  else helpOverlay.classList.add('active');
}

async function loadHistory() {
  try {
    const res = await fetch('/api/maze/history');
    const mazes = await res.json();
    historyList.innerHTML = mazes.map(m => `
      <li data-id="${m._id}">
        <span>${m.width}x${m.height} · difficulty ${m.difficulty}</span>
        <span>${m.solutionLength ? m.solutionLength + ' steps' : 'unplayed'}</span>
      </li>
    `).join('');

    document.querySelectorAll('.history li').forEach(li => {
      li.addEventListener('click', () => loadMazeById(li.dataset.id));
    });
  } catch (err) {
    console.error('Failed to load history', err);
  }
}

async function loadMazeById(id) {
  statusEl.textContent = 'Loading maze...';
  try {
    const res = await fetch(`/api/maze/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load maze');

    currentMaze = { id: data._id, ...data };
    setupGame();
    statusEl.textContent = `Loaded maze ${data.width}x${data.height}.`;
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
}

loadHistory();