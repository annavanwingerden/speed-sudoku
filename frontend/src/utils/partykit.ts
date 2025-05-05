import PartySocket from 'partysocket';

export interface GameState {
  puzzle: number[][];
  players: Map<string, Player> | Record<string, Player>;
  startTime: number;
  gameMode: 'blind' | 'collaborative';
  isComplete: boolean;
  winner?: string;
  difficulty: string;
  roomId?: string | null;
}

interface Player {
  id: string;
  board: number[][];
  score: number;
  color?: string;
}

interface Move {
  playerId: string;
  row: number;
  col: number;
  value: number;
  gameMode?: 'blind' | 'collaborative';
}

// Add color palette
const PLAYER_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // yellow
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
  '#6366F1', // indigo
];

export class SudokuClient {
  private socket: PartySocket | null = null;
  private onGameStateUpdate: (state: GameState) => void;
  private onMoveUpdate: (move: Move) => void;
  private onGameComplete: (winner: string) => void;
  public readonly roomId: string;
  private playerId: string | null = null;
  private isRegistered: boolean = false;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private playerColors: Map<string, string> = new Map();

  // Getter for playerId
  public getPlayerId(): string | null {
    return this.playerId;
  }

  // Getter for isRegistered
  public isPlayerRegistered(): boolean {
    return this.isRegistered;
  }

  // Getter for player color
  public getPlayerColor(playerId: string): string {
    const color = this.playerColors.get(playerId) || '#111';
    console.log(`Getting color for player ${playerId}:`, color);
    return color;
  }

  private assignPlayerColors(players: Map<string, Player>) {
    const playerIds = Array.from(players.keys());
    console.log('Assigning colors to players:', playerIds);
    playerIds.forEach((playerId, index) => {
      if (!this.playerColors.has(playerId)) {
        // Assign a color from the palette, cycling through if more players than colors
        const colorIndex = index % PLAYER_COLORS.length;
        const color = PLAYER_COLORS[colorIndex];
        this.playerColors.set(playerId, color);
        console.log(`Assigned color ${color} to player ${playerId}`);
      }
    });
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
    this.initializeSocket();
  }

  private initializeSocket() {
    if (this.socket) {
      console.log('Cleaning up existing socket connection');
      this.socket.close();
      this.socket = null;
    }

    console.log('Initializing new socket connection');
    this.socket = new PartySocket({
      host: 'speed-sudoku.annavanwingerden.partykit.dev',
      room: this.roomId,
      party: 'sudoku'
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.addEventListener('message', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      console.log('Received message from server:', data);
      
      switch (data.type) {
        case 'GAME_STATE':
        case 'GAME_CREATED':
        case 'PLAYER_JOINED':
          this.handleGameStateUpdate(data);
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
      console.log('WebSocket connection established with ID:', this.socket?.id);
      this.connectionAttempts = 0;
      // Set initial player ID to socket ID
      if (this.socket?.id) {
        this.playerId = this.socket.id;
        this.isRegistered = false;
        console.log('Set initial player ID:', this.playerId);
      }
    });

    this.socket.addEventListener('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    });

    this.socket.addEventListener('close', () => {
      console.log('WebSocket connection closed');
      this.handleConnectionClose();
    });
  }

  private handleGameStateUpdate(data: any) {
    if (data.state.players) {
      // Convert players object back to Map
      const players = data.state.players instanceof Map 
        ? data.state.players
        : new Map(Object.entries(data.state.players));
      
      console.log('Current players before color assignment:', Array.from(players.keys()));
      // Assign colors to players
      this.assignPlayerColors(players);
      console.log('Current player colors:', Array.from(this.playerColors.entries()));
      
      // Find the current player's ID
      const socketId = this.socket?.id;
      if (socketId) {
        const playerIds = Array.from(players.keys());
        const currentPlayer = playerIds.find(p => p === socketId);
        if (currentPlayer && typeof currentPlayer === 'string') {
          this.playerId = currentPlayer;
          this.isRegistered = true;
          console.log('Player registered:', this.playerId, 'with color:', this.getPlayerColor(this.playerId));
        } else {
          this.isRegistered = false;
          console.log('Player not registered yet');
        }
      }
      
      // Update the state with the Map
      data.state.players = players;
      console.log('Updated players Map:', players);
    }
    this.onGameStateUpdate(data.state);
  }

  private handleConnectionError() {
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      this.connectionAttempts++;
      console.log(`Connection attempt ${this.connectionAttempts} failed, retrying...`);
      this.reconnectTimeout = setTimeout(() => {
        this.initializeSocket();
      }, 1000 * this.connectionAttempts); // Exponential backoff
    } else {
      console.error('Max connection attempts reached');
    }
  }

  private handleConnectionClose() {
    // Clear player ID and registration on disconnect
    this.playerId = null;
    this.isRegistered = false;
    
    // Attempt to reconnect if not explicitly disconnected
    if (this.connectionAttempts < this.maxConnectionAttempts) {
      this.connectionAttempts++;
      console.log(`Connection closed, attempt ${this.connectionAttempts} to reconnect...`);
      this.reconnectTimeout = setTimeout(() => {
        this.initializeSocket();
      }, 1000 * this.connectionAttempts);
    }
  }

  createGame(difficulty: string, gameMode: 'blind' | 'collaborative') {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
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
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    console.log('Joining game');
    const message = {
      type: 'JOIN_GAME'
    };
    console.log('Sending join game message:', message);
    this.socket.send(JSON.stringify(message));
  }

  makeMove(row: number, col: number, value: number) {
    if (!this.socket) {
      console.error('Socket not initialized');
      return;
    }
    if (!this.playerId || !this.isRegistered) {
      console.error('Player not registered yet');
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
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.playerId = null;
    this.isRegistered = false;
    this.connectionAttempts = 0;
  }
} 