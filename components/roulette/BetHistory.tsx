'use client';

import { memo } from 'react';
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
  
  // Format a timestamp nicely
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    <div className={`${className} glass-card p-5`}>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
        Bet History
      </h3>
      
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {history.map(item => (
          <div key={item.id} className="bg-black/40 rounded-lg p-3 flex items-center justify-between border border-[#d4af37]/20">
            <div className="flex items-center">
              {/* Bet type indicator */}
              <div className={`w-3 h-3 rounded-full mr-2 ${
                getBetColor(item.betType, item.targetNumber).includes('white') 
                  ? 'bg-white' 
                  : 'bg-black'
              }`}></div>
              
              <div>
                <div className="text-white font-semibold flex items-center">
                  {getBetTitle(item)}
                  <span className="text-xs text-gray-500 ml-2">{formatTime(item.timestamp)}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Bet: {formatNumber(item.amount)}
                </div>
              </div>
            </div>
            
            {/* Outcome */}
            <div>{getOutcomeText(item)}</div>
            
            {/* Winning position info */}
            <div className="text-right">
              <div className="text-white text-sm font-medium">
                Result:
              </div>
              <div className={`
                inline-flex items-center justify-center 
                w-6 h-6 text-xs font-bold rounded-full
                ${item.position.color === 'black' ? 'bg-black text-white' : 'bg-white text-black'}
              `}>
                {item.position.number}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default memo(BetHistory); 