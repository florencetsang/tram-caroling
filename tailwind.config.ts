import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        tram: {
          50: '#effaf3',
          100: '#d8f3e1',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          900: '#0b2e1a',
        },
        berry: {
          500: '#dc2626',
          600: '#b91c1c',
        },
      },
    },
  },
  plugins: [],
};

export default config;
