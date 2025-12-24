'use client';

import { useState, memo, useCallback } from 'react';
import { Bet, BetType, CurrencyMode } from '@/lib/types';
import { generateBetId, multipliers } from '@/lib/gameUtils';

type BettingControlsProps = {
  addBet: (bet: Bet) => void;
  balance: number;
  isSpinning: boolean;
  currencyMode: CurrencyMode;
  className?: string;
};

const BettingControls = ({
  addBet,
  balance,
  isSpinning,
  currencyMode,
  className = '',
}: BettingControlsProps) => {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betType, setBetType] = useState<BetType>('black');
  const [targetNumber, setTargetNumber] = useState<number | null>(null);
  
  // Prevent excessive re-renders with useCallback
  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setBetAmount(Math.min(value, balance));
    }
  }, [balance]);
  
  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as BetType;
    setBetType(value);
    
    // Reset target number if not a number bet
    if (value !== 'number') {
      setTargetNumber(null);
    } else if (!targetNumber) {
      setTargetNumber(1);
    }
  }, [targetNumber]);
  
  const handleNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= 50) {
      setTargetNumber(value);
    }
  }, []);
  
  const handlePlaceBet = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance || isSpinning) return;
    
    const bet: Bet = {
      id: generateBetId(),
      type: betType,
      amount: betAmount,
      currencyMode, // Track which currency this bet uses
      ...(betType === 'number' && targetNumber ? { targetNumber } : {}),
    };
    
    addBet(bet);
  }, [addBet, betAmount, betType, balance, isSpinning, targetNumber, currencyMode]);
  
  // Show multiplier for current bet type
  const currentMultiplier = typeof multipliers[betType] === 'function' 
    ? 'Variable (50x-200x)' 
    : `${multipliers[betType]}x`;
  
  // Calculate preset bet amount buttons based on balance
  const presetAmounts = [10, 50, 100, 500, 1000].filter(amount => amount <= balance);
  if (presetAmounts.length === 0) {
    presetAmounts.push(Math.max(1, Math.floor(balance)));
  }
  
  return (
    <div className={`bg-gray-800 rounded-lg p-4 text-white ${className}`}>
      <h3 className="text-lg font-bold mb-3">Place Your Bet</h3>
      
      <div className="space-y-4">
        {/* Bet Type Selection */}
        <div>
          <label htmlFor="betType" className="block text-sm font-medium mb-1">
            Bet Type
          </label>
          <select
            id="betType"
            value={betType}
            onChange={handleTypeChange}
            disabled={isSpinning}
            className="w-full p-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="even">Even</option>
            <option value="odd">Odd</option>
            <option value="green">Green</option>
            <option value="pink">Pink</option>
            <option value="gold">Gold</option>
            <option value="x">X</option>
            <option value="number">Specific Number</option>
          </select>
        </div>
        
        {/* Target Number - Only shown for number bets */}
        {betType === 'number' && (
          <div>
            <label htmlFor="targetNumber" className="block text-sm font-medium mb-1">
              Target Number (1-50)
            </label>
            <input
              id="targetNumber"
              type="number"
              min={1}
              max={50}
              value={targetNumber || ''}
              onChange={handleNumberChange}
              disabled={isSpinning}
              className="w-full p-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        )}
        
        {/* Bet Amount */}
        <div>
          <label htmlFor="betAmount" className="block text-sm font-medium mb-1">
            Bet Amount (Balance: {balance})
          </label>
          <input
            id="betAmount"
            type="number"
            min={1}
            max={balance}
            value={betAmount}
            onChange={handleAmountChange}
            disabled={isSpinning}
            className="w-full p-2 bg-gray-700 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          
          {/* Preset amounts for quick selection */}
          <div className="flex flex-wrap gap-2 mt-2">
            {presetAmounts.map(amount => (
              <button
                key={amount}
                onClick={() => setBetAmount(amount)}
                disabled={isSpinning || amount > balance}
                className="px-2 py-1 text-xs bg-gray-600 rounded hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              >
                {amount}
              </button>
            ))}
            
            {/* Custom amount input */}
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="Custom"
                min={1}
                max={balance}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value > 0 && value <= balance) {
                    setBetAmount(value);
                  }
                }}
                disabled={isSpinning}
                className="w-20 px-2 py-1 text-xs bg-gray-700 rounded focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            
            {/* All-in button */}
            <button
              onClick={() => setBetAmount(balance)}
              disabled={isSpinning || balance <= 0}
              className="px-2 py-1 text-xs bg-red-600 rounded hover:bg-red-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              All-in
            </button>
            {/* Half amount input */}
            <input
              type="number"
              placeholder="Half"
              value={Math.floor(balance / 2)}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0 && value <= balance) {
                  setBetAmount(value);
                }
              }}
              disabled={isSpinning || balance <= 0}
              className="w-20 px-2 py-1 text-xs bg-gray-700 rounded focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
        
        {/* Multiplier information */}
        <div className="text-sm">
          <span className="text-gray-400">Potential Multiplier:</span> 
          <span className="ml-1 font-semibold">{currentMultiplier}</span>
        </div>
        
        {/* Place Bet Button */}
        <button
          onClick={handlePlaceBet}
          disabled={isSpinning || betAmount <= 0 || betAmount > balance || (betType === 'number' && !targetNumber)}
          className="w-full py-2 bg-green-600 rounded font-semibold hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Place Bet
        </button>
      </div>
    </div>
  );
};

export default memo(BettingControls); 