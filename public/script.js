const grid = document.getElementById('grid');
const filterChips = document.getElementById('filterChips');
const searchInput = document.getElementById('searchInput');
const libraryCount = document.getElementById('libraryCount');
const navCount = document.getElementById('navCount');
const featuredLaunchBtn = document.getElementById('featuredLaunchBtn');
const heroDesc = document.getElementById('heroDesc');
const heroGameLabel = document.getElementById('heroGameLabel');
const emptyState = document.getElementById('emptyState');
const spotlightRail = document.getElementById('spotlightRail');
const toast = document.getElementById('toast');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalMeta = document.getElementById('modalMeta');
const modalPlay = document.getElementById('modalPlay');
const modalClose = document.getElementById('modalClose');
const preloader = document.getElementById('preloader');
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');
const RECENT_KEY = 'gamehubRecentlyPlayed';
const DIFFICULTY_LABEL = ['Easy', 'Easy', 'Medium', 'Hard', 'Expert'];
const IMAGE_POOL = [
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?auto=format&fit=crop&w=900&q=80'
];
let games = [];
let activeTag = 'all';
let featuredGame = null;
let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function imageFor(game, index = 0) { return game.image || IMAGE_POOL[(index + String(game.id || '').length) % IMAGE_POOL.length]; }
function difficulty(game) { return DIFFICULTY_LABEL[Math.min(Number(game.difficulty) || 3, 5) - 1] || 'Medium'; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function readRecent() { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
function recordRecent(id) { localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...readRecent().filter((item) => item !== id)].slice(0, 8))); }
function levelCount(game) { return game.id === 'coin-flip' || game.id === 'rock-paper-scissors' ? 'quick play' : '30 levels'; }

async function loadGames() {
  try { const response = await fetch('/api/games'); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); games = Array.isArray(data.games) ? data.games : []; }
  catch (error) { try { const response = await fetch('/games-fallback.json'); const data = await response.json(); games = Array.isArray(data.games) ? data.games : []; libraryCount.textContent = 'Offline catalog Â· live games remain playable'; } catch (fallbackError) { libraryCount.textContent = 'Library unavailable â€” start the server.'; emptyState.hidden = false; emptyState.textContent = `Could not reach the game catalog. ${error.message}`; return; } }
  buildChips(); render(); createSpotlight(); initAnimations();
}

function buildChips() {
  const counts = { all: games.length }; games.forEach((game) => (game.tags || []).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; })); filterChips.innerHTML = '';
  ['all', ...Object.keys(counts).filter((tag) => tag !== 'all').sort()].forEach((category) => { const chip = document.createElement('button'); chip.type = 'button'; chip.className = `chip${category === activeTag ? ' active' : ''}`; chip.textContent = `${category[0].toUpperCase()}${category.slice(1)} (${counts[category]})`; chip.addEventListener('click', () => { activeTag = category; buildChips(); render(); animateGrid(); }); filterChips.appendChild(chip); });
}

