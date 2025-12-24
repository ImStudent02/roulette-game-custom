# Roulette Components

## Purpose

This directory contains **game-specific components** for the roulette wheel, betting interface, and live multiplayer features.

## Components

| Component                | Description                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| `RouletteWheel.tsx`      | Main wheel with 51 slots, outer ring, gold position, spin animation |
| `RouletteGame.tsx`       | Self-play mode (button-triggered spin)                              |
| `LiveRouletteGame.tsx`   | Live multiplayer (polling-based, legacy)                            |
| `LiveRouletteGameV2.tsx` | Live multiplayer (WebSocket sync)                                   |
| `LiveRouletteGameV3.tsx` | Latest live mode with enhancements                                  |
| `LiveRouletteWheel.tsx`  | Server-controlled wheel (deprecated)                                |
| `BettingTable.tsx`       | Bet placement UI with chip selection                                |
| `BettingControls.tsx`    | Chip amount selection controls                                      |
| `ActiveBets.tsx`         | Current bets display (gold shows "50x - 200x")                      |
| `BetHistory.tsx`         | Past bet results with win/loss status                               |
| `GameTimer.tsx`          | Timer with phase indicator and progress bar                         |
| `LiveChat.tsx`           | Real-time chat for live mode                                        |

---

## RouletteWheel Props

```tsx
type RouletteWheelProps = {
  onSpinComplete: (
    position: WheelPosition,
    secondPosition?: WheelPosition
  ) => void;
  isSpinning: boolean;
  winningPosition?: WheelPosition;
  forceWinningIndex?: number; // Server-controlled result
  shouldRegenerateColors?: boolean; // Trigger color reset
  serverOuterColors?: string[]; // Synced colors from server
};
```

---

## Game Phases

| Phase      | Duration  | Wheel State       | Betting    |
| ---------- | --------- | ----------------- | ---------- |
| `betting`  | 3:30      | Slow idle spin    | ✅ Allowed |
| `warning`  | ~30s left | Idle spin         | ✅ Allowed |
| `locked`   | 30s       | Idle (no bets)    | ❌ Locked  |
| `spinning` | 15s       | Fast spin → stop  | ❌ Locked  |
| `result`   | 45s       | Stopped at winner | ❌ Locked  |

---

## Bet Types & Payouts

| Type     | Target          | Payout  |
| -------- | --------------- | ------- |
| `black`  | Black numbers   | 1.9x    |
| `white`  | White numbers   | 1.9x    |
| `even`   | Even numbers    | 1.8x    |
| `odd`    | Odd numbers     | 1.8x    |
| `green`  | Green special   | 4.9x    |
| `pink`   | Pink special    | 4.9x    |
| `gold`   | Gold position   | 50-200x |
| `number` | Specific number | 24x     |
| `x`      | X position      | 1.0x    |

---

## Related

- `lib/gameUtils.ts` - Bet calculation utilities
- `lib/hyperParams.ts` - Game configuration
- `server.js` - WebSocket server for live mode
