import type { SocialKey, Socials } from '@/lib/types';

export const SOCIAL_LABELS: Record<SocialKey, { label: string; placeholder: string }> = {
  instagram: { label: 'Instagram', placeholder: 'username' },
  facebook: { label: 'Facebook', placeholder: 'username or profile URL' },
  whatsapp: { label: 'WhatsApp', placeholder: 'phone with country code, e.g. 85291234567' },
  telegram: { label: 'Telegram', placeholder: 'username' },
  signal: { label: 'Signal', placeholder: 'username or phone' },
  x: { label: 'X / Twitter', placeholder: 'username' },
  linkedin: { label: 'LinkedIn', placeholder: 'profile URL' },
  website: { label: 'Website', placeholder: 'https://…' },
};

const handle = (v: string) => encodeURIComponent(v.trim().replace(/^@/, ''));

function safeUrl(v: string): string | null {
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Returns a safe link for a social handle, or null if it should be shown as plain text. */
export function socialHref(key: SocialKey, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return safeUrl(v);
  switch (key) {
    case 'instagram':
      return `https://instagram.com/${handle(v)}`;
    case 'facebook':
      return `https://facebook.com/${handle(v)}`;
    case 'whatsapp':
      return `https://wa.me/${v.replace(/[^\d]/g, '')}`;
    case 'telegram':
      return `https://t.me/${handle(v)}`;
    case 'x':
      return `https://x.com/${handle(v)}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${handle(v)}`;
    case 'website':
      return safeUrl(`https://${v}`);
    default:
      return null;
  }
}

export function cleanSocials(s: Socials): Socials {
  const out: Socials = {};
  for (const [k, v] of Object.entries(s) as [SocialKey, string | undefined][]) {
    if (v && v.trim()) out[k] = v.trim();
  }
  return out;
}