function filteredGames() { const query = searchInput.value.trim().toLowerCase(); return games.filter((game) => { const tags = game.tags || []; return (activeTag === 'all' || tags.includes(activeTag)) && (!query || [game.title, game.description, ...tags].some((value) => String(value).toLowerCase().includes(query))); }); }
function cardMarkup(game) { const live = game.status === 'live'; return `<article class="card tilt-card" data-id="${escapeHtml(game.id)}"><div class="card-top"><span class="card-emoji">${game.emoji || 'ðŸŽ®'}</span><span class="status-badge ${live ? 'live' : 'soons'}">${live ? 'â— LIVE' : 'â—Œ SOON'}</span></div><div class="card-body"><h3>${escapeHtml(game.title)}</h3><p class="card-desc">${escapeHtml(game.description)}</p></div><div class="card-tags">${(game.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div><div class="card-footer"><span class="card-diff">${difficulty(game)} Â· ${game.id === 'coin-flip' || game.id === 'rock-paper-scissors' ? 'quick play' : '30 levels'}</span>${live ? `<a class="card-cta play" href="${game.url}" data-play-id="${escapeHtml(game.id)}" target="_blank" rel="noopener">Play â†—</a>` : '<span class="card-cta soons">Soon</span>'}</div></article>`; }
function renderCards(list, target) { target.innerHTML = list.length ? list.map(cardMarkup).join('') : '<p class="shelf-empty">Nothing here yet.</p>'; target.querySelectorAll('.card').forEach((card) => { const game = games.find((item) => item.id === card.dataset.id); card.addEventListener('click', (event) => { if (!event.target.closest('[data-play-id]')) openModal(game); }); addTilt(card); }); target.querySelectorAll('[data-play-id]').forEach((link) => link.addEventListener('click', () => recordRecent(link.dataset.playId))); }
function render() { const visible = filteredGames(); libraryCount.textContent = `${visible.length} of ${games.length} worlds online`; navCount.textContent = `${games.filter((game) => game.status === 'live').length} live Â· ${games.length} games`; emptyState.hidden = visible.length !== 0; renderCards(visible, grid); featuredGame = visible.find((game) => game.featured) || visible[0]; if (featuredGame) { heroGameLabel.textContent = `GAMEHUB / ${String(games.indexOf(featuredGame) + 1).padStart(3, '0')} Â· ${featuredGame.title.toUpperCase()}`; featuredLaunchBtn.textContent = `Play ${featuredGame.title}`; featuredLaunchBtn.disabled = featuredGame.status !== 'live'; featuredLaunchBtn.dataset.url = featuredGame.url; featuredLaunchBtn.dataset.playId = featuredGame.id; heroDesc.textContent = featuredGame.description; } }
function createSpotlight() { const picks = [...games].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 5); spotlightRail.innerHTML = picks.map((game, index) => `<article class="spotlight-card tilt-card" data-id="${escapeHtml(game.id)}"><div class="spotlight-card-art" style="background-image:linear-gradient(180deg,transparent 25%,#0b0c0f 100%),url('${imageFor(game, index)}')"><span>${game.emoji || 'ðŸŽ®'}</span></div><div class="spotlight-card-copy"><p>${escapeHtml((game.tags || ['arcade'])[0])} / ${String(index + 1).padStart(2, '0')}</p><h3>${escapeHtml(game.title)}</h3></div></article>`).join(''); spotlightRail.querySelectorAll('.spotlight-card').forEach((card) => { card.addEventListener('click', () => openModal(games.find((game) => game.id === card.dataset.id))); addTilt(card); }); }
function openModal(game) { if (!game) return; if (game.status !== 'live') return showToast(`${game.title} is coming soon.`); modal.hidden = false; modalTitle.textContent = `${game.emoji || 'ðŸŽ®'} ${game.title}`; modalDesc.textContent = game.description; modalMeta.innerHTML = [...(game.tags || []), difficulty(game), levelCount(game)].map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(''); modalPlay.href = game.url; modalPlay.dataset.playId = game.id; }
function showToast(message) { toast.textContent = message; toast.classList.add('show'); window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400); }
function addTilt(element) { if (reducedMotion || element.dataset.tiltReady) return; element.dataset.tiltReady = 'true'; element.addEventListener('pointermove', (event) => { const rect = element.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - .5; const y = (event.clientY - rect.top) / rect.height - .5; element.style.transform = `perspective(900px) rotateX(${y * -5}deg) rotateY(${x * 6}deg) translateY(-5px)`; }); element.addEventListener('pointerleave', () => { element.style.transform = ''; }); }
function initCursor() { if (reducedMotion || window.matchMedia('(pointer: coarse)').matches) return; let mouseX = innerWidth / 2; let mouseY = innerHeight / 2; let ringX = mouseX; let ringY = mouseY; window.addEventListener('pointermove', (event) => { mouseX = event.clientX; mouseY = event.clientY; cursorDot.style.transform = `translate(${mouseX}px,${mouseY}px) translate(-50%,-50%)`; }); const follow = () => { ringX += (mouseX - ringX) * .13; ringY += (mouseY - ringY) * .13; cursorRing.style.transform = `translate(${ringX}px,${ringY}px) translate(-50%,-50%)`; requestAnimationFrame(follow); }; follow(); document.querySelectorAll('a,button,.card,.play-orb').forEach((element) => { element.addEventListener('pointerenter', () => cursorRing.classList.add('is-hover')); element.addEventListener('pointerleave', () => cursorRing.classList.remove('is-hover')); }); }
function initAnimations() { if (reducedMotion || typeof gsap === 'undefined') { preloader.remove(); return; } gsap.registerPlugin(ScrollTrigger); const intro = gsap.timeline({ defaults: { ease: 'power3.out' } }); intro.to('.preloader-line span', { scaleX: 1, duration: .9 }).to('.preloader-mark', { opacity: 0, y: -18, duration: .35 }, '+=.15').to(preloader, { yPercent: -100, duration: .85, ease: 'expo.inOut', onComplete: () => preloader.remove() }).from('.hero-title', { y: 80, opacity: 0, duration: 1.1 }, '-=.35').from('.hero-desc,.hero-actions', { y: 25, opacity: 0, stagger: .12, duration: .65 }, '-=.65').from('.hero-frame', { scale: .8, rotate: 18, opacity: 0, duration: 1.1 }, '-=.85'); gsap.utils.toArray('.eyebrow,.section-heading h2,.trailer-copy,.stats-grid').forEach((element) => gsap.from(element, { scrollTrigger: { trigger: element, start: 'top 84%' }, y: 45, opacity: 0, duration: .8, ease: 'power3.out' })); animateGrid(); if (window.innerWidth > 640) { gsap.to(spotlightRail, { x: () => -(spotlightRail.scrollWidth - innerWidth * .68), ease: 'none', scrollTrigger: { trigger: '.spotlight', pin: '.spotlight-pin', scrub: 1, start: 'top top', end: 'bottom bottom', invalidateOnRefresh: true } }); } gsap.utils.toArray('[data-count]').forEach((element) => { const target = Number(element.dataset.count); gsap.fromTo(element, { textContent: 0 }, { textContent: target, duration: 1.6, ease: 'power2.out', snap: { textContent: 1 }, scrollTrigger: { trigger: element, start: 'top 88%' } }); }); initCursor(); if (typeof anime === 'function') anime({ targets: '.play-orb', scale: [1, 1.08], duration: 1400, direction: 'alternate', loop: true, easing: 'easeInOutSine' }); }
function animateGrid() { if (reducedMotion || typeof gsap === 'undefined') return; gsap.fromTo('.grid .card', { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .055, ease: 'power3.out' }); }
modalClose.addEventListener('click', () => { modal.hidden = true; }); modal.addEventListener('click', (event) => { if (event.target === modal) modal.hidden = true; }); modalPlay.addEventListener('click', () => recordRecent(modalPlay.dataset.playId)); featuredLaunchBtn.addEventListener('click', () => { if (featuredGame?.status === 'live') { recordRecent(featuredGame.id); window.open(featuredGame.url, '_blank', 'noopener'); } }); searchInput.addEventListener('input', () => { render(); animateGrid(); }); document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.hidden) modal.hidden = true; }); loadGames();
