const boardEl = document.getElementById('board');
const modeEl = document.getElementById('mode');
const difficultyEl = document.getElementById('difficulty');
const markEl = document.getElementById('mark');
const nameEl = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBoardBtn');
const resumeBtn = document.getElementById('resumeBtn');
const timeEl = document.getElementById('timeEl');
const movesEl = document.getElementById('movesEl');
const winsEl = document.getElementById('winsEl');
const bestEl = document.getElementById('bestEl');
const statusEl = document.getElementById('status');
const pauseOverlay = document.getElementById('pauseOverlay');
const resultOverlay = document.getElementById('resultOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultStats = document.getElementById('resultStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const scoresList = document.getElementById('scoresList');
const levelSelect = document.getElementById('levelSelect');

let board = Array(9).fill('');
let currentPlayer = 'X';
let playerMark = 'X';
let aiMark = 'O';
let selected = 0;
let moves = 0;
let seconds = 0;
let timerId = null;
let running = false;
let paused = false;
let aiThinking = false;
let turnToken = 0;
let lastMove = -1;
let wins = Number(localStorage.getItem('ticTacToeWins') || 0);
let best = Number(localStorage.getItem('ticTacToeBest') || 0);
let level = 1;
let seriesWins = 0;
function levelBand(value) { return value <= 10 ? 'Easy' : value <= 20 ? 'Medium' : 'Hard'; }
function seriesTarget(value) { return value <= 10 ? 1 : 2; }
for (let value = 1; value <= 30; value += 1) { const option = document.createElement('option'); option.value = value; option.textContent = `${String(value).padStart(2, '0')} · ${levelBand(value)}`; levelSelect.appendChild(option); }
winsEl.textContent = wins;
bestEl.textContent = best;

const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function winner(state) { return lines.find(([a, b, c]) => state[a] && state[a] === state[b] && state[a] === state[c]); }
function formatTime(value) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
function available(state) { return state.map((value, index) => value ? -1 : index).filter((index) => index >= 0); }
function render() {
  boardEl.innerHTML = board.map((value, index) => `<button type="button" class="square ${value.toLowerCase()} ${index === lastMove ? 'last' : ''}" data-index="${index}" aria-label="Square ${index + 1}${value ? `, ${value}` : ''}" ${!running || paused || aiThinking || value ? 'disabled' : ''}>${value}</button>`).join('');
  boardEl.querySelectorAll('.square').forEach((square) => square.addEventListener('click', () => play(Number(square.dataset.index))));
  boardEl.querySelector('.square:not(:disabled)')?.focus();
}
function resetRound() { turnToken += 1; board = Array(9).fill(''); currentPlayer = 'X'; moves = 0; selected = 0; lastMove = -1; aiThinking = false; movesEl.textContent = '0'; statusEl.textContent = `Your turn (${playerMark}).`; render(); if (modeEl.value === 'computer' && playerMark === 'O') computerTurn(turnToken); }
function startGame() { clearInterval(timerId); playerMark = markEl.value; aiMark = playerMark === 'X' ? 'O' : 'X'; difficultyEl.value = level <= 10 ? 'easy' : level <= 20 ? 'medium' : 'hard'; seriesWins = 0; seconds = 0; timeEl.textContent = '00:00'; running = true; paused = false; pauseBtn.disabled = false; resetBtn.disabled = false; pauseBtn.textContent = '⏸ Pause'; pauseOverlay.classList.remove('active'); resultOverlay.classList.remove('active'); resetRound(); statusEl.textContent = `Level ${level}/30 (${levelBand(level)}): win ${seriesTarget(level)} game${seriesTarget(level) > 1 ? 's' : ''}.`; timerId = setInterval(() => { if (!paused) { seconds += 1; timeEl.textContent = formatTime(seconds); } }, 1000); }
function play(index) { if (!running || paused || aiThinking || board[index]) return; board[index] = currentPlayer; moves += 1; lastMove = index; movesEl.textContent = moves; if (finishIfNeeded()) return; currentPlayer = currentPlayer === 'X' ? 'O' : 'X'; render(); if (modeEl.value === 'computer' && currentPlayer === aiMark) computerTurn(); else statusEl.textContent = `Player ${currentPlayer}'s turn.`; }
function computerTurn(token = turnToken) { aiThinking = true; statusEl.textContent = 'Computer is thinking…'; render(); setTimeout(() => { if (token !== turnToken || !running) { aiThinking = false; return; } if (paused) { computerTurn(token); return; } const index = chooseMove(); board[index] = aiMark; moves += 1; lastMove = index; movesEl.textContent = moves; aiThinking = false; if (finishIfNeeded()) return; currentPlayer = playerMark; statusEl.textContent = `Your turn (${playerMark}).`; render(); }, difficultyEl.value === 'easy' ? 280 : 520); }
function chooseMove() { const open = available(board); if (difficultyEl.value === 'easy' && Math.random() < .65) return open[Math.floor(Math.random() * open.length)]; if (difficultyEl.value === 'medium' && Math.random() < .35) return open[Math.floor(Math.random() * open.length)]; let bestScore = -Infinity; let move = open[0]; open.forEach((index) => { board[index] = aiMark; const score = minimax(board, false); board[index] = ''; if (score > bestScore) { bestScore = score; move = index; } }); return move; }
function minimax(state, maximizing) { const winningLine = winner(state); if (winningLine) return state[winningLine[0]] === aiMark ? 10 : -10; if (!available(state).length) return 0; const scores = available(state).map((index) => { state[index] = maximizing ? aiMark : playerMark; const score = minimax(state, !maximizing); state[index] = ''; return score; }); return maximizing ? Math.max(...scores) : Math.min(...scores); }
function finishIfNeeded() { const winningLine = winner(board); const draw = !winningLine && !available(board).length; if (!winningLine && !draw) return false; running = false; clearInterval(timerId); pauseBtn.disabled = true; resetBtn.disabled = true; const result = winningLine ? (board[winningLine[0]] === playerMark ? 'win' : 'loss') : 'draw'; const score = result === 'win' ? Math.max(100, 1000 - seconds * 4 - moves * 10) : result === 'draw' ? 100 : 0; if (result === 'win') { wins += 1; localStorage.setItem('ticTacToeWins', String(wins)); winsEl.textContent = wins; } if (score > best) { best = score; localStorage.setItem('ticTacToeBest', String(best)); bestEl.textContent = best; } resultTitle.textContent = result === 'win' ? '🎉 You win!' : result === 'loss' ? 'Computer wins' : '🤝 Draw game'; resultStats.textContent = `${score} points · ${moves} moves · ${formatTime(seconds)}`; statusEl.textContent = result === 'win' ? 'Excellent play.' : 'Round complete.'; resultOverlay.classList.add('active'); render(); saveScore({ score, result }); return true; }
async function saveScore(data) { try { await fetch('/api/tic-tac-toe/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, name: nameEl.value.trim() || 'Player', mode: modeEl.value, difficulty: difficultyEl.value, moves, time: seconds }) }); loadScores(); } catch (error) { /* Local play remains available without MongoDB. */ } }
async function loadScores() { try { const response = await fetch('/api/tic-tac-toe/scores?limit=10'); if (!response.ok) throw new Error(); const data = await response.json(); scoresList.innerHTML = data.length ? data.map((score, index) => `<li><span><span class="rank">#${index + 1}</span> ${escapeHtml(score.name)}</span><span>${score.score} pts <span class="lbl">${score.result}</span></span></li>`).join('') : '<li>No saved scores yet. Play a round!</li>'; } catch (error) { scoresList.innerHTML = '<li>Leaderboard unavailable (MongoDB offline).</li>'; } }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function togglePause() { if (!running) return; paused = !paused; pauseOverlay.classList.toggle('active', paused); pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause'; statusEl.textContent = paused ? 'Paused.' : `Your turn (${currentPlayer}).`; render(); }
function toggleHelp() { helpOverlay.classList.toggle('active'); }
function onKey(event) { if (event.key === '?' || event.key.toLowerCase() === 'h') { event.preventDefault(); toggleHelp(); return; } if (helpOverlay.classList.contains('active')) return; if (event.key === 'Escape' || event.key.toLowerCase() === 'p') { togglePause(); return; } if (!running || paused) return; if (/^[1-9]$/.test(event.key)) play(Number(event.key) - 1); else if (event.key === 'Enter' || event.key === ' ') play(selected); else if (event.key === 'ArrowUp') selected = Math.max(0, selected - 3); else if (event.key === 'ArrowDown') selected = Math.min(8, selected + 3); else if (event.key === 'ArrowLeft') selected = Math.max(0, selected - 1); else if (event.key === 'ArrowRight') selected = Math.min(8, selected + 1); else if (event.key.toLowerCase() === 'r') startGame(); else return; event.preventDefault(); }

startBtn.addEventListener('click', startGame); levelSelect.addEventListener('change', () => { level = Number(levelSelect.value); }); pauseBtn.addEventListener('click', togglePause); resetBtn.addEventListener('click', resetRound); resumeBtn.addEventListener('click', togglePause); playAgainBtn.addEventListener('click', () => { if (level < 30) { level += 1; levelSelect.value = String(level); } startGame(); }); helpBtn.addEventListener('click', toggleHelp); helpCloseBtn.addEventListener('click', toggleHelp); document.addEventListener('keydown', onKey); render(); loadScores();
