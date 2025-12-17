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
- **Virtual Currency**: Starting balance, winnings, and cheat codes

## Game Modes

### Self Mode (`/`)

Single player with button-triggered spin. Great for practice.

### Live Mode (`/live`)

Multiplayer with synchronized wheel:

- Timer-based rounds (3:30 betting, 15s locked, 15s spin, 60s result)
- All players see same wheel, same gold position, same result
- Real-time chat

## Running the Game

```bash
# Install dependencies
npm install

# Self Mode only (standard Next.js)
npm run dev

# Live Mode (with WebSocket server on port 3001)
npm run dev:live
```

## Directory Structure

```
roulette-game/
├── app/              # Next.js pages and API routes
├── components/       # React UI components
│   ├── roulette/     # Game components (wheel, betting, chat)
│   └── ui/           # General UI (auth modal)
├── hooks/            # Custom React hooks (useWebSocket)
├── lib/              # Utilities, types, auth, database
├── public/           # Static assets
└── server.js         # WebSocket server for Live Mode
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

Multipliers are **mathematically designed** to ensure the house always has an edge, even if players try "coverage betting" strategies:

**Example: Betting on 25 numbers (half the wheel)**

- Cost: 25 units
- Win return: 24 units (24x multiplier)
- Net: **-1 unit per spin** = 4% house edge ✓

**Example: Covering all Green + Pink (10 positions)**

- Expected return: 4.9 × (10/51) = 0.96
- Net: **4% house edge** ✓

> "Covering more won't make you smarter." 🎲

### Cheat Code

Enter the code "@mrmoney" in the cheat code input box to receive 5,000 chips.

---

## 🚧 Pending Features (Not Yet Implemented)

- [ ] **Two-Ball Gold Rule**: If gold bet exceeds 1000 units, two balls roll together
- [ ] **Server-Side Betting**: Currently bets are processed client-side only
- [ ] **Real Money Integration**: Virtual currency only for now
- [ ] **Leaderboards**: Global ranking system
- [ ] **Cinematic Story Images**: AI-generated images for story mode (assets exist in `public/img/`)

Open-source contributions are welcome! Even the smallest help will be acknowledged in the final release.

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
