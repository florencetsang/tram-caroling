'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { DEMO_DISTRICTS, DEMO_EVENT_NAME, DEMO_ROSTER, DEMO_SONGS } from '@/data/demo';
import { dataUrlToBlob, resizeImage } from '@/lib/image';
import { EVENT_ID, getSupabase, isDemoMode } from '@/lib/supabase';
import {
  EMPTY_EVENT_STATE,
  type AppUser,
  type District,
  type EventState,
  type ParticipantInput,
  type PrayerCard,
  type PrayerPartner,
  type Profile,
  type RosterEntry,
  type Song,
} from '@/lib/types';

export type EventStatePatch = Partial<Omit<EventState, 'updated_at'>>;
export type ProfileInput = Omit<Profile, 'id'>;
export type PrayerCardInput = Omit<PrayerCard, 'profile_id'>;
export interface ImportResult {
  added: number;
  merged?: number;
  skipped: number;
}

interface StoreValue {
  mode: 'demo' | 'supabase';
  eventName: string;
  loading: boolean;
  error: string | null;
  districts: District[];
  songs: Song[];
  eventState: EventState;
  profiles: Profile[];
  user: AppUser | null;
  myProfile: Profile | null;
  myCard: PrayerCard | null;
  /** My prayer partner(s); empty until a host starts the prayer partner session. */
  partners: PrayerPartner[];
  isAdmin: boolean;
  updateEventState(patch: EventStatePatch): Promise<void>;
  saveProfile(input: ProfileInput): Promise<void>;
  savePrayerCard(input: PrayerCardInput): Promise<void>;
  uploadAvatar(file: File): Promise<string>;
  signInWithCode(code: string): Promise<void>;
  signOut(): Promise<void>;
  setDemoAdmin(on: boolean): void;
  refresh(): Promise<void>;
  // Host tools
  loadRoster(): Promise<RosterEntry[]>;
  importParticipants(rows: ParticipantInput[]): Promise<ImportResult>;
  removeParticipant(profileId: string): Promise<void>;
  addPrayerGroups(groups: string[][]): Promise<void>;
  removePrayerGroup(groupNo: number): Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const KEYS = {
  demoState: 'tc.demo.eventState',
  demoUser: 'tc.demo.user',
  demoRoster: 'tc.demo.roster',
  demoAdmin: 'tc.demo.admin',
  cache: `tc.cache.${EVENT_ID}`,
};

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable */
  }
}

function toEventState(row: Record<string, unknown> | null | undefined): EventState {
  if (!row) return EMPTY_EVENT_STATE;
  return {
    current_song_id: (row.current_song_id as string | null) ?? null,
    current_section: (row.current_section as string | null) ?? null,
    district_override_id: (row.district_override_id as string | null) ?? null,
    announcement: (row.announcement as string | null) ?? null,
    prayer_partners_on: row.prayer_partners_on === true,
    updated_at: (row.updated_at as string) ?? new Date().toISOString(),
  };
}

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    display_name: (row.display_name as string) || 'Participant',
    avatar_url: (row.avatar_url as string | null) ?? null,
    bio: (row.bio as string | null) ?? null,
    church: (row.church as string | null) ?? null,
    gender: (row.gender as string | null) ?? null,
    day_off: (row.day_off as string | null) ?? null,
    mbti: (row.mbti as string | null) ?? null,
    socials: (row.socials as Profile['socials']) ?? {},
    visible: row.visible !== false,
  };
}

function toCard(row: Record<string, unknown> | null | undefined): PrayerCard | null {
  if (!row) return null;
  return {
    profile_id: row.profile_id as string,
    conversation_starter: (row.conversation_starter as string | null) ?? null,
    prayer_request: (row.prayer_request as string | null) ?? null,
  };
}

const byName = (a: Profile, b: Profile) => a.display_name.localeCompare(b.display_name);
const normalizeCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

function demoCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => alphabet[b % 32]).join('');
}

