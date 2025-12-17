# Components Directory

React components for the roulette game UI.

## Structure

```
components/
├── roulette/            # Game-specific components
│   ├── RouletteWheel.tsx    # The wheel with slots, gold, spin animation
│   ├── RouletteGame.tsx     # Self-play game (button triggered)
│   ├── LiveRouletteGame.tsx # Legacy live game component
│   ├── LiveRouletteGameV2.tsx # Current live game (WebSocket sync)
│   ├── LiveRouletteWheel.tsx  # Deprecated: server-controlled wheel
│   ├── LiveChat.tsx         # Real-time chat component
│   ├── BettingTable.tsx     # Bet placement UI
│   ├── ActiveBets.tsx       # Shows current bets with win preview
│   ├── BetHistory.tsx       # Shows past bet results
│   └── GameTimer.tsx        # Timer display with phase indicator
└── ui/
    └── AuthModal.tsx        # Login/signup modal
```

## Key Components

### RouletteWheel

The main wheel component with:

- 51 numbered slots (inner ring)
- Outer color ring (green/pink/gold/red)
- Gold position with mystery multiplier (50x-200x)
- Smooth CSS animation for spin
- Server-sync support via `serverOuterColors` prop

### LiveRouletteGameV2

Live multiplayer game using WebSocket:

- Connects to `server.js` on port 3001
- Time-based spin sync via `roundStartTime`
- Shared outer colors for consistent gold position

### BettingTable

Bet placement with chip selection:

- Color bets (black/white)
- Parity bets (even/odd)
- Number bets (1-50, X)
- Special bets (green/pink/gold/x)
