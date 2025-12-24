'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Bet, GameState, WheelPosition, BetHistoryItem } from '@/lib/types';
import { isBetWinner, multipliers, applyCheatCode, generateBetId } from '@/lib/gameUtils';
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
  const [cheatInput, setCheatInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showingResults, setShowingResults] = useState(false);
  const [lastResult, setLastResult] = useState<WheelPosition | null>(null);
  const [shouldRegenerateColors, setShouldRegenerateColors] = useState(false);
  
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
  
  const handleSpinComplete = useCallback((position: WheelPosition) => {
    setShowingResults(true);
    
    // After 5 seconds: move result to lastResult, clear center display, regenerate colors
    const resultTimeoutId = setTimeout(() => {
      setShowingResults(false);
      setLastResult(position); // Move current result to "last result"
      
      // Clear winning position to hide center display and allow idle spin
      setGameState(prev => ({
        ...prev,
        winningPosition: undefined,
      }));
      
      // Trigger color regeneration with animation
      setShouldRegenerateColors(true);
      // Reset the trigger after a short delay
      setTimeout(() => setShouldRegenerateColors(false), 100);
    }, 5000);

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
        } else if (position.number === 'X' && bet.type !== 'x') {
          // Special X rule: if result is X but bet was NOT for X, refund the bet (1x)
          winAmount = bet.amount; // Return the original bet
          totalWinnings += winAmount;
          betWon = true; // Treat as a "win" (refund)
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
          currencyMode: 'trial', // Default for local play mode
        });
      });
      
      // Add position to history (limited to 10 items for performance)
      const newWheelHistory = [position, ...prev.history];
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
              <a 
                href="/story"
                className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-[#b45309] to-[#92400e] text-white text-xs sm:text-sm font-bold rounded-full hover:shadow-lg hover:shadow-[#fbbf24]/30 transition-all flex items-center gap-1 sm:gap-2"
              >
                <span>🥭</span>
                <span className="hidden sm:inline">Story</span>
              </a>
              <a 
                href="/rules"
                className="px-2 py-1 sm:px-4 sm:py-2 bg-gradient-to-r from-[#4b5563] to-[#374151] text-white text-xs sm:text-sm font-bold rounded-full hover:shadow-lg hover:shadow-white/10 transition-all flex items-center gap-1 sm:gap-2"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Rules</span>
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
          <div className="flex flex-col items-center">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete} 
              isSpinning={gameState.isSpinning}
              winningPosition={gameState.winningPosition}
              shouldRegenerateColors={shouldRegenerateColors}
            />
            
            {/* Last Result Badge - Premium Style */}
            {lastResult && !showingResults && (
              <div 
                className="mt-6 animate-fade-in"
                style={{
                  background: 'linear-gradient(135deg, rgba(30,20,15,0.95) 0%, rgba(20,15,10,0.98) 100%)',
                  border: '2px solid rgba(212, 175, 55, 0.4)',
                  borderRadius: '16px',
                  padding: '12px 20px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                }}
              >
                <div className="flex items-center gap-4">
                  {/* Result Number Circle */}
                  <div 
                    className="relative"
                    style={{
                      width: '56px',
                      height: '56px',
                    }}
                  >
                    {/* Outer glow ring based on outer color */}
                    <div 
                      className="absolute inset-0 rounded-full animate-pulse"
                      style={{
                        background: (lastResult as any).outerColor === 'gold' 
                          ? 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)'
                          : (lastResult as any).outerColor === 'green'
                          ? 'radial-gradient(circle, rgba(34,197,94,0.4) 0%, transparent 70%)'
                          : (lastResult as any).outerColor === 'pink'
                          ? 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)'
                          : (lastResult as any).outerColor === 'red'
                          ? 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, transparent 70%)'
                          : 'none',
                        transform: 'scale(1.3)',
                      }}
                    />
                    {/* Number circle */}
                    <div 
                      className="absolute inset-0 rounded-full flex items-center justify-center font-bold text-lg"
                      style={{
                        background: lastResult.color === 'black' 
                          ? 'linear-gradient(145deg, #2a2a2a 0%, #0a0a0a 100%)' 
                          : 'linear-gradient(145deg, #f5f5f5 0%, #d0d0d0 100%)',
                        color: lastResult.color === 'black' ? '#fff' : '#000',
                        border: '3px solid rgba(212, 175, 55, 0.6)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                    >
                      {lastResult.number}
                    </div>
                  </div>
                  
                  {/* Result Info */}
                  <div className="flex flex-col gap-1">
                    <span 
                      className="text-[10px] uppercase tracking-wider"
                      style={{ color: 'rgba(212, 175, 55, 0.7)' }}
                    >
                      Last Winner
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Inner color badge */}
                      <span 
                        className="px-2 py-0.5 rounded text-xs font-semibold uppercase"
                        style={{
                          background: lastResult.color === 'black' 
                            ? 'rgba(0,0,0,0.8)' 
                            : 'rgba(255,255,255,0.9)',
                          color: lastResult.color === 'black' ? '#fff' : '#000',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {lastResult.color}
                      </span>
                      
                      {/* Outer color badge (if special) */}
                      {(lastResult as any).outerColor && (lastResult as any).outerColor !== 'none' && (
                        <span 
                          className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide"
                          style={{
                            background: (lastResult as any).outerColor === 'gold' 
                              ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                              : (lastResult as any).outerColor === 'green'
                              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                              : (lastResult as any).outerColor === 'pink'
                              ? 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
                              : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            color: (lastResult as any).outerColor === 'gold' ? '#000' : '#fff',
                            boxShadow: (lastResult as any).outerColor === 'gold' 
                              ? '0 0 12px rgba(251,191,36,0.5)'
                              : (lastResult as any).outerColor === 'green'
                              ? '0 0 12px rgba(34,197,94,0.5)'
                              : (lastResult as any).outerColor === 'pink'
                              ? '0 0 12px rgba(236,72,153,0.5)'
                              : '0 0 12px rgba(239,68,68,0.5)',
                          }}
                        >
                          ✨ {(lastResult as any).outerColor}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              currencyMode="trial"
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