'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Package {
  id: string;
  usd: number;
  baseMangos: number;
  bonusPercent: number;
  totalMangos: number;
  displayPrice: string;
  hasBonus: boolean;
}

// Loading fallback
function TopUpLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
      </div>
    </div>
  );
}

function TopUpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
    // Check for error from payment redirect
    const error = searchParams.get('error');
    if (error) setErrorMsg(error);
  }, [searchParams]);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/wallet/topup');
      const data = await res.json();
      setPackages(data.packages || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Navigate to payment page with package info
  const goToPayment = () => {
    if (!selectedPackage) return;
    const params = new URLSearchParams({
      package: selectedPackage.id,
      usd: selectedPackage.usd.toString(),
      mangos: selectedPackage.totalMangos.toString(),
      price: selectedPackage.displayPrice,
      bonus: selectedPackage.bonusPercent.toString(),
    });
    router.push(`/payment?${params.toString()}`);
  };

  const formatNumber = (num: number) => num.toLocaleString();

  const getBadgeColor = (percent: number): string => {
    if (percent >= 15) return 'bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-400 text-black';
    if (percent >= 10) return 'bg-gradient-to-r from-purple-400 to-violet-500 text-white';
    if (percent >= 5) return 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white';
    if (percent >= 2) return 'bg-gradient-to-r from-teal-400 to-emerald-500 text-black';
    return 'bg-gradient-to-r from-green-400 to-emerald-500 text-black';
  };

  const getCardGlow = (percent: number): string => {
    if (percent >= 15) return 'shadow-[0_0_40px_rgba(251,191,36,0.3)] hover:shadow-[0_0_60px_rgba(251,191,36,0.5)]';
    if (percent >= 10) return 'shadow-[0_0_30px_rgba(139,92,246,0.25)] hover:shadow-[0_0_50px_rgba(139,92,246,0.4)]';
    if (percent >= 5) return 'shadow-[0_0_25px_rgba(59,130,246,0.2)] hover:shadow-[0_0_40px_rgba(59,130,246,0.35)]';
    if (percent > 0) return 'shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_35px_rgba(34,197,94,0.3)]';
    return 'hover:shadow-[0_0_25px_rgba(255,255,255,0.1)]';
  };

  const getAccentColor = (percent: number): string => {
    if (percent >= 15) return 'from-amber-400 to-yellow-500';
    if (percent >= 10) return 'from-purple-400 to-violet-500';
    if (percent >= 5) return 'from-blue-400 to-cyan-500';
    if (percent > 0) return 'from-green-400 to-emerald-500';
    return 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#d4af37]/30 border-t-[#d4af37] rounded-full animate-spin" />
          <Image src="/mango.svg" alt="Loading" width={32} height={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.05),transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <Link 
            href="/live" 
            className="inline-flex items-center gap-2 text-gray-400 hover:text-[#d4af37] transition-colors mb-6"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Game
          </Link>
          
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Image src="/mango.svg" alt="Mangos" width={64} height={64} className="drop-shadow-2xl" />
              <div className="absolute -inset-4 bg-[#d4af37]/20 blur-2xl rounded-full -z-10" />
            </div>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-black mb-3">
            <span className="bg-gradient-to-r from-[#d4af37] via-yellow-400 to-[#d4af37] bg-clip-text text-transparent">
              GET MANGOS
            </span>
          </h1>
          <p className="text-gray-400 text-lg">Purchase mangos and win real Mango Juice!</p>
          
          {/* Value info */}
          <div className="inline-flex items-center gap-3 mt-5 px-5 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-full">
            <span className="text-emerald-400 font-semibold">1 USD = 1,000 Mangos</span>
          </div>
        </div>

        {/* Packages Grid - Clean 4-column layout */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {packages.map((pkg) => {
            const isSelected = selectedPackage?.id === pkg.id;
            
            return (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                  isSelected ? 'scale-[1.02]' : ''
                }`}
              >
                {/* Bonus Badge - Clean positioning */}
                {pkg.hasBonus && (
                  <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 ${getBadgeColor(pkg.bonusPercent)} px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                    +{pkg.bonusPercent}%
                  </div>
                )}
                
                {/* Card */}
                <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 h-full ${
                  isSelected 
                    ? 'border-[#d4af37] bg-[#d4af37]/5' 
                    : 'border-gray-800 hover:border-gray-700 bg-gray-900/90'
                } ${getCardGlow(pkg.bonusPercent)}`}>
                  
                  {/* Content */}
                  <div className="p-5 pt-6 flex flex-col items-center">
                    {/* Price */}
                    <div className="text-center mb-4">
                      <div className="text-3xl sm:text-4xl font-black text-white">
                        {pkg.displayPrice}
                      </div>
                      <div className="text-gray-500 text-xs uppercase tracking-wider mt-0.5">USD</div>
                    </div>
                    
                    {/* Mangos Display */}
                    <div className="flex items-center gap-2 mb-3">
                      <Image src="/mango.svg" alt="Mango" width={28} height={28} />
                      <span className={`text-xl font-bold bg-gradient-to-r ${getAccentColor(pkg.bonusPercent)} bg-clip-text text-transparent`}>
                        {formatNumber(pkg.totalMangos)}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-3">Mangos</div>
                    
                    {/* Bonus breakdown */}
                    {pkg.hasBonus && (
                      <div className="text-center text-xs text-gray-500 border-t border-gray-800 pt-3 w-full">
                        <span>{formatNumber(pkg.baseMangos)} base</span>
                        <span className="mx-1.5">+</span>
                        <span className={`bg-gradient-to-r ${getAccentColor(pkg.bonusPercent)} bg-clip-text text-transparent font-semibold`}>
                          {formatNumber(pkg.totalMangos - pkg.baseMangos)} bonus
                        </span>
                      </div>
                    )}
                    
                    {/* Confirm button on selected card */}
                    {isSelected && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToPayment();
                        }}
                        className="mt-4 w-full py-2.5 bg-gradient-to-r from-[#d4af37] via-yellow-500 to-[#d4af37] text-black font-bold rounded-lg hover:opacity-90 transition shadow-lg"
                      >
                        Confirm →
                      </button>
                    )}
                    
                    {/* Selection check */}
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="w-5 h-5 bg-[#d4af37] rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error from payment redirect */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-center">
            <span className="text-red-400">❌ {errorMsg}</span>
            <button 
              onClick={() => setErrorMsg(null)}
              className="ml-3 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}



        {/* Trust Footer */}
        <div className="flex flex-wrap justify-center items-center gap-6 py-6 border-t border-gray-800/50">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Instant
          </div>
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Safe
          </div>
        </div>
      </div>
    </div>
  );
}

// Main export wrapped in Suspense
export default function TopUpPage() {
  return (
    <Suspense fallback={<TopUpLoading />}>
      <TopUpContent />
    </Suspense>
  );
}
