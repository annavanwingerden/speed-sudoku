# Speed Sudoku

Two players race to solve the same Sudoku puzzle. They choose a difficulty and get a random one
Players can choose between two game modes:

- Blind Race: Each player works on the puzzle individually. No shared progress — it's a pure head-to-head speed challenge.

- Collaborative Race: Correct guesses are shared between both players in real-time. Each correct number filled by one player instantly appears on the other’s board. Still a race — but teamwork helps both progress faster!



Frontend (React + Tailwind + WebSockets):

- Room creation/joining UI

- Sudoku grid renderer

- Game timer

- WebSocket client setup

Backend (Node.js + Temporal SDK):

- Workflow template: game session init, signals (moves), queries (get state)

- Signal handlers for move validation

- Puzzle generator stub

- State model for players, grid, timer



Sudoku logic:
- Puzzle generation by difficulty
- Move validation (per cell)
- Win condition detection
Optional: error tracking and scoring


Frontend

React + Tailwind UI (join/create room, Sudoku board, timer, win message)

WebSocket connects to backend:
onCellChange → send move → backend sends update

Backend

API for:

Creating/joining a room

Starting the game

WebSocket for bi-directional updates

Temporal client to:

Start game workflow

Send move signals

Query game state

Temporal Workflow

GameSessionWorkflow:

init: store puzzle, players, timer

Signal: submitMove(row, col, number)

Query: getCurrentState() → returns board, time, etc.

Timer: tick every second (or use Date.now() deltas)


Stack recap
- Frontend: React + Tailwind + WebSocket
- Backend: Node.js + Typescript + Temporal SDK + WebSocket
- Game Logic: Sudoku validator/generator


sudoku-duel/
├── backend/
│   ├── workflows/
│   │   ├── gameSession.workflow.ts     # Temporal workflow definition
│   │   └── types.ts                    # Shared types between signals, queries, etc.
│   ├── handlers/
│   │   └── gameSocketHandler.ts        # WebSocket events (move submitted, join, etc.)
│   ├── services/
│   │   ├── sudoku.ts                   # Puzzle generator, validator, helper logic
│   │   └── gameManager.ts              # Orchestrates room creation, Temporal calls
│   ├── server.ts                       # WebSocket + API server entry
│   └── temporal.ts                     # Temporal connection setup
│
├── frontend/
│   ├── components/
│   │   ├── SudokuBoard.tsx            # Renders a Sudoku board grid
│   │   ├── GameHUD.tsx                # Timer, player names, errors
│   │   └── Lobby.tsx                  # Room creation/joining UI
│   ├── pages/
│   │   ├── index.tsx                  # Lobby/Home
│   │   └── game/[roomId].tsx         # Game screen per session
│   ├── utils/
│   │   └── socket.ts                  # WebSocket client connection
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── shared/
│   └── types.ts                       # Types shared across frontend/backend
│
├── .env                               # For Temporal + WebSocket configs
├── package.json
└── README.md
