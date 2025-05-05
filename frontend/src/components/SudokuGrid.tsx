import React, { useState, useEffect } from 'react';
import { SudokuClient, GameState } from '../utils/partykit';

interface Props {
  gameState: GameState;
  onCellUpdate: (row: number, col: number, value: number) => void;
  client: SudokuClient | null;
}

export const SudokuGrid: React.FC<Props> = ({ gameState, onCellUpdate, client }) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [board, setBoard] = useState<number[][]>(Array(9).fill(null).map(() => Array(9).fill(0)));
  const [cellPlayers, setCellPlayers] = useState<string[][]>(Array(9).fill(null).map(() => Array(9).fill(null)));
  const [playerFilledCells, setPlayerFilledCells] = useState<boolean[][]>(Array(9).fill(null).map(() => Array(9).fill(false)));

  // Update board when puzzle is received
  useEffect(() => {
    console.log('SudokuGrid received gameState:', gameState);
    if (gameState.puzzle && gameState.puzzle.length > 0) {
      console.log('Setting board with puzzle:', gameState.puzzle);
      setBoard(gameState.puzzle);
      // Only reset player filled cells if it's a new puzzle
      // if (gameState.puzzle.length === 9 && gameState.puzzle[0].length === 9) {
      //   setPlayerFilledCells(Array(9).fill(null).map(() => Array(9).fill(false)));
      //   setCellPlayers(Array(9).fill(null).map(() => Array(9).fill(null)));
      // }
    }
  }, [gameState.puzzle]);

  // Log when players change
  useEffect(() => {
    if (gameState.players) {
      console.log('Players updated:', gameState.players);
      const playerIds = gameState.players instanceof Map 
        ? Array.from(gameState.players.keys())
        : Object.keys(gameState.players);
      console.log('Current player IDs:', playerIds);
    }
  }, [gameState.players]);

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
            setBoard(state.puzzle);
            // Reset player filled cells when new puzzle is loaded
            // setPlayerFilledCells(Array(9).fill(null).map(() => Array(9).fill(false)));
            // setCellPlayers(Array(9).fill(null).map(() => Array(9).fill(null)));
          }
          // Log players for debugging
          if (state.players) {
            console.log('Current players:', state.players);
            // Log the current player's ID
            const playersArray = state.players instanceof Map 
              ? Array.from(state.players.keys())
              : Object.keys(state.players);
            console.log('Players array:', playersArray);
          }
        },
        (move) => {
          console.log('Move received:', move);
          // Update board with move for both collaborative and blind modes
          setBoard(prev => {
            const newBoard = [...prev];
            newBoard[move.row][move.col] = move.value;
            return newBoard;
          });
          // Mark the cell as player-filled and store the player ID
          setPlayerFilledCells(prev => {
            const newFilled = [...prev];
            newFilled[move.row][move.col] = true;
            return newFilled;
          });
          setCellPlayers(prev => {
            const newPlayers = [...prev];
            newPlayers[move.row][move.col] = move.playerId;
            console.log('Setting cell player:', { 
              row: move.row, 
              col: move.col, 
              playerId: move.playerId, 
              gameMode: move.gameMode 
            });
            return newPlayers;
          });
        },
        (winner) => {
          console.log('Game complete! Winner:', winner);
        }
      );

      newClient.joinGame();

      return () => {
        newClient.disconnect();
      };
    }
  }, [gameState.roomId, gameState.gameMode]);

  // Assign colors to new players as they join
  useEffect(() => {
    if (gameState.players) {
      const playerIds = gameState.players instanceof Map 
        ? Array.from(gameState.players.keys())
        : Object.keys(gameState.players);

      console.log('Players in game:', playerIds);
    }
  }, [gameState.players]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const handleNumberInput = (number: number) => {
    if (selectedCell && client) {
      const { row, col } = selectedCell;
      const playerId = client.getPlayerId();
      console.log('Handling number input:', { row, col, number, playerId });
      
      if (!playerId) {
        console.error('No player ID available');
        return;
      }

      // Check if the player is registered
      if (!client.isPlayerRegistered()) {
        console.log('Waiting for player registration...');
        // Try to join the game again
        client.joinGame();
        return;
      }

      // Update local state immediately for better UX
      setBoard(prev => {
        const newBoard = [...prev];
        newBoard[row][col] = number;
        return newBoard;
      });

      // Mark the cell as player-filled
      setPlayerFilledCells(prev => {
        const newFilled = [...prev];
        newFilled[row][col] = true;
        return newFilled;
      });

      // Store the current player's ID for this cell
      setCellPlayers(prev => {
        const newPlayers = [...prev];
        newPlayers[row][col] = playerId;
        return newPlayers;
      });

      // Send move to server
      onCellUpdate(row, col, number);
    }
  };

  // Get cell color based on player
  const getCellColor = (playerId: string | null, isPlayerFilled: boolean) => {
    if (!isPlayerFilled || !playerId || !client) {
      return '#111';
    }
    return client.getPlayerColor(playerId);
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
        <div className="flex flex-col items-center mb-4">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">
            Game Room: {' '}
            {gameState.roomId?.split('-').map((part, index) => (
              <span key={index} className="inline-block px-2 py-1 mx-1 bg-gray-100 rounded-md font-mono">
                {part}
              </span>
            ))}
          </h3>
        </div>
        <div className="mb-4 text-center">
          <h4 className="text-md font-semibold text-gray-600 mb-1">
            Share the invite link to play with friends. </h4>
          <h4 className="text-md font-semibold text-gray-600 mb-1"> 
            Start putting in numbers and your friend will see your moves.
            <br></br>
            Inviting a new player &/ refreshing the page will reset the game.
          </h4>
        </div>

        {/* Invite link and copy button */}
        {gameState.roomId && (
          <div className="mb-4 flex flex-col items-center gap-2">
            <div className="w-full max-w-2xl p-2 border border-gray-300 rounded-md bg-white">
              <span className="text-sm text-gray-700 truncate block">{inviteLink}</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors"
            >
              Copy Invite Link
            </button>
          </div>
        )}
        <div className="mt-4 flex justify-center gap-4">
          <div className="px-4 py-2 bg-gray-100 rounded-md">
            <p className="text-sm font-medium text-gray-700">
              Mode: <span className="text-indigo-600">{gameState.gameMode}</span>
            </p>
          </div>
          <div className="px-4 py-2 bg-gray-100 rounded-md">
            <p className="text-sm font-medium text-gray-700">
              Difficulty: <span className="text-indigo-600 capitalize">{gameState.difficulty}</span>
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col items-center gap-8">
          {/* Sudoku Grid and Number Pad Container */}
          <div className="flex gap-8 items-start">
            {/* Sudoku Grid */}
            <div className="w-[400px]">
              <div className="grid grid-cols-9 gap-0.5 bg-gray-800 p-1 rounded-lg">
                {board.map((row, rowIndex) => (
                  row.map((cell, colIndex) => {
                    const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
                    const isSameRow = selectedCell?.row === rowIndex;
                    const isSameCol = selectedCell?.col === colIndex;
                    const playerId = cellPlayers[rowIndex][colIndex];
                    const isPlayerFilled = playerFilledCells[rowIndex][colIndex];
                    const color = getCellColor(playerId, isPlayerFilled);
                    
                    if (isPlayerFilled && playerId) {
                      console.log(`Cell [${rowIndex},${colIndex}] - Player: ${playerId}, Color: ${color}`);
                    }
                   
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`
                          aspect-square bg-white flex items-center justify-center text-lg font-medium
                          ${isSelected ? '!bg-blue-100' : ''}
                          ${(isSameRow || isSameCol ) && !isSelected ? '!bg-blue-50' : ''}
                          ${rowIndex % 3 === 0 ? 'border-t-4 border-gray-800' : 'border-t border-gray-300'}
                          ${colIndex % 3 === 0 ? 'border-l-4 border-gray-800' : 'border-l border-gray-300'}
                          ${rowIndex === 8 ? 'border-b-4 border-gray-800' : ''}
                          ${colIndex === 8 ? 'border-r-4 border-gray-800' : ''}
                          cursor-pointer hover:bg-gray-50
                        `}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                      >
                        {cell !== 0 ? (
                          <span style={{ color }} className="font-bold">
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
    </div>
  );
};

export default SudokuGrid;