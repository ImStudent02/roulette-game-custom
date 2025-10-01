// Types for the roulette game

export type WheelPosition = {
  number: number | 'X';
  color: 'black' | 'white' | 'green' | 'pink' | 'gold' | 'red';
};

export type BetType = 
  | 'black' 
  | 'white' 
  | 'even' 
  | 'odd' 
  | 'green' 
  | 'pink' 
  | 'gold' 
  | 'x'
  | 'number';

export type Bet = {
  id: string;
  type: BetType;
  amount: number;
  targetNumber?: number; // For number bets
};

export type GameState = {
  balance: number;
  currentBets: Bet[];
  winningPosition?: WheelPosition;
  secondWinningPosition?: WheelPosition; // For special gold bet rule
  isSpinning: boolean;
  lastWinnings: number;
  history: WheelPosition[];
};

export type MultiplierMap = {
  [key in BetType]: number | ((position: WheelPosition) => number);
}; 