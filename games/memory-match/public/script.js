/* ============================================================
   Memory Match — flip cards, pair emojis, beat the clock.
   Customization: grid size, theme, player name.
   ============================================================ */

const cardGrid = document.getElementById('cardGrid');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const gridSizeSel = document.getElementById('gridSize');
const themeSel = document.getElementById('theme');
const playerNameInput = document.getElementById('playerName');
const timerEl = document.getElementById('timerEl');
const movesEl = document.getElementById('movesEl');
const pairsEl = document.getElementById('pairsEl');
const bestEl = document.getElementById('bestEl');
const statusEl = document.getElementById('status');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const winOverlay = document.getElementById('winOverlay');
const winStats = document.getElementById('winStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const scoresList = document.getElementById('scoresList');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const levelSelect = document.getElementById('levelSelect');

/* ---------- Emoji pool ---------- */
const EMOJIS = ['🍎','🍇','🍊','🍋','🍒','🍓','🍉','🍍','🥝','🥥','🍑','🥑','🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮'];

const THEMES = {
  classic: { back: 'linear-gradient(135deg, #ec4899, #8b5cf6)', front: '#1e293b', border: '#334155' },
  pink:    { back: 'linear-gradient(135deg, #fb7185, #e879f9)', front: '#27121f', border: '#9d2c4a' },
  gold:    { back: 'linear-gradient(135deg, #f59e0b, #a78bfa)', front: '#241d12', border: '#7c5a10' },
  ocean:   { back: 'linear-gradient(135deg, #06b6d4, #3b82f6)', front: '#0c2230', border: '#155e75' }
};

let config = {
  grid: [4, 4],   // [cols, rows]
  theme: 'classic'
};

/* ---------- Live state ---------- */
let cards = [];        // flat array: { id, emoji, matched }
let firstIndex = null; // first flipped card index
let secondIndex = null;
let lockBoard = false; // true while checking a mismatch
let selIndex = 0;      // keyboard highlight
let moves = 0;
let matched = 0;
let seconds = 0;
let timerId = null;
let running = false;
let paused = false;
let best = parseInt(localStorage.getItem('memoryBest') || '0', 10) || 0;
let level = 1;
bestEl.textContent = best;
function levelBand(value) { return value <= 10 ? 'Easy' : value <= 20 ? 'Medium' : 'Hard'; }
for (let value = 1; value <= 30; value += 1) { const option = document.createElement('option'); option.value = value; option.textContent = `${String(value).padStart(2, '0')} · ${levelBand(value)}`; levelSelect.appendChild(option); }

/* ---------- Control bindings ---------- */
gridSizeSel.addEventListener('change', () => {
  const v = gridSizeSel.value.split('x').map(Number);
  config.grid = [v[1], v[0]]; // [cols, rows]
});
levelSelect.addEventListener('change', () => { level = Number(levelSelect.value); config.grid = level <= 10 ? [4, 4] : level <= 20 ? [6, 4] : [6, 6]; gridSizeSel.value = `${config.grid[1]}x${config.grid[0]}`; });

themeSel.addEventListener('change', () => {
  config.theme = themeSel.value;
  refreshCardFaces();
});

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', () => { if (paused) togglePause(); });
playAgainBtn.addEventListener('click', () => {
  winOverlay.classList.remove('active');
  if (level < 30) { level += 1; levelSelect.value = String(level); levelSelect.dispatchEvent(new Event('change')); }
  startGame();
});
helpBtn.addEventListener('click', toggleHelp);
helpCloseBtn.addEventListener('click', toggleHelp);

document.addEventListener('keydown', onKey);

/* ---------- Init ---------- */
drawReadyState();
/* ---------- Game setup ---------- */
function totalCards() { return config.grid[0] * config.grid[1]; }

function buildDeck() {
  const pairsNeeded = totalCards() / 2;
  const pool = [...EMOJIS];
  // pick a random subset, then duplicate + shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = pool.slice(0, pairsNeeded);
  const deck = [...chosen, ...chosen];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startGame() {
  winOverlay.classList.remove('active');
  pauseOverlay.classList.remove('active');
  stopTimer();
  seconds = 0;
  moves = 0;
  matched = 0;
  firstIndex = null;
  secondIndex = null;
  lockBoard = false;
  selIndex = 0;
  running = true;
  paused = false;
  pauseBtn.disabled = false;
  pauseBtn.textContent = '⏸ Pause';

  const deck = buildDeck();
  cards = deck.map((emoji, i) => ({ id: i, emoji, matched: false }));

  movesEl.textContent = '0';
  pairsEl.textContent = '0';
  timerEl.textContent = '0.0s';
  statusEl.textContent = `Level ${level}/30 (${levelBand(level)}). Match the pairs to clear the ${config.grid[1]}×${config.grid[0]} board!`;

  renderGrid();
  startTimer();
  focusGameplay();
}

function startTimer() {
  stopTimer();
  timerId = setInterval(() => {
    if (running && !paused) {
      seconds++;
      timerEl.textContent = (seconds / 10).toFixed(1) + 's';
    }
  }, 100);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  statusEl.textContent = paused ? 'Paused. Press Esc to continue.' : 'Resumed!';
  if (paused) pauseOverlay.classList.add('active');
  else pauseOverlay.classList.remove('active');
}

/* ---------- Card interactions ---------- */
function onCardClick(i) {
  if (!running || paused || lockBoard) return;
  if (i === firstIndex) return;           // already flipped this card
  const card = cards[i];
  if (card.matched) return;               // ignore matched

  handleFlip(i);
}

function flipCard(i, match) {
  const el = document.querySelector(`[data-idx="${i}"]`);
  if (!el) return;
  if (match === 'matched') el.classList.add('matched');
  else el.classList.toggle('flipped');
  // keep matched cards permanently revealed
  if (match === 'matched') el.classList.remove('flipped');
}

function handleFlip(i) {
  if (firstIndex === null) {
    firstIndex = i;
    flipCard(i);
    return;
  }
  if (secondIndex === null) {
    secondIndex = i;
    moves++;
    movesEl.textContent = moves;
    flipCard(i);

    const a = cards[firstIndex];
    const b = cards[secondIndex];
    const isMatch = a.emoji === b.emoji;

    if (isMatch) {
      a.matched = true;
      b.matched = true;
      matched++;
      pairsEl.textContent = matched;
      // small delay to show both faces, then mark matched
      setTimeout(() => {
        flipCard(firstIndex, 'matched');
        flipCard(secondIndex, 'matched');
      }, 350);
      firstIndex = null;
      secondIndex = null;
      checkWin();
    } else {
      lockBoard = true;
      setTimeout(() => {
        flipCard(firstIndex);
        flipCard(secondIndex);
        firstIndex = null;
        secondIndex = null;
        lockBoard = false;
      }, 800);
    }
  }
}

function checkWin() {
  if (matched === cards.length / 2) {
    setTimeout(() => {
      running = false;
      stopTimer();
      pauseBtn.disabled = true;
      pauseBtn.textContent = '⏸ Pause';
      const sc = computeScore();
      winStats.textContent = `Level ${level}/30 (${levelBand(level)}) · Matched ${matched} pairs in ${moves} moves and ${(seconds / 10).toFixed(1)}s.`;
      playAgainBtn.textContent = level < 30 ? 'Next Level ▶' : 'Play Again';
      winOverlay.classList.add('active');
      statusEl.textContent = 'All pairs matched! Great memory.';
      saveHighScore(sc);
    }, 400);
  }
}

function computeScore() {
  const base = cards.length / 2 * 100; // pairs * 100
  const timePenalty = Math.floor((seconds / 10));
  const score = Math.max(0, base - moves * 5 - timePenalty * 10);
  if (score > best) { best = score; bestEl.textContent = best; localStorage.setItem('memoryBest', String(best)); }
  return score;
}
/* ---------- Rendering ---------- */
function currentTheme() { return THEMES[config.theme] || THEMES.classic; }

function renderGrid() {
  const grid = document.createElement('div');
  grid.className = 'card-grid';
  grid.style.gridTemplateColumns = `repeat(${config.grid[0]}, 78px)`;

  cards.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'card';
    btn.type = 'button';
    btn.dataset.idx = i;
    btn.style.width = '78px';
    btn.style.height = '92px';
    btn.setAttribute('aria-label', `Card ${i + 1}`);
    btn.addEventListener('click', () => onCardClick(i));

    const inner = document.createElement('div');
    inner.className = 'card-inner';
    inner.innerHTML = `
      <div class="card-face card-back">?</div>
      <div class="card-face card-front">${c.emoji}</div>
    `;
    btn.appendChild(inner);
    grid.appendChild(btn);
  });

  cardGrid.innerHTML = '';
  cardGrid.appendChild(grid);
  refreshCardFaces();
  renderSelection();
}

