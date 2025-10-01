'use client';

import { useRef, useEffect, useState, memo } from 'react';
import { WheelPosition } from '@/lib/types';
import { generateMainWheel, generateAdditionalWheel, spinWheel } from '@/lib/gameUtils';
import * as HyperParams from '@/lib/hyperParams';

// Mathematical constant - since the wheel has 51 positions, each slot covers 7.06° (360° / 51)
const ANGLE_PER_SLOT = 360 / 51;

type RouletteWheelProps = {
  onSpinComplete: (position: WheelPosition, secondPosition?: WheelPosition) => void;
  isSpinning: boolean;
  winningPosition?: WheelPosition;
  secondWinningPosition?: WheelPosition;
  spinTwice?: boolean;
  className?: string;
};

// Helper function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  
  return newArray;
};

// Create array of numbers 1-50
const createNumbersArray = (): number[] => {
  const numbers: number[] = [];
  for (let i = 1; i <= 50; i++) {
    numbers.push(i);
  }
  return numbers;
};

// Create a fixed wheel layout based on the reference image
const createFixedWheelLayout = (): WheelPosition[] => {
  // Numbers and colors are taken directly from the reference image
  const wheelLayout: WheelPosition[] = [
    { number: 26, color: 'black' },
    { number: 44, color: 'black' },
    { number: 21, color: 'black' },
    { number: 20, color: 'black' },
    { number: 33, color: 'black' },
    { number: 14, color: 'black' },
    { number: 15, color: 'black' },
    { number: 22, color: 'black' },
    { number: 31, color: 'black' },
    { number: 43, color: 'black' },
    
    // Second row from left to right
    { number: 48, color: 'black' },
    { number: 8, color: 'black' },
    { number: 3, color: 'black' },
    { number: 13, color: 'black' },
    { number: 30, color: 'black' },
    { number: 18, color: 'black' },
    { number: 24, color: 'black' },
    { number: 'X', color: 'black' },
    { number: 41, color: 'white' },
    { number: 10, color: 'white' },
    
    // Third row from left to right
    { number: 6, color: 'white' },
    { number: 23, color: 'white' },
    { number: 7, color: 'white' },
    { number: 2, color: 'white' },
    { number: 27, color: 'white' },
    { number: 12, color: 'white' },
    { number: 36, color: 'white' },
    { number: 47, color: 'white' },
    { number: 49, color: 'white' },
    { number: 4, color: 'white' },
    
    // Fourth row from left to right
    { number: 45, color: 'white' },
    { number: 16, color: 'white' },
    { number: 5, color: 'white' },
    { number: 1, color: 'white' },
    { number: 35, color: 'white' },
    { number: 17, color: 'black' },
    { number: 42, color: 'white' },
    { number: 46, color: 'black' },
    { number: 39, color: 'white' },
    { number: 34, color: 'black' },
    
    // Fifth row from left to right
    { number: 29, color: 'white' },
    { number: 28, color: 'black' },
    { number: 11, color: 'white' },
    { number: 40, color: 'black' },
    { number: 32, color: 'white' },
    { number: 9, color: 'black' },
    { number: 50, color: 'white' },
    { number: 19, color: 'black' },
    { number: 38, color: 'white' },
    { number: 25, color: 'black' },
    
    // Last item
    { number: 37, color: 'white' }
  ];
  
  return wheelLayout;
};

// Use fixed layout
const WHEEL_NUMBERS = createFixedWheelLayout();

// Export for use in other components
export { WHEEL_NUMBERS };

