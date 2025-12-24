# Components Directory

## Purpose

This directory contains all **React components** for the roulette game application, organized by domain.

## Structure

```
components/
├── roulette/           # Game-specific components (see roulette/README.md)
│   ├── RouletteWheel.tsx       # Main wheel with spin animation
│   ├── RouletteGame.tsx        # Self-play game mode
│   ├── LiveRouletteGame.tsx    # Live multiplayer mode
│   ├── LiveRouletteGameV2.tsx  # Enhanced live mode (WebSocket)
│   ├── LiveRouletteGameV3.tsx  # Latest live mode iteration
│   ├── BettingTable.tsx        # Bet placement UI
│   ├── BettingControls.tsx     # Chip selection controls
│   ├── ActiveBets.tsx          # Current bets display
│   ├── BetHistory.tsx          # Past bet results
│   ├── GameTimer.tsx           # Timer with phase indicator
│   ├── LiveChat.tsx            # Real-time chat
│   └── LiveRouletteWheel.tsx   # Server-controlled wheel
│
└── ui/                 # Reusable UI components (see ui/README.md)
    ├── AnimatedBackground.tsx  # Particle effects
    ├── AuthModal.tsx           # Basic auth modal
    ├── AuthModalV2.tsx         # Enhanced auth with OTP
    ├── CurrencyHeader.tsx      # Balance & currency toggle
    ├── CurrencyIcon.tsx        # Currency icons
    ├── LoadingSpinner.tsx      # Loading indicator
    └── WalletPanel.tsx         # Wallet management
```

## Key Components

### RouletteWheel

The main wheel component featuring:

- 51 numbered slots (inner ring)
- Outer color ring (green/pink/gold/red)
- Random gold position with mystery multiplier (50x-200x)
- Smooth CSS animation for spin
- Server-sync support via `serverOuterColors` prop

### LiveRouletteGameV2/V3

Live multiplayer game using WebSocket:

- Connects to `server.js` on port 3001
- Time-based spin sync via `roundStartTime`
- Shared outer colors for consistent gold position

### BettingTable

Comprehensive bet placement UI:

- Color bets (black/white) - 1.9x
- Parity bets (even/odd) - 1.8x
- Number bets (1-50, X) - 24x
- Special bets (green/pink) - 4.9x
- Gold bet - 50-200x

## Design System

Components use consistent styling:

- Dark background: `#08080c`, `#0a0a0f`
- Gold accent: `#d4af37`, `#f4d03f`
- Glassmorphism: `glass-card` class
- Casino green felt: `casino-felt` class

## Related

- `app/globals.css` - Global styles and CSS variables
- `lib/types.ts` - TypeScript type definitions
