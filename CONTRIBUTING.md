# 🎰 Roulette Game - Developer Guide

A real-time multiplayer roulette game built with Next.js 15, React 19, and WebSocket.

[![Live Demo](https://img.shields.io/badge/🎮_Live_Demo-Railway-purple)](https://roulette-game-custom-production.up.railway.app)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-18+-green.svg)](https://nodejs.org)

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org))
- **npm** or **yarn**
- **Git**

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/ImStudent02/roulette-game.git
cd roulette-game

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# MongoDB (optional - for user auth)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/roulette

# JWT Secret (for authentication)
JWT_SECRET=your-super-secret-jwt-key

# Port (Railway/Render will override this)
PORT=3001

# Node Environment
NODE_ENV=development
```

### Run Locally

```bash
# Development mode (Next.js + WebSocket on port 3001)
npm run dev

# Or run Next.js only (no WebSocket, self-mode only)
npm run dev:simple
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

---

## 🛠 Tech Stack

| Category       | Technology                              |
| -------------- | --------------------------------------- |
| **Frontend**   | Next.js 15, React 19, TypeScript        |
| **Styling**    | Tailwind CSS 4                          |
| **Real-time**  | WebSocket (`ws` library)                |
| **Database**   | MongoDB (optional)                      |
| **Auth**       | JWT, bcryptjs                           |
| **Deployment** | Railway, Render, Vercel (frontend only) |

---

## 📁 Project Structure

```
roulette-game/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Self-mode (single player)
│   ├── live/page.tsx      # Live mode (multiplayer)
│   ├── story/page.tsx     # Story mode with TTS
│   ├── rules/page.tsx     # Game rules page
│   └── api/               # API routes (auth, spin)
│
├── components/
│   ├── roulette/          # Core game components
│   │   ├── RouletteWheel.tsx        # Animated wheel
│   │   ├── BettingTable.tsx         # Betting grid
│   │   ├── LiveRouletteGameV2.tsx   # Live game logic
│   │   ├── LiveChat.tsx             # Real-time chat
│   │   └── GameTimer.tsx            # Round timer
│   └── ui/                # General UI components
│       └── AuthModal.tsx  # Login/signup modal
│
├── hooks/
│   └── useWebSocket.ts    # WebSocket connection hook
│
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── gameUtils.ts       # Game calculations
│   ├── gameConfig.ts      # Multipliers, weights
│   └── db.ts              # MongoDB connection
│
├── server.js              # 🔥 WebSocket + Next.js server
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 💻 Development

### Understanding the Codebase

#### 1. **WebSocket Server** (`server.js`)

The heart of live mode. Handles:

- Game state synchronization (all players see same wheel)
- Timer-based rounds (betting → locked → spin → result)
- Real-time chat
- Deterministic random using seeded functions

```javascript
// Key functions
getGameState(); // Returns current round, phase, winning position
handleMessage(); // Processes client messages (auth, bets, chat)
broadcastToAll(); // Sends to all connected clients
```

#### 2. **WebSocket Hook** (`hooks/useWebSocket.ts`)

React hook for WebSocket connection:

```typescript
const {
  isConnected, // Connection status
  gameState, // Server game state
  chatMessages, // Chat history
  placeBet, // Send bet to server
  sendChatMessage, // Send chat
} = useWebSocket("wss://your-server.com/ws");
```

#### 3. **Game Components**

| Component                | Purpose                             |
| ------------------------ | ----------------------------------- |
| `RouletteWheel.tsx`      | Animated wheel with CSS transitions |
| `BettingTable.tsx`       | Interactive betting grid            |
| `LiveRouletteGameV2.tsx` | Main live game orchestrator         |
| `GameTimer.tsx`          | Round countdown display             |

### Code Style

- **TypeScript** for type safety
- **ESLint** with Next.js config
- Use meaningful variable names
- Add comments for complex logic

```bash
# Run linter
npm run lint
```

---

## 🚢 Deployment

### Railway (Recommended - Supports WebSocket)

1. Connect your GitHub repo to [Railway](https://railway.app)
2. Set environment variables in Railway dashboard
3. Railway auto-detects Node.js and runs `npm run build` + `node server.js`

### Render

1. Create new Web Service on [Render](https://render.com)
2. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.js`
3. Add environment variables

### ⚠️ Vercel/Netlify (Limited)

These platforms are **serverless** and don't support WebSocket. You can:

- Deploy frontend to Vercel
- Deploy WebSocket server to Railway/Render separately
- Update `WS_URL` in `LiveRouletteGameV2.tsx` to point to your WebSocket server

---

## 🤝 Contributing

We welcome contributions! Here's how:

### 1. Fork & Clone

```bash
git clone https://github.com/YOUR_USERNAME/roulette-game.git
cd roulette-game
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow existing code style
- Add comments for complex logic
- Test your changes locally

### 3. Commit & Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 4. Create Pull Request

Go to GitHub and create a PR with:

- Clear title
- Description of changes
- Screenshots (for UI changes)

### Contribution Ideas 💡

| Priority  | Feature                          | Difficulty |
| --------- | -------------------------------- | ---------- |
| 🔥 High   | Server-side bet processing       | Medium     |
| 🔥 High   | User authentication with MongoDB | Medium     |
| 🟡 Medium | Leaderboard system               | Easy       |
| 🟡 Medium | Two-ball gold rule (bets > 1000) | Medium     |
| 🟢 Low    | Sound effects                    | Easy       |
| 🟢 Low    | Mobile touch improvements        | Easy       |

### Good First Issues

- Add loading skeleton for wheel
- Improve mobile responsiveness
- Add bet history export (CSV)
- Create unit tests for `gameUtils.ts`

---

## 🔧 Troubleshooting

### WebSocket not connecting in production

**Symptoms:** Wheel shows "Connecting..." forever

**Solution:**

1. Check server binds to `0.0.0.0` (not `localhost`)
2. Use `wss://` (not `ws://`) for HTTPS sites
3. Check Railway/Render logs for errors

```javascript
// server.js should have:
const hostname = dev ? "localhost" : "0.0.0.0";

// Frontend should use:
const WS_URL =
  window.location.hostname === "localhost"
    ? "ws://localhost:3001/ws"
    : `wss://${window.location.host}/ws`;
```

### Build fails on deployment

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### MongoDB connection issues

- Ensure IP whitelist includes `0.0.0.0/0` (allow all) in MongoDB Atlas
- Check `MONGO_URI` format

---

## 📄 License

MIT License © 2025 YC MAYANI

See [LICENSE](README.md) for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- WebSocket powered by [ws](https://github.com/websockets/ws)
- Deployed on Free Servers for test. Thanks to all.

---

**Questions?** Open an issue or reach out!

Happy coding! 🎲✨
