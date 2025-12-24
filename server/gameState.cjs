/**
 * Game State Module
 * Handles round timing, phase detection, and deterministic random generation
 */

const { 
  TIMER_CONFIG, 
  TOTAL_ROUND_TIME, 
  WHEEL_NUMBERS, 
  ANGLE_PER_SLOT,
  GOLD_MULTIPLIERS 
} = require('./config.cjs');

// Server epoch - all time calculations based on this
let SERVER_EPOCH = Date.now();

// Initialize epoch (can be set from persistent storage)
function initEpoch(epoch = null) {
  SERVER_EPOCH = epoch || Date.now();
  return SERVER_EPOCH;
}

function getEpoch() {
  return SERVER_EPOCH;
}

// Seeded random for deterministic results
function seededRandom(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

// Get current round number
function getCurrentRoundNumber() {
  const elapsedSinceStart = Math.floor((Date.now() - SERVER_EPOCH) / 1000);
  return Math.floor(elapsedSinceStart / TOTAL_ROUND_TIME) + 1;
}

// Get current phase
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

// Generate outer colors for a round (deterministic)
function generateOuterColorsForRound(roundNumber) {
  const colors = new Array(51).fill('none');
  const seed = roundNumber * 12345 + SERVER_EPOCH;
  
  // Green/Pink positions (alternating)
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

// Get full game state
function getGameState(overrideWinningIndex = null) {
  const now = Date.now();
  const elapsedSinceStart = Math.floor((now - SERVER_EPOCH) / 1000);
  
  const roundNumber = Math.floor(elapsedSinceStart / TOTAL_ROUND_TIME) + 1;
  const elapsedInRound = elapsedSinceStart % TOTAL_ROUND_TIME;
  
  // Round timestamps
  const roundStartTime = SERVER_EPOCH + ((roundNumber - 1) * TOTAL_ROUND_TIME * 1000);
  const bettingEndsAt = roundStartTime + (TIMER_CONFIG.bettingDuration * 1000);
  const lockEndsAt = bettingEndsAt + (TIMER_CONFIG.lockedDuration * 1000);
  const spinEndsAt = lockEndsAt + (TIMER_CONFIG.spinDuration * 1000);
  const resultEndsAt = spinEndsAt + (TIMER_CONFIG.resultDuration * 1000);
  
  // Determine phase
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
  
  // Winning position (can be overridden by house protection)
  let winningIndex;
  if (overrideWinningIndex !== null) {
    winningIndex = overrideWinningIndex;
  } else {
    const winningSeed = roundNumber * 54321 + SERVER_EPOCH;
    winningIndex = Math.floor(seededRandom(winningSeed) * WHEEL_NUMBERS.length);
  }
  const winningPosition = WHEEL_NUMBERS[winningIndex];
  
  // Outer colors
  const { colors: outerColors, goldPosition, goldMultiplier } = generateOuterColorsForRound(roundNumber);
  
  // Target angle for animation
  const extraRotations = 6;
  const pocketAngle = ANGLE_PER_SLOT;
  const segmentCenterAngle = (winningIndex + 0.5) * pocketAngle;
  const targetAngle = (extraRotations * 360) + (360 - segmentCenterAngle);
  
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
    timerConfig: TIMER_CONFIG,
  };
}

module.exports = {
  initEpoch,
  getEpoch,
  seededRandom,
  getCurrentRoundNumber,
  getCurrentPhase,
  generateOuterColorsForRound,
  getGameState,
};
