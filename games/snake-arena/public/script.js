/* ============================================================
   Snake Arena — game logic
   Includes a customization system: speed, board size, food
   count, wall behavior, and color themes.
   ============================================================ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const boardSizeSel = document.getElementById('boardSize');
const foodCountSlider = document.getElementById('foodCount');
const foodCountValue = document.getElementById('foodCountValue');
const wallModeSel = document.getElementById('wallMode');
const themeSel = document.getElementById('theme');
const playerNameInput = document.getElementById('playerName');
const scoreEl = document.getElementById('scoreEl');
const lengthEl = document.getElementById('lengthEl');
const bestEl = document.getElementById('bestEl');
const statusEl = document.getElementById('status');
const scoresList = document.getElementById('scoresList');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverStats = document.getElementById('gameOverStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const levelSelect = document.getElementById('levelSelect');

const CELL = 22;

/* ---------- Config ---------- */
const SPEED_LABEL = ['', 'Slow', 'Casual', 'Normal', 'Fast', 'Blazing'];
// ms per tick, index by speed (1-5)
const SPEED_MS = [0, 170, 135, 105, 78, 55];

const THEMES = {
  classic: { bg: '#1e293b', fg: '#0f172a', snake: '#22c55e', head: '#86efac', food: '#ef4444', grid: '#273449' },
  neon:   { bg: '#0b1020', fg: '#0b1020', snake: '#22d3ee', head: '#a5f3fc', food: '#f0abfc', grid: '#1e2a4a' },
  gold:   { bg: '#1a1530', fg: '#1a1530', snake: '#f59e0b', head: '#fde68a', food: '#a78bfa', grid: '#2b2148' },
  ocean:  { bg: '#0a1f2e', fg: '#0a1f2e', snake: '#34d399', head: '#a7f3d0', food: '#60a5fa', grid: '#163b52' }
};

let config = {
  speed: 3,
  size: 32,
  foodCount: 2,
  wallMode: 'wrap',
  theme: 'classic'
};

/* ---------- Live state ---------- */
let snake = [];
let dir = { x: 1, y: 0 };        // current direction
let pendingDir = { x: 1, y: 0 }; // buffered next direction (prevents double-turn reversal)
let foods = [];
let score = 0;
let running = false;
let paused = false;
let tickMs = 105;
let best = parseInt(localStorage.getItem('snakeBest') || '0', 10) || 0;
let level = 1;
let foodEaten = 0;
let levelTarget = 6;
bestEl.textContent = best;
function levelBand(value) { return value <= 10 ? 'Easy' : value <= 20 ? 'Medium' : 'Hard'; }
for (let value = 1; value <= 30; value += 1) { const option = document.createElement('option'); option.value = value; option.textContent = `${String(value).padStart(2, '0')} · ${levelBand(value)}`; levelSelect.appendChild(option); }
/* ---------- Control bindings ---------- */
speedSlider.addEventListener('input', () => {
  config.speed = parseInt(speedSlider.value, 10);
  speedValue.textContent = SPEED_LABEL[config.speed];
  tickMs = SPEED_MS[config.speed];
  if (running && !paused) restartTimer();
});

boardSizeSel.addEventListener('change', () => {
  config.size = parseInt(boardSizeSel.value, 10);
  if (!running) applyBoardSize();
});

foodCountSlider.addEventListener('input', () => {
  config.foodCount = parseInt(foodCountSlider.value, 10);
  foodCountValue.textContent = config.foodCount;
});

wallModeSel.addEventListener('change', () => {
  config.wallMode = wallModeSel.value;
  statusEl.textContent = config.wallMode === 'wrap'
    ? 'Wrap mode: exiting one side re-enters the other.'
    : 'Death mode: hitting a wall ends the game.';
});

themeSel.addEventListener('change', () => {
  config.theme = themeSel.value;
  drawBoard();
});

startBtn.addEventListener('click', startGame);
levelSelect.addEventListener('change', () => { level = Number(levelSelect.value); });
pauseBtn.addEventListener('click', togglePause);
playAgainBtn.addEventListener('click', () => {
  gameOverOverlay.classList.remove('active');
  if (level < 30) { level += 1; levelSelect.value = String(level); }
  startGame();
});

