'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChordSheet } from '@/components/ChordSheet';
import { transposeKey } from '@/lib/chordpro';
import { useStore } from '@/lib/store';

function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignore */
    }
  };
  return [value, set];
}

const isImage = (url: string) => /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const { songs, eventState, loading } = useStore();
  const song = songs.find((s) => s.id === id);

  const [showChords, setShowChords] = usePersisted('tc.showChords', true);
  const [fontSize, setFontSize] = usePersisted('tc.fontSize', 20);
  const [transpose, setTranspose] = useState(0);
  const [tab, setTab] = useState<'lyrics' | 'score'>('lyrics');

  if (!song) {
    return (
      <div className="space-y-3">
        <p className="text-slate-500">{loading ? 'Loading…' : 'Song not found.'}</p>
        <Link href="/songs" className="btn-secondary">
          ← All songs
        </Link>
      </div>
    );
  }

  const isLive = eventState.current_song_id === song.id;

  return (
    <div className="space-y-4">
      <div>
        <Link href="/songs" className="text-sm text-tram-700 dark:text-tram-500">
          ← All songs
        </Link>
        <h2 className="mt-1 text-3xl font-extrabold leading-tight">{song.title}</h2>
        {song.author && <p className="text-slate-500">{song.author}</p>}
        {isLive && (
          <p className="mt-1 inline-block rounded-full bg-berry-600 px-3 py-0.5 text-sm font-semibold text-white">
            Singing now{eventState.current_section ? ` · ${eventState.current_section}` : ''}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 p-2 text-sm dark:bg-slate-900">
        {song.score_url && (
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
            {(['lyrics', 'score'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-1 font-semibold ${tab === t ? 'bg-tram-700 text-white' : ''}`}
              >
                {t === 'lyrics' ? 'Lyrics' : 'Score'}
              </button>
            ))}
          </div>
        )}
        <button className="btn-secondary px-3 py-1 text-sm" onClick={() => setShowChords(!showChords)}>
          {showChords ? 'Hide chords' : 'Show chords'}
        </button>
        {showChords && (
          <span className="inline-flex items-center gap-1">
            <button className="btn-secondary px-2.5 py-1 text-sm" onClick={() => setTranspose(transpose - 1)} aria-label="Transpose down">
              −
            </button>
            <span className="min-w-[4.5rem] text-center font-semibold">
              {song.song_key ? `Key ${transposeKey(song.song_key, transpose)}` : `${transpose > 0 ? '+' : ''}${transpose}`}
            </span>
            <button className="btn-secondary px-2.5 py-1 text-sm" onClick={() => setTranspose(transpose + 1)} aria-label="Transpose up">
              +
            </button>
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1">
          <button className="btn-secondary px-2.5 py-1 text-sm" onClick={() => setFontSize(Math.max(14, fontSize - 2))} aria-label="Smaller text">
            A−
          </button>
          <button className="btn-secondary px-2.5 py-1 text-sm" onClick={() => setFontSize(Math.min(40, fontSize + 2))} aria-label="Larger text">
            A+
          </button>
        </span>
      </div>

      {tab === 'score' && song.score_url ? (
        <div className="card">
          {isImage(song.score_url) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={song.score_url} alt={`Score for ${song.title}`} className="w-full rounded-lg bg-white" />
          ) : (
            <div className="space-y-3">
              <iframe src={song.score_url} title={`Score for ${song.title}`} className="h-[70vh] w-full rounded-lg bg-white" />
              <a href={song.score_url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                Open score in new tab
              </a>
            </div>
          )}
        </div>
      ) : (
        <ChordSheet
          chordpro={song.chordpro}
          transpose={transpose}
          showChords={showChords}
          fontSize={fontSize}
          activeSection={isLive ? eventState.current_section : null}
        />
      )}
    </div>
  );
}
