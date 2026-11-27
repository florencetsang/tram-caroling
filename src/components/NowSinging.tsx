'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';

/** Live banner: current song/section and host announcement, visible on every tab. */
export function NowSinging() {
  const { eventState, songs } = useStore();
  const song = songs.find((s) => s.id === eventState.current_song_id);
  if (!song && !eventState.announcement) return null;

  return (
    <div className="space-y-1 bg-gold-500 px-4 py-2 text-ink-950">
      {song && (
        <Link href={`/songs/${song.id}`} className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink-950 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ink-950" />
          </span>
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] opacity-80">Now singing</span>
          <span className="flex-1 truncate font-serif text-lg">
            {song.title}
            {eventState.current_section ? ` · ${eventState.current_section}` : ''}
          </span>
          <span aria-hidden>›</span>
        </Link>
      )}
      {eventState.announcement && <p className="text-sm font-medium">📣 {eventState.announcement}</p>}
    </div>
  );
}
