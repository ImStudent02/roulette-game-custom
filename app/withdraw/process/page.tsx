'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function ProcessLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    </div>
  );
}

function ProcessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [paymentMethod, setPaymentMethod] = useState<'paypal' | 'bank'>('paypal');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
  });
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const amount = parseInt(searchParams.get('amount') || '0');
  const usd = searchParams.get('usd') || '0.00';

  useEffect(() => {
    if (!amount || amount <= 0) {
      router.push('/withdraw');
    }
  }, [amount, router]);

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (paymentMethod === 'paypal' && !paypalEmail.includes('@')) {
      setError('Please enter a valid PayPal email');
      return;
    }
    if (paymentMethod === 'bank') {
      if (!bankDetails.accountName || !bankDetails.accountNumber || !bankDetails.routingNumber) {
        setError('Please fill all bank details');
        return;
      }
    }

    setProcessing(true);

    try {
      const res = await fetch('/api/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          // The existing API doesn't require method/details, but we can extend it later
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Withdrawal failed');
        setProcessing(false);
        return;
      }

      // Success - redirect to profile with success message
      router.push('/profile?withdraw=success');
    } catch {
      setError('Network error. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-transparent py-8">
        <div className="max-w-xl mx-auto px-4">
          <Link href="/withdraw" className="text-gray-400 hover:text-white transition mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-center">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Confirm Withdrawal
            </span>
          </h1>
        </div>
      </div>

      {/* Summary Card */}
      <div className="max-w-xl mx-auto px-4 mb-6">
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/mango-juce.svg" alt="Mango Juice" width={40} height={40} />
              <div>
                <div className="text-gray-400 text-sm">Withdrawing</div>
                <div className="text-2xl font-bold text-white">
                  {amount.toLocaleString()} Juice
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-sm">You'll receive</div>
              <div className="text-2xl font-bold text-green-400">${usd}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="max-w-xl mx-auto px-4 mb-6">
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
          <h2 className="text-lg font-bold mb-4">Select Payment Method</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`p-4 rounded-xl border-2 transition ${
                paymentMethod === 'paypal'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">💳</div>
              <div className="font-bold">PayPal</div>
              <div className="text-xs text-gray-400">Instant transfer</div>
            </button>
            
            <button
              onClick={() => setPaymentMethod('bank')}
              className={`p-4 rounded-xl border-2 transition ${
                paymentMethod === 'bank'
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">🏦</div>
              <div className="font-bold">Bank Transfer</div>
              <div className="text-xs text-gray-400">1-3 business days</div>
            </button>
          </div>

          {/* PayPal Form */}
          {paymentMethod === 'paypal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">PayPal Email</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Bank Form */}
          {paymentMethod === 'bank' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Account Holder Name</label>
                <input
                  type="text"
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Account Number</label>
                  <input
                    type="text"
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="123456789"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Routing Number</label>
                  <input
                    type="text"
                    value={bankDetails.routingNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                    placeholder="021000021"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">Bank Name</label>
                <input
                  type="text"
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="Bank of America"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-center">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="max-w-xl mx-auto px-4">
        <button
          onClick={handleSubmit}
          disabled={processing}
          className={`w-full py-4 rounded-xl font-bold text-lg transition ${
            processing
              ? 'bg-gray-700 text-gray-400 cursor-wait'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
          }`}
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            `Confirm Withdrawal of $${usd}`
          )}
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          By confirming, you agree to our withdrawal terms and conditions
        </p>
      </div>
    </div>
  );
}

export default function ProcessPage() {
  return (
    <Suspense fallback={<ProcessLoading />}>
      <ProcessContent />
    </Suspense>
  );
}
