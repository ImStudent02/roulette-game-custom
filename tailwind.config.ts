import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        'roulette-black': '#212121',
        'roulette-white': '#f0f0f0',
        'roulette-green': '#4CAF50',
        'roulette-pink': '#E91E63',
        'roulette-gold': '#FFD700',
        'roulette-red': '#F44336',
        'roulette-x': '#673AB7',
      },
    },
  },
  plugins: [],
  // Optimize for production by purging unused styles
  future: {
    hoverOnlyWhenSupported: true, // Better performance on mobile
  },
};

export default config; 