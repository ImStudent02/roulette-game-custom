# Roulette Components

Game-specific components for the roulette wheel.

## Components

| File                     | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| `RouletteWheel.tsx`      | Main wheel with 51 slots, outer color ring, gold position, spin animation |
| `RouletteGame.tsx`       | Self-play game (button triggered)                                         |
| `LiveRouletteGameV2.tsx` | Live multiplayer (WebSocket, timer-based)                                 |
| `LiveRouletteWheel.tsx`  | Deprecated: server-controlled wheel                                       |
| `LiveChat.tsx`           | Real-time chat for live mode                                              |
| `BettingTable.tsx`       | Bet placement UI with chip selection                                      |
| `ActiveBets.tsx`         | Shows current bets (gold shows "50x - 200x")                              |
| `BetHistory.tsx`         | Past bet results                                                          |
| `GameTimer.tsx`          | Timer with phase indicator                                                |

## RouletteWheel Props

```tsx
type RouletteWheelProps = {
  onSpinComplete: (position, secondPosition?) => void;
  isSpinning: boolean;
  winningPosition?: WheelPosition;
  forceWinningIndex?: number; // Server-controlled result
  shouldRegenerateColors?: boolean; // Trigger color reset
  serverOuterColors?: string[]; // Synced colors from server
};
```

## Game Phases

| Phase    | Duration  | Wheel State       |
| -------- | --------- | ----------------- |
| betting  | 3:30      | Slow idle spin    |
| warning  | ~30s left | Idle spin         |
| locked   | 15s       | Idle (no bets)    |
| spinning | 15s       | Fast spin → stop  |
| result   | 60s       | Stopped at winner |
