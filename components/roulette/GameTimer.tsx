'use client';

import { memo } from 'react';

type GamePhase = 'betting' | 'warning' | 'locked' | 'spinning' | 'result';

type GameTimerProps = {
  timeRemaining: number; // in seconds
  phase: GamePhase;
  totalTime: number; // total round time in seconds
};

const GameTimer = ({ timeRemaining, phase, totalTime }: GameTimerProps) => {
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Calculate progress percentage
  const progress = ((totalTime - timeRemaining) / totalTime) * 100;
  
  // Get phase-specific styles and messages
  const getPhaseConfig = () => {
    switch (phase) {
      case 'betting':
        return {
          color: 'from-green-500 to-emerald-600',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/50',
          message: '🎲 Place your bets!',
          textColor: 'text-green-400'
        };
      case 'warning':
        return {
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/50',
          message: '⚠️ Last chance! Betting closes soon!',
          textColor: 'text-yellow-400'
        };
      case 'locked':
        return {
          color: 'from-red-500 to-red-700',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/50',
          message: '🔒 Betting LOCKED!',
          textColor: 'text-red-400'
        };
      case 'spinning':
        return {
          color: 'from-purple-500 to-violet-600',
          bgColor: 'bg-purple-500/20',
          borderColor: 'border-purple-500/50',
          message: '🎰 Wheel is spinning...',
          textColor: 'text-purple-400'
        };
      case 'result':
        return {
          color: 'from-[#d4af37] to-[#b8860b]',
          bgColor: 'bg-[#d4af37]/20',
          borderColor: 'border-[#d4af37]/50',
          message: '🏆 Result!',
          textColor: 'text-[#d4af37]'
        };
    }
  };
  
  const config = getPhaseConfig();
  
  return (
    <div className={`glass-card p-4 ${config.bgColor} border ${config.borderColor} transition-all duration-500`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">
          Next Spin
        </span>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${config.bgColor} ${config.textColor}`}>
          {phase.toUpperCase()}
        </span>
      </div>
      
      {/* Timer Display */}
      <div className="text-center mb-4">
        <div 
          className={`text-5xl font-bold font-mono ${config.textColor} transition-colors duration-300`}
          style={{ 
            textShadow: phase === 'warning' || phase === 'locked' 
              ? '0 0 20px currentColor' 
              : undefined 
          }}
        >
          {formatTime(timeRemaining)}
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
        <div 
          className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Phase Message */}
      <div 
        className={`text-center text-sm font-medium ${config.textColor} ${
          phase === 'warning' ? 'animate-pulse' : ''
        }`}
      >
        {config.message}
      </div>
      
      {/* Warning Animation */}
      {phase === 'warning' && (
        <div className="mt-3 text-center">
          <span className="inline-block px-4 py-2 bg-yellow-500/30 border border-yellow-500/50 rounded-lg text-yellow-300 text-sm font-bold animate-bounce">
            ⏰ Make your choice NOW!
          </span>
        </div>
      )}
      
      {phase === 'locked' && timeRemaining <= 10 && (
        <div className="mt-3 text-center">
          <span className="inline-block px-4 py-2 bg-red-500/30 border border-red-500/50 rounded-lg text-red-300 text-sm font-bold">
            🎰 Spinning in {timeRemaining}...
          </span>
        </div>
      )}
      
      {phase === 'result' && timeRemaining === 0 && (
        <div className="mt-3 text-center">
          <span className="inline-block px-4 py-2 bg-green-500/30 border border-green-500/50 rounded-lg text-green-300 text-sm font-bold animate-pulse">
            🔄 Next round starting...
          </span>
        </div>
      )}
    </div>
  );
};

export default memo(GameTimer);
