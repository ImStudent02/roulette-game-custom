'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface PackageInfo {
  id: string;
  usd: number;
  totalMangos: number;
  displayPrice: string;
  bonusPercent: number;
}

interface CardErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
}

// Loading fallback
function PaymentLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
    </div>
  );
}

// Inner component that uses useSearchParams
function PaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [errors, setErrors] = useState<CardErrors>({});
  
  useEffect(() => {
    const packageId = searchParams.get('package');
    const usd = searchParams.get('usd');
    const mangos = searchParams.get('mangos');
    const price = searchParams.get('price');
    const bonus = searchParams.get('bonus');
    
    if (packageId && usd && mangos && price) {
      setPackageInfo({
        id: packageId,
        usd: parseFloat(usd),
        totalMangos: parseInt(mangos),
        displayPrice: price,
        bonusPercent: parseInt(bonus || '0'),
      });
    } else {
      // No package selected, redirect back
      router.push('/topup');
    }
    setLoading(false);
  }, [searchParams, router]);

  // Card number validation & formatting
  const handleCardNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    if (errors.number) setErrors(e => ({ ...e, number: undefined }));
  };

  // Expiry validation & formatting (MM/YY)
  const handleExpiryChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    setExpiry(formatted);
    if (errors.expiry) setErrors(e => ({ ...e, expiry: undefined }));
  };

  // CVC validation
  const handleCvcChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setCvc(cleaned);
    if (errors.cvc) setErrors(e => ({ ...e, cvc: undefined }));
  };

  // Validate card details
  const validateCard = (): boolean => {
    const newErrors: CardErrors = {};
    
    const cardDigits = cardNumber.replace(/\D/g, '');
    if (cardDigits.length !== 16) {
      newErrors.number = 'Card number must be 16 digits';
    }
    
    const expiryParts = expiry.split('/');
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      newErrors.expiry = 'Invalid expiry (MM/YY)';
    } else {
      const month = parseInt(expiryParts[0]);
      const year = parseInt('20' + expiryParts[1]);
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (month < 1 || month > 12) {
        newErrors.expiry = 'Invalid month';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = 'Card expired';
      }
    }
    
    if (cvc.length < 3 || cvc.length > 4) {
      newErrors.cvc = 'CVC must be 3-4 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!packageInfo) return;
    if (!validateCard()) return;
    
    setProcessing(true);
    
    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: packageInfo.id }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        router.push('/topup?error=' + encodeURIComponent(data.error || 'Payment failed'));
        return;
      }
      
      router.push('/live?topup=success&mangos=' + packageInfo.totalMangos);
    } catch {
      router.push('/topup?error=' + encodeURIComponent('Network error'));
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();

  if (loading) {
    return <PaymentLoading />;
  }

  if (!packageInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No package selected</p>
          <Link href="/topup" className="text-[#d4af37] hover:underline">
            Go to Top Up
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link 
            href="/topup" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          
          <h1 className="text-2xl font-bold text-white mb-2">Complete Payment</h1>
          <p className="text-gray-400">Secure card payment</p>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Package</span>
            <span className="text-2xl font-bold text-white">{packageInfo.displayPrice}</span>
          </div>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <span className="text-gray-400">You receive</span>
            <div className="flex items-center gap-2">
              <Image src="/mango.svg" alt="Mango" width={24} height={24} />
              <span className="text-xl font-bold text-[#d4af37]">
                {formatNumber(packageInfo.totalMangos)}
              </span>
            </div>
          </div>
          
          {packageInfo.bonusPercent > 0 && (
            <div className="text-right text-sm text-emerald-400 mt-1">
              +{packageInfo.bonusPercent}% bonus included
            </div>
          )}
        </div>

        {/* Payment Form */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Payment Details
          </div>
          
          {/* Card Number */}
          <div className="mb-4">
            <label className="text-gray-500 text-xs block mb-1.5">Card Number</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => handleCardNumberChange(e.target.value)}
              placeholder="1234 5678 9012 3456"
              className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition ${
                errors.number 
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/50' 
                  : 'border-gray-700 focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50'
              }`}
            />
            {errors.number && (
              <p className="text-red-400 text-xs mt-1">{errors.number}</p>
            )}
          </div>
          
          {/* Expiry & CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-gray-500 text-xs block mb-1.5">Expiry Date</label>
              <input
                type="text"
                value={expiry}
                onChange={(e) => handleExpiryChange(e.target.value)}
                placeholder="MM/YY"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition ${
                  errors.expiry 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/50' 
                    : 'border-gray-700 focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50'
                }`}
              />
              {errors.expiry && (
                <p className="text-red-400 text-xs mt-1">{errors.expiry}</p>
              )}
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1.5">CVC</label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => handleCvcChange(e.target.value)}
                placeholder="123"
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none transition ${
                  errors.cvc 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500/50' 
                    : 'border-gray-700 focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37]/50'
                }`}
              />
              {errors.cvc && (
                <p className="text-red-400 text-xs mt-1">{errors.cvc}</p>
              )}
            </div>
          </div>
        </div>

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={processing}
          className="w-full py-4 bg-gradient-to-r from-[#d4af37] via-yellow-500 to-[#d4af37] text-black text-lg font-bold rounded-xl hover:opacity-90 transition disabled:opacity-50 shadow-[0_0_30px_rgba(212,175,55,0.25)]"
        >
          {processing ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔒 Pay {packageInfo.displayPrice}
            </span>
          )}
        </button>

        <p className="text-center text-gray-600 text-xs mt-4">
          Demo mode • No real payment processed
        </p>

        {/* Security badges */}
        <div className="flex justify-center gap-6 mt-6 text-gray-600 text-xs">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            256-bit SSL
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure
          </span>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  );
}
