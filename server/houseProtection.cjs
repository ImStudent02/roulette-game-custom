/**
 * House Protection Module
 * Smart outcome selection and risk management
 */

const { WHEEL_NUMBERS, MULTIPLIERS, HOUSE_CONFIG } = require('./config.cjs');
const { generateOuterColorsForRound, seededRandom, getEpoch } = require('./gameState.cjs');
const betProcessor = require('./betProcessor.cjs');
const houseFundDb = require('./houseFundDb.cjs');

// House fund tracking (in mangos) - cached locally, synced with DB
let houseFund = 0; // Start at 0, load from DB on startup

function getHouseFund() {
  return houseFund;
}

function setHouseFund(amount) {
  houseFund = amount;
}

// Load from database on startup
async function loadFromDatabase() {
  const balance = await houseFundDb.loadHouseFundOnStartup();
  houseFund = balance;
  return balance;
}

// Update both cache and database
async function updateHouseFundWithDb(delta, type, metadata = {}) {
  const result = await houseFundDb.updateHouseFund(delta, type, metadata);
  if (result.success) {
    houseFund = result.newBalance;
  }
  return result;
}

/**
 * Calculate potential payout for each wheel position given current bets
 * Returns array of { index, position, houseProfit, riskScore }
 */
function analyzePositions(roundNumber, roundBets) {
  const { colors: outerColors, goldPosition, goldMultiplier } = generateOuterColorsForRound(roundNumber);
  
  const analysis = WHEEL_NUMBERS.map((position, index) => {
    let totalPayout = 0;  // What house pays out
    let totalLoss = 0;    // What house keeps (losing bets)
    
    // Analyze each user's bets
    for (const [, userData] of roundBets) {
      for (const bet of userData.bets) {
        const result = betProcessor.calculateWinnings(
          bet, position, index, outerColors, goldPosition, goldMultiplier
        );
        
        if (result.won) {
          totalPayout += result.winnings;
        } else {
          totalLoss += bet.amount;
        }
      }
    }
    
    return {
      index,
      position,
      outerColor: outerColors[index],
      totalPayout,
      totalLoss,
      houseProfit: totalLoss - totalPayout, // Negative = house loses
      riskScore: totalPayout / Math.max(totalLoss, 1), // Higher = more risk
    };
  });
  
  return analysis;
}

/**
 * Select outcome with house protection
 * Returns winning index (0-50)
 */
