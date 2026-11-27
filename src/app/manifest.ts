import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HOLY NIGHT, CITY LIGHTS • DEC 13',
    short_name: 'Holy Night',
    description: 'Route, prayer items and carols for the Hong Kong Island tram caroling event.',
    start_url: '/ride',
    display: 'standalone',
    background_color: '#0b2e28',
    theme_color: '#0b2e28',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
