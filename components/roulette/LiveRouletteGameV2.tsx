'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Bet, BetHistoryItem, WheelPosition } from '@/lib/types';
import { generateBetId } from '@/lib/gameUtils';
import RouletteWheel from './RouletteWheel'; // Use original wheel with smooth animation
import BettingTable from './BettingTable';
import ActiveBets from './ActiveBets';
import BetHistory from './BetHistory';
import GameTimer from './GameTimer';
import LiveChat from './LiveChat';
import AuthModal from '../ui/AuthModal';
import { useWebSocket, GameState as ServerGameState } from '@/hooks/useWebSocket';

type GamePhase = 'betting' | 'warning' | 'locked' | 'spinning' | 'result';

// Timer configuration (in seconds) - matches server
const TIMER_CONFIG = {
  bettingDuration: 210,   // 3:30 betting
  lockedDuration: 15,     // 15s countdown suspense
  spinDuration: 15,       // 15s wheel spin
  resultDuration: 60,     // 60s result display
};

// WebSocket URL - connects to custom server on /ws path (avoids Next.js HMR conflict)
const WS_URL = typeof window !== 'undefined' 
  ? `ws://${window.location.hostname}:3001/ws`
  : 'ws://localhost:3001/ws';

const LiveRouletteGameV2 = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; displayName: string; token?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Local game state (bets, balance)
  const [balance, setBalance] = useState(1000);
  const [currentBets, setCurrentBets] = useState<Bet[]>([]);
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);
  
  // Previous round tracking for result calculation
  const [lastProcessedRound, setLastProcessedRound] = useState(0);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'betting' | 'chat'>('betting');
  
  // WebSocket connection
  const {
    isConnected,
    gameState,
    chatMessages,
    authenticate,
    placeBet,
    sendChatMessage,
    editChatMessage,
  } = useWebSocket(WS_URL);
  
  // Derived state from server
  const phase = gameState?.phase || 'betting';
  const displayTime = gameState?.displayTime || 0;
  const roundNumber = gameState?.roundNumber || 1;
  const serverGoldPosition = gameState?.goldPosition ?? -1;
  const serverGoldMultiplier = gameState?.goldMultiplier || 50;
  const serverOuterColors = gameState?.outerColors || []; // Server-synced colors!
  const winningIndex = gameState?.winningIndex ?? -1;
  const winningPosition = gameState?.winningPosition as WheelPosition | undefined;
  
  // Track if we need to trigger a spin
  const [isSpinning, setIsSpinning] = useState(false);
  const [shouldRegenerateGold, setShouldRegenerateGold] = useState(false);
  const lastRoundRef = useRef(0);
  const hasTriggeredSpinRef = useRef(false); // Track if spin was triggered this round
  
  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('liveRouletteUserV2');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch {
        // Invalid stored data
      }
    }
    
    // Load saved balance
    const savedBalance = localStorage.getItem('liveRouletteBalanceV2');
    if (savedBalance) {
      try {
        setBalance(parseInt(savedBalance, 10));
      } catch {
        // Invalid
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Authenticate with WebSocket when user logs in
  useEffect(() => {
    if (isAuthenticated && user && isConnected) {
      authenticate(user.username, user.displayName);
    }
  }, [isAuthenticated, user, isConnected, authenticate]);
  
  // Save balance
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('liveRouletteBalanceV2', balance.toString());
    }
  }, [balance, isLoading]);
  
  // Time-based animation control for precise sync
  // Use local interval to check time precisely (not dependent on server message timing)
  useEffect(() => {
    if (!gameState || !gameState.roundStartTime) return;
    
    const roundStartTime = gameState.roundStartTime;
    const spinStartTime = roundStartTime + (TIMER_CONFIG.bettingDuration + TIMER_CONFIG.lockedDuration) * 1000;
    const resultStartTime = spinStartTime + TIMER_CONFIG.spinDuration * 1000;
    
    // New round detection - regenerate colors
    if (roundNumber > lastRoundRef.current) {
      setShouldRegenerateGold(true);
      setTimeout(() => setShouldRegenerateGold(false), 100);
      lastRoundRef.current = roundNumber;
      hasTriggeredSpinRef.current = false; // Reset for new round
    }
    
    // Local interval for precise phase monitoring
    const checkPhase = () => {
      const now = Date.now();
      const shouldBeSpinning = now >= spinStartTime && now < resultStartTime;
      
      // Trigger spin exactly once when spin phase starts
      if (shouldBeSpinning && !hasTriggeredSpinRef.current) {
        setIsSpinning(true);
        hasTriggeredSpinRef.current = true;
      }
      
      // Stop spin exactly when result phase starts
      if (now >= resultStartTime && hasTriggeredSpinRef.current) {
        setIsSpinning(false);
      }
    };
    
    // Check immediately and then every 100ms
    checkPhase();
    const interval = setInterval(checkPhase, 100);
    
    return () => clearInterval(interval);
  }, [gameState?.roundStartTime, roundNumber]);
  
  // Calculate results when round ends
  useEffect(() => {
    if (phase === 'result' && roundNumber > lastProcessedRound && winningPosition && currentBets.length > 0) {
      // Process bets
      let totalWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      
      currentBets.forEach(bet => {
        // Simple win check - match color or number
        let betWon = false;
        let winAmount = 0;
        
        if (bet.type === 'black' && winningPosition.color === 'black') {
          betWon = true;
          winAmount = bet.amount * 1.9;
        } else if (bet.type === 'white' && winningPosition.color === 'white') {
          betWon = true;
          winAmount = bet.amount * 1.9;
        } else if (bet.type === 'number' && bet.targetNumber === winningPosition.number) {
          betWon = true;
          winAmount = bet.amount * 30;
        }
        // Add more bet type checks as needed
        
        if (betWon) {
          totalWinnings += winAmount;
        }
        
        newBetHistory.push({
          id: generateBetId(),
          betType: bet.type,
          targetNumber: bet.targetNumber,
          amount: bet.amount,
          outcome: betWon ? 'win' : 'loss',
          winAmount: betWon ? winAmount : 0,
          timestamp: new Date(),
          position: winningPosition,
        });
      });
      
      setBalance(prev => prev + totalWinnings);
      setLastWinnings(totalWinnings);
      setBetHistory(prev => [...newBetHistory, ...prev].slice(0, 20));
      setCurrentBets([]);
      setLastProcessedRound(roundNumber);
    }
  }, [phase, roundNumber, lastProcessedRound, winningPosition, currentBets]);
  
  // Handle spin complete
  const handleSpinComplete = useCallback((position: WheelPosition) => {
    console.log('Spin complete, winning:', position);
  }, []);
  
  // Clear winnings display on new round
  useEffect(() => {
    if (phase === 'betting' && lastWinnings > 0) {
      // Keep showing for a bit then clear
      const timeout = setTimeout(() => setLastWinnings(0), 5000);
      return () => clearTimeout(timeout);
    }
  }, [phase, lastWinnings]);
  
  // Betting is only allowed during betting and warning phases
  const canBet = phase === 'betting' || phase === 'warning';
  
  // Add bet
  const addBet = useCallback((bet: Bet) => {
    if (!canBet) return;
    if (bet.amount > balance) return;
    
    setBalance(prev => prev - bet.amount);
    setCurrentBets(prev => [...prev, bet]);
    
    // Also send to server for global tracking
    placeBet({ type: bet.type, amount: bet.amount, targetNumber: bet.targetNumber });
  }, [canBet, balance, placeBet]);
  
  // Remove bet
  const removeBet = useCallback((id: string) => {
    if (!canBet) return;
    
    setCurrentBets(prev => {
      const bet = prev.find(b => b.id === id);
      if (bet) {
        setBalance(b => b + bet.amount);
      }
      return prev.filter(b => b.id !== id);
    });
  }, [canBet]);
  
  // Handle authentication
  const handleAuth = useCallback((userData: { email: string; name: string }) => {
    const newUser = {
      username: `@${userData.name.toLowerCase().replace(/\s+/g, '_')}`,
      displayName: userData.name,
    };
    
    localStorage.setItem('liveRouletteUserV2', JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  }, []);
  
  const handleLogout = useCallback(() => {
    localStorage.removeItem('liveRouletteUserV2');
    setUser(null);
    setIsAuthenticated(false);
  }, []);
  
  // Total bet amount
  const totalBetAmount = useMemo(() => {
    return currentBets.reduce((sum, bet) => sum + bet.amount, 0);
  }, [currentBets]);
  
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
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                {isConnected ? `Round #${roundNumber}` : 'Connecting...'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Balance */}
              <div className="glass-card px-2 py-1 sm:px-4 sm:py-2 flex items-center gap-1 sm:gap-2">
                <span className="text-gray-400 text-[10px] sm:text-sm">Bal:</span>
                <span className="font-bold text-[#d4af37] text-sm sm:text-base">{balance.toLocaleString()}</span>
              </div>
              
              {/* User */}
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-[10px] sm:text-sm text-gray-400 hidden sm:inline">👤 {user?.displayName}</span>
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
        {/* Wheel Section - CLIENT-SIDE SMOOTH ANIMATION */}
        <section className="mb-4 sm:mb-6">
          <div className="flex justify-center relative">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete}
              isSpinning={isSpinning}
              winningPosition={phase === 'result' ? winningPosition : undefined}
              forceWinningIndex={isSpinning ? winningIndex : undefined}
              shouldRegenerateColors={shouldRegenerateGold}
              serverOuterColors={serverOuterColors.length === 51 ? serverOuterColors : undefined}
            />
            
            {/* Gold indicator - show that gold exists but NOT the multiplier (it's a surprise!) */}
            {serverGoldPosition >= 0 && (
              <div 
                className="absolute top-2 right-2 z-30 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg"
                style={{ boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)' }}
              >
                🌟 Gold Active
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
          {lastWinnings > 0 && (
            <div className="mt-3 sm:mt-4 glass-card p-3 sm:p-4 bg-green-500/10 border border-green-500/30 text-center">
              <div className="text-xs sm:text-sm text-green-400 mb-1">You Won!</div>
              <div className="text-xl sm:text-3xl font-bold text-green-400">
                +{lastWinnings.toLocaleString()}
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
                  balance={balance}
                  isSpinning={!canBet}
                />
              </div>
              
              {/* Active Bets & History */}
              <div className="lg:col-span-4 space-y-3 sm:space-y-4 order-1 lg:order-2">
                <ActiveBets 
                  bets={currentBets}
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
                
                <BetHistory history={betHistory} />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <LiveChat 
                currentUser={user?.displayName} 
                className="h-[400px] sm:h-[500px]"
                messages={chatMessages}
                onSendMessage={sendChatMessage}
                onEditMessage={editChatMessage}
              />
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

export default LiveRouletteGameV2;
