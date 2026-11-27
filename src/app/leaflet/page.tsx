import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  LEAFLET_PDF,
  beforeWeSing,
  byName,
  closing,
  cover,
  evening,
  hongKong,
  note,
  sharedCity,
} from '@/data/leaflet';

export const metadata = { title: 'Leaflet • HOLY NIGHT, CITY LIGHTS' };

type Tone = 'night' | 'cream' | 'sky';

const TONES: Record<Tone, string> = {
  night: 'bg-ink-950 text-ink-100',
  cream: 'bg-ink-100 text-ink-900',
  sky: 'bg-gradient-to-b from-[#111418] via-[#0d1f1c] to-ink-950 text-ink-100',
};

function Page({
  tone,
  id,
  page,
  className = '',
  children,
}: {
  tone: Tone;
  id?: string;
  page?: string;
  className?: string;
  children: ReactNode;
}) {
  const muted = tone === 'cream' ? 'text-ink-500' : 'text-ink-400';
  return (
    <section id={id} className={`relative scroll-mt-32 px-7 pb-14 pt-12 sm:px-12 ${TONES[tone]} ${className}`}>
      {children}
      {page && <span className={`absolute bottom-5 right-7 text-xs tabular-nums sm:right-12 ${muted}`}>{page}</span>}
    </section>
  );
}

function Eyebrow({ children, tone }: { children: ReactNode; tone: Tone }) {
  const color = tone === 'cream' ? 'text-gold-600' : 'text-gold-400';
  return <p className={`text-[0.65rem] font-semibold uppercase tracking-[0.24em] ${color}`}>{children}</p>;
}

