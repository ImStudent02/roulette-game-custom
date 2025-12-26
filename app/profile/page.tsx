'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  username: string;
  displayName: string;
  fermentedMangos: number;
  expiredJuice: number;
  mangos: number;
  mangoJuice: number;
  totalWins: number;
  totalLosses: number;
  totalDeposited: number;
  totalWithdrawn: number;
  signupTime: number;
  lastLogin: number;
}

interface ExpiredJuiceProgress {
  current: number;
  required: number;
  percentage: number;
  canConvert: boolean;
}

interface Transaction {
  type: string;
  currency: string;
  amount: number;
  timestamp: number;
  details?: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [progress, setProgress] = useState<ExpiredJuiceProgress | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [convertMessage, setConvertMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/';
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      const data = await res.json();
      setUser(data.user);
      setProgress(data.expiredJuiceProgress);
      setTransactions(data.recentTransactions || []);
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConvertExpired = async () => {
    if (!progress?.canConvert) return;
    
    setConverting(true);
    setConvertMessage('');
    
    try {
      const res = await fetch('/api/wallet/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expired_to_juice' }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setConvertMessage(data.error || 'Conversion failed');
        return;
      }
      
      setConvertMessage(data.message);
      fetchProfile(); // Refresh data
    } catch {
      setConvertMessage('Network error');
    } finally {
      setConverting(false);
    }
  };

  const formatNumber = (num: number) => num?.toLocaleString() || '0';
  const formatDate = (timestamp: number) => new Date(timestamp).toLocaleDateString();
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleString();

  const getCurrencySvg = (currency: string) => {
    const svgs: Record<string, string> = {
      fermentedMango: '/rotten-mango.svg',
      expiredJuice: '/rotten-mango-juce.svg',
      mango: '/mango.svg',
      mangoJuice: '/mango-juce.svg',
      usd: '/mango.svg',
    };
    return svgs[currency] || '/mango.svg';
  };

  const getTransactionColor = (type: string) => {
    const colors: Record<string, string> = {
      topup: 'text-green-400',
      win: 'text-green-400',
      withdraw: 'text-yellow-400',
      loss: 'text-red-400',
      bet: 'text-orange-400',
      convert: 'text-blue-400',
    };
    return colors[type] || 'text-gray-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-2xl">{error || 'Please login'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/live" className="text-gray-400 hover:text-white transition">
            ← Back to Game
          </Link>
          <h1 className="text-3xl font-bold text-white">Profile</h1>
          <Link href="/topup" className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-lg text-white font-bold hover:opacity-90 transition">
            💳 Top Up
          </Link>
        </div>

        {/* User Info Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">
                {user.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{user.displayName}</h2>
                <p className="text-gray-400">{user.username}</p>
              </div>
            </div>
            <button
              onClick={() => {
                document.cookie = 'r_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition"
            >
              🚪 Logout
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div>Member since: {formatDate(user.signupTime)}</div>
            <div>Last active: {formatDate(user.lastLogin)}</div>
          </div>
        </div>

        {/* Currency Balances */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Trial Currencies */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-600/30">
            <div className="text-yellow-400 text-sm mb-1 flex items-center gap-1">
              <Image src="/rotten-mango.svg" alt="" width={16} height={16} />
              Fermented Mango
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(user.fermentedMangos)}</div>
            <div className="text-xs text-gray-500">Trial currency</div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-orange-600/30">
            <div className="text-orange-400 text-sm mb-1 flex items-center gap-1">
              <Image src="/rotten-mango-juce.svg" alt="" width={16} height={16} />
              Expired Juice
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(user.expiredJuice)}</div>
            <div className="text-xs text-gray-500">Trial winnings</div>
          </div>

          {/* Real Currencies */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-green-600/30">
            <div className="text-green-400 text-sm mb-1 flex items-center gap-1">
              <Image src="/mango.svg" alt="" width={16} height={16} />
              Mangos
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(user.mangos)}</div>
            <div className="text-xs text-gray-500">Betting currency</div>
          </div>
          
          <Link 
            href="/withdraw"
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-600/30 hover:border-purple-500 hover:bg-purple-900/30 transition group cursor-pointer block"
          >
            <div className="text-purple-400 text-sm mb-1 flex items-center gap-1">
              <Image src="/mango-juce.svg" alt="" width={16} height={16} />
              Mango Juice
            </div>
            <div className="text-2xl font-bold text-white">{formatNumber(user.mangoJuice)}</div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">≈ ${(user.mangoJuice / 1000).toFixed(2)}</div>
              <div className="text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition">
                Withdraw →
              </div>
            </div>
          </Link>
        </div>

        {/* Expired Juice Progress */}
        {progress && (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-3">🏆 Conversion Progress</h3>
            <p className="text-gray-400 text-sm mb-4">
              Collect 100,000 Expired Juice to convert to 100 real Mango Juice!
            </p>
            
            {/* Progress Bar */}
            <div className="relative h-6 bg-gray-700 rounded-full overflow-hidden mb-3">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                {formatNumber(progress.current)} / {formatNumber(progress.required)} ({progress.percentage}%)
              </div>
            </div>

            {progress.canConvert ? (
              <button
                onClick={handleConvertExpired}
                disabled={converting}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-bold rounded-lg hover:opacity-90 transition disabled:opacity-50"
              >
                {converting ? 'Converting...' : '🎉 Convert to Mango Juice!'}
              </button>
            ) : (
              <div className="text-center text-gray-500 text-sm">
                {formatNumber(progress.required - progress.current)} more Expired Juice needed
              </div>
            )}

            {convertMessage && (
              <div className={`mt-3 text-center ${convertMessage.includes('error') ? 'text-red-400' : 'text-green-400'}`}>
                {convertMessage}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-green-400">{user.totalWins}</div>
            <div className="text-gray-400 text-sm">Total Wins</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-red-400">{user.totalLosses}</div>
            <div className="text-gray-400 text-sm">Total Losses</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">${user.totalDeposited?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-400 text-sm">Total Deposited</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">${user.totalWithdrawn?.toFixed(2) || '0.00'}</div>
            <div className="text-gray-400 text-sm">Total Withdrawn</div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">📜 Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No transactions yet</div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Image src={getCurrencySvg(tx.currency)} alt="" width={24} height={24} />
                    <div>
                      <div className={`font-medium ${getTransactionColor(tx.type)}`}>
                        {tx.type.toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500">{tx.details || '-'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}{formatNumber(tx.amount)}
                    </div>
                    <div className="text-xs text-gray-500">{formatTime(tx.timestamp)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
