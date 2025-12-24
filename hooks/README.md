# Hooks Directory

## Purpose

This directory contains **custom React hooks** that encapsulate reusable stateful logic for the application.

## Hooks

| Hook           | File              | Description                             |
| -------------- | ----------------- | --------------------------------------- |
| `useWebSocket` | `useWebSocket.ts` | WebSocket connection for live game sync |
| `useAuth`      | `useAuth.tsx`     | Authentication state management         |

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

## Related

- `server.js` - WebSocket server implementation
- `lib/auth.ts` - Server-side auth utilities
- `components/ui/AuthModal.tsx` - Auth UI component
