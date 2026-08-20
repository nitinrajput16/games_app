/* ============================================================
   Breakout Blast — bounce the ball, smash bricks, clear levels.
   Customization: ball speed, brick rows, theme, player name.
   Isometric canvas game with paddle + ball physics.
   ============================================================ */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const difficultySlider = document.getElementById('difficulty');
const difficultyValue = document.getElementById('difficultyValue');
const brickRowsSel = document.getElementById('brickRows');
const themeSel = document.getElementById('theme');
const playerNameInput = document.getElementById('playerName');
const scoreEl = document.getElementById('scoreEl');
const livesEl = document.getElementById('livesEl');
const levelEl = document.getElementById('levelEl');
const bestEl = document.getElementById('bestEl');
const statusEl = document.getElementById('status');
const scoresList = document.getElementById('scoresList');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const gameOverStats = document.getElementById('gameOverStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const levelClearOverlay = document.getElementById('levelClearOverlay');
const levelClearStats = document.getElementById('levelClearStats');
const nextLevelBtn = document.getElementById('nextLevelBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');

/* ---------- Config ---------- */
const SPEED_LABEL = ['', 'Slow', 'Casual', 'Normal', 'Fast', 'Blazing'];
const BASE_SPEED = [0, 4.2, 5.2, 6.2, 7.4, 8.8];   // ball speed px/frame
const ROWS_PER = { 5: 5, 8: 8, 10: 10 };

const THEMES = {
  classic: { bg: '#1e293b', paddle: '#38bdf8', ball: '#e2e8f0', bricks: ['#ef4444','#f97316','#facc15','#22c55e','#38bdf8','#818cf8'], text: '#cbd5e1' },
  neon:    { bg: '#0b1020', paddle: '#22d3ee', ball: '#a5f3fc', bricks: ['#f0abfc','#22d3ee','#a78bfa','#f43f5e','#34d399','#60a5fa'], text: '#94a3b8' },
  gold:    { bg: '#1a1530', paddle: '#f59e0b', ball: '#fde68a', bricks: ['#f59e0b','#fbbf24','#ef2338','#22c55e','#38bdf8','#a78bfa'], text: '#cbd5e1' },
  ocean:   { bg: '#0a1f2e', paddle: '#22d3ee', ball: '#e0faff', bricks: ['#38bdf8','#22d3ee','#2dd4bf','#34d399','#60a5fa','#818cf8'], text: '#a8d5e8' }
};

let config = {
  speed: 3,
  rows: 8,
  theme: 'classic'
};

/* ---------- Live state ---------- */
const W = 560, H = 720;
const PADDLE_W = 90, PADDLE_H = 14;
let paddle = { x: (W - PADDLE_W) / 2, y: H - 40 };
let ball = null;          // null until launched
let ballSpeed = 6.2;
let ballDir = { x: 0, y: -1 };
let ballRadius = 7;
let bricks = [];
let score = 0;
let lives = 3;
let level = 1;
let running = false;
let paused = false;
let serving = true;       // true when ball is stuck to paddle awaiting launch
let best = parseInt(localStorage.getItem('breakoutBest') || '0', 10) || 0;
bestEl.textContent = best;
/* ---------- Control bindings ---------- */
difficultySlider.addEventListener('input', () => {
  config.speed = parseInt(difficultySlider.value, 10);
  difficultyValue.textContent = SPEED_LABEL[config.speed];
  ballSpeed = BASE_SPEED[config.speed];
});

brickRowsSel.addEventListener('change', () => {
  config.rows = ROWS_PER[brickRowsSel.value] || 8;
});

themeSel.addEventListener('change', () => {
  config.theme = themeSel.value;
  if (running) draw();
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', () => { if (paused) togglePause(); });
playAgainBtn.addEventListener('click', () => {
  gameOverOverlay.classList.remove('active');
  startGame();
});
nextLevelBtn.addEventListener('click', () => {
  levelClearOverlay.classList.remove('active');
  startLevel(level >= 30 ? 1 : level + 1);
});
helpBtn.addEventListener('click', toggleHelp);
helpCloseBtn.addEventListener('click', toggleHelp);

document.addEventListener('keydown', onKey);
document.addEventListener('mousemove', (e) => { if (running && !paused) movePaddleToPointer(e); });
canvas.addEventListener('mousemove', (e) => { if (running && !paused) movePaddleToPointer(e); });
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (running && !paused) movePaddleToTouch(e.touches[0]);
});
canvas.addEventListener('click', () => { if (running && serving) launchBall(); });

/* ---------- Board builders ---------- */
function resizeCanvas() {
  canvas.width = W;
  canvas.height = H;
}

function buildBricks() {
  const cols = 8;
  const top = 70;
  const gap = 10;
  const bw = (W - 40 - gap * (cols - 1)) / cols;
  const bh = 24;
  const theme = THEMES[config.theme] || THEMES.classic;
  bricks = [];
  for (let r = 0; r < config.rows; r++) {
    for (let c = 0; c < cols; c++) {
      bricks.push({
        x: 20 + c * (bw + gap),
        y: top + r * (bh + gap),
        w: bw,
        h: bh,
        color: theme.bricks[r % theme.bricks.length],
        alive: true
      });
    }
  }
}

function resetBall() {
  serving = true;
  ball = {
    x: paddle.x + PADDLE_W / 2,
    y: paddle.y - ballRadius - 1,
    dx: 0,
    dy: 0,
    speed: ballSpeed
  };
}

function startGame() {
  gameOverOverlay.classList.remove('active');
  pauseOverlay.classList.remove('active');
  levelClearOverlay.classList.remove('active');
  score = 0;
  lives = 3;
  level = 1;
  scoreEl.textContent = '0';
  livesEl.textContent = '3';
  levelEl.textContent = '1';
  running = true;
  paused = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = '⏸ Pause';
  config.speed = parseInt(difficultySlider.value, 10);
  ballSpeed = BASE_SPEED[config.speed];
  resizeCanvas();
  startLevel(1);
  focusGameplay();
  startLoop();
}

function startLevel(lvl) {
  level = lvl;
  levelEl.textContent = `${lvl}/30`;
  config.rows = lvl <= 10 ? 5 : lvl <= 20 ? 8 : 10;
  brickRowsSel.value = String(config.rows);
  buildBricks();
  paddle.x = (W - PADDLE_W) / 2;
  resetBall();
  statusEl.textContent = `Level ${lvl}/30 (${lvl <= 10 ? 'Easy' : lvl <= 20 ? 'Medium' : 'Hard'}). Move the paddle and press Space to launch the ball.`;
  draw();
  if (!running) running = true;
}
/* ---------- Game loop ---------- */
let lastTime = null;
let rAFId = null;

function loop(now) {
  if (!running || paused) {
    return; // idle; startLoop resumes it
  }
  const deltaMs = lastTime === null ? 16 : Math.min(now - lastTime, 32);
  lastTime = now;
  step(deltaMs / 16.67);
  if (running && !paused && rAFId !== null) {
    rAFId = requestAnimationFrame(loop);
  }
}

function startLoop() {
  lastTime = null;
  if (rAFId) cancelAnimationFrame(rAFId);
  rAFId = requestAnimationFrame(loop);
}

function stopLoop() {
  if (rAFId) cancelAnimationFrame(rAFId);
  rAFId = null;
}

function step(frameScale) {
  if (serving) {
    // ball rides the paddle until launched
    ball.x = paddle.x + PADDLE_W / 2;
    ball.y = paddle.y - ballRadius - 1;
    draw();
    return;
  }

  const spd = ballSpeed * frameScale;
  ball.x += ball.dx * spd;
  ball.y += ball.dy * spd;

  // walls
  if (ball.x - ballRadius < 0) { ball.x = ballRadius; ball.dx = -ball.dx; }
  if (ball.x + ballRadius > W) { ball.x = W - ballRadius; ball.dx = -ball.dx; }
  if (ball.y - ballRadius < 0) { ball.y = ballRadius; ball.dy = -ball.dy; }

  // paddle collision
  if (ball.dy > 0 &&
      ball.y + ballRadius >= paddle.y &&
      ball.y + ballRadius <= paddle.y + PADDLE_H &&
      ball.x >= paddle.x - ballRadius &&
      ball.x <= paddle.x + PADDLE_W + ballRadius) {
    // reflect with angle based on where it hits
    const hit = (ball.x - (paddle.x + PADDLE_W / 2)) / (PADDLE_W / 2); // -1..1
    const angle = hit * 60 * Math.PI / 180;
    ball.dx = Math.sin(angle);
    ball.dy = -Math.cos(angle);
    // normalize to keep speed constant
    const mag = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
    ball.dx /= mag; ball.dy /= mag;
    ball.y = paddle.y - ballRadius - 1;
  }

  // bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    if (circleRect(ball.x, ball.y, ballRadius, b)) {
      b.alive = false;
      score += 10;
      scoreEl.textContent = score;
      if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('breakoutBest', String(best)); }
      // reflect ball based on hit side
      const closestX = Math.max(b.x, Math.min(ball.x, b.x + b.w));
      const closestY = Math.max(b.y, Math.min(ball.y, b.y + b.h));
      let dx = ball.x - closestX;
      let dy = ball.y - closestY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dist; dy /= dist;
      if (Math.abs(dx) > Math.abs(dy)) ball.dx = Math.sign(dx);
      else ball.dy = Math.sign(dy);
      break;
    }
  }

  // bottom lost ball
  if (ball.y - ballRadius > H) {
    lives--;
    livesEl.textContent = lives;
    if (lives <= 0) return gameOver();
    resetBall();
    statusEl.textContent = `Missed! ${lives} lives left. Press Space to serve.`;
  }

  // level cleared?
  if (bricks.length && bricks.every((b) => !b.alive)) {
    showLevelClear();
  }
  draw();
}

