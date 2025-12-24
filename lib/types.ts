export type BetType = 'black' | 'white' | 'even' | 'odd' | 'green' | 'pink' | 'gold' | 'x' | 'number';

export type CurrencyMode = 'trial' | 'real';

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
  currencyMode: CurrencyMode; // Which currency this bet uses
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
  currencyMode: CurrencyMode; // Which currency this bet used
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