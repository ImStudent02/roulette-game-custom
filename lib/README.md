# Lib Directory

## Purpose

This directory contains **utility libraries**, type definitions, and core configuration for the roulette game.

## Files

| File              | Description                                          |
| ----------------- | ---------------------------------------------------- |
| `types.ts`        | Core TypeScript type definitions                     |
| `gameUtils.ts`    | Game utility functions and bet calculations          |
| `hyperParams.ts`  | ⚙️ Game configuration (weights, multipliers, timing) |
| `auth.ts`         | Authentication utilities (encryption, JWT, password) |
| `db.ts`           | MongoDB connection and operations                    |
| `dbManager.ts`    | Database abstraction layer (MongoDB/FileSystem)      |
| `fileSystemDb.ts` | File-based database for local development            |
| `serverDb.cjs`    | CommonJS database utilities for server.js            |

---

## types.ts

Core TypeScript definitions:

```typescript
type BetType = 'number' | 'black' | 'white' | 'even' | 'odd' | 'green' | 'pink' | 'gold' | 'x';
type CurrencyMode = 'trial' | 'real';

interface WheelPosition { number: number | 'X'; color: string; isGold?: boolean; }
interface Bet { id: string; type: BetType; amount: number; targetNumber?: number; currencyMode: CurrencyMode; }
interface GameState { balance: number; currentBets: Bet[]; isSpinning: boolean; ... }
```

---

## gameUtils.ts

Game utility functions:

- `generateBetId()` - UUID for bets
- `multipliers` - Payout multipliers for each bet type
- `isBetWinner()` - Check if bet won against position
- Bet calculation helpers

---

## hyperParams.ts ⚙️

**IMPORTANT: Game configuration file**

| Config                    | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `COLOR_WEIGHTS`           | Probability weights for black/white             |
| `GOLD_MULTIPLIER_WEIGHTS` | Probability of 50x/100x/150x/200x               |
| `ANIMATION`               | Spin duration (15s), idle speed, rotation count |
| `HOUSE_EDGE`              | House advantage configuration                   |

📖 See `README-HYPERPARAMS.md` in root for full documentation.

---

## auth.ts

Authentication utilities:

| Function                              | Description                    |
| ------------------------------------- | ------------------------------ |
| `encryptEmail()` / `decryptEmail()`   | AES-256 encryption             |
| `hashPassword()` / `verifyPassword()` | bcrypt with custom salt        |
| `generateToken()` / `verifyToken()`   | JWT management                 |
| `validateUsername()`                  | @username format, max 20 chars |

---

## Database Layer

| File              | Usage                                                     |
| ----------------- | --------------------------------------------------------- |
| `db.ts`           | MongoDB direct connection                                 |
| `dbManager.ts`    | Abstraction that switches between MongoDB and FileSystem  |
| `fileSystemDb.ts` | File-based storage for local dev (uses `data/` directory) |
| `serverDb.cjs`    | CommonJS version for use in `server.js`                   |

---

## Related

- `README-HYPERPARAMS.md` - Detailed hyperparameters documentation
- `server.js` - WebSocket server using these utilities
- `lib/types/` - Extended type definitions