function overRect(a, b) {
  return a[0] < b[0] && a[0] + a[2] > b[0];
}

function overRectP(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return (dx * dx + dy * dy) <= (r * r);
}

function showLevelClear() {
  running = false;
  stopLoop();
  statusEl.textContent = 'Level cleared!';
  levelClearStats.textContent = `Score: ${score} · Next level at ${level + 1}`;
  levelClearOverlay.classList.add('active');
}

function gameOver() {
  running = false;
  stopLoop();
  pauseBtn.disabled = true;
  pauseBtn.textContent = '⏸ Pause';
  statusEl.textContent = 'Game over!';
  gameOverStats.textContent = `Score: ${score} · Level ${level} reached`;
  gameOverOverlay.classList.add('active');
  saveHighScore();
  loadLeaderboard();
}

/* ---------- Paddle + input ---------- */
function movePaddleToPointer(e) {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  let mx = (e.clientX - rect.left) * scaleX;
  paddle.x = mx - PADDLE_W / 2;
  clampPaddle();
}

function movePaddleToTouch(t) {
  paddle.x = (t.clientX - canvas.getBoundingClientRect().left) * (W / canvas.getBoundingClientRect().width) - PADDLE_W / 2;
  clampPaddle();
}

function clampPaddle() {
  paddle.x = Math.max(0, Math.min(W - PADDLE_W, paddle.x));
}

