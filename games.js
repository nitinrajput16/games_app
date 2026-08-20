/**
 * Central game registry for the main_web game library.
 *
 * To add a NEW game to the library, just add one object to this array.
 * No HTML / JS changes required - the front-end renders everything
 * dynamically from this single source of truth.
 */

const games = [
  {
    id: 'maze-runner',
    title: 'Maze Runner',
    description:
      'Navigate the winding labyrinth, dodge dead-ends and race to the finish as fast as you can.',
    url: '/games/maze-runner/',
    emoji: '🕹️',
    gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
    tags: ['puzzle', 'adventure'],
    difficulty: 2,
    featured: true,
    status: 'live',
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    description:
      'The classic battle of X and O. Play head-to-head or challenge the unbeatable AI.',
    url: '/games/tic-tac-toe/',
    emoji: '⭕',
    gradient: 'linear-gradient(135deg, #22c55e, #10b981)',
    tags: ['strategy', 'classic'],
    difficulty: 1,
    featured: false,
    status: 'live',
  },
  {
    id: 'snake-arena',
    title: 'Snake Arena',
    description:
      'Eat, grow, and survive. Speed ramps up as your snake slithers toward a high score.',
    url: '/games/snake-arena/',
    emoji: '🐍',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    tags: ['arcade', 'highscore'],
    difficulty: 3,
    featured: false,
    status: 'live',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    description:
      'Flip the cards, test your recall and pair every tile before the timer runs out.',
    url: '/games/memory-match/',
    emoji: '🧠',
    gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
    tags: ['puzzle', 'classic'],
    difficulty: 1,
    featured: false,
    status: 'live',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description:
      'A brain workout of logic and numbers. Fill the grid with every row, column and box resolved.',
    url: '/games/sudoku/',
    emoji: '🔢',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    tags: ['puzzle', 'strategy'],
    difficulty: 4,
    featured: false,
    status: 'live',
  },
  {
    id: 'breakout',
    title: 'Breakout Blast',
    description:
      'Bounce the ball, smash every brick and clear the board before you run out of lives.',
    url: '/games/breakout/',
    emoji: '🏓',
    gradient: 'linear-gradient(135deg, #f43f5e, #f97316)',
    tags: ['arcade', 'action'],
    difficulty: 3,
    featured: false,
    status: 'live',
  },
  {
    id: 'gravity-switch',
    title: 'Gravity Switch',
    description:
      'Flip gravity, slip between walls, collect every crystal and escape the shifting vault alive.',
    url: '/games/gravity-switch/',
    emoji: '🪐',
    gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)',
    tags: ['puzzle', 'arcade'],
    difficulty: 3,
    featured: false,
    status: 'live',
  },
  {
    id: 'neon-circuit',
    title: 'Neon Circuit',
    description:
      'Rotate the live network, route power through every junction and light the reactor before the grid overloads.',
    url: '/games/neon-circuit/',
    emoji: '⚡',
    gradient: 'linear-gradient(135deg, #f43f5e, #8b5cf6)',
    tags: ['puzzle', 'strategy'],
    difficulty: 4,
    featured: false,
    status: 'live',
  },
];

module.exports = games;