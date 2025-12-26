/**
 * Roulette Live Server v2
 * Refactored to use modular architecture
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer, WebSocket } = require('ws');
const serverDb = require('./lib/serverDb.cjs');

// Import server modules
const { 
  config, 
  gameState, 
  betProcessor, 
  houseProtection,
  logger
} = require('./server/index.cjs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

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

function sendToUser(username, message) {
  for (const [ws, info] of clients) {
    if (info.username === username && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      break;
    }
  }
}

// Update online user count for bet limit calculations
function updateOnlineUserCount() {
  const authenticatedCount = [...clients.values()].filter(c => c.authenticated).length;
  betProcessor.setOnlineUserCount(authenticatedCount);
}

// ============================================
// Bet Processing with House Protection
// ============================================

async function processRoundBets(roundNumber) {
  const roundBets = betProcessor.getRoundBets(roundNumber);
  if (!roundBets || roundBets.size === 0) {
    logger.debug(`[Round ${roundNumber}] No bets to process`);
    return;
  }
  
  // Check if already processed
  if (betProcessor.getRoundResults(roundNumber)?.processed) {
    return;
  }
  
  logger.info(`[Round ${roundNumber}] Processing ${roundBets.size} players with bets...`);
  const startTime = Date.now();
  
  // Use house protection to select outcome
  const { winningIndex, protected: wasProtected, houseProfit } = 
    houseProtection.selectProtectedOutcome(roundNumber, roundBets);
  
  // Get winning position details
  const { colors: outerColors, goldPosition, goldMultiplier } = 
    gameState.generateOuterColorsForRound(roundNumber);
  const winningPosition = config.WHEEL_NUMBERS[winningIndex];
  
  // Process each player's bets
  const results = new Map();
  
  for (const [username, userData] of roundBets) {
    let totalWinnings = 0;
    let totalLosses = 0;
    const betResults = [];
    
    for (const bet of userData.bets) {
      const result = betProcessor.calculateWinnings(
        bet, winningPosition, winningIndex, outerColors, goldPosition, goldMultiplier
      );
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
    const balance = betProcessor.getUserBalance(username);
    if (balance) {
      if (userData.currencyType === 'trial') {
        balance.fermentedMangos = Math.max(0, balance.fermentedMangos - totalLosses);
        balance.expiredJuice = (balance.expiredJuice || 0) + totalWinnings;
      } else {
        balance.mangos = Math.max(0, balance.mangos - totalLosses);
        balance.mangoJuice = (balance.mangoJuice || 0) + totalWinnings;
      }
      
      if (totalWinnings > 0) balance.totalWins = (balance.totalWins || 0) + 1;
      if (totalLosses > 0) balance.totalLosses = (balance.totalLosses || 0) + 1;
    }
  }
  
  // Store results
  betProcessor.setRoundResults(roundNumber, results);
  
  // Update house fund
  await houseProtection.processRoundOutcome(roundNumber, winningIndex, roundBets);
  
  const processTime = Date.now() - startTime;
  logger.info(`[Round ${roundNumber}] Processed in ${processTime}ms (protected: ${wasProtected})`);
  
  // Queue DB writes
  queueDBWrites(roundNumber, results);
  
  return { results, winningIndex, winningPosition };
}

// Queue database writes (async, non-blocking)
async function queueDBWrites(roundNumber, results) {
  logger.debug(`[Round ${roundNumber}] Queued ${results.size} user balance updates for DB`);
  
  const updates = [];
  for (const [username, result] of results) {
    updates.push({
      username,
      currencyType: result.currencyType,
      totalWinnings: result.totalWinnings,
      totalLosses: result.totalLosses,
    });
  }
  
  try {
    await serverDb.batchUpdateBalances(updates);
    await serverDb.logRoundTransactions(roundNumber, results);
  } catch (error) {
    logger.error(`[Round ${roundNumber}] DB write error`, error.stack || error.message);
  }
}

// ============================================
// Game Loop
// ============================================

// Store the determined winning index for each round
const roundWinningIndices = new Map();

function startGameLoop() {
  let lastPhase = '';
  let lastRound = 0;
  
  setInterval(() => {
    if (!wss || wss.clients.size === 0) return;
    
    const currentRound = gameState.getCurrentRoundNumber();
    
    // Get winning index (determined or from processing)
    const winningIndex = roundWinningIndices.get(currentRound);
    const state = gameState.getGameState(winningIndex);
    
    // Add round stats and bet limits
    const stats = betProcessor.getRoundStats(currentRound);
    const maxBet = betProcessor.getNextRoundMaxBet();
    
    // Broadcast state with extra data
    broadcastToAll({ 
      type: 'gameState', 
      data: {
        ...state,
        betCount: stats.betCount,
        playerCount: stats.playerCount,
        maxBetReal: maxBet.real,
        maxBetTrial: maxBet.trial,
        houseFund: houseProtection.getHouseFund(),
      }
    });
    
    // Detect phase transitions
    if (state.phase !== lastPhase || state.roundNumber !== lastRound) {
      logger.info(`[Phase] Round ${state.roundNumber}: ${lastPhase || 'start'} -> ${state.phase}`);
      
      // When entering lock phase, process bets and select outcome
      if (state.phase === 'locked' && lastPhase !== 'locked') {
        logger.info(`[Lock] Processing bets for round ${state.roundNumber}...`);
        processRoundBets(state.roundNumber).then(result => {
          if (result) {
            // Store determined winning index
            roundWinningIndices.set(state.roundNumber, result.winningIndex);
            
            // Send personal results to each player
            for (const [username, playerResult] of result.results) {
              sendToUser(username, {
                type: 'betResults',
                data: {
                  roundNumber: state.roundNumber,
                  winningIndex: result.winningIndex,
                  winningPosition: result.winningPosition,
                  ...playerResult,
                }
              });
            }
          }
        });
      }
      
      // When entering result phase, broadcast summary
      if (state.phase === 'result' && lastPhase !== 'result') {
        const roundResult = betProcessor.getRoundResults(state.roundNumber);
        const winIdx = roundWinningIndices.get(state.roundNumber) ?? state.winningIndex;
        const winPos = config.WHEEL_NUMBERS[winIdx];
        
        broadcastToAll({ 
          type: 'roundSummary', 
          data: {
            roundNumber: state.roundNumber,
            winningNumber: winPos.number,
            winningColor: winPos.color,
            winningIndex: winIdx,
            totalPlayers: roundResult?.results?.size || 0,
            // Announce next round's bet limits
            nextMaxBetReal: maxBet.real,
            nextMaxBetTrial: maxBet.trial,
          }
        });
      }
      
      // New round - cleanup
      if (state.roundNumber !== lastRound) {
        betProcessor.cleanupOldRounds();
        // Cleanup old winning indices
        for (const [round] of roundWinningIndices) {
          if (round < state.roundNumber - 2) {
            roundWinningIndices.delete(round);
          }
        }
      }
      
      lastPhase = state.phase;
      lastRound = state.roundNumber;
    }
  }, 1000);
}

// ============================================
// WebSocket Message Handler
// ============================================

function handleMessage(ws, message) {
  try {
    const { type, data } = JSON.parse(message);
    const clientInfo = clients.get(ws);
    
    switch (type) {
      case 'auth':
        clients.set(ws, { 
          username: data.username, 
          displayName: data.displayName,
          authenticated: true,
          currencyType: data.currencyType || 'trial',
        });
        
        // Load user balance
        if (data.balance) {
          betProcessor.setUserBalance(data.username, {
            fermentedMangos: data.balance.fermentedMangos || 0,
            expiredJuice: data.balance.expiredJuice || 0,
            mangos: data.balance.mangos || 0,
            mangoJuice: data.balance.mangoJuice || 0,
            totalWins: data.balance.totalWins || 0,
            totalLosses: data.balance.totalLosses || 0,
          });
        }
        
        updateOnlineUserCount();
        
        // Send auth success with current bet limits
        const maxBet = betProcessor.getNextRoundMaxBet();
        ws.send(JSON.stringify({ 
          type: 'authSuccess', 
          data: { 
            message: 'Authenticated successfully',
            maxBetReal: maxBet.real,
            maxBetTrial: maxBet.trial,
          } 
        }));
        break;
        
      case 'placeBet':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
        
        const betResult = betProcessor.placeBet(
          clientInfo.username, 
          data, 
          clientInfo.currencyType
        );
        
        ws.send(JSON.stringify({ 
          type: betResult.success ? 'betPlaced' : 'betError', 
          data: betResult 
        }));
        
        if (betResult.success) {
          const balance = betProcessor.getUserBalance(clientInfo.username);
          if (balance) {
            ws.send(JSON.stringify({
              type: 'balanceUpdate',
              data: { ...balance, pending: betResult.pendingTotal }
            }));
          }
        }
        break;
        
      case 'switchCurrency':
        if (!clientInfo?.authenticated) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'Not authenticated' } }));
          return;
        }
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
        const balance = betProcessor.getUserBalance(clientInfo.username);
        ws.send(JSON.stringify({ type: 'balance', data: balance || {} }));
        break;
        
      default:
        console.log('Unknown message type:', type);
    }
  } catch (error) {
    logger.error('Error handling message', error.stack || error.message);
  }
}

// ============================================
// Start Server
// ============================================

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    logger.info(`[WS] Client connected (total: ${wss.clients.size})`);
    clients.set(ws, { authenticated: false, currencyType: 'trial' });
    
    // Send initial state with bet limits
    const state = gameState.getGameState();
    const maxBet = betProcessor.getNextRoundMaxBet();
    ws.send(JSON.stringify({ 
      type: 'gameState', 
      data: { ...state, maxBetReal: maxBet.real, maxBetTrial: maxBet.trial }
    }));
    
    ws.on('message', (message) => handleMessage(ws, message.toString()));
    
    ws.on('close', () => {
      const info = clients.get(ws);
      if (info?.username) logger.debug(`[WS] ${info.username} disconnected`);
      clients.delete(ws);
      updateOnlineUserCount();
      logger.debug(`[WS] Client disconnected (remaining: ${wss.clients.size})`);
    });
    
    ws.on('error', (error) => {
      if (error.code !== 'WS_ERR_INVALID_CLOSE_CODE') {
        logger.error('[WS] Error', error.message);
      }
      clients.delete(ws);
    });
  });

  // Load house fund from database before starting game loop
  const houseFundBalance = await houseProtection.loadFromDatabase();
  logger.info(`> House fund loaded: ${houseFundBalance.toLocaleString()} mangos ($${(houseFundBalance / 1000).toLocaleString()})`);
  
  startGameLoop();

  const epoch = gameState.getEpoch();
  const timerConfig = config.TIMER_CONFIG;
  const totalTime = config.TOTAL_ROUND_TIME;
  
  server.listen(port, hostname, () => {
    logger.info(`> Live server ready on http://${hostname}:${port}`);
    logger.info(`> WebSocket ready on ws://${hostname}:${port}/ws`);
    logger.info(`> Environment: ${dev ? 'development' : 'production'}`);
    logger.info(`> Server epoch: ${epoch}`);
    logger.info(`> Timer: betting=${timerConfig.bettingDuration}s, locked=${timerConfig.lockedDuration}s, spin=${timerConfig.spinDuration}s, result=${timerConfig.resultDuration}s`);
    logger.info(`> Total round time: ${totalTime}s (${Math.floor(totalTime / 60)}m ${totalTime % 60}s)`);
    logger.info(`> House fund: ${houseProtection.getHouseFund().toLocaleString()} mangos ($${(houseProtection.getHouseFund() / 1000).toLocaleString()})`);
  });
});
