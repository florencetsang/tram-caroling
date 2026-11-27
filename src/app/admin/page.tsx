'use client';

import { useEffect, useState } from 'react';
import { sectionLabels } from '@/lib/chordpro';
import { useStore, type EventStatePatch } from '@/lib/store';

export default function AdminPage() {
  const { isAdmin, mode, user, songs, districts, eventState, updateEventState, setDemoAdmin } = useStore();
  const [announcement, setAnnouncement] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setAnnouncement(eventState.announcement ?? ''), [eventState.announcement]);

  if (!isAdmin) {
    return (
      <div className="card space-y-3">
        <h2 className="text-3xl">Host controls</h2>
        {mode === 'demo' ? (
          <>
            <p className="text-ink-600 dark:text-ink-400">
              In demo mode anyone can try the host controls. Open the app in a second tab to see updates arrive live.
            </p>
            <button className="btn-primary w-full" onClick={() => setDemoAdmin(true)}>
              Enable host mode (demo)
            </button>
          </>
        ) : (
          <p className="text-ink-600 dark:text-ink-400">
            {user
              ? 'Your account is not a host for this event. Ask an organiser to add you to event_roles as admin.'
              : 'Sign in on the Me tab first.'}
          </p>
        )}
      </div>
    );
  }

  const apply = async (patch: EventStatePatch) => {
    setError(null);
    try {
      await updateEventState(patch);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    }
  };

  const currentSong = songs.find((s) => s.id === eventState.current_song_id);
  const sections = currentSong ? sectionLabels(currentSong.chordpro) : [];
  const pill = (active: boolean) =>
    `rounded-xl px-3 py-2 text-left font-semibold transition ${
      active ? 'bg-gold-500 text-ink-950' : 'border border-ink-300 bg-ink-50 dark:border-ink-700 dark:bg-ink-900'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl">Host controls</h2>
        {mode === 'demo' && (
          <button className="text-sm text-ink-500 underline" onClick={() => setDemoAdmin(false)}>
            Exit host mode
          </button>
        )}
      </div>
      {error && <p className="rounded-lg bg-[#8e3b2f] p-3 text-sm text-ink-50">{error}</p>}

      <section className="card space-y-3">
        <h3 className="text-xl">🎵 Current song</h3>
        <div className="grid gap-2">
          {songs.map((s) => (
            <button
              key={s.id}
              className={pill(s.id === eventState.current_song_id)}
              onClick={() => apply({ current_song_id: s.id, current_section: sectionLabels(s.chordpro)[0] ?? null })}
            >
              {s.title}
            </button>
          ))}
        </div>
        {currentSong && sections.length > 0 && (
          <div className="space-y-2">
            <p className="label">Section</p>
            <div className="flex flex-wrap gap-2">
              {sections.map((label) => (
                <button
                  key={label}
                  className={pill(label === eventState.current_section)}
                  onClick={() => apply({ current_section: label })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          className="btn-secondary w-full"
          disabled={!eventState.current_song_id}
          onClick={() => apply({ current_song_id: null, current_section: null })}
        >
          Clear current song
        </button>
      </section>

      <section className="card space-y-3">
        <div>
          <h3 className="text-xl">📍 District</h3>
          <p className="text-sm text-ink-500">
            “Automatic” lets each phone use its own location. Pick a district to show it on everyone’s screen.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className={pill(!eventState.district_override_id)} onClick={() => apply({ district_override_id: null })}>
            Automatic (GPS)
          </button>
          {[...districts]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((d) => (
              <button
                key={d.id}
                className={pill(d.id === eventState.district_override_id)}
                onClick={() => apply({ district_override_id: d.id })}
              >
                {d.name}
              </button>
            ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h3 className="text-xl">📣 Announcement</h3>
        <textarea
          className="input min-h-20"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="e.g. Next stop we swap to the upper deck!"
          maxLength={200}
        />
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={() => apply({ announcement: announcement.trim() || null })}>
            Send to everyone
          </button>
          <button
            className="btn-secondary"
            disabled={!eventState.announcement}
            onClick={() => apply({ announcement: null })}
          >
            Clear
          </button>
        </div>
      </section>

      <p className="text-center text-xs text-ink-500">
        Last update {new Date(eventState.updated_at).getTime() > 0 ? new Date(eventState.updated_at).toLocaleTimeString() : '—'}
      </p>
    </div>
  );
}
