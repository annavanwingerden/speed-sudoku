const { proxyActivities } = require('@temporalio/workflow');

// Define activities that can be called from the workflow
const { generatePuzzle } = proxyActivities({
  startToCloseTimeout: '1 minute',
});

// Game session workflow
async function GameSessionWorkflow(difficulty) {
  // Generate a new puzzle
  const puzzle = await generatePuzzle(difficulty);
  
  return {
    puzzle,
    startTime: Date.now(),
    players: new Map(),
    isComplete: false
  };
}

module.exports = {
  GameSessionWorkflow
}; 