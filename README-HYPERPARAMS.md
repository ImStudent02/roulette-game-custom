# Roulette Game Hyperparameter Guide

This document explains how to use the hyperparameter system to adjust the behavior, probabilities, and payouts of the roulette game.

## Overview

The hyperparameter system allows you to control various aspects of the game:

1. **Outcome probabilities** - Adjust how often specific numbers or colors appear
2. **Payout multipliers** - Modify the rewards for different bet types
3. **Anti-streak mechanisms** - Prevent long win or loss streaks
4. **Special number behaviors** - Give certain numbers higher or lower chances
5. **Wheel composition** - Change the distribution of colors on the wheel

These parameters can be used to fine-tune the game's difficulty, balance, and overall player experience.

## How to Use

All hyperparameters are defined in the `lib/hyperParams.ts` file. To change the game's behavior, simply modify the values in this file and restart the application.

## Available Parameters

### Color and Number Weights

```typescript
// Probability weights for different outcomes (higher = more likely)
export const COLOR_WEIGHTS = {
  black: 1.0, // Weight for black outcomes
  white: 1.0, // Weight for white outcomes
};

// Probability adjustment for number types
export const NUMBER_WEIGHTS = {
  even: 1.0, // Weight for even numbers
  odd: 1.0, // Weight for odd numbers
};
```

Setting these values higher than 1.0 increases the chance of that outcome, while values below 1.0 decrease it. For example:

- `COLOR_WEIGHTS.black = 1.2` - Black numbers will appear 20% more often
- `NUMBER_WEIGHTS.odd = 0.8` - Odd numbers will appear 20% less often

### Special Outcome Probabilities

```typescript
// Special outcome probabilities
export const SPECIAL_OUTCOME_WEIGHTS = {
  x: 0.5, // Lower value = rarer X outcome
  gold: 0.2, // Probability weight for gold (lower = rarer)
  green: 0.5, // Probability weight for green outcomes
  pink: 0.5, // Probability weight for pink outcomes
  red: 0.5, // Probability weight for red outcomes
};
```

These control how likely special color outcomes are in the additional wheel. The `x` parameter controls how often the X position appears on the main wheel.

### Multiplier Adjustments

The **base multipliers** are defined in `lib/gameUtils.ts` and are designed for anti-exploit:

```typescript
// Current base multipliers (in gameUtils.ts)
export const multipliers = {
  black: 1.9, // 25/51 positions = ~7% house edge
  white: 1.9, // 25/51 positions = ~7% house edge
  even: 1.8, // 25/51 positions = ~12% house edge
  odd: 1.8, // 25/51 positions = ~12% house edge
  green: 4.9, // 5/51 positions = ~4% house edge (was 6.5x)
  pink: 4.9, // 5/51 positions = ~4% house edge (was 6.5x)
  gold: 50 - 200, // Variable, rare
  x: 1.0, // Refund only
  number: 24, // 1/51 positions = ~53% house edge (was 30x)
};
```

**Why these values?**

- **Number at 24x**: Prevents "half-wheel coverage" exploit. Betting on 25 numbers costs 25 units, wins 24 units = house edge.
- **Green/Pink at 4.9x**: With 10/51 combined positions, expected return is 0.96 = 4% house edge.

The `MULTIPLIER_FACTORS` in hyperParams.ts are applied ON TOP of these base values:

```typescript
// Multiplier adjustment factors (applied to base values)
export const MULTIPLIER_FACTORS = {
  black: 1.0,
  white: 1.0,
  even: 1.0,
  odd: 1.0,
  green: 1.0,
  pink: 1.0,
  gold: 1.0,
  x: 1.0,
  number: 1.0,
};
```

For example:

- `MULTIPLIER_FACTORS.number = 1.25` would make number bets pay 24 × 1.25 = 30x
- `MULTIPLIER_FACTORS.green = 0.8` would make green bets pay 4.9 × 0.8 = 3.92x

### Gold Multiplier Distribution

```typescript
// Gold multiplier probabilities (adjust frequency of each payout)
export const GOLD_MULTIPLIER_WEIGHTS = {
  50: 4, // 40% chance (4/10)
  100: 3, // 30% chance (3/10)
  150: 2, // 20% chance (2/10)
  200: 1, // 10% chance (1/10)
};
```

These weights control how often each gold multiplier appears. The values represent relative weights, not percentages.

### House Edge

```typescript
// House edge parameter (higher value = more house advantage)
export const HOUSE_EDGE = 0.05; // 5% house edge
```

