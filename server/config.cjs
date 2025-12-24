/**
 * Server Configuration
 * Central config for game timing, multipliers, and house settings
 */

// Timer configuration for game phases
const TIMER_CONFIG = {
  bettingDuration: 210,     // 3:30 betting
  lockedDuration: 30,       // 30s lock for server processing
  spinDuration: 15,         // 15s wheel spin
  resultDuration: 45,       // 45s result display
};

const TOTAL_ROUND_TIME = 
  TIMER_CONFIG.bettingDuration + 
  TIMER_CONFIG.lockedDuration + 
  TIMER_CONFIG.spinDuration + 
  TIMER_CONFIG.resultDuration;

// Bet multipliers
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

// Gold multipliers pool
const GOLD_MULTIPLIERS = [50, 100, 150, 200];

// Wheel positions (must match client RouletteWheel.tsx)
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

const ANGLE_PER_SLOT = 360 / 51;

// House fund configuration
const HOUSE_CONFIG = {
  INITIAL_FUND_USD: 50000,          // $50,000 starting fund
  MANGO_TO_USD: 1000,               // 1000 mangos = $1
  MIN_RESERVE_PERCENT: 20,          // Keep 20% in reserve
  MAX_EXPOSURE_PERCENT: 5,          // Max 5% risk per round
  
  // Dynamic bet limits
  DEFAULT_MAX_BET_REAL: 100000,     // Default max per user (real)
  DEFAULT_MAX_BET_TRIAL: 1000000,   // Default max per user (trial)
  MIN_MAX_BET: 1000,                // Never go below this
  
  // Outcome selection
  PROTECTION_THRESHOLD: 0.5,        // Activate at 50% of max exposure
  AGGRESSIVENESS_SCALE: [0.6, 0.7, 0.8], // Low, Medium, High bias
};

module.exports = {
  TIMER_CONFIG,
  TOTAL_ROUND_TIME,
  MULTIPLIERS,
  GOLD_MULTIPLIERS,
  WHEEL_NUMBERS,
  ANGLE_PER_SLOT,
  HOUSE_CONFIG,
};
