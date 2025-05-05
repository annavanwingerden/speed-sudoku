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
  color: string;
}

interface Move {
  playerId: string;
  row: number;
  col: number;
  value: number;
  gameMode?: 'blind' | 'collaborative';
  color: string;
}

export class SudokuClient {
  private socket!: PartySocket;  // Using definite assignment assertion
  private onGameStateUpdate: (state: GameState) => void;
  private onMoveUpdate: (move: Move) => void;
  private onGameComplete: (winner: string) => void;
  public readonly roomId: string;
  private playerId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isCreatingGame: boolean = false;
  private isConnected: boolean = false;
  private pendingMessages: { type: string; data: any }[] = [];
  private isJoiningGame: boolean = false;
  private isReconnecting: boolean = false;

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

    this.initializeSocket();
  }

  private cleanupSocket() {
    if (this.socket) {
      this.socket.removeEventListener('message', this.handleMessage);
      this.socket.removeEventListener('open', this.handleOpen);
      this.socket.removeEventListener('error', this.handleError);
      this.socket.removeEventListener('close', this.handleClose);
      this.socket.close();
    }
  }

  private handleMessage = (event: MessageEvent) => {
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
        // If we were creating a game, now join it
        if (this.isCreatingGame) {
          this.isCreatingGame = false;
          this.joinGame();
        }
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
      case 'ERROR':
        console.error('Server error:', data.message);
        if (this.isJoiningGame) {
          this.isJoiningGame = false;
          // Retry join after a short delay
          setTimeout(() => this.joinGame(), 1000);
        }
        break;
    }
  };

  private handleOpen = () => {
    console.log('WebSocket connection established with ID:', this.socket.id);
    // Set initial player ID to socket ID
    this.playerId = this.socket.id;
    console.log('Set initial player ID:', this.playerId);
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    this.isConnected = true;
    this.isReconnecting = false;

    // Send any pending messages
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        console.log('Sending pending message:', message);
        this.socket.send(JSON.stringify(message));
      }
    }

    // If we were trying to join, retry now that we're connected
    if (this.isJoiningGame) {
      this.joinGame();
    }
  };

  private handleError = (error: Event) => {
    console.error('WebSocket error:', error);
    this.isConnected = false;
    if (!this.isReconnecting) {
      this.handleReconnect();
    }
  };

  private handleClose = () => {
    console.log('WebSocket connection closed');
    this.isConnected = false;
    if (!this.isReconnecting) {
      this.handleReconnect();
    }
  };

  private initializeSocket() {
    if (this.isReconnecting) {
      console.log('Already reconnecting, skipping initialization');
      return;
    }

    this.cleanupSocket();

    this.socket = new PartySocket({
      host: 'speed-sudoku.annavanwingerden.partykit.dev',
      room: this.roomId,
      party: 'sudoku'
    });

    this.socket.addEventListener('message', this.handleMessage);
    this.socket.addEventListener('open', this.handleOpen);
    this.socket.addEventListener('error', this.handleError);
    this.socket.addEventListener('close', this.handleClose);
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.isJoiningGame = false;
      this.isCreatingGame = false;
      this.isReconnecting = false;
      return;
    }

    if (this.isReconnecting) {
      console.log('Already reconnecting, skipping reconnect attempt');
      return;
    }

    this.isReconnecting = true;
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log('Reconnecting...');
      this.initializeSocket();
    }, Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000)); // Exponential backoff with max 10s
  }

  private currentDifficulty: string = '';
  private currentGameMode: 'blind' | 'collaborative' = 'blind';

  private sendMessage(message: any) {
    if (this.isConnected) {
      console.log('Sending message:', message);
      this.socket.send(JSON.stringify(message));
    } else {
      console.log('Socket not connected, queueing message:', message);
      this.pendingMessages.push(message);
    }
  }

  createGame(difficulty: string, gameMode: 'blind' | 'collaborative') {
    console.log('Creating game:', { difficulty, gameMode });
    this.currentDifficulty = difficulty;
    this.currentGameMode = gameMode;
    this.isCreatingGame = true;
    const message = {
      type: 'CREATE_GAME',
      difficulty,
      gameMode
    };
    this.sendMessage(message);
  }

  joinGame() {
    if (this.isJoiningGame) {
      console.log('Already attempting to join game');
      return;
    }

    console.log('Joining game');
    this.isJoiningGame = true;
    const message = {
      type: 'JOIN_GAME'
    };
    this.sendMessage(message);
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
      playerId: this.playerId,
      color: this.getPlayerColor()
    };
    this.sendMessage(message);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.isJoiningGame = false;
    this.isCreatingGame = false;
    this.isReconnecting = false;
    this.cleanupSocket();
  }

  // Add a method to get player color
  private getPlayerColor(): string {
    // Generate a consistent color based on player ID
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#45B7D1', // Blue
      '#96CEB4', // Green
      '#FFEEAD', // Yellow
      '#D4A5A5', // Pink
      '#9B59B6', // Purple
      '#3498DB', // Light Blue
      '#E67E22'  // Orange
    ];
    
    // Use the player ID to consistently pick a color
    const index = this.playerId ? 
      this.playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length 
      : 0;
    
    return colors[index];
  }
} 