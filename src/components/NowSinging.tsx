'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';

/** Live banner: current song/section and host announcement, visible on every tab. */
export function NowSinging() {
  const { eventState, songs } = useStore();
  const song = songs.find((s) => s.id === eventState.current_song_id);
  if (!song && !eventState.announcement) return null;

  return (
    <div className="space-y-1 bg-berry-600 px-4 py-2 text-white">
      {song && (
        <Link href={`/songs/${song.id}`} className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
          </span>
          <span className="text-xs uppercase tracking-wide opacity-90">Now singing</span>
          <span className="flex-1 truncate font-bold">
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
