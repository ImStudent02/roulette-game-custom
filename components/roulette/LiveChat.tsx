'use client';

import { useState, useRef, useEffect, memo } from 'react';

type ChatMessage = {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
};

type LiveChatProps = {
  currentUser?: string;
  className?: string;
};

// Generate random usernames for demo
const randomUsers = ['Player1', 'LuckyJoe', 'GoldHunter', 'WheelMaster', 'BetKing', 'CasinoFan'];

const LiveChat = ({ currentUser = 'You', className = '' }: LiveChatProps) => {
  // Initialize as empty to avoid hydration mismatch
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize messages on client-side only
  useEffect(() => {
    if (!isInitialized) {
      setMessages([
        { id: '1', user: 'System', message: 'Welcome to LIVE Roulette! 🎰', timestamp: new Date(), isSystem: true },
        { id: '2', user: 'LuckyJoe', message: 'Good luck everyone!', timestamp: new Date() },
        { id: '3', user: 'WheelMaster', message: 'Going all in on black 🖤', timestamp: new Date() },
      ]);
      setIsInitialized(true);
    }
  }, [isInitialized]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Simulate random chat messages periodically
  useEffect(() => {
    if (!isInitialized) return;
    
    const randomMessages = [
      'Let\'s go! 🎲',
      'Gold please! 🌟',
      'Come on white!',
      'Black is hot today',
      'Nice win!',
      'So close!',
      'Green for me',
      'Pink is the way',
      '50x incoming 🔥',
    ];
    
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance every interval
        const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
        const randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          user: randomUser,
          message: randomMessage,
          timestamp: new Date()
        }].slice(-50)); // Keep last 50 messages
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isInitialized]);
  
  const handleSend = () => {
    if (!inputValue.trim()) return;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: currentUser,
      message: inputValue.trim(),
      timestamp: new Date()
    }].slice(-50));
    
    setInputValue('');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`glass-card flex flex-col ${className}`} style={{ height: '400px' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#d4af37]/20">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Live Chat
          <span className="text-xs text-gray-400 font-normal ml-auto">
            {messages.length} messages
          </span>
        </h3>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(msg => (
          <div 
            key={msg.id} 
            className={`${msg.isSystem ? 'text-center' : ''}`}
          >
            {msg.isSystem ? (
              <span className="text-xs text-[#d4af37] bg-[#d4af37]/10 px-3 py-1 rounded-full">
                {msg.message}
              </span>
            ) : (
              <div className={`flex flex-col ${msg.user === currentUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${
                    msg.user === currentUser ? 'text-[#d4af37]' : 'text-gray-400'
                  }`}>
                    {msg.user}
                  </span>
                  <span className="text-xs text-gray-600">{formatTime(msg.timestamp)}</span>
                </div>
                <div className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  msg.user === currentUser 
                    ? 'bg-gradient-to-r from-[#d4af37]/30 to-[#b8860b]/30 text-white' 
                    : 'bg-gray-800/80 text-gray-200'
                }`}>
                  {msg.message}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 border-t border-[#d4af37]/20">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-800/80 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(LiveChat);
