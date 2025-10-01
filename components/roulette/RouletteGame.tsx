'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Bet, GameState, WheelPosition, BetHistoryItem } from '@/lib/types';
import { isBetWinner, multipliers, applyCheatCode, shouldSpinTwice, generateBetId } from '@/lib/gameUtils';
import RouletteWheel from './RouletteWheel';
import BettingTable from './BettingTable';
import ActiveBets from './ActiveBets';
import BetHistory from './BetHistory';

// Simple loading spinner component
const LoadingSpinner = ({ 
  size = 'md' as const, 
  className = '' 
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  return (
    <div className={`inline-block ${className}`} aria-label="Loading">
      <div 
        className={`
          ${sizeClasses[size]} 
          text-white
          rounded-full 
          border-solid 
          border-t-transparent 
          animate-spin
        `}
      />
    </div>
  );
};

// Initial game state
const initialState: GameState = {
  balance: 1000, // Starting balance
  currentBets: [],
  isSpinning: false,
  lastWinnings: 0,
  history: [],
  betHistory: [],
};

const RouletteGame = () => {
  // State management with optimizations
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [spinTwice, setSpinTwice] = useState(false);
  const [cheatInput, setCheatInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showingResults, setShowingResults] = useState(false);
  
  // Check if any gold bet exceeds 1000 to trigger the double ball
  useEffect(() => {
    const goldBet = gameState.currentBets.find(bet => bet.type === 'gold');
    if (goldBet && shouldSpinTwice(goldBet.amount)) {
      setSpinTwice(true);
    } else {
      setSpinTwice(false);
    }
  }, [gameState.currentBets]);
  
  // Compute total bets amount (memoized)
  const totalBetAmount = useMemo(() => {
    return gameState.currentBets.reduce((sum, bet) => sum + bet.amount, 0);
  }, [gameState.currentBets]);
  
  // Safe state update using function to avoid stale closures
  const addBet = useCallback((bet: Bet) => {
    setGameState(prev => {
      // Check if we have balance
      if (bet.amount > prev.balance) return prev;
      
      return {
        ...prev,
        balance: prev.balance - bet.amount,
        currentBets: [...prev.currentBets, bet],
      };
    });
  }, []);
  
  const removeBet = useCallback((id: string) => {
    setGameState(prev => {
      const betToRemove = prev.currentBets.find(bet => bet.id === id);
      if (!betToRemove) return prev;
      
      return {
        ...prev,
        balance: prev.balance + betToRemove.amount,
        currentBets: prev.currentBets.filter(bet => bet.id !== id),
      };
    });
  }, []);
  
  const handleSpinComplete = useCallback((position: WheelPosition, secondPosition?: WheelPosition) => {
    // Clear any existing timeouts to prevent memory leaks
    setShowingResults(true);
    
    // Set a timeout to clear the results display after 3 seconds
    const resultTimeoutId = setTimeout(() => {
      setShowingResults(false);
    }, 3000);

    setGameState(prev => {
      // Calculate winnings based on bets
      let totalWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      
      // Process each bet to see if it's a winner
      prev.currentBets.forEach(bet => {
        let betWon = false;
        let winAmount = 0;
        
        // Check against main position
        if (isBetWinner(bet, position)) {
          // Get multiplier
          let multiplier: number;
          
          if (typeof multipliers[bet.type] === 'function') {
            // For Gold which has variable multiplier
            multiplier = (multipliers[bet.type] as any)(position);
          } else {
            multiplier = multipliers[bet.type] as number;
          }
          
          winAmount += bet.amount * multiplier;
          totalWinnings += winAmount;
          betWon = true;
        }
        
        // Check against second position if applicable
        if (secondPosition && isBetWinner(bet, secondPosition)) {
          // Get multiplier (same logic as above)
          let multiplier: number;
          
          if (typeof multipliers[bet.type] === 'function') {
            multiplier = (multipliers[bet.type] as any)(secondPosition);
          } else {
            multiplier = multipliers[bet.type] as number;
          }
          
          const secondWinAmount = bet.amount * multiplier;
          winAmount += secondWinAmount;
          totalWinnings += secondWinAmount;
          betWon = true;
        }
        
        // Add to bet history
        newBetHistory.push({
          id: generateBetId(),
          betType: bet.type,
          targetNumber: bet.targetNumber,
          amount: bet.amount,
          outcome: betWon ? 'win' : 'loss',
          winAmount: betWon ? winAmount : 0,
          timestamp: new Date(),
          position: position,
        });
      });
      
      // Add position to history (limited to 10 items for performance)
      const newWheelHistory = [position, ...(secondPosition ? [secondPosition] : []), ...prev.history];
      if (newWheelHistory.length > 10) {
        newWheelHistory.splice(10);
      }
      
      // Add to bet history (limited to 20 items)
      const updatedBetHistory = [...newBetHistory, ...prev.betHistory];
      if (updatedBetHistory.length > 20) {
        updatedBetHistory.splice(20);
      }
      
      return {
        ...prev,
        balance: prev.balance + totalWinnings,
        currentBets: [], // Clear bets
        winningPosition: position,
        secondWinningPosition: secondPosition,
        isSpinning: false, // Immediately set spinning to false
        lastWinnings: totalWinnings,
        history: newWheelHistory,
        betHistory: updatedBetHistory,
      };
    });
    
    // Cleanup function to clear timeout when component unmounts or callback changes
    return () => clearTimeout(resultTimeoutId);
  }, []);
  
  const startSpin = useCallback(() => {
    // Can't spin if no bets or already spinning or showing results
    if (gameState.currentBets.length === 0 || gameState.isSpinning || showingResults) return;
    
    // Reset previous results
    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      winningPosition: undefined,
      secondWinningPosition: undefined,
      lastWinnings: 0,
    }));
  }, [gameState.currentBets.length, gameState.isSpinning, showingResults]);
  
  // Handle cheat code input
  const handleCheatInput = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const bonus = applyCheatCode(cheatInput);
      if (bonus) {
        setGameState(prev => ({
          ...prev,
          balance: prev.balance + bonus,
        }));
        setCheatInput('');
      }
    }
  }, [cheatInput]);
  
  // Auto-save game state to localStorage for persistence
  useEffect(() => {
    try {
      localStorage.setItem('rouletteGameState', JSON.stringify({
        balance: gameState.balance,
        history: gameState.history,
        betHistory: gameState.betHistory,
      }));
    } catch (error) {
      // Ignore storage errors
    }
  }, [gameState.balance, gameState.history, gameState.betHistory]);
  
  // Load game state from localStorage on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem('rouletteGameState');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setGameState(prev => ({
          ...prev,
          balance: parsed.balance || prev.balance,
          history: parsed.history || prev.history,
          betHistory: parsed.betHistory || prev.betHistory,
        }));
      }
    } catch (error) {
      // Ignore storage errors
    }
    
    // Simulate loading time for initial rendering
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Show loading spinner during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121824] text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mb-4" />
          <p className="text-xl font-bold">Loading Roulette Game...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#121824] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold">Roulette</h1>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-[#192231] px-4 py-2 rounded-lg flex items-center">
                <span className="text-gray-400 mr-2">Balance:</span>
                <span className="font-bold text-green-400">{gameState.balance}</span>
              </div>
              
              {showingResults && gameState.lastWinnings > 0 && (
                <div className="bg-green-800 px-4 py-2 rounded-lg animate-pulse">
                  <span className="text-gray-200 mr-2">Won:</span>
                  <span className="font-bold">{gameState.lastWinnings}</span>
                </div>
              )}
              
              {/* Cheat code input */}
              <div className="relative">
                <input
                  type="text"
                  value={cheatInput}
                  onChange={(e) => setCheatInput(e.target.value)}
                  onKeyDown={handleCheatInput}
                  placeholder="Cheat code"
                  className="bg-[#192231] px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </header>
        
        <div className="mb-6">
          <RouletteWheel 
            onSpinComplete={handleSpinComplete} 
            isSpinning={gameState.isSpinning}
            winningPosition={gameState.winningPosition}
            secondWinningPosition={gameState.secondWinningPosition}
            spinTwice={spinTwice}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BettingTable 
              onPlaceBet={addBet} 
              balance={gameState.balance} 
              isSpinning={gameState.isSpinning}
            />
          </div>
          
          <div className="space-y-6">
            <ActiveBets 
              bets={gameState.currentBets} 
              removeBet={removeBet}
              isSpinning={gameState.isSpinning}
            />
            
            <div className="flex justify-center mb-4">
              <button
                onClick={startSpin}
                disabled={gameState.isSpinning || gameState.currentBets.length === 0}
                className={`
                  px-8 py-3 rounded-full text-lg font-bold
                  ${gameState.isSpinning || gameState.currentBets.length === 0 
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-500 text-white'}
                  transition-colors
                `}
              >
                {gameState.isSpinning ? (
                  <span className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Spinning...
                  </span>
                ) : 'Spin'}
              </button>
            </div>
            
            <BetHistory 
              history={gameState.betHistory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouletteGame; 