/**
 * Server Modules Index
 * Central export point for all server modules
 */

const config = require('./config.cjs');
const gameState = require('./gameState.cjs');
const betProcessor = require('./betProcessor.cjs');
const houseProtection = require('./houseProtection.cjs');
const logger = require('./logger.cjs');

module.exports = {
  config,
  gameState,
  betProcessor,
  houseProtection,
  logger,
  
  // Convenience re-exports
  TIMER_CONFIG: config.TIMER_CONFIG,
  POSITIONS: config.POSITIONS,
  MULTIPLIERS: config.MULTIPLIERS,
  HOUSE_CONFIG: config.HOUSE_CONFIG,
  
  getCurrentRound: gameState.getCurrentRound,
  getPhase: gameState.getPhase,
  seededRandom: gameState.seededRandom,
  
  placeBet: betProcessor.placeBet,
  processRoundBets: betProcessor.processRoundBets,
  getRoundStats: betProcessor.getRoundStats, // Keeping this as it was in the original and seems intended to be kept.
  
  selectOutcome: houseProtection.selectOutcome,
  analyzeRisk: houseProtection.analyzeRisk,
  selectProtectedOutcome: houseProtection.selectProtectedOutcome, // Keeping this as it was in the original and seems intended to be kept.
  getHouseFund: houseProtection.getHouseFund, // Keeping this as it was in the original and seems intended to be kept.
};
