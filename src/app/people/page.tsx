'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar } from '@/components/ProfileBits';
import { useStore } from '@/lib/store';

export default function PeoplePage() {
  const { profiles, user, mode } = useStore();
  const [query, setQuery] = useState('');

  if (mode === 'supabase' && !user) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-4xl">👥</p>
        <h2 className="text-xl font-bold">Participants</h2>
        <p className="text-slate-600 dark:text-slate-400">Sign in to see who else is on the tram and connect with them.</p>
        <Link href="/me" className="btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const list = q
    ? profiles.filter((p) => [p.display_name, p.church, p.bio].some((v) => v?.toLowerCase().includes(q)))
    : profiles;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Participants</h2>
        <span className="text-sm text-slate-500">{profiles.length} people</span>
      </div>
      <input
        className="input"
        type="search"
        placeholder="Search by name or church"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="space-y-2">
        {list.map((p) => (
          <li key={p.id}>
            <Link href={`/people/${p.id}`} className="card flex items-center gap-3">
              <Avatar profile={p} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg font-semibold">
                  {p.display_name}
                  {p.id === user?.id && <span className="ml-2 text-sm font-normal text-slate-500">(you)</span>}
                </span>
                {(p.church || p.bio) && (
                  <span className="block truncate text-sm text-slate-500">{p.church || p.bio}</span>
                )}
              </span>
              <span aria-hidden className="text-slate-400">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!list.length && <p className="text-slate-500">No one found.</p>}
    </div>
  );
}
