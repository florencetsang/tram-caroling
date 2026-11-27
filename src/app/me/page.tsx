'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Avatar, MyPrayerPartners } from '@/components/ProfileBits';
import { DEMO_ROSTER } from '@/data/demo';
import { formatCode } from '@/lib/formImport';
import { cleanSocials, SOCIAL_LABELS } from '@/lib/socials';
import { useStore, type PrayerCardInput, type ProfileInput } from '@/lib/store';
import { SOCIAL_KEYS } from '@/lib/types';

function SignIn() {
  const { mode, signInWithCode } = useStore();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await signInWithCode(code);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card space-y-3" onSubmit={submit}>
      <h2 className="text-3xl">Sign in</h2>
      <p className="text-sm text-ink-500">Enter the personal sign-in ID the organisers sent you.</p>
      <label className="block">
        <span className="label">Sign-in ID</span>
        <input
          className="input text-center font-mono text-2xl uppercase tracking-[0.2em]"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
        />
      </label>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? 'Checking…' : 'Sign in'}
      </button>
      {message && <p className="text-sm text-[#8e3b2f] dark:text-[#e3a397]">{message}</p>}
      {mode === 'demo' && (
        <p className="text-xs text-ink-500">
          Demo mode — try {DEMO_ROSTER.map((p) => formatCode(p.code!)).join(', ')}.
        </p>
      )}
    </form>
  );
}

const EMPTY_PROFILE: ProfileInput = {
  display_name: '',
  avatar_url: null,
  bio: '',
  church: '',
  gender: '',
  day_off: '',
  mbti: '',
  socials: {},
  visible: true,
};

