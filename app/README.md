# App Directory

## Purpose

This directory contains the **Next.js App Router** pages, API routes, and global styles. It uses the Next.js 13+ App Router conventions.

## Structure

```
app/
├── api/                    # Backend API routes (see api/README.md)
│   ├── auth/               # Authentication endpoints
│   ├── live-game/          # Live game state polling
│   ├── user/               # User profile endpoints
│   └── wallet/             # Financial operations
│
├── live/                   # /live - Live multiplayer roulette
├── profile/                # /profile - User profile page
├── rules/                  # /rules - Game rules page
├── story/                  # /story - Static backstory page
├── story-animated/         # /story-animated - Animated story with TTS
├── topup/                  # /topup - Add funds page
│
├── globals.css             # Global styles (casino theme, utilities)
├── layout.tsx              # Root layout with metadata & fonts
├── page.tsx                # / - Self-play roulette (single player)
├── manifest.ts             # PWA manifest configuration
├── favicon.ico             # App favicon
├── icon-*.png              # PWA icons
└── README.md               # This file
```

## Pages

| Route             | Component          | Description                                    |
| ----------------- | ------------------ | ---------------------------------------------- |
| `/`               | `RouletteGame`     | Single-player roulette (button-triggered spin) |
| `/live`           | `LiveRouletteGame` | Multiplayer live roulette (timer-based sync)   |
| `/profile`        | Profile page       | User account management                        |
| `/rules`          | Rules page         | Game rules and payout explanations             |
| `/story`          | Story page         | "The House of the Mango Devil" backstory       |
| `/story-animated` | Animated Story     | Story with TTS narration and animations        |
| `/topup`          | Top-up page        | Add funds to wallet                            |

## API Routes

See `app/api/README.md` for detailed API documentation.

| Endpoint               | Method | Description                |
| ---------------------- | ------ | -------------------------- |
| `/api/auth/register`   | POST   | Register new user          |
| `/api/auth/login`      | POST   | Login user, return JWT     |
| `/api/auth/send-otp`   | POST   | Send OTP for verification  |
| `/api/auth/verify-otp` | POST   | Verify OTP code            |
| `/api/live-game`       | GET    | Poll live game state       |
| `/api/user`            | GET    | Get user profile           |
| `/api/wallet/topup`    | POST   | Add funds                  |
| `/api/wallet/withdraw` | POST   | Withdraw funds             |
| `/api/wallet/convert`  | POST   | Convert between currencies |

## Styling

Global styles in `globals.css` include:

- Casino dark theme (`#08080c`, `#0a0a0f`)
- Gold accent colors (`#d4af37`, `#f4d03f`)
- Glassmorphism effects (`.glass-card`)
- Animation utilities
- Responsive breakpoints
