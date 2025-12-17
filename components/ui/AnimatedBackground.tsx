'use client';

/**
 * Premium Animated Casino Background
 * 
 * Features:
 * - Floating gold particles
 * - Animated aurora/gradient waves
 * - Subtle roulette wheel silhouettes
 * - Responsive and performant
 */

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d15] to-[#08080c]"></div>
      
      {/* Animated aurora/wave gradients */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#d4af37]/8 rounded-full blur-[150px]"
          style={{
            animation: 'float 20s ease-in-out infinite',
          }}
        ></div>
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#d4af37]/6 rounded-full blur-[120px]"
          style={{
            animation: 'float 25s ease-in-out infinite reverse',
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/4 rounded-full blur-[100px]"
          style={{
            animation: 'pulse 15s ease-in-out infinite',
          }}
        ></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#d4af37]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle ${10 + Math.random() * 20}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Decorative roulette wheel silhouettes */}
      <div className="absolute -top-20 -right-20 w-80 h-80 opacity-[0.03]">
        <div 
          className="w-full h-full rounded-full border-[8px] border-[#d4af37]"
          style={{ animation: 'spin 60s linear infinite' }}
        >
          <div className="absolute inset-4 rounded-full border-2 border-[#d4af37]"></div>
          <div className="absolute inset-8 rounded-full border border-[#d4af37]"></div>
        </div>
      </div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 opacity-[0.02]">
        <div 
          className="w-full h-full rounded-full border-[8px] border-[#d4af37]"
          style={{ animation: 'spin 80s linear infinite reverse' }}
        >
          <div className="absolute inset-4 rounded-full border-2 border-[#d4af37]"></div>
        </div>
      </div>

      {/* Subtle grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #d4af37 1px, transparent 1px),
            linear-gradient(to bottom, #d4af37 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      ></div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.5)_100%)]"></div>

      {/* Keyframe styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 40px) scale(0.95); }
          75% { transform: translate(30px, 20px) scale(1.02); }
        }
        @keyframes particle {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.04; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.08; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </div>
  );
}
