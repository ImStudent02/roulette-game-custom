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

interface WalletPanelProps {
  balance: CurrencyBalance;
  currencyMode: 'trial' | 'real';
  onModeChange: (mode: 'trial' | 'real') => void;
  onBalanceUpdate?: (newBalance: Partial<CurrencyBalance>) => void;
  className?: string;
}

// Minimum amounts
const MIN_CONVERT_JUICE = 100;
const MIN_WITHDRAW_JUICE = 100;

export default function WalletPanel({
  balance,
  currencyMode,
  onModeChange,
  onBalanceUpdate,
  className = '',
}: WalletPanelProps) {
  const [convertAmount, setConvertAmount] = useState<number>(MIN_CONVERT_JUICE);
  const [isConverting, setIsConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Get active currency based on mode
  const betCurrency = currencyMode === 'trial' ? balance.fermentedMangos : balance.mangos;
  const winCurrency = currencyMode === 'trial' ? balance.expiredJuice : balance.mangoJuice;
  
  // Check if user should switch modes
  const lowTrialBalance = balance.fermentedMangos < 50;
  const hasRealMangos = balance.mangos > 0;
  
  // Conversion progress (100k expired juice = 100 juice)
  const conversionProgress = Math.min(100, Math.floor((balance.expiredJuice / 100000) * 100));
  const canConvertExpired = balance.expiredJuice >= 100000;
  
  // Mango Juice conversion eligibility
  const canConvertJuice = balance.mangoJuice >= MIN_CONVERT_JUICE;
  const canWithdraw = balance.mangoJuice >= MIN_WITHDRAW_JUICE;

  const formatNumber = (num: number) => num.toLocaleString();
  
  // Handle Mango Juice to Mangos conversion
  const handleConvertJuice = async () => {
    if (convertAmount < MIN_CONVERT_JUICE || convertAmount > balance.mangoJuice) return;
    
    setIsConverting(true);
    setConvertMessage(null);
    
    try {
      const res = await fetch('/api/wallet/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'juice_to_mango', amount: convertAmount }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setConvertMessage({ type: 'success', text: data.message });
        // Update local balance
        if (onBalanceUpdate) {
          onBalanceUpdate({
            mangoJuice: data.newBalance.mangoJuice,
            mangos: data.newBalance.mangos,
          });
        }
        // Reset amount to minimum
        setConvertAmount(MIN_CONVERT_JUICE);
      } else {
        setConvertMessage({ type: 'error', text: data.error });
      }
    } catch {
      setConvertMessage({ type: 'error', text: 'Failed to convert. Please try again.' });
    } finally {
      setIsConverting(false);
      // Clear message after 3 seconds
      setTimeout(() => setConvertMessage(null), 3000);
    }
  };

  return (
    <div className={`glass-card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          💰 Wallet
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          currencyMode === 'trial' 
            ? 'bg-yellow-500/20 text-yellow-400' 
            : 'bg-green-500/20 text-green-400'
        }`}>
          {currencyMode === 'trial' ? 'Trial Mode' : 'Real Mode'}
        </span>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => onModeChange('trial')}
          className={`p-3 rounded-xl transition-all text-center flex flex-col items-center ${
            currencyMode === 'trial'
              ? 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30 border-2 border-yellow-500'
              : 'bg-gray-800/50 border border-gray-700 hover:border-gray-500'
          }`}
        >
          <CurrencyIcon type="fermentedMango" size="md" />
          <div className="text-xs text-gray-400 mt-1">Trial</div>
        </button>
        
        <button
          onClick={() => onModeChange('real')}
          className={`p-3 rounded-xl transition-all text-center flex flex-col items-center ${
            currencyMode === 'real'
              ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500'
              : 'bg-gray-800/50 border border-gray-700 hover:border-gray-500'
          }`}
        >
          <CurrencyIcon type="mango" size="md" />
          <div className="text-xs text-gray-400 mt-1">Real</div>
        </button>
      </div>

      {/* Active Balance Display */}
      <div className="bg-gray-800/50 rounded-xl p-4 mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Bet Currency</span>
          <div className="flex items-center gap-2">
            <CurrencyIcon type={currencyMode === 'trial' ? 'fermentedMango' : 'mango'} size="md" />
            <span className="font-bold text-white text-lg">{formatNumber(betCurrency)}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Winnings</span>
          <div className="flex items-center gap-2">
            <CurrencyIcon type={currencyMode === 'trial' ? 'expiredJuice' : 'mangoJuice'} size="md" />
            <span className="font-bold text-[#d4af37] text-lg">{formatNumber(winCurrency)}</span>
          </div>
        </div>
      </div>

      {/* All Balances Summary */}
      <div className="space-y-2 mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wider">All Balances</div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-gray-800/30 rounded-lg p-2 flex items-center justify-between">
            <CurrencyIcon type="fermentedMango" size="sm" />
            <span className="text-gray-300">{formatNumber(balance.fermentedMangos)}</span>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2 flex items-center justify-between">
            <CurrencyIcon type="expiredJuice" size="sm" />
            <span className="text-orange-400">{formatNumber(balance.expiredJuice)}</span>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2 flex items-center justify-between">
            <CurrencyIcon type="mango" size="sm" />
            <span className="text-gray-300">{formatNumber(balance.mangos)}</span>
          </div>
          <div className="bg-gray-800/30 rounded-lg p-2 flex items-center justify-between">
            <CurrencyIcon type="mangoJuice" size="sm" />
            <span className="text-purple-400">{formatNumber(balance.mangoJuice)}</span>
          </div>
        </div>
      </div>

      {/* Conversion Progress (for trial mode) */}
      {currencyMode === 'trial' && balance.expiredJuice > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-orange-400">🏆 Conversion Progress</span>
            <span className="text-xs text-gray-400">{conversionProgress}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
              style={{ width: `${conversionProgress}%` }}
            />
          </div>
          {canConvertExpired ? (
            <Link 
              href="/profile"
              className="block mt-2 text-center text-xs text-green-400 hover:underline"
            >
              ✨ Ready to convert! Click here
            </Link>
          ) : (
            <div className="text-xs text-gray-500 mt-2 text-center">
              {formatNumber(100000 - balance.expiredJuice)} more 🥤 needed
            </div>
          )}
        </div>
      )}

      {/* Mango Juice Options (for real mode) */}
      {currencyMode === 'real' && balance.mangoJuice > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-green-500/10 border border-purple-500/30 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-purple-400">🧃 Mango Juice Options</span>
            <span className="font-bold text-green-400">${(balance.mangoJuice / 1000).toFixed(2)}</span>
          </div>
          
          {/* Amount Input */}
          <div className="mb-3">
            <label className="text-xs text-gray-400 block mb-1">Amount to convert/withdraw:</label>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={convertAmount}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
                  const numValue = parseInt(value) || 0;
                  // Don't cap during typing, but show error if over limit
                  setConvertAmount(numValue);
                }}
                onBlur={() => {
                  // On blur, enforce limits
                  if (convertAmount < MIN_CONVERT_JUICE) {
                    setConvertAmount(MIN_CONVERT_JUICE);
                  } else if (convertAmount > balance.mangoJuice) {
                    setConvertAmount(balance.mangoJuice);
                  }
                }}
                className={`flex-1 bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none ${
                  convertAmount > balance.mangoJuice 
                    ? 'border-red-500 focus:border-red-500' 
                    : 'border-gray-700 focus:border-purple-500'
                }`}
                placeholder={`Min ${MIN_CONVERT_JUICE}`}
              />
              <button
                onClick={() => setConvertAmount(balance.mangoJuice)}
                className="px-3 py-2 bg-gray-700 text-xs text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Min: {MIN_CONVERT_JUICE} 🧃</span>
              {convertAmount > balance.mangoJuice && (
                <span className="text-red-400">Exceeds available ({formatNumber(balance.mangoJuice)})</span>
              )}
            </div>
          </div>
          
          {/* Conversion Message */}
          {convertMessage && (
            <div className={`text-xs p-2 rounded-lg mb-2 ${
              convertMessage.type === 'success' 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {convertMessage.text}
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleConvertJuice}
              disabled={!canConvertJuice || isConverting || convertAmount > balance.mangoJuice}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                canConvertJuice && !isConverting && convertAmount <= balance.mangoJuice
                  ? 'bg-gradient-to-r from-purple-500 to-green-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isConverting ? '...' : '🥭 Convert to Mangos'}
            </button>
            
            <Link
              href="/profile"
              className={`py-2 text-xs font-bold rounded-lg text-center transition-all ${
                canWithdraw
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-500/30'
                  : 'bg-gray-700 text-gray-500 pointer-events-none'
              }`}
            >
              💵 Withdraw
            </Link>
          </div>
          
          {!canConvertJuice && (
            <div className="text-xs text-gray-500 mt-2 text-center">
              Need {MIN_CONVERT_JUICE}+ 🧃 to convert or withdraw
            </div>
          )}
        </div>
      )}

      {/* Low Balance Warning */}
      {currencyMode === 'trial' && lowTrialBalance && !hasRealMangos && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
          <div className="text-xs text-red-400 mb-1">⚠️ Low Trial Balance</div>
          <div className="text-xs text-gray-400">Top up to play with real mangos!</div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <Link
          href="/topup"
          className="block w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-center text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-green-500/30 transition-all"
        >
          💳 Top Up Mangos
        </Link>
        
        <Link
          href="/profile"
          className="block w-full py-2 bg-gray-700/50 text-gray-300 text-center text-sm font-bold rounded-lg hover:bg-gray-600/50 transition-all"
        >
          👤 View Profile
        </Link>
      </div>
    </div>
  );
}