function startGame() {
  gameOverOverlay.classList.remove('active');
  pauseOverlay.classList.remove('active');
  const cx = Math.floor(config.size / 2);
  const cy = Math.floor(config.size / 2);
  snake = [
    { x: cx, y: cy },
    { x: cx - 1, y: cy },
    { x: cx - 2, y: cy }
  ];
  dir = { x: 1, y: 0 };
  pendingDir = { x: 1, y: 0 };
  score = 0;
  foodEaten = 0;
  levelTarget = 5 + Math.ceil(level / 3);
  config.speed = parseInt(speedSlider.value, 10);
  tickMs = SPEED_MS[config.speed];
  scoreEl.textContent = '0';
  lengthEl.textContent = snake.length;
  running = true;
  paused = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = '⏸ Pause';
  statusEl.textContent = `Level ${level}/30 (${levelBand(level)}): eat ${levelTarget} food. Use arrow keys / WASD (or the D-pad).`;
  resizeCanvas();
  foods = [];
  spawnFoods(config.foodCount);
  drawBoard();
  startTimer();
  focusGameplay();
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  statusEl.textContent = paused ? 'Paused. Press Esc or click Resume to continue.' : 'Resumed!';
  if (paused) { stopTimer(); pauseOverlay.classList.add('active'); }
  else { pauseOverlay.classList.remove('active'); restartTimer(); }
  drawBoard();
}
/* ---------- Board & food helpers ---------- */
function resizeCanvas() {
  canvas.width = config.size * CELL;
  canvas.height = config.size * CELL;
}

function applyBoardSize() {
  resizeCanvas();
  if (running) { drawBoard(); }
}

function randomFreeCell() {
  while (true) {
    const x = Math.floor(Math.random() * config.size);
    const y = Math.floor(Math.random() * config.size);
    const onSnake = snake.some((s) => s.x === x && s.y === y);
    const onFood = foods.some((f) => f.x === x && f.y === y);
    if (!onSnake && !onFood) return { x, y };
  }
}

function spawnFoods(count) {
  for (let i = 0; i < count; i++) foods.push(randomFreeCell());
}

/* ---------- Game loop ---------- */
let loopId = null;
function startTimer() {
  stopTimer();
  loopId = setInterval(tick, tickMs);
}
function restartTimer() {
  if (!running || paused) return;
  stopTimer();
  loopId = setInterval(tick, tickMs);
}
function stopTimer() {
  if (loopId) clearInterval(loopId);
  loopId = null;
}

function tick() {
  if (!running || paused) return;
  step();
}

function step() {
  // commit buffered direction if it isn't a reversal
  if (!(pendingDir.x === -dir.x && pendingDir.y === -dir.y) &&
      !(pendingDir.x === dir.x && pendingDir.y === dir.y)) {
    dir = { ...pendingDir };
  }

  const head = snake[0];
  let nx = head.x + dir.x;
  let ny = head.y + dir.y;

  // Wall behavior
  if (config.wallMode === 'wrap') {
    nx = (nx + config.size) % config.size;
    ny = (ny + config.size) % config.size;
  } else if (nx < 0 || nx >= config.size || ny < 0 || ny >= config.size) {
    return handleGameOver('You hit the wall!');
  }

  // Self collision (ignore the tail cell, which will move)
  const isTouchingSelf = snake.slice(0, snake.length - 1).some(
    (s) => s.x === nx && s.y === ny
  );
  if (isTouchingSelf) {
    return handleGameOver('The snake bit itself!');
  }

  snake.unshift({ x: nx, y: ny });

  // Eat food?
  const foodIdx = foods.findIndex((f) => f.x === nx && f.y === ny);
  if (foodIdx !== -1) {
    foods.splice(foodIdx, 1);
    foodEaten += 1;
    score += 10;
    scoreEl.textContent = score;
    if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('snakeBest', String(best)); }
    spawnFoods(1); // keep the configured food count topped-up
    if (foodEaten >= levelTarget) return handleLevelComplete();
  } else {
    snake.pop();
  }

  lengthEl.textContent = snake.length;
  drawBoard();
}
/* ---------- Rendering ---------- */
function drawBoard() {
  const t = THEMES[config.theme] || THEMES.classic;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // subtle grid
  ctx.strokeStyle = t.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= config.size; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL, 0);
    ctx.lineTo(i * CELL, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL);
    ctx.lineTo(canvas.width, i * CELL);
    ctx.stroke();
  }

  // food
  foods.forEach((f) => {
    ctx.fillStyle = t.food;
    ctx.beginPath();
    ctx.arc(f.x * CELL + CELL / 2, f.y * CELL + CELL / 2, CELL / 2.4, 0, Math.PI * 2);
    ctx.fill();
  });

  // snack
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? t.head : t.snake;
    const pad = 1;
    ctx.fillRect(s.x * CELL + pad, s.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
  });

  // eyes on head
  const h = snake[0];
  const eyeDx = dir.x === 2 ? 8 : dir.x === -2 ? -8 : 6;
  const eyeDy = dir.y === 2 ? 8 : dir.y === -2 ? -8 : 6;
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(h.x * CELL + CELL / 2 - 4 + eyeDx, h.y * CELL + CELL / 2 - 5 + eyeDy, 3, 3);
  ctx.fillRect(h.x * CELL + CELL / 2 + 1 + eyeDx, h.y * CELL + CELL / 2 - 5 + eyeDy, 3, 3);
}

