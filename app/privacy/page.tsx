'use client';

import Footer from '@/components/ui/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-gray-300">
          <p className="text-sm text-gray-400">Last updated: December 2024</p>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Introduction</h2>
            <p>
              The House of the Mango Devil ("we", "our", "the Game") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">2.1 Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Username and display name</li>
              <li>Email address (encrypted)</li>
              <li>Date of birth (for age verification)</li>
              <li>Password (hashed, never stored in plain text)</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">2.2 Gameplay Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Betting history and patterns</li>
              <li>Wins, losses, and transaction records</li>
              <li>Currency balances</li>
              <li>Round participation data</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">2.3 Analytics & Behavioral Data</h3>
            <p>For research purposes, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Session duration and frequency</li>
              <li>Page views and navigation patterns</li>
              <li>Betting behavior (timing, amounts, cancellations)</li>
              <li>Chat activity</li>
              <li>Device information (browser, screen size)</li>
            </ul>
            <p className="mt-4 text-sm bg-gray-800 p-4 rounded">
              <strong>Research Purpose:</strong> This behavioral data is collected for academic research 
              on gambling patterns, risk assessment, and responsible gaming initiatives. It helps us 
              identify potentially problematic gambling behavior and develop harm reduction features.
            </p>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4 mb-2">2.4 Technical Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address (for security and fraud prevention)</li>
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>Login timestamps</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Delivery:</strong> To operate the Game and process transactions.</li>
              <li><strong>Account Security:</strong> To verify identity and prevent fraud.</li>
              <li><strong>Customer Support:</strong> To assist with inquiries and issues.</li>
              <li><strong>Research:</strong> To study gambling behavior and improve responsible gaming features.</li>
              <li><strong>Legal Compliance:</strong> To meet regulatory requirements.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Data Storage & Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data is stored on secure servers.</li>
              <li>Passwords are hashed using industry-standard bcrypt.</li>
              <li>Email addresses are encrypted with AES-256.</li>
              <li>Analytics data is stored in a separate database.</li>
              <li>Regular security audits are performed.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Data Sharing</h2>
            <p>We do NOT sell your personal information. We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Payment Processors:</strong> To process deposits and withdrawals.</li>
              <li><strong>Legal Authorities:</strong> When required by law or court order.</li>
              <li><strong>Research Partners:</strong> Anonymized, aggregated data for academic research.</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Cookies & Tracking</h2>
            <p>We use cookies for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Session Management:</strong> To keep you logged in.</li>
              <li><strong>Preferences:</strong> To remember your settings.</li>
              <li><strong>Analytics:</strong> To understand usage patterns.</li>
            </ul>
            <p className="mt-4">
              You can disable cookies in your browser, but this may affect functionality.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong>Access:</strong> Request a copy of your data.</li>
              <li><strong>Correction:</strong> Update inaccurate information.</li>
              <li><strong>Deletion:</strong> Request account deletion (subject to legal retention requirements).</li>
              <li><strong>Opt-out:</strong> Disable analytics tracking (contact support).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Data Retention</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account data: Retained while account is active, plus 5 years.</li>
              <li>Transaction records: Retained for 7 years (legal requirement).</li>
              <li>Analytics data: Retained for research purposes indefinitely (anonymized).</li>
            </ul>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Age Verification</h2>
            <p>
              We verify that users are 18 years or older at registration. We do not knowingly collect 
              information from minors. If we discover an underage user, their account will be 
              terminated and data deleted.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. International Users</h2>
            <p>
              Your data may be processed in countries with different data protection laws. 
              By using the Game, you consent to this transfer.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant 
              changes via email or in-app notification.
            </p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-white mb-4">12. Contact Us</h2>
            <p>
              For privacy-related inquiries, contact us at: <span className="text-purple-400">privacy@mangodevil.game</span>
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