function launchBall() {
  if (!running || !serving) return;
  serving = false;
  const angle = -50 * Math.PI / 180 + Math.random() * 20 * Math.PI / 180 - 10 * Math.PI / 180;
  ball.dx = Math.sin(angle);
  ball.dy = -Math.cos(angle);
  statusEl.textContent = 'Ball launched! Keep it up.';
}
/* ---------- Pause ---------- */
function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  statusEl.textContent = paused ? 'Paused. Press Esc to continue.' : 'Resumed!';
  if (paused) { stopLoop(); pauseOverlay.classList.add('active'); }
  else { pauseOverlay.classList.remove('active'); startLoop(); }
  draw();
}

/* ---------- Drawing ---------- */
function draw() {
  const t = THEMES[config.theme] || THEMES.classic;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = t.bg;
  ctx.fillRect(0, 0, W, H);

  // bricks
  for (const b of bricks) {
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(b.x, b.y, b.w, 4);
  }

  // paddle
  ctx.fillStyle = t.paddle;
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H, 6);
    ctx.fill();
  } else {
    ctx.fillRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H);
  }

  // ball
  if (ball) {
    ctx.fillStyle = t.ball;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // serving hint
  if (serving) {
    ctx.fillStyle = t.text;
    ctx.font = '600 16px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Press Space or Click to launch', W / 2, H - 12);
  }
}

/* ---------- Keyboard ---------- */
function onKey(e) {
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
  if (e.key === ' ') {
    e.preventDefault();
    if (!running) { startGame(); return; }
    if (serving) launchBall();
    return;
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!running) startGame();
    else if (serving) launchBall();
    return;
  }
  if (e.key === 'r' || e.key === 'R') {
    e.preventDefault();
    if (running) startGame();
    return;
  }

  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    paddle.x -= 30;
    clampPaddle();
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    paddle.x += 30;
    clampPaddle();
  }
}

/* ---------- UI helpers ---------- */
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

/* ---------- Persistence / leaderboard ---------- */
function saveHighScore() {
  const en = {
    name: playerNameInput.value.trim() || 'Player',
    score,
    level,
    bricks: bricks.filter((b) => !b.alive).length,
    difficulty: config.speed
  };
  fetch('/api/breakout/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(en)
  }).catch(() => {}); // non-fatal if Mongo is down
  loadLeaderboard();
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/breakout/scores?limit=10');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error();
    if (!data.length) { scoresList.innerHTML = '<li><span>No saved scores yet. Play a round!</span></li>'; return; }
    scoresList.innerHTML = data.map((s, i) => `
      <li>
        <span class="rank">#${i + 1} ${escapeHtml(s.name || 'Player')}</span>
        <span>${s.score} pts · level ${s.level} · <span class="lbl">speed ${s.difficulty}</span></span>
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

draw();
loadLeaderboard();