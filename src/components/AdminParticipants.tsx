'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatCode, readResponsesFile } from '@/lib/formImport';
import { useStore } from '@/lib/store';
import type { ParticipantInput, RosterEntry } from '@/lib/types';

const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Host tools for participants (import, add, sign-in IDs) and prayer partner pairing. */
export function AdminParticipants() {
  const { loadRoster } = useStore();
  const [roster, setRoster] = useState<RosterEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setRoster(await loadRoster());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load participants');
    }
  }, [loadRoster]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(
    async (fn: () => Promise<unknown>) => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong');
      }
      await reload();
    },
    [reload],
  );

  return (
    <>
      {error && <p className="rounded-lg bg-[#8e3b2f] p-3 text-sm text-ink-50">{error}</p>}
      <ImportSection roster={roster ?? []} run={run} />
      <RosterSection roster={roster} run={run} />
      <PrayerPartnerSection roster={roster ?? []} run={run} />
    </>
  );
}

type Run = (fn: () => Promise<unknown>) => Promise<void>;

interface PreviewRow {
  row: ParticipantInput;
  status: 'new' | 'imported' | 'name-match' | 'fills';
  checked: boolean;
}

function ImportSection({ roster, run }: { roster: RosterEntry[]; run: Run }) {
  const { importParticipants } = useStore();
  const [preview, setPreview] = useState<PreviewRow[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File | undefined) => {
    setMessage(null);
    setPreview(null);
    if (!file) return;
    try {
      const rows = await readResponsesFile(file);
      const keys = new Set(roster.map((r) => r.form_key).filter(Boolean));
      const names = new Set(roster.filter((r) => r.form_key).map((r) => normName(r.profile.display_name)));
      const fillable = new Set(roster.filter((r) => !r.form_key).map((r) => normName(r.profile.display_name)));
      setPreview(
        rows.map((row) => {
          const n = normName(row.display_name);
          const status: PreviewRow['status'] =
            row.form_key && keys.has(row.form_key)
              ? 'imported'
              : row.form_key && fillable.has(n)
                ? 'fills'
                : names.has(n) || fillable.has(n)
                  ? 'name-match'
                  : 'new';
          return { row, status, checked: status === 'new' || status === 'fills' };
        }),
      );
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not read the file');
    }
  };

  const selected = preview?.filter((p) => p.checked) ?? [];

  const doImport = () =>
    run(async () => {
      setBusy(true);
      try {
        const res = await importParticipants(selected.map((p) => p.row));
        const merged = res.merged ?? 0;
        setMessage(
          `Added ${res.added} participant${res.added === 1 ? '' : 's'}` +
            (merged ? `, filled in ${merged} existing profile${merged === 1 ? '' : 's'}` : '') +
            (res.skipped ? `, skipped ${res.skipped}` : '') +
            '.',
        );
        setPreview(null);
      } finally {
        setBusy(false);
      }
    });

  return (
    <section className="card space-y-3">
      <div>
        <h3 className="text-xl">📥 Import form responses</h3>
        <p className="text-sm text-ink-500">
          Upload the Google Form responses (.xlsx or .csv). Anyone already imported is skipped, so you can upload the
          latest file again whenever more people respond — existing profiles are never overwritten.
        </p>
      </div>
      <input
        type="file"
        accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="block w-full text-sm"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {message && <p className="text-sm font-semibold">{message}</p>}
      {preview && (
        <div className="space-y-2">
          {!preview.length && <p className="text-sm text-ink-500">No responses found in that file.</p>}
          <ul className="max-h-80 space-y-1 overflow-y-auto">
            {preview.map((p, i) => (
              <li key={i}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={p.checked}
                    disabled={p.status === 'imported'}
                    onChange={(e) =>
                      setPreview((prev) => prev!.map((q, j) => (j === i ? { ...q, checked: e.target.checked } : q)))
                    }
                  />
                  <span className="flex-1">{p.row.display_name}</span>
                  {p.status === 'imported' && <span className="text-ink-500">already imported</span>}
                  {p.status === 'fills' && <span className="text-ink-500">fills existing profile</span>}
                  {p.status === 'name-match' && <span className="text-gold-600 dark:text-gold-400">same name exists</span>}
                </label>
              </li>
            ))}
          </ul>
          {preview.some((p) => p.status === 'name-match') && (
            <p className="text-xs text-ink-500">
              “Same name exists” usually means the person edited their response. Tick it only if it’s a different person.
            </p>
          )}
          <div className="flex gap-2">
            <button className="btn-primary flex-1" disabled={!selected.length || busy} onClick={doImport}>
              Add {selected.length} participant{selected.length === 1 ? '' : 's'}
            </button>
            <button className="btn-secondary" onClick={() => setPreview(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      <ManualAdd run={run} />
    </section>
  );
}

const EMPTY_INPUT: ParticipantInput = {
  form_key: null,
  display_name: '',
  gender: null,
  day_off: null,
  mbti: null,
  conversation_starter: null,
  prayer_request: null,
};

function ManualAdd({ run }: { run: Run }) {
  const { importParticipants } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState<ParticipantInput>(EMPTY_INPUT);
  const set = (k: keyof ParticipantInput) => (e: { target: { value: string } }) =>
    setInput((prev) => ({ ...prev, [k]: e.target.value || null }));

  if (!open) {
    return (
      <button className="btn-secondary w-full" onClick={() => setOpen(true)}>
        Add a participant manually
      </button>
    );
  }
  return (
    <form
      className="space-y-2 border-t border-ink-200 pt-3 dark:border-ink-800"
      onSubmit={(e) => {
        e.preventDefault();
        if (!input.display_name?.trim()) return;
        run(async () => {
          await importParticipants([{ ...input, display_name: input.display_name.trim() }]);
          setInput(EMPTY_INPUT);
          setOpen(false);
        });
      }}
    >
      <input className="input" placeholder="Name *" required value={input.display_name ?? ''} onChange={set('display_name')} />
      <div className="grid grid-cols-2 gap-2">
        <input className="input" placeholder="Gender" value={input.gender ?? ''} onChange={set('gender')} />
        <input className="input" placeholder="MBTI" value={input.mbti ?? ''} onChange={set('mbti')} />
      </div>
      <input className="input" placeholder="Ideal day off" value={input.day_off ?? ''} onChange={set('day_off')} />
      <textarea
        className="input min-h-16"
        placeholder="Conversation starter for their prayer partner"
        value={input.conversation_starter ?? ''}
        onChange={set('conversation_starter')}
      />
      <textarea
        className="input min-h-16"
        placeholder="How can their prayer partner pray for them?"
        value={input.prayer_request ?? ''}
        onChange={set('prayer_request')}
      />
      <div className="flex gap-2">
        <button className="btn-primary flex-1" type="submit">
          Add participant
        </button>
        <button className="btn-secondary" type="button" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function csvCell(v: string) {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function RosterSection({ roster, run }: { roster: RosterEntry[] | null; run: Run }) {
  const { removeParticipant } = useStore();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      window.prompt('Copy this:', text);
    }
  };

  const lines = (roster ?? []).map((r) => `${r.profile.display_name}\t${r.code ? formatCode(r.code) : ''}`);

  const download = () => {
    const csv = ['Name,Sign-in ID', ...(roster ?? []).map((r) => `${csvCell(r.profile.display_name)},${r.code ? formatCode(r.code) : ''}`)].join('\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sign-in-ids.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xl">🔑 Participants &amp; sign-in IDs</h3>
        <span className="text-sm text-ink-500">{roster?.length ?? '…'}</span>
      </div>
      <p className="text-sm text-ink-500">Send each person their own sign-in ID. They enter it on the Me tab.</p>
      {roster && roster.length > 0 && (
        <div className="flex gap-2">
          <button className="btn-secondary flex-1" onClick={() => copy(lines.join('\n'), 'all')}>
            {copied === 'all' ? 'Copied!' : 'Copy all'}
          </button>
          <button className="btn-secondary flex-1" onClick={download}>
            Download CSV
          </button>
        </div>
      )}
      <ul className="divide-y divide-ink-200 dark:divide-ink-800">
        {roster?.map((r) => (
          <li key={r.profile.id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1 truncate">
              {r.profile.display_name}
              {r.is_host && <span className="ml-2 text-xs font-semibold text-gold-600 dark:text-gold-400">HOST</span>}
            </span>
            {r.code && (
              <button
                className="rounded-lg border border-ink-300 px-2 py-1 font-mono text-sm dark:border-ink-700"
                title="Copy sign-in ID"
                onClick={() => copy(formatCode(r.code!), r.profile.id)}
              >
                {copied === r.profile.id ? 'Copied!' : formatCode(r.code)}
              </button>
            )}
            <button
              className="px-2 text-ink-400 hover:text-[#8e3b2f]"
              aria-label={`Remove ${r.profile.display_name}`}
              onClick={() => {
                if (window.confirm(`Remove ${r.profile.display_name}? Their profile and sign-in ID will be deleted.`)) {
                  run(() => removeParticipant(r.profile.id));
                }
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function PrayerPartnerSection({ roster, run }: { roster: RosterEntry[]; run: Run }) {
  const { eventState, updateEventState, addPrayerGroups, removePrayerGroup } = useStore();
  const [picked, setPicked] = useState<string[]>([]);
  const [showCards, setShowCards] = useState(false);

  const groups = useMemo(() => {
    const m = new Map<number, RosterEntry[]>();
    roster.forEach((r) => {
      if (r.group_no !== null) m.set(r.group_no, [...(m.get(r.group_no) ?? []), r]);
    });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [roster]);
  const unpaired = roster.filter((r) => r.group_no === null);

  useEffect(() => {
    setPicked((p) => p.filter((id) => unpaired.some((r) => r.profile.id === id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster]);

  const autoPair = () => {
    const ids = shuffle(unpaired.map((r) => r.profile.id));
    const out: string[][] = [];
    for (let i = 0; i + 1 < ids.length; i += 2) out.push([ids[i], ids[i + 1]]);
    if (ids.length % 2 === 1) {
      if (out.length) out[out.length - 1].push(ids[ids.length - 1]);
    }
    return out;
  };

  const on = eventState.prayer_partners_on;

  return (
    <section className="card space-y-4">
      <h3 className="text-xl">🙏 Prayer partners</h3>
      <label className="flex items-center justify-between gap-3 rounded-xl border border-ink-300 p-3 dark:border-ink-700">
        <span>
          <span className="block font-semibold">Start prayer partner session</span>
          <span className="block text-sm text-ink-500">
            {on ? 'Participants can now see their partner.' : 'Partners stay hidden until you switch this on.'}
          </span>
        </span>
        <input
          type="checkbox"
          className="h-6 w-6"
          checked={on}
          onChange={(e) => run(() => updateEventState({ prayer_partners_on: e.target.checked }))}
        />
      </label>

      <div className="space-y-2">
        <p className="label">
          Pairs ({groups.length}) · {unpaired.length} unpaired
        </p>
        {groups.map(([no, members]) => (
          <div key={no} className="flex items-center gap-2 rounded-xl bg-ink-100 px-3 py-2 dark:bg-ink-900">
            <span className="flex-1">{members.map((m) => m.profile.display_name).join(' · ')}</span>
            <button className="text-sm text-ink-500 underline" onClick={() => run(() => removePrayerGroup(no))}>
              Unpair
            </button>
          </div>
        ))}
      </div>

      {unpaired.length > 0 && (
        <div className="space-y-2">
          <p className="label">Pick 2–3 people to pair</p>
          <div className="flex flex-wrap gap-2">
            {unpaired.map((r) => {
              const active = picked.includes(r.profile.id);
              return (
                <button
                  key={r.profile.id}
                  className={`rounded-full px-3 py-1 text-sm ${
                    active ? 'bg-gold-500 text-ink-950' : 'border border-ink-300 dark:border-ink-700'
                  }`}
                  onClick={() =>
                    setPicked((p) => (active ? p.filter((x) => x !== r.profile.id) : p.length < 3 ? [...p, r.profile.id] : p))
                  }
                >
                  {r.profile.display_name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              className="btn-primary flex-1"
              disabled={picked.length < 2}
              onClick={() =>
                run(async () => {
                  await addPrayerGroups([picked]);
                  setPicked([]);
                })
              }
            >
              Pair selected ({picked.length})
            </button>
            <button
              className="btn-secondary flex-1"
              disabled={unpaired.length < 2}
              onClick={() => {
                if (window.confirm(`Randomly pair the ${unpaired.length} unpaired people?`)) run(() => addPrayerGroups(autoPair()));
              }}
            >
              Auto-pair the rest
            </button>
          </div>
          {unpaired.length % 2 === 1 && unpaired.length > 1 && (
            <p className="text-xs text-ink-500">Odd number left — auto-pair will make one group of three.</p>
          )}
        </div>
      )}

      <div>
        <button className="text-sm text-gold-600 underline dark:text-gold-400" onClick={() => setShowCards((s) => !s)}>
          {showCards ? 'Hide' : 'Show'} conversation starters &amp; prayer requests
        </button>
        {showCards && (
          <ul className="mt-2 space-y-3">
            {roster.map((r) => (
              <li key={r.profile.id} className="text-sm">
                <p className="font-semibold">{r.profile.display_name}</p>
                <p>
                  <span className="text-ink-500">Starter: </span>
                  {r.card?.conversation_starter || '—'}
                </p>
                <p>
                  <span className="text-ink-500">Pray for: </span>
                  {r.card?.prayer_request || '—'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
