'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, SocialLinks } from '@/components/ProfileBits';
import { useStore } from '@/lib/store';

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const { profiles, myProfile, user } = useStore();
  const profile = profiles.find((p) => p.id === id) ?? (myProfile?.id === id ? myProfile : undefined);

  return (
    <div className="space-y-4">
      <Link href="/people" className="text-sm text-tram-700 dark:text-tram-500">
        ← All participants
      </Link>
      {!profile ? (
        <p className="text-slate-500">{user ? 'This profile is not available.' : 'Sign in to view profiles.'}</p>
      ) : (
        <div className="card space-y-4 text-center">
          <div className="flex justify-center">
            <Avatar profile={profile} size={112} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">{profile.display_name}</h2>
            {profile.church && <p className="text-slate-500">{profile.church}</p>}
          </div>
          {profile.bio && <p className="whitespace-pre-line text-lg">{profile.bio}</p>}
          <div className="flex justify-center">
            <SocialLinks profile={profile} />
          </div>
          {profile.id === user?.id && (
            <Link href="/me" className="btn-secondary">
              Edit my profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
