export type BetType = 'black' | 'white' | 'even' | 'odd' | 'green' | 'pink' | 'gold' | 'x' | 'number';

export type WheelPosition = {
  number: number | string;
  color: string;
};

export type MultiplierMap = {
  [key in BetType]: number | ((position: WheelPosition) => number);
};

export type Bet = {
  id: string;
  type: BetType;
  amount: number;
  targetNumber?: number;
};

export type BetHistoryItem = {
  id: string;
  betType: BetType;
  targetNumber?: number;
  amount: number;
  outcome: 'win' | 'loss';
  winAmount?: number;
  timestamp: Date;
  position: WheelPosition;
};

export type GameState = {
  balance: number;
  currentBets: Bet[];
  isSpinning: boolean;
  lastWinnings: number;
  history: WheelPosition[];
  betHistory: BetHistoryItem[];
  winningPosition?: WheelPosition;
}; 