/* ---------- Input ---------- */
function setDirection(nx, ny) {
  pendingDir = { x: nx, y: ny };
}

/* ---------- UI helpers ---------- */
function focusGameplay() {
  document.body.classList.add('in-game');
  // smooth-scroll the board toward the vertical center of the viewport
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

resumeBtn.addEventListener('click', () => { if (paused) togglePause(); });
helpBtn.addEventListener('click', toggleHelp);
helpCloseBtn.addEventListener('click', toggleHelp);

const keyMap = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
  W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
};

document.addEventListener('keydown', (e) => {
  // Overlays take priority
  if (helpOverlay.classList.contains('active')) return;

  if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    toggleHelp();
    return;
  }
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    if (!running || paused === false) { startGame(); }
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    if (running) startGame();
    return;
  }

  // Movement
  const mv = keyMap[e.key];
  if (!mv) return;
  e.preventDefault();
  if (!running || paused) return;
  setDirection(mv[0], mv[1]);
});

document.querySelectorAll('.dpad-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!running) return;
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = map[btn.dataset.dir];
    setDirection(dx, dy);
  });
});

/* ---------- Game over ---------- */
function handleGameOver(reason) {
  running = false;
  stopTimer();
  pauseOverlay.classList.remove('active');
  pauseBtn.disabled = true;
  pauseBtn.textContent = '⏸ Pause';
  statusEl.textContent = reason || 'Game over!';
  gameOverStats.textContent = `Level ${level}/30 (${levelBand(level)}) · Score: ${score} · Length: ${snake.length}`;
  gameOverOverlay.classList.add('active');
  saveHighScore();
  loadLeaderboard();
}

function handleLevelComplete() {
  running = false;
  stopTimer();
  pauseBtn.disabled = true;
  statusEl.textContent = `Level ${level}/30 complete.`;
  gameOverStats.textContent = `Level ${level}/30 (${levelBand(level)}) complete · Score: ${score} · Length: ${snake.length}`;
  playAgainBtn.textContent = level < 30 ? 'Next Level ▶' : 'Play Again';
  gameOverOverlay.classList.add('active');
}

/* ---------- Persistence / leaderboard ---------- */
function saveHighScore() {
  const en = {
    name: playerNameInput.value.trim() || 'Player',
    score,
    length: snake.length,
    difficulty: config.speed,
    boardSize: config.size
  };
  fetch('/api/snake/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(en)
  }).catch(() => {}); // non-fatal if Mongo is down
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/snake/scores?limit=10');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error();
    if (!data.length) { scoresList.innerHTML = '<li><span>No saved scores yet. Play a round!</span></li>'; return; }
    scoresList.innerHTML = data.map((s, i) => `
      <li>
        <span class="rank">#${i + 1} ${escapeHtml(s.name || 'Player')}</span>
        <span>${s.score} pts · ${s.length} len · <span class="lbl">speed ${s.difficulty}</span></span>
      </li>`).join('');
  } catch (err) {
    scoresList.innerHTML = '<li><span>Leaderboard unavailable (MongoDB offline).</span></li>';
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

loadLeaderboard();