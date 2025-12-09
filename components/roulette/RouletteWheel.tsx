'use client';

import { useRef, useEffect, useState, memo, useMemo } from 'react';
import { WheelPosition } from '@/lib/types';
import { generateAdditionalWheel } from '@/lib/gameUtils';
import * as HyperParams from '@/lib/hyperParams';

const ANGLE_PER_SLOT = 360 / 51;

// Color types for the outer ring
type OuterColor = 'green' | 'pink' | 'gold' | 'red' | 'none';

type RouletteWheelProps = {
  onSpinComplete: (position: WheelPosition, secondPosition?: WheelPosition) => void;
  isSpinning: boolean;
  winningPosition?: WheelPosition;
  secondWinningPosition?: WheelPosition;
  spinTwice?: boolean;
  className?: string;
};

const createFixedWheelLayout = (): WheelPosition[] => {
  return [
    { number: 26, color: 'black' }, { number: 44, color: 'black' },
    { number: 21, color: 'black' }, { number: 20, color: 'black' },
    { number: 33, color: 'black' }, { number: 14, color: 'black' },
    { number: 15, color: 'black' }, { number: 22, color: 'black' },
    { number: 31, color: 'black' }, { number: 43, color: 'black' },
    { number: 48, color: 'black' }, { number: 8, color: 'black' },
    { number: 3, color: 'black' }, { number: 13, color: 'black' },
    { number: 30, color: 'black' }, { number: 18, color: 'black' },
    { number: 24, color: 'black' }, { number: 'X', color: 'black' },
    { number: 41, color: 'white' }, { number: 10, color: 'white' },
    { number: 6, color: 'white' }, { number: 23, color: 'white' },
    { number: 7, color: 'white' }, { number: 2, color: 'white' },
    { number: 27, color: 'white' }, { number: 12, color: 'white' },
    { number: 36, color: 'white' }, { number: 47, color: 'white' },
    { number: 49, color: 'white' }, { number: 4, color: 'white' },
    { number: 45, color: 'white' }, { number: 16, color: 'white' },
    { number: 5, color: 'white' }, { number: 1, color: 'white' },
    { number: 35, color: 'white' }, { number: 17, color: 'black' },
    { number: 42, color: 'white' }, { number: 46, color: 'black' },
    { number: 39, color: 'white' }, { number: 34, color: 'black' },
    { number: 29, color: 'white' }, { number: 28, color: 'black' },
    { number: 11, color: 'white' }, { number: 40, color: 'black' },
    { number: 32, color: 'white' }, { number: 9, color: 'black' },
    { number: 50, color: 'white' }, { number: 19, color: 'black' },
    { number: 38, color: 'white' }, { number: 25, color: 'black' },
    { number: 37, color: 'white' }
  ];
};

const WHEEL_NUMBERS = createFixedWheelLayout();
export { WHEEL_NUMBERS };

// Generate outer color ring: 10 green/pink alternating, 1 gold (random), 4 red (2 before, 2 after gold)
// Rest are 'none' (no special color)
const generateOuterColors = (): OuterColor[] => {
  const colors: OuterColor[] = new Array(51).fill('none');
  
  // Place 10 green/pink alternating in first section (roughly positions 0-9)
  // These are spread across the wheel
  const greenPinkPositions = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45];
  greenPinkPositions.forEach((pos, index) => {
    colors[pos % 51] = index % 2 === 0 ? 'green' : 'pink';
  });
  
  // Pick a random position for gold (not overlapping with existing)
  let goldPosition: number;
  do {
    goldPosition = Math.floor(Math.random() * 51);
  } while (colors[goldPosition] !== 'none');
  
  colors[goldPosition] = 'gold';
  
  // Place 2 red before and 2 red after gold
  const redPositions = [
    (goldPosition - 2 + 51) % 51,
    (goldPosition - 1 + 51) % 51,
    (goldPosition + 1) % 51,
    (goldPosition + 2) % 51
  ];
  
  redPositions.forEach(pos => {
    if (colors[pos] === 'none') {
      colors[pos] = 'red';
    }
  });
  
  return colors;
};

