'use client';

import { useState, memo } from 'react';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuth: (user: { email: string; name: string }) => void;
};

const AuthModal = ({ isOpen, onClose, onAuth }: AuthModalProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (mode === 'signup' && !name) {
      setError('Please enter your name');
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock authentication - store in localStorage
    const user = {
      email,
      name: name || email.split('@')[0],
    };
    
    localStorage.setItem('liveRouletteUser', JSON.stringify(user));
    
    setLoading(false);
    onAuth(user);
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card p-8 w-full max-w-md mx-4 border border-[#d4af37]/30">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          ✕
        </button>
        
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold title-gradient mb-2">
            {mode === 'login' ? 'Welcome Back!' : 'Join the Game'}
          </h2>
          <p className="text-gray-400">
            {mode === 'login' 
              ? 'Login to play LIVE Roulette' 
              : 'Create an account to start playing'}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-gray-800/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-3 bg-gray-800/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-800/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-[#f4d03f] via-[#d4af37] to-[#b8860b] text-black font-bold rounded-xl text-lg hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                {mode === 'login' ? 'Logging in...' : 'Creating account...'}
              </span>
            ) : (
              mode === 'login' ? 'Login' : 'Create Account'
            )}
          </button>
        </form>
        
        {/* Switch mode */}
        <div className="mt-6 text-center text-gray-400">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-[#d4af37] hover:underline font-medium"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-[#d4af37] hover:underline font-medium"
              >
                Login
              </button>
            </>
          )}
        </div>
        
        {/* Demo note */}
        <div className="mt-4 text-center text-xs text-gray-500">
          🎮 Demo mode: Any email/password works
        </div>
      </div>
    </div>
  );
};

export default memo(AuthModal);
