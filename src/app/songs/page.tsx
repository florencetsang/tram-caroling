'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function SongsPage() {
  const { songs, eventState, loading } = useStore();
  const current = songs.find((s) => s.id === eventState.current_song_id);

  if (loading && !songs.length) return <p className="text-slate-500">Loading songs…</p>;

  return (
    <div className="space-y-4">
      {current && (
        <Link href={`/songs/${current.id}`} className="card block border-2 border-berry-500">
          <p className="text-sm font-semibold uppercase tracking-wide text-berry-600">Now singing</p>
          <p className="text-2xl font-extrabold">{current.title}</p>
          {eventState.current_section && <p className="text-slate-600 dark:text-slate-400">{eventState.current_section}</p>}
        </Link>
      )}

      <h2 className="text-xl font-bold">Song list</h2>
      <ul className="space-y-2">
        {songs.map((s, i) => (
          <li key={s.id}>
            <Link href={`/songs/${s.id}`} className="card flex items-center gap-3">
              <span className="w-6 text-right text-lg font-bold text-slate-400">{i + 1}</span>
              <span className="flex-1">
                <span className="block text-lg font-semibold">{s.title}</span>
                {s.author && <span className="block text-sm text-slate-500">{s.author}</span>}
              </span>
              {s.song_key && <span className="chip bg-slate-100 dark:bg-slate-800">Key {s.song_key}</span>}
              {s.id === current?.id && <span className="chip bg-berry-600 text-white">Live</span>}
            </Link>
          </li>
        ))}
      </ul>
      {!songs.length && <p className="text-slate-500">No songs yet.</p>}
    </div>
  );
}
