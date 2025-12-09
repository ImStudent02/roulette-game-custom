# App Directory

This directory contains the Next.js App Router pages and API routes.

## Structure

```
app/
├── api/                  # API Routes
│   ├── auth/
│   │   ├── login/        # POST /api/auth/login - User login
│   │   └── register/     # POST /api/auth/register - User registration
│   └── live-game/        # GET /api/live-game - Legacy game state polling
├── live/                 # /live - Live multiplayer roulette page
├── manifest.webmanifest  # PWA manifest
├── favicon.ico           # App favicon
├── globals.css           # Global styles (casino theme)
├── layout.tsx            # Root layout with metadata
└── page.tsx              # / - Self-play roulette (single player)
```

## Pages

| Route   | Component          | Description                                    |
| ------- | ------------------ | ---------------------------------------------- |
| `/`     | RouletteGame       | Single-player roulette (button-triggered spin) |
| `/live` | LiveRouletteGameV2 | Multiplayer live roulette (timer-based sync)   |

## API Routes

| Endpoint             | Method | Description                          |
| -------------------- | ------ | ------------------------------------ |
| `/api/auth/register` | POST   | Register new user (MongoDB)          |
| `/api/auth/login`    | POST   | Login user, return JWT               |
| `/api/live-game`     | GET    | Legacy polling endpoint (deprecated) |
