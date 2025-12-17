/**
 * HYPERPARAMETERS FOR ROULETTE GAME
 * 
 * This file contains all adjustable parameters that affect the game mechanics,
 * probabilities, and payouts. Edit these values to adjust the game's difficulty
 * and balance.
 */

// Master switch for enabling weighted outcomes (house edge)
export const USE_WEIGHTED_OUTCOMES = true;

// Weights for different color outcomes
export const COLOR_WEIGHTS = {
  black: 1.05, // Slightly favor black
  white: 0.95  // Slightly less likely for white
};

// Weights for number types
export const NUMBER_WEIGHTS = {
  even: 1.0,
  odd: 1.0
};

// Weights for special outcomes on the additional wheel
export const SPECIAL_OUTCOME_WEIGHTS = {
  green: 1.2,
  pink: 1.2,
  gold: 0.4, // Gold is rare
  red: 1.0,
  x: 1.1    // X position
};

// Multiplier adjustment factors (1.0 = default)
export const MULTIPLIER_FACTORS = {
  black: 1.0,
  white: 1.0,
  even: 1.0,
  odd: 1.0,
  green: 1.0,
  pink: 1.0,
  gold: 1.0,
  x: 1.0,
  number: 1.0
};

// Gold multiplier weights - probability distribution for different multiplier values
export const GOLD_MULTIPLIER_WEIGHTS = {
  50: 50,  // 50/100 chance for 50x
  100: 30, // 30/100 chance for 100x 
  150: 15, // 15/100 chance for 150x
  200: 5   // 5/100 chance for 200x
};

// Win streak compensation - prevent too many consecutive wins
export const WIN_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 5,    // After this many consecutive wins
  compensationFactor: 0.7 // 70% chance to lose on next spin
};

// Loss streak compensation - prevent too many consecutive losses
export const LOSS_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 8,     // After this many consecutive losses
  compensationFactor: 0.6  // 60% chance to win on next spin
};

// Lucky/unlucky number settings
export const MAGIC_NUMBERS = {
  luckyNumber: 7,          // This number has higher chance of winning
  luckyNumberBoost: 0.1,   // 10% boost to probability
  unluckyNumber: 13,       // This number has lower chance of winning
  unluckyNumberPenalty: 0.05 // 5% reduction in probability
};

// Wheel generation parameters
export const WHEEL_GENERATION = {
  blackNumbersCount: 25,     // Number of black positions
  whiteNumbersCount: 25,     // Number of white positions
  shuffleIntensity: 1.5      // Higher = more thorough shuffling (1.0 = normal)
};

// Animation and visual parameters
export const ANIMATION = {
  idleSpinSpeed: 0.2,       // Speed of continuous slow rotation (degrees per frame)
  spinDuration: 15000,      // Duration of spin animation in milliseconds (matches server 15s spin phase)
  minRotations: 10,         // Minimum number of rotations for a spin
  maxRotations: 15,         // Maximum number of rotations for a spin
  showResultDuration: 3000, // How long to show the result before allowing new spins
  ballBounceIntensity: 0.3  // Intensity of ball bounce animation (0-1)
};

// House edge parameters (overall profit margin)
export const HOUSE_EDGE = {
  target: 0.05,           // Target house edge (5%)
  varianceAllowed: 0.02   // Allowed variance in house edge (±2%)
}; 