function Title({ lines, className = '' }: { lines: string[] | string; className?: string }) {
  const list = Array.isArray(lines) ? lines : [lines];
  return (
    <h2 className={`mt-4 font-serif text-[2.6rem] font-normal leading-[1.05] tracking-tight ${className}`}>
      {list.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </h2>
  );
}

function Hairline({ tone }: { tone: Tone }) {
  return <hr className={`my-5 ${tone === 'cream' ? 'border-ink-300' : 'border-ink-100/15'}`} />;
}

function DownloadButton() {
  return (
    <a
      href={LEAFLET_PDF}
      download="Holy Night City Lights - The Night Edition.pdf"
      className="inline-flex items-center gap-2 rounded-full border border-gold-400/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300 hover:bg-gold-400/10"
    >
      <span aria-hidden>↓</span> Download the leaflet (PDF)
    </a>
  );
}

const STARS = [
  [12, 18],
  [28, 9],
  [47, 22],
  [66, 12],
  [83, 26],
  [91, 8],
  [38, 34],
  [74, 38],
];

export default function LeafletPage() {
  return (
    <article className="-mx-4 -mb-28 -mt-4 overflow-hidden">
      {/* 01 — Cover */}
      <Page tone="sky">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {STARS.map(([x, y], i) => (
            <span
              key={i}
              className="absolute h-[3px] w-[3px] rounded-full bg-gold-200/70"
              style={{ left: `${x}%`, top: `${y}%` }}
            />
          ))}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-gold-300/10 to-transparent" />
        </div>
        <div className="relative">
          <Eyebrow tone="sky">{cover.eyebrow}</Eyebrow>
          <h1 className="mt-24 font-serif text-[3.4rem] font-normal uppercase leading-[0.98] tracking-tight sm:text-6xl">
            {cover.title.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h1>
          <span className="mt-6 block h-px w-12 bg-gold-500" />
          <p className="mt-5 font-serif text-xl italic text-ink-200">{cover.tagline}</p>
          <div className="mt-16 border-t border-ink-100/15 pt-5">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-gold-400">{cover.date}</p>
            <p className="mt-2 text-sm text-ink-300">{cover.details}</p>
          </div>
          <div className="mt-8">
            <DownloadButton />
          </div>
        </div>
      </Page>

      {/* 02 — A note before the night */}
      <Page tone="cream" page={note.page}>
        <Eyebrow tone="cream">{note.eyebrow}</Eyebrow>
        <Title lines={note.title} />
        <p className="mt-3 font-serif text-2xl italic text-ink-700">{note.subtitle}</p>
        <div className="mt-8 space-y-4 leading-relaxed text-ink-800">
          {note.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <p className="mt-6 font-serif text-2xl italic">{note.signoff}</p>
        <p className="mt-3 text-xs text-ink-500">{note.references.join('  ·  ')}</p>
        <Hairline tone="cream" />
        <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {note.contents.map((c) => (
            <li key={c.id}>
              <Link href={`#${c.id}`} className="flex gap-3 hover:underline">
                <span className="font-serif tabular-nums text-gold-600">{c.page}</span>
                <span>{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Page>

      {/* 03 — The evening */}
      <Page tone="night" id="evening" page={evening.page}>
        <Eyebrow tone="night">{evening.eyebrow}</Eyebrow>
        <Title lines={evening.title} />
        <p className="mt-3 font-serif text-xl italic text-ink-300">{evening.subtitle}</p>
        <ol className="mt-8">
          {evening.items.map((it, i) => (
            <li key={it.time} className={`grid grid-cols-[4rem_1fr] gap-3 py-3 ${i ? 'border-t border-ink-100/10' : ''}`}>
              <span className="font-serif text-xl tabular-nums text-gold-400">{it.time}</span>
              <span>
                <span className={`block ${it.set ? 'font-serif text-2xl italic' : 'text-base font-medium'}`}>
                  {it.title}
                </span>
                {it.note && <span className="mt-0.5 block text-sm text-ink-400">{it.note}</span>}
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 space-y-1 text-xs text-ink-400">
          {evening.footnotes.map((f) => (
            <p key={f}>{f}</p>
          ))}
        </div>
      </Page>

      {/* 04 — The place we know */}
      <Page tone="cream" id="hong-kong" page={hongKong.page}>
        <Eyebrow tone="cream">{hongKong.eyebrow}</Eyebrow>
        <Title lines={hongKong.title} />
        <Title lines={hongKong.title2} className="mt-2 italic text-gold-600" />
        <div className="mt-8 space-y-4 leading-relaxed text-ink-800">
          {hongKong.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Page>

      {/* 05 — BY NAME */}
      <Page tone="night" id="by-name" page={byName.page}>
        <Eyebrow tone="night">{byName.eyebrow}</Eyebrow>
        <Title lines={byName.title} className="tracking-[0.04em]" />
        <p className="mt-3 font-serif text-xl italic text-ink-300">{byName.subtitle}</p>
        <ol className="mt-8">
          {byName.steps.map((s, i) => (
            <li key={s.n} className={`py-5 ${i ? 'border-t border-dashed border-ink-100/20' : ''}`}>
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-3xl tabular-nums text-gold-400">{s.n}</span>
                <div>
                  <p className="font-serif text-2xl">{s.title}</p>
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-ink-400">{s.when}</p>
                </div>
              </div>
              <p className="mt-3 leading-relaxed text-ink-200">{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 border-t border-ink-100/15 pt-4 text-xs leading-relaxed text-ink-400">{byName.footnote}</p>
      </Page>

      {/* 06 — Our shared city */}
      <Page tone="cream" page={sharedCity.page}>
        <Eyebrow tone="cream">{sharedCity.eyebrow}</Eyebrow>
        <Title lines={sharedCity.title} />
        <p className="mt-3 font-serif text-xl italic text-ink-700">{sharedCity.subtitle}</p>
        <div className="mt-8 space-y-4 leading-relaxed text-ink-800">
          {sharedCity.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <Hairline tone="cream" />
        <p className="text-sm text-ink-600">{sharedCity.reading}</p>
      </Page>

      {/* 07 — Before we sing */}
      <Page tone="night" id="before-we-sing" page={beforeWeSing.page}>
        <Eyebrow tone="night">{beforeWeSing.eyebrow}</Eyebrow>
        <Title lines={beforeWeSing.title} />
        <p className="mt-3 font-serif text-xl italic text-ink-300">{beforeWeSing.subtitle}</p>
        <ul className="mt-8 space-y-5">
          {beforeWeSing.prompts.map((p) => (
            <li key={p.title} className="relative pl-6">
              <span aria-hidden className="absolute left-0 top-0 text-gold-400">
                –
              </span>
              <p className="font-serif text-xl">{p.title}</p>
              <p className="mt-1 leading-relaxed text-ink-300">{p.body}</p>
            </li>
          ))}
        </ul>
        <Hairline tone="night" />
        <p className="text-sm text-ink-400">{beforeWeSing.reading}</p>
      </Page>

      {/* 08 — Closing */}
      <Page tone="sky" className="pb-36">
        <span aria-hidden className="block text-xl text-gold-400">
          ✦
        </span>
        <blockquote className="mt-8 font-serif text-[2.2rem] font-normal leading-[1.15] tracking-tight">
          {closing.verse.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </blockquote>
        <p className="mt-4 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-gold-400">{closing.reference}</p>
        <span className="mt-8 block h-px w-12 bg-gold-500" />
        <p className="mt-6 max-w-md font-serif text-xl italic leading-relaxed text-ink-200">{closing.blessing}</p>
        <p className="mt-12 text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-ink-300">{closing.wordmark}</p>
        <div className="mt-6">
          <DownloadButton />
        </div>
        <div className="mt-8 space-y-2 border-t border-ink-100/10 pt-4 text-[0.65rem] leading-relaxed text-ink-400">
          {closing.credits.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </div>
      </Page>
    </article>
  );
}
