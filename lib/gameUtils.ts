import { WheelPosition, BetType, MultiplierMap } from './types';
import { v4 as uuidv4 } from 'uuid';
import * as HyperParams from './hyperParams';

// Helper function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  const shuffleIntensity = HyperParams.WHEEL_GENERATION.shuffleIntensity;
  
  // Number of shuffle iterations is adjusted by the shuffleIntensity parameter
  const iterations = Math.ceil(newArray.length * shuffleIntensity);
  
  for (let i = 0; i < iterations; i++) {
    const idx1 = Math.floor(Math.random() * newArray.length);
    const idx2 = Math.floor(Math.random() * newArray.length);
    [newArray[idx1], newArray[idx2]] = [newArray[idx2], newArray[idx1]];
  }
  return newArray;
};

// Weighted random selection helper function
const weightedRandom = <T>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1]; // Fallback
};

// Generate the main wheel with 51 positions
export const generateMainWheel = (): WheelPosition[] => {
  const wheel: WheelPosition[] = [];
  
  // Create arrays of even and odd numbers
  const evenNumbers: number[] = [];
  const oddNumbers: number[] = [];
  
  // Populate even and odd arrays with weighted probabilities
  for (let i = 1; i <= 50; i++) {
    // Apply magic number adjustments for lucky/unlucky numbers
    let weight = 1.0;
    if (i === HyperParams.MAGIC_NUMBERS.luckyNumber) {
      weight += HyperParams.MAGIC_NUMBERS.luckyNumberBoost;
    } else if (i === HyperParams.MAGIC_NUMBERS.unluckyNumber) {
      weight -= HyperParams.MAGIC_NUMBERS.unluckyNumberPenalty;
    }
    
    if (i % 2 === 0) {
      // Apply weight for even numbers
      evenNumbers.push(i);
    } else {
      // Apply weight for odd numbers
      oddNumbers.push(i);
    }
  }
  
  // Shuffle the arrays to randomize
  const shuffledEven = shuffleArray(evenNumbers);
  const shuffledOdd = shuffleArray(oddNumbers);
  
  // Calculate how many black positions based on hyperparameters
  const blackCount = Math.min(50, Math.max(1, HyperParams.WHEEL_GENERATION.blackNumbersCount));
  const whiteCount = Math.min(50 - blackCount, Math.max(1, HyperParams.WHEEL_GENERATION.whiteNumbersCount));
  const remaining = 50 - blackCount - whiteCount;
  
  // Black numbers
  for (let i = 0; i < blackCount; i++) {
    // Alternate between odd and even, but use shuffled arrays
    wheel.push({ 
      number: i % 2 === 0 ? shuffledOdd.pop() || 1 : shuffledEven.pop() || 2, 
      color: 'black' 
    });
  }
  
  // X position - weighted by hyperparameter
  wheel.push({ number: 'X', color: 'black' });
  
  // White numbers
  for (let i = 0; i < whiteCount; i++) {
    wheel.push({ 
      number: i % 2 === 0 ? shuffledOdd.pop() || 3 : shuffledEven.pop() || 4, 
      color: 'white' 
    });
  }
  
  // Remaining numbers with alternating colors
  for (let i = 0; i < remaining; i++) {
    const useEven = (shuffledEven.length > shuffledOdd.length) || shuffledOdd.length === 0;
    const num = useEven ? shuffledEven.pop() || 6 : shuffledOdd.pop() || 5;
    const color = i % 2 === 0 ? 'black' : 'white';
    
    wheel.push({ number: num, color });
  }
  
  return wheel;
};

