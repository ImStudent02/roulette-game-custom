'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Bet, BetHistoryItem, WheelPosition } from '@/lib/types';
import { generateBetId } from '@/lib/gameUtils';
import RouletteWheel from './RouletteWheel';
import BettingTable from './BettingTable';
import ActiveBets from './ActiveBets';
import BetHistory from './BetHistory';
import GameTimer from './GameTimer';
import LiveChat from './LiveChat';
import CurrencyHeader from '../ui/CurrencyHeader';
import WalletPanel from '../ui/WalletPanel';
import AuthModalV2 from '../ui/AuthModalV2';
import DailyClaimPopup from '../ui/DailyClaimPopup';
import Footer from '../ui/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAnalytics } from '@/hooks/useAnalytics';

type GamePhase = 'betting' | 'warning' | 'locked' | 'spinning' | 'result';

interface CurrencyBalance {
  fermentedMangos: number;
  expiredJuice: number;
  mangos: number;
  mangoJuice: number;
}

// Timer configuration (in seconds) - matches server.js
const TIMER_CONFIG = {
  bettingDuration: 210,
  lockedDuration: 30,
  spinDuration: 15,
  resultDuration: 45,
};

// WebSocket URL
const getWebSocketUrl = (): string => {
  if (typeof window === 'undefined') return 'ws://localhost:3001/ws';
  
  const host = window.location.hostname;
  const port = window.location.port;
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return `ws://${host}:${port || '3001'}/ws`;
  }
  
  if (host.endsWith('.onion')) {
    return `ws://${window.location.host}/ws`;
  }
  
  return `wss://${window.location.host}/ws`;
};

const WS_URL = getWebSocketUrl();

