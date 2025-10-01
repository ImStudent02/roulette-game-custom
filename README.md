# Roulette Game

A web-based roulette game with unique rules, additional wheel mechanics, and virtual currency.

## Features

- **Main Wheel**: 51 numbers (1-50 + X) with Black & White positioning
- **Additional Wheel**: Green, Pink, Gold, and Red positions with special rules
- **Betting Options**: Black/White, Even/Odd, Green/Pink, Gold, X, and specific numbers
- **Multipliers**: Different multipliers for each bet type
- **Special Rules**: Double ball for large Gold bets
- **Virtual Currency**: Starting balance, winnings, and cheat codes

## Performance Optimizations

This game is built with performance in mind, especially for low-end devices:

- Optimized component rendering with React.memo and useCallback
- Minimal state updates and efficient rendering patterns
- CSS transitions instead of JavaScript animations for better performance
- Only necessary UI elements are rendered based on game state
- Reduced reflows and repaints for smoother gameplay
- Local storage for game state persistence without a backend

## Tech Stack

- **Framework**: Next.js with App Router
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Optimization**: TypeScript for better code quality

## Development

### Prerequisites

- Node.js 18.18.0 or higher

### Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate to the project
cd roulette-game

# Install dependencies
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the game in action.

### Building for Production

```bash
npm run build
npm start
```

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

## License

MIT
"# roulette-game-custom" 
