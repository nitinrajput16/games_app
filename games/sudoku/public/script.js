const boardEl = document.getElementById('board');
const numpadEl = document.getElementById('numpad');
const difficultyEl = document.getElementById('difficulty');
const themeEl = document.getElementById('theme');
const playerNameEl = document.getElementById('playerName');
const autoCheckEl = document.getElementById('autoCheck');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const eraseBtn = document.getElementById('eraseBtn');
const notesBtn = document.getElementById('notesBtn');
const hintBtn = document.getElementById('hintBtn');
const timeEl = document.getElementById('timeEl');
const mistakesEl = document.getElementById('mistakesEl');
const hintsEl = document.getElementById('hintsEl');
const bestEl = document.getElementById('bestEl');
const statusEl = document.getElementById('status');
const pauseOverlay = document.getElementById('pauseOverlay');
const resumeBtn = document.getElementById('resumeBtn');
const winOverlay = document.getElementById('winOverlay');
const winStats = document.getElementById('winStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const helpBtn = document.getElementById('helpBtn');
const helpOverlay = document.getElementById('helpOverlay');
const helpCloseBtn = document.getElementById('helpCloseBtn');
const scoresList = document.getElementById('scoresList');
const levelSelect = document.getElementById('levelSelect');

const CLUES = { easy: 42, medium: 35, hard: 30, expert: 25 };
const THEME_ACCENTS = {
  cyan: '#38bdf8',
  ocean: '#2dd4bf',
  neon: '#f0abfc',
  gold: '#facc15'
};

let solution = [];
let puzzle = [];
let values = [];
let notes = [];
let selected = 0;
let mistakes = 0;
let hints = 3;
let seconds = 0;
let timerId = null;
let running = false;
let paused = false;
let notesMode = false;
let level = 1;

const bestKey = 'sudokuBest';
bestEl.textContent = localStorage.getItem(bestKey) || '0';
function levelBand(value) { return value <= 10 ? 'Easy' : value <= 20 ? 'Medium' : 'Hard'; }
for (let value = 1; value <= 30; value += 1) { const option = document.createElement('option'); option.value = value; option.textContent = `${String(value).padStart(2, '0')} · ${levelBand(value)}`; levelSelect.appendChild(option); }

function createGrid(fill = 0) {
  return Array.from({ length: 9 }, () => Array(9).fill(fill));
}

function shuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function isSafe(grid, row, column, value) {
  for (let index = 0; index < 9; index += 1) {
    if (grid[row][index] === value || grid[index][column] === value) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      if (grid[boxRow + rowOffset][boxColumn + columnOffset] === value) return false;
    }
  }
  return true;
}

function fillGrid(grid) {
  for (let row = 0; row < 9; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      if (grid[row][column] !== 0) continue;
      for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (isSafe(grid, row, column, value)) {
          grid[row][column] = value;
          if (fillGrid(grid)) return true;
          grid[row][column] = 0;
        }
      }
      return false;
    }
  }
  return true;
}

function countSolutions(grid, limit = 2) {
  let count = 0;
  function search() {
    let bestCell = null;
    let candidates = null;
    for (let row = 0; row < 9; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        if (grid[row][column] !== 0) continue;
        const available = [];
        for (let value = 1; value <= 9; value += 1) {
          if (isSafe(grid, row, column, value)) available.push(value);
        }
        if (!available.length) return;
        if (!candidates || available.length < candidates.length) {
          bestCell = [row, column];
          candidates = available;
          if (available.length === 1) break;
        }
      }
      if (candidates && candidates.length === 1) break;
    }
    if (!bestCell) {
      count += 1;
      return;
    }
    for (const value of candidates) {
      grid[bestCell[0]][bestCell[1]] = value;
      search();
      grid[bestCell[0]][bestCell[1]] = 0;
      if (count >= limit) return;
    }
  }
  search();
  return count;
}

