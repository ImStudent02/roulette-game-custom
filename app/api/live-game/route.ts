'use server';

import { NextResponse } from 'next/server';

// Timer configuration (in seconds) - MUST match client
const TIMER_CONFIG = {
  bettingDuration: 210,     // 3 minutes 30 seconds betting
  lockedDuration: 20,       // 20 seconds suspense (betting locked)
  spinDuration: 10,         // 10 seconds spin animation
  resultDuration: 60,       // 60 seconds result display
};

const TOTAL_ROUND_TIME = 
  TIMER_CONFIG.bettingDuration + 
  TIMER_CONFIG.lockedDuration + 
  TIMER_CONFIG.spinDuration + 
  TIMER_CONFIG.resultDuration;

// Wheel positions - same as client
const WHEEL_NUMBERS = [
  { number: 26, color: 'black' }, { number: 44, color: 'black' },
  { number: 21, color: 'black' }, { number: 20, color: 'black' },
  { number: 33, color: 'black' }, { number: 14, color: 'black' },
  { number: 15, color: 'black' }, { number: 22, color: 'black' },
  { number: 31, color: 'black' }, { number: 43, color: 'black' },
  { number: 48, color: 'black' }, { number: 8, color: 'black' },
  { number: 3, color: 'black' }, { number: 13, color: 'black' },
  { number: 30, color: 'black' }, { number: 18, color: 'black' },
  { number: 24, color: 'black' }, { number: 'X', color: 'black' },
  { number: 41, color: 'white' }, { number: 10, color: 'white' },
  { number: 6, color: 'white' }, { number: 23, color: 'white' },
  { number: 7, color: 'white' }, { number: 2, color: 'white' },
  { number: 27, color: 'white' }, { number: 12, color: 'white' },
  { number: 36, color: 'white' }, { number: 47, color: 'white' },
  { number: 49, color: 'white' }, { number: 4, color: 'white' },
  { number: 45, color: 'white' }, { number: 16, color: 'white' },
  { number: 5, color: 'white' }, { number: 1, color: 'white' },
  { number: 35, color: 'white' }, { number: 17, color: 'black' },
  { number: 42, color: 'white' }, { number: 46, color: 'black' },
  { number: 39, color: 'white' }, { number: 34, color: 'black' },
  { number: 29, color: 'white' }, { number: 28, color: 'black' },
  { number: 11, color: 'white' }, { number: 40, color: 'black' },
  { number: 32, color: 'white' }, { number: 9, color: 'black' },
  { number: 50, color: 'white' }, { number: 19, color: 'black' },
  { number: 38, color: 'white' }, { number: 25, color: 'black' },
  { number: 37, color: 'white' }
];

type GamePhase = 'betting' | 'warning' | 'locked' | 'spinning' | 'result';

type WheelPosition = {
  number: number | string;
  color: string;
};

// Server-side singleton game state
// This persists across requests but resets on server restart
class GameSession {
  private static instance: GameSession;
  
  // Server start time - used as epoch for calculating rounds
  private serverStartTime: number;
  private lastWinningPosition: WheelPosition | null = null;
  private currentWinningPosition: WheelPosition | null = null;
  private lastProcessedRound: number = 0;
  private winningIndex: number = -1;
  
  private constructor() {
    this.serverStartTime = Date.now();
  }
  
  static getInstance(): GameSession {
    if (!GameSession.instance) {
      GameSession.instance = new GameSession();
    }
    return GameSession.instance;
  }
  
  private seededRandom(seed: number): number {
    // Simple seeded random for consistent results per round
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
  }
  
  getState(): {
    phase: GamePhase;
    timeRemaining: number;
    displayTime: number;
    roundNumber: number;
    lastWinningPosition: WheelPosition | null;
    currentWinningPosition: WheelPosition | null;
    winningIndex: number;
    shouldSpin: boolean;
    shouldRegenerateGold: boolean;
  } {
    const now = Date.now();
    const elapsedSinceStart = Math.floor((now - this.serverStartTime) / 1000);
    
    // Calculate current round number
    const roundNumber = Math.floor(elapsedSinceStart / TOTAL_ROUND_TIME) + 1;
    
    // Calculate elapsed time within current round
    const elapsedInRound = elapsedSinceStart % TOTAL_ROUND_TIME;
    const timeRemaining = TOTAL_ROUND_TIME - elapsedInRound;
    
    // Determine phase
    let phase: GamePhase;
    let displayTime: number;
    let shouldSpin = false;
    let shouldRegenerateGold = false;
    
    if (elapsedInRound < TIMER_CONFIG.bettingDuration) {
      if (elapsedInRound >= 180) { // Last 30 seconds
        phase = 'warning';
      } else {
        phase = 'betting';
      }
      displayTime = TIMER_CONFIG.bettingDuration - elapsedInRound;
      
      // Check if this is a new round - trigger gold regeneration
      if (roundNumber > this.lastProcessedRound && elapsedInRound < 2) {
        shouldRegenerateGold = true;
      }
    } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) {
      phase = 'locked';
      displayTime = TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration - elapsedInRound;
    } else if (elapsedInRound < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration) {
      phase = 'spinning';
      displayTime = TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration - elapsedInRound;
      
      // Generate consistent winning position for this round
      if (roundNumber > this.lastProcessedRound || this.currentWinningPosition === null) {
        const random = this.seededRandom(roundNumber + this.serverStartTime);
        this.winningIndex = Math.floor(random * WHEEL_NUMBERS.length);
        this.currentWinningPosition = WHEEL_NUMBERS[this.winningIndex];
        shouldSpin = true;
      }
    } else {
      phase = 'result';
      displayTime = timeRemaining;
      
      // During result phase, ensure winning position is set
      if (this.currentWinningPosition === null) {
        const random = this.seededRandom(roundNumber + this.serverStartTime);
        this.winningIndex = Math.floor(random * WHEEL_NUMBERS.length);
        this.currentWinningPosition = WHEEL_NUMBERS[this.winningIndex];
      }
    }
    
    // When round changes, move current to last
    if (roundNumber > this.lastProcessedRound) {
      if (this.currentWinningPosition && phase === 'betting') {
        this.lastWinningPosition = this.currentWinningPosition;
        this.currentWinningPosition = null;
      }
      this.lastProcessedRound = roundNumber;
    }
    
    return {
      phase,
      timeRemaining,
      displayTime,
      roundNumber,
      lastWinningPosition: this.lastWinningPosition,
      currentWinningPosition: this.currentWinningPosition,
      winningIndex: this.winningIndex,
      shouldSpin,
      shouldRegenerateGold,
    };
  }
}

export async function GET() {
  const session = GameSession.getInstance();
  const state = session.getState();
  
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
