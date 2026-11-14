'use client';

import { useEffect, useState } from 'react';
import type { LatLng } from '@/lib/geo';

export interface GeoState {
  position: LatLng | null;
  accuracy: number | null;
  status: 'idle' | 'watching' | 'denied' | 'unavailable' | 'error';
  message: string | null;
}

/** Watches the device position while `enabled` is true. */
export function useGeolocation(enabled: boolean): GeoState {
  const [state, setState] = useState<GeoState>({ position: null, accuracy: null, status: 'idle', message: null });

  useEffect(() => {
    if (!enabled) {
      setState((s) => ({ ...s, status: 'idle' }));
      return;
    }
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setState({ position: null, accuracy: null, status: 'unavailable', message: 'Location is not supported on this device.' });
      return;
    }
    setState((s) => ({ ...s, status: 'watching', message: null }));
    const id = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          position: [pos.coords.latitude, pos.coords.longitude],
          accuracy: pos.coords.accuracy,
          status: 'watching',
          message: null,
        }),
      (err) =>
        setState((s) => ({
          ...s,
          status: err.code === err.PERMISSION_DENIED ? 'denied' : 'error',
          message:
            err.code === err.PERMISSION_DENIED
              ? 'Location permission was denied. Enable it in your browser settings.'
              : 'Waiting for a location fix…',
        })),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return state;
}
