const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelSelect = document.getElementById('levelSelect');
const themeSelect = document.getElementById('themeSelect');
const playerName = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const resumeBtn = document.getElementById('resumeBtn');
const playAgainBtn = document.getElementById('playAgainBtn');
const helpBtn = document.getElementById('helpBtn');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const helpOverlay = document.getElementById('helpOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultStats = document.getElementById('resultStats');
const statusEl = document.getElementById('status');
const crystalsEl = document.getElementById('crystalsEl');
const movesEl = document.getElementById('movesEl');
const timeEl = document.getElementById('timeEl');
const bestEl = document.getElementById('bestEl');
const scoresList = document.getElementById('scoresList');

const BASE_LEVELS = [
  ['###############', '#P....#......E#', '#.....#.......#', '#.....#.......#', '#.............#', '#.....#.......#', '#.....#...*...#', '#.....#.......#', '#.............#', '#.............#', '###############'],
  ['###############', '#P..#.....#..E#', '#...#..*..#...#', '#...#.....#...#', '#.............#', '###.###.###.###', '#...#.....#...#', '#...#..*..#...#', '#...#.....#...#', '#.............#', '###############'],
  ['###############', '#P..#...^...*E#', '#...#.......#.#', '#...###.#####.#', '#.............#', '#.#####.###...#', '#...*...#.....#', '#.#####.#.###.#', '#.......#.....#', '#.............#', '###############']
];
const LEVELS = Array.from({ length: 30 }, (_, index) => BASE_LEVELS[index % BASE_LEVELS.length]);
function levelBand(index) { return index < 10 ? 'Easy' : index < 20 ? 'Medium' : 'Hard'; }
LEVELS.forEach((unused, index) => { const option = document.createElement('option'); option.value = index; option.textContent = `${String(index + 1).padStart(2, '0')} · ${levelBand(index)}`; levelSelect.appendChild(option); });
const THEMES = { teal: { accent: '#2dd4bf', wall: '#155e75', floor: '#0b2632', player: '#fcd34d', crystal: '#67e8f9', exit: '#a7f3d0', spike: '#fb7185' }, violet: { accent: '#c084fc', wall: '#5b21b6', floor: '#211538', player: '#fde68a', crystal: '#f0abfc', exit: '#ddd6fe', spike: '#fb7185' }, amber: { accent: '#fbbf24', wall: '#92400e', floor: '#2a2111', player: '#fef3c7', crystal: '#fde68a', exit: '#bef264', spike: '#f87171' } };
const GRAVITY = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const directions = ['up', 'right', 'down', 'left'];
let map = [];
let player = { x: 1, y: 1 };
let gravity = 'down';
let crystals = new Set();
let totalCrystals = 0;
let moves = 0;
let seconds = 0;
let timerId = null;
let running = false;
let paused = false;
let animating = false;
let best = Number(localStorage.getItem('gravitySwitchBest') || 0);
bestEl.textContent = best;

function tileSize() { return canvas.width / 15; }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
function theme() { return THEMES[themeSelect.value] || THEMES.teal; }
function cell(x, y) { return map[y]?.[x] || '#'; }
function walkable(x, y) { return cell(x, y) !== '#'; }
function parseLevel() { map = LEVELS[Number(levelSelect.value)].map((row) => row.split('')); crystals = new Set(); map.forEach((row, y) => row.forEach((value, x) => { if (value === 'P') { player = { x, y }; map[y][x] = '.'; } if (value === '*') crystals.add(`${x},${y}`); })); totalCrystals = crystals.size; }
function draw() {
  const colors = theme(); const size = tileSize(); ctx.clearRect(0, 0, canvas.width, canvas.height);
  map.forEach((row, y) => row.forEach((value, x) => { const px = x * size; const py = y * size; ctx.fillStyle = value === '#' ? colors.wall : colors.floor; ctx.fillRect(px, py, size, size); ctx.strokeStyle = 'rgba(148,163,184,.08)'; ctx.strokeRect(px, py, size, size); if (value === 'E') { ctx.fillStyle = colors.exit; ctx.fillRect(px + size * .2, py + size * .2, size * .6, size * .6); ctx.fillStyle = '#052e2b'; ctx.font = `${size * .28}px Segoe UI`; ctx.textAlign = 'center'; ctx.fillText('EXIT', px + size / 2, py + size * .57); } if (value === '^') { ctx.fillStyle = colors.spike; ctx.beginPath(); ctx.moveTo(px + size / 2, py + size * .17); ctx.lineTo(px + size * .82, py + size * .78); ctx.lineTo(px + size * .18, py + size * .78); ctx.closePath(); ctx.fill(); } }));
  crystals.forEach((key) => { const [x, y] = key.split(',').map(Number); const px = x * size + size / 2; const py = y * size + size / 2; ctx.fillStyle = colors.crystal; ctx.beginPath(); ctx.moveTo(px, py - size * .28); ctx.lineTo(px + size * .2, py); ctx.lineTo(px, py + size * .28); ctx.lineTo(px - size * .2, py); ctx.closePath(); ctx.fill(); });
  ctx.fillStyle = colors.player; ctx.beginPath(); ctx.arc(player.x * size + size / 2, player.y * size + size / 2, size * .29, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#172033'; ctx.beginPath(); ctx.arc(player.x * size + size * .42, player.y * size + size * .45, size * .045, 0, Math.PI * 2); ctx.arc(player.x * size + size * .58, player.y * size * 0 + player.y * size + size * .45, size * .045, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = colors.accent; ctx.font = `${size * .35}px Segoe UI`; ctx.textAlign = 'center'; ctx.fillText(gravity === 'up' ? '↑' : gravity === 'down' ? '↓' : gravity === 'left' ? '←' : '→', canvas.width - size * .55, size * .65);
}
function updateStats() { crystalsEl.textContent = `${totalCrystals - crystals.size}/${totalCrystals}`; movesEl.textContent = moves; timeEl.textContent = formatTime(seconds); }
function startGame() { clearInterval(timerId); parseLevel(); gravity = 'down'; moves = 0; seconds = 0; running = true; paused = false; animating = false; pauseBtn.disabled = false; resetBtn.disabled = false; pauseOverlay.classList.remove('active'); resultOverlay.classList.remove('active'); statusEl.textContent = `Level ${Number(levelSelect.value) + 1}/30 (${levelBand(Number(levelSelect.value))}). Switch gravity to reach the crystals and exit.`; updateStats(); draw(); timerId = setInterval(() => { if (!paused) { seconds += 1; updateStats(); } }, 1000); settle(); }
function resetGame() { if (running) startGame(); }
function switchGravity(next) { if (!running || paused || animating) return; gravity = next; moves += 1; statusEl.textContent = `Gravity: ${next}. Drift with A and D.`; settle(); }
function drift(direction) { if (!running || paused || animating) return; const vector = GRAVITY[gravity]; const perpendicular = { x: -vector.y, y: vector.x }; const amount = direction === 'left' ? -1 : 1; const nextX = player.x + perpendicular.x * amount; const nextY = player.y + perpendicular.y * amount; if (walkable(nextX, nextY)) { player.x = nextX; player.y = nextY; moves += 1; settle(); } }
function settle() { animating = true; const vector = GRAVITY[gravity]; const fall = () => { if (!running || paused) { animating = false; return; } const nextX = player.x + vector.x; const nextY = player.y + vector.y; if (walkable(nextX, nextY)) { player.x = nextX; player.y = nextY; collect(); draw(); if (cell(player.x, player.y) === 'E' || cell(player.x, player.y) === '^') { animating = false; checkState(); return; } requestAnimationFrame(fall); return; } animating = false; collect(); draw(); checkState(); }; requestAnimationFrame(fall); }
function collect() { crystals.delete(`${player.x},${player.y}`); }
function checkState() { if (cell(player.x, player.y) === '^') { endGame(false, 'The spikes caught you.'); return; } if (cell(player.x, player.y) === 'E' && crystals.size === 0) { endGame(true, 'Every crystal recovered.'); return; } if (cell(player.x, player.y) === 'E') statusEl.textContent = `The exit needs ${crystals.size} more crystal${crystals.size === 1 ? '' : 's'}.`; updateStats(); }
function endGame(won, message) { running = false; clearInterval(timerId); pauseBtn.disabled = true; resetBtn.disabled = true; const levelNumber = Number(levelSelect.value) + 1; const score = won ? Math.max(100, 1500 - moves * 25 - seconds * 4) : 0; if (score > best) { best = score; localStorage.setItem('gravitySwitchBest', String(best)); bestEl.textContent = best; } resultTitle.textContent = won ? '✦ Orbit Escaped' : '☄ Mission Lost'; resultStats.textContent = `${message} Level ${levelNumber}/30 (${levelBand(levelNumber - 1)}). Score: ${score} · ${moves} moves · ${formatTime(seconds)}`; statusEl.textContent = won ? 'Level complete.' : 'Try a different gravity sequence.'; resultOverlay.classList.add('active'); playAgainBtn.textContent = won && levelNumber < 30 ? 'Next Level ▶' : 'Play Again'; saveScore(score); }
async function saveScore(score) { try { await fetch('/api/gravity-switch/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: playerName.value.trim() || 'Player', score, level: Number(levelSelect.value) + 1, moves, time: seconds }) }); loadScores(); } catch (error) { /* Persistence is optional while MongoDB is offline. */ } }
async function loadScores() { try { const response = await fetch('/api/gravity-switch/scores?limit=10'); if (!response.ok) throw new Error(); const data = await response.json(); scoresList.innerHTML = data.length ? data.map((score, index) => `<li><span><span class="rank">#${index + 1}</span> ${escapeHtml(score.name)}</span><span>${score.score} pts <span class="lbl">Level ${score.level}</span></span></li>`).join('') : '<li>No records yet. Complete a mission!</li>'; } catch (error) { scoresList.innerHTML = '<li>Records unavailable (MongoDB offline).</li>'; } }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function togglePause() { if (!running) return; paused = !paused; pauseOverlay.classList.toggle('active', paused); pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause'; statusEl.textContent = paused ? 'Mission paused.' : 'Mission resumed.'; if (!paused) settle(); }
function toggleHelp() { helpOverlay.classList.toggle('active'); }
document.querySelectorAll('[data-gravity]').forEach((button) => button.addEventListener('click', () => switchGravity(button.dataset.gravity)));
document.getElementById('centerGravity').addEventListener('click', () => switchGravity(directions[(directions.indexOf(gravity) + 2) % 4]));
startBtn.addEventListener('click', startGame); resetBtn.addEventListener('click', resetGame); pauseBtn.addEventListener('click', togglePause); resumeBtn.addEventListener('click', togglePause); playAgainBtn.addEventListener('click', () => { const next = Number(levelSelect.value) + 1; if (next < 30 && playAgainBtn.textContent.includes('Next')) levelSelect.value = String(next); startGame(); }); helpBtn.addEventListener('click', toggleHelp); helpCloseBtn.addEventListener('click', toggleHelp); themeSelect.addEventListener('change', draw);
document.addEventListener('keydown', (event) => { if (event.key === '?' || event.key.toLowerCase() === 'h') { event.preventDefault(); toggleHelp(); return; } if (helpOverlay.classList.contains('active')) return; if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { togglePause(); return; } if (event.key.toLowerCase() === 'r') { resetGame(); return; } if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); switchGravity(event.key.slice(5).toLowerCase()); return; } if (event.key.toLowerCase() === 'a') drift('left'); if (event.key.toLowerCase() === 'd') drift('right'); });
draw(); loadScores();