const boardEl = document.getElementById('board');
const levelSelect = document.getElementById('levelSelect');
const themeSelect = document.getElementById('themeSelect');
const nameEl = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const resumeBtn = document.getElementById('resumeBtn');
const nextBtn = document.getElementById('nextBtn');
const helpBtn = document.getElementById('helpBtn');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const pauseOverlay = document.getElementById('pauseOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const helpOverlay = document.getElementById('helpOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultStats = document.getElementById('resultStats');
const statusEl = document.getElementById('status');
const levelEl = document.getElementById('levelEl');
const movesEl = document.getElementById('movesEl');
const timeEl = document.getElementById('timeEl');
const bestEl = document.getElementById('bestEl');
const scoresList = document.getElementById('scoresList');

const DIRECTIONS = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const ORDER = ['n', 'e', 's', 'w'];
const THEMES = { synth: { accent: '#fb7185', secondary: '#a78bfa' }, ice: { accent: '#67e8f9', secondary: '#60a5fa' }, ember: { accent: '#fbbf24', secondary: '#f97316' } };
let level = 0;
let width = 4;
let height = 4;
let solution = [];
let rotations = [];
let powered = new Set();
let moves = 0;
let seconds = 0;
let timerId = null;
let running = false;
let paused = false;
let best = Number(localStorage.getItem('neonCircuitBest') || 0);
bestEl.textContent = best;

function levelBand(index) { return index < 10 ? 'Easy' : index < 20 ? 'Medium' : 'Hard'; }
function gridSize(index) { return index < 10 ? 4 : index < 20 ? 5 + Math.floor((index - 10) / 5) : 6 + Math.floor((index - 20) / 4); }
function makeLevels() { for (let index = 0; index < 30; index += 1) { const option = document.createElement('option'); option.value = index; option.textContent = `${String(index + 1).padStart(2, '0')} · ${levelBand(index)}`; levelSelect.appendChild(option); } }
function rotateMask(mask) { return ((mask << 1) & 15) | ((mask >> 3) & 1); }
function buildLevel(index) { width = gridSize(index); height = width; solution = Array(width * height).fill(0); for (let row = 0; row < height; row += 1) { const leftToRight = row % 2 === 0; for (let column = 0; column < width - 1; column += 1) { const x = leftToRight ? column : width - 1 - column; const y = row; const current = y * width + x; const next = y * width + (leftToRight ? x + 1 : x - 1); solution[current] |= leftToRight ? 2 : 8; solution[next] |= leftToRight ? 8 : 2; } if (row < height - 1) { const end = row * width + (row % 2 === 0 ? width - 1 : 0); const next = (row + 1) * width + (row % 2 === 0 ? width - 1 : 0); solution[end] |= 4; solution[next] |= 1; } } rotations = solution.map((mask, tile) => (tile * 7 + index * 3 + 1) % 4); powered = new Set(); }
function maskAt(index) { let mask = solution[index]; for (let count = 0; count < rotations[index]; count += 1) mask = rotateMask(mask); return mask; }
function levelName() { return levelBand(level); }
function render() { boardEl.style.gridTemplateColumns = `repeat(${width}, 1fr)`; boardEl.innerHTML = ''; for (let index = 0; index < solution.length; index += 1) { const button = document.createElement('button'); button.type = 'button'; button.className = `tile ${index === 0 ? 'source' : ''} ${index === solution.length - 1 ? 'reactor' : ''} ${powered.has(index) ? 'powered' : ''}`; button.disabled = !running || paused; button.dataset.index = index; button.setAttribute('aria-label', `Circuit tile ${index + 1}`); const mask = maskAt(index); button.innerHTML = `<span class="core"></span>${ORDER.map((direction, bit) => mask & (1 << bit) ? `<i class="arm ${direction === 'n' ? '' : direction}"></i>` : '').join('')}`; button.addEventListener('click', () => rotate(index)); boardEl.appendChild(button); } levelEl.textContent = `${level + 1}/30 (${levelName()})`; movesEl.textContent = moves; timeEl.textContent = formatTime(seconds); }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
function rotate(index) { if (!running || paused) return; rotations[index] = (rotations[index] + 1) % 4; moves += 1; calculatePower(); render(); if (powered.has(solution.length - 1)) completeLevel(); }
function calculatePower() { powered = new Set([0]); const queue = [0]; while (queue.length) { const current = queue.shift(); const row = Math.floor(current / width); const column = current % width; for (const [bit, direction] of ORDER.entries()) { if (!(maskAt(current) & (1 << bit))) continue; const [dx, dy] = DIRECTIONS[direction]; const nextRow = row + dy; const nextColumn = column + dx; if (nextRow < 0 || nextRow >= height || nextColumn < 0 || nextColumn >= width) continue; const next = nextRow * width + nextColumn; const opposite = 1 << ((bit + 2) % 4); if ((maskAt(next) & opposite) && !powered.has(next)) { powered.add(next); queue.push(next); } } } }
function startGame() { clearInterval(timerId); level = Number(levelSelect.value); buildLevel(level); moves = 0; seconds = 0; running = true; paused = false; pauseBtn.disabled = false; resetBtn.disabled = false; pauseOverlay.classList.remove('active'); resultOverlay.classList.remove('active'); statusEl.textContent = `Level ${level + 1}: ${levelName()}. Route power to the reactor.`; calculatePower(); render(); timerId = setInterval(() => { if (!paused) { seconds += 1; timeEl.textContent = formatTime(seconds); } }, 1000); }
function resetLevel() { if (running) startGame(); }
function completeLevel() { running = false; clearInterval(timerId); pauseBtn.disabled = true; resetBtn.disabled = true; const score = Math.max(100, 1800 * (level + 1) - moves * 18 - seconds * 5); if (score > best) { best = score; localStorage.setItem('neonCircuitBest', String(best)); bestEl.textContent = best; } resultTitle.textContent = level === 29 ? '⚡ Grid Mastered' : '⚡ Circuit Live'; resultStats.textContent = `Level ${level + 1}/30 (${levelName()}) cleared in ${moves} moves and ${formatTime(seconds)}. Score: ${score}`; nextBtn.textContent = level === 29 ? 'Play Again' : 'Next Level ▶'; resultOverlay.classList.add('active'); render(); saveScore(score); }
function nextLevel() { level = level === 29 ? 0 : level + 1; levelSelect.value = level; startGame(); }
function togglePause() { if (!running) return; paused = !paused; pauseOverlay.classList.toggle('active', paused); pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause'; statusEl.textContent = paused ? 'Grid paused.' : 'Current restored.'; render(); }
function toggleHelp() { helpOverlay.classList.toggle('active'); }
async function saveScore(score) { try { await fetch('/api/neon-circuit/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: nameEl.value.trim() || 'Player', score, level: level + 1, moves, time: seconds }) }); loadScores(); } catch (error) { /* Local play remains available without MongoDB. */ } }
async function loadScores() { try { const response = await fetch('/api/neon-circuit/scores?limit=10'); if (!response.ok) throw new Error(); const data = await response.json(); scoresList.innerHTML = data.length ? data.map((score, index) => `<li><span><span class="rank">#${index + 1}</span> ${escapeHtml(score.name)}</span><span>${score.score} pts <span class="lbl">Level ${score.level}</span></span></li>`).join('') : '<li>No records yet. Complete a circuit!</li>'; } catch (error) { scoresList.innerHTML = '<li>Records unavailable (MongoDB offline).</li>'; } }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
startBtn.addEventListener('click', startGame); resetBtn.addEventListener('click', resetLevel); pauseBtn.addEventListener('click', togglePause); resumeBtn.addEventListener('click', togglePause); nextBtn.addEventListener('click', nextLevel); helpBtn.addEventListener('click', toggleHelp); helpCloseBtn.addEventListener('click', toggleHelp); themeSelect.addEventListener('change', () => { const colors = THEMES[themeSelect.value]; document.documentElement.style.setProperty('--accent', colors.accent); document.documentElement.style.setProperty('--secondary', colors.secondary); render(); });
document.addEventListener('keydown', (event) => { if (event.key === '?' || event.key.toLowerCase() === 'h') { event.preventDefault(); toggleHelp(); return; } if (helpOverlay.classList.contains('active')) return; if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { togglePause(); return; } if (event.key.toLowerCase() === 'r') { resetLevel(); return; } if (event.key === 'Enter' && document.activeElement?.dataset.index) { rotate(Number(document.activeElement.dataset.index)); } });
makeLevels(); buildLevel(0); calculatePower(); render(); loadScores();