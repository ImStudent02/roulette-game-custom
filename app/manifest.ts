import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Roulette Game',
    short_name: 'Roulette',
    description: 'A web-based roulette game with unique mechanics and rules',
    start_url: '/',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#121212',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
} 