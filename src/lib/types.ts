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
  /** When on, participants can see who their prayer partner is. */
  prayer_partners_on: boolean;
  updated_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  church: string | null;
  gender: string | null;
  /** "Your ideal day off usually involves…" */
  day_off: string | null;
  mbti: string | null;
  socials: Socials;
  visible: boolean;
}

/** Private notes only the owner, their prayer partner(s) and hosts can read. */
export interface PrayerCard {
  profile_id: string;
  conversation_starter: string | null;
  prayer_request: string | null;
}

export interface PrayerPartner {
  profile: Profile;
  card: PrayerCard | null;
}

export interface AppUser {
  /** Auth user id (per device). */
  id: string;
  /** Participant profile this device is signed in as. */
  profile_id: string;
}

/** One participant as seen by hosts. */
export interface RosterEntry {
  profile: Profile;
  code: string | null;
  card: PrayerCard | null;
  group_no: number | null;
  form_key: string | null;
  is_host?: boolean;
}

/** A participant to add, from a form response or entered by a host. */
export interface ParticipantInput {
  form_key: string | null;
  display_name: string;
  gender: string | null;
  day_off: string | null;
  mbti: string | null;
  conversation_starter: string | null;
  prayer_request: string | null;
}

export const EMPTY_EVENT_STATE: EventState = {
  current_song_id: null,
  current_section: null,
  district_override_id: null,
  announcement: null,
  prayer_partners_on: false,
  updated_at: new Date(0).toISOString(),
};
