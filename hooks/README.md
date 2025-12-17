# Hooks Directory

Custom React hooks.

## useWebSocket.ts

WebSocket hook for real-time server communication.

### Usage

```tsx
const {
  isConnected, // Boolean - connection status
  gameState, // Server game state (phase, timer, winning number, etc.)
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
  outerColors: string[]; // For synced gold position
  goldPosition: number;
  goldMultiplier: number;
}
```

### Features

- Auto-reconnect on disconnect (3s delay)
- `isClosing` flag prevents reconnect during unmount
- URL stored in ref to prevent dependency loops
