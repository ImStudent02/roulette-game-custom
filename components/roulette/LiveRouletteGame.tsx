'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Bet, GameState, WheelPosition, BetHistoryItem } from '@/lib/types';
import { isBetWinner, multipliers, generateBetId } from '@/lib/gameUtils';
import RouletteWheel from './RouletteWheel';
import BettingTable from './BettingTable';
import ActiveBets from './ActiveBets';
import BetHistory from './BetHistory';
import GameTimer from './GameTimer';
import LiveChat from './LiveChat';
import AuthModal from '../ui/AuthModal';

type GamePhase = 'betting' | 'warning' | 'locked' | 'spinning' | 'result';

// Timer configuration (in seconds) - matches server
const TIMER_CONFIG = {
  bettingDuration: 210,
  warningStart: 180,
  lockedDuration: 20,
  spinDuration: 10,
  resultDuration: 60,
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

const LiveRouletteGame = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  
  // Server sync state
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [displayTime, setDisplayTime] = useState(210);
  const [roundNumber, setRoundNumber] = useState(1);
  const [lastWinningPosition, setLastWinningPosition] = useState<WheelPosition | null>(null);
  const [serverWinningPosition, setServerWinningPosition] = useState<WheelPosition | null>(null);
  const [winningIndex, setWinningIndex] = useState(-1);
  const [shouldRegenerateGold, setShouldRegenerateGold] = useState(false);
  
  // Track if we've already triggered spin for current round
  const hasTriggeredSpinRef = useRef(false);
  const lastRoundRef = useRef(0);
  
  // Tab state for betting/chat toggle
  const [activeTab, setActiveTab] = useState<'betting' | 'chat'>('betting');
  
  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('liveRouletteUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        // Invalid stored data
      }
    }
    
    // Load saved game state
    const savedState = localStorage.getItem('liveRouletteState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setGameState(prev => ({
          ...prev,
          balance: parsed.balance || prev.balance,
          betHistory: parsed.betHistory || prev.betHistory,
        }));
      } catch {
        // Invalid stored data
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Save game state
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('liveRouletteState', JSON.stringify({
        balance: gameState.balance,
        betHistory: gameState.betHistory,
      }));
    }
  }, [gameState.balance, gameState.betHistory, isLoading]);
  
  // Poll server for game state
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    
    const fetchGameState = async () => {
      try {
        const res = await fetch('/api/live-game', { cache: 'no-store' });
        if (!res.ok) return;
        
        const data = await res.json();
        
        setPhase(data.phase);
        setDisplayTime(data.displayTime);
        setRoundNumber(data.roundNumber);
        setWinningIndex(data.winningIndex);
        
        // Handle last winning position
        if (data.lastWinningPosition) {
          setLastWinningPosition(data.lastWinningPosition);
        }
        
        // Handle current winning position from server
        if (data.currentWinningPosition) {
          setServerWinningPosition(data.currentWinningPosition);
        }
        
        // Handle gold regeneration
        if (data.shouldRegenerateGold) {
          setShouldRegenerateGold(true);
          // Reset after a short delay
          setTimeout(() => setShouldRegenerateGold(false), 500);
        }
        
        // Handle spin trigger - only once per round
        if (data.phase === 'spinning' && data.roundNumber > lastRoundRef.current) {
          if (!hasTriggeredSpinRef.current && !gameState.isSpinning) {
            hasTriggeredSpinRef.current = true;
            setGameState(prev => ({ ...prev, isSpinning: true }));
          }
        }
        
        // Reset spin trigger on new round
        if (data.roundNumber > lastRoundRef.current) {
          lastRoundRef.current = data.roundNumber;
          if (data.phase === 'betting') {
            hasTriggeredSpinRef.current = false;
          }
        }
        
      } catch (err) {
        console.error('Failed to fetch game state:', err);
      }
    };
    
    // Initial fetch
    fetchGameState();
    
    // Poll every second
    const interval = setInterval(fetchGameState, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, gameState.isSpinning]);
  
  // Handle authentication
  const handleAuth = useCallback((userData: { email: string; name: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  }, []);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('liveRouletteUser');
    setUser(null);
    setIsAuthenticated(false);
  }, []);
  
  // Betting is only allowed during betting and warning phases
  const canBet = phase === 'betting' || phase === 'warning';
  
  // Add bet
  const addBet = useCallback((bet: Bet) => {
    if (!canBet) return;
    
    setGameState(prev => {
      if (bet.amount > prev.balance) return prev;
      
      return {
        ...prev,
        balance: prev.balance - bet.amount,
        currentBets: [...prev.currentBets, bet],
      };
    });
  }, [canBet]);
  
  // Remove bet
  const removeBet = useCallback((id: string) => {
    if (!canBet) return;
    
    setGameState(prev => {
      const betToRemove = prev.currentBets.find(bet => bet.id === id);
      if (!betToRemove) return prev;
      
      return {
        ...prev,
        balance: prev.balance + betToRemove.amount,
        currentBets: prev.currentBets.filter(bet => bet.id !== id),
      };
    });
  }, [canBet]);
  
  // Handle spin complete - use server's winning position
  const handleSpinComplete = useCallback((position: WheelPosition, secondPosition?: WheelPosition) => {
    // Use the server's winning position for consistency
    const winPosition = serverWinningPosition || position;
    
    setGameState(prev => {
      let totalWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      
      prev.currentBets.forEach(bet => {
        let betWon = false;
        let winAmount = 0;
        
        if (isBetWinner(bet, winPosition)) {
          let multiplier: number;
          if (typeof multipliers[bet.type] === 'function') {
            multiplier = (multipliers[bet.type] as (pos: WheelPosition) => number)(winPosition);
          } else {
            multiplier = multipliers[bet.type] as number;
          }
          winAmount += bet.amount * multiplier;
          totalWinnings += winAmount;
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
          position: winPosition,
        });
      });
      
      const updatedBetHistory = [...newBetHistory, ...prev.betHistory].slice(0, 20);
      
      return {
        ...prev,
        balance: prev.balance + totalWinnings,
        currentBets: [],
        winningPosition: winPosition,
        isSpinning: false,
        lastWinnings: totalWinnings,
        betHistory: updatedBetHistory,
      };
    });
  }, [serverWinningPosition]);
  
  // Total bet amount
  const totalBetAmount = useMemo(() => {
    return gameState.currentBets.reduce((sum, bet) => sum + bet.amount, 0);
  }, [gameState.currentBets]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-bold title-gradient">Loading LIVE Wheel...</p>
        </div>
      </div>
    );
  }
  
  // Auth required screen
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-5xl font-bold title-gradient mb-4">LIVE Wheel</h1>
            <p className="text-gray-400 mb-8">
              Join thousands of players in real-time roulette. Login to start playing!
            </p>
            
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#f4d03f] via-[#d4af37] to-[#b8860b] text-black font-bold text-xl rounded-xl hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all"
            >
              Login to Play
            </button>
            
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="glass-card p-4">
                <div className="text-2xl mb-2">🎰</div>
                <div className="text-sm text-gray-400">Auto Spin</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm text-gray-400">Live Chat</div>
              </div>
              <div className="glass-card p-4">
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-sm text-gray-400">Big Wins</div>
              </div>
            </div>
          </div>
        </div>
        
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuth={handleAuth}
        />
      </>
    );
  }
  
  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08080c]/80 border-b border-[rgba(212,175,55,0.15)]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-2xl font-bold title-gradient">LIVE WHEEL</h1>
              <span className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 animate-pulse"></span>
                Round #{roundNumber}
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Balance */}
              <div className="glass-card px-2 py-1 sm:px-4 sm:py-2 flex items-center gap-1 sm:gap-2">
                <span className="text-gray-400 text-[10px] sm:text-sm">Bal:</span>
                <span className="font-bold text-[#d4af37] text-sm sm:text-base">{gameState.balance.toLocaleString()}</span>
              </div>
              
              {/* User */}
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-sm text-gray-400 hidden sm:inline">👤 {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-[10px] sm:text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Wheel Section */}
        <section className="mb-4 sm:mb-6">
          <div className="flex justify-center relative">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete}
              isSpinning={gameState.isSpinning}
              winningPosition={phase === 'result' ? (serverWinningPosition || gameState.winningPosition) : undefined}
              forceWinningIndex={gameState.isSpinning ? winningIndex : undefined}
              shouldRegenerateColors={shouldRegenerateGold}
            />
            
            {/* Last Winner Badge */}
            {lastWinningPosition && (phase === 'betting' || phase === 'warning' || phase === 'locked') && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 sm:top-2 sm:left-auto sm:right-2 sm:translate-x-0 z-30">
                <div className="glass-card px-3 py-2 sm:px-4 sm:py-2 flex items-center gap-2 bg-[#08080c]/90">
                  <span className="text-[10px] sm:text-xs text-gray-400">Last Winner:</span>
                  <div className={`
                    w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm
                    ${lastWinningPosition.color === 'black' 
                      ? 'bg-black text-white border border-white/30' 
                      : 'bg-white text-black'}
                    shadow-lg
                  `}>
                    {lastWinningPosition.number}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        
        {/* Timer Section */}
        <section className="mb-4 sm:mb-6 max-w-md mx-auto">
          <GameTimer 
            timeRemaining={displayTime}
            phase={phase}
            totalTime={phase === 'betting' || phase === 'warning' 
              ? TIMER_CONFIG.bettingDuration 
              : phase === 'locked' 
                ? TIMER_CONFIG.lockedDuration 
                : phase === 'spinning'
                  ? TIMER_CONFIG.spinDuration
                  : TIMER_CONFIG.resultDuration
            }
          />
          
          {/* Winnings display */}
          {phase === 'result' && gameState.lastWinnings > 0 && (
            <div className="mt-3 sm:mt-4 glass-card p-3 sm:p-4 bg-green-500/10 border border-green-500/30 text-center">
              <div className="text-xs sm:text-sm text-green-400 mb-1">You Won!</div>
              <div className="text-xl sm:text-3xl font-bold text-green-400">
                +{gameState.lastWinnings.toLocaleString()}
              </div>
            </div>
          )}
        </section>
        
        {/* Betting/Chat Toggle Tabs */}
        <section className="mb-4 sm:mb-6">
          <div className="flex justify-center gap-2 mb-3 sm:mb-4">
            <button
              onClick={() => setActiveTab('betting')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all ${
                activeTab === 'betting'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              🎲 Betting
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              💬 Chat
            </button>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'betting' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              {/* Betting Table */}
              <div className="lg:col-span-8 order-2 lg:order-1">
                {/* Betting status banner */}
                {!canBet && phase !== 'result' && (
                  <div className="glass-card p-3 sm:p-4 bg-red-500/10 border border-red-500/30 text-center mb-3 sm:mb-4">
                    <span className="text-red-400 font-bold text-sm sm:text-base">
                      🔒 Betting is LOCKED - Wait for next round
                    </span>
                  </div>
                )}
                
                <BettingTable 
                  onPlaceBet={addBet}
                  balance={gameState.balance}
                  isSpinning={!canBet}
                />
              </div>
              
              {/* Active Bets & History */}
              <div className="lg:col-span-4 space-y-3 sm:space-y-4 order-1 lg:order-2">
                <ActiveBets 
                  bets={gameState.currentBets}
                  removeBet={canBet ? removeBet : undefined}
                  isSpinning={!canBet}
                />
                
                {totalBetAmount > 0 && (
                  <div className="glass-card p-3 sm:p-4 text-center">
                    <span className="text-gray-400 text-sm">Total Bet: </span>
                    <span className="font-bold text-[#d4af37] text-lg sm:text-xl">
                      {totalBetAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <BetHistory history={gameState.betHistory} />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <LiveChat currentUser={user?.name} className="h-[400px] sm:h-[500px]" />
            </div>
          )}
        </section>
      </main>
      
      {/* Navigation link back to self-betting */}
      <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4">
        <a 
          href="/"
          className="glass-card px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 sm:gap-2"
        >
          ← Self Mode
        </a>
      </div>
    </div>
  );
};

export default LiveRouletteGame;
