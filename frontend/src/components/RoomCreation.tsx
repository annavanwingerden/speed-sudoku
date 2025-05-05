import React, { useState } from 'react';

interface RoomCreationProps {
  onCreateRoom: (difficulty: string, gameMode: 'blind' | 'collaborative') => void;
  onJoinRoom: (roomId: string) => void;
}

const RoomCreation: React.FC<RoomCreationProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [difficulty, setDifficulty] = useState('Easy');
  const [gameMode, setGameMode] = useState<'blind' | 'collaborative'>('blind');
  const [showJoin, setShowJoin] = useState(false);
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateRoom(difficulty, gameMode);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinRoomId.trim()) {
      onJoinRoom(joinRoomId.trim());
    }
  };

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Create a New Game</h3>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
              <option value="Diabolical">Diabolical</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Game Mode</label>
            <div className="mt-2 space-y-4">
              <div className="flex items-center">
                <input
                  id="blind"
                  name="gameMode"
                  type="radio"
                  checked={gameMode === 'blind'}
                  onChange={() => setGameMode('blind')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="blind" className="ml-3 block text-sm font-medium text-gray-700">
                  Blind Race
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="collaborative"
                  name="gameMode"
                  type="radio"
                  checked={gameMode === 'collaborative'}
                  onChange={() => setGameMode('collaborative')}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
                />
                <label htmlFor="collaborative" className="ml-3 block text-sm font-medium text-gray-700">
                  Collaborative Race
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Game
          </button>
        </form>
        <div className="mt-4 flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowJoin((v) => !v)}
            className="mt-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm font-medium"
          >
            {showJoin ? 'Cancel' : 'Join Room'}
          </button>
          {showJoin && (
            <form onSubmit={handleJoinSubmit} className="mt-4 w-full flex flex-col items-center gap-2">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomCreation; 