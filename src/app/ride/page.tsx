'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { TRAM_ROUTE } from '@/data/route';
import { buildDistrictSpans, buildRouteIndex, districtAt, pointAt, snapToRoute } from '@/lib/geo';
import { useGeolocation } from '@/lib/useGeolocation';
import { useStore } from '@/lib/store';
import type { District } from '@/lib/types';

const TramMap = dynamic(() => import('@/components/TramMap'), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800 sm:h-80" />,
});

/** How far (m) from the tram line a GPS fix may be and still count as "on the tram". */
const ON_ROUTE_THRESHOLD_M = 400;
const SIM_STEP_M = 60;

type Source = 'gps' | 'simulate';

function PrayerList({ district }: { district: District }) {
  if (!district.prayer_items.length) return <p className="text-slate-500">No prayer items yet.</p>;
  return (
    <ol className="space-y-3">
      {district.prayer_items.map((p, i) => (
        <li key={p.id} className="flex gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tram-100 text-sm font-bold text-tram-700 dark:bg-tram-900 dark:text-tram-100">
            {i + 1}
          </span>
          <div>
            <p className="text-lg font-semibold leading-snug">{p.title}</p>
            <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">{p.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function RoutePage() {
  const { districts, eventState, loading } = useStore();
  const route = useMemo(() => buildRouteIndex(TRAM_ROUTE), []);
  const spans = useMemo(() => buildDistrictSpans(route, districts), [route, districts]);
  const ordered = useMemo(
    () => spans.map((s) => districts.find((d) => d.id === s.id)).filter((d): d is District => !!d),
    [spans, districts],
  );

  const [source, setSource] = useState<Source>('gps');
  const [simAlong, setSimAlong] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('tc.locationSource');
    if (saved === 'simulate' || saved === 'gps') setSource(saved);
  }, []);
  const chooseSource = (s: Source) => {
    setSource(s);
    setPlaying(false);
    localStorage.setItem('tc.locationSource', s);
  };

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setSimAlong((a) => Math.min(route.length, a + SIM_STEP_M));
    }, 500);
    return () => window.clearInterval(id);
  }, [playing, route.length]);
  useEffect(() => {
    if (playing && simAlong >= route.length) setPlaying(false);
  }, [playing, simAlong, route.length]);

  const geo = useGeolocation(source === 'gps');
  const snap = useMemo(
    () => (source === 'gps' && geo.position ? snapToRoute(route, geo.position) : null),
    [source, geo.position, route],
  );
  const onRoute = !!snap && snap.distance <= ON_ROUTE_THRESHOLD_M;

  let along: number | null = null;
  let tramPoint: [number, number] | null = null;
  if (source === 'simulate') {
    along = simAlong;
    tramPoint = pointAt(route, simAlong);
  } else if (snap && onRoute) {
    along = snap.along;
    tramPoint = snap.point;
  }
  const locationDistrictId = along !== null ? districtAt(spans, along) : null;

  const override = districts.some((d) => d.id === eventState.district_override_id)
    ? eventState.district_override_id
    : null;
  const currentId = override ?? locationDistrictId;
  const currentIndex = ordered.findIndex((d) => d.id === currentId);
  const current = currentIndex >= 0 ? ordered[currentIndex] : null;
  const next = currentIndex >= 0 ? (ordered[currentIndex + 1] ?? null) : (ordered[0] ?? null);

  let sourceLabel = '';
  if (override) sourceLabel = 'Set by the host';
  else if (source === 'simulate') sourceLabel = 'Simulated ride';
  else if (onRoute) sourceLabel = 'From your location';

  let locationHint: string | null = null;
  if (!override && source === 'gps') {
    if (geo.message) locationHint = geo.message;
    else if (geo.status === 'watching' && !geo.position) locationHint = 'Finding your location…';
    else if (snap && !onRoute)
      locationHint = `You are about ${(snap.distance / 1000).toFixed(1)} km from the tram line. Tap a district below to follow along, or try Simulate.`;
  }

  if (loading && !districts.length) return <p className="text-slate-500">Loading route…</p>;

  return (
    <div className="space-y-4">
      <TramMap
        route={route}
        spans={spans}
        districts={districts}
        currentDistrictId={currentId}
        tramPoint={tramPoint}
        userPoint={source === 'gps' ? geo.position : null}
        follow={follow}
        onSelectDistrict={setSelectedId}
      />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <div className="inline-flex overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
          {(['gps', 'simulate'] as Source[]).map((s) => (
            <button
              key={s}
              onClick={() => chooseSource(s)}
              className={`px-3 py-1.5 font-semibold ${source === s ? 'bg-tram-700 text-white' : 'bg-white dark:bg-slate-900'}`}
            >
              {s === 'gps' ? '📍 My location' : '🧪 Simulate'}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-1.5">
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          Follow tram
        </label>
      </div>

      {source === 'simulate' && (
        <div className="card flex items-center gap-3">
          <button
            className="btn-secondary px-3 py-1.5"
            onClick={() => {
              if (simAlong >= route.length) setSimAlong(0);
              setPlaying((p) => !p);
            }}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <input
            type="range"
            min={0}
            max={Math.round(route.length)}
            value={Math.round(simAlong)}
            onChange={(e) => setSimAlong(Number(e.target.value))}
            className="flex-1 accent-tram-700"
            aria-label="Simulated tram position"
          />
          <span className="w-16 text-right text-sm tabular-nums text-slate-500">{(simAlong / 1000).toFixed(1)} km</span>
        </div>
      )}

      {locationHint && (
        <p className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
          {locationHint}
        </p>
      )}

      <section className="card space-y-3 border-2 border-tram-600 dark:border-tram-600">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-tram-700 dark:text-tram-500">Now passing</p>
            <h2 className="text-3xl font-extrabold leading-tight">
              {current ? current.name : 'Not on the line yet'}
              {current?.name_zh && <span className="ml-2 text-xl font-semibold text-slate-500">{current.name_zh}</span>}
            </h2>
            {current?.description && <p className="text-slate-600 dark:text-slate-400">{current.description}</p>}
          </div>
          {sourceLabel && (
            <span className="chip shrink-0 bg-tram-100 text-tram-700 dark:bg-tram-900 dark:text-tram-100">{sourceLabel}</span>
          )}
        </div>
        {current ? (
          <PrayerList district={current} />
        ) : (
          <p className="text-slate-600 dark:text-slate-400">
            When the tram is moving, the current district and its prayer items appear here.
          </p>
        )}
        {next && (
          <p className="border-t border-slate-200 pt-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
            Next: <span className="font-semibold text-slate-900 dark:text-slate-100">{next.name}</span>
            {next.prayer_items[0] && <> — {next.prayer_items[0].title}</>}
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-bold">All districts</h3>
        {ordered.map((d) => {
          const open = selectedId === d.id;
          const isCurrent = d.id === currentId;
          return (
            <div key={d.id} className={`card p-0 ${isCurrent ? 'ring-2 ring-berry-500' : ''}`}>
              <button
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => setSelectedId(open ? null : d.id)}
                aria-expanded={open}
              >
                <span className="flex-1">
                  <span className="text-lg font-semibold">{d.name}</span>
                  {d.name_zh && <span className="ml-2 text-slate-500">{d.name_zh}</span>}
                </span>
                {isCurrent && <span className="chip bg-berry-600 text-white">Now</span>}
                <span className="text-sm text-slate-500">{d.prayer_items.length} items</span>
                <span aria-hidden>{open ? '▾' : '▸'}</span>
              </button>
              {open && (
                <div className="px-4 pb-4">
                  <PrayerList district={d} />
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
