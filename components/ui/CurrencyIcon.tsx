'use client';

import Image from 'next/image';

type CurrencyType = 'fermentedMango' | 'expiredJuice' | 'mango' | 'mangoJuice';

interface CurrencyIconProps {
  type: CurrencyType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CURRENCY_SVG_MAP: Record<CurrencyType, string> = {
  fermentedMango: '/rotten-mango.svg',
  expiredJuice: '/rotten-mango-juce.svg',
  mango: '/mango.svg',
  mangoJuice: '/mango-juce.svg',
};

const CURRENCY_ALT_MAP: Record<CurrencyType, string> = {
  fermentedMango: 'Fermented Mango',
  expiredJuice: 'Expired Juice',
  mango: 'Mango',
  mangoJuice: 'Mango Juice',
};

const SIZE_MAP = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

export default function CurrencyIcon({ type, size = 'md', className = '' }: CurrencyIconProps) {
  const pixelSize = SIZE_MAP[size];
  
  return (
    <Image
      src={CURRENCY_SVG_MAP[type]}
      alt={CURRENCY_ALT_MAP[type]}
      width={pixelSize}
      height={pixelSize}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

// Helper component for inline currency display with value
interface CurrencyDisplayProps {
  type: CurrencyType;
  value: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function CurrencyDisplay({ 
  type, 
  value, 
  size = 'sm', 
  showName = false,
  className = '' 
}: CurrencyDisplayProps) {
  const formatValue = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <CurrencyIcon type={type} size={size} />
      <span className="font-bold">{formatValue(value)}</span>
      {showName && <span className="text-gray-400 text-sm">{CURRENCY_ALT_MAP[type]}</span>}
    </span>
  );
}

// All four currencies in a row
interface AllCurrenciesProps {
  balance: {
    fermentedMangos: number;
    expiredJuice: number;
    mangos: number;
    mangoJuice: number;
  };
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function AllCurrencies({ balance, size = 'sm', className = '' }: AllCurrenciesProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <CurrencyDisplay type="fermentedMango" value={balance.fermentedMangos} size={size} />
      <CurrencyDisplay type="expiredJuice" value={balance.expiredJuice} size={size} />
      <CurrencyDisplay type="mango" value={balance.mangos} size={size} />
      <CurrencyDisplay type="mangoJuice" value={balance.mangoJuice} size={size} />
    </div>
  );
}
