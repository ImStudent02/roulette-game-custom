# Roulette Game Customized

DEMO: https://68dfb2f814489b38a5c1a0cc--startling-mousse-9dfd56.netlify.app/
PREVIEW: https://roulette-game-custom-5jl828u0f-imstudent02s-projects.vercel.app/
(This DEMO or PREVIEW are under construction this is not final product)

A web-based roulette game with unique rules, additional wheel mechanics, and virtual currency.

## Features

- **Main Wheel**: 51 numbers (1-50 + X) with Black & White positioning
- **Additional Wheel**: Green, Pink, Gold, and Red positions with special rules
- **Betting Options**: Black/White, Even/Odd, Green/Pink, Gold, X, and specific numbers
- **Multipliers**: Different multipliers for each bet type
- **Gold Mystery**: Gold multiplier is hidden (50x - 200x) until result!
- **Live Mode**: Real-time multiplayer with synchronized wheel and chat
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

## Game Rules

- **Black & White**: 1.9x multiplier
- **Even-Odd**: 1.8x multiplier
- **Green & Pink**: 6.5x multiplier
- **Gold**: 50x, 100x, 150x, or 200x multiplier (variable)
- **X**: 1.0x multiplier
- **Winning Number**: 30x multiplier

### Special Rule

If a bet on Gold exceeds 1000 units, two balls will roll together, resulting in two winning numbers.

### Cheat Code

Enter the code "@mrmoney" in the cheat code input box to receive 5,000 chips.

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
