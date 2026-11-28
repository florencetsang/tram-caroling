'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { SOCIAL_LABELS, socialHref } from '@/lib/socials';
import { SOCIAL_KEYS, type Profile } from '@/lib/types';

/** Gender, ideal day off and MBTI from the registration form. */
export function ProfileFacts({ profile }: { profile: Profile }) {
  const facts = [
    { label: 'Gender', value: profile.gender },
    { label: 'MBTI', value: profile.mbti },
    { label: 'Ideal day off', value: profile.day_off },
  ].filter((f) => f.value);
  if (!facts.length) return null;
  return (
    <dl className="space-y-2 text-left">
      {facts.map((f) => (
        <div key={f.label}>
          <dt className="label">{f.label}</dt>
          <dd className="whitespace-pre-line">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The signed-in participant's prayer partner(s), revealed once a host starts the session. */
export function MyPrayerPartners() {
  const { user, partners, eventState } = useStore();
  if (!user) return null;
  if (!eventState.prayer_partners_on) {
    return (
      <div className="card text-sm text-ink-600 dark:text-ink-400">
        🙏 Your prayer partner will be revealed when the organisers start the prayer partner session.
      </div>
    );
  }
  if (!partners.length) {
    return (
      <div className="card text-sm text-ink-600 dark:text-ink-400">
        🙏 You haven’t been paired with a prayer partner yet — check back soon.
      </div>
    );
  }
  return (
    <section className="card space-y-4 border-2 border-gold-500">
      <h3 className="text-xl">🙏 Your prayer partner{partners.length > 1 ? 's' : ''}</h3>
      {partners.map(({ profile, card }) => (
        <div key={profile.id} className="space-y-3">
          <Link href={`/people/${profile.id}`} className="flex items-center gap-3">
            <Avatar profile={profile} size={56} />
            <span className="text-2xl font-semibold">{profile.display_name}</span>
          </Link>
          <div>
            <p className="label">Conversation starter</p>
            <p className="whitespace-pre-line">{card?.conversation_starter || '—'}</p>
          </div>
          <div>
            <p className="label">Please pray for</p>
            <p className="whitespace-pre-line">{card?.prayer_request || '—'}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

export function Avatar({ profile, size = 48 }: { profile: Pick<Profile, 'display_name' | 'avatar_url'>; size?: number }) {
  const initials = profile.display_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-tram-700 font-serif text-gold-300 dark:bg-ink-800"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials || '?'}
    </span>
  );
}

export function SocialLinks({ profile }: { profile: Profile }) {
  const entries = SOCIAL_KEYS.filter((k) => profile.socials[k]);
  if (!entries.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {entries.map((k) => {
        const value = profile.socials[k]!;
        const href = socialHref(k, value);
        const label = `${SOCIAL_LABELS[k].label}: ${value.replace(/^https?:\/\/(www\.)?/, '')}`;
        return (
          <li key={k}>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="btn-secondary px-3 py-1.5 text-sm">
                {label}
              </a>
            ) : (
              <span className="btn-secondary cursor-default px-3 py-1.5 text-sm">{label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
