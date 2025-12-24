# UI Components Directory

## Purpose

This directory contains **reusable UI components** that are not specific to the roulette game logic. These are general-purpose components used across the application.

## Components

| Component                | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `AnimatedBackground.tsx` | Floating particle/bokeh background animation         |
| `AuthModal.tsx`          | Basic authentication modal dialog                    |
| `AuthModalV2.tsx`        | Enhanced auth modal with OTP verification flow       |
| `CurrencyHeader.tsx`     | Header showing balance, currency toggle, user info   |
| `CurrencyIcon.tsx`       | Icon component for trial/real currency display       |
| `LoadingSpinner.tsx`     | Animated loading indicator                           |
| `WalletPanel.tsx`        | Wallet management panel (deposit, withdraw, convert) |

## Usage Example

```tsx
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import CurrencyHeader from "@/components/ui/CurrencyHeader";

// In your component:
<CurrencyHeader
  balance={1000}
  currencyMode="trial"
  onModeChange={handleModeChange}
/>;
```

## Design System

Components follow the casino theme with:

- Dark backgrounds (`#08080c`, `#0a0a0f`)
- Gold accents (`#d4af37`, `#f4d03f`)
- Glassmorphism effects (`glass-card` class)
- Smooth animations and transitions

## Related

- `app/globals.css` - Global styles and CSS variables
- `components/roulette/` - Game-specific components
