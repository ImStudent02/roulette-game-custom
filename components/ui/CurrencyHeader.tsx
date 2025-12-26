'use client';

import { useState } from 'react';
import Link from 'next/link';
import CurrencyIcon from './CurrencyIcon';

interface CurrencyBalance {
  fermentedMangos: number;
  expiredJuice: number;
  mangos: number;
  mangoJuice: number;
}

interface CurrencyHeaderProps {
  balance: CurrencyBalance;
  currencyMode: 'trial' | 'real';
  onModeChange: (mode: 'trial' | 'real') => void;
  username?: string;
  displayName?: string;
  isConnected?: boolean;
  roundNumber?: number;
  onLogout?: () => void;
}

export default function CurrencyHeader({
  balance,
  currencyMode,
  onModeChange,
  username,
  displayName,
  isConnected = false,
  roundNumber = 1,
  onLogout,
}: CurrencyHeaderProps) {
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);

  // Get active currency based on mode
  const activeBetCurrency = currencyMode === 'trial' ? balance.fermentedMangos : balance.mangos;
  const activeWinCurrency = currencyMode === 'trial' ? balance.expiredJuice : balance.mangoJuice;
  const betCurrencyIcon = currencyMode === 'trial' ? '🍋' : '🥭';
  const winCurrencyIcon = currencyMode === 'trial' ? '🥤' : '🧃';
  const betCurrencyName = currencyMode === 'trial' ? 'Fermented' : 'Mangos';
  const winCurrencyName = currencyMode === 'trial' ? 'Expired' : 'Juice';

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#08080c]/90 border-b border-[rgba(212,175,55,0.15)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Logo & Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-2xl font-bold title-gradient">LIVE WHEEL</h1>
            <span className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-400">
              <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
              {isConnected ? `Round #${roundNumber}` : 'Connecting...'}
            </span>
          </div>

          {/* Center: Currency Mode Switcher */}
          <div className="hidden sm:flex items-center gap-2 bg-gray-800/50 rounded-full p-1">
            <button
              onClick={() => onModeChange('trial')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                currencyMode === 'trial'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CurrencyIcon type="fermentedMango" size="xs" /> Trial
            </button>
            <button
              onClick={() => onModeChange('real')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                currencyMode === 'real'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <CurrencyIcon type="mango" size="xs" /> Real
            </button>
          </div>

          {/* Right: Balance & User */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Currency Display */}
            <div 
              className="relative cursor-pointer"
              onMouseEnter={() => setShowBalanceDetails(true)}
              onMouseLeave={() => setShowBalanceDetails(false)}
            >
              <div className="glass-card px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-2 sm:gap-3">
                {/* Bet Currency */}
                <div className="flex items-center gap-1">
                  <CurrencyIcon type={currencyMode === 'trial' ? 'fermentedMango' : 'mango'} size="sm" />
                  <span className="font-bold text-white text-sm sm:text-base">
                    {formatNumber(activeBetCurrency)}
                  </span>
                </div>
                
                {/* Divider */}
                <div className="w-px h-4 bg-gray-600"></div>
                
                {/* Win Currency */}
                <div className="flex items-center gap-1">
                  <CurrencyIcon type={currencyMode === 'trial' ? 'expiredJuice' : 'mangoJuice'} size="sm" />
                  <span className="font-bold text-[#d4af37] text-sm sm:text-base">
                    {formatNumber(activeWinCurrency)}
                  </span>
                </div>
              </div>

              {/* Balance Details Popup */}
              {showBalanceDetails && (
                <div className="absolute top-full right-0 mt-2 w-64 glass-card p-4 bg-[#0a0a0f]/95 border border-gray-700 rounded-xl shadow-2xl z-50">
                  <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">All Balances</div>
                  
                  {/* Trial Currencies */}
                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <div className="text-[10px] text-yellow-500 mb-2 uppercase">Trial Mode</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-2 text-gray-400 text-sm">
                        <CurrencyIcon type="fermentedMango" size="xs" /> Fermented Mango
                      </span>
                      <span className="font-bold text-white">{balance.fermentedMangos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-400 text-sm">
                        <CurrencyIcon type="expiredJuice" size="xs" /> Expired Juice
                      </span>
                      <span className="font-bold text-orange-400">{balance.expiredJuice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Real Currencies */}
                  <div className="mb-3 pb-3 border-b border-gray-700">
                    <div className="text-[10px] text-green-500 mb-2 uppercase">Real Mode</div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-2 text-gray-400 text-sm">
                        <CurrencyIcon type="mango" size="xs" /> Mangos
                      </span>
                      <span className="font-bold text-white">{balance.mangos.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2 text-gray-400 text-sm">
                        <CurrencyIcon type="mangoJuice" size="xs" /> Mango Juice
                      </span>
                      <span className="font-bold text-purple-400">{balance.mangoJuice.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Cash Value */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-sm">💵 Cash Value</span>
                    <span className="font-bold text-green-400">${(balance.mangoJuice / 1000).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/topup"
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-[10px] sm:text-xs font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
              >
                <span className="hidden sm:inline">💳 </span>Top Up
              </Link>
              
              <Link
                href="/profile"
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-gray-700/50 text-gray-300 text-[10px] sm:text-xs font-bold rounded-lg hover:bg-gray-600/50 transition-all"
              >
                <span className="hidden sm:inline">👤 </span>Profile
              </Link>
            </div>

            {/* User Menu (Mobile) */}
            <div className="sm:hidden">
              <button
                onClick={() => onModeChange(currencyMode === 'trial' ? 'real' : 'trial')}
                className={`p-2 rounded-full ${
                  currencyMode === 'trial' ? 'bg-yellow-500/20' : 'bg-green-500/20'
                }`}
              >
                <CurrencyIcon type={currencyMode === 'trial' ? 'fermentedMango' : 'mango'} size="sm" />
              </button>
            </div>

            {/* User Display Name */}
            {displayName && (
              <span className="hidden sm:block text-xs text-gray-400">{displayName}</span>
            )}
          </div>
        </div>

        {/* Mobile Currency Mode Pills */}
        <div className="sm:hidden flex justify-center gap-2 mt-2">
          <button
            onClick={() => onModeChange('trial')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              currencyMode === 'trial'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <CurrencyIcon type="fermentedMango" size="xs" /> Trial Mode
          </button>
          <button
            onClick={() => onModeChange('real')}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
              currencyMode === 'real'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-black'
                : 'bg-gray-800 text-gray-400'
            }`}
          >
            <CurrencyIcon type="mango" size="xs" /> Real Mode
          </button>
        </div>
      </div>
    </header>
  );
}
