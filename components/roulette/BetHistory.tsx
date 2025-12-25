'use client';

import { memo } from 'react';
import Image from 'next/image';
import { WheelPosition, BetHistoryItem } from '@/lib/types';
import { WHEEL_NUMBERS } from './RouletteWheel';

type BetHistoryProps = {
  history: BetHistoryItem[];
  className?: string;
};

const BetHistory = ({ history, className = '' }: BetHistoryProps) => {
  // Helper to get proper color classes based on bet type
  const getBetColor = (betType: string, targetNumber?: number) => {
    if (betType === 'black') return 'bg-black text-white';
    if (betType === 'white') return 'bg-white text-black';
    if (betType === 'even') return 'bg-white text-black';
    if (betType === 'odd') return 'bg-black text-white';
    if (betType === 'green') return 'bg-green-500 text-white';
    if (betType === 'pink') return 'bg-pink-500 text-white';
    if (betType === 'gold') return 'bg-yellow-500 text-black';
    if (betType === 'x') return 'bg-black text-white';
    
    // For number bets, get the color from WHEEL_NUMBERS
    if (betType === 'number' && targetNumber) {
      const position = WHEEL_NUMBERS.find(pos => pos.number === targetNumber);
      return position?.color === 'black' ? 'bg-black text-white' : 'bg-white text-black';
    }
    
    return 'bg-gray-500 text-white';
  };
  
  // Format a timestamp nicely - handles both Date objects and ISO strings from localStorage
  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };
  
  // Format numbers with commas for readability
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  const getBetTitle = (item: BetHistoryItem) => {
    const { betType, targetNumber, position } = item;
    
    if (betType === 'number') {
      return `Number ${targetNumber}`;
    }
    
    return betType.charAt(0).toUpperCase() + betType.slice(1);
  };
  
  // Get outcome text with icon
  const getOutcomeText = (item: BetHistoryItem) => {
    if (item.outcome === 'win') {
      return (
        <span className="text-green-400 font-bold flex items-center">
          <span className="mr-1">+{formatNumber(item.winAmount || 0)}</span>
          <span>✓</span>
        </span>
      );
    } else {
      return (
        <span className="text-red-400 font-bold flex items-center">
          <span className="mr-1">-{formatNumber(item.amount)}</span>
          <span>✗</span>
        </span>
      );
    }
  };
  
  if (history.length === 0) {
    return (
      <div className={`${className} glass-card p-5 text-center`}>
        <h3 className="text-lg font-bold text-white mb-3 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
          History
        </h3>
        <p className="text-gray-400">No betting history yet</p>
      </div>
    );
  }
  
  return (
    <div className={`${className} glass-card p-3 sm:p-5`}>
      <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
        History
      </h3>
      
      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto pr-1">
        {history.map(item => (
          <div key={item.id} className="bg-black/40 rounded-lg p-2 sm:p-3 flex items-center gap-2 sm:gap-3 border border-[#d4af37]/20">
            {/* Bet type indicator */}
            <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${
              getBetColor(item.betType, item.targetNumber).includes('white') 
                ? 'bg-white' 
                : 'bg-black'
            }`}></div>
            
            {/* Bet info */}
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base text-white font-semibold truncate">
                {getBetTitle(item)}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                {formatNumber(item.amount)}
                <Image src={item.currencyMode === 'real' ? '/mango.svg' : '/rotten-mango.svg'} alt="" width={10} height={10} />
                • {formatTime(item.timestamp)}
              </div>
            </div>
            
            {/* Outcome */}
            <div className="text-xs sm:text-sm flex-shrink-0">{getOutcomeText(item)}</div>
            
            {/* Result */}
            <div className={`
              inline-flex items-center justify-center flex-shrink-0
              w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs font-bold rounded-full
              ${item.position.color === 'black' ? 'bg-black text-white border border-white/20' : 'bg-white text-black'}
            `}>
              {item.position.number}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(BetHistory); 