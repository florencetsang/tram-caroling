'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ProfileBits';
import { cleanSocials, SOCIAL_LABELS } from '@/lib/socials';
import { useStore, type ProfileInput } from '@/lib/store';
import { SOCIAL_KEYS } from '@/lib/types';

function SignIn() {
  const { mode, sendSignInEmail, verifyCode, demoSignIn } = useStore();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (mode === 'demo') {
    return (
      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          demoSignIn(name);
        }}
      >
        <h2 className="text-3xl">Join the ride</h2>
        <p className="text-sm text-ink-500">Demo mode: no email needed. Your profile is saved on this device only.</p>
        <label className="block">
          <span className="label">Your name</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grace Lam" required />
        </label>
        <button className="btn-primary w-full">Continue</button>
      </form>
    );
  }

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await sendSignInEmail(email.trim());
      setSent(true);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not send email.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await verifyCode(email.trim(), code);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Invalid code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <h2 className="text-3xl">Sign in</h2>
      {!sent ? (
        <form className="space-y-3" onSubmit={send}>
          <p className="text-sm text-ink-500">We’ll email you a sign-in link and a one-time code. No password needed.</p>
          <label className="block">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Email me a link'}
          </button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={verify}>
          <p className="text-sm text-ink-600 dark:text-ink-400">
            Check <strong>{email}</strong>. Tap the link in the email, or enter the code here.
          </p>
          <label className="block">
            <span className="label">One-time code</span>
            <input
              className="input text-center text-2xl tracking-[0.4em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Checking…' : 'Sign in'}
          </button>
          <button type="button" className="btn-secondary w-full" onClick={() => setSent(false)}>
            Use a different email
          </button>
        </form>
      )}
      {message && <p className="text-sm text-[#8e3b2f] dark:text-[#e3a397]">{message}</p>}
    </div>
  );
}

function ProfileEditor() {
  const { user, myProfile, saveProfile, uploadAvatar, signOut, mode } = useStore();
  const [form, setForm] = useState<ProfileInput>({
    display_name: '',
    avatar_url: null,
    bio: '',
    church: '',
    socials: {},
    visible: true,
  });
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (myProfile) {
      const { id: _id, ...rest } = myProfile;
      setForm({ ...rest, bio: rest.bio ?? '', church: rest.church ?? '' });
    } else if (user?.email) {
      setForm((f) => ({ ...f, display_name: f.display_name || user.email!.split('@')[0] }));
    }
  }, [myProfile, user]);

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
          {user?.email && <p className="truncate text-sm text-ink-500">{user.email}</p>}
        </div>
      </div>

      <div className="card space-y-3">
        <label className="block">
          <span className="label">Display name</span>
          <input className="input" value={form.display_name} onChange={(e) => set('display_name', e.target.value)} required maxLength={60} />
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
          <Link href={`/people/${user.id}`} className="btn-secondary">
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

export default function MePage() {
  const { user, isAdmin } = useStore();
  return (
    <div className="space-y-4">
      <h2 className="text-3xl">Me</h2>
      {user ? <ProfileEditor /> : <SignIn />}
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