export default function LiveRouletteGameV3() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; displayName: string; token?: string } | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Currency state
  const [currencyBalance, setCurrencyBalance] = useState<CurrencyBalance>({
    fermentedMangos: 100, // Default trial balance
    expiredJuice: 0,
    mangos: 0,
    mangoJuice: 0,
  });
  const [currencyMode, setCurrencyMode] = useState<'trial' | 'real'>('trial');
  
  // Active bet currency balance
  const activeBetBalance = currencyMode === 'trial' 
    ? currencyBalance.fermentedMangos 
    : currencyBalance.mangos;
  
  // Bets and history
  const [currentBets, setCurrentBets] = useState<Bet[]>([]);
  const [betHistory, setBetHistory] = useState<BetHistoryItem[]>([]);
  const [lastWinnings, setLastWinnings] = useState(0);
  const [lastProcessedRound, setLastProcessedRound] = useState(0);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'betting' | 'chat' | 'wallet'>('betting');
  
  // Daily claim popup
  const [showDailyClaim, setShowDailyClaim] = useState(false);
  const [dailyClaimChecked, setDailyClaimChecked] = useState(false);
  
  // WebSocket connection
  const {
    isConnected,
    gameState,
    chatMessages,
    authenticate,
    placeBet: wsSendBet,
    sendChatMessage,
    editChatMessage,
  } = useWebSocket(WS_URL);
  
  // Analytics tracking
  const { track } = useAnalytics({ 
    username: user?.username || '', 
    enabled: isAuthenticated 
  });
  
  // Server time offset
  const [serverOffset, setServerOffset] = useState(0);
  const [displayTime, setDisplayTime] = useState(0);
  
  // Derived state
  const phase = (gameState?.phase || 'betting') as GamePhase;
  const roundNumber = gameState?.roundNumber || 1;
  const serverGoldPosition = gameState?.goldPosition ?? -1;
  const serverGoldMultiplier = gameState?.goldMultiplier || 50;
  const serverOuterColors = gameState?.outerColors || [];
  const winningIndex = gameState?.winningIndex ?? -1;
  const winningPosition = gameState?.winningPosition as WheelPosition | undefined;
  
  const phaseEndsAt = gameState?.phaseEndsAt || 0;
  const spinStartAt = gameState?.spinStartAt || 0;
  const resultAt = gameState?.resultAt || 0;
  const targetAngle = gameState?.targetAngle || 0;
  
  const [shouldRegenerateGold, setShouldRegenerateGold] = useState(false);
  const lastRoundRef = useRef(0);
  
  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setUser({
            username: data.user.username,
            displayName: data.user.displayName,
          });
          setCurrencyBalance({
            fermentedMangos: data.user.fermentedMangos,
            expiredJuice: data.user.expiredJuice,
            mangos: data.user.mangos,
            mangoJuice: data.user.mangoJuice,
          });
          setIsAuthenticated(true);
        }
      } catch {
        // Not logged in
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Authenticate with WebSocket
  useEffect(() => {
    if (isAuthenticated && user && isConnected) {
      authenticate(user.username, user.displayName, {
        balance: currencyBalance as unknown as Record<string, number>,
        currencyType: currencyMode,
      });
    }
  }, [isAuthenticated, user, isConnected, currencyBalance, currencyMode, authenticate]);
  
  // Check for daily claim on login
  useEffect(() => {
    if (isAuthenticated && !dailyClaimChecked) {
      setDailyClaimChecked(true);
      fetch('/api/daily-claim')
        .then(res => res.json())
        .then(data => {
          if (data.canClaim) {
            setShowDailyClaim(true);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, dailyClaimChecked]);
  
  // Update display time
  useEffect(() => {
    const updateTimer = () => {
      if (!phaseEndsAt) {
        setDisplayTime(0);
        return;
      }
      const nowServer = Date.now() + serverOffset;
      const remaining = Math.max(0, Math.floor((phaseEndsAt - nowServer) / 1000));
      setDisplayTime(remaining);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [phaseEndsAt, serverOffset, phase, roundNumber]);
  
  // Server time offset
  useEffect(() => {
    if (gameState?.serverTime) {
      setServerOffset(gameState.serverTime - Date.now());
    }
  }, [gameState?.serverTime]);
  
  // New round detection
  useEffect(() => {
    if (roundNumber > lastRoundRef.current) {
      setShouldRegenerateGold(true);
      setTimeout(() => setShouldRegenerateGold(false), 100);
      lastRoundRef.current = roundNumber;
    }
  }, [roundNumber]);
  
  // Calculate results when round ends - processes bets per currency mode
  useEffect(() => {
    if (phase === 'result' && roundNumber > lastProcessedRound && winningPosition && currentBets.length > 0) {
      let trialWinnings = 0;
      let realWinnings = 0;
      const newBetHistory: BetHistoryItem[] = [];
      const outerColor = serverOuterColors[winningIndex] || 'none';
      
      currentBets.forEach(bet => {
        let betWon = false;
        let winAmount = 0;
        
        switch (bet.type) {
          case 'black':
            betWon = winningPosition.color === 'black' && winningPosition.number !== 'X';
            if (betWon) winAmount = bet.amount * 1.8;
            break;
          case 'white':
            betWon = winningPosition.color === 'white';
            if (betWon) winAmount = bet.amount * 1.9;
            break;
          case 'even':
            if (typeof winningPosition.number === 'number') {
              betWon = winningPosition.number % 2 === 0;
              if (betWon) winAmount = bet.amount * 1.95;
            }
            break;
          case 'odd':
            if (typeof winningPosition.number === 'number') {
              betWon = winningPosition.number % 2 === 1;
              if (betWon) winAmount = bet.amount * 1.95;
            }
            break;
          case 'green':
            betWon = outerColor === 'green';
            if (betWon) winAmount = bet.amount * 3;
            break;
          case 'pink':
            betWon = outerColor === 'pink';
            if (betWon) winAmount = bet.amount * 5;
            break;
          case 'gold':
            betWon = winningIndex === serverGoldPosition;
            if (betWon) winAmount = bet.amount * serverGoldMultiplier;
            break;
          case 'x':
            betWon = winningPosition.number === 'X';
            if (betWon) winAmount = bet.amount * 50;
            break;
          case 'number':
            if (typeof bet.targetNumber === 'number' && winningPosition.number === bet.targetNumber) {
              betWon = true;
              winAmount = bet.amount * (winningIndex === serverGoldPosition ? serverGoldMultiplier : 30);
            }
            break;
        }
        
        // Track winnings per currency mode
        if (betWon) {
          if (bet.currencyMode === 'trial') {
            trialWinnings += winAmount;
          } else {
            realWinnings += winAmount;
          }
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
          currencyMode: bet.currencyMode,
        });
      });
      
      // Update currencies based on each bet's mode
      const newTrialExpiredJuice = currencyBalance.expiredJuice + trialWinnings;
      const newRealMangoJuice = currencyBalance.mangoJuice + realWinnings;
      
      // Count wins and losses for stats
      const winCount = newBetHistory.filter(b => b.outcome === 'win').length;
      const lossCount = newBetHistory.filter(b => b.outcome === 'loss').length;
      
      setCurrencyBalance(prev => ({
        ...prev,
        expiredJuice: prev.expiredJuice + trialWinnings,
        mangoJuice: prev.mangoJuice + realWinnings,
      }));
      
      setLastWinnings(trialWinnings + realWinnings);
      setBetHistory(prev => [...newBetHistory, ...prev].slice(0, 30));
      setCurrentBets([]);
      setLastProcessedRound(roundNumber);
      
      // Persist balance to server
      fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiredJuice: newTrialExpiredJuice,
          mangoJuice: newRealMangoJuice,
          fermentedMangos: currencyBalance.fermentedMangos, // Preserve current bet deductions
          mangos: currencyBalance.mangos,
          totalWins: winCount,
          totalLosses: lossCount,
        }),
      }).catch(err => console.error('Failed to sync balance:', err));
    }
  }, [phase, roundNumber, lastProcessedRound, winningPosition, currentBets, serverOuterColors, winningIndex, serverGoldMultiplier, serverGoldPosition, currencyBalance]);
  
  // Handle spin complete
  const handleSpinComplete = useCallback((position: WheelPosition) => {
    // Spin complete logic if needed
  }, []);
  
  // Clear winnings on new round
  useEffect(() => {
    if (phase === 'betting' && lastWinnings > 0) {
      const timeout = setTimeout(() => setLastWinnings(0), 5000);
      return () => clearTimeout(timeout);
    }
  }, [phase, lastWinnings]);
  
  const canBet = phase === 'betting' || phase === 'warning';
  
  // Add bet - now tracks currencyMode with each bet
  const addBet = useCallback((bet: Bet) => {
    if (!canBet) return;
    
    // Check balance for the bet's currency mode
    const betBalance = bet.currencyMode === 'trial' 
      ? currencyBalance.fermentedMangos 
      : currencyBalance.mangos;
    if (bet.amount > betBalance) return;
    
    // Deduct from the bet's specific currency
    setCurrencyBalance(prev => {
      if (bet.currencyMode === 'trial') {
        return { ...prev, fermentedMangos: prev.fermentedMangos - bet.amount };
      } else {
        return { ...prev, mangos: prev.mangos - bet.amount };
      }
    });
    
    setCurrentBets(prev => [...prev, bet]);
    wsSendBet({ type: bet.type, amount: bet.amount, targetNumber: bet.targetNumber, currencyMode: bet.currencyMode });
    
    // Analytics tracking
    const msIntoRound = displayTime > 0 ? (TIMER_CONFIG.bettingDuration - displayTime) * 1000 : 0;
    track.betPlaced({
      amount: bet.amount,
      type: bet.type,
      targetNumber: bet.targetNumber,
      roundNumber,
      msIntoRound,
    });
  }, [canBet, currencyBalance.fermentedMangos, currencyBalance.mangos, wsSendBet, track, displayTime, roundNumber]);
  
  // Remove bet - refunds to the bet's specific currency
  const removeBet = useCallback((id: string) => {
    if (!canBet) return;
    
    setCurrentBets(prev => {
      const bet = prev.find(b => b.id === id);
      if (bet) {
        setCurrencyBalance(curr => {
          if (bet.currencyMode === 'trial') {
            return { ...curr, fermentedMangos: curr.fermentedMangos + bet.amount };
          } else {
            return { ...curr, mangos: curr.mangos + bet.amount };
          }
        });
        
        // Analytics tracking
        const msBeforeLock = displayTime * 1000;
        const wasLastSecond = displayTime <= 5;
        track.betRemoved({
          amount: bet.amount,
          msBeforeLock,
          wasLastSecond,
          roundNumber,
        });
      }
      return prev.filter(b => b.id !== id);
    });
  }, [canBet, track, displayTime, roundNumber]);
  
  // Handle auth success
  const handleAuthSuccess = useCallback((userData: { username: string; displayName: string; token: string }) => {
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
    
    // Reload profile
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        setCurrencyBalance({
          fermentedMangos: data.user.fermentedMangos,
          expiredJuice: data.user.expiredJuice,
          mangos: data.user.mangos,
          mangoJuice: data.user.mangoJuice,
        });
      })
      .catch(() => {});
  }, []);
  
  // Handle logout
  const handleLogout = useCallback(() => {
    document.cookie = 'r_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setUser(null);
    setIsAuthenticated(false);
    setCurrencyBalance({
      fermentedMangos: 100,
      expiredJuice: 0,
      mangos: 0,
      mangoJuice: 0,
    });
  }, []);
  
  // Handle currency mode change
  const handleModeChange = useCallback((mode: 'trial' | 'real') => {
    track.currencySwitched(currencyMode, mode);
    setCurrencyMode(mode);
  }, [track, currencyMode]);
  
  // Calculate totals per currency mode
  const { trialBetTotal, realBetTotal, totalBetAmount } = useMemo(() => {
    let trial = 0;
    let real = 0;
    currentBets.forEach(bet => {
      if (bet.currencyMode === 'trial') trial += bet.amount;
      else real += bet.amount;
    });
    return { trialBetTotal: trial, realBetTotal: real, totalBetAmount: trial + real };
  }, [currentBets]);
  
  // Bets filtered by mode for display
  const trialBets = useMemo(() => currentBets.filter(b => b.currencyMode === 'trial'), [currentBets]);
  const realBets = useMemo(() => currentBets.filter(b => b.currencyMode === 'real'), [currentBets]);
  
  // Loading
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
  
  // Auth required
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-5xl font-bold title-gradient mb-4">LIVE WHEEL</h1>
            <p className="text-gray-400 mb-8">
              Win 🥤 Expired Juice with trial mangos, or play with real 🥭 Mangos to win 🧃 Mango Juice you can withdraw!
            </p>
            
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#f4d03f] via-[#d4af37] to-[#b8860b] text-black font-bold text-xl rounded-xl hover:shadow-[0_0_40px_rgba(212,175,55,0.5)] transition-all"
            >
              🎰 Start Playing
            </button>
            
            <div className="mt-8 grid grid-cols-4 gap-2 text-center">
              <div className="glass-card p-3">
                <div className="text-xl mb-1">🍋</div>
                <div className="text-[10px] text-gray-400">Trial Bet</div>
              </div>
              <div className="glass-card p-3">
                <div className="text-xl mb-1">🥤</div>
                <div className="text-[10px] text-gray-400">Trial Win</div>
              </div>
              <div className="glass-card p-3">
                <div className="text-xl mb-1">🥭</div>
                <div className="text-[10px] text-gray-400">Real Bet</div>
              </div>
              <div className="glass-card p-3">
                <div className="text-xl mb-1">🧃</div>
                <div className="text-[10px] text-gray-400">Cash Win</div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="text-sm text-yellow-400">🎁 New players get 100 🍋 Fermented Mangos FREE!</div>
            </div>
          </div>
        </div>
        
        <AuthModalV2 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }
  
  return (
    <div className="min-h-screen text-white">
      {/* Currency Header */}
      <CurrencyHeader
        balance={currencyBalance}
        currencyMode={currencyMode}
        onModeChange={handleModeChange}
        username={user?.username}
        displayName={user?.displayName}
        isConnected={isConnected}
        roundNumber={roundNumber}
        onLogout={handleLogout}
      />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Wheel Section */}
        <section className="mb-4 sm:mb-6">
          <div className="flex justify-center relative">
            <RouletteWheel 
              onSpinComplete={handleSpinComplete}
              phase={phase}
              serverOffset={serverOffset}
              spinStartAt={spinStartAt}
              resultAt={resultAt}
              targetAngle={targetAngle}
              winningPosition={phase === 'result' ? winningPosition : undefined}
              shouldRegenerateColors={shouldRegenerateGold}
              serverOuterColors={serverOuterColors.length === 51 ? serverOuterColors : undefined}
            />
            
            {/* Currency Mode Badge */}
            <div className={`absolute top-2 left-2 z-30 px-3 py-1 rounded-full text-xs font-bold ${
              currencyMode === 'trial'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              {currencyMode === 'trial' ? '🍋 Trial Mode' : '🥭 Real Mode'}
            </div>
            
            {/* Gold indicator */}
            {serverGoldPosition >= 0 && (
              <div 
                className="absolute top-2 right-2 z-30 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg"
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
              <div className="text-xs sm:text-sm text-green-400 mb-1">
                You Won! {currencyMode === 'trial' ? '🥤' : '🧃'}
              </div>
              <div className="text-xl sm:text-3xl font-bold text-green-400">
                +{lastWinnings.toLocaleString()}
              </div>
            </div>
          )}
        </section>
        
        {/* Tab Navigation */}
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
              ☠️ Betting ☠️
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-bold text-sm sm:text-base transition-all ${
                activeTab === 'wallet'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black'
                  : 'glass-card text-gray-400 hover:text-white'
              }`}
            >
              💰 Wallet
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
          
          {/* Tab Content */}
          {activeTab === 'betting' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
              <div className="lg:col-span-8 order-2 lg:order-1">
                {!canBet && phase !== 'result' && (
                  <div className="glass-card p-3 sm:p-4 bg-red-500/10 border border-red-500/30 text-center mb-3 sm:mb-4">
                    <span className="text-red-400 font-bold text-sm sm:text-base">
                      🔒 Betting is LOCKED - Wait for next round
                    </span>
                  </div>
                )}
                
                <BettingTable 
                  onPlaceBet={addBet}
                  balance={activeBetBalance}
                  isSpinning={!canBet}
                  currencyMode={currencyMode}
                  maxBet={currencyMode === 'real' ? (gameState?.maxBetReal ?? 100000) : (gameState?.maxBetTrial ?? 1000000)}
                />
              </div>
              
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
                      {totalBetAmount.toLocaleString()} {currencyMode === 'trial' ? '🍋' : '🥭'}
                    </span>
                  </div>
                )}
                
                <BetHistory history={betHistory} />
              </div>
            </div>
          )}
          
          {activeTab === 'wallet' && (
            <div className="max-w-md mx-auto">
              <WalletPanel
                balance={currencyBalance}
                currencyMode={currencyMode}
                onModeChange={handleModeChange}
                onBalanceUpdate={(newBalance) => {
                  setCurrencyBalance(prev => ({ ...prev, ...newBalance }));
                }}
              />
            </div>
          )}
          
          {activeTab === 'chat' && (
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
      
      <Footer />
      
      {/* Quick Links */}
      <div className="fixed bottom-2 left-2 sm:bottom-4 sm:left-4 flex gap-2">
        <Link 
          href="/"
          className="glass-card px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
        >
          ← Self Mode
        </Link>
        <Link 
          href="/story"
          className="glass-card px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-orange-400 hover:text-orange-300 transition-colors"
        >
          🥭 Story
        </Link>
      </div>
      
      {/* Daily Claim Popup */}
      {showDailyClaim && (
        <DailyClaimPopup
          onClose={() => setShowDailyClaim(false)}
          onClaimed={(reward) => {
            setCurrencyBalance(prev => ({
              ...prev,
              fermentedMangos: prev.fermentedMangos + reward,
            }));
          }}
        />
      )}
    </div>
  );
}