function ProfileEditor() {
  const { user, myProfile, saveProfile, uploadAvatar, signOut, mode } = useStore();
  const [form, setForm] = useState<ProfileInput>(EMPTY_PROFILE);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (myProfile) {
      const { id: _id, ...rest } = myProfile;
      setForm({
        ...rest,
        bio: rest.bio ?? '',
        church: rest.church ?? '',
        gender: rest.gender ?? '',
        day_off: rest.day_off ?? '',
        mbti: rest.mbti ?? '',
      });
    }
  }, [myProfile]);

  const set = <K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const onAvatar = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setStatus('Uploading photo…');
    try {
      set('avatar_url', await uploadAvatar(file));
      setStatus('Photo ready — remember to save.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await saveProfile({
        ...form,
        display_name: form.display_name.trim() || 'Participant',
        bio: form.bio?.trim() || null,
        church: form.church?.trim() || null,
        gender: form.gender?.trim() || null,
        day_off: form.day_off?.trim() || null,
        mbti: form.mbti?.trim() || null,
        socials: cleanSocials(form.socials),
      });
      setStatus('Saved ✓');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="card flex items-center gap-4">
        <Avatar profile={{ display_name: form.display_name || '?', avatar_url: form.avatar_url }} size={72} />
        <div className="flex-1 space-y-2">
          <label className="btn-secondary cursor-pointer px-3 py-1.5 text-sm">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
          </label>
          {form.avatar_url && (
            <button type="button" className="ml-2 text-sm text-[#8e3b2f] dark:text-[#e3a397]" onClick={() => set('avatar_url', null)}>
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-3">
        <label className="block">
          <span className="label">Display name</span>
          <input className="input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} required maxLength={60} />
        </label>
        <label className="block">
          <span className="label">Gender</span>
          <input className="input" list="gender-options" value={form.gender ?? ''} onChange={(e) => set('gender', e.target.value)} maxLength={40} />
          <datalist id="gender-options">
            <option value="Female" />
            <option value="Male" />
          </datalist>
        </label>
        <label className="block">
          <span className="label">Your ideal day off usually involves…</span>
          <textarea className="input min-h-20" value={form.day_off ?? ''} onChange={(e) => set('day_off', e.target.value)} maxLength={500} />
        </label>
        <label className="block">
          <span className="label">MBTI (if you know it)</span>
          <input className="input uppercase" value={form.mbti ?? ''} onChange={(e) => set('mbti', e.target.value)} maxLength={20} placeholder="e.g. ENFJ" />
        </label>
        <label className="block">
          <span className="label">Church / group (optional)</span>
          <input className="input" value={form.church ?? ''} onChange={(e) => set('church', e.target.value)} maxLength={80} />
        </label>
        <label className="block">
          <span className="label">About me (optional)</span>
          <textarea className="input min-h-24" value={form.bio ?? ''} onChange={(e) => set('bio', e.target.value)} maxLength={500} />
        </label>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 accent-tram-700" checked={form.visible} onChange={(e) => set('visible', e.target.checked)} />
          <span>Show me in the participants list</span>
        </label>
      </div>

      <div className="card space-y-3">
        <div>
          <h3 className="text-xl">Connect with me</h3>
          <p className="text-sm text-ink-500">Optional. Only fill in the accounts you’re happy for other signed-in participants to see.</p>
        </div>
        {SOCIAL_KEYS.map((k) => (
          <label key={k} className="block">
            <span className="label">{SOCIAL_LABELS[k].label}</span>
            <input
              className="input"
              value={form.socials[k] ?? ''}
              placeholder={SOCIAL_LABELS[k].placeholder}
              onChange={(e) => set('socials', { ...form.socials, [k]: e.target.value })}
              maxLength={200}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary flex-1" disabled={busy}>
          Save profile
        </button>
        {user && (
          <Link href={`/people/${user.profile_id}`} className="btn-secondary">
            Preview
          </Link>
        )}
      </div>
      {status && <p className="text-center text-sm text-ink-600 dark:text-ink-400">{status}</p>}

      <button type="button" className="btn-secondary w-full" onClick={() => signOut()}>
        {mode === 'demo' ? 'Leave (demo sign out)' : 'Sign out'}
      </button>
    </form>
  );
}

function PrayerCardEditor() {
  const { myCard, savePrayerCard } = useStore();
  const [form, setForm] = useState<PrayerCardInput>({ conversation_starter: '', prayer_request: '' });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      conversation_starter: myCard?.conversation_starter ?? '',
      prayer_request: myCard?.prayer_request ?? '',
    });
  }, [myCard]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    try {
      await savePrayerCard({
        conversation_starter: form.conversation_starter?.trim() || null,
        prayer_request: form.prayer_request?.trim() || null,
      });
      setStatus('Saved ✓');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card space-y-3" onSubmit={onSubmit}>
      <div>
        <h3 className="text-xl">🙏 For your prayer partner</h3>
        <p className="text-sm text-ink-500">Only your prayer partner (and the organisers) can see this.</p>
      </div>
      <label className="block">
        <span className="label">Give your prayer partner a conversation starter</span>
        <textarea
          className="input min-h-20"
          value={form.conversation_starter ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, conversation_starter: e.target.value }))}
          maxLength={1000}
        />
      </label>
      <label className="block">
        <span className="label">How can your prayer partner pray for you this December?</span>
        <textarea
          className="input min-h-24"
          value={form.prayer_request ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, prayer_request: e.target.value }))}
          maxLength={2000}
        />
      </label>
      <button className="btn-primary w-full" disabled={busy}>
        Save
      </button>
      {status && <p className="text-center text-sm text-ink-600 dark:text-ink-400">{status}</p>}
    </form>
  );
}

export default function MePage() {
  const { user, isAdmin } = useStore();
  return (
    <div className="space-y-4">
      <h2 className="text-3xl">Me</h2>
      {user ? (
        <>
          <MyPrayerPartners />
          <ProfileEditor />
          <PrayerCardEditor />
        </>
      ) : (
        <SignIn />
      )}
      {!isAdmin && (
        <p className="text-center text-sm">
          <Link href="/admin" className="text-ink-500 underline">
            Host controls
          </Link>
        </p>
      )}
    </div>
  );
}
