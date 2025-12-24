'use client';

import { memo, useState } from 'react';
import { Bet, BetType, CurrencyMode } from '@/lib/types';
import { generateBetId } from '@/lib/gameUtils';
import { WHEEL_NUMBERS } from './RouletteWheel';

type BettingTableProps = {
  onPlaceBet: (bet: Bet) => void;
  balance: number;
  isSpinning: boolean;
  currencyMode: CurrencyMode;
  maxBet?: number; // Server-defined max bet limit
  className?: string;
};

const BettingTable = ({
  onPlaceBet,
  balance,
  isSpinning,
  currencyMode,
  maxBet,
  className = '',
}: BettingTableProps) => {
  // Calculate actual max (min of balance and server limit)
  const actualMax = maxBet ? Math.min(balance, maxBet) : balance;
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  const handlePlaceBet = (type: BetType, targetNumber?: number) => {
    if (betAmount <= 0 || betAmount > balance || isSpinning) return;
    
    const bet: Bet = {
      id: generateBetId(),
      type,
      amount: betAmount,
      currencyMode, // Track which currency this bet uses
      ...(type === 'number' && targetNumber ? { targetNumber } : {}),
    };
    
    onPlaceBet(bet);
  };

  const handleNumberSelect = (number: number) => {
    setSelectedNumber(number);
    handlePlaceBet('number', number);
  };
  
  const handleBetTypeSelect = (type: BetType) => {
    handlePlaceBet(type);
  };
  
  const handleBetChange = (amount: number) => {
    setBetAmount(amount);
  };
  
  const handleAllIn = () => {
    setBetAmount(actualMax);
  };
  
  // Format large numbers for chip display
  const formatChipValue = (value: number): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${Math.floor(value / 1000)}K`;
    return value.toString();
  };

  // Chip configurations with colors and styles
  const chipConfigs = [
    { amount: 10, bg: 'from-yellow-400 to-yellow-600', text: 'text-black', label: '10' },
    { amount: 50, bg: 'from-slate-400 to-slate-600', text: 'text-white', label: '50' },
    { amount: 100, bg: 'from-blue-500 to-blue-700', text: 'text-white', label: '100' },
    { amount: 500, bg: 'from-emerald-500 to-emerald-700', text: 'text-white', label: '500' },
    { amount: 1000, bg: 'from-purple-500 to-purple-800', text: 'text-white', label: '1K' },
  ];
  
  const availableChips = chipConfigs.filter(chip => chip.amount <= balance);
  
  return (
    <div className={`${className} casino-felt rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-2xl`}>
      {/* Chip Selection */}
      <div className="mb-6">
        <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2 opacity-90">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
          Select Chip Value
        </h3>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center justify-center sm:justify-start">
          {availableChips.map(chip => (
            <button
              key={`chip-${chip.amount}`}
              onClick={() => handleBetChange(chip.amount)}
              disabled={isSpinning}
              className={`
                chip w-11 h-11 sm:w-14 sm:h-14 rounded-full font-bold transition-all duration-200
                bg-gradient-to-br ${chip.bg} ${chip.text}
                flex items-center justify-center text-xs sm:text-sm
                ${betAmount === chip.amount ? 'ring-2 sm:ring-3 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-[#155939] scale-110' : ''}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
              `}
            >
              {chip.label}
            </button>
          ))}
          
          {/* Max Bet Chip - shows actual value instead of ALL IN */}
          <button
            onClick={handleAllIn}
            disabled={isSpinning || actualMax <= 0}
            className={`
              chip w-11 h-11 sm:w-14 sm:h-14 rounded-full font-bold
              bg-gradient-to-br from-red-500 to-red-700 text-white
              flex items-center justify-center text-[9px] sm:text-[11px] leading-tight
              ${betAmount === actualMax ? 'ring-2 sm:ring-3 ring-white ring-offset-1 sm:ring-offset-2 ring-offset-[#155939] scale-110' : ''}
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
              transition-all duration-200
            `}
            title={`Max bet: ${actualMax.toLocaleString()}`}
          >
            {formatChipValue(actualMax)}
          </button>
        </div>
        
        {/* Selected amount and max bet display */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-white/60">Selected:</span>
            <span className="font-bold text-[#d4af37] text-lg">{betAmount.toLocaleString()}</span>
          </div>
          {maxBet && (
            <div className="flex items-center gap-1 text-white/50">
              <span>Max:</span>
              <span className="font-medium text-white/70">{maxBet.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Bet Types Grid */}
      <div className="space-y-4 mb-6">
        {/* Color Bets */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBetTypeSelect('black')}
            disabled={isSpinning || betAmount > balance}
            className={`
              relative overflow-hidden py-4 px-5 rounded-xl font-bold text-white
              bg-gradient-to-br from-gray-800 via-gray-900 to-black
              border border-[#d4af37]/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:border-[#d4af37]/60 hover:shadow-lg'}
            `}
          >
            <span className="relative z-10 flex flex-col items-center gap-1">
              <span className="text-lg">⚫ Black</span>
              <span className="text-xs text-gray-400">1.9x Payout</span>
            </span>
          </button>
          
          <button
            onClick={() => handleBetTypeSelect('white')}
            disabled={isSpinning || betAmount > balance}
            className={`
              relative overflow-hidden py-4 px-5 rounded-xl font-bold text-gray-900
              bg-gradient-to-br from-white via-gray-100 to-gray-200
              border border-[#d4af37]/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:border-[#d4af37]/60 hover:shadow-lg'}
            `}
          >
            <span className="relative z-10 flex flex-col items-center gap-1">
              <span className="text-lg">⚪ White</span>
              <span className="text-xs text-gray-500">1.9x Payout</span>
            </span>
          </button>
        </div>
        
        {/* Even/Odd Bets */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleBetTypeSelect('even')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-5 rounded-xl font-bold text-gray-900
              bg-gradient-to-br from-white via-gray-100 to-gray-200
              border border-[#d4af37]/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:border-[#d4af37]/60 hover:shadow-lg'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-lg">Even</span>
              <span className="text-xs text-gray-500">1.8x Payout</span>
            </span>
          </button>
          
          <button
            onClick={() => handleBetTypeSelect('odd')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-5 rounded-xl font-bold text-white
              bg-gradient-to-br from-gray-800 via-gray-900 to-black
              border border-[#d4af37]/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:border-[#d4af37]/60 hover:shadow-lg'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span className="text-lg">Odd</span>
              <span className="text-xs text-gray-400">1.8x Payout</span>
            </span>
          </button>
        </div>
        
        {/* Special Bets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <button
            onClick={() => handleBetTypeSelect('green')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-3 rounded-xl font-bold text-white
              bg-gradient-to-br from-emerald-400 to-emerald-600
              border border-emerald-300/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/20'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span>🟢 Green</span>
              <span className="text-xs opacity-80">4.9x</span>
            </span>
          </button>
          
          <button
            onClick={() => handleBetTypeSelect('pink')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-3 rounded-xl font-bold text-white
              bg-gradient-to-br from-pink-400 to-pink-600
              border border-pink-300/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span>🩷 Pink</span>
              <span className="text-xs opacity-80">4.9x</span>
            </span>
          </button>
          
          <button
            onClick={() => handleBetTypeSelect('gold')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-3 rounded-xl font-bold text-black
              bg-gradient-to-br from-[#f4d03f] via-[#d4af37] to-[#b8860b]
              border border-[#f4d03f]/50
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-yellow-500/30'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span>🌟 Gold</span>
              <span className="text-xs opacity-70">50-200x</span>
            </span>
          </button>
          
          <button
            onClick={() => handleBetTypeSelect('x')}
            disabled={isSpinning || betAmount > balance}
            className={`
              py-4 px-3 rounded-xl font-bold text-white
              bg-gradient-to-br from-violet-500 to-purple-800
              border border-violet-400/30
              transition-all duration-200
              ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-violet-500/20'}
            `}
          >
            <span className="flex flex-col items-center gap-1">
              <span>✖ X</span>
              <span className="text-xs opacity-80">1.0x</span>
            </span>
          </button>
        </div>
      </div>
      
      {/* Numbers Grid */}
      <div className="mt-6">
        <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider flex items-center gap-2 opacity-90">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8860b]"></span>
          Bet on Number
          <span className="ml-auto text-xs font-normal text-[#d4af37]">24x Payout</span>
        </h3>
        
        <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1 sm:gap-1.5">
          {WHEEL_NUMBERS.map((position, index) => {
            if (position.number === 'X') {
              return (
                <button
                  key="x-number-btn"
                  onClick={() => handleBetTypeSelect('x')}
                  disabled={isSpinning || betAmount > balance}
                  className={`
                    number-btn aspect-square rounded-md sm:rounded-lg font-bold
                    bg-gradient-to-br from-violet-500 to-purple-800 text-white 
                    flex items-center justify-center text-xs sm:text-sm
                    border border-violet-400/40
                    ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 sm:hover:scale-110 hover:shadow-lg hover:z-10'}
                    transition-all duration-200
                  `}
                >
                  X
                </button>
              );
            }
            
            const number = position.number as number;
            const color = position.color;
            const isBlack = color === 'black';
            
            return (
              <button
                key={`number-${number}`}
                onClick={() => handleNumberSelect(number)}
                disabled={isSpinning || betAmount > balance}
                className={`
                  number-btn aspect-square rounded-md sm:rounded-lg font-bold flex items-center justify-center text-xs sm:text-sm
                  ${isBlack 
                    ? 'bg-gradient-to-br from-gray-700 to-black text-white' 
                    : 'bg-gradient-to-br from-white to-gray-200 text-gray-900'}
                  ${selectedNumber === number ? 'ring-2 ring-[#d4af37] ring-offset-1 ring-offset-[#155939]' : ''}
                  ${isSpinning || betAmount > balance ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 sm:hover:scale-110 hover:shadow-lg hover:z-10'}
                  border border-[#d4af37]/30 transition-all duration-200
                `}
              >
                {number}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default memo(BettingTable);