// Generate the additional wheel
export const generateAdditionalWheel = (): WheelPosition[] => {
  const wheel: WheelPosition[] = [];
  
  // Calculate position counts based on hyperparameters
  const weights = [
    HyperParams.SPECIAL_OUTCOME_WEIGHTS.green,
    HyperParams.SPECIAL_OUTCOME_WEIGHTS.pink,
    HyperParams.SPECIAL_OUTCOME_WEIGHTS.gold,
    HyperParams.SPECIAL_OUTCOME_WEIGHTS.red,
  ];
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const totalPositions = 15; // Total positions on additional wheel
  
  const greenCount = Math.round((weights[0] / totalWeight) * totalPositions * 0.4);
  const pinkCount = Math.round((weights[1] / totalWeight) * totalPositions * 0.4);
  const goldCount = Math.max(1, Math.round((weights[2] / totalWeight) * totalPositions * 0.1));
  const redCount = Math.max(4, totalPositions - greenCount - pinkCount - goldCount);
  
  // Green positions
  for (let i = 0; i < greenCount; i++) {
    wheel.push({ number: i + 1, color: 'green' });
  }
  
  // Pink positions
  for (let i = 0; i < pinkCount; i++) {
    wheel.push({ number: greenCount + i + 1, color: 'pink' });
  }
  
  // Gold position
  for (let i = 0; i < goldCount; i++) {
    wheel.push({ number: greenCount + pinkCount + i + 1, color: 'gold' });
  }
  
  // Red positions
  for (let i = 0; i < redCount; i++) {
    wheel.push({ 
      number: greenCount + pinkCount + goldCount + i + 1, 
      color: 'red'
    });
  }
  
  return shuffleArray(wheel);
};

// Multiplier mapping based on bet type, adjusted by hyperparameters
// ANTI-EXPLOIT: Number at 24x means betting on 25 numbers costs 25 and wins 24 = house edge
// Green/Pink at 4.9x with 10/51 positions = expected return 0.96 = 4% house edge
export const multipliers: MultiplierMap = {
  'black': 1.9 * HyperParams.MULTIPLIER_FACTORS.black,
  'white': 1.9 * HyperParams.MULTIPLIER_FACTORS.white,
  'even': 1.8 * HyperParams.MULTIPLIER_FACTORS.even,
  'odd': 1.8 * HyperParams.MULTIPLIER_FACTORS.odd,
  'green': 4.9 * HyperParams.MULTIPLIER_FACTORS.green,   // Was 6.5x, reduced to prevent farming
  'pink': 4.9 * HyperParams.MULTIPLIER_FACTORS.pink,     // Was 6.5x, reduced to prevent farming
  'gold': (position: WheelPosition) => {
    // Random multiplier for gold with weighted probabilities
    const multipliers = [50, 100, 150, 200];
    const weights = [
      HyperParams.GOLD_MULTIPLIER_WEIGHTS[50] || 4,
      HyperParams.GOLD_MULTIPLIER_WEIGHTS[100] || 3,
      HyperParams.GOLD_MULTIPLIER_WEIGHTS[150] || 2,
      HyperParams.GOLD_MULTIPLIER_WEIGHTS[200] || 1,
    ];
    
    return weightedRandom(multipliers, weights) * HyperParams.MULTIPLIER_FACTORS.gold;
  },
  'x': 24 * HyperParams.MULTIPLIER_FACTORS.x,  // Same as number bet; 1x refund for non-X bets is handled in RouletteGame.tsx
  'number': 24 * HyperParams.MULTIPLIER_FACTORS.number,  // Was 30x, reduced to prevent half-wheel coverage
};

// Track win/loss streaks for compensation mechanisms
let currentWinStreak = 0;
let currentLossStreak = 0;

