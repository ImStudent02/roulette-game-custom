'use client';

import { useState, useEffect } from 'react';

interface AuthModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: { username: string; displayName: string; token: string }) => void;
}

type AuthStep = 'choice' | 'login' | 'signup-email' | 'signup-otp' | 'signup-details';

export default function AuthModalV2({ isOpen, onClose, onAuthSuccess }: AuthModalV2Props) {
  const [step, setStep] = useState<AuthStep>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [otp, setOtp] = useState('');
  const [debugOtp, setDebugOtp] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('choice');
      setError('');
      setEmail('');
      setPassword('');
      setUsername('');
      setDisplayName('');
      setDob('');
      setOtp('');
      setDebugOtp('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'signup' }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to send OTP');
        return;
      }
      
      // In dev mode, show debug OTP
      if (data.debug_otp) {
        setDebugOtp(data.debug_otp);
      }
      
      setStep('signup-otp');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, purpose: 'signup' }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Invalid OTP');
        return;
      }
      
      setStep('signup-details');
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    
    // Ensure username starts with @
    const finalUsername = username.startsWith('@') ? username : `@${username}`;
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          username: finalUsername,
          displayName: displayName || username.replace('@', ''),
          dob,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }
      
      onAuthSuccess({
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token,
      });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.includes('@') && !email.startsWith('@') ? email : undefined,
          username: email.startsWith('@') ? email : undefined,
          password,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      onAuthSuccess({
        username: data.user.username,
        displayName: data.user.displayName,
        token: data.token,
      });
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md glass-card p-6 sm:p-8 rounded-2xl border border-[rgba(212,175,55,0.3)] relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl"
        >
          ×
        </button>

        {/* Choice Step */}
        {step === 'choice' && (
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold title-gradient mb-2">Welcome to LIVE WHEEL</h2>
            <p className="text-gray-400 mb-8">Play with 🍋 trial currency or 🥭 real mangos!</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setStep('login')}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all"
              >
                Login
              </button>
              
              <button
                onClick={() => setStep('signup-email')}
                className="w-full py-4 bg-gray-700/50 text-white font-bold text-lg rounded-xl hover:bg-gray-600/50 transition-all border border-gray-600"
              >
                Create Account
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <div className="text-sm text-yellow-400">🎁 New players get 100 🍋 Fermented Mangos FREE!</div>
            </div>
          </div>
        )}

        {/* Login Step */}
        {step === 'login' && (
          <div>
            <button onClick={() => setStep('choice')} className="text-gray-500 hover:text-white mb-4 text-sm">
              ← Back
            </button>
            
            <h2 className="text-2xl font-bold title-gradient mb-6">Login</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email or @username</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com or @username"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                onClick={handleLogin}
                disabled={loading || !email || !password}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        )}

        {/* Signup Email Step */}
        {step === 'signup-email' && (
          <div>
            <button onClick={() => setStep('choice')} className="text-gray-500 hover:text-white mb-4 text-sm">
              ← Back
            </button>
            
            <h2 className="text-2xl font-bold title-gradient mb-2">Create Account</h2>
            <p className="text-gray-400 text-sm mb-6">Step 1 of 3: Verify your email</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                onClick={handleSendOTP}
                disabled={loading || !email}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </div>
          </div>
        )}

        {/* Signup OTP Step */}
        {step === 'signup-otp' && (
          <div>
            <button onClick={() => setStep('signup-email')} className="text-gray-500 hover:text-white mb-4 text-sm">
              ← Back
            </button>
            
            <h2 className="text-2xl font-bold title-gradient mb-2">Verify Email</h2>
            <p className="text-gray-400 text-sm mb-6">Step 2 of 3: Enter the code sent to {email}</p>
            
            {debugOtp && (
              <div className="bg-blue-500/20 border border-blue-500/30 p-3 rounded-lg mb-4">
                <div className="text-xs text-blue-400">DEBUG: Your OTP is <span className="font-mono font-bold">{debugOtp}</span></div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">6-Digit Code</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>
              
              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full py-2 text-gray-400 text-sm hover:text-white transition-colors"
              >
                Resend Code
              </button>
            </div>
          </div>
        )}

        {/* Signup Details Step */}
        {step === 'signup-details' && (
          <div>
            <h2 className="text-2xl font-bold title-gradient mb-2">Almost Done!</h2>
            <p className="text-gray-400 text-sm mb-6">Step 3 of 3: Set up your account</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm block mb-1">Username (starts with @)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_@]/g, '').slice(0, 20))}
                  placeholder="@coolplayer"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value.slice(0, 30))}
                  placeholder="Cool Player"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Date of Birth (must be 18+)</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              <div>
                <label className="text-gray-400 text-sm block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]"
                />
              </div>
              
              {error && <div className="text-red-400 text-sm">{error}</div>}
              
              <button
                onClick={handleRegister}
                disabled={loading || !username || !password || !dob}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : '🎉 Create Account & Get 100 🍋'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
