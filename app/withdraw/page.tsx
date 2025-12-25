'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Loading fallback
function WithdrawLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    </div>
  );
}

function WithdrawContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const MIN_WITHDRAW = 100; // 100 juice = $0.10
  const MAX_WITHDRAW = 1000000; // 1M juice = $1000

  useEffect(() => {
    fetchBalance();
    const error = searchParams.get('error');
    if (error) setErrorMsg(error);
  }, [searchParams]);

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/user/profile');
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setBalance(data.user?.mangoJuice || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const amountNum = parseInt(amount) || 0;
  const usdValue = (amountNum / 1000).toFixed(2);
  const isValid = amountNum >= MIN_WITHDRAW && amountNum <= balance;

  // Quick select options
  const quickAmounts = [
    { label: '1K', value: 1000 },
    { label: '10K', value: 10000 },
    { label: '50K', value: 50000 },
    { label: '100K', value: 100000 },
    { label: 'MAX', value: balance },
  ];

  const goToProcess = () => {
    if (!isValid) return;
    const params = new URLSearchParams({
      amount: amountNum.toString(),
      usd: usdValue,
    });
    router.push(`/withdraw/process?${params.toString()}`);
  };

  if (loading) {
    return <WithdrawLoading />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-transparent py-8">
        <div className="max-w-xl mx-auto px-4">
          <Link href="/profile" className="text-gray-400 hover:text-white transition mb-4 inline-block">
            ← Back to Profile
          </Link>
          <h1 className="text-3xl font-bold text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Withdraw Mango Juice
            </span>
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Convert your winnings to real money
          </p>
        </div>
      </div>

      {/* Error message */}
      {errorMsg && (
        <div className="max-w-xl mx-auto px-4 mb-4">
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-red-400 text-center">
            {errorMsg}
          </div>
        </div>
      )}

      {/* Balance Card */}
      <div className="max-w-xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/mango-juce.svg" alt="Mango Juice" width={48} height={48} />
              <div>
                <div className="text-gray-400 text-sm">Available Balance</div>
                <div className="text-3xl font-bold text-white">
                  {balance.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">USD Value</div>
              <div className="text-2xl font-bold text-green-400">
                ${(balance / 1000).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="max-w-xl mx-auto px-4 mb-6">
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <label className="block text-gray-400 text-sm mb-2">
            Amount to Withdraw
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              min={MIN_WITHDRAW}
              max={balance}
              className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-bold text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Image src="/mango-juce.svg" alt="" width={24} height={24} />
              <span className="text-gray-400">Juice</span>
            </div>
          </div>

          {/* Quick Select */}
          <div className="flex flex-wrap gap-2 mt-4">
            {quickAmounts.map((qa) => (
              <button
                key={qa.label}
                onClick={() => setAmount(qa.value.toString())}
                disabled={qa.value > balance}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  amountNum === qa.value
                    ? 'bg-purple-500 text-white'
                    : qa.value > balance
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* USD Preview */}
          {amountNum > 0 && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">You will receive:</span>
                <span className="text-2xl font-bold text-green-400">${usdValue}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Rate: 1,000 Mango Juice = $1.00
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {amountNum > 0 && amountNum < MIN_WITHDRAW && (
            <div className="mt-3 text-yellow-400 text-sm">
              Minimum withdrawal: {MIN_WITHDRAW.toLocaleString()} Mango Juice
            </div>
          )}
          {amountNum > balance && (
            <div className="mt-3 text-red-400 text-sm">
              Insufficient balance
            </div>
          )}
        </div>
      </div>

      {/* Confirm Button */}
      <div className="max-w-xl mx-auto px-4">
        <button
          onClick={goToProcess}
          disabled={!isValid}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            isValid
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isValid ? `Withdraw $${usdValue}` : 'Enter valid amount'}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Withdrawals are processed within 1-3 business days
        </p>
      </div>
    </div>
  );
}

export default function WithdrawPage() {
  return (
    <Suspense fallback={<WithdrawLoading />}>
      <WithdrawContent />
    </Suspense>
  );
}
