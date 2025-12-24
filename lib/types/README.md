# Types Directory

## Purpose

This directory contains **TypeScript type definitions** that are shared across the application and need additional organization beyond the main `types.ts` file.

## Contents

| File       | Description                              |
| ---------- | ---------------------------------------- |
| `index.ts` | Re-exports and extended type definitions |

## Main Types Location

Most game types are defined in `lib/types.ts`:

```typescript
// Core types exported from lib/types.ts:
-Bet - // Individual bet structure
  BetType - // 'number' | 'black' | 'white' | 'even' | 'odd' | 'green' | 'pink' | 'gold' | 'x'
  WheelPosition - // { number, color, isGold?, isSpecial? }
  GameState - // Current game state
  BetHistoryItem - // Historical bet record
  CurrencyMode - // 'trial' | 'real'
  User; // User profile data
```

## Usage

```typescript
import { Bet, WheelPosition, CurrencyMode } from "@/lib/types";

// Or from this directory for extended types:
import { PlayerProfile, BehaviorAnalysis } from "@/lib/types";
```

## Related

- `lib/types.ts` - Main type definitions
- `lib/gameUtils.ts` - Type-dependent game utilities
