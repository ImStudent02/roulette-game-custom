# Server Modules

Modular server-side code for the roulette game.

## Directory Structure

```
server/
├── config.cjs          # Game configuration & constants
├── gameState.cjs       # Round timing & phase detection
├── betProcessor.cjs    # Bet validation & limit enforcement
├── houseProtection.cjs # Smart outcome selection
├── logger.cjs          # File-based logging
├── index.cjs           # Central exports
└── README.md           # This file
```

## Modules

### config.cjs

Game constants and settings:

- Timer durations (betting, locked, spin, result)
- Wheel positions (51 slots)
- Multipliers for each bet type
- House protection settings (exposure %, aggressiveness)

```javascript
const {
  TIMER_CONFIG,
  WHEEL_NUMBERS,
  MULTIPLIERS,
  HOUSE_CONFIG,
} = require("./config.cjs");
```

### gameState.cjs

Round timing and synchronization:

- Calculate current round number
- Determine game phase (betting/locked/spinning/result)
- Generate outer colors (green/pink/gold/red)
- Seeded random number generation

```javascript
const {
  getCurrentRoundNumber,
  getCurrentPhase,
  generateOuterColorsForRound,
  seededRandom,
} = require("./gameState.cjs");
```

### betProcessor.cjs

Bet handling and limits:

- Validate bet types and amounts
- **Dynamic max bet limits** based on house fund
- Process winnings based on result
- Track round bets and user balances in memory

```javascript
const {
  placeBet,
  calculateWinnings,
  getNextRoundMaxBet,
  calculateNextRoundMaxBet,
} = require("./betProcessor.cjs");
```

### houseProtection.cjs

Smart outcome selection:

- **Analyze payouts** for all 51 positions
- **Weighted selection** toward house-favorable outcomes
- **Risk-based aggressiveness** (scales with exposure)
- **Trial mode farming protection** (detects 80%+ trial bets)
- Track house fund balance

```javascript
const {
  selectProtectedOutcome,
  analyzePositions,
  processRoundOutcome,
  getHouseFund,
} = require("./houseProtection.cjs");
```

### logger.cjs

File-based logging system:

- Writes to `logs/server.log`
- JSON format: `{ timestamp, level, message, stack }`
- Auto-rotation at 5MB (keeps 5 files)
- Console output + file write
- Admin panel reads from log file

```javascript
const logger = require("./logger.cjs");

logger.info("Server started");
logger.warn("High bet detected");
logger.error("Connection failed", error.stack);
logger.debug("Verbose info"); // Only in dev mode
```

## Usage in server-v2.js

```javascript
const {
  config,
  gameState,
  betProcessor,
  houseProtection,
  logger,
} = require("./server/index.cjs");

// Get current phase
const phase = gameState.getCurrentPhase();

// Place a bet (with limit enforcement)
const result = betProcessor.placeBet(username, bet, currencyType);

// Select protected outcome
const { winningIndex, protected, houseProfit } =
  houseProtection.selectProtectedOutcome(roundNumber, roundBets);

// Process round and update fund
houseProtection.processRoundOutcome(roundNumber, winningIndex, roundBets);

// Calculate next round's bet limit
betProcessor.calculateNextRoundMaxBet(houseProtection.getHouseFund());
```

## House Protection Algorithm

1. **Analyze** potential payout for each of 51 positions
2. **Calculate exposure** = total bets / (house fund × risk %)
3. If exposure < threshold (50%): Use **fair random** selection
4. If exposure ≥ threshold:
   - Sort positions by house profit (best first)
   - Apply weighted selection favoring profitable outcomes
   - Aggressiveness: 0.6 (low), 0.75 (medium), 0.9 (high)
5. **Trial protection**: If 80%+ trial bets and house losing, use best outcome

## Bet Limit Formula

```
MaxBet = (HouseFund × RiskPercent) / (OnlineUsers × MaxMultiplier)

Where:
- HouseFund = Current house balance in mangos
- RiskPercent = MAX_EXPOSURE_PERCENT from config (default 15%)
- OnlineUsers = Connected users (minimum 10)
- MaxMultiplier = 200 (gold max)
```
