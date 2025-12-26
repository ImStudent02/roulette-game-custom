'use client';

import Footer from '@/components/ui/Footer';

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Terms of Use</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last updated: December 2024</p>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using The House of the Mango Devil ("the Game"), you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Use. If you do not agree to these terms, 
              please do not use the Game.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Eligibility</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 18 years of age to use this Game.</li>
              <li>You must provide accurate information during registration.</li>
              <li>You are responsible for maintaining the confidentiality of your account.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Game Description</h2>
            <p>
              The House of the Mango Devil is a roulette-style game featuring a wheel with 51 positions. 
              The game operates with its own internal currency system:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Trial Mode:</strong> Play with Fermented Mangos (free trial currency) - no real value.</li>
              <li><strong>Real Mode:</strong> Play with Mangos (purchased currency) - 1000 Mangos = $1 USD.</li>
              <li>Winnings are paid in Mango Juice, which can be withdrawn as real money.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Game Rules</h2>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">4.1 Wheel Structure</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>The wheel contains 51 positions: Numbers 1-50, plus one special symbol 'X'.</li>
              <li>Base Colors: Numbers are either Black or White. 'X' is a special Black slot.</li>
              <li>Outer Ring Multipliers: Segments may have Green, Pink, Red, or Gold overlays.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">4.2 Betting Options & Payouts</h3>
            <table className="w-full border-collapse mt-2">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2">Bet Type</th>
                  <th className="text-right py-2">Payout</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800"><td className="py-2">Single Number</td><td className="text-right">24x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Black / White</td><td className="text-right">1.9x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Even / Odd</td><td className="text-right">1.8x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Green Overlay</td><td className="text-right">4.9x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Pink Overlay</td><td className="text-right">4.9x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Red Overlay</td><td className="text-right">24x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Gold Overlay</td><td className="text-right">50-200x</td></tr>
                <tr className="border-b border-gray-800"><td className="py-2">Special 'X' Symbol</td><td className="text-right">24x (or 1x refund)</td></tr>
              </tbody>
            </table>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">4.3 Round Timing</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each round has a betting phase (approximately 3-4 minutes).</li>
              <li>Bets lock before the wheel spins.</li>
              <li>You may remove bets before the lock phase.</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">4.4 Bet Limits</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maximum bets per round are dynamically calculated.</li>
              <li>The house may limit bets based on available funds.</li>
              <li>Betting may be temporarily disabled during low house fund periods.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. House Protection System</h2>
            <p>
              The Game employs a House Protection System to ensure sustainability. This system:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Dynamically adjusts bet limits based on house fund balance.</li>
              <li>May influence outcome probabilities within legal gambling parameters.</li>
              <li>Ensures the house maintains operational reserves.</li>
            </ul>
            <p className="mt-4 text-yellow-500 font-semibold bg-yellow-500/10 p-3 rounded border border-yellow-500/30">
              ⚠️ This is a luck-based system. Outcomes are unpredictable and winning is never guaranteed. Please make your choices wisely and play responsibly.
            </p>
            <p className="mt-4 text-gray-300">
              The game uses transparent probability distributions. You can review our open-source
              hyperparameters on <a href="https://github.com/ImStudent02/roulette-game-custom/blob/main/README-HYPERPARAMS.md" target="_blank" className="text-purple-400 hover:text-purple-300 underline">GitHub</a> to understand how outcomes are derived.
            </p>

            <div className="mt-4 bg-blue-500/10 p-4 rounded border border-blue-500/30">
              <p className="text-sm text-gray-300">
                <span className="text-blue-400 font-bold block mb-2">IMPORTANT: UI Visualization</span> 
                The spinning wheel on your screen is <strong>NOT free-moving</strong> physics. It is a visual representation 
                controlled entirely by the server. 
                <br /><br />
                The backend determines the result mathematically before the wheel stops. The client-side animation 
                is programmed to land exactly on the server's predetermined outcome. Visual glitches or client-side lag 
                do not affect the official result.
              </p>
            </div>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Deposits & Withdrawals</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Deposits:</strong> You purchase "Mangos" (Game Currency) with real money. Mangos cannot be withdrawn directly.</li>
              <li><strong>Winnings:</strong> Winnings are paid in "Mango Juice". Only Mango Juice can be withdrawn as real money.</li>
              <li><strong>Zero-Restriction Withdrawal:</strong> You may withdraw any amount of Mango Juice at any time.</li>
              <li><strong>Conversion Rules:</strong>
                <ul className="list-disc pl-6 mt-1 text-gray-400">
                  <li>✅ Real Money → Mangos (Purchase)</li>
                  <li>✅ Mangos → Game Play → Mango Juice (Winning)</li>
                  <li>✅ Mango Juice → Real Money (Withdrawal)</li>
                  <li>✅ Mango Juice → Mangos (Re-investing)</li>
                  <li>❌ Mangos → Real Money (Strictly Prohibited - Anti-Money Laundering)</li>
                  <li>❌ Mangos → Mango Juice (Direct conversion not possible. You must play and win.)</li>
                </ul>
              </li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Prohibited Activities</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Using bots, scripts, or automated systems.</li>
              <li>Exploiting bugs or system vulnerabilities.</li>
              <li>Creating multiple accounts.</li>
              <li>Collusion with other players.</li>
              <li>Money laundering or fraudulent activity.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Responsible Gaming</h2>
            <p>
              We encourage responsible gaming practices:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Set personal deposit and loss limits.</li>
              <li>Take regular breaks from gaming.</li>
              <li>Never chase losses.</li>
              <li>Do not gamble with money you cannot afford to lose.</li>
            </ul>
            <p className="mt-4">
              If you believe you have a gambling problem, please seek help from professional 
              organizations such as Gamblers Anonymous.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Disclaimer</h2>
            <p>
              THE GAME IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE 
              WINNINGS OR SPECIFIC OUTCOMES. GAMBLING INVOLVES RISK AND YOU MAY LOSE MONEY.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Continued use of the Game 
              after changes constitutes acceptance of the new terms.
            </p>
          </section>
          
          <div className="mt-8 pt-8 border-t border-gray-700">
            <a href="/live" className="text-purple-400 hover:text-purple-300">← Back to Game</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