function selectProtectedOutcome(roundNumber, roundBets) {
  // Get base random outcome
  const seed = roundNumber * 54321 + getEpoch();
  const baseWinningIndex = Math.floor(seededRandom(seed) * WHEEL_NUMBERS.length);
  
  // If no bets, use random outcome
  if (!roundBets || roundBets.size === 0) {
    return { winningIndex: baseWinningIndex, protected: false };
  }
  
  // Analyze all positions
  const analysis = analyzePositions(roundNumber, roundBets);
  
  // Calculate total exposure
  const stats = betProcessor.getRoundStats(roundNumber);
  const maxExposure = houseFund * (HOUSE_CONFIG.MAX_EXPOSURE_PERCENT / 100);
  const exposureRatio = stats.totalAmount / maxExposure;
  
  // If below threshold, use random outcome
  if (exposureRatio < HOUSE_CONFIG.PROTECTION_THRESHOLD) {
    console.log(`[HouseProtection] Exposure ${(exposureRatio * 100).toFixed(1)}% below threshold, using random`);
    return { winningIndex: baseWinningIndex, protected: false };
  }
  
  // Calculate aggressiveness based on exposure
  let aggressiveness;
  if (exposureRatio < 0.7) {
    aggressiveness = HOUSE_CONFIG.AGGRESSIVENESS_SCALE[0]; // Low
  } else if (exposureRatio < 0.9) {
    aggressiveness = HOUSE_CONFIG.AGGRESSIVENESS_SCALE[1]; // Medium
  } else {
    aggressiveness = HOUSE_CONFIG.AGGRESSIVENESS_SCALE[2]; // High
  }
  
  // Sort by house profit (best for house first)
  const sorted = [...analysis].sort((a, b) => b.houseProfit - a.houseProfit);
  
  // Weighted selection favoring profitable outcomes
  // Top outcomes get weighted more heavily
  const weights = [];
  for (let i = 0; i < sorted.length; i++) {
    // Weight decreases exponentially based on position
    const baseWeight = 1 / (i + 1);
    const adjustedWeight = baseWeight * (sorted[i].houseProfit >= 0 ? aggressiveness : (1 - aggressiveness));
    weights.push(Math.max(0.01, adjustedWeight));
  }
  
  // Normalize weights
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);
  
  // Use seeded random to select based on weights
  let random = seededRandom(seed + 9999);
  let cumulative = 0;
  let selectedIndex = baseWinningIndex;
  
  for (let i = 0; i < sorted.length; i++) {
    cumulative += normalizedWeights[i];
    if (random <= cumulative) {
      selectedIndex = sorted[i].index;
      break;
    }
  }
  
  const selectedAnalysis = analysis[selectedIndex];
  console.log(`[HouseProtection] Selected index ${selectedIndex} (profit: ${selectedAnalysis.houseProfit}, aggressiveness: ${aggressiveness})`);
  
  // Trial mode farming protection - increase aggressiveness for trial bets
  let trialExposure = 0;
  let realExposure = 0;
  for (const [, userData] of roundBets) {
    if (userData.currencyType === 'trial') {
      trialExposure += userData.totalBetAmount;
    } else {
      realExposure += userData.totalBetAmount;
    }
  }
  
  // If trial bets dominate, increase house protection
  const trialRatio = trialExposure / Math.max(trialExposure + realExposure, 1);
  if (trialRatio > 0.8 && selectedAnalysis.houseProfit < 0) {
    // Reselect from top profitable outcomes
    const betterIndex = sorted[0].index;
    console.log(`[HouseProtection] Trial farming detected (${(trialRatio * 100).toFixed(0)}%), using best outcome ${betterIndex}`);
    return {
      winningIndex: betterIndex,
      protected: true,
      houseProfit: sorted[0].houseProfit,
      aggressiveness: 1.0,
      trialProtected: true,
    };
  }
  
  return { 
    winningIndex: selectedIndex, 
    protected: true,
    houseProfit: selectedAnalysis.houseProfit,
    aggressiveness,
  };
}

/**
 * Process round and update house fund
 */
async function processRoundOutcome(roundNumber, winningIndex, roundBets) {
  const { colors: outerColors, goldPosition, goldMultiplier } = generateOuterColorsForRound(roundNumber);
  const winningPosition = WHEEL_NUMBERS[winningIndex];
  
  let totalHouseProfit = 0;
  
  for (const [username, userData] of roundBets) {
    for (const bet of userData.bets) {
      const result = betProcessor.calculateWinnings(
        bet, winningPosition, winningIndex, outerColors, goldPosition, goldMultiplier
      );
      
      if (result.won) {
        totalHouseProfit -= result.winnings;
      } else {
        totalHouseProfit += bet.amount;
      }
    }
  }
  
  // Update house fund in database
  const type = totalHouseProfit >= 0 ? 'user_loss' : 'user_win';
  await updateHouseFundWithDb(totalHouseProfit, type, { roundNumber });
  
  // Calculate next round's bet limit
  betProcessor.calculateNextRoundMaxBet(houseFund);
  
  return { totalHouseProfit, newHouseFund: houseFund };
}

module.exports = {
  getHouseFund,
  setHouseFund,
  loadFromDatabase,
  updateHouseFundWithDb,
  analyzePositions,
  selectProtectedOutcome,
  processRoundOutcome,
};
