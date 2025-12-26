# Hooks Directory

## Purpose

This directory contains **custom React hooks** that encapsulate reusable stateful logic for the application.

## Hooks

| Hook           | File              | Description                             |
| -------------- | ----------------- | --------------------------------------- |
| `useWebSocket` | `useWebSocket.ts` | WebSocket connection for live game sync |
| `useAuth`      | `useAuth.tsx`     | Authentication state management         |
| `useAnalytics` | `useAnalytics.ts` | User behavior tracking & batching       |

---

## useWebSocket

Real-time WebSocket hook for live multiplayer game communication.

### Usage

```tsx
const {
  isConnected, // Boolean - connection status
  gameState, // Server game state (phase, timer, winning number)
  chatMessages, // Array of chat messages
  authenticate, // (username, displayName) => void
  placeBet, // (bet) => void
  sendChatMessage, // (message) => void
  editChatMessage, // (sentAt, newMessage) => void
} = useWebSocket("ws://localhost:3001/ws");
```

### GameState Interface

```typescript
interface GameState {
  serverTime: number;
  serverEpoch: number;
  roundStartTime: number; // Calculate phases from this
  roundNumber: number;
  phase: "betting" | "warning" | "locked" | "spinning" | "result";
  displayTime: number;
  winningIndex: number;
  winningPosition: { number: number | string; color: string };
  outerColors: string[]; // Synced gold position
  goldPosition: number;
  goldMultiplier: number;
}
```

### Features

- Auto-reconnect on disconnect (3s delay)
- `isClosing` flag prevents reconnect during unmount
- URL stored in ref to prevent dependency loops

---

## useAuth

Authentication hook managing user login state and credentials.

### Usage

```tsx
const {
  isAuthenticated, // Boolean - logged in status
  user, // User object or null
  isLoading, // Boolean - checking auth status
  login, // (email, password) => Promise
  register, // (email, password, name) => Promise
  logout, // () => void
  updateBalance, // (newBalance) => void
} = useAuth();
```

### Features

- JWT token management (localStorage)
- Automatic token validation on mount
- Balance state synchronization
- Dual currency mode support (trial/real)

---

## useAnalytics

User behavior tracking with intelligent batching to minimize API calls.

### Usage

```tsx
const { track } = useAnalytics({
  username: user.username,
  enabled: isAuthenticated,
  batchSize: 60, // Optional: events before flush
  flushInterval: 15000, // Optional: ms between flushes
});

// Track events
track.betPlaced({ amount, type, roundNumber });
track.betRemoved({ amount, msBeforeLock });
track.currencySwitched("trial", "real");
track.pageView("/live", "/topup");
```

### Configuration

| Option          | Default  | Description                     |
| --------------- | -------- | ------------------------------- |
| `username`      | required | User identifier                 |
| `enabled`       | `true`   | Enable/disable tracking         |
| `batchSize`     | 60       | Events queued before auto-flush |
| `flushInterval` | 15000    | Milliseconds between flushes    |

### Features

- **Local Batching**: Events queued in memory, sent in bulk
- **localStorage Backup**: Pending events persist across page reload
- **Heartbeat**: Session keep-alive every 60 seconds
- **sendBeacon**: Guaranteed delivery on page unload
- **Auto-Flush**: On batch size reached OR interval elapsed

### Track Methods

```typescript
track.betPlaced({ amount, type, roundNumber, msIntoRound });
track.betRemoved({ amount, msBeforeLock, wasLastSecond });
track.chipSelected(chipValue, previousChip);
track.roundResult({ won, amount, viewDurationMs });
track.currencySwitched(from, to);
track.chatMessageSent({ charCount, hasEmoji });
track.topupOpened(fromPage, balance);
track.paymentCompleted(packId, timeTakenMs);
```

---

## Related

- `server-v2.js` - WebSocket server implementation
- `lib/auth.ts` - Server-side auth utilities
- `lib/analytics.ts` - Analytics database operations
- `docs/ANALYTICS.md` - Full analytics documentation
- `components/ui/AuthModal.tsx` - Auth UI component
