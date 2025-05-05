# Speed Sudoku

A real-time multiplayer Sudoku game where players can race to solve the same puzzle. Choose your difficulty and game mode, and play collaboratively with friends!

## Why I Built This
This was built for the [Web Dev Challenge Hackathon S2.E2](https://codetv.dev/blog/web-dev-challenge-hackathon-s2e2-multi-device-game-temporal#introduction-to-temporal--devs-discuss-their-ideas). The challenge was to build a game played on at least 2 devices - using Temporal.

## Features

- **Room creation/joining UI:** Easily create a new game room or join an existing one via invite link.
- **Sudoku grid renderer:** Interactive, color-coded grid showing each player's moves in their assigned color.
- **WebSocket client:** Real-time updates for moves and game state.
- **Collaborative Race mode:** All correct moves are shared instantly between players.
- **Player color assignment:** Each player's moves are shown in their unique color for easy tracking.

> **Note:** The "Blind Race" mode is currently disabled in the UI.
> **Note:** The board generation based on difficulty has not been implemented. All options currently shows the same board. It also hasn't yet(!) got the move validator implemented.

---

## Game Modes

- **Collaborative Race:**  
  Players work together (and race!) to solve the same puzzle. Every correct number filled by one player instantly appears on the other's board.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, WebSocket
- **Backend:** Node.js, TypeScript, PartyKit (WebSocket server), Temporal (workflow management)
- **Game Logic:** Sudoku puzzle generator, move validation, win detection

---

## Project Structure

```
speed-sudoku/
├── backend/
│   ├── server.ts                # WebSocket + API server entry
│   ├── sudoku.ts                # Puzzle generator, validator, helper logic
│   └── ...                      # Other backend files
│
├── frontend/
│   ├── components/
│   │   ├── SudokuGrid.tsx       # Renders the Sudoku board
│   │   └── RoomCreation.tsx     # Room creation/joining UI
│   ├── utils/
│   │   └── partykit.ts          # WebSocket client logic and game state
│   ├── App.tsx                  # Main React app
│   └── ...                      # Other frontend files
│
├── shared/
│   └── types.ts                 # Types shared across frontend/backend
│
├── .env                         # For backend configs
├── package.json
└── README.md
```

---

## How It Works

### Frontend

- **Room Creation:**  
  Users can create or join a game room. An invite link is generated for easy sharing.
- **Sudoku Board:**  
  The board updates in real-time as players make moves. Each move is color-coded by player.
- **Game State:**  
  The frontend listens for updates from the backend and updates the UI accordingly.

### Backend

- **WebSocket Server:**  
  Handles room creation, player joining, move validation, and broadcasting game state.
- **Sudoku Logic:**  
  Generates puzzles by difficulty, validates moves, and checks for win conditions.

---

## Running the Project

1. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Start the backend:**
   ```bash
   cd backend
   npx partykit deploy
   ```

3. **Start the frontend:**
   ```bash
   cd frontend
   npm start
   ```

4. **Open your browser:**  
   Visit `http://localhost:3000` to play.

---

## Customization

- **Player Colors:**  
  Each player is assigned a unique color for their moves, making it easy to see who filled which cell.
- **Game Modes:**  
  Only Collaborative Race is currently available. Blind Race is commented out in the UI but can be re-enabled if needed.

---

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

---

## License

[MIT](LICENSE)
