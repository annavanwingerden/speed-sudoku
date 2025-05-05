import React, { useState } from 'react';
import SudokuGrid from './components/SudokuGrid';
import RoomCreation from './components/RoomCreation';
import { SudokuClient, GameState } from './utils/partykit';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import './App.css';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    gameMode: 'collaborative',
    difficulty: 'easy',
    puzzle: [],
    players: new Map(),
    startTime: Date.now(),
    isComplete: false
  });

  const [client, setClient] = useState<SudokuClient | null>(null);

  const handleCellUpdate = (row: number, col: number, value: number) => {
    if (client) {
      console.log('Making move:', { row, col, value, playerId: client.getPlayerId() });
      // Update local state immediately
      setGameState(prev => {
        if (!prev.puzzle) return prev;
        const newPuzzle = [...prev.puzzle];
        newPuzzle[row][col] = value;
        return {
          ...prev,
          puzzle: newPuzzle
        };
      });
      // Send move to server
      client.makeMove(row, col, value);
    }
  };

  const createRoom = (difficulty: string, gameMode: 'blind' | 'collaborative') => {
    console.log('Creating room with:', { difficulty, gameMode });
    
    // Generate a unique room name using unique-names-generator with adjectives
    const roomId = uniqueNamesGenerator({
      dictionaries: [adjectives, animals, adjectives],
      length: 3,
      separator: '-',
      style: 'lowerCase'
    });
    
    // Create a new client for the game
    const newClient = new SudokuClient(
      roomId,
      (state) => {
        console.log('Game state received from server:', state);
        // Update the game state with the new state from the server
        setGameState(prev => ({
          ...prev,
          ...state,
          players: state.players instanceof Map ? state.players : new Map(Object.entries(state.players))
        }));
      },
      (move) => {
        console.log('Move made:', move);
        // Update the game state with the move
        setGameState(prev => {
          if (!prev.puzzle) return prev;
          const newPuzzle = [...prev.puzzle];
          newPuzzle[move.row][move.col] = move.value;
          return {
            ...prev,
            puzzle: newPuzzle
          };
        });
      },
      (winner) => {
        console.log('Game complete! Winner:', winner);
        setGameState(prev => ({ ...prev, isComplete: true, winner }));
      }
    );

    setClient(newClient);

    // Update the game state immediately
    setGameState({
      roomId: newClient.roomId,
      gameMode,
      difficulty,
      puzzle: [],
      players: new Map(),
      startTime: Date.now(),
      isComplete: false
    });

    // Create the game after a short delay to ensure connection is established
    setTimeout(() => {
      newClient.createGame(difficulty, gameMode);
    }, 500);
  };

  // Join an existing room by roomId
  const joinRoom = (roomId: string) => {
    console.log('Joining room:', roomId);
    
    // Create a new client for the game
    const newClient = new SudokuClient(
      roomId,
      (state) => {
        console.log('Game state received from server:', state);
        // Update the game state with the new state from the server
        setGameState(prev => ({
          ...prev,
          ...state,
          players: state.players instanceof Map ? state.players : new Map(Object.entries(state.players))
        }));
      },
      (move) => {
        console.log('Move made:', move);
        // Update the game state with the move
        setGameState(prev => {
          if (!prev.puzzle) return prev;
          const newPuzzle = [...prev.puzzle];
          newPuzzle[move.row][move.col] = move.value;
          return {
            ...prev,
            puzzle: newPuzzle
          };
        });
      },
      (winner) => {
        console.log('Game complete! Winner:', winner);
        setGameState(prev => ({ ...prev, isComplete: true, winner }));
      }
    );

    setClient(newClient);

    // Update the game state
    setGameState({
      roomId: newClient.roomId,
      gameMode: 'collaborative',
      difficulty: 'easy',
      puzzle: [],
      players: new Map(),
      startTime: Date.now(),
      isComplete: false
    });

    // Join the game after a short delay to ensure connection is established
    setTimeout(() => {
      newClient.joinGame();
    }, 500);
  };

  // Auto-join by URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('roomId');
    if (roomId) {
      joinRoom(roomId);
    }
  }, []);

  // Add effect to log game state changes
  React.useEffect(() => {
    console.log('Game state changed:', gameState);
  }, [gameState]);

  // Add effect to handle client connection
  React.useEffect(() => {
    if (client && gameState.roomId) {
      console.log('Client connected, joining game...');
      // Join the game after a short delay to ensure connection is established
      setTimeout(() => {
        client.joinGame();
      }, 500);
    }
  }, [client, gameState.roomId]);

  // Add effect to clean up client on unmount
  React.useEffect(() => {
    return () => {
      if (client) {
        client.disconnect();
      }
    };
  }, [client]);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-[#f5f2eb] shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-4">
            <img 
              src="/sudoku-logo.png" 
              alt="Speed Sudoku Logo" 
              className="h-20 w-20 object-contain"
            />
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-2">
              Speed Sudoku
            </h1>
            <img 
              src="/sudoku-logo.png" 
              alt="Speed Sudoku Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {!gameState.roomId ? (
            <RoomCreation onCreateRoom={createRoom} onJoinRoom={joinRoom} />
          ) : (
            <SudokuGrid gameState={gameState} onCellUpdate={handleCellUpdate} client={client} />
          )}
        </div>
      
      </main>
    </div>
  );
};

export default App; 