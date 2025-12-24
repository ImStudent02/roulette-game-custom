const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');
const serverDb = require('./lib/serverDb.cjs');

const dev = process.env.NODE_ENV !== 'production';
// Bind to 0.0.0.0 to accept connections from localhost, 127.0.0.1, and external (Tor, LAN, etc.)
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname: 'localhost', port }); // Next.js uses localhost for internal routing
const handle = app.getRequestHandler();

// ============================================
// Game State - Global Clock Based
// ============================================

// UPDATED TIMER CONFIG - Extended locking for batch bet processing
const TIMER_CONFIG = {
  bettingDuration: 210,     // 3:30 betting
  lockedDuration: 30,       // 30s lock - EXTENDED for server processing (was 15s)
  spinDuration: 15,         // 15s wheel spin
  resultDuration: 45,       // 45s result display (reduced from 60s)
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

// ============================================
// Bet Multipliers (match currency system)
// ============================================

const MULTIPLIERS = {
  black: 1.8,
  white: 1.9,
  even: 1.95,
  odd: 1.95,
  green: 3,
  pink: 5,
  gold: null, // Dynamic: 50, 100, 150, 200
  red: 7,
  x: 50,
  number: 30,
};

// ============================================
// In-Memory Bet Storage (Per Round)
// Optimized for batch processing
// ============================================

// Structure: { roundNumber -> { username -> { bets: [], currencyType: 'trial'|'real', totalBetAmount: number } } }
const roundBets = new Map();

// Structure: { roundNumber -> { processed: boolean, results: Map<username, payout> } }
const roundResults = new Map();

// Track user balances in memory for fast validation (sync from DB on connect)
// Structure: { username -> { fermentedMangos, expiredJuice, mangos, mangoJuice } }
const userBalances = new Map();

// Clear old round data (keep last 3 rounds for late-joiners to see results)
function cleanupOldRounds() {
  const currentRound = getCurrentRoundNumber();
  const keepRounds = [currentRound, currentRound - 1, currentRound - 2];
  
  for (const [round] of roundBets) {
    if (!keepRounds.includes(round)) {
      roundBets.delete(round);
      roundResults.delete(round);
    }
  }
}

// ============================================
// Seeded Random & Color Generation
// ============================================

function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

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
  let seedOffset = 0;
  do {
    goldPosition = Math.floor(seededRandom(seed + seedOffset) * 51);
    seedOffset++;
    if (seedOffset > 100) {
      goldPosition = colors.findIndex(c => c === 'none');
      break;
    }
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

// ============================================
// Round & Phase Helpers
// ============================================

function getCurrentRoundNumber() {
  const elapsedSinceStart = Math.floor((Date.now() - SERVER_EPOCH) / 1000);
  return Math.floor(elapsedSinceStart / TOTAL_ROUND_TIME) + 1;
}

function getCurrentPhase() {
  const elapsedSinceStart = Math.floor((Date.now() - SERVER_EPOCH) / 1000);
  const elapsedInRound = elapsedSinceStart % TOTAL_ROUND_TIME;
  
  if (elapsedInRound < TIMER_CONFIG.bettingDuration) {
    return elapsedInRound >= 180 ? 'warning' : 'betting';
  } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) {
    return 'locked';
  } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration) {
    return 'spinning';
  } else {
    return 'result';
  }
}

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
  const extraRotations = 6; // Visual spins
  const pocketAngle = ANGLE_PER_SLOT;
  const segmentCenterAngle = (winningIndex + 0.5) * pocketAngle;
  const targetAngle = (extraRotations * 360) + (360 - segmentCenterAngle);
  
  // Get round stats (number of bets, total bet amount)
  const roundData = roundBets.get(roundNumber);
  const betCount = roundData ? [...roundData.values()].reduce((sum, u) => sum + u.bets.length, 0) : 0;
  const playerCount = roundData ? roundData.size : 0;
  
  return {
    serverTime: now,
    roundNumber,
    phase,
    roundStartTime,
    phaseEndsAt,
    spinStartAt: lockEndsAt,
    resultAt: spinEndsAt,
    winningIndex,
    winningPosition,
    targetAngle,
    outerColors,
    goldPosition,
    goldMultiplier,
    // Stats for display
    betCount,
    playerCount,
    timerConfig: TIMER_CONFIG, // Send to client for sync
  };
}

// ============================================
// Bet Processing
// ============================================