const RouletteWheel = ({
  onSpinComplete,
  isSpinning,
  winningPosition,
  secondWinningPosition,
  spinTwice = false,
  className = '',
}: RouletteWheelProps) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const additionalWheelRef = useRef<HTMLDivElement>(null);
  
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [additionalWheelRotation, setAdditionalWheelRotation] = useState<number>(0);
  const [additionalWheel, setAdditionalWheel] = useState<WheelPosition[]>([]);
  const [activeSpin, setActiveSpin] = useState<boolean>(false);
  const [isResultPhase, setIsResultPhase] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Initialize as empty to avoid hydration mismatch, generate on client mount
  const [outerColors, setOuterColors] = useState<OuterColor[]>([]);
  
  const slowSpinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedSpinRef = useRef<boolean>(false);
  
  const winPositionRef = useRef<WheelPosition | null>(null);
  const secondWinPositionRef = useRef<WheelPosition | null>(null);

  // Responsive wheel size - will be controlled via CSS
  const wheelSize = 420;
  
  // Generate random colors on client-side only to avoid hydration mismatch
  useEffect(() => {
    setOuterColors(generateOuterColors());
    setAdditionalWheel(generateAdditionalWheel());
    setIsMounted(true);
  }, []);
  
  // Get the gold position index
  const goldIndex = useMemo(() => outerColors.findIndex(c => c === 'gold'), [outerColors]);
  
  useEffect(() => {
    const wheelElement = wheelRef.current;
    
    const handleTransitionEnd = () => {
      if (activeSpin && !completedSpinRef.current) {
        completedSpinRef.current = true;
        setActiveSpin(false);
        setIsResultPhase(true);
        
        if (onSpinComplete && winPositionRef.current) {
          const secondPos = secondWinPositionRef.current || undefined;
          onSpinComplete(winPositionRef.current, secondPos);
        }
      }
    };
    
    if (wheelElement) {
      wheelElement.addEventListener('transitionend', handleTransitionEnd);
    }
    
    return () => {
      if (wheelElement) {
        wheelElement.removeEventListener('transitionend', handleTransitionEnd);
      }
    };
  }, [onSpinComplete, activeSpin]);
  
  useEffect(() => {
    if (winningPosition) {
      setIsResultPhase(true);
    } else {
      setIsResultPhase(false);
    }
  }, [winningPosition]);
  
  useEffect(() => {
    if (!isSpinning && !activeSpin && !isResultPhase) {
      if (slowSpinIntervalRef.current) {
        clearInterval(slowSpinIntervalRef.current);
        slowSpinIntervalRef.current = null;
      }
      
      slowSpinIntervalRef.current = setInterval(() => {
        setWheelRotation(prev => prev + HyperParams.ANIMATION.idleSpinSpeed);
        setAdditionalWheelRotation(prev => prev + HyperParams.ANIMATION.idleSpinSpeed * 1.2);
      }, 50);
    } else if (slowSpinIntervalRef.current) {
      clearInterval(slowSpinIntervalRef.current);
      slowSpinIntervalRef.current = null;
    }
    
    return () => {
      if (slowSpinIntervalRef.current) {
        clearInterval(slowSpinIntervalRef.current);
        slowSpinIntervalRef.current = null;
      }
    };
  }, [isSpinning, activeSpin, isResultPhase]);
  
  useEffect(() => {
    if (isSpinning && !activeSpin) {
      completedSpinRef.current = false;
      
      if (activeSpinTimeoutRef.current) {
        clearTimeout(activeSpinTimeoutRef.current);
        activeSpinTimeoutRef.current = null;
      }
      
      // Regenerate outer colors for each new spin (gold position changes)
      setOuterColors(generateOuterColors());
      
      setActiveSpin(true);
      setIsResultPhase(false);
      
      if (slowSpinIntervalRef.current) {
        clearInterval(slowSpinIntervalRef.current);
        slowSpinIntervalRef.current = null;
      }
      
      const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      const winPosition = WHEEL_NUMBERS[randomIndex];
      
      winPositionRef.current = winPosition;
      secondWinPositionRef.current = null;
      
      const segmentCenterAngle = (randomIndex + 0.5) * ANGLE_PER_SLOT;
      const targetAngle = 360 - segmentCenterAngle;
      
      const rotations = HyperParams.ANIMATION.minRotations + 
        Math.floor(Math.random() * (HyperParams.ANIMATION.maxRotations - HyperParams.ANIMATION.minRotations));
      const newRotation = (wheelRotation - (wheelRotation % 360)) + rotations * 360 + targetAngle;
      
      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${HyperParams.ANIMATION.spinDuration}ms cubic-bezier(0.2, 0.8, 0.3, 0.9)`;
        wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
      }
      
      if (spinTwice && additionalWheelRef.current) {
        const additionalRandomIndex = Math.floor(Math.random() * additionalWheel.length);
        const secondWinPosition = additionalWheel[additionalRandomIndex];
        
        secondWinPositionRef.current = secondWinPosition;
        
        const additionalTargetAngle = additionalRandomIndex * (360 / additionalWheel.length);
        
        const additionalRotations = rotations - 2 + Math.floor(Math.random() * 4);
        const newAdditionalRotation = (additionalWheelRotation - (additionalWheelRotation % 360)) + 
          additionalRotations * 360 + additionalTargetAngle;
        
        additionalWheelRef.current.style.transition = `transform ${HyperParams.ANIMATION.spinDuration + 500}ms cubic-bezier(0.15, 0.85, 0.35, 0.95)`;
        additionalWheelRef.current.style.transform = `rotate(${newAdditionalRotation}deg)`;
        
        setAdditionalWheelRotation(newAdditionalRotation);
      }
      
      setWheelRotation(newRotation);
      
      activeSpinTimeoutRef.current = setTimeout(() => {
        if (!completedSpinRef.current) {
          completedSpinRef.current = true;
          setActiveSpin(false);
          setIsResultPhase(true);
          
          if (onSpinComplete && winPositionRef.current) {
            const secondPos = secondWinPositionRef.current || undefined;
            onSpinComplete(winPositionRef.current, secondPos);
          }
        }
      }, HyperParams.ANIMATION.spinDuration + 500);
    }
    
    return () => {
      if (activeSpinTimeoutRef.current) {
        clearTimeout(activeSpinTimeoutRef.current);
        activeSpinTimeoutRef.current = null;
      }
    };
  }, [isSpinning, activeSpin, additionalWheel, onSpinComplete, spinTwice, wheelRotation, additionalWheelRotation]);
  
  // Generate SVG path for a wheel segment
  const createSegmentPath = (index: number, innerRadius: number, outerRadius: number, centerX: number, centerY: number) => {
    const startAngle = (index * ANGLE_PER_SLOT - 90) * (Math.PI / 180);
    const endAngle = ((index + 1) * ANGLE_PER_SLOT - 90) * (Math.PI / 180);
    
    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
  };
  
  // Get color value for outer ring
  const getOuterColorFill = (color: OuterColor): string => {
    switch (color) {
      case 'green': return '#22c55e';
      case 'pink': return '#ec4899';
      case 'gold': return '#fbbf24';
      case 'red': return '#ef4444';
      default: return 'transparent';
    }
  };
  
  const centerX = wheelSize / 2;
  const centerY = wheelSize / 2;
  const outerRingOuter = wheelSize / 2 - 8;
  const outerRingInner = wheelSize / 2 - 28;
  const mainSegmentOuter = outerRingInner - 2;
  const mainSegmentInner = wheelSize / 2 - 100;
  const textRadius = (mainSegmentOuter + mainSegmentInner) / 2;
  
  return (
    <div className={`relative mx-auto ${className} wheel-responsive-container`} style={{ maxWidth: wheelSize + 40, width: '100%' }}>
      {/* Glow effect */}
      <div 
        className="absolute inset-0 rounded-full opacity-50"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 60%)',
          transform: 'scale(1.2)',
          filter: 'blur(30px)'
        }}
      />
      
      {/* Main wheel container */}
      <div 
        className="relative mx-auto rounded-full wheel-main"
        style={{ 
          width: '100%',
          maxWidth: wheelSize,
          aspectRatio: '1 / 1',
          background: 'linear-gradient(145deg, #2d2010 0%, #1a1208 100%)',
          boxShadow: `
            0 0 0 clamp(6px, 2vw, 10px) #b8860b,
            0 0 0 clamp(9px, 2.5vw, 14px) #8b6914,
            0 0 0 clamp(12px, 3vw, 18px) rgba(212, 175, 55, 0.3),
            0 0 clamp(30px, 6vw, 60px) rgba(0, 0, 0, 0.8),
            inset 0 0 clamp(30px, 6vw, 60px) rgba(0, 0, 0, 0.5)
          `
        }}
      >
        {/* Pointer at top */}
        <div 
          className="absolute z-30"
          style={{
            top: -12,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '18px solid transparent',
            borderTop: '32px solid #d4af37',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'
          }}
        />
        
        {/* Spinning wheel */}
        <div 
          ref={wheelRef}
          className="absolute inset-0"
          style={{ 
            transformOrigin: 'center center',
            transform: `rotate(${wheelRotation}deg)` 
          }}
        >
          <svg 
            width={wheelSize} 
            height={wheelSize} 
            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="blackSegment" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2a2a2a" />
                <stop offset="50%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#0a0a0a" />
              </linearGradient>
              <linearGradient id="whiteSegment" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f0f0f0" />
                <stop offset="100%" stopColor="#e0e0e0" />
              </linearGradient>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f4d03f" />
                <stop offset="50%" stopColor="#d4af37" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
              <filter id="goldGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* OUTER COLOR RING - Green/Pink/Gold/Red indicators */}
            {WHEEL_NUMBERS.map((_, index) => {
              const outerColor = outerColors[index];
              if (outerColor === 'none') return null;
              
              const isGold = outerColor === 'gold';
              
              return (
                <path
                  key={`outer-${index}`}
                  d={createSegmentPath(index, outerRingInner, outerRingOuter, centerX, centerY)}
                  fill={getOuterColorFill(outerColor)}
                  stroke="#c9a227"
                  strokeWidth="1"
                  style={{
                    filter: isGold ? 'url(#goldGlow) brightness(1.2)' : undefined,
                  }}
                  className={isGold ? 'animate-pulse' : ''}
                />
              );
            })}
            
            {/* Empty outer ring segments (for ones without special color) */}
            {WHEEL_NUMBERS.map((_, index) => {
              const outerColor = outerColors[index];
              if (outerColor !== 'none') return null;
              
              return (
                <path
                  key={`outer-empty-${index}`}
                  d={createSegmentPath(index, outerRingInner, outerRingOuter, centerX, centerY)}
                  fill="rgba(30, 30, 30, 0.6)"
                  stroke="#c9a227"
                  strokeWidth="0.5"
                  opacity="0.5"
                />
              );
            })}
            
            {/* MAIN BLACK/WHITE SEGMENTS */}
            {WHEEL_NUMBERS.map((position, index) => {
              const isWinning = isResultPhase && 
                winningPosition?.number === position.number && 
                winningPosition?.color === position.color;
              
              return (
                <path
                  key={`segment-${index}`}
                  d={createSegmentPath(index, mainSegmentInner, mainSegmentOuter, centerX, centerY)}
                  fill={position.color === 'black' ? 'url(#blackSegment)' : 'url(#whiteSegment)'}
                  stroke="#c9a227"
                  strokeWidth="1"
                  className={isWinning ? 'animate-pulse' : ''}
                  style={{
                    filter: isWinning ? 'brightness(1.3) drop-shadow(0 0 10px #ffd700)' : undefined
                  }}
                />
              );
            })}
            
            {/* NUMBERS */}
            {WHEEL_NUMBERS.map((position, index) => {
              const midAngle = (index + 0.5) * ANGLE_PER_SLOT - 90;
              const midRad = midAngle * (Math.PI / 180);
              const textX = centerX + textRadius * Math.cos(midRad);
              const textY = centerY + textRadius * Math.sin(midRad);
              const textRotation = midAngle + 90;
              
              return (
                <text
                  key={`number-${index}`}
                  x={textX}
                  y={textY}
                  fill={position.color === 'black' ? '#ffffff' : '#000000'}
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="'Inter', Arial, sans-serif"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${textRotation}, ${textX}, ${textY})`}
                  style={{ userSelect: 'none' }}
                >
                  {position.number}
                </text>
              );
            })}
            
            {/* Inner gold ring */}
            <circle
              cx={centerX}
              cy={centerY}
              r={mainSegmentInner}
              fill="none"
              stroke="url(#goldGradient)"
              strokeWidth="4"
            />
            
            {/* Center hub */}
            <circle
              cx={centerX}
              cy={centerY}
              r={mainSegmentInner - 5}
              fill="url(#goldGradient)"
            />
            
            <circle
              cx={centerX}
              cy={centerY}
              r={mainSegmentInner - 20}
              fill="#b8860b"
              stroke="#8b6914"
              strokeWidth="3"
            />
            
            <circle
              cx={centerX}
              cy={centerY}
              r={mainSegmentInner - 35}
              fill="#d4af37"
            />
          </svg>
        </div>

        {/* Center result display (overlay, doesn't spin) */}
        <div 
          className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center"
          style={{
            width: (mainSegmentInner * 2) - 80,
            height: (mainSegmentInner * 2) - 80,
            background: 'linear-gradient(145deg, #d4af37 0%, #b8860b 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 2px 10px rgba(255,255,255,0.2)'
          }}
        >
          {winningPosition && isResultPhase && (
            <div 
              className={`
                rounded-full flex items-center justify-center font-bold shadow-xl
                ${winningPosition.color === 'black' 
                  ? 'bg-gradient-to-br from-gray-800 to-black text-white' 
                  : 'bg-gradient-to-br from-white to-gray-100 text-black'}
              `}
              style={{
                width: (mainSegmentInner * 2) - 100,
                height: (mainSegmentInner * 2) - 100,
                fontSize: '2.5rem',
                border: '4px solid #d4af37',
                boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            >
              {winningPosition.number}
            </div>
          )}
        </div>
        
        {/* Gold indicator badge */}
        {goldIndex >= 0 && (
          <div 
            className="absolute z-30 top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded-full shadow-lg"
            style={{ boxShadow: '0 0 10px rgba(251, 191, 36, 0.6)' }}
          >
            🌟 Gold at #{WHEEL_NUMBERS[goldIndex].number}
          </div>
        )}
      </div>
      
      {/* Additional wheel for special bets */}
      {spinTwice && (
        <div className="mt-4 sm:mt-8 relative w-full max-w-[200px] sm:max-w-xs mx-auto">
          <div 
            className="relative mx-auto rounded-full overflow-hidden"
            style={{
              width: 200,
              height: 200,
              background: 'linear-gradient(145deg, #2d1810 0%, #1a0f0a 100%)',
              boxShadow: '0 0 0 6px #6b4c41, 0 0 30px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(145deg, #8b6347 0%, #5a3e36 100%)',
                border: '3px solid #5a3e36'
              }}
            >
              {secondWinningPosition && isResultPhase && (
                <div 
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${secondWinningPosition.color === 'black' ? 'bg-black text-white' : 
                      secondWinningPosition.color === 'white' ? 'bg-white text-black' :
                      secondWinningPosition.color === 'green' ? 'bg-green-500 text-white' :
                      secondWinningPosition.color === 'pink' ? 'bg-pink-500 text-white' :
                      secondWinningPosition.color === 'gold' ? 'bg-yellow-500 text-black' :
                      'bg-red-600 text-white'}
                    border-2 border-yellow-400
                  `}
                >
                  {secondWinningPosition.number}
                </div>
              )}
            </div>
            
            <div 
              ref={additionalWheelRef}
              className="absolute inset-0 z-10"
              style={{ 
                transformOrigin: 'center center',
                transform: `rotate(${additionalWheelRotation}deg)` 
              }}
            >
              {additionalWheel.map((_, index) => {
                const angle = index * (360 / additionalWheel.length);
                return (
                  <div 
                    key={`add-ray-${index}`}
                    className="absolute top-1/2 left-1/2 h-1/2 w-0.5"
                    style={{ 
                      transformOrigin: 'top center',
                      transform: `rotate(${angle}deg)`,
                      background: 'linear-gradient(to bottom, #5a3e36, transparent)'
                    }}
                  />
                );
              })}
              
              {additionalWheel.map((position, index) => {
                const angle = index * (360 / additionalWheel.length);
                const radians = (angle * Math.PI) / 180;
                
                const radius = 42;
                const x = 50 + radius * Math.sin(radians);
                const y = 50 - radius * Math.cos(radians);
                
                const { color } = position;
                let bgClass = 'from-red-500 to-red-700';
                if (color === 'green') bgClass = 'from-green-400 to-green-600';
                else if (color === 'pink') bgClass = 'from-pink-400 to-pink-600';
                else if (color === 'gold') bgClass = 'from-yellow-400 to-yellow-600';
                
                return (
                  <div
                    key={`add-position-${index}`}
                    className={`absolute w-7 h-7 flex items-center justify-center rounded-full bg-gradient-to-br ${bgClass} text-white text-xs font-bold border-2 border-[#5a3e36] shadow-md`}
                    style={{
                      top: `${y}%`,
                      left: `${x}%`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    }}
                  >
                    <span style={{ transform: `rotate(${-angle}deg)` }}>{position.number}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(RouletteWheel);