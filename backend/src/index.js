const express = require('express');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const { Client } = require('@temporalio/client');
const { GameSessionWorkflow } = require('./workflows/game-session');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize Temporal client
const temporalClient = new Client();

// WebSocket server
const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'CREATE_ROOM':
          // Create new game session
          const workflow = await temporalClient.workflow.start(GameSessionWorkflow, {
            taskQueue: 'game-session',
            workflowId: `game-${Date.now()}`,
            args: [data.difficulty]
          });
          
          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomId: workflow.workflowId
          }));
          break;

        case 'JOIN_ROOM':
          // Handle joining existing room
          break;

        case 'MAKE_MOVE':
          // Handle player move
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'An error occurred'
      }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 