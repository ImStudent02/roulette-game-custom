'use client';

import { memo, useState } from 'react';
import { Bet, BetType } from '@/lib/types';
import { generateBetId } from '@/lib/gameUtils';
import { WHEEL_NUMBERS } from './RouletteWheel'; // Import wheel numbers for color consistency

type BettingTableProps = {
  onPlaceBet: (bet: Bet) => void;
  balance: number;
  isSpinning: boolean;
  className?: string;
};

const BettingTable = ({
  onPlaceBet,
  balance,
  isSpinning,
  className = '',
}: BettingTableProps) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  // Find a number's color from the WHEEL_NUMBERS array
  const getNumberColor = (num: number | string): 'black' | 'white' => {
    const position = WHEEL_NUMBERS.find(pos => pos.number === num);
    return position?.color === 'black' ? 'black' : 'white';
  };

  const handlePlaceBet = (type: BetType, targetNumber?: number) => {
    if (betAmount <= 0 || betAmount > balance || isSpinning) return;
    
    const bet: Bet = {
      id: generateBetId(),
      type,
      amount: betAmount,
      ...(type === 'number' && targetNumber ? { targetNumber } : {}),
    };
    
    onPlaceBet(bet);
  };

  // Handle number selection
  const handleNumberSelect = (number: number) => {
    setSelectedNumber(number);
    handlePlaceBet('number', number);
  };
  
  // Handle bet type selection
  const handleBetTypeSelect = (type: BetType) => {
    handlePlaceBet(type);
  };
  
  // Handle bet amount change
  const handleBetChange = (amount: number) => {
    setBetAmount(amount);
  };
  
  // All-in feature
  const handleAllIn = () => {
    setBetAmount(balance);
  };

  // Bet amount buttons
  const presetAmounts = [10, 50, 100, 500, 1000].filter(amount => amount <= balance);
  
  return (
    <div className={`${className} bg-pink-300 rounded-lg p-4 shadow-lg`}>
      <div className="mb-4">
        <h3 className="text-black text-lg font-bold mb-2">Bet Amount</h3>
        
        <div className="flex flex-wrap gap-2 mb-2">
          {presetAmounts.map(amount => (
            <button
              key={`amount-${amount}`}
              onClick={() => handleBetChange(amount)}
              disabled={isSpinning}
              className={`
                px-4 py-2 rounded-full font-bold 
                ${betAmount === amount ? 'ring-2 ring-yellow-400' : ''}
                ${amount === 10 ? 'bg-yellow-400 text-black' : 
                  amount === 50 ? 'bg-gray-600 text-white' : 
                  amount === 100 ? 'bg-blue-500 text-white' : 
                  amount === 500 ? 'bg-green-700 text-white' : 
                  'bg-purple-800 text-white'}
                ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {amount}
            </button>
          ))}
          
          <button
            onClick={handleAllIn}
            disabled={isSpinning || balance <= 0}
            className={`
              px-4 py-2 rounded-full font-bold bg-red-600 text-white
              ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            All-in
          </button>
        </div>
        
        <div className="text-black text-sm">
          Current bet: <span className="font-bold text-purple-800">{betAmount}</span>
        </div>
      </div>
      
      {/* Color bets */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleBetTypeSelect('black')}
          disabled={isSpinning || betAmount > balance}
          className="bg-black text-white py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Black (1.9x)
        </button>
        
        <button
          onClick={() => handleBetTypeSelect('white')}
          disabled={isSpinning || betAmount > balance}
          className="bg-white text-black py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
        >
          White (1.9x)
        </button>
      </div>
      
      {/* Even/Odd bets */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleBetTypeSelect('even')}
          disabled={isSpinning || betAmount > balance}
          className="bg-white text-black py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300"
        >
          Even (1.8x)
        </button>
        
        <button
          onClick={() => handleBetTypeSelect('odd')}
          disabled={isSpinning || betAmount > balance}
          className="bg-black text-white py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Odd (1.8x)
        </button>
      </div>
      
      {/* Special bets */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleBetTypeSelect('green')}
          disabled={isSpinning || betAmount > balance}
          className="bg-green-500 text-white py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Green (6.5x)
        </button>
        
        <button
          onClick={() => handleBetTypeSelect('pink')}
          disabled={isSpinning || betAmount > balance}
          className="bg-pink-500 text-white py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Pink (6.5x)
        </button>
        
        <button
          onClick={() => handleBetTypeSelect('gold')}
          disabled={isSpinning || betAmount > balance}
          className="bg-yellow-500 text-black py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gold (50-200x)
        </button>
        
        <button
          onClick={() => handleBetTypeSelect('x')}
          disabled={isSpinning || betAmount > balance}
          className="bg-black text-white py-2 px-4 rounded-md font-bold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          X (1.0x)
        </button>
      </div>
      
      {/* Numbers grid */}
      <div className="mt-4">
        <h3 className="text-black text-lg font-bold mb-2">Numbers (30x)</h3>
        <div className="grid grid-cols-10 gap-2 mb-2">
          {/* Create number buttons in the same order as they appear in WHEEL_NUMBERS */}
          {WHEEL_NUMBERS.map((position, index) => {
            // Skip the X position as it's handled separately
            if (position.number === 'X') {
              return (
                <button
                  key="x-button"
                  onClick={() => handleBetTypeSelect('x')}
                  disabled={isSpinning || betAmount > balance}
                  className={`
                    w-10 h-10 rounded-full font-bold bg-black text-white 
                    flex items-center justify-center border border-gray-700
                    ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
                  `}
                >
                  X
                </button>
              );
            }
            
            // Regular number buttons
            const number = position.number as number;
            const color = position.color;
            const bgColor = color === 'black' ? 'bg-black' : 'bg-white';
            const textColor = color === 'black' ? 'text-white' : 'text-black';
            
            return (
              <button
                key={`number-${number}`}
                onClick={() => handleNumberSelect(number)}
                disabled={isSpinning || betAmount > balance}
                className={`
                  w-10 h-10 rounded-full font-bold flex items-center justify-center
                  ${bgColor} ${textColor}
                  ${selectedNumber === number ? 'ring-2 ring-yellow-300' : ''}
                  ${isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
                  border border-gray-700
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