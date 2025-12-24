/**
 * Bet Processor Module
 * Handles bet placement, validation, and winnings calculation
 */

const { MULTIPLIERS, WHEEL_NUMBERS, HOUSE_CONFIG } = require('./config.cjs');
const { getCurrentPhase, getCurrentRoundNumber, generateOuterColorsForRound, seededRandom, getEpoch } = require('./gameState.cjs');

// In-memory storage
const roundBets = new Map();    // roundNumber -> Map(username -> userData)
const roundResults = new Map(); // roundNumber -> { processed, results }
const userBalances = new Map(); // username -> balance object

// Next round bet limit (calculated during result phase)
let nextRoundMaxBet = {
  real: HOUSE_CONFIG.DEFAULT_MAX_BET_REAL,
  trial: HOUSE_CONFIG.DEFAULT_MAX_BET_TRIAL,
};

// Online user count (updated by connection manager)
let onlineUserCount = 0;

function setOnlineUserCount(count) {
  onlineUserCount = count;
}

function getOnlineUserCount() {
  return onlineUserCount;
}

// Get/set next round bet limit
function getNextRoundMaxBet() {
  return nextRoundMaxBet;
}

function calculateNextRoundMaxBet(houseFundMangos) {
  // Formula: (HouseFund × RiskPercent) / (OnlineUsers × MaxWinMultiplier)
  const maxExposure = houseFundMangos * (HOUSE_CONFIG.MAX_EXPOSURE_PERCENT / 100);
  const activeUsers = Math.max(onlineUserCount, 10); // Minimum 10 users estimate
  const maxWinMultiplier = 200; // Gold max multiplier
  
  let realLimit = Math.floor(maxExposure / (activeUsers * maxWinMultiplier));
  realLimit = Math.max(HOUSE_CONFIG.MIN_MAX_BET, realLimit);
  realLimit = Math.min(HOUSE_CONFIG.DEFAULT_MAX_BET_REAL, realLimit);
  
  nextRoundMaxBet = {
    real: realLimit,
    trial: HOUSE_CONFIG.DEFAULT_MAX_BET_TRIAL, // Trial stays fixed
  };
  
  console.log(`[BetLimits] Next round max: ${realLimit} real, ${nextRoundMaxBet.trial} trial (${activeUsers} users)`);
  return nextRoundMaxBet;
}

// User balance management
function setUserBalance(username, balance) {
  userBalances.set(username, { ...balance });
}

function getUserBalance(username) {
  return userBalances.get(username);
}

// Cleanup old rounds
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

// Place a bet
function placeBet(username, bet, currencyType = 'trial') {
  const phase = getCurrentPhase();
  
  if (phase !== 'betting' && phase !== 'warning') {
    return { success: false, error: 'Betting is closed' };
  }
  
  const roundNumber = getCurrentRoundNumber();
  const { type, amount, targetNumber } = bet;
  
  // Validate bet structure
  if (!type || !amount || amount <= 0) {
    return { success: false, error: 'Invalid bet' };
  }
  
  // Check bet limit
  const maxBet = currencyType === 'real' ? nextRoundMaxBet.real : nextRoundMaxBet.trial;
  if (amount > maxBet) {
    return { 
      success: false, 
      error: `Max bet is ${maxBet.toLocaleString()} for this round`,
      maxBet 
    };
  }
  
  // Get/create round data
  if (!roundBets.has(roundNumber)) {
    roundBets.set(roundNumber, new Map());
  }
  
  const roundData = roundBets.get(roundNumber);
  if (!roundData.has(username)) {
    roundData.set(username, { bets: [], currencyType, totalBetAmount: 0 });
  }
  
  const userData = roundData.get(username);
  
  // Check balance
  const balance = userBalances.get(username);
  if (balance) {
    const currency = currencyType === 'trial' ? 'fermentedMangos' : 'mangos';
    const currentBalance = balance[currency] || 0;
    const pendingBets = userData.totalBetAmount;
    
    if (pendingBets + amount > currentBalance) {
      return { 
        success: false, 
        error: 'Insufficient balance', 
        balance: currentBalance, 
        pending: pendingBets 
      };
    }
  }
  
  // Store bet
  const betId = `${roundNumber}_${username}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  userData.bets.push({
    id: betId,
    type,
    amount,
    targetNumber,
    currencyMode: currencyType,
    placedAt: Date.now(),
  });
  userData.totalBetAmount += amount;
  
  return { 
    success: true, 
    betId, 
    roundNumber, 
    pendingTotal: userData.totalBetAmount,
    maxBet,
  };
}

// Calculate winnings for a bet
function calculateWinnings(bet, winningPosition, winningIndex, outerColors, goldPosition, goldMultiplier) {
  const { type, amount, targetNumber } = bet;
  
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
        multiplier = winningIndex === goldPosition ? goldMultiplier : MULTIPLIERS.number;
      }
      break;
      
    case 'green':
      if (outerColors[winningIndex] === 'green') {
        won = true;
        multiplier = MULTIPLIERS.green;
      }
      break;
      
    case 'pink':
      if (outerColors[winningIndex] === 'pink') {
        won = true;
        multiplier = MULTIPLIERS.pink;
      }
      break;
      
    case 'gold':
      if (winningIndex === goldPosition) {
        won = true;
        multiplier = goldMultiplier;
      }
      break;
      
    case 'red':
      if (outerColors[winningIndex] === 'red') {
        won = true;
        multiplier = MULTIPLIERS.red;
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

// Get round bets for processing
function getRoundBets(roundNumber) {
  return roundBets.get(roundNumber);
}

// Store round results
function setRoundResults(roundNumber, results) {
  roundResults.set(roundNumber, { processed: true, results, processedAt: Date.now() });
}

function getRoundResults(roundNumber) {
  return roundResults.get(roundNumber);
}

// Get round stats
function getRoundStats(roundNumber) {
  const roundData = roundBets.get(roundNumber);
  if (!roundData) return { betCount: 0, playerCount: 0, totalAmount: 0 };
  
  let totalAmount = 0;
  let betCount = 0;
  
  for (const [, userData] of roundData) {
    betCount += userData.bets.length;
    totalAmount += userData.totalBetAmount;
  }
  
  return {
    betCount,
    playerCount: roundData.size,
    totalAmount,
  };
}

module.exports = {
  placeBet,
  calculateWinnings,
  getRoundBets,
  setRoundResults,
  getRoundResults,
  getRoundStats,
  cleanupOldRounds,
  setUserBalance,
  getUserBalance,
  setOnlineUserCount,
  getOnlineUserCount,
  getNextRoundMaxBet,
  calculateNextRoundMaxBet,
};