// Ball component that follows the wheel
const WheelBall = ({ 
  isSpinning, 
  wheelRotation, 
  winningSlotAngle,
  isResultPhase
}: {
  isSpinning: boolean;
  wheelRotation: number;
  winningSlotAngle?: number;
  isResultPhase: boolean;
}) => {
  const ballRef = useRef<HTMLDivElement>(null);
  
//   useEffect(() => {
//     if (!ballRef.current) return;
    
//     if (isSpinning) {
//       // During active spin, the ball should follow the wheel but with slight lag and bounce effect
//       ballRef.current.style.opacity = '1';
      
//       // Bouncing effect - makes the ball move in and out slightly
//       const bounceEffect = Math.sin(wheelRotation / 30) * HyperParams.ANIMATION.ballBounceIntensity * 10;
//       const laggingDegrees = Math.sin(wheelRotation / 20) * 5; // Slight lag effect
      
//       ballRef.current.style.transition = `transform 100ms ease-out`;
//       ballRef.current.style.transform = `
//         rotate(${wheelRotation - laggingDegrees}deg)
//         translateY(${-47 + bounceEffect}%)
//       `;
//     } 
//     else if (isResultPhase && winningSlotAngle !== undefined) {
//       // When showing result, position the ball at the winning position
//       ballRef.current.style.opacity = '1';
//       ballRef.current.style.transition = `transform 500ms ease-out`;
//       ballRef.current.style.transform = `
//         rotate(${winningSlotAngle}deg)
//         translateY(-47%)
//       `;
//     } 
//     else {
//       // Hide the ball when idle
//       ballRef.current.style.opacity = '0';
//     }
//   }, [isSpinning, wheelRotation, winningSlotAngle, isResultPhase]);
  
//   // return (
//   //   <div 
//   //     ref={ballRef}
//   //     className="absolute z-30 w-4 h-4 rounded-full bg-yellow-500 border border-yellow-600 shadow-md"
//   //     style={{
//   //       top: 'calc(50%)',
//   //       left: 'calc(50%)',
//   //       transformOrigin: 'center',
//   //       opacity: 0,
//   //       filter: 'drop-shadow(0 0 2px rgba(255, 215, 0, 0.8))',
//   //     }}
//   //   />
//   // );
//   return (
//     <div
//       ref={ballRef}
//       className="absolute z-30 w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-lg"
//       style={{
//         top: '50%',
//         left: '50%',
//         transform: 'translate(-50%, -50%)',
//         transformOrigin: 'center',
//         opacity: 0,
//         filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.9))',
//       }}
//     />
//   );
  
// };
useEffect(() => {
  if (!ballRef.current) return;

  if (isSpinning) {
    ballRef.current.style.opacity = '1';

    // Define ball movement parameters
    const bounceEffect = Math.sin(wheelRotation / 15) * HyperParams.ANIMATION.ballBounceIntensity * 8; // Realistic bounce
    const laggingDegrees = Math.sin(wheelRotation / 12) * 5; // Smooth lag effect
    const radius = 1000; // Distance from center (adjust if needed)

    ballRef.current.style.transition = `transform 50ms ease-out`;
    ballRef.current.style.transform = `
      rotate(${wheelRotation - laggingDegrees}deg) 
      translate(${radius}%) 
      translateY(${bounceEffect}px)
    `;
  } 
  else if (isResultPhase && winningSlotAngle !== undefined) {
    ballRef.current.style.opacity = '1';
    ballRef.current.style.transition = `transform 700ms ease-out`;
    ballRef.current.style.transform = `
      rotate(${winningSlotAngle}deg) 
      translate(${95}%) 
      translateY(0px)
    `;
  } 
  else {
    ballRef.current.style.opacity = '0';
  }
  }, [isSpinning, wheelRotation, winningSlotAngle, isResultPhase]);
  return (
      // <div
      //   ref={ballRef}
      //   className="absolute z-30 w-5 h-5 rounded-full bg-yellow-400 border-2 border-yellow-600 shadow-lg"
      //   style={{
      //     top: '50%',
      //     left: '50%',
      //     transformOrigin: 'center',
      //     opacity: 0,
      //     filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.9))',
      //   }}
      // />
      <div></div>
    );
  }
