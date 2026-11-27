import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Palette taken from the "Holy Night, City Lights" leaflet.
        // `ink` runs from the leaflet's cream paper (50) to its deep forest green (950).
        ink: {
          50: '#faf8f3',
          100: '#f4f0e8',
          200: '#e9e2d3',
          300: '#d8ceb9',
          400: '#a39c8c',
          500: '#7a7466',
          600: '#55605a',
          700: '#2f5045',
          800: '#1a443a',
          900: '#123d33',
          950: '#0b2e28',
        },
        tram: {
          50: '#eef3ef',
          100: '#dde7e0',
          500: '#4f8a72',
          600: '#1b4a3f',
          700: '#123d33',
          900: '#0b2e28',
        },
        gold: {
          50: '#faf5ea',
          100: '#f3e9d3',
          200: '#e6d3ae',
          300: '#d2b886',
          400: '#be9d66',
          500: '#a8864f',
          600: '#8c6e3d',
          700: '#6e5630',
          900: '#3a2e1a',
          950: '#241c10',
        },
      },
    },
  },
  plugins: [],
};

export default config;
