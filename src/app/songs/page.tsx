'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function SongsPage() {
  const { songs, eventState, loading } = useStore();
  const current = songs.find((s) => s.id === eventState.current_song_id);

  if (loading && !songs.length) return <p className="text-ink-500">Loading songs…</p>;

  return (
    <div className="space-y-4">
      {current && (
        <Link href={`/songs/${current.id}`} className="card block border-2 border-gold-500">
          <p className="eyebrow">Now singing</p>
          <p className="mt-1 font-serif text-3xl font-medium">{current.title}</p>
          {eventState.current_section && <p className="serif-italic text-ink-600 dark:text-ink-400">{eventState.current_section}</p>}
        </Link>
      )}

      <div>
        <p className="eyebrow">The carols</p>
        <h2 className="mt-1 text-3xl">Song list</h2>
        <span className="rule-gold mt-3" />
      </div>
      <ul className="space-y-2">
        {songs.map((s, i) => (
          <li key={s.id}>
            {s.session && s.session !== songs[i - 1]?.session && (
              <h3 className="pb-1 pt-4 font-serif text-xl italic text-gold-600 dark:text-gold-400">{s.session}</h3>
            )}
            <Link href={`/songs/${s.id}`} className="card flex items-center gap-3">
              <span className="numeral w-7 text-right text-lg">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex-1">
                <span className="block font-serif text-xl">{s.title}</span>
                {s.author && <span className="block text-sm text-ink-500">{s.author}</span>}
              </span>
              {s.song_key && <span className="chip bg-ink-200/70 text-ink-700 dark:bg-ink-800 dark:text-ink-200">Key {s.song_key}</span>}
              {s.id === current?.id && <span className="chip bg-gold-500 text-ink-950">Live</span>}
            </Link>
          </li>
        ))}
      </ul>
      {!songs.length && <p className="text-ink-500">No songs yet.</p>}
    </div>
  );
}
