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
import { DEMO_DISTRICTS, DEMO_EVENT_NAME, DEMO_PROFILES, DEMO_SONGS } from '@/data/demo';
import { dataUrlToBlob, resizeImage } from '@/lib/image';
import { EVENT_ID, getSupabase, isDemoMode } from '@/lib/supabase';
import {
  EMPTY_EVENT_STATE,
  type AppUser,
  type District,
  type EventState,
  type Profile,
  type Song,
} from '@/lib/types';

export type EventStatePatch = Partial<Omit<EventState, 'updated_at'>>;
export type ProfileInput = Omit<Profile, 'id'>;

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
  isAdmin: boolean;
  updateEventState(patch: EventStatePatch): Promise<void>;
  saveProfile(input: ProfileInput): Promise<void>;
  uploadAvatar(file: File): Promise<string>;
  sendSignInEmail(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<void>;
  demoSignIn(name: string): void;
  signOut(): Promise<void>;
  setDemoAdmin(on: boolean): void;
  refresh(): Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const KEYS = {
  demoState: 'tc.demo.eventState',
  demoUser: 'tc.demo.user',
  demoProfile: 'tc.demo.profile',
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
    socials: (row.socials as Profile['socials']) ?? {},
    visible: row.visible !== false,
  };
}

const byName = (a: Profile, b: Profile) => a.display_name.localeCompare(b.display_name);

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
  const [otherProfiles, setOtherProfiles] = useState<Profile[]>(demo ? DEMO_PROFILES : []);
  const [user, setUser] = useState<AppUser | null>(null);
  const [myProfile, setMyProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const eventStateRef = useRef(eventState);
  const setEventState = useCallback((s: EventState) => {
    eventStateRef.current = s;
    setEventStateRaw(s);
  }, []);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // ---------- Demo mode ----------
  useEffect(() => {
    if (!demo) return;
    setEventState(readJSON<EventState>(KEYS.demoState) ?? EMPTY_EVENT_STATE);
    setUser(readJSON<AppUser>(KEYS.demoUser));
    setMyProfile(readJSON<Profile>(KEYS.demoProfile));
    setIsAdmin(readJSON<boolean>(KEYS.demoAdmin) === true);

    // Sync "live" state between tabs/windows of this browser to mimic realtime.
    const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('tc-demo') : null;
    channelRef.current = channel;
    if (channel) {
      channel.onmessage = (e: MessageEvent) => {
        if (e.data?.type === 'state') setEventState(e.data.state as EventState);
      };
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEYS.demoState) setEventState(readJSON<EventState>(KEYS.demoState) ?? EMPTY_EVENT_STATE);
    };
    window.addEventListener('storage', onStorage);
    return () => {
      channel?.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
    };
  }, [demo, setEventState]);

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
        setEventState(cached.eventState);
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
      setEventState(cached.eventState);
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

  // ---------- Supabase: auth ----------
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
    });
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser((prev) => (u ? (prev?.id === u.id ? prev : { id: u.id, email: u.email ?? null }) : null));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const loadPeople = useCallback(async (uid: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const [me, list, role] = await Promise.all([
      sb.from('profiles').select('*').eq('id', uid).maybeSingle(),
      sb.from('profiles').select('*').eq('visible', true).order('display_name'),
      sb.from('event_roles').select('role').eq('event_id', EVENT_ID).eq('user_id', uid).maybeSingle(),
    ]);
    setMyProfile(me.data ? toProfile(me.data as Record<string, unknown>) : null);
    setOtherProfiles(((list.data ?? []) as Record<string, unknown>[]).map(toProfile).filter((p) => p.id !== uid));
    setIsAdmin(role.data?.role === 'admin');
  }, []);

  useEffect(() => {
    if (demo) return;
    if (!user) {
      setMyProfile(null);
      setOtherProfiles([]);
      setIsAdmin(false);
      return;
    }
    loadPeople(user.id);
  }, [demo, user, loadPeople]);

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
        updated_at: next.updated_at,
        updated_by: user?.id ?? null,
      });
      if (err) throw new Error(err.message);
    },
    [demo, setEventState, user],
  );

  const saveProfile = useCallback(
    async (input: ProfileInput) => {
      if (!user) throw new Error('Please sign in first.');
      const profile: Profile = { ...input, id: user.id };
      if (demo) {
        writeJSON(KEYS.demoProfile, profile);
        setMyProfile(profile);
        return;
      }
      const sb = getSupabase()!;
      const { error: err } = await sb
        .from('profiles')
        .upsert({ ...profile, updated_at: new Date().toISOString() });
      if (err) throw new Error(err.message);
      await loadPeople(user.id);
    },
    [demo, user, loadPeople],
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

  const sendSignInEmail = useCallback(async (email: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/me`, shouldCreateUser: true },
    });
    if (err) throw new Error(err.message);
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const sb = getSupabase();
    if (!sb) return;
    const { error: err } = await sb.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    if (err) throw new Error(err.message);
  }, []);

  const demoSignIn = useCallback((name: string) => {
    const u: AppUser = { id: 'demo-me', email: null };
    writeJSON(KEYS.demoUser, u);
    setUser(u);
    const existing = readJSON<Profile>(KEYS.demoProfile);
    const profile: Profile = existing ?? {
      id: u.id,
      display_name: name.trim() || 'Me',
      avatar_url: null,
      bio: null,
      church: null,
      socials: {},
      visible: true,
    };
    writeJSON(KEYS.demoProfile, profile);
    setMyProfile(profile);
  }, []);

  const signOut = useCallback(async () => {
    if (demo) {
      writeJSON(KEYS.demoUser, null);
      setUser(null);
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
    if (user) await loadPeople(user.id);
  }, [demo, loadContent, loadPeople, user]);

  const profiles = useMemo(() => {
    const list = [...otherProfiles];
    if (myProfile && myProfile.visible && user) list.push(myProfile);
    return list.sort(byName);
  }, [otherProfiles, myProfile, user]);

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
    isAdmin,
    updateEventState,
    saveProfile,
    uploadAvatar,
    sendSignInEmail,
    verifyCode,
    demoSignIn,
    signOut,
    setDemoAdmin,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