// Check if a bet is a winner
export const isBetWinner = (
  bet: { type: BetType; targetNumber?: number },
  position: WheelPosition
): boolean => {
  const num = position.number;
  
  // Determine if it's a winner based on standard rules
  let isWinner = false;
  
  switch (bet.type) {
    case 'black':
      isWinner = position.color === 'black';
      break;
    case 'white':
      isWinner = position.color === 'white';
      break;
    case 'even':
      isWinner = typeof num === 'number' && num % 2 === 0;
      break;
    case 'odd':
      isWinner = typeof num === 'number' && num % 2 === 1;
      break;
    case 'green':
      // Check outer color ring (not inner wheel color)
      isWinner = (position as any).outerColor === 'green';
      break;
    case 'pink':
      // Check outer color ring (not inner wheel color)
      isWinner = (position as any).outerColor === 'pink';
      break;
    case 'gold':
      // Check outer color ring (not inner wheel color)
      isWinner = (position as any).outerColor === 'gold';
      break;
    case 'x':
      isWinner = num === 'X';
      break;
    case 'number':
      isWinner = typeof num === 'number' && num === bet.targetNumber;
      break;
    default:
      isWinner = false;
  }
  
  // Apply streak compensation if enabled
  if (HyperParams.USE_WEIGHTED_OUTCOMES) {
    // If win streak is too long, increase chance of losing
    if (HyperParams.WIN_STREAK_COMPENSATION.enabled && 
        currentWinStreak >= HyperParams.WIN_STREAK_COMPENSATION.maxStreakLength) {
      const penaltyChance = HyperParams.WIN_STREAK_COMPENSATION.compensationFactor;
      if (isWinner && Math.random() < penaltyChance) {
        isWinner = false;
      }
    }
    
    // If loss streak is too long, increase chance of winning
    if (HyperParams.LOSS_STREAK_COMPENSATION.enabled &&
        currentLossStreak >= HyperParams.LOSS_STREAK_COMPENSATION.maxStreakLength) {
      const bonusChance = HyperParams.LOSS_STREAK_COMPENSATION.compensationFactor;
      if (!isWinner && Math.random() < bonusChance) {
        isWinner = true;
      }
    }
  }
  
  // Update streak counters
  if (isWinner) {
    currentWinStreak++;
    currentLossStreak = 0;
  } else {
    currentLossStreak++;
    currentWinStreak = 0;
  }
  
  return isWinner;
};

// Generate a unique ID for bets
export const generateBetId = (): string => {
  return uuidv4();
};

// Choose a random wheel position, potentially weighted based on hyperparameters
export const spinWheel = (wheel: WheelPosition[]): WheelPosition => {
  if (!HyperParams.USE_WEIGHTED_OUTCOMES) {
    // Standard random selection
    const randomIndex = Math.floor(Math.random() * wheel.length);
    return wheel[randomIndex];
  }
  
  // Build weights array based on position types
  const weights = wheel.map(position => {
    const { color, number } = position;
    let weight = 1.0;
    
    // Apply color weights
    if (color === 'black') weight *= HyperParams.COLOR_WEIGHTS.black;
    else if (color === 'white') weight *= HyperParams.COLOR_WEIGHTS.white;
    else if (color === 'green') weight *= HyperParams.SPECIAL_OUTCOME_WEIGHTS.green;
    else if (color === 'pink') weight *= HyperParams.SPECIAL_OUTCOME_WEIGHTS.pink;
    else if (color === 'gold') weight *= HyperParams.SPECIAL_OUTCOME_WEIGHTS.gold;
    else if (color === 'red') weight *= HyperParams.SPECIAL_OUTCOME_WEIGHTS.red;
    
    // Apply weights for X
    if (number === 'X') weight *= HyperParams.SPECIAL_OUTCOME_WEIGHTS.x;
    
    // Apply number-based weights
    if (typeof number === 'number') {
      if (number % 2 === 0) weight *= HyperParams.NUMBER_WEIGHTS.even;
      else weight *= HyperParams.NUMBER_WEIGHTS.odd;
      
      // Apply magic number adjustments
      if (number === HyperParams.MAGIC_NUMBERS.luckyNumber) {
        weight *= (1 + HyperParams.MAGIC_NUMBERS.luckyNumberBoost);
      } else if (number === HyperParams.MAGIC_NUMBERS.unluckyNumber) {
        weight *= (1 - HyperParams.MAGIC_NUMBERS.unluckyNumberPenalty);
      }
    }
    
    return Math.max(0.01, weight); // Ensure no zero weights
  });
  
  // Select position using weighted random
  return weightedRandom(wheel, weights);
};

// Special rule: Spin two wheels when gold bet exceeds 1000
export const shouldSpinTwice = (goldBetAmount: number): boolean => {
  return goldBetAmount > 1000;
};

// Cheat code functionality
export const applyCheatCode = (code: string): number | null => {
  if (code === '@mrmoney') {
    return 5000;
  }
  return null;
}; 