// Place a bet (validation only, no DB write until lock phase)
function placeBet(username, bet, currencyType = 'trial') {
  const phase = getCurrentPhase();
  
  // Only allow bets during betting/warning phase
  if (phase !== 'betting' && phase !== 'warning') {
    return { success: false, error: 'Betting is closed' };
  }
  
  const roundNumber = getCurrentRoundNumber();
  
  // Validate bet structure
  const { type, amount, targetNumber } = bet;
  if (!type || !amount || amount <= 0) {
    return { success: false, error: 'Invalid bet' };
  }
  
  // Get/create round bets map
  if (!roundBets.has(roundNumber)) {
    roundBets.set(roundNumber, new Map());
  }
  
  const userRoundData = roundBets.get(roundNumber);
  if (!userRoundData.has(username)) {
    userRoundData.set(username, { bets: [], currencyType, totalBetAmount: 0 });
  }
  
  const userData = userRoundData.get(username);
  
  // Check if user has enough balance (from memory cache)
  const balance = userBalances.get(username);
  if (balance) {
    const currency = currencyType === 'trial' ? 'fermentedMangos' : 'mangos';
    const currentBalance = balance[currency] || 0;
    const pendingBets = userData.totalBetAmount;
    
    if (pendingBets + amount > currentBalance) {
      return { success: false, error: 'Insufficient balance', balance: currentBalance, pending: pendingBets };
    }
  }
  
  // Store bet (in memory for fast access)
  const betId = `${roundNumber}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  userData.bets.push({
    id: betId,
    type,
    amount,
    targetNumber,
    placedAt: Date.now(),
  });
  userData.totalBetAmount += amount;
  
  return { success: true, betId, roundNumber, pendingTotal: userData.totalBetAmount };
}

// Calculate winnings for a bet
function calculateWinnings(bet, winningPosition, outerColors, goldPosition, goldMultiplier) {
  const { type, amount, targetNumber } = bet;
  
  // Check if bet wins
  let multiplier = 0;
  let won = false;
  
  switch (type) {
    case 'black':
      if (winningPosition.color === 'black' && winningPosition.number !== 'X') {
        won = true;
        multiplier = MULTIPLIERS.black;
      }
      break;
      
    case 'white':
      if (winningPosition.color === 'white') {
        won = true;
        multiplier = MULTIPLIERS.white;
      }
      break;
      
    case 'even':
      if (typeof winningPosition.number === 'number' && winningPosition.number % 2 === 0) {
        won = true;
        multiplier = MULTIPLIERS.even;
      }
      break;
      
    case 'odd':
      if (typeof winningPosition.number === 'number' && winningPosition.number % 2 === 1) {
        won = true;
        multiplier = MULTIPLIERS.odd;
      }
      break;
      
    case 'x':
      if (winningPosition.number === 'X') {
        won = true;
        multiplier = MULTIPLIERS.x;
      }
      break;
      
    case 'number':
      if (winningPosition.number === targetNumber) {
        won = true;
        // Check if landing on gold position
        const winningIdx = WHEEL_NUMBERS.findIndex(w => 
          w.number === winningPosition.number && w.color === winningPosition.color
        );
        if (winningIdx === goldPosition) {
          multiplier = goldMultiplier; // 50-200x
        } else {
          multiplier = MULTIPLIERS.number; // 30x
        }
      }
      break;
      
    case 'green':
      // Green wins if winning index has green outer color
      {
        const winningIdx = WHEEL_NUMBERS.findIndex(w => 
          w.number === winningPosition.number && w.color === winningPosition.color
        );
        if (outerColors[winningIdx] === 'green') {
          won = true;
          multiplier = MULTIPLIERS.green;
        }
      }
      break;
      
    case 'pink':
      {
        const winningIdx = WHEEL_NUMBERS.findIndex(w => 
          w.number === winningPosition.number && w.color === winningPosition.color
        );
        if (outerColors[winningIdx] === 'pink') {
          won = true;
          multiplier = MULTIPLIERS.pink;
        }
      }
      break;
      
    case 'gold':
      {
        const winningIdx = WHEEL_NUMBERS.findIndex(w => 
          w.number === winningPosition.number && w.color === winningPosition.color
        );
        if (winningIdx === goldPosition) {
          won = true;
          multiplier = goldMultiplier;
        }
      }
      break;
      
    case 'red':
      {
        const winningIdx = WHEEL_NUMBERS.findIndex(w => 
          w.number === winningPosition.number && w.color === winningPosition.color
        );
        if (outerColors[winningIdx] === 'red') {
          won = true;
          multiplier = MULTIPLIERS.red;
        }
      }
      break;
  }
  
  return {
    won,
    multiplier,
    winnings: won ? Math.floor(amount * multiplier) : 0,
    lossAmount: won ? 0 : amount,
  };
}

// Process all bets for a round (called during lock phase)
// This is BATCHED for efficiency - process all users at once
async function processRoundBets(roundNumber) {
  const roundData = roundBets.get(roundNumber);
  if (!roundData || roundData.size === 0) {
    console.log(`[Round ${roundNumber}] No bets to process`);
    return;
  }
  
  // Check if already processed
  if (roundResults.has(roundNumber) && roundResults.get(roundNumber).processed) {
    return;
  }
  
  console.log(`[Round ${roundNumber}] Processing ${roundData.size} players with bets...`);
  const startTime = Date.now();
  
  // Get winning data
  const winningSeed = roundNumber * 54321 + SERVER_EPOCH;
  const winningIndex = Math.floor(seededRandom(winningSeed) * WHEEL_NUMBERS.length);
  const winningPosition = WHEEL_NUMBERS[winningIndex];
  const { colors: outerColors, goldPosition, goldMultiplier } = generateOuterColorsForRound(roundNumber);
  
  // Process each player's bets
  const results = new Map();
  
  for (const [username, userData] of roundData) {
    let totalWinnings = 0;
    let totalLosses = 0;
    const betResults = [];
    
    for (const bet of userData.bets) {
      const result = calculateWinnings(bet, winningPosition, outerColors, goldPosition, goldMultiplier);
      betResults.push({ ...bet, ...result });
      
      if (result.won) {
        totalWinnings += result.winnings;
      } else {
        totalLosses += result.lossAmount;
      }
    }
    
    results.set(username, {
      currencyType: userData.currencyType,
      bets: betResults,
      totalBetAmount: userData.totalBetAmount,
      totalWinnings,
      totalLosses,
      netResult: totalWinnings - totalLosses,
    });
    
    // Update in-memory balance
    const balance = userBalances.get(username);
    if (balance) {
      if (userData.currencyType === 'trial') {
        // Trial: deduct fermentedMangos, add expiredJuice for wins
        balance.fermentedMangos = Math.max(0, balance.fermentedMangos - totalLosses);
        balance.expiredJuice = (balance.expiredJuice || 0) + totalWinnings;
      } else {
        // Real: deduct mangos, add mangoJuice for wins
        balance.mangos = Math.max(0, balance.mangos - totalLosses);
        balance.mangoJuice = (balance.mangoJuice || 0) + totalWinnings;
      }
      
      // Update stats
      if (totalWinnings > 0) {
        balance.totalWins = (balance.totalWins || 0) + 1;
      }
      if (totalLosses > 0) {
        balance.totalLosses = (balance.totalLosses || 0) + 1;
      }
    }
  }
  
  // Store results
  roundResults.set(roundNumber, { processed: true, results, processedAt: Date.now() });
  
  const processTime = Date.now() - startTime;
  console.log(`[Round ${roundNumber}] Processed in ${processTime}ms`);
  
  // Queue DB writes (async, non-blocking)
  queueDBWrites(roundNumber, results);
  
  return results;
}

// Queue database writes (async, doesn't block game)
async function queueDBWrites(roundNumber, results) {
  console.log(`[Round ${roundNumber}] Queued ${results.size} user balance updates for DB`);
  
  // Convert Map to array for batch update
  const updates = [];
  for (const [username, result] of results) {
    updates.push({
      username,
      currencyType: result.currencyType,
      totalWinnings: result.totalWinnings,
      totalLosses: result.totalLosses,
    });
  }
  
  // Batch update balances (async, non-blocking)
  try {
    await serverDb.batchUpdateBalances(updates);
    await serverDb.logRoundTransactions(roundNumber, results);
  } catch (error) {
    console.error(`[Round ${roundNumber}] DB write error:`, error.message);
  }
}

// ============================================
// WebSocket Server
// ============================================

let wss;
const clients = new Map(); // ws -> { username, authenticated, currencyType }

function broadcastToAll(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Send personal result to a specific user
function sendToUser(username, message) {
  for (const [ws, info] of clients) {
    if (info.username === username && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      break;
    }
  }
}

// Broadcast game state every 1 second
function startGameLoop() {
  let lastPhase = '';
  let lastRound = 0;
  
  setInterval(() => {
    if (!wss || wss.clients.size === 0) return;
    
    const state = getGameState();
    
    // Broadcast to all clients
    broadcastToAll({ type: 'gameState', data: state });
    
    // Detect phase transitions
    if (state.phase !== lastPhase || state.roundNumber !== lastRound) {
      console.log(`[Phase] Round ${state.roundNumber}: ${lastPhase || 'start'} -> ${state.phase}`);
      
      // When entering lock phase, start processing bets
      if (state.phase === 'locked' && lastPhase !== 'locked') {
        console.log(`[Lock] Processing bets for round ${state.roundNumber}...`);
        processRoundBets(state.roundNumber).then(results => {
          if (results) {
            // Send personal results to each player
            for (const [username, result] of results) {
              sendToUser(username, {
                type: 'betResults',
                data: {
                  roundNumber: state.roundNumber,
                  ...result,
                }
              });
            }
          }
        });
      }
      
      // When entering result phase, broadcast winner info
      if (state.phase === 'result' && lastPhase !== 'result') {
        const roundResult = roundResults.get(state.roundNumber);
        if (roundResult) {
          // Broadcast summary (not individual results)
          const summary = {
            roundNumber: state.roundNumber,
            winningNumber: state.winningPosition.number,
            winningColor: state.winningPosition.color,
            totalPlayers: roundResult.results ? roundResult.results.size : 0,
          };
          broadcastToAll({ type: 'roundSummary', data: summary });
        }
      }
      
      // New round - cleanup old data
      if (state.roundNumber !== lastRound) {
        cleanupOldRounds();
      }
      
      lastPhase = state.phase;
      lastRound = state.roundNumber;
    }
  }, 1000);
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
          authenticated: true,
          currencyType: data.currencyType || 'trial', // 'trial' or 'real'
        });
        
        // Load user balance into memory cache
        if (data.balance) {
          userBalances.set(data.username, {
            fermentedMangos: data.balance.fermentedMangos || 0,
            expiredJuice: data.balance.expiredJuice || 0,
            mangos: data.balance.mangos || 0,
            mangoJuice: data.balance.mangoJuice || 0,
            totalWins: data.balance.totalWins || 0,
            totalLosses: data.balance.totalLosses || 0,
          });
        }
        
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
        
        // Place bet with currency type
        const betResult = placeBet(
          clientInfo.username, 
          data, 
          clientInfo.currencyType
        );
        
        ws.send(JSON.stringify({ 
          type: betResult.success ? 'betPlaced' : 'betError', 
          data: betResult 
        }));
        
        // Update local balance in memory
        if (betResult.success) {
          const balance = userBalances.get(clientInfo.username);
          if (balance) {
            // Show pending balance immediately
            ws.send(JSON.stringify({
              type: 'balanceUpdate',
              data: {
                ...balance,
                pending: betResult.pendingTotal,
              }
            }));
          }
        }
        break;
        
      case 'switchCurrency':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        
        // Switch between trial and real currency
        clientInfo.currencyType = data.currencyType;
        ws.send(JSON.stringify({ 
          type: 'currencySwitch', 
          data: { currencyType: data.currencyType } 
        }));
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
        
      case 'getBalance':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        const balance = userBalances.get(clientInfo.username);
        ws.send(JSON.stringify({ type: 'balance', data: balance || {} }));
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
    clients.set(ws, { authenticated: false, currencyType: 'trial' });
    
    // Send initial game state
    const state = getGameState();
    ws.send(JSON.stringify({ type: 'gameState', data: state }));
    
    ws.on('message', (message) => {
      handleMessage(ws, message.toString());
    });
    
    ws.on('close', () => {
      const info = clients.get(ws);
      if (info?.username) {
        // Keep balance in memory for reconnection
        console.log(`[WS] ${info.username} disconnected`);
      }
      clients.delete(ws);
      console.log(`[WS] Client disconnected (remaining: ${wss.clients.size})`);
    });
    
    ws.on('error', (error) => {
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
    console.log(`> Timer config: betting=${TIMER_CONFIG.bettingDuration}s, locked=${TIMER_CONFIG.lockedDuration}s, spin=${TIMER_CONFIG.spinDuration}s, result=${TIMER_CONFIG.resultDuration}s`);
    console.log(`> Total round time: ${TOTAL_ROUND_TIME}s (${Math.floor(TOTAL_ROUND_TIME / 60)}m ${TOTAL_ROUND_TIME % 60}s)`);
  });
});