Controls the overall house advantage across all bet types. Higher values make the game harder to win.

### Wheel Generation Parameters

```typescript
// Parameters for wheel generation
export const WHEEL_GENERATION = {
  blackNumbersCount: 25, // Number of black positions on wheel
  whiteNumbersCount: 25, // Number of white positions on wheel
  shuffleIntensity: 1.0, // How thoroughly to shuffle numbers (0.0-1.0)
};
```

These parameters control the physical composition of the wheel:

- `blackNumbersCount` and `whiteNumbersCount` determine how many black and white positions appear on the wheel
- `shuffleIntensity` controls how thoroughly the wheel positions are shuffled (higher = more random)

### Weighted Outcomes Toggle

```typescript
// Enable/disable pure randomness vs weighted outcomes
export const USE_WEIGHTED_OUTCOMES = true;
```

When set to `true`, the game uses all the probability weights defined. When `false`, all outcomes are purely random.

### Anti-Streak Mechanisms

```typescript
// Win streak compensation (anti-streak mechanism)
export const WIN_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 5, // After this many consecutive wins, increase losing chance
  compensationFactor: 0.2, // How much to increase losing probability
};

// Loss streak compensation (anti-streak mechanism)
export const LOSS_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 8, // After this many consecutive losses, increase winning chance
  compensationFactor: 0.15, // How much to increase winning probability
};
```

These parameters prevent long winning or losing streaks by subtly adjusting probabilities:

- After `maxStreakLength` consecutive wins, there's a `compensationFactor` probability of forcing a loss
- After `maxStreakLength` consecutive losses, there's a `compensationFactor` probability of forcing a win

### Lucky and Unlucky Numbers

```typescript
// Magic numbers for adding special behaviors
export const MAGIC_NUMBERS = {
  luckyNumber: 7, // This number has slightly higher chance of appearing
  luckyNumberBoost: 0.05, // 5% boost in probability for lucky number
  unluckyNumber: 13, // This number has slightly lower chance of appearing
  unluckyNumberPenalty: 0.05, // 5% reduction in probability
};
```

These parameters give special treatment to specific numbers:

- `luckyNumber` will appear more frequently (by `luckyNumberBoost` percentage)
- `unluckyNumber` will appear less frequently (by `unluckyNumberPenalty` percentage)

### Near Miss Effect

```typescript
// Threshold for the "almost win" effect (near miss)
export const NEAR_MISS_THRESHOLD = 0.1; // 10% of spins will be "near misses"
```

This parameter controls the "near miss" psychological effect in gambling. When enabled, it occasionally makes the ball land very close to a player's bet without winning.

## Examples

### Making the Game Easier

```typescript
export const MULTIPLIER_FACTORS = {
  black: 1.2,
  white: 1.2,
  even: 1.2,
  odd: 1.2,
  green: 1.5,
  pink: 1.5,
  gold: 1.2,
  x: 1.0,
  number: 1.5,
};

export const LOSS_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 4, // Kick in sooner (after 4 losses instead of 8)
  compensationFactor: 0.3, // Higher compensation (30% chance instead of 15%)
};

export const HOUSE_EDGE = 0.03; // Lower house edge (3% instead of 5%)
```

### Making the Game Harder

```typescript
export const MULTIPLIER_FACTORS = {
  black: 0.9,
  white: 0.9,
  even: 0.9,
  odd: 0.9,
  green: 0.8,
  pink: 0.8,
  gold: 0.8,
  x: 1.0,
  number: 0.9,
};

export const WIN_STREAK_COMPENSATION = {
  enabled: true,
  maxStreakLength: 3, // Kick in sooner (after 3 wins instead of 5)
  compensationFactor: 0.3, // Higher compensation (30% chance instead of 20%)
};

export const HOUSE_EDGE = 0.08; // Higher house edge (8% instead of 5%)
```

### Adjusting Special Events

```typescript
export const SPECIAL_OUTCOME_WEIGHTS = {
  x: 0.3, // Make X much rarer
  gold: 0.4, // Make gold more common
  green: 0.5,
  pink: 0.5,
  red: 0.5,
};

export const GOLD_MULTIPLIER_WEIGHTS = {
  50: 1, // 10% chance (extreme payouts more common)
  100: 2, // 20% chance
  150: 3, // 30% chance
  200: 4, // 40% chance
};
```

## Advanced Usage

For more complex behavior modifications, you can directly edit the game logic in `lib/gameUtils.ts`. The hyperparameter system is designed to be extensible, so feel free to add new parameters as needed.
