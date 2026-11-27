'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { useWakeLock } from '@/lib/useWakeLock';
import { NowSinging } from '@/components/NowSinging';

const TABS = [
  { href: '/leaflet', label: 'Leaflet', icon: '✦' },
  // Not "/route": Next.js reserves a trailing `route` segment for route handlers.
  { href: '/ride', label: 'Route', icon: '🚋' },
  { href: '/songs', label: 'Songs', icon: '🎵' },
  { href: '/people', label: 'People', icon: '👥' },
  { href: '/me', label: 'Me', icon: '🙂' },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains('dark')), []);
  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('tc.theme', next ? 'dark' : 'light');
    setDark(next);
  };
  return (
    <button onClick={toggle} className="rounded-lg p-2 text-lg hover:bg-ink-100/10" aria-label="Toggle dark mode">
      {dark ? '☀️' : '🌙'}
    </button>
  );
}

function WakeLockToggle() {
  const { active, supported, toggle } = useWakeLock();
  if (!supported) return null;
  return (
    <button
      onClick={toggle}
      className={`rounded-lg px-2 py-1 text-xs font-semibold ${active ? 'bg-gold-500 text-ink-950' : 'border border-gold-500/40 text-gold-300'}`}
      aria-pressed={active}
      title="Keep the screen on during the ride"
    >
      {active ? '☀ Screen on' : 'Keep screen on'}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { eventName, isAdmin, mode, error } = useStore();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const tabs = isAdmin ? [...TABS, { href: '/admin', label: 'Admin', icon: '🎛️' }] : TABS;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col">
      <header className="sticky top-0 z-20 border-b border-gold-500/40 bg-ink-950 text-ink-100">
        <div className="flex items-center gap-2 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <span className="text-lg text-gold-400" aria-hidden>
            ✦
          </span>
          <h1 className="flex-1 truncate font-serif text-xl font-medium tracking-tight">{eventName}</h1>
          <WakeLockToggle />
          <ThemeToggle />
        </div>
        {mode === 'demo' && (
          <div className="bg-gold-500 px-4 py-0.5 text-center text-xs font-semibold text-ink-950">
            Demo mode — sample data, live updates sync between tabs on this device
          </div>
        )}
        {error && <div className="bg-ink-800 px-4 py-0.5 text-center text-xs">{error}</div>}
        <NowSinging />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-ink-200 bg-ink-50/95 backdrop-blur dark:border-gold-500/30 dark:bg-ink-950/95">
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + '/');
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  className={`flex flex-col items-center gap-0.5 border-t-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider ${
                    active
                      ? 'border-gold-500 text-tram-700 dark:text-gold-400'
                      : 'border-transparent text-ink-500 dark:text-ink-400'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {t.icon}
                  </span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
