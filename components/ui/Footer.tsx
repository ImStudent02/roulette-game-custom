'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900/80 border-t border-gray-800 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
          <Link 
            href="/terms" 
            className="text-gray-400 hover:text-purple-400 transition"
          >
            Terms of Use
          </Link>
          <span className="hidden sm:inline text-gray-600">•</span>
          <Link 
            href="/privacy" 
            className="text-gray-400 hover:text-purple-400 transition"
          >
            Privacy Policy
          </Link>
        </div>
        
        <div className="text-center text-xs text-gray-600 mt-3">
          <span className="text-yellow-500">18+</span> Play Responsibly • © {new Date().getFullYear()} The House of the Mango Devil
        </div>
      </div>
    </footer>
  );
}