function refreshCardFaces() {
  const t = currentTheme();
  const innerEls = document.querySelectorAll('.card-back');
  innerEls.forEach((el) => {
    el.style.background = t.back;
  });
  const frontEls = document.querySelectorAll('.card-front');
  frontEls.forEach((el) => {
    el.style.background = t.front;
    el.style.borderColor = t.border;
  });
}

function renderSelection() {
  const cardsEl = document.querySelectorAll('.card');
  const nextSel = selectedIndex();
  cardsEl.forEach((c, i) => {
    c.classList.toggle('selected', i === nextSel);
  });
  setSelDataAttr(nextSel);
}

function setSelDataAttr(i) {
  const cardWrap = document.querySelector('.card-grid');
  if (cardWrap) cardWrap.dataset.sel = i;
}

function selectedIndex() {
  const grid = document.querySelector('.card-grid');
  return grid ? parseInt(grid.dataset.sel || '0', 10) : 0;
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
  if (e.key === 'n' || e.key === 'N') {
    e.preventDefault();
    startGame();
    return;
  }
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (running && !paused) onCardClick(selectedIndex());
    return;
  }

  const [cols] = config.grid;
  const idx = selectedIndex();
  let nx = null;
  if (e.key === 'ArrowRight') nx = (idx + 1) % cards.length;
  else if (e.key === 'ArrowLeft') nx = (idx - 1 + cards.length) % cards.length;
  else if (e.key === 'ArrowDown') nx = Math.min(idx + cols, cards.length - 1);
  else if (e.key === 'ArrowUp') nx = Math.max(idx - cols, 0);
  if (nx !== null) {
    e.preventDefault();
    setSelected(nx);
  }
}

