'use client';

import { SOCIAL_LABELS, socialHref } from '@/lib/socials';
import { SOCIAL_KEYS, type Profile } from '@/lib/types';

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
      className="flex shrink-0 items-center justify-center rounded-full bg-tram-100 font-bold text-tram-700 dark:bg-tram-900 dark:text-tram-100"
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
