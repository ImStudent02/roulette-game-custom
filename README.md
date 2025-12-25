# Roulette Game Customized

DEMO: https://68dfb2f814489b38a5c1a0cc--startling-mousse-9dfd56.netlify.app/

PREVIEW: https://roulette-game-custom-8se0jitw5-imstudent02s-projects.vercel.app/

(This DEMO or PREVIEW are under construction this is not final product)

A web-based roulette game with unique rules, additional wheel mechanics, and virtual currency.

## Features

- **Main Wheel**: 51 numbers (1-50 + X) with Black & White positioning
- **Betting Options**: Black/White, Even/Odd, Green/Pink, Gold, X, and specific numbers
- **Multipliers**: Carefully balanced to ensure house edge on all bet types
- **Gold Mystery**: Gold multiplier is hidden (50x - 200x) until result!
- **Live Mode**: Real-time multiplayer with synchronized wheel and chat
- **Story Mode**: "The House of the Mango Devil" 🥭 - with TTS narration
- **Dual Currency**: Real (🥭 Mangos) and Trial (🍋 Fermented Mangos)
- **House Protection**: Smart outcome selection and dynamic bet limits

## Game Modes

### Self Mode (`/`)

Single player with button-triggered spin. Great for practice.

### Live Mode (`/live`)

Multiplayer with synchronized wheel:

- Timer-based rounds (3:30 betting, 15s locked, 15s spin, 60s result)
- All players see same wheel, same gold position, same result
- Real-time chat
- Dynamic bet limits based on house exposure

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:

| Variable      | Description               | Default                              |
| ------------- | ------------------------- | ------------------------------------ |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/roulette` |
| `PORT`        | Server port               | `3001`                               |
| `NODE_ENV`    | Environment               | `development`                        |

Optional:

- `GEMINI_API_KEY` - For AI chatbot
- `JWT_SECRET` - For token auth (future)

## Running the Game

```bash
# Install dependencies
npm install

# Live Mode (with house protection & WebSocket)
npm run dev

# Self Mode only (Next.js without WebSocket)
npm run dev:simple
```

### NPM Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Live mode with `server-v2.js` (house protection) |
| `npm run start`      | Production mode                                  |
| `npm run dev:simple` | Next.js only (no WebSocket)                      |
| `npm run dev:old`    | Old server.js (backup)                           |
| `npm run build`      | Build for production                             |

## Directory Structure

```
roulette-game/
├── app/              # Next.js pages and API routes
│   ├── admin/        # Admin dashboard
│   ├── auth/admin/   # Admin login
│   ├── payment/      # Payment flow
│   ├── topup/        # Package selection
│   └── api/admin/    # Admin APIs
├── components/       # React UI components
│   ├── roulette/     # Game components (wheel, betting, chat)
│   └── ui/           # General UI (auth modal, wallet)
├── hooks/            # Custom React hooks (useWebSocket)
├── lib/              # Utilities, types, auth, database
├── logs/             # Server log files
├── public/           # Static assets
├── server/           # Server modules (modular architecture)
│   ├── config.cjs    # Game configuration
│   ├── gameState.cjs # Round timing
│   ├── betProcessor.cjs # Bet handling
│   ├── houseProtection.cjs # Smart selection
│   └── logger.cjs    # File logging
└── server-v2.js      # WebSocket server
```

Each directory has its own `README.md` with detailed documentation.

## Game Rules & Payouts

| Bet Type | Positions | Win Prob | Multiplier | House Edge |
| -------- | --------- | -------- | ---------- | ---------- |
| Black    | 25/51     | 49.0%    | 1.9x       | ~7%        |
| White    | 25/51     | 49.0%    | 1.9x       | ~7%        |
| Even     | 25/51     | 49.0%    | 1.8x       | ~12%       |
| Odd      | 25/51     | 49.0%    | 1.8x       | ~12%       |
| Green    | 5/51      | 9.8%     | 4.9x       | ~4%        |
| Pink     | 5/51      | 9.8%     | 4.9x       | ~4%        |
| Number   | 1/51      | 1.96%    | 24x        | ~53%       |
| X        | 1/51      | 1.96%    | 24x\*      | ~53%       |
| Gold     | 1/51      | 1.96%    | 50-200x    | Variable   |

> **\*X Special Rule:** If you bet on X and X lands = **24x payout**. If X lands but you bet on something else = **1x refund** (your bet is returned).

### Anti-Exploit Design 🛡️

Multipliers are **mathematically designed** to ensure the house always has an edge, even if players try "coverage betting" strategies.

> "Covering more won't make you smarter." 🎲

### Cheat Code

Enter the code "@mrmoney" in the cheat code input box to receive 5,000 chips.

---

## 🛡️ House Protection System

### Dynamic Bet Limits

- Max bet calculated based on house fund and online users
- Formula: `(HouseFund × RiskPercent) / (OnlineUsers × MaxMultiplier)`
- Limits broadcast to clients each round
- Displayed in betting UI

### Smart Outcome Selection

- Analyzes payout for all 51 positions
- Weights selection toward house-favorable outcomes when exposure is high
- Aggressiveness scales: Low (<70%), Medium (70-90%), High (>90%)
- Trial mode farming protection (detects 80%+ trial bets)

---

## 🔐 Admin Panel

Access the admin dashboard to manage users, view logs, and configure game settings.

### Access

1. Go to `/auth/admin`
2. Login with credentials:
   - **Username**: `admin`
   - **Password**: `mango2024`
3. Dashboard available at `/admin`

### Features

| Tab       | Description                                              |
| --------- | -------------------------------------------------------- |
| Dashboard | Stats, online users, house fund, quick actions           |
| Users     | Search users, change status (active/timeout/suspend/ban) |
| Logs      | View error/warning/info logs with stack traces           |
| Settings  | Timer durations, bet limits, protection threshold        |

> **Security**: Sessions expire on browser/tab close. Change default password in production!

---

## � Payment Flow

1. Select package on `/topup`
2. Click **Confirm** button
3. Enter card details on `/payment`
4. Success → Game page | Failure → Back to topup

Card validation: 16 digits, MM/YY expiry, 3-4 digit CVC

---

## 💸 Withdraw Flow

1. Go to **Profile** → Click on **Mango Juice** card
2. Enter amount on `/withdraw` (min: 100 juice)
3. Select payment method (PayPal or Bank)
4. Confirm on `/withdraw/process`
5. Balance deducted, withdrawal logged

Rate: **1,000 Mango Juice = $1.00 USD**

---

## 🎁 Daily Login Reward

Every 24 hours, logged-in users can claim free trial currency:

- **Base reward**: 100 Fermented Mangos
- **Streak bonus**: +10% per consecutive day (max 7 days = +70%)
- Popup appears automatically on `/live` when available
- API: `GET /api/daily-claim` (check), `POST /api/daily-claim` (claim)

---

## 📝 Logging

Server logs are written to `logs/server.log`:

- JSON format with timestamp, level, message, stack
- Auto-rotation at 5MB (keeps 5 files)
- Viewable in Admin Panel → Logs tab

---

## 🚧 Pending Features

- [ ] **Two-Ball Gold Rule**: If gold bet exceeds 1000 units, two balls roll together
- [ ] **Real Payment Integration**: Stripe/PayPal (currently demo mode)
- [ ] **Leaderboards**: Global ranking system
- [ ] **Cinematic Story Images**: AI-generated images for story mode

Open-source contributions are welcome!

## License

MIT License

![Year](https://img.shields.io/badge/Copyright-©%202025--Present-blue)
YC MAYANI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
