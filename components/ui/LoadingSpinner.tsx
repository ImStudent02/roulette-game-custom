'use client';

import { memo } from 'react';

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
};

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'text-white', 
  className = '' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };
  
  return (
    <div className={`inline-block ${className}`} aria-label="Loading">
      <div 
        className={`
          ${sizeClasses[size]} 
          ${color}
          rounded-full 
          border-solid 
          border-t-transparent 
          animate-spin
        `}
      />
    </div>
  );
};

export default memo(LoadingSpinner); 