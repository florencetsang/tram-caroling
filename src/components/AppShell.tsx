'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useStore } from '@/lib/store';
import { useWakeLock } from '@/lib/useWakeLock';
import { NowSinging } from '@/components/NowSinging';

const TABS = [
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
    <button onClick={toggle} className="rounded-lg p-2 text-lg hover:bg-white/10" aria-label="Toggle dark mode">
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
      className={`rounded-lg px-2 py-1 text-xs font-semibold ${active ? 'bg-white text-tram-700' : 'bg-white/10 text-white'}`}
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
      <header className="sticky top-0 z-20 bg-tram-700 text-white shadow dark:bg-slate-900">
        <div className="flex items-center gap-2 px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
          <span className="text-xl" aria-hidden>
            🚋
          </span>
          <h1 className="flex-1 truncate text-lg font-bold">{eventName}</h1>
          <WakeLockToggle />
          <ThemeToggle />
        </div>
        {mode === 'demo' && (
          <div className="bg-amber-400 px-4 py-0.5 text-center text-xs font-semibold text-amber-950">
            Demo mode — sample data, live updates sync between tabs on this device
          </div>
        )}
        {error && <div className="bg-slate-700 px-4 py-0.5 text-center text-xs">{error}</div>}
        <NowSinging />
      </header>

      <main className="flex-1 px-4 pb-28 pt-4">{children}</main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <ul className="mx-auto flex max-w-2xl">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + '/');
            return (
              <li key={t.href} className="flex-1">
                <Link
                  href={t.href}
                  className={`flex flex-col items-center py-2 text-xs font-semibold ${
                    active ? 'text-tram-700 dark:text-tram-500' : 'text-slate-500 dark:text-slate-400'
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
