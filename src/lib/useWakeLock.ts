'use client';

import { useEffect, useRef, useState } from 'react';

/** Keeps the screen awake while active (Screen Wake Lock API); re-acquires after tab switches. */
export function useWakeLock() {
  const [active, setActive] = useState(false);
  const [supported, setSupported] = useState(false);
  const sentinel = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== 'undefined' && 'wakeLock' in navigator);
    setActive(localStorage.getItem('tc.wakeLock') === '1');
  }, []);

  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    const acquire = async () => {
      if (!active || document.visibilityState !== 'visible' || sentinel.current) return;
      try {
        const s = await navigator.wakeLock.request('screen');
        if (cancelled) {
          s.release();
          return;
        }
        sentinel.current = s;
        s.addEventListener('release', () => {
          sentinel.current = null;
        });
      } catch {
        /* e.g. battery saver; ignore */
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') acquire();
    };

    if (active) acquire();
    else if (sentinel.current) {
      sentinel.current.release();
      sentinel.current = null;
    }
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [active, supported]);

  const toggle = () => {
    const next = !active;
    localStorage.setItem('tc.wakeLock', next ? '1' : '0');
    setActive(next);
  };

  return { active, supported, toggle };
}
