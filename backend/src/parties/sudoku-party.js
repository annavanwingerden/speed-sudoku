const { generateSudokuPuzzle } = require('../services/sudoku');

class SudokuParty {
  constructor(party) {
    this.party = party;
    this.gameState = null;
    this.connections = new Set();
  }

  async onConnect(conn) {
    console.log('New connection established:', conn.id);
    this.connections.add(conn);
    
    // Load game state from storage if it exists
    if (!this.gameState) {
      const storedState = await this.party.storage.get('gameState');
      if (storedState) {
        console.log('Loaded existing game state from storage');
        this.gameState = storedState;
        // Convert players back to Map since it's serialized as an object
        if (this.gameState.players && !(this.gameState.players instanceof Map)) {
          const playersMap = new Map();
          Object.entries(this.gameState.players).forEach(([id, player]) => {
            playersMap.set(id, player);
          });
          this.gameState.players = playersMap;
        }
      }
    }
    
    // Send current game state to new player
    if (this.gameState) {
      console.log('Sending game state to new player:', conn.id);
      // If player already exists, send their board state
      const existingPlayer = this.gameState.players.get(conn.id);
      if (existingPlayer) {
        console.log('Player exists, sending their board state');
        conn.send(JSON.stringify({
          type: 'GAME_STATE',
          state: {
            ...this.gameState,
            puzzle: existingPlayer.board // Send player's current board state
          }
        }));
      } else {
        console.log('New player, sending initial puzzle');
        // For new players, send the initial puzzle
        conn.send(JSON.stringify({
          type: 'GAME_STATE',
          state: this.gameState
        }));
      }
    }
  }

  async onMessage(message, sender) {
    const data = JSON.parse(message);
    console.log('Received message from', sender.id, ':', data);

    switch (data.type) {
      case 'CREATE_GAME':
        console.log('Creating new game with difficulty:', data.difficulty);
        // Generate a new puzzle
        const puzzle = generateSudokuPuzzle(data.difficulty);
        
        this.gameState = {
          puzzle,
          players: new Map(),
          startTime: Date.now(),
          gameMode: data.gameMode,
          isComplete: false
        };

        // Save game state to storage
        await this.party.storage.put('gameState', this.gameState);
        console.log('Game state saved to storage');

        // Broadcast game state to all players
        this.connections.forEach(conn => {
          console.log('Broadcasting game state to player:', conn.id);
          conn.send(JSON.stringify({
            type: 'GAME_CREATED',
            state: this.gameState
          }));
        });
        break;

      case 'JOIN_GAME':
        console.log('Player', sender.id, 'joining game');
        if (!this.gameState) {
          console.log('No game in progress, sending error');
          sender.send(JSON.stringify({
            type: 'ERROR',
            message: 'No game in progress'
          }));
          return;
        }

        // Check if player already exists
        if (!this.gameState.players.has(sender.id)) {
          console.log('Adding new player to game');
          // Add new player to game
          const player = {
            id: sender.id,
            board: this.gameState.puzzle.map(row => [...row]),
            score: 0
          };
          this.gameState.players.set(sender.id, player);

          // Save updated game state
          await this.party.storage.put('gameState', this.gameState);
          console.log('Updated game state saved to storage');

          // Broadcast player joined
          this.connections.forEach(conn => {
            console.log('Broadcasting player joined to:', conn.id);
            conn.send(JSON.stringify({
              type: 'PLAYER_JOINED',
              state: this.gameState
            }));
          });
        } else {
          console.log('Player reconnecting, sending current state');
          // Send current state to reconnecting player
          sender.send(JSON.stringify({
            type: 'GAME_STATE',
            state: {
              ...this.gameState,
              puzzle: this.gameState.players.get(sender.id).board
            }
          }));
        }
        break;

      case 'MAKE_MOVE':
        console.log('Player', sender.id, 'making move:', data);
        if (!this.gameState) {
          console.log('No game in progress, sending error');
          sender.send(JSON.stringify({
            type: 'ERROR',
            message: 'No game in progress'
          }));
          return;
        }

        const { row, col, value } = data;
        const playerBoard = this.gameState.players.get(sender.id)?.board;
        
        if (!playerBoard) {
          console.log('Player not in game, sending error');
          sender.send(JSON.stringify({
            type: 'ERROR',
            message: 'Player not in game'
          }));
          return;
        }

        // Update player's board
        playerBoard[row][col] = value;
        console.log('Updated player board');

        // In collaborative mode, update all players' boards
        if (this.gameState.gameMode === 'collaborative') {
          console.log('Collaborative mode: updating all players boards');
          this.gameState.players.forEach(p => {
            p.board[row][col] = value;
          });
        }

        // Save updated game state
        await this.party.storage.put('gameState', this.gameState);
        console.log('Updated game state saved to storage');

        // Check if game is complete
        if (this.isBoardComplete(playerBoard)) {
          console.log('Game complete! Winner:', sender.id);
          this.gameState.isComplete = true;
          this.gameState.winner = sender.id;
          
          // Save final game state
          await this.party.storage.put('gameState', this.gameState);
          
          this.connections.forEach(conn => {
            console.log('Broadcasting game complete to:', conn.id);
            conn.send(JSON.stringify({
              type: 'GAME_COMPLETE',
              winner: sender.id
            }));
          });
        } else {
          // Broadcast move to all players with player ID
          this.connections.forEach(conn => {
            console.log('Broadcasting move to:', conn.id);
            conn.send(JSON.stringify({
              type: 'MOVE_MADE',
              playerId: sender.id,
              row,
              col,
              value,
              gameMode: this.gameState.gameMode
            }));
          });
        }
        break;
    }
  }

  isBoardComplete(board) {
    // Check if all cells are filled (non-zero)
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (board[i][j] === 0) {
          return false;
        }
      }
    }
    return true;
  }
}

module.exports = SudokuParty; 