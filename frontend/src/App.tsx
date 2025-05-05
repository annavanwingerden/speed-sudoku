import React, { useState } from 'react';
import SudokuGrid from './components/SudokuGrid';
import RoomCreation from './components/RoomCreation';
import { SudokuClient } from './utils/partykit';
import { uniqueNamesGenerator, Config, adjectives, animals } from 'unique-names-generator';
import './App.css';

interface GameState {
  roomId: string | null;
  gameMode: 'blind' | 'collaborative' | null;
  difficulty: string | null;
  puzzle: number[][] | null;
  players: Map<string, any> | null;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    roomId: null,
    gameMode: null,
    difficulty: null,
    puzzle: null,
    players: null
  });

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
    const client = new SudokuClient(
      roomId,
      (state) => {
        console.log('Game state received from server:', state);
        // Update the game state with the new state from the server
        setGameState(prev => {
          const newState = {
            ...prev,
            puzzle: state.puzzle,
            players: state.players
          };
          console.log('Updated game state:', newState);
          return newState;
        });
      },
      (move) => {
        console.log('Move made:', move);
      },
      (winner) => {
        console.log('Game complete! Winner:', winner);
      }
    );

    // Create the game with the selected difficulty
    client.createGame(difficulty, gameMode);

    // Update the game state
    setGameState({
      roomId: client.roomId,
      gameMode,
      difficulty,
      puzzle: null,
      players: null
    });
  };

  // Join an existing room by roomId
  const joinRoom = (roomId: string) => {
    console.log('Joining room:', roomId);
    
    // Create a new client for the game
    const client = new SudokuClient(
      roomId,
      (state) => {
        console.log('Game state received from server:', state);
        // Update the game state with the new state from the server
        setGameState(prev => {
          const newState = {
            ...prev,
            puzzle: state.puzzle,
            players: state.players,
            gameMode: state.gameMode || prev.gameMode,
            difficulty: state.difficulty || prev.difficulty
          };
          console.log('Updated game state:', newState);
          return newState;
        });
      },
      (move) => {
        console.log('Move made:', move);
      },
      (winner) => {
        console.log('Game complete! Winner:', winner);
      }
    );

    // Update the game state
    setGameState({
      roomId: client.roomId,
      gameMode: null,
      difficulty: null,
      puzzle: null,
      players: null
    });

    // Join the game
    client.joinGame();
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

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Speed Sudoku
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {!gameState.roomId ? (
            <RoomCreation onCreateRoom={createRoom} onJoinRoom={joinRoom} />
          ) : (
            <SudokuGrid gameState={gameState} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App; 