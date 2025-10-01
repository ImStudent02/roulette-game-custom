'use client';

import dynamic from 'next/dynamic';

// Use dynamic import with no SSR to handle client-only features like localStorage
const RouletteGame = dynamic(
  () => import('@/components/roulette/RouletteGame'),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <RouletteGame />
    </main>
  );
}
