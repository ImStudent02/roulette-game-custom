# Lib Directory

Utility libraries, types, and configuration.

## Files

### types.ts

TypeScript type definitions:

- `WheelPosition` - Slot on wheel (number + color)
- `Bet` - User bet (type, amount, targetNumber)
- `BetHistoryItem` - Completed bet with result

### gameUtils.ts

Game utility functions:

- `generateBetId()` - UUID for bets
- `multipliers` - Payout multipliers for each bet type
- Bet calculation helpers

### hyperParams.ts ⚙️

**IMPORTANT: Game configuration file**

- `COLOR_WEIGHTS` - Probability weights for black/white
- `GOLD_MULTIPLIER_WEIGHTS` - Probability of 50x/100x/150x/200x
- `ANIMATION` - Spin duration (15s), idle speed, rotation count
- See `README-HYPERPARAMS.md` in root for full documentation

### db.ts

MongoDB connection and helpers:

- `connectToDatabase()` - Get DB connection
- `getCollections()` - Typed collection access (users, chat, rounds, bets)
- `addChatMessage()` - Insert with 10k FIFO limit
- `editChatMessage()` - Update message text

### auth.ts

Authentication utilities:

- `encryptEmail()` / `decryptEmail()` - AES-256 encryption
- `hashPassword()` / `verifyPassword()` - bcrypt with custom salt
- `generateToken()` / `verifyToken()` - JWT management
- `validateUsername()` - @username format, max 20 chars

## Configuration

Edit `hyperParams.ts` to adjust:

- Spin animation duration
- Gold multiplier probabilities
- House edge
- Luck/unlucky numbers
