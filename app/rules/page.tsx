'use client';

import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen py-8 px-4 relative">
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold title-gradient">Game Rules</h1>
          <div className="flex items-center gap-2">
            <Link 
              href="/story"
              className="px-3 py-2 bg-gradient-to-r from-[#b45309] to-[#92400e] text-white text-sm font-bold rounded-lg hover:shadow-lg hover:shadow-[#fbbf24]/30 transition-all flex items-center gap-1"
            >
              <span>🥭</span>
              <span className="hidden sm:inline">Story</span>
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Back to Game
            </Link>
          </div>
        </div>

        {/* Rules Content */}
        <div className="space-y-8">
          
          {/* Wheel Description */}
          <section className="glass-card p-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <span>🎡</span> The Wheel
            </h2>
            <p className="text-gray-300 mb-4">
              Our unique roulette wheel has <strong className="text-white">51 numbers</strong>: 1-50 plus X. 
              The numbers alternate between <span className="text-white font-bold">black</span> and <span className="text-gray-200 font-bold">white</span>.
            </p>
            <p className="text-gray-300">
              The outer ring has special color positions that change every round:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3 text-center">
                <div className="text-green-400 font-bold">Green</div>
                <div className="text-gray-400 text-sm">4.9x payout</div>
              </div>
              <div className="bg-pink-600/20 border border-pink-500/30 rounded-lg p-3 text-center">
                <div className="text-pink-400 font-bold">Pink</div>
                <div className="text-gray-400 text-sm">4.9x payout</div>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-lg p-3 text-center">
                <div className="text-yellow-400 font-bold">Gold ✨</div>
                <div className="text-gray-400 text-sm">50x-200x</div>
              </div>
              <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-3 text-center">
                <div className="text-red-400 font-bold">Red</div>
                <div className="text-gray-400 text-sm">Near gold</div>
              </div>
            </div>
          </section>

          {/* Bet Types */}
          <section className="glass-card p-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <span>🎲</span> Bet Types & Payouts
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#d4af37]/30">
                    <th className="py-3 px-2 text-[#d4af37]">Bet Type</th>
                    <th className="py-3 px-2 text-[#d4af37]">Description</th>
                    <th className="py-3 px-2 text-[#d4af37]">Payout</th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold">Black / White</td>
                    <td className="py-3 px-2">Bet on the inner color</td>
                    <td className="py-3 px-2 text-green-400">1.9x</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold">Even / Odd</td>
                    <td className="py-3 px-2">Bet on number type</td>
                    <td className="py-3 px-2 text-green-400">1.8x</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold text-green-400">Green</td>
                    <td className="py-3 px-2">Outer ring is green</td>
                    <td className="py-3 px-2 text-green-400">4.9x</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold text-pink-400">Pink</td>
                    <td className="py-3 px-2">Outer ring is pink</td>
                    <td className="py-3 px-2 text-green-400">4.9x</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold text-yellow-400">Gold ✨</td>
                    <td className="py-3 px-2">Outer ring is gold (rare!)</td>
                    <td className="py-3 px-2 text-yellow-400">50x - 200x</td>
                  </tr>
                  <tr className="border-b border-white/10">
                    <td className="py-3 px-2 font-bold">Number</td>
                    <td className="py-3 px-2">Bet on specific number</td>
                    <td className="py-3 px-2 text-green-400">24x</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-2 font-bold">X</td>
                    <td className="py-3 px-2">Bet on X = 24x win. If X lands but you bet elsewhere = 1x refund</td>
                    <td className="py-3 px-2 text-green-400">24x / 1x*</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Gold Mystery */}
          <section className="glass-card p-6 border-2 border-yellow-500/30">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <span>✨</span> Gold Mystery Multiplier
            </h2>
            <p className="text-gray-300 mb-4">
              The Gold multiplier is <strong className="text-yellow-400">hidden until the result</strong>! 
              It can be 50x, 100x, 150x, or 200x.
            </p>
            <p className="text-gray-300">
              <strong className="text-white">Bonus:</strong> If you bet on a number and it lands on Gold, 
              you get the <span className="text-yellow-400">Gold multiplier</span> instead of the regular 24x!
            </p>
          </section>

          {/* X Special Rule */}
          <section className="glass-card p-6 border-2 border-purple-500/30">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <span>✖️</span> X Special Rule
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h3 className="text-lg font-bold text-purple-300 mb-2">Bet on X & Win</h3>
                <p className="text-gray-400 text-sm">
                  If you bet on X and X lands → <span className="text-green-400 font-bold">24x payout!</span>
                </p>
              </div>
              <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h3 className="text-lg font-bold text-purple-300 mb-2">X Lands, You Didn't Bet X</h3>
                <p className="text-gray-400 text-sm">
                  If X lands but you bet elsewhere → <span className="text-yellow-400 font-bold">1x refund</span> (bet returned)
                </p>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-3 italic">
              X acts as a "safety net" - you never fully lose if X lands!
            </p>
          </section>

          {/* Game Modes */}
          <section className="glass-card p-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <span>🎮</span> Game Modes
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-black/40 rounded-lg p-4 border border-white/10">
                <h3 className="text-lg font-bold text-white mb-2">Single Player</h3>
                <p className="text-gray-400 text-sm">Spin whenever you want. Practice your strategy!</p>
                <Link href="/" className="text-[#d4af37] text-sm hover:underline mt-2 inline-block">
                  Play Single Player →
                </Link>
              </div>
              <div className="bg-black/40 rounded-lg p-4 border border-[#d4af37]/30">
                <h3 className="text-lg font-bold text-[#d4af37] mb-2">Live Mode</h3>
                <p className="text-gray-400 text-sm">
                  Real-time multiplayer! Same wheel, same result for everyone.
                </p>
                <Link href="/live" className="text-[#d4af37] text-sm hover:underline mt-2 inline-block">
                  Play Live →
                </Link>
              </div>
            </div>
          </section>

          {/* Live Mode Phases */}
          <section className="glass-card p-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <span>⏱️</span> Live Mode Phases
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-24 text-green-400 font-bold">Betting</div>
                <div className="flex-1 bg-green-500/20 rounded h-4"></div>
                <div className="text-gray-400 text-sm">3:30</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 text-yellow-400 font-bold">Locked</div>
                <div className="w-8 bg-yellow-500/20 rounded h-4"></div>
                <div className="text-gray-400 text-sm">30s</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 text-blue-400 font-bold">Spinning</div>
                <div className="w-12 bg-blue-500/20 rounded h-4"></div>
                <div className="text-gray-400 text-sm">15s</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-24 text-purple-400 font-bold">Result</div>
                <div className="w-16 bg-purple-500/20 rounded h-4"></div>
                <div className="text-gray-400 text-sm">60s</div>
              </div>
            </div>
          </section>

          {/* Tips */}
          <section className="glass-card p-6 bg-gradient-to-br from-[#d4af37]/10 to-transparent">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <span>💡</span> Tips
            </h2>
            <ul className="text-gray-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">•</span>
                Start with smaller bets to learn the game
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">•</span>
                Gold position changes every round - watch for it!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">•</span>
                Number bets + Gold landing = big bonus!
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">•</span>
                Play responsibly - it's entertainment, not income
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#d4af37]">•</span>
                & House edge exists. Covering more won’t make you smarter.
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p> • Sad reality but this game was never in your favor • </p>
          <p>Play responsibly. The game won’t save your pocket — only your choices can.</p>
          <p>"So tell me, sweetie… feeling lucky, or just curious?"</p>
        </div>
      </div>
    </div>
  );
}