function setSelected(i) {
  const vis = i < cards.length ? i : cards.length - 1;
  const grid = document.querySelector('.card-grid');
  if (grid) grid.dataset.sel = String(vis);
  renderSelection();
}

/* ---------- UI helpers ---------- */
function focusGameplay() {
  document.body.classList.add('in-game');
  const wrap = document.querySelector('.grid-wrap');
  if (wrap) {
    const target = wrap.getBoundingClientRect().top + window.scrollY - window.innerHeight / 2 + wrap.offsetHeight / 2;
    window.scrollTo({ top: Math.max(target, 0) - 60, behavior: 'smooth' });
  }
}

function toggleHelp() {
  const isOpen = helpOverlay.classList.contains('active');
  if (isOpen) helpOverlay.classList.remove('active');
  else helpOverlay.classList.add('active');
}

function drawReadyState() {
  cardGrid.innerHTML = `
    <div style="padding:6px">
      <p style="color:#94a3b8">Press “New Game” to start matching pairs.</p>
    </div>`;
}
/* ---------- Persistence / leaderboard ---------- */
function saveHighScore(sc) {
  const en = {
    name: playerNameInput.value.trim() || 'Player',
    score: sc,
    moves,
    pairs: matched,
    time: Math.floor(seconds / 10),
    gridSize: totalCards()
  };
  fetch('/api/memory/score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(en)
  }).catch(() => {}); // non-fatal if Mongo is down
  loadLeaderboard();
}

async function loadLeaderboard() {
  try {
    const res = await fetch('/api/memory/scores?limit=10');
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error();
    if (!data.length) { scoresList.innerHTML = '<li><span>No saved scores yet. Play a round!</span></li>'; return; }
    scoresList.innerHTML = data.map((s, i) => `
      <li>
        <span class="rank">#${i + 1} ${escapeHtml(s.name || 'Player')}</span>
        <span>${s.score} pts · ${s.moves} moves · <span class="lbl">${s.pairs} pairs</span></span>
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