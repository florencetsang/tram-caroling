export const SOCIAL_KEYS = [
  'instagram',
  'facebook',
  'whatsapp',
  'telegram',
  'signal',
  'x',
  'linkedin',
  'website',
] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type Socials = Partial<Record<SocialKey, string>>;

export interface PrayerItem {
  id: string;
  district_id: string;
  title: string;
  body: string;
  sort_order: number;
}

export interface District {
  id: string;
  name: string;
  name_zh: string | null;
  sort_order: number;
  /** Point where this district's stretch of the tram line begins. */
  start_lat: number;
  start_lng: number;
  description: string | null;
  prayer_items: PrayerItem[];
}

export interface Song {
  id: string;
  title: string;
  author: string | null;
  song_key: string | null;
  /** Lyrics and chords in ChordPro format. */
  chordpro: string;
  /** Optional PDF or image of the score. */
  score_url: string | null;
  sort_order: number;
  /** Optional set-list section heading, e.g. "Session One — Christmas Joy". */
  session: string | null;
}

export interface EventState {
  current_song_id: string | null;
  /** Section label, e.g. "Verse 2" or "Chorus". */
  current_section: string | null;
  district_override_id: string | null;
  announcement: string | null;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  church: string | null;
  socials: Socials;
  visible: boolean;
}

export interface AppUser {
  id: string;
  email: string | null;
}

export const EMPTY_EVENT_STATE: EventState = {
  current_song_id: null,
  current_section: null,
  district_override_id: null,
  announcement: null,
  updated_at: new Date(0).toISOString(),
};
