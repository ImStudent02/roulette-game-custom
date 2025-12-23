const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');

const dev = process.env.NODE_ENV !== 'production';
// Bind to 0.0.0.0 to accept connections from localhost, 127.0.0.1, and external (Tor, LAN, etc.)
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname: 'localhost', port }); // Next.js uses localhost for internal routing
const handle = app.getRequestHandler();

// ============================================
// Game State - Global Clock Based
// ============================================

const TIMER_CONFIG = {
  bettingDuration: 210,     // 3:30 betting
  lockedDuration: 15,       // 15s countdown suspense  
  spinDuration: 15,         // 15s wheel spin
  resultDuration: 60,       // 60s result display
};

const TOTAL_ROUND_TIME = 
  TIMER_CONFIG.bettingDuration + 
  TIMER_CONFIG.lockedDuration + 
  TIMER_CONFIG.spinDuration + 
  TIMER_CONFIG.resultDuration;

// Wheel positions - same as client
const WHEEL_NUMBERS = [
  { number: 26, color: 'black' }, { number: 44, color: 'black' },
  { number: 21, color: 'black' }, { number: 20, color: 'black' },
  { number: 33, color: 'black' }, { number: 14, color: 'black' },
  { number: 15, color: 'black' }, { number: 22, color: 'black' },
  { number: 31, color: 'black' }, { number: 43, color: 'black' },
  { number: 48, color: 'black' }, { number: 8, color: 'black' },
  { number: 3, color: 'black' }, { number: 13, color: 'black' },
  { number: 30, color: 'black' }, { number: 18, color: 'black' },
  { number: 24, color: 'black' }, { number: 'X', color: 'black' },
  { number: 41, color: 'white' }, { number: 10, color: 'white' },
  { number: 6, color: 'white' }, { number: 23, color: 'white' },
  { number: 7, color: 'white' }, { number: 2, color: 'white' },
  { number: 27, color: 'white' }, { number: 12, color: 'white' },
  { number: 36, color: 'white' }, { number: 47, color: 'white' },
  { number: 49, color: 'white' }, { number: 4, color: 'white' },
  { number: 45, color: 'white' }, { number: 16, color: 'white' },
  { number: 5, color: 'white' }, { number: 1, color: 'white' },
  { number: 35, color: 'white' }, { number: 17, color: 'black' },
  { number: 42, color: 'white' }, { number: 46, color: 'black' },
  { number: 39, color: 'white' }, { number: 34, color: 'black' },
  { number: 29, color: 'white' }, { number: 28, color: 'black' },
  { number: 11, color: 'white' }, { number: 40, color: 'black' },
  { number: 32, color: 'white' }, { number: 9, color: 'black' },
  { number: 50, color: 'white' }, { number: 19, color: 'black' },
  { number: 38, color: 'white' }, { number: 25, color: 'black' },
  { number: 37, color: 'white' }
];

// Angle per slot - matches client calculation
const ANGLE_PER_SLOT = 360 / 51;

// Server epoch - all time calculations based on this
const SERVER_EPOCH = Date.now();

// Gold multipliers pool
const GOLD_MULTIPLIERS = [50, 100, 150, 200];

// Seeded random for deterministic results
function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Generate consistent outer colors for a round
function generateOuterColorsForRound(roundNumber) {
  const colors = new Array(51).fill('none');
  const seed = roundNumber * 12345 + SERVER_EPOCH;
  
  // Green/Pink positions (10 alternating)
  const greenPinkPositions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];
  greenPinkPositions.forEach((pos, index) => {
    colors[pos % 51] = index % 2 === 0 ? 'green' : 'pink';
  });
  
  // Gold position - deterministic based on round
  let goldPosition;
  do {
    goldPosition = Math.floor(seededRandom(seed) * 51);
  } while (colors[goldPosition] !== 'none');
  
  colors[goldPosition] = 'gold';
  
  // Red positions around gold
  const redPositions = [
    (goldPosition - 2 + 51) % 51,
    (goldPosition - 1 + 51) % 51,
    (goldPosition + 1) % 51,
    (goldPosition + 2) % 51
  ];
  
  redPositions.forEach(pos => {
    if (colors[pos] === 'none') {
      colors[pos] = 'red';
    }
  });
  
  // Gold multiplier for this round
  const multiplierIndex = Math.floor(seededRandom(seed + 777) * GOLD_MULTIPLIERS.length);
  const goldMultiplier = GOLD_MULTIPLIERS[multiplierIndex];
  
  return { colors, goldPosition, goldMultiplier };
}