function makePuzzle() {
  solution = createGrid();
  fillGrid(solution);
  puzzle = solution.map((row) => row.slice());
  const cells = shuffle(Array.from({ length: 81 }, (_, index) => index));
  const targetClues = Math.max(24, (CLUES[difficultyEl.value] || CLUES.easy) - Math.floor((level - 1) / 5));
  let clues = 81;
  for (const cell of cells) {
    if (clues <= targetClues) break;
    const row = Math.floor(cell / 9);
    const column = cell % 9;
    const original = puzzle[row][column];
    puzzle[row][column] = 0;
    const check = puzzle.map((currentRow) => currentRow.slice());
    if (countSolutions(check) !== 1) puzzle[row][column] = original;
    else clues -= 1;
  }
  values = puzzle.map((row) => row.slice());
  notes = Array.from({ length: 81 }, () => new Set());
}

function formatTime(value) {
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const remainder = (value % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function sameUnit(firstRow, firstColumn, secondRow, secondColumn) {
  return firstRow === secondRow || firstColumn === secondColumn ||
    (Math.floor(firstRow / 3) === Math.floor(secondRow / 3) &&
      Math.floor(firstColumn / 3) === Math.floor(secondColumn / 3));
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let index = 0; index < 81; index += 1) {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.dataset.r = row;
    cell.dataset.c = column;
    cell.dataset.box = `${Math.floor(row / 3)}-${Math.floor(column / 3)}`;
    cell.setAttribute('aria-label', `Row ${row + 1}, column ${column + 1}`);
    cell.addEventListener('click', () => selectCell(index));
    if (puzzle[row][column]) {
      cell.classList.add('given');
      cell.innerHTML = `<span class="value">${puzzle[row][column]}</span>`;
    } else if (values[row][column]) {
      cell.innerHTML = `<span class="value">${values[row][column]}</span>`;
    } else {
      const noteGrid = document.createElement('span');
      noteGrid.className = 'notes';
      for (let value = 1; value <= 9; value += 1) {
        const note = document.createElement('span');
        note.textContent = notes[index].has(value) ? value : '';
        note.className = notes[index].has(value) ? 'show' : '';
        noteGrid.appendChild(note);
      }
      cell.appendChild(noteGrid);
    }
    boardEl.appendChild(cell);
  }
  renderSelection();
}

function renderSelection() {
  const selectedValue = values[Math.floor(selected / 9)]?.[selected % 9] || 0;
  boardEl.querySelectorAll('.cell').forEach((cell, index) => {
    const row = Math.floor(index / 9);
    const column = index % 9;
    const selectedRow = Math.floor(selected / 9);
    const selectedColumn = selected % 9;
    cell.classList.toggle('selected', index === selected);
    cell.classList.toggle('peer', index !== selected && sameUnit(row, column, selectedRow, selectedColumn));
    cell.classList.toggle('same', selectedValue !== 0 && values[row][column] === selectedValue);
  });
}

function renderNumpad() {
  numpadEl.innerHTML = '';
  for (let value = 1; value <= 9; value += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.disabled = !running || paused;
    button.addEventListener('click', () => enterValue(value));
    numpadEl.appendChild(button);
  }
}

function selectCell(index) {
  if (!running || paused) return;
  selected = index;
  renderSelection();
}

function enterValue(value) {
  if (!running || paused || puzzle[Math.floor(selected / 9)][selected % 9]) return;
  const row = Math.floor(selected / 9);
  const column = selected % 9;
  if (notesMode) {
    if (values[row][column]) return;
    if (notes[selected].has(value)) notes[selected].delete(value);
    else notes[selected].add(value);
    renderBoard();
    return;
  }
  if (autoCheckEl.value === 'on' && solution[row][column] !== value) {
    mistakes += 1;
    mistakesEl.textContent = mistakes;
    const cell = boardEl.children[selected];
    cell.classList.add('error');
    statusEl.textContent = 'That number does not belong in this cell.';
    setTimeout(() => cell.classList.remove('error'), 350);
    return;
  }
  values[row][column] = value;
  notes[selected].clear();
  renderBoard();
  statusEl.textContent = 'Number entered.';
  if (isSolved()) finishGame();
}

function eraseValue() {
  if (!running || paused) return;
  const row = Math.floor(selected / 9);
  const column = selected % 9;
  if (!puzzle[row][column]) {
    values[row][column] = 0;
    notes[selected].clear();
    renderBoard();
  }
}

function isSolved() {
  return values.every((row, rowIndex) => row.every((value, columnIndex) => value === solution[rowIndex][columnIndex]));
}

function useHint() {
  if (!running || paused || hints <= 0) return;
  let index = selected;
  if (puzzle[Math.floor(index / 9)][index % 9]) {
    index = values.flatMap((row, rowIndex) => row.map((value, columnIndex) => ({ value, rowIndex, columnIndex })))
      .findIndex((cell) => !puzzle[cell.rowIndex][cell.columnIndex] && cell.value !== solution[cell.rowIndex][cell.columnIndex]);
    if (index < 0) index = values.flatMap((row, rowIndex) => row.map((value, columnIndex) => ({ value, rowIndex, columnIndex })))
      .findIndex((cell) => !puzzle[cell.rowIndex][cell.columnIndex] && cell.value === 0);
    if (index < 0) return;
  }
  const row = Math.floor(index / 9);
  const column = index % 9;
  values[row][column] = solution[row][column];
  notes[index].clear();
  selected = index;
  hints -= 1;
  hintsEl.textContent = hints;
  renderBoard();
  statusEl.textContent = 'Hint used.';
  if (isSolved()) finishGame();
}

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => {
    if (running && !paused) {
      seconds += 1;
      timeEl.textContent = formatTime(seconds);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerId);
  timerId = null;
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  pauseOverlay.classList.toggle('active', paused);
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  statusEl.textContent = paused ? 'Paused.' : 'Puzzle resumed.';
  renderNumpad();
}

function finishGame() {
  running = false;
  stopTimer();
  pauseBtn.disabled = true;
  eraseBtn.disabled = true;
  hintBtn.disabled = true;
  notesBtn.disabled = true;
  const score = Math.max(0, 1000 - seconds * 3 - mistakes * 50 - (3 - hints) * 40);
  const best = Number(localStorage.getItem(bestKey) || 0);
  if (score > best) {
    localStorage.setItem(bestKey, String(score));
    bestEl.textContent = score;
  }
  winStats.textContent = `Level ${level}/30 (${levelBand(level)}) | Score: ${score} | Time: ${formatTime(seconds)} | Mistakes: ${mistakes}`;
  playAgainBtn.textContent = level < 30 ? 'Next Level ▶' : 'Play Again';
  winOverlay.classList.add('active');
  statusEl.textContent = 'Puzzle solved!';
  saveScore(score);
  renderNumpad();
}

async function saveScore(score) {
  try {
    await fetch('/api/sudoku/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: playerNameEl.value.trim() || 'Player',
        score,
        difficulty: difficultyEl.value,
        mistakes,
        hints,
        time: seconds
      })
    });
    loadScores();
  } catch (error) {
    statusEl.textContent = 'Solved locally. Leaderboard is unavailable.';
  }
}

async function loadScores() {
  try {
    const response = await fetch('/api/sudoku/scores?limit=10');
    if (!response.ok) throw new Error('Unable to load scores');
    const scores = await response.json();
    scoresList.innerHTML = scores.length ? scores.map((entry, index) =>
      `<li><span><span class="rank">#${index + 1}</span>${escapeHtml(entry.name)}</span><span>${entry.score} pts <span class="lbl">${escapeHtml(entry.difficulty)}</span></span></li>`
    ).join('') : '<li>No scores yet.</li>';
  } catch (error) {
    scoresList.innerHTML = '<li>Leaderboard unavailable. Scores will still work locally.</li>';
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function toggleNotes() {
  if (!running || paused) return;
  notesMode = !notesMode;
  notesBtn.textContent = `✏️ Notes: ${notesMode ? 'On' : 'Off'}`;
  notesBtn.classList.toggle('active', notesMode);
}

function toggleHelp() {
  helpOverlay.classList.toggle('active');
}

function onKey(event) {
  if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    toggleHelp();
    return;
  }
  if (helpOverlay.classList.contains('active')) return;
  if (event.key === 'Escape' || event.key.toLowerCase() === 'p') {
    if (paused) togglePause();
    else togglePause();
    return;
  }
  if (!running || paused) return;
  const row = Math.floor(selected / 9);
  const column = selected % 9;
  if (event.key === 'ArrowUp') selected = ((row + 8) % 9) * 9 + column;
  else if (event.key === 'ArrowDown') selected = ((row + 1) % 9) * 9 + column;
  else if (event.key === 'ArrowLeft') selected = row * 9 + ((column + 8) % 9);
  else if (event.key === 'ArrowRight') selected = row * 9 + ((column + 1) % 9);
  else if (/^[1-9]$/.test(event.key)) enterValue(Number(event.key));
  else if (event.key === '0' || event.key === 'Backspace' || event.key === 'Delete') eraseValue();
  else if (event.key.toLowerCase() === 'n') toggleNotes();
  else if (event.key.toLowerCase() === 'c') autoCheckEl.value = autoCheckEl.value === 'on' ? 'off' : 'on';
  else if (event.key.toLowerCase() === 'h') useHint();
  else if (event.key.toLowerCase() === 'r') startGame();
  else return;
  event.preventDefault();
  renderSelection();
}

function startGame() {
  makePuzzle();
  selected = 0;
  mistakes = 0;
  hints = 3;
  seconds = 0;
  running = true;
  paused = false;
  notesMode = false;
  timeEl.textContent = '00:00';
  mistakesEl.textContent = '0';
  hintsEl.textContent = '3';
  pauseBtn.disabled = false;
  eraseBtn.disabled = false;
  hintBtn.disabled = false;
  notesBtn.disabled = false;
  pauseBtn.textContent = '⏸ Pause';
  notesBtn.textContent = '✏️ Notes: Off';
  notesBtn.classList.remove('active');
  pauseOverlay.classList.remove('active');
  winOverlay.classList.remove('active');
  document.body.classList.add('in-game');
  statusEl.textContent = `Level ${level}/30 (${levelBand(level)}). ${difficultyEl.options[difficultyEl.selectedIndex].text} puzzle ready.`;
  renderBoard();
  renderNumpad();
  startTimer();
}

startBtn.addEventListener('click', startGame);
levelSelect.addEventListener('change', () => { level = Number(levelSelect.value); difficultyEl.value = level <= 10 ? 'easy' : level <= 20 ? 'medium' : 'hard'; });
pauseBtn.addEventListener('click', togglePause);
resumeBtn.addEventListener('click', () => { if (paused) togglePause(); });
eraseBtn.addEventListener('click', eraseValue);
notesBtn.addEventListener('click', toggleNotes);
hintBtn.addEventListener('click', useHint);
helpBtn.addEventListener('click', toggleHelp);
helpCloseBtn.addEventListener('click', toggleHelp);
playAgainBtn.addEventListener('click', () => { if (level < 30) { level += 1; levelSelect.value = String(level); levelSelect.dispatchEvent(new Event('change')); } startGame(); });
themeEl.addEventListener('change', () => {
  document.documentElement.style.setProperty('--sudoku-accent', THEME_ACCENTS[themeEl.value] || THEME_ACCENTS.cyan);
});
document.addEventListener('keydown', onKey);

renderNumpad();
loadScores();