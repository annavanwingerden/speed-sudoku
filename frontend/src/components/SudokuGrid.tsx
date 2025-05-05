import React, { useState, useEffect } from 'react';
import { SudokuClient } from '../utils/partykit';

interface Player {
  board: number[][];
  score: number;
  color: string;
}

interface SudokuGridProps {
  gameState: {
    roomId: string | null;
    gameMode: 'blind' | 'collaborative' | null;
    difficulty: string | null;
    puzzle: number[][] | null;
    players: Map<string, Player> | { [key: string]: Player } | null;
  };
}

// Player colors mapping
const PLAYER_COLORS: { [key: string]: string } = {
  'player1': 'text-blue-600',
  'player2': 'text-green-600',
  'player3': 'text-purple-600',
  'player4': 'text-red-600',
  'player5': 'text-yellow-600',
  'player6': 'text-pink-600',
  'player7': 'text-indigo-600',
  'player8': 'text-orange-600',
};

const SudokuGrid: React.FC<SudokuGridProps> = ({ gameState }) => {
  const [board, setBoard] = useState<number[][]>(
    Array(9).fill(null).map(() => Array(9).fill(0))
  );
  const [playerFilledCells, setPlayerFilledCells] = useState<boolean[][]>(
    Array(9).fill(null).map(() => Array(9).fill(false))
  );
  const [cellPlayers, setCellPlayers] = useState<string[][]>(
    Array(9).fill(null).map(() => Array(9).fill(''))
  );
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [client, setClient] = useState<SudokuClient | null>(null);
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isPaused) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update board when puzzle is received
  useEffect(() => {
    console.log('SudokuGrid received gameState:', gameState);
    if (gameState.puzzle) {
      console.log('Setting board with puzzle:', gameState.puzzle);
      setBoard(gameState.puzzle);
      // Reset player filled cells when new puzzle is loaded
      setPlayerFilledCells(Array(9).fill(null).map(() => Array(9).fill(false)));
      setCellPlayers(Array(9).fill(null).map(() => Array(9).fill('')));
    }
  }, [gameState.puzzle]);

  useEffect(() => {
    if (gameState.roomId) {
      console.log('Initializing PartyKit client for room:', gameState.roomId);
      const newClient = new SudokuClient(
        gameState.roomId,
        (state) => {
          console.log('Received state update from PartyKit:', state);
          // Update local state with game state
          if (state.puzzle) {
            console.log('Setting board from PartyKit state:', state.puzzle);
            setBoard(state.puzzle.map(row => [...row]));
            // Reset player filled cells when new puzzle is loaded
            setPlayerFilledCells(Array(9).fill(null).map(() => Array(9).fill(false)));
            setCellPlayers(Array(9).fill(null).map(() => Array(9).fill('')));
          }
        },
        (move) => {
          console.log('Move received:', move);
          // Update board with move for both collaborative and blind modes
          setBoard(prev => {
            const newBoard = prev.map(row => [...row]);
            newBoard[move.row][move.col] = move.value;
            return newBoard;
          });
          // Mark the cell as player-filled and store the player ID
          setPlayerFilledCells(prev => {
            const newFilled = prev.map(row => [...row]);
            newFilled[move.row][move.col] = true;
            return newFilled;
          });
          setCellPlayers(prev => {
            const newPlayers = prev.map(row => [...row]);
            newPlayers[move.row][move.col] = move.playerId;
            console.log('Updated cell player:', {
              row: move.row,
              col: move.col,
              playerId: move.playerId,
              color: move.color
            });
            return newPlayers;
          });
        },
        (winner) => {
          console.log('Game complete! Winner:', winner);
          setIsPaused(true);
        }
      );

      setClient(newClient);
      newClient.joinGame();

      return () => {
        newClient.disconnect();
      };
    }
  }, [gameState.roomId, gameState.gameMode, gameState]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  const handleNumberInput = (number: number) => {
    if (selectedCell && client) {
      const [row, col] = selectedCell;
      
      // Check if we have a valid player ID
      if (!client.getPlayerId()) {
        console.error('Waiting for player ID to be assigned...');
        return;
      }

      console.log('Making move:', { row, col, number, playerId: client.getPlayerId() });
      
      // Update local state immediately for better UX
      setBoard(prev => {
        const newBoard = prev.map(row => [...row]);
        newBoard[row][col] = number;
        return newBoard;
      });
      
      // Mark the cell as player-filled and store the current player's ID
      setPlayerFilledCells(prev => {
        const newFilled = prev.map(row => [...row]);
        newFilled[row][col] = true;
        return newFilled;
      });

      // Store the current player's ID for this cell
      setCellPlayers(prev => {
        const newPlayers = prev.map(row => [...row]);
        newPlayers[row][col] = client.getPlayerId() || '';
        return newPlayers;
      });

      // Send move to server
      client.makeMove(row, col, number);
    }
  };

  // Invite link logic
  const inviteLink = gameState.roomId ? `${window.location.origin}?roomId=${gameState.roomId}` : '';
  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        {/* Timer at top center */}
        <div className="flex justify-center items-center mb-6">
          <div className="text-2xl font-mono font-extrabold text-gray-900">
            {formatTime(time)} {isPaused && <span className="text-lg">⏸️</span>}
          </div>
        </div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Game Room: {gameState.roomId}
          </h3>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
        {/* Players in the room with their colors */}
        {gameState.players && (
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-1">Players in Room:</h4>
            <ul className="flex flex-wrap gap-2">
              {(() => {
                const playersArray = gameState.players instanceof Map 
                  ? Array.from(gameState.players.entries())
                  : Object.entries(gameState.players);
                
                return playersArray.map(([playerId, player], index) => (
                  <li key={playerId} className={`px-2 py-1 rounded text-sm ${PLAYER_COLORS[`player${index + 1}`]}`}>
                    {playerId}
                  </li>
                ));
              })()}
            </ul>
          </div>
        )}
        {/* Invite link and copy button */}
        {gameState.roomId && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-700 truncate max-w-xs">{inviteLink}</span>
            <button
              onClick={handleCopyLink}
              className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs font-medium"
            >
              Copy Invite Link
            </button>
          </div>
        )}
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Mode: {gameState.gameMode}
          </p>
          <p className="text-sm text-gray-500">
            Difficulty: {gameState.difficulty}
          </p>
        </div>
        
        <div className="mt-6 flex gap-8">
          {/* Sudoku Grid */}
          <div className="w-[400px]">
            <div className="grid grid-cols-9 gap-0.5 bg-gray-800 p-1 rounded-lg">
              {board.map((row, rowIndex) => (
                row.map((cell, colIndex) => {
                  const isSelected = selectedCell?.[0] === rowIndex && selectedCell?.[1] === colIndex;
                  const isSameRow = selectedCell?.[0] === rowIndex;
                  const isSameCol = selectedCell?.[1] === colIndex;
                  const isSameBox = 
                    Math.floor(rowIndex / 3) === Math.floor(selectedCell?.[0]! / 3) &&
                    Math.floor(colIndex / 3) === Math.floor(selectedCell?.[1]! / 3);
                  
                  const playerId = cellPlayers[rowIndex][colIndex];
                  const isPlayerFilled = playerFilledCells[rowIndex][colIndex];
                  
                  // Get the player's color from the game state
                  const playerColor = isPlayerFilled && gameState.players ? 
                    (gameState.players instanceof Map ? 
                      gameState.players.get(playerId)?.color : 
                      (gameState.players as { [key: string]: Player })[playerId]?.color) 
                    : '#000000';
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`
                        aspect-square bg-white flex items-center justify-center text-lg font-medium
                        ${isSelected ? 'bg-blue-100' : ''}
                        ${(isSameRow || isSameCol || isSameBox) && !isSelected ? 'bg-blue-50' : ''}
                        ${rowIndex % 3 === 0 ? 'border-t-4 border-gray-800' : 'border-t border-gray-300'}
                        ${colIndex % 3 === 0 ? 'border-l-4 border-gray-800' : 'border-l border-gray-300'}
                        ${rowIndex === 8 ? 'border-b-4 border-gray-800' : ''}
                        ${colIndex === 8 ? 'border-r-4 border-gray-800' : ''}
                        cursor-pointer hover:bg-gray-50
                      `}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell !== 0 ? (
                        <span style={{ 
                          color: playerColor,
                          fontWeight: 'bold'
                        }}>
                          {cell}
                        </span>
                      ) : ''}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Number Pad */}
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-4 max-w-[200px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button
                  key={number}
                  className="w-16 h-16 bg-indigo-600 text-white text-2xl font-bold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => handleNumberInput(number)}
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SudokuGrid; 