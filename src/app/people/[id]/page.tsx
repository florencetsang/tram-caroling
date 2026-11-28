'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, ProfileFacts, SocialLinks } from '@/components/ProfileBits';
import { useStore } from '@/lib/store';

export default function PersonPage() {
  const { id } = useParams<{ id: string }>();
  const { profiles, myProfile, user, partners } = useStore();
  const partner = partners.find((p) => p.profile.id === id);
  const profile =
    profiles.find((p) => p.id === id) ?? (myProfile?.id === id ? myProfile : undefined) ?? partner?.profile;
  const partnerCard = partner?.card;

  return (
    <div className="space-y-4">
      <Link href="/people" className="text-sm text-gold-600 dark:text-gold-400">
        ← All participants
      </Link>
      {!profile ? (
        <p className="text-ink-500">{user ? 'This profile is not available.' : 'Sign in to view profiles.'}</p>
      ) : (
        <div className="card space-y-4 text-center">
          <div className="flex justify-center">
            <Avatar profile={profile} size={112} />
          </div>
          <div>
            <h2 className="text-3xl">{profile.display_name}</h2>
            {profile.church && <p className="text-ink-500">{profile.church}</p>}
          </div>
          {profile.bio && <p className="whitespace-pre-line text-lg">{profile.bio}</p>}
          <div className="flex justify-center">
            <SocialLinks profile={profile} />
          </div>
          <ProfileFacts profile={profile} />
          {partnerCard && (
            <div className="space-y-2 rounded-xl border-2 border-gold-500 p-3 text-left">
              <p className="font-semibold">🙏 Your prayer partner</p>
              <div>
                <p className="label">Conversation starter</p>
                <p className="whitespace-pre-line">{partnerCard.conversation_starter || '—'}</p>
              </div>
              <div>
                <p className="label">Please pray for</p>
                <p className="whitespace-pre-line">{partnerCard.prayer_request || '—'}</p>
              </div>
            </div>
          )}
          {profile.id === user?.profile_id && (
            <Link href="/me" className="btn-secondary">
              Edit my profile
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