interface CachedContent {
  eventName: string;
  districts: District[];
  songs: Song[];
  eventState: EventState;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const demo = isDemoMode;
  const [eventName, setEventName] = useState(DEMO_EVENT_NAME);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState<string | null>(null);
  const [districts, setDistricts] = useState<District[]>(demo ? DEMO_DISTRICTS : []);
  const [songs, setSongs] = useState<Song[]>(demo ? DEMO_SONGS : []);
  const [eventState, setEventStateRaw] = useState<EventState>(EMPTY_EVENT_STATE);
  const [isAdmin, setIsAdmin] = useState(false);

  // Supabase-mode people data.
  const [authUid, setAuthUid] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sbProfiles, setSbProfiles] = useState<Profile[]>([]);
  const [sbMe, setSbMe] = useState<Profile | null>(null);
  const [sbCard, setSbCard] = useState<PrayerCard | null>(null);
  const [sbPartners, setSbPartners] = useState<PrayerPartner[]>([]);

  // Demo-mode people data (everything lives in localStorage).
  const [demoRoster, setDemoRosterRaw] = useState<RosterEntry[]>([]);
  const [demoUser, setDemoUser] = useState<AppUser | null>(null);

  const eventStateRef = useRef(eventState);
  const setEventState = useCallback((s: EventState) => {
    eventStateRef.current = s;
    setEventStateRaw(s);
  }, []);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const demoRosterRef = useRef(demoRoster);
  const setDemoRoster = useCallback((r: RosterEntry[], broadcast = true) => {
    demoRosterRef.current = r;
    setDemoRosterRaw(r);
    if (broadcast) {
      writeJSON(KEYS.demoRoster, r);
      channelRef.current?.postMessage({ type: 'roster' });
    }
  }, []);

  // ---------- Demo mode ----------
  useEffect(() => {
    if (!demo) return;
    const loadRosterFromStorage = () =>
      setDemoRoster(
        readJSON<RosterEntry[]>(KEYS.demoRoster) ?? DEMO_ROSTER.map((p) => ({ ...p, form_key: null })),
        false,
      );
    setEventState({ ...EMPTY_EVENT_STATE, ...readJSON<EventState>(KEYS.demoState) });
    loadRosterFromStorage();
    setDemoUser(readJSON<AppUser>(KEYS.demoUser));
    setIsAdmin(readJSON<boolean>(KEYS.demoAdmin) === true);

    // Sync "live" state between tabs/windows of this browser to mimic realtime.
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tc-demo') : null;
    channelRef.current = channel;
    if (channel) {
      channel.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'state') setEventState(e.data.state as EventState);
        if (e.data?.type === 'roster') loadRosterFromStorage();
      };
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.demoState) setEventState({ ...EMPTY_EVENT_STATE, ...readJSON<EventState>(KEYS.demoState) });
      if (e.key === KEYS.demoRoster) loadRosterFromStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
    };
  }, [demo, setEventState, setDemoRoster]);

  // ---------- Supabase: content + realtime ----------
  const loadContent = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      const [ev, ds, ss, st] = await Promise.all([
        sb.from('events').select('name').eq('id', EVENT_ID).maybeSingle(),
        sb
          .from('districts')
          .select('id, name, name_zh, sort_order, start_lat, start_lng, description, prayer_items(id, district_id, title, body, sort_order)')
          .eq('event_id', EVENT_ID)
          .order('sort_order'),
        sb
          .from('songs')
          .select('id, title, author, song_key, chordpro, score_url, sort_order, session')
          .eq('event_id', EVENT_ID)
          .order('sort_order'),
        sb.from('event_state').select('*').eq('event_id', EVENT_ID).maybeSingle(),
      ]);
      const firstError = ev.error || ds.error || ss.error || st.error;
      if (firstError) throw firstError;
      const content: CachedContent = {
        eventName: (ev.data?.name as string) || DEMO_EVENT_NAME,
        districts: ((ds.data ?? []) as unknown as District[]).map((d) => ({
          ...d,
          prayer_items: [...(d.prayer_items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
        })),
        songs: (ss.data ?? []) as unknown as Song[],
        eventState: toEventState(st.data as Record<string, unknown> | null),
      };
      setEventName(content.eventName);
      setDistricts(content.districts);
      setSongs(content.songs);
      setEventState(content.eventState);
      writeJSON(KEYS.cache, content);
      setError(null);
    } catch (e) {
      const cached = readJSON<CachedContent>(KEYS.cache);
      if (cached) {
        setEventName(cached.eventName);
        setDistricts(cached.districts);
        setSongs(cached.songs);
        setEventState({ ...EMPTY_EVENT_STATE, ...cached.eventState });
        setError('Offline — showing saved content.');
      } else {
        setError(e instanceof Error ? e.message : 'Could not load event data.');
      }
    } finally {
      setLoading(false);
    }
  }, [setEventState]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const cached = readJSON<CachedContent>(KEYS.cache);
    if (cached) {
      setEventName(cached.eventName);
      setDistricts(cached.districts);
      setSongs(cached.songs);
      setEventState({ ...EMPTY_EVENT_STATE, ...cached.eventState });
      setLoading(false);
    }
    loadContent();

    const channel = sb
      .channel(`event_state:${EVENT_ID}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_state', filter: `event_id=eq.${EVENT_ID}` },
        (payload) => {
          if (payload.eventType === 'DELETE') setEventState(EMPTY_EVENT_STATE);
          else setEventState(toEventState(payload.new as Record<string, unknown>));
        },
      )
      .subscribe();

    // Realtime can drop while a phone is locked; refetch when the app comes back.
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadContent();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', loadContent);
    return () => {
      sb.removeChannel(channel);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', loadContent);
    };
  }, [loadContent, setEventState]);

  // ---------- Supabase: auth (anonymous session linked to a participant) ----------
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setAuthUid(data.session?.user.id ?? null));
    const { data } = sb.auth.onAuthStateChange((_event, session) => setAuthUid(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    if (!authUid) {
      setProfileId(null);
      return;
    }
    let cancelled = false;
    sb.from('profile_logins')
      .select('profile_id')
      .eq('user_id', authUid)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setProfileId((data?.profile_id as string | undefined) ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [authUid]);

  const loadPeople = useCallback(async (pid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const [me, list, role, card] = await Promise.all([
      sb.from('profiles').select('*').eq('id', pid).maybeSingle(),
      sb.from('profiles').select('*').eq('event_id', EVENT_ID).eq('visible', true).order('display_name'),
      sb.from('event_roles').select('role').eq('event_id', EVENT_ID).eq('profile_id', pid).maybeSingle(),
      sb.from('prayer_cards').select('*').eq('profile_id', pid).maybeSingle(),
    ]);
    if (!me.error && !me.data) {
      // This participant was removed by a host.
      setProfileId(null);
      return;
    }
    if (me.data) setSbMe(toProfile(me.data as Record<string, unknown>));
    setSbProfiles(((list.data ?? []) as Record<string, unknown>[]).map(toProfile));
    setIsAdmin(role.data?.role === 'admin');
    setSbCard(toCard(card.data as Record<string, unknown> | null));
  }, []);

  useEffect(() => {
    if (demo) return;
    if (!profileId) {
      setSbMe(null);
      setSbProfiles([]);
      setSbCard(null);
      setIsAdmin(false);
      return;
    }
    loadPeople(profileId);
  }, [demo, profileId, loadPeople]);

  const partnersOn = eventState.prayer_partners_on;
  const loadPartners = useCallback(async (pid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { data: rows } = await sb.from('prayer_partners').select('profile_id, group_no').eq('event_id', EVENT_ID);
    const mine = rows?.find((r) => r.profile_id === pid);
    const ids = mine
      ? rows!.filter((r) => r.group_no === mine.group_no && r.profile_id !== pid).map((r) => r.profile_id as string)
      : [];
    if (!ids.length) {
      setSbPartners([]);
      return;
    }
    const [ps, cs] = await Promise.all([
      sb.from('profiles').select('*').in('id', ids),
      sb.from('prayer_cards').select('*').in('profile_id', ids),
    ]);
    const cards = ((cs.data ?? []) as Record<string, unknown>[]).map((c) => toCard(c)!);
    setSbPartners(
      ((ps.data ?? []) as Record<string, unknown>[])
        .map(toProfile)
        .sort(byName)
        .map((profile) => ({ profile, card: cards.find((c) => c.profile_id === profile.id) ?? null })),
    );
  }, []);

  useEffect(() => {
    if (demo) return;
    if (!profileId || !partnersOn) {
      setSbPartners([]);
      return;
    }
    loadPartners(profileId);
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadPartners(profileId);
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [demo, profileId, partnersOn, loadPartners]);

  // ---------- Derived people data ----------
  const user: AppUser | null = useMemo(() => {
    if (demo) return demoUser && demoRoster.some((r) => r.profile.id === demoUser.profile_id) ? demoUser : null;
    return authUid && profileId ? { id: authUid, profile_id: profileId } : null;
  }, [demo, demoUser, demoRoster, authUid, profileId]);

  const myEntry = demo && user ? demoRoster.find((r) => r.profile.id === user.profile_id) ?? null : null;
  const myProfile = demo ? myEntry?.profile ?? null : user ? sbMe : null;
  const myCard = demo ? myEntry?.card ?? null : user ? sbCard : null;

  const partners: PrayerPartner[] = useMemo(() => {
    if (!demo) return sbPartners;
    if (!partnersOn || !myEntry || myEntry.group_no === null) return [];
    return demoRoster
      .filter((r) => r.group_no === myEntry.group_no && r.profile.id !== myEntry.profile.id)
      .map((r) => ({ profile: r.profile, card: r.card }))
      .sort((a, b) => byName(a.profile, b.profile));
  }, [demo, sbPartners, partnersOn, myEntry, demoRoster]);

  const profiles = useMemo(() => {
    if (demo) return demoRoster.map((r) => r.profile).filter((p) => p.visible).sort(byName);
    const list = sbProfiles.filter((p) => p.id !== sbMe?.id);
    if (sbMe?.visible && user) list.push(sbMe);
    return list.sort(byName);
  }, [demo, demoRoster, sbProfiles, sbMe, user]);

  // ---------- Actions ----------
  const updateEventState = useCallback(
    async (patch: EventStatePatch) => {
      const next: EventState = { ...eventStateRef.current, ...patch, updated_at: new Date().toISOString() };
      setEventState(next);
      if (demo) {
        writeJSON(KEYS.demoState, next);
        channelRef.current?.postMessage({ type: 'state', state: next });
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb.from('event_state').upsert({
        event_id: EVENT_ID,
        current_song_id: next.current_song_id,
        current_section: next.current_section,
        district_override_id: next.district_override_id,
        announcement: next.announcement,
        prayer_partners_on: next.prayer_partners_on,
        updated_at: next.updated_at,
        updated_by: authUid,
      });
      if (err) throw new Error(err.message);
    },
    [demo, setEventState, authUid],
  );

  const updateDemoEntry = useCallback(
    (profileId: string, fn: (r: RosterEntry) => RosterEntry) =>
      setDemoRoster(demoRosterRef.current.map((r) => (r.profile.id === profileId ? fn(r) : r))),
    [setDemoRoster],
  );

  const saveProfile = useCallback(
    async (input: ProfileInput) => {
      if (!user) throw new Error('Please sign in first.');
      if (demo) {
        updateDemoEntry(user.profile_id, (r) => ({ ...r, profile: { ...input, id: user.profile_id } }));
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb
        .from('profiles')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', user.profile_id);
      if (err) throw new Error(err.message);
      await loadPeople(user.profile_id);
    },
    [demo, user, loadPeople, updateDemoEntry],
  );

  const savePrayerCard = useCallback(
    async (input: PrayerCardInput) => {
      if (!user) throw new Error('Please sign in first.');
      const card: PrayerCard = { ...input, profile_id: user.profile_id };
      if (demo) {
        updateDemoEntry(user.profile_id, (r) => ({ ...r, card }));
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb.from('prayer_cards').upsert({ ...card, updated_at: new Date().toISOString() });
      if (err) throw new Error(err.message);
      setSbCard(card);
    },
    [demo, user, updateDemoEntry],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!user) throw new Error('Please sign in first.');
      const dataUrl = await resizeImage(file, 320);
      if (demo) return dataUrl;
      const sb = getSupabase()!;
      const path = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: err } = await sb.storage
        .from('avatars')
        .upload(path, await dataUrlToBlob(dataUrl), { contentType: 'image/jpeg', upsert: false });
      if (err) throw new Error(err.message);
      return sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    },
    [demo, user],
  );

  const signInWithCode = useCallback(
    async (code: string) => {
      const normalized = normalizeCode(code);
      if (!normalized) throw new Error('Please enter your sign-in ID.');
      if (demo) {
        const entry = demoRosterRef.current.find((r) => r.code === normalized);
        if (!entry) throw new Error('That sign-in ID was not recognised. Please check it and try again.');
        const u: AppUser = { id: 'demo-device', profile_id: entry.profile.id };
        writeJSON(KEYS.demoUser, u);
        setDemoUser(u);
        return;
      }
      const sb = getSupabase()!;
      const { data } = await sb.auth.getSession();
      let uid = data.session?.user.id ?? null;
      if (!uid) {
        const { data: anon, error: anonErr } = await sb.auth.signInAnonymously();
        if (anonErr) throw new Error(anonErr.message);
        uid = anon.user?.id ?? null;
      }
      const { data: pid, error: err } = await sb.rpc('claim_sign_in', { p_code: normalized });
      if (err) throw new Error(err.message);
      setAuthUid(uid);
      setProfileId(pid as string);
    },
    [demo],
  );

  const signOut = useCallback(async () => {
    if (demo) {
      writeJSON(KEYS.demoUser, null);
      setDemoUser(null);
      return;
    }
    await getSupabase()?.auth.signOut();
  }, [demo]);

  const setDemoAdmin = useCallback(
    (on: boolean) => {
      if (!demo) return;
      writeJSON(KEYS.demoAdmin, on);
      setIsAdmin(on);
    },
    [demo],
  );

  const refresh = useCallback(async () => {
    if (demo) return;
    await loadContent();
    if (profileId) {
      await loadPeople(profileId);
      if (eventStateRef.current.prayer_partners_on) await loadPartners(profileId);
    }
  }, [demo, loadContent, loadPeople, loadPartners, profileId]);

  // ---------- Host tools ----------
  const loadRoster = useCallback(async (): Promise<RosterEntry[]> => {
    if (demo) return demoRosterRef.current;
    const sb = getSupabase()!;
    const [ps, codes, cards, groups, roles] = await Promise.all([
      sb.from('profiles').select('*').eq('event_id', EVENT_ID).order('display_name'),
      sb.from('sign_in_codes').select('profile_id, code'),
      sb.from('prayer_cards').select('*'),
      sb.from('prayer_partners').select('profile_id, group_no').eq('event_id', EVENT_ID),
      sb.from('event_roles').select('profile_id').eq('event_id', EVENT_ID).eq('role', 'admin'),
    ]);
    const firstError = ps.error || codes.error || cards.error || groups.error || roles.error;
    if (firstError) throw new Error(firstError.message);
    return ((ps.data ?? []) as Record<string, unknown>[]).map((row) => {
      const id = row.id as string;
      return {
        profile: toProfile(row),
        form_key: (row.form_key as string | null) ?? null,
        code: (codes.data?.find((c) => c.profile_id === id)?.code as string | undefined) ?? null,
        card: toCard((cards.data as Record<string, unknown>[] | null)?.find((c) => c.profile_id === id)),
        group_no: (groups.data?.find((g) => g.profile_id === id)?.group_no as number | undefined) ?? null,
        is_host: roles.data?.some((r) => r.profile_id === id) ?? false,
      };
    });
  }, [demo]);

  const importParticipants = useCallback(
    async (rows: ParticipantInput[]): Promise<ImportResult> => {
      if (demo) {
        const roster = [...demoRosterRef.current];
        const result: ImportResult = { added: 0, merged: 0, skipped: 0 };
        for (const row of rows) {
          const name = row.display_name.trim().slice(0, 60);
          if (!name || (row.form_key && roster.some((r) => r.form_key === row.form_key))) {
            result.skipped++;
            continue;
          }
          const match = row.form_key
            ? roster.findIndex((r) => !r.form_key && r.profile.display_name.toLowerCase() === name.toLowerCase())
            : -1;
          if (match >= 0) {
            const r = roster[match];
            roster[match] = {
              ...r,
              form_key: row.form_key,
              profile: {
                ...r.profile,
                gender: r.profile.gender ?? row.gender,
                day_off: r.profile.day_off ?? row.day_off,
                mbti: r.profile.mbti ?? row.mbti,
              },
              card: {
                profile_id: r.profile.id,
                conversation_starter: r.card?.conversation_starter ?? row.conversation_starter,
                prayer_request: r.card?.prayer_request ?? row.prayer_request,
              },
            };
            result.merged!++;
            continue;
          }
          const id = `demo-${crypto.randomUUID()}`;
          roster.push({
            profile: {
              id,
              display_name: name,
              avatar_url: null,
              bio: null,
              church: null,
              gender: row.gender,
              day_off: row.day_off,
              mbti: row.mbti,
              socials: {},
              visible: true,
            },
            form_key: row.form_key,
            code: demoCode(),
            card: { profile_id: id, conversation_starter: row.conversation_starter, prayer_request: row.prayer_request },
            group_no: null,
          });
          result.added++;
        }
        setDemoRoster(roster);
        return result;
      }
      const sb = getSupabase()!;
      const { data, error: err } = await sb.rpc('admin_import_participants', { p_event: EVENT_ID, p_rows: rows });
      if (err) throw new Error(err.message);
      if (profileId) await loadPeople(profileId);
      return data as ImportResult;
    },
    [demo, setDemoRoster, profileId, loadPeople],
  );

  const removeParticipant = useCallback(
    async (id: string) => {
      if (demo) {
        setDemoRoster(demoRosterRef.current.filter((r) => r.profile.id !== id));
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb.from('profiles').delete().eq('id', id);
      if (err) throw new Error(err.message);
      if (profileId) await loadPeople(profileId);
    },
    [demo, setDemoRoster, profileId, loadPeople],
  );

  const addPrayerGroups = useCallback(
    async (groups: string[][]) => {
      const ids = groups.flat();
      if (!ids.length) return;
      if (demo) {
        let next = Math.max(0, ...demoRosterRef.current.map((r) => r.group_no ?? 0)) + 1;
        const assigned = new Map<string, number>();
        groups.forEach((g) => {
          const n = next++;
          g.forEach((id) => assigned.set(id, n));
        });
        setDemoRoster(demoRosterRef.current.map((r) => (assigned.has(r.profile.id) ? { ...r, group_no: assigned.get(r.profile.id)! } : r)));
        return;
      }
      const sb = getSupabase()!;
      const { data: existing, error: readErr } = await sb
        .from('prayer_partners')
        .select('group_no')
        .eq('event_id', EVENT_ID)
        .order('group_no', { ascending: false })
        .limit(1);
      if (readErr) throw new Error(readErr.message);
      let next = ((existing?.[0]?.group_no as number | undefined) ?? 0) + 1;
      const rows = groups.flatMap((g) => {
        const n = next++;
        return g.map((profile_id) => ({ profile_id, event_id: EVENT_ID, group_no: n }));
      });
      const { error: err } = await sb.from('prayer_partners').upsert(rows);
      if (err) throw new Error(err.message);
    },
    [demo, setDemoRoster],
  );

  const removePrayerGroup = useCallback(
    async (groupNo: number) => {
      if (demo) {
        setDemoRoster(demoRosterRef.current.map((r) => (r.group_no === groupNo ? { ...r, group_no: null } : r)));
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb.from('prayer_partners').delete().eq('event_id', EVENT_ID).eq('group_no', groupNo);
      if (err) throw new Error(err.message);
    },
    [demo, setDemoRoster],
  );

  const value: StoreValue = {
    mode: demo ? 'demo' : 'supabase',
    eventName,
    loading,
    error,
    districts,
    songs,
    eventState,
    profiles,
    user,
    myProfile,
    myCard,
    partners,
    isAdmin,
    updateEventState,
    saveProfile,
    savePrayerCard,
    uploadAvatar,
    signInWithCode,
    signOut,
    setDemoAdmin,
    refresh,
    loadRoster,
    importParticipants,
    removeParticipant,
    addPrayerGroups,
    removePrayerGroup,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
