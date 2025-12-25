'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface DailyClaimPopupProps {
  onClose: () => void;
  onClaimed?: (reward: number) => void;
}

export default function DailyClaimPopup({ onClose, onClaimed }: DailyClaimPopupProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [hoursUntilClaim, setHoursUntilClaim] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(100);
  const [streak, setStreak] = useState(0);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkClaimStatus();
  }, []);

  const checkClaimStatus = async () => {
    try {
      const res = await fetch('/api/daily-claim');
      if (res.ok) {
        const data = await res.json();
        setCanClaim(data.canClaim);
        setHoursUntilClaim(data.hoursUntilClaim);
        setRewardAmount(data.rewardAmount);
        setStreak(data.streak);
      }
    } catch (err) {
      console.error('Failed to check claim status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const res = await fetch('/api/daily-claim', { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        setClaimed(true);
        setClaimedAmount(data.reward);
        setStreak(data.streak);
        onClaimed?.(data.reward);
      }
    } catch (err) {
      console.error('Failed to claim:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return null;
  if (!canClaim && !claimed) return null; // Don't show if can't claim

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] rounded-3xl p-8 max-w-md w-full border border-[#d4af37]/30 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          ✕
        </button>

        {/* Claimed state */}
        {claimed ? (
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">Reward Claimed!</h2>
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-yellow-400 mb-4">
              <Image src="/rotten-mango.svg" alt="Fermented Mango" width={40} height={40} />
              +{claimedAmount}
            </div>
            {streak > 1 && (
              <p className="text-purple-400 mb-4">
                🔥 {streak} day streak bonus!
              </p>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition"
            >
              Awesome!
            </button>
          </div>
        ) : (
          <>
            {/* Unclaimed state */}
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h2 className="text-2xl font-bold text-white mb-2">Daily Reward!</h2>
              <p className="text-gray-400 mb-6">Claim your free trial currency</p>

              <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-center gap-3 text-4xl font-bold text-yellow-400 mb-2">
                  <Image src="/rotten-mango.svg" alt="Fermented Mango" width={48} height={48} />
                  {rewardAmount}
                </div>
                <p className="text-gray-400 text-sm">Fermented Mangos</p>
                
                {streak > 0 && (
                  <div className="mt-4 text-sm text-purple-400">
                    🔥 {streak + 1} day streak = +{Math.min(streak, 6) * 10}% bonus!
                  </div>
                )}
              </div>

              <button
                onClick={handleClaim}
                disabled={claiming}
                className={`w-full py-4 rounded-xl font-bold text-lg transition ${
                  claiming
                    ? 'bg-gray-700 text-gray-400 cursor-wait'
                    : 'bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:opacity-90'
                }`}
              >
                {claiming ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Claiming...
                  </span>
                ) : (
                  'Claim Now!'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