const RouletteWheel = ({
  onSpinComplete,
  isSpinning,
  winningPosition,
  secondWinningPosition,
  spinTwice = false,
  className = '',
}: RouletteWheelProps) => {
  // Refs for wheel elements
  const wheelRef = useRef<HTMLDivElement>(null);
  const additionalWheelRef = useRef<HTMLDivElement>(null);
  
  // State for wheel rotation and animation
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [additionalWheelRotation, setAdditionalWheelRotation] = useState<number>(0);
  const [additionalWheel] = useState<WheelPosition[]>(generateAdditionalWheel());
  const [activeSpin, setActiveSpin] = useState<boolean>(false);
  const [isResultPhase, setIsResultPhase] = useState<boolean>(false);
  const [winningSlotAngle, setWinningSlotAngle] = useState<number | undefined>(undefined);
  
  // Refs to track the current animation
  const slowSpinIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeSpinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const resultTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const completedSpinRef = useRef<boolean>(false);
  
  // Track selected winning positions
  const winPositionRef = useRef<WheelPosition | null>(null);
  const secondWinPositionRef = useRef<WheelPosition | null>(null);

  
  // Add transition end event listener to ensure spin completion
  useEffect(() => {
    const wheelElement = wheelRef.current;
    
    const handleTransitionEnd = () => {
      if (activeSpin && !completedSpinRef.current) {
        // The wheel has finished spinning
        completedSpinRef.current = true;
        setActiveSpin(false);
        setIsResultPhase(true);
        
        // Call onSpinComplete with our saved winning positions
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
  
  // Calculate the winning position angle
  useEffect(() => {
    if (winningPosition) {
      const winningIndex = WHEEL_NUMBERS.findIndex(pos => 
        pos.number === winningPosition.number && pos.color === winningPosition.color
      );
      
      if (winningIndex !== -1) {
        const angle = winningIndex * ANGLE_PER_SLOT;
        setWinningSlotAngle(angle);
        setIsResultPhase(true);
      }
    } else {
      setWinningSlotAngle(undefined);
      setIsResultPhase(false);
    }
  }, [winningPosition]);
  
  // Slow continuous rotation ONLY when idle (no result shown and not actively spinning)
  useEffect(() => {
    // Only start slow rotation if there's no winning position and not actively spinning
    if (!isSpinning && !activeSpin && !isResultPhase) {
      // Clear any existing interval
      if (slowSpinIntervalRef.current) {
        clearInterval(slowSpinIntervalRef.current);
        slowSpinIntervalRef.current = null;
      }
      
      // Start slow continuous rotation
      slowSpinIntervalRef.current = setInterval(() => {
        setWheelRotation(prev => prev + HyperParams.ANIMATION.idleSpinSpeed);
        setAdditionalWheelRotation(prev => prev + HyperParams.ANIMATION.idleSpinSpeed * 1.2);
      }, 50);
    } else if (slowSpinIntervalRef.current) {
      // Stop slow rotation in all other cases
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
  
  // Handle the active spinning animation
  useEffect(() => {
    // Only start spinning if isSpinning is true and we're not already in an active spin
    if (isSpinning && !activeSpin) {
      // Reset completion flag
      completedSpinRef.current = false;
      
      // Clear any existing timeouts/intervals to prevent memory leaks
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
      
      if (activeSpinTimeoutRef.current) {
        clearTimeout(activeSpinTimeoutRef.current);
        activeSpinTimeoutRef.current = null;
      }
      
      // Start active spinning
      setActiveSpin(true);
      setIsResultPhase(false);
      
      // Clear slow rotation interval
      if (slowSpinIntervalRef.current) {
        clearInterval(slowSpinIntervalRef.current);
        slowSpinIntervalRef.current = null;
      }
      
      // Determine random winning position
      const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
      const winPosition = WHEEL_NUMBERS[randomIndex];
      
      // Save the winning position to ref for the transitionend event
      winPositionRef.current = winPosition;
      secondWinPositionRef.current = null;
      
      // Calculate target angle for the winning position
      const targetAngle = randomIndex * ANGLE_PER_SLOT;
      
      // Apply multiple rotations plus the target angle for dramatic effect
      const rotations = HyperParams.ANIMATION.minRotations + 
        Math.floor(Math.random() * (HyperParams.ANIMATION.maxRotations - HyperParams.ANIMATION.minRotations));
      const newRotation = (wheelRotation - (wheelRotation % 360)) + rotations * 360 + targetAngle;
      
      // Apply animation
      if (wheelRef.current) {
        wheelRef.current.style.transition = `transform ${HyperParams.ANIMATION.spinDuration}ms cubic-bezier(0.2, 0.8, 0.3, 0.9)`;
        wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
      }
      
      // Handle additional wheel if needed
      if (spinTwice && additionalWheelRef.current) {
        const additionalRandomIndex = Math.floor(Math.random() * additionalWheel.length);
        const secondWinPosition = additionalWheel[additionalRandomIndex];
        
        // Save to ref
        secondWinPositionRef.current = secondWinPosition;
        
        const additionalTargetAngle = additionalRandomIndex * (360 / additionalWheel.length);
        
        const additionalRotations = rotations - 2 + Math.floor(Math.random() * 4); // Slightly different rotation count
        const newAdditionalRotation = (additionalWheelRotation - (additionalWheelRotation % 360)) + 
          additionalRotations * 360 + additionalTargetAngle;
        
        additionalWheelRef.current.style.transition = `transform ${HyperParams.ANIMATION.spinDuration + 500}ms cubic-bezier(0.15, 0.85, 0.35, 0.95)`;
        additionalWheelRef.current.style.transform = `rotate(${newAdditionalRotation}deg)`;
        
        // Update state with new rotation
        setAdditionalWheelRotation(newAdditionalRotation);
      }
      
      // Update state with new rotation
      setWheelRotation(newRotation);
      
      // Backup timeout in case the transition end event doesn't fire for some reason
      activeSpinTimeoutRef.current = setTimeout(() => {
        if (!completedSpinRef.current) {
          completedSpinRef.current = true;
          setActiveSpin(false);
          setIsResultPhase(true);
          
          // Call onSpinComplete with the winning positions
          if (onSpinComplete && winPositionRef.current) {
            const secondPos = secondWinPositionRef.current || undefined;
            onSpinComplete(winPositionRef.current, secondPos);
          }
        }
      }, HyperParams.ANIMATION.spinDuration + 500); // Add a buffer to ensure transition completes
    }
    
    return () => {
      // Clean up all timeouts and intervals to prevent memory leaks and state issues
      if (activeSpinTimeoutRef.current) {
        clearTimeout(activeSpinTimeoutRef.current);
        activeSpinTimeoutRef.current = null;
      }
      
      if (resultTimeoutRef.current) {
        clearTimeout(resultTimeoutRef.current);
        resultTimeoutRef.current = null;
      }
    };
  }, [isSpinning, activeSpin, additionalWheel, onSpinComplete, spinTwice, wheelRotation, additionalWheelRotation]);
  
  return (
    <div className={`relative mx-auto w-full ${className}`}>
      {/* Main wheel */}
      <div className="relative w-full max-w-md mx-auto aspect-square rounded-full border-8 border-[#6b4c41] overflow-hidden bg-pink-300 shadow-xl">
        {/* Center circle */}
        <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-[#6b4c41] border-4 border-[#5a3e36] flex items-center justify-center">
          {winningPosition && isResultPhase && (
            <div 
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${winningPosition.color === 'black' ? 'bg-black text-white' : 'bg-white text-black'}
                font-bold text-lg border-2 border-yellow-400
              `}
            >
              {winningPosition.number}
            </div>
          )}
        </div>
        
        {/* The spinning wheel */}
        <div 
          ref={wheelRef}
          className="absolute inset-0 z-10"
          style={{ 
            transformOrigin: 'center center',
            transform: `rotate(${wheelRotation}deg)` 
          }}
        >
          {/* Draw wheel rays for visual effect */}
          {WHEEL_NUMBERS.map((_, index) => {
            const angle = index * ANGLE_PER_SLOT;
            return (
              <div 
                key={`ray-${index}`}
                className="absolute top-1/2 left-1/2 h-1/2 w-0.5 bg-[#5a3e36]"
                style={{ 
                  transformOrigin: 'top center',
                  transform: `rotate(${angle}deg)` 
                }}
              />
            );
          })}
          
          {/* Map the wheel positions to numbers positioned around the wheel */}
          {WHEEL_NUMBERS.map((position, index) => {
            const angle = index * ANGLE_PER_SLOT;
            const radians = (angle * Math.PI) / 180;
            
            // Position numbers at the edge of the wheel
            const radius = 47; // Percentage from center
            const x = 50 + radius * Math.sin(radians);
            const y = 50 - radius * Math.cos(radians);
            
            const { number, color } = position;
            const bgColor = color === 'black' ? 'bg-black' : 'bg-white';
            const textColor = color === 'black' ? 'text-white' : 'text-black';
            
            return (
              <div
                key={`position-${index}`}
                className={`absolute w-8 h-8 flex items-center justify-center rounded-full ${bgColor} ${textColor} text-sm md:text-base font-bold border-2 border-[#5a3e36]`}
                style={{
                  top: `${y}%`,
                  left: `${x}%`,
                  transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                }}
              >
                <span style={{ transform: `rotate(${-angle}deg)` }}>{number}</span>
              </div>
            );
          })}
        </div>
        
        {/* Ball that follows the wheel */}
        <WheelBall 
          isSpinning={activeSpin} 
          wheelRotation={wheelRotation} 
          winningSlotAngle={winningSlotAngle}
          isResultPhase={isResultPhase}
        />
      </div>
      
      {/* Additional wheel for special bets (displayed when spinTwice is true) */}
      {spinTwice && (
        <div className="mt-6 relative w-full max-w-xs mx-auto aspect-square rounded-full border-8 border-[#6b4c41] overflow-hidden bg-[#192231] shadow-xl">
          <div className="absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[#6b4c41] border-4 border-[#5a3e36] flex items-center justify-center">
            {secondWinningPosition && isResultPhase && (
              <div 
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  ${secondWinningPosition.color === 'black' ? 'bg-black text-white' : 
                    secondWinningPosition.color === 'white' ? 'bg-white text-black' :
                    secondWinningPosition.color === 'green' ? 'bg-green-500 text-white' :
                    secondWinningPosition.color === 'pink' ? 'bg-pink-500 text-white' :
                    secondWinningPosition.color === 'gold' ? 'bg-yellow-500 text-black' :
                    'bg-red-600 text-white'
                  }
                  font-bold text-sm border-2 border-yellow-400
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
            {/* Draw rays */}
            {additionalWheel.map((_, index) => {
              const angle = index * (360 / additionalWheel.length);
              return (
                <div 
                  key={`add-ray-${index}`}
                  className="absolute top-1/2 left-1/2 h-1/2 w-0.5 bg-[#5a3e36]"
                  style={{ 
                    transformOrigin: 'top center',
                    transform: `rotate(${angle}deg)` 
                  }}
                />
              );
            })}
            
            {additionalWheel.map((position, index) => {
              const angle = index * (360 / additionalWheel.length);
              const radians = (angle * Math.PI) / 180;
              
              const radius = 45;
              const x = 50 + radius * Math.sin(radians);
              const y = 50 - radius * Math.cos(radians);
              
              const { color } = position;
              let bgColorClass = 'bg-red-600';
              if (color === 'green') bgColorClass = 'bg-green-500';
              else if (color === 'pink') bgColorClass = 'bg-pink-500';
              else if (color === 'gold') bgColorClass = 'bg-yellow-500';
              
              return (
                <div
                  key={`add-position-${index}`}
                  className={`absolute w-6 h-6 flex items-center justify-center rounded-full ${bgColorClass} text-white text-xs font-bold border border-[#5a3e36]`}
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
      )}
    </div>
  );
};

export default memo(RouletteWheel); 