// Calculate current game state based on global clock
// Server sends ABSOLUTE TIMESTAMPS for precise client sync
function getGameState() {
  const now = Date.now();
  const elapsedSinceStart = Math.floor((now - SERVER_EPOCH) / 1000);
  
  const roundNumber = Math.floor(elapsedSinceStart / TOTAL_ROUND_TIME) + 1;
  const elapsedInRound = elapsedSinceStart % TOTAL_ROUND_TIME;
  
  // Round start time (absolute)
  const roundStartTime = SERVER_EPOCH + ((roundNumber - 1) * TOTAL_ROUND_TIME * 1000);
  
  // ABSOLUTE phase boundary timestamps
  const bettingEndsAt = roundStartTime + (TIMER_CONFIG.bettingDuration * 1000);
  const lockEndsAt = bettingEndsAt + (TIMER_CONFIG.lockedDuration * 1000);
  const spinEndsAt = lockEndsAt + (TIMER_CONFIG.spinDuration * 1000);
  const resultEndsAt = spinEndsAt + (TIMER_CONFIG.resultDuration * 1000);
  
  // Determine current phase and when it ends
  let phase;
  let phaseEndsAt;
  
  if (elapsedInRound < TIMER_CONFIG.bettingDuration) {
    phase = elapsedInRound >= 180 ? 'warning' : 'betting';
    phaseEndsAt = bettingEndsAt;
  } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) {
    phase = 'locked';
    phaseEndsAt = lockEndsAt;
  } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration) {
    phase = 'spinning';
    phaseEndsAt = spinEndsAt;
  } else {
    phase = 'result';
    phaseEndsAt = resultEndsAt;
  }
  
  // Deterministic winning position based on round
  const winningSeed = roundNumber * 54321 + SERVER_EPOCH;
  const winningIndex = Math.floor(seededRandom(winningSeed) * WHEEL_NUMBERS.length);
  const winningPosition = WHEEL_NUMBERS[winningIndex];
  
  // Outer colors for this round (deterministic)
  const { colors: outerColors, goldPosition, goldMultiplier } = generateOuterColorsForRound(roundNumber);
  
  // Calculate target angle - where wheel will stop
  // Extra rotations for visual effect + final position
  const extraRotations = 6; // Visual spins
  const pocketAngle = ANGLE_PER_SLOT;
  const segmentCenterAngle = (winningIndex + 0.5) * pocketAngle;
  const targetAngle = (extraRotations * 360) + (360 - segmentCenterAngle);
  
  return {
    // Server time for offset calculation
    serverTime: now,
    roundNumber,
    phase,
    
    // ABSOLUTE timestamps (clients sync from these)
    roundStartTime,
    phaseEndsAt,
    spinStartAt: lockEndsAt,  // When spin phase begins
    resultAt: spinEndsAt,      // When result phase begins (wheel must stop here)
    
    // Winning data
    winningIndex,
    winningPosition,
    targetAngle, // Final wheel rotation angle
    
    // Colors
    outerColors,
    goldPosition,
    goldMultiplier,
  };
}

// ============================================
// WebSocket Server
// ============================================

let wss;
const clients = new Map(); // ws -> { username, authenticated }

function broadcastToAll(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Broadcast game state every 1 second (timer/phase sync only, not animation)
function startGameLoop() {
  setInterval(() => {
    if (wss && wss.clients.size > 0) {
      const state = getGameState();
      broadcastToAll({ type: 'gameState', data: state });
    }
  }, 1000); // 1 second - clients handle smooth animation locally
}

// Handle incoming WebSocket messages
function handleMessage(ws, message) {
  try {
    const { type, data } = JSON.parse(message);
    const clientInfo = clients.get(ws);
    
    switch (type) {
      case 'auth':
        // Client authenticating with token
        clients.set(ws, { 
          username: data.username, 
          displayName: data.displayName,
          authenticated: true 
        });
        ws.send(JSON.stringify({ 
          type: 'authSuccess', 
          data: { message: 'Authenticated successfully' } 
        }));
        break;
        
      case 'placeBet':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        // TODO: Process bet and store in DB
        console.log(`Bet from ${clientInfo.username}:`, data);
        // For now, acknowledge
        ws.send(JSON.stringify({ type: 'betPlaced', data: { success: true, bet: data } }));
        break;
        
      case 'chat':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        // Broadcast chat to all
        broadcastToAll({ 
          type: 'chatMessage', 
          data: {
            username: clientInfo.username,
            displayName: clientInfo.displayName,
            message: data.message,
            sentAt: Date.now(),
            replyToTime: data.replyToTime,
          }
        });
        break;
        
      case 'editChat':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        // Broadcast edited chat
        broadcastToAll({
          type: 'chatEdited',
          data: {
            username: clientInfo.username,
            sentAt: data.sentAt,
            message: data.message,
            editedAt: Date.now(),
          }
        });
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
}

// ============================================
// Start Server
// ============================================

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Create WebSocket server on a specific path to avoid conflict with Next.js HMR
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientCount = wss.clients.size;
    console.log(`[WS] Client connected (total: ${clientCount})`);
    clients.set(ws, { authenticated: false });
    
    // Send initial game state
    const state = getGameState();
    ws.send(JSON.stringify({ type: 'gameState', data: state }));
    
    ws.on('message', (message) => {
      handleMessage(ws, message.toString());
    });
    
    ws.on('close', () => {
      clients.delete(ws);
      console.log(`[WS] Client disconnected (remaining: ${wss.clients.size})`);
    });
    
    ws.on('error', (error) => {
      // Ignore common WebSocket errors during disconnect
      if (error.code !== 'WS_ERR_INVALID_CLOSE_CODE') {
        console.error('[WS] Error:', error.message);
      }
      clients.delete(ws);
    });
  });

  // Start game loop
  startGameLoop();

  server.listen(port, hostname, () => {
    console.log(`> Live server ready on http://${hostname}:${port}`);
    console.log(`> WebSocket ready on ws://${hostname}:${port}/ws`);
    console.log(`> Environment: ${dev ? 'development' : 'production'}`);
    console.log(`> Server epoch: ${SERVER_EPOCH}`);
  });
});
