import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tram Caroling',
    short_name: 'Tram Carols',
    description: 'Route, prayer items and carols for the Hong Kong Island tram caroling event.',
    start_url: '/ride',
    display: 'standalone',
    background_color: '#0b2e1a',
    theme_color: '#166534',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
