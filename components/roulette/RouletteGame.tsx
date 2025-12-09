'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Bet, GameState, WheelPosition, BetHistoryItem } from '@/lib/types';
import { isBetWinner, multipliers, applyCheatCode, shouldSpinTwice, generateBetId } from '@/lib/gameUtils';
import RouletteWheel from './RouletteWheel';
import BettingTable from './BettingTable';
import ActiveBets from './ActiveBets';
import BetHistory from './BetHistory';

// Premium loading spinner component
const LoadingSpinner = ({ 
  size = 'md' as const, 
  className = '' 
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };
  
  return (
    <div className={`inline-block ${className}`} aria-label="Loading">
      <div className={`${sizeClasses[size]} spinner`} />
    </div>
  );
};

// Initial game state
const initialState: GameState = {
  balance: 1000,
  currentBets: [],
  isSpinning: false,
  lastWinnings: 0,
  history: [],
  betHistory: [],
};

const RouletteGame = () => {
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
  
  const addBet = useCallback((bet: Bet) => {
    setGameState(prev => {
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
    setShowingResults(true);
    
    const resultTimeoutId = setTimeout(() => {
      setShowingResults(false);
    }, 3000);

    setGameState(prev => {
      let totalWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      
      prev.currentBets.forEach(bet => {
        let betWon = false;
        let winAmount = 0;
        
        if (isBetWinner(bet, position)) {
          let multiplier: number;
          
          if (typeof multipliers[bet.type] === 'function') {
            multiplier = (multipliers[bet.type] as any)(position);
          } else {
            multiplier = multipliers[bet.type] as number;
          }
          
          winAmount += bet.amount * multiplier;
          totalWinnings += winAmount;
          betWon = true;
        }
        
        if (secondPosition && isBetWinner(bet, secondPosition)) {
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
        currentBets: [],
        winningPosition: position,
        secondWinningPosition: secondPosition,
        isSpinning: false,
        lastWinnings: totalWinnings,
        history: newWheelHistory,
        betHistory: updatedBetHistory,
      };
    });
    
    return () => clearTimeout(resultTimeoutId);
  }, []);
  
  const startSpin = useCallback(() => {
    if (gameState.currentBets.length === 0 || gameState.isSpinning || showingResults) return;
    
    setGameState(prev => ({
      ...prev,
      isSpinning: true,
      winningPosition: undefined,
      secondWinningPosition: undefined,
      lastWinnings: 0,
    }));
  }, [gameState.currentBets.length, gameState.isSpinning, showingResults]);
  
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
  
  // Auto-save game state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('rouletteGameState', JSON.stringify({
        balance: gameState.balance,
        history: gameState.history,
        betHistory: gameState.betHistory,
      }));
    } catch {
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
    } catch {
      // Ignore storage errors
    }
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold title-gradient">Loading Casino...</h2>
          <p className="text-gray-500 mt-2">Preparing your premium experience</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08080c]/80 border-b border-[rgba(212,175,55,0.15)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold title-gradient tracking-tight">
                ROULETTE
              </h1>
              <a 
                href="/live"
                className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-bold rounded-full hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-1 sm:gap-2"
              >
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-pulse"></span>
                <span className="hidden xs:inline">LIVE</span>
                <span className="xs:hidden">🔴</span>
              </a>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Balance Display */}
              <div className="glass-card px-3 py-2 sm:px-5 sm:py-3 flex items-center gap-2 sm:gap-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#f4d03f] to-[#b8860b] flex items-center justify-center">
                  <span className="text-black font-bold text-xs sm:text-sm">$</span>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Balance</p>
                  <p className="font-bold text-sm sm:text-xl text-[#d4af37]">{gameState.balance.toLocaleString()}</p>
                </div>
              </div>
              
              {/* Winnings Display */}
              {showingResults && gameState.lastWinnings > 0 && (
                <div className="glass-card px-3 py-2 sm:px-5 sm:py-3 winning-glow">
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Won!</p>
                  <p className="font-bold text-sm sm:text-xl text-[#4ade80]">+{gameState.lastWinnings.toLocaleString()}</p>
                </div>
              )}
              
              {/* Cheat Input */}
              <div className="relative hidden md:block">
                <input
                  type="text"
                  value={cheatInput}
                  onChange={(e) => setCheatInput(e.target.value)}
                  onKeyDown={handleCheatInput}
                  placeholder="Enter code..."
                  className="w-36 glass-card px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Wheel Section */}
        <section className="mb-6 sm:mb-10">
          <div className="flex justify-center">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete} 
              isSpinning={gameState.isSpinning}
              winningPosition={gameState.winningPosition}
              secondWinningPosition={gameState.secondWinningPosition}
              spinTwice={spinTwice}
            />
          </div>
        </section>
        
        {/* Game Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Betting Table - Takes most space */}
          <div className="lg:col-span-8 order-2 lg:order-1">
            <BettingTable 
              onPlaceBet={addBet} 
              balance={gameState.balance} 
              isSpinning={gameState.isSpinning}
            />
          </div>
          
          {/* Sidebar - Shows above betting table on mobile */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Active Bets */}
            <ActiveBets 
              bets={gameState.currentBets} 
              removeBet={removeBet}
              isSpinning={gameState.isSpinning}
            />
            
            {/* Spin Button */}
            <div className="flex justify-center">
              <button
                onClick={startSpin}
                disabled={gameState.isSpinning || gameState.currentBets.length === 0}
                className={`
                  w-full max-w-xs py-3 sm:py-5 rounded-xl sm:rounded-2xl text-base sm:text-xl font-bold uppercase tracking-wider
                  transition-all duration-300 
                  ${gameState.isSpinning || gameState.currentBets.length === 0 
                    ? 'bg-gradient-to-br from-gray-700 to-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-[#f4d03f] via-[#d4af37] to-[#b8860b] text-black hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] hover:scale-105 active:scale-100'}
                  shadow-xl
                `}
              >
                {gameState.isSpinning ? (
                  <span className="flex items-center justify-center gap-3">
                    <LoadingSpinner size="sm" />
                    Spinning...
                  </span>
                ) : (
                  <>
                    <span className="block">Spin</span>
                    {totalBetAmount > 0 && (
                      <span className="text-sm font-normal opacity-75 mt-1 block">
                        Total Bet: {totalBetAmount}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
            
            {/* Bet History */}
            <BetHistory 
              history={gameState.betHistory}
            />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-[rgba(212,175,55,0.1)] mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Play responsibly • For entertainment purposes only
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RouletteGame;