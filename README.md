# GameHUB

GameHUB is a single-server web game library built with Node.js, Express, vanilla browser JavaScript, HTML, and CSS. The application presents multiple games from one central library and serves every game from the same server.

The project currently includes eight live games:

- Maze Runner
- Tic-Tac-Toe
- Snake Arena
- Memory Match
- Sudoku
- Breakout Blast
- Gravity Switch
- Neon Circuit

Each game is self-contained under `games/<game-id>/` with its own browser assets, optional Mongoose score model, and optional Express route module.

## Features

- Central game library with search, category filters, featured-game presentation, and live-game badges
- Eight independently playable games
- Per-game controls, themes, keyboard shortcuts, pause states, timers, scoring, and responsive layouts
- Thirty-level campaign structure across the games, grouped as:
  - Levels 1-10: Easy
  - Levels 11-20: Medium
  - Levels 21-30: Hard
- Optional MongoDB persistence for leaderboards and game history
- Graceful local-play behavior when MongoDB is unavailable
- One Express process serving both the library UI and all game UIs
- CORS and JSON request support for browser/API communication

## Technology Stack

### Runtime

- Node.js
- CommonJS modules
- Express 4
- Mongoose 8
- dotenv
- CORS
- Nodemon for development

### Front end

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API for Maze Runner, Snake Arena, and Breakout Blast
- DOM-based boards for Tic-Tac-Toe, Sudoku, and Neon Circuit
- Canvas rendering plus DOM controls for Gravity Switch
- Browser `localStorage` for personal best scores and local counters

No front-end framework or bundler is required.

## Requirements

Install the following before running the project:

- Node.js 18 or newer recommended
- npm
- MongoDB only if persistent leaderboards are required

MongoDB is optional. The games remain playable without it, but score/history endpoints that require database access will return an error or display an unavailable message.

## Installation

From the project directory:

```powershell
cd c:\Users\Admin\Desktop\project_1\main_web
npm install
```

## Environment Configuration

Create a `.env` file in `main_web/` if you want to configure the port or connect MongoDB:

```env
PORT=8080
MONGODB_URI=mongodb+srv://username:password@cluster.example.mongodb.net/gamehub
```

### Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `8080` | Port used by the Express server |
| `MONGODB_URI` | No | None | MongoDB or MongoDB Atlas connection string |

Do not commit `.env`. It is ignored by the repository's `.gitignore` file. Never expose a real database password in source code, screenshots, or public commits.

## Running the Application

### Production-style local run

```powershell
npm start
```

The library is available at:

```text
http://localhost:8080/
```

### Development run

```powershell
npm run dev
```

The development command uses Nodemon and restarts the server when source files change.

If port `8080` is already in use, start the server on another port in PowerShell:

```powershell
$env:PORT=8090
npm start
```

Then open `http://localhost:8090/`.

## Application Architecture

The application has three layers:

```text
Browser
  |
  |-- GET /
  |     Central game-library HTML/CSS/JS
  |
  |-- GET /games/<id>/
  |     Individual game's HTML/CSS/JS
  |
  `-- /api/*
        Express JSON endpoints
              |
              `-- Mongoose models and MongoDB, when configured
```

### Server startup

`server.js` is the composition root. It:

1. Loads environment variables with dotenv.
2. Creates the Express application.
3. Enables CORS and JSON request parsing.
4. Serves the central library from `public/`.
5. Mounts each game's static assets at `/games/<id>`.
6. Exposes `/api/games` for the central registry.
7. Mounts each game's API router.
8. Starts listening on `PORT`.
9. Connects to MongoDB only when `MONGODB_URI` is set.

MongoDB connection errors are logged, but they do not prevent the HTTP server from starting.

### Central game registry

`games.js` is the source of truth for the game-library cards. Each entry contains:

- `id`: URL-safe identifier and folder name
- `title`: display name
- `description`: library description
- `url`: browser path for the game
- `emoji`: card icon
- `gradient`: library-card visual treatment
- `tags`: categories used by search/filter UI
- `difficulty`: library-card difficulty metadata from 1 to 4
- `featured`: whether the game can appear as the featured game
- `status`: normally `live` or `coming-soon`

The library browser loads this registry through `GET /api/games` and renders the cards dynamically.

## Project Structure

```text
main_web/
|-- .env                         Local environment variables, ignored by Git
|-- .gitignore
|-- package.json                 Scripts and dependencies
|-- package-lock.json            Locked npm dependency versions
|-- server.js                    Express app, static mounts, API mounts, startup
|-- games.js                     Central game registry
|-- public/                      Game-library front end
|   |-- index.html
|   |-- script.js
|   `-- style.css
|-- games/
|   |-- maze-runner/
|   |   |-- models/Maze.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/mazeRoutes.js
|   |-- tic-tac-toe/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/ticTacToeRoutes.js
|   |-- snake-arena/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/snakeRoutes.js
|   |-- memory-match/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/memoryRoutes.js
|   |-- sudoku/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/sudokuRoutes.js
|   |-- breakout/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/breakoutRoutes.js
|   |-- gravity-switch/
|   |   |-- models/Score.js
|   |   |-- public/index.html, script.js, style.css
|   |   `-- routes/gravitySwitchRoutes.js
|   `-- neon-circuit/
|       |-- models/Score.js
|       |-- public/index.html, script.js, style.css
|       `-- routes/neonCircuitRoutes.js
|-- err.txt                      Local runtime error log, if used
`-- out.txt                      Local runtime output log, if used
```

## Game Guide

### Maze Runner

- Canvas maze generated by the server using a recursive backtracker.
- Movement uses arrow keys, WASD, or the on-screen D-pad.
- Includes hints, reset, pause, timer, and move tracking.
- Campaign levels 1-30 are grouped into Easy, Medium, and Hard.
- The server endpoint generates a maze and can persist maze history.

### Tic-Tac-Toe

- Supports two-player local mode.
- Supports player-versus-computer mode.
- AI settings are Easy, Medium, and Hard.
- Includes mark selection, timer, pause, reset, keyboard controls, win tracking, and score persistence.
- Campaign levels 1-30 control the level's difficulty grouping and progression.

### Snake Arena

- Canvas snake game with keyboard and mobile controls.
- Configurable speed, board size, food count, wall behavior, and theme.
- Campaign levels define food targets and advance after the target is reached.
- Supports Easy, Medium, and Hard level bands across 30 levels.
- Game-over scores can be saved to the leaderboard.

### Memory Match

- Card-pair matching game with randomly generated decks.
- Configurable grid sizes and visual themes.
- Tracks moves, matched pairs, elapsed time, and personal best.
- Thirty campaign levels adjust the board configuration by difficulty band.
- Leaderboard scores include player name, score, moves, pairs, time, and grid size.

### Sudoku

- Generates valid Sudoku solutions in the browser.
- Removes clues while checking that the resulting puzzle has one solution.
- Supports Easy, Medium, Hard, and Expert generation settings.
- Includes notes mode, auto-check, hints, pause, keyboard navigation, timer, mistakes, and scoring.
- Campaign levels 1-30 adjust puzzle generation difficulty and display the Easy/Medium/Hard band.

### Breakout Blast

- Canvas brick-breaker with paddle, ball, lives, levels, and score.
- Paddle control supports keyboard, mouse, and touch input.
- Ball speed, brick rows, and themes are configurable.
- Campaign levels 1-30 use Easy, Medium, and Hard progression.
- Completed scores can be stored with level, brick, and difficulty information.

### Gravity Switch

- Tile-based gravity puzzle rendered on a canvas.
- Switch gravity up, down, left, or right to move through the map.
- Collect crystals, avoid hazards, and reach the exit.
- Includes touch controls, keyboard controls, pause, reset, themes, timer, moves, and score.
- Has 30 campaign entries grouped into Easy, Medium, and Hard.

### Neon Circuit

- Rotate circuit tiles to connect the source to the reactor.
- Powered paths are highlighted as the network is evaluated.
- Includes ten-level groups for each difficulty tier, for 30 levels total.
- Supports themes, pause, reset, keyboard rotation, timers, moves, scores, and records.
- The level selector and completion overlay support campaign progression.

## URL Reference

### Browser pages

| Page | URL |
| --- | --- |
| Game library | `/` |
| Maze Runner | `/games/maze-runner/` |
| Tic-Tac-Toe | `/games/tic-tac-toe/` |
| Snake Arena | `/games/snake-arena/` |
| Memory Match | `/games/memory-match/` |
| Sudoku | `/games/sudoku/` |
| Breakout Blast | `/games/breakout/` |
| Gravity Switch | `/games/gravity-switch/` |
| Neon Circuit | `/games/neon-circuit/` |

### API endpoints

All endpoints are relative to the server origin, for example `http://localhost:8080`.

#### Library

```http
GET /api/games
```

Returns the central registry:

```json
{
  "games": [
    {
      "id": "sudoku",
      "title": "Sudoku",
      "url": "/games/sudoku/",
      "tags": ["puzzle", "strategy"],
      "status": "live"
    }
  ]
}
```

#### Leaderboard pattern

The score-backed games expose the following pattern:

```http
GET  /api/<game>/scores?limit=10
POST /api/<game>/score
```

The supported score API prefixes are:

- `/api/snake`
- `/api/memory`
- `/api/breakout`
- `/api/sudoku`
- `/api/tic-tac-toe`
- `/api/gravity-switch`
- `/api/neon-circuit`

`limit` is clamped to a maximum of 50 entries. Results are sorted by score descending.

#### Score payloads

The browser submits the following fields:

| Game | Main score fields |
| --- | --- |
| Snake Arena | `name`, `score`, `length`, `difficulty`, `boardSize` |
| Memory Match | `name`, `score`, `moves`, `pairs`, `time`, `gridSize` |
| Breakout Blast | `name`, `score`, `level`, `bricks`, `difficulty` |
| Sudoku | `name`, `score`, `difficulty`, `mistakes`, `hints`, `time` |
| Tic-Tac-Toe | `name`, `score`, `result`, `mode`, `difficulty`, `moves`, `time` |
| Gravity Switch | `name`, `score`, `level`, `moves`, `time` |
| Neon Circuit | `name`, `score`, `level`, `moves`, `time` |

Maze Runner uses maze-generation and history endpoints rather than the same score payload shape.

#### Maze Runner endpoints

```http
POST /api/maze/generate
GET  /api/maze/history?limit=10
```

The generation request accepts difficulty settings and returns a generated maze grid, start/end positions, dimensions, and solution metadata.

## MongoDB Persistence

Persistence is intentionally optional. When `MONGODB_URI` is configured, the server calls `mongoose.connect()` and each score/history route uses its game-specific model.

The models are separate so game data remains isolated:

- `SudokuScore`
- `MemoryScore`
- `BreakoutScore`
- `TicTacToeScore`
- `GravitySwitchScore`
- `NeonCircuitScore`
- Existing `Score` model for Snake Arena
- `Maze` model for Maze Runner

If MongoDB is not configured:

- The server logs that persistence is unavailable.
- The browser games still run locally.
- Leaderboard requests display an unavailable state.
- Score submissions fail harmlessly from the browser's point of view.

## Adding a New Game

Use the following workflow:

1. Create a game folder:

   ```text
   games/my-game/
   |-- models/Score.js       Optional
   |-- public/
   |   |-- index.html
   |   |-- script.js
   |   `-- style.css
   `-- routes/myGameRoutes.js Optional
   ```

2. Build the browser game in `public/`.
3. Add an entry to `games.js`.
4. Import the route module in `server.js` if the game has an API.
5. Mount the static directory:

   ```js
   app.use('/games/my-game', express.static(path.join(__dirname, 'games/my-game/public')));
   ```

6. Mount the API router if needed:

   ```js
   app.use('/api/my-game', myGameRoutes);
   ```

7. Use relative browser requests such as:

   ```js
   fetch('/api/my-game/scores?limit=10');
   ```

8. Add the game to the README and verify its page and APIs locally.

The registry entry should follow the existing shape:

```js
{
  id: 'my-game',
  title: 'My Game',
  description: 'A short description for the library card.',
  url: '/games/my-game/',
  emoji: '🎮',
  gradient: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
  tags: ['arcade'],
  difficulty: 2,
  featured: false,
  status: 'live',
}
```

## Development and Validation

There is currently no automated test suite or build step. Use these checks before committing changes:

### Check one browser script

```powershell
node --check .\games\sudoku\public\script.js
```

### Check all project JavaScript

```powershell
Get-ChildItem . -Recurse -Filter *.js |
  Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object { node --check $_.FullName }
```

### Start the server and verify routes

```powershell
npm start
```

Then check:

- `http://localhost:8080/`
- `http://localhost:8080/api/games`
- One or more `/games/<id>/` pages
- The corresponding leaderboard endpoint if MongoDB is configured

### Common problems

#### `EADDRINUSE`

Port 8080 is already being used. Either stop the other process or choose another port:

```powershell
$env:PORT=8090
npm start
```

#### Leaderboard unavailable

Check that:

- `MONGODB_URI` exists in `.env`.
- The MongoDB URI is valid.
- The database allows your machine's IP address.
- The database credentials are correct.

The games should still be playable without persistence.

#### Library says the API is unavailable

Make sure the Express server is running and that you opened the page through the server URL. Do not open `public/index.html` directly from the file system when testing API-backed behavior.

## Security and Operational Notes

- Keep `.env` out of version control.
- Treat `MONGODB_URI` as a secret because it may contain database credentials.
- The server currently enables CORS for all origins through the `cors()` middleware.
- Score routes validate several numeric fields, but this is a small local game project rather than a hardened production service.
- If deployed publicly, add authentication/rate limiting for score submission, tighten CORS, validate all payload fields, and use HTTPS.

## License

No license file is currently included. Add an explicit license before distributing the project outside its intended development or classroom context.
