'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
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

// Timer configuration (in seconds)
// Proper 5-minute cycle as per requirements:
// - 3:30 (210 sec) betting
// - 20 sec suspense/locked
// - 10 sec spin
// - ~ 60 sec result (then restart)
const TIMER_CONFIG = {
  bettingDuration: 210,     // 3 minutes 30 seconds betting
  warningStart: 180,        // Warning starts at 3:00 (30 sec before lock)
  lockedDuration: 20,       // 20 seconds suspense (betting locked)
  spinDuration: 10,         // 10 seconds spin animation
  resultDuration: 60,       // 60 seconds result display
};

const TOTAL_ROUND_TIME = 
  TIMER_CONFIG.bettingDuration + 
  TIMER_CONFIG.lockedDuration + 
  TIMER_CONFIG.spinDuration + 
  TIMER_CONFIG.resultDuration;

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
  
  // Timer state
  const [phase, setPhase] = useState<GamePhase>('betting');
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_ROUND_TIME);
  const [roundNumber, setRoundNumber] = useState(1);
  
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
  
  // Timer logic - proper 5-minute cycle
  useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = prev - 1;
        
        if (newTime <= 0) {
          // Round complete, start new round
          setRoundNumber(r => r + 1);
          setPhase('betting');
          return TOTAL_ROUND_TIME;
        }
        
        // Determine phase based on time remaining
        const elapsed = TOTAL_ROUND_TIME - newTime;
        
        // Betting phase: 0 to 210 seconds (3:30)
        if (elapsed < TIMER_CONFIG.bettingDuration) {
          // Warning at last 30 seconds of betting
          if (elapsed >= TIMER_CONFIG.warningStart) {
            setPhase('warning');
          } else {
            setPhase('betting');
          }
        } 
        // Locked phase: 210 to 230 seconds (20 sec suspense)
        else if (elapsed < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) {
          setPhase('locked');
        } 
        // Spinning phase: 230 to 240 seconds (10 sec spin)
        else if (elapsed < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration) {
          if (phase !== 'spinning' && !gameState.isSpinning) {
            setPhase('spinning');
            // Trigger spin
            setGameState(prev => ({ ...prev, isSpinning: true }));
          }
        } 
        // Result phase: 240 to 300 seconds (60 sec result)
        else {
          setPhase('result');
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, isLoading, phase, gameState.isSpinning]);
  
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
  
  // Get display time for countdown
  const getDisplayTime = () => {
    const elapsed = TOTAL_ROUND_TIME - timeRemaining;
    
    if (elapsed < TIMER_CONFIG.bettingDuration) {
      // Time until betting ends
      return TIMER_CONFIG.bettingDuration - elapsed;
    } else if (elapsed < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) {
      // Time until spin
      return TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration - elapsed;
    } else if (elapsed < TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration) {
      // Spinning time
      return TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration + TIMER_CONFIG.spinDuration - elapsed;
    } else {
      // Time until next round
      return timeRemaining;
    }
  };
  
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
  
  // Handle spin complete
  const handleSpinComplete = useCallback((position: WheelPosition, secondPosition?: WheelPosition) => {
    setGameState(prev => {
      let totalWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      
      prev.currentBets.forEach(bet => {
        let betWon = false;
        let winAmount = 0;
        
        if (isBetWinner(bet, position)) {
          let multiplier: number;
          if (typeof multipliers[bet.type] === 'function') {
            multiplier = (multipliers[bet.type] as (pos: WheelPosition) => number)(position);
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
            multiplier = (multipliers[bet.type] as (pos: WheelPosition) => number)(secondPosition);
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
      
      const updatedBetHistory = [...newBetHistory, ...prev.betHistory].slice(0, 20);
      
      return {
        ...prev,
        balance: prev.balance + totalWinnings,
        currentBets: [],
        winningPosition: position,
        secondWinningPosition: secondPosition,
        isSpinning: false,
        lastWinnings: totalWinnings,
        betHistory: updatedBetHistory,
      };
    });
  }, []);
  
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
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold title-gradient">LIVE WHEEL</h1>
              <span className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Round #{roundNumber}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Balance */}
              <div className="glass-card px-4 py-2 flex items-center gap-2">
                <span className="text-gray-400 text-sm">Balance:</span>
                <span className="font-bold text-[#d4af37]">{gameState.balance.toLocaleString()}</span>
              </div>
              
              {/* User */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">👤 {user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content - New Layout: Wheel on top, then timer, then betting/chat toggle */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Wheel Section - Full Width on Top */}
        <section className="mb-6">
          <div className="flex justify-center">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete}
              isSpinning={gameState.isSpinning}
              winningPosition={gameState.winningPosition}
              spinTwice={false}
            />
          </div>
        </section>
        
        {/* Timer Section */}
        <section className="mb-6 max-w-md mx-auto">
          <GameTimer 
            timeRemaining={getDisplayTime()}
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
            <div className="mt-4 glass-card p-4 bg-green-500/10 border border-green-500/30 text-center">
              <div className="text-sm text-green-400 mb-1">You Won!</div>
              <div className="text-3xl font-bold text-green-400">
                +{gameState.lastWinnings.toLocaleString()}
              </div>
            </div>
          )}
        </section>
        
        {/* Betting/Chat Toggle Tabs */}
        <section className="mb-6">
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setActiveTab('betting')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'betting'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              🎲 Betting
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Betting Table */}
              <div className="lg:col-span-8">
                {/* Betting status banner */}
                {!canBet && phase !== 'result' && (
                  <div className="glass-card p-4 bg-red-500/10 border border-red-500/30 text-center mb-4">
                    <span className="text-red-400 font-bold">
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
              <div className="lg:col-span-4 space-y-4">
                <ActiveBets 
                  bets={gameState.currentBets}
                  removeBet={canBet ? removeBet : undefined}
                  isSpinning={!canBet}
                />
                
                {totalBetAmount > 0 && (
                  <div className="glass-card p-4 text-center">
                    <span className="text-gray-400">Total Bet: </span>
                    <span className="font-bold text-[#d4af37] text-xl">
                      {totalBetAmount.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <BetHistory history={gameState.betHistory} />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <LiveChat currentUser={user?.name} className="h-[500px]" />
            </div>
          )}
        </section>
      </main>
      
      {/* Navigation link back to self-betting */}
      <div className="fixed bottom-4 left-4">
        <a 
          href="/"
          className="glass-card px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Self Betting Mode
        </a>
      </div>
    </div>
  );
};

export default LiveRouletteGame;
