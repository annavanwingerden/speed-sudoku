import PartySocket from 'partysocket';

interface GameState {
  puzzle: number[][];
  players: Map<string, Player>;
  startTime: number;
  gameMode: 'blind' | 'collaborative';
  isComplete: boolean;
  winner?: string;
  difficulty: string;
}

interface Player {
  id: string;
  board: number[][];
  score: number;
}

interface Move {
  playerId: string;
  row: number;
  col: number;
  value: number;
  gameMode?: 'blind' | 'collaborative';
}

export class SudokuClient {
  private socket: PartySocket;
  private onGameStateUpdate: (state: GameState) => void;
  private onMoveUpdate: (move: Move) => void;
  private onGameComplete: (winner: string) => void;
  public readonly roomId: string;
  private playerId: string | null = null;

  // Getter for playerId
  public getPlayerId(): string | null {
    return this.playerId;
  }

  constructor(
    roomId: string,
    onGameStateUpdate: (state: GameState) => void,
    onMoveUpdate: (move: Move) => void,
    onGameComplete: (winner: string) => void
  ) {
    this.roomId = roomId;
    this.onGameStateUpdate = onGameStateUpdate;
    this.onMoveUpdate = onMoveUpdate;
    this.onGameComplete = onGameComplete;

    this.socket = new PartySocket({
      host:  'speed-sudoku.annavanwingerden.partykit.dev',
      room: roomId,
      party: 'sudoku'
    });

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server:', data);
      
      switch (data.type) {
        case 'GAME_STATE':
        case 'GAME_CREATED':
        case 'PLAYER_JOINED':
          // Set player ID when receiving game state
          if (data.state.players) {
            const players = data.state.players instanceof Map 
              ? Array.from(data.state.players.keys())
              : Object.keys(data.state.players);
            // Find the current player's ID
            const currentPlayer = players.find(p => p === this.socket.id) as string | undefined;
            if (currentPlayer) {
              this.playerId = currentPlayer;
              console.log('Set player ID:', this.playerId);
            }
          }
          this.onGameStateUpdate(data.state);
          break;
        case 'MOVE_MADE':
          console.log('Received move update:', data);
          this.onMoveUpdate({
            ...data,
            playerId: data.playerId
          });
          break;
        case 'GAME_COMPLETE':
          this.onGameComplete(data.winner);
          break;
      }
    });

    this.socket.addEventListener('open', () => {
      console.log('WebSocket connection established with ID:', this.socket.id);
      // Set initial player ID to socket ID
      this.playerId = this.socket.id;
      console.log('Set initial player ID:', this.playerId);
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      // Clear player ID on disconnect
      this.playerId = null;
    });
  }

  createGame(difficulty: string, gameMode: 'blind' | 'collaborative') {
    console.log('Creating game:', { difficulty, gameMode });
    const message = {
      type: 'CREATE_GAME',
      difficulty,
      gameMode
    };
    console.log('Sending create game message:', message);
    this.socket.send(JSON.stringify(message));
  }

  joinGame() {
    console.log('Joining game');
    const message = {
      type: 'JOIN_GAME'
    };
    console.log('Sending join game message:', message);
    this.socket.send(JSON.stringify(message));
  }

  makeMove(row: number, col: number, value: number) {
    if (!this.playerId) {
      console.error('No player ID available');
      return;
    }
    const message = {
      type: 'MAKE_MOVE',
      row,
      col,
      value,
      playerId: this.playerId
    };
    console.log('Sending move message:', message);
    this.socket.send(JSON.stringify(message));
  }

  disconnect() {
    this.socket.close();
  }
} 