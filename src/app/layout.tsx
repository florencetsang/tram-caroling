import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import 'leaflet/dist/leaflet.css';
import './globals.css';
import { AppShell } from '@/components/AppShell';
import { StoreProvider } from '@/lib/store';

const serif = Newsreader({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'HOLY NIGHT, CITY LIGHTS • DEC 13',
  description: 'Route, prayer items and carols for the Hong Kong Island tram caroling event.',
  appleWebApp: { capable: true, title: 'Holy Night', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b2e28',
};

// Apply the saved/system theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('tc.theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <StoreProvider>
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
