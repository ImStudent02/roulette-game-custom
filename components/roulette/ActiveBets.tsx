'use client';

import { memo } from 'react';
import { Bet, WheelPosition } from '@/lib/types';
import { multipliers } from '@/lib/gameUtils';
import { WHEEL_NUMBERS } from './RouletteWheel';

type ActiveBetsProps = {
  bets: Bet[];
  onRemoveBet?: (id: string) => void;
  removeBet?: (id: string) => void; // Add for backward compatibility
  isSpinning?: boolean;
  className?: string;
};

// Get bet type color based on the type - ensuring consistency with wheel
const getBetTypeColor = (type: string, targetNumber?: number): string => {
  // For number bets, get the color from WHEEL_NUMBERS
  if (type === 'number' && targetNumber !== undefined) {
    const wheelPosition = WHEEL_NUMBERS.find(pos => pos.number === targetNumber);
    if (wheelPosition) {
      if (wheelPosition.color === 'black') return 'bg-black text-white';
      if (wheelPosition.color === 'white') return 'bg-white text-black';
    }
  }
  
  if (type === 'black') return 'bg-black text-white';
  if (type === 'white') return 'bg-white text-black';
  if (type === 'even') return 'bg-white text-black';
  if (type === 'odd') return 'bg-black text-white';
  if (type === 'green') return 'bg-green-500 text-white';
  if (type === 'pink') return 'bg-pink-500 text-white';
  if (type === 'gold') return 'bg-yellow-500 text-black';
  if (type === 'x') return 'bg-black text-white';
  
  return 'bg-gray-500 text-white';
};

// Get indicator dot color class
const getIndicatorDotClass = (type: string, targetNumber?: number): string => {
  // For number bets, get the color from WHEEL_NUMBERS
  if (type === 'number' && targetNumber !== undefined) {
    const wheelPosition = WHEEL_NUMBERS.find(pos => pos.number === targetNumber);
    if (wheelPosition && wheelPosition.color === 'black') return 'bg-black';
    if (wheelPosition && wheelPosition.color === 'white') return 'bg-white';
  }
  
  if (type === 'black') return 'bg-black';
  if (type === 'white') return 'bg-white';
  if (type === 'even') return 'bg-white';
  if (type === 'odd') return 'bg-black';
  if (type === 'green') return 'bg-green-500';
  if (type === 'pink') return 'bg-pink-500';
  if (type === 'gold') return 'bg-yellow-500';
  if (type === 'x') return 'bg-black';
  
  return 'bg-gray-500';
};

// Get multiplier for display
const getMultiplierDisplay = (bet: Bet, position?: WheelPosition): string => {
  const { type } = bet;
  let multiplier: number;
  
  if (type === 'gold' && position) {
    // @ts-ignore - we know gold has a function multiplier
    multiplier = multipliers[type](position);
  } else {
    multiplier = typeof multipliers[type] === 'number' ? 
      multipliers[type] as number : 
      30; // Default for number
  }
  
  return `${multiplier}x`;
};

// Format numbers for display
const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

const ActiveBets = ({ 
  bets, 
  onRemoveBet, 
  removeBet, 
  isSpinning = false, 
  className = '' 
}: ActiveBetsProps) => {
  // Use onRemoveBet if provided, otherwise use removeBet
  const handleRemoveBet = onRemoveBet || removeBet;
  
  // Calculate total amount bet
  const totalAmount = bets.reduce((total, bet) => total + bet.amount, 0);
  
  if (bets.length === 0) {
    return (
      <div className={`${className} glass-card p-5 text-center`}>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
          Active Bets
        </h3>
        <p className="text-gray-400">No active bets</p>
      </div>
    );
  }
  
  return (
    <div className={`${className} glass-card p-3 sm:p-5`}>
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
          Active Bets
        </h3>
        <div className="text-sm sm:text-base text-white">
          Total: <span className="font-bold text-[#d4af37]">{formatNumber(totalAmount)}</span>
        </div>
      </div>
      
      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
        {bets.map(bet => {
          const { id, type, amount, targetNumber } = bet;
          const colorClass = getBetTypeColor(type, targetNumber);
          const indicatorColor = getIndicatorDotClass(type, targetNumber);
          const betTitle = type === 'number' ? `#${targetNumber}` : 
                           type.charAt(0).toUpperCase() + type.slice(1);
          
          // Calculate potential win - show range for gold (mystery)
          const multiplier = typeof multipliers[type] === 'number' ? 
            multipliers[type] as number : 
            30; // Default for number
          
          // For gold bets, show range instead of fixed amount (it's a surprise!)
          const isGoldBet = type === 'gold';
          const potentialWin = Math.floor(amount * multiplier);
          
          return (
            <div 
              key={id} 
              className="bg-black/40 rounded-lg p-2 sm:p-3 flex justify-between items-center border border-[#d4af37]/20 hover:border-[#d4af37]/40 transition-colors"
            >
              <div className="flex items-center min-w-0 flex-1">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-2 sm:mr-3 flex-shrink-0 ${indicatorColor} shadow-sm`}></div>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base text-white font-semibold truncate">{betTitle}</div>
                  <div className="text-xs sm:text-sm text-gray-400">
                    1 bet
                  </div>
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-2">
                <div className="text-sm sm:text-base text-white text-right font-medium">{amount}</div>
                <div className="text-[10px] sm:text-xs text-[#d4af37] text-right">
                  {isGoldBet ? 'Win: 50x - 200x' : `Win: ${formatNumber(potentialWin)}`}
                </div>
              </div>
              
              {/* Only render remove button if handleRemoveBet is available and not spinning */}
              {handleRemoveBet && !isSpinning && (
                <button 
                  onClick={() => handleRemoveBet(id)}
                  className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/40 hover:text-red-300 flex items-center justify-center transition-colors text-xs sm:text-sm"
                  aria-label="Remove bet"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default memo(ActiveBets); 