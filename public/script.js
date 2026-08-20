/* ============================================================
   GameHUB — front-end behavior
   Loads the game registry from /api/games and renders the
   featured hero + card grid with live search & category filters.
   ============================================================ */

const grid = document.getElementById('grid');
const filterChips = document.getElementById('filterChips');
const searchInput = document.getElementById('searchInput');
const libraryCount = document.getElementById('libraryCount');
const navCount = document.getElementById('navCount');
const featuredLaunchBtn = document.getElementById('featuredLaunchBtn');
const heroArt = document.getElementById('heroArt');
const emptyState = document.getElementById('emptyState');
const toast = document.getElementById('toast');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalMeta = document.getElementById('modalMeta');
const modalPlay = document.getElementById('modalPlay');
const modalClose = document.getElementById('modalClose');

let games = [];
let activeTag = 'all';

const DIFFICULTY_LABEL = ['Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const CATEGORIES = ['all', 'puzzle', 'arcade', 'strategy', 'action', 'classic', 'adventure', 'highscore'];

/* ---------- Load registry ---------- */
async function loadGames() {
  try {
    const res = await fetch('/api/games');
    const data = await res.json();
    games = data.games || [];
  } catch (err) {
    libraryCount.textContent = 'Library unavailable — start the server.';
    grid.innerHTML = `<p class="empty-state">Could not reach the API. ${err.message}</p>`;
    return;
  }
  buildChips();
  render();
}

/* ---------- Category chips ---------- */
function buildChips() {
  const counts = { all: games.length };
  games.forEach((g) => g.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));

  filterChips.innerHTML = '';
  CATEGORIES.forEach((cat) => {
    if (cat !== 'all' && !counts[cat]) return; // skip empty categories
    const chip = document.createElement('button');
    chip.className = 'chip' + (cat === activeTag ? ' active' : '');
    chip.textContent = cat[0].toUpperCase() + cat.slice(1) + ` (${counts[cat] || 0})`;
    chip.dataset.cat = cat;
    chip.addEventListener('click', () => {
      activeTag = cat;
      buildChips();
      render();
    });
    filterChips.appendChild(chip);
  });
}

/* ---------- Filter + render ---------- */
function filteredGames() {
  const q = searchInput.value.trim().toLowerCase();
  return games.filter((g) => {
    const matchesTag = activeTag === 'all' || g.tags.includes(activeTag);
    const matchesQ = !q ||
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.tags.some((t) => t.includes(q));
    return matchesTag && matchesQ;
  });
}
function render() {
  const visible = filteredGames();
  libraryCount.textContent = `${visible.length} of ${games.length} games`;
  const liveCount = games.filter((g) => g.status === 'live').length;
  navCount.textContent = `${liveCount} live · ${games.length} games`;

  emptyState.hidden = visible.length !== 0;
  grid.innerHTML = '';
  visible.forEach((g) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = g.id;

    const isLive = g.status === 'live';
    const diffLabel = DIFFICULTY_LABEL[Math.min(g.difficulty, 5) - 1] || 'Medium';

    card.innerHTML = `
      <div class="card-top">
        <span class="card-emoji">${g.emoji}</span>
        <span class="status-badge ${isLive ? 'live' : 'soon'}">${isLive ? '● LIVE' : '◌ COMING SOON'}</span>
      </div>
      <div class="card-body">
        <h3>${g.title}</h3>
        <p class="card-desc">${g.description}</p>
      </div>
      <div class="card-tags">
        ${g.tags.map((t) => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="card-footer">
        <span class="card-diff">Difficulty: ${diffLabel}</span>
        ${isLive
          ? `<a class="card-cta play" href="${g.url}" target="_blank" rel="noopener">▶ Play</a>`
          : `<span class="card-cta soons">⏳ Soon</span>`}
      </div>`;

    card.addEventListener('click', () => openModal(g));
    grid.appendChild(card);
  });

  renderHero(visible);
}

/* ---------- Hero ---------- */
function renderHero(visible) {
  const featured = visible.find((g) => g.featured) || visible[0];
  if (!featured) return;
  heroArt.textContent = featured.emoji;
  featuredLaunchBtn.disabled = false;
  featuredLaunchBtn.textContent = `▶ Play ${featured.title}`;
  featuredLaunchBtn.dataset.url = featured.url;
  featuredLaunchBtn.dataset.status = featured.status;
}

/* ---------- Modal + toast ---------- */
function openModal(g) {
  if (g.status !== 'live') {
    showToast(`${g.title} is coming soon — stay tuned!`);
    return;
  }
  modal.hidden = false;
  modalTitle.textContent = g.emoji + ' ' + g.title;
  modalDesc.textContent = g.description;
  modalMeta.innerHTML = g.tags.map((t) => `<span class="tag">${t}</span>`).join('');
  modalPlay.href = g.url;
  modalPlay.textContent = '▶ Play Now';
}

modalClose.addEventListener('click', () => { modal.hidden = true; });
modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });

featuredLaunchBtn.addEventListener('click', () => {
  const status = featuredLaunchBtn.dataset.status;
  if (status !== 'live') { showToast('This featured game is coming soon!'); return; }
  window.open(featuredLaunchBtn.dataset.url, '_blank');
});

searchInput.addEventListener('input', render);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
});

/* ---------- Toast ---------- */
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* init */
loadGames();