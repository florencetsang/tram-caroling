'use client';

import { useEffect, useMemo, useRef } from 'react';
import { parseChordPro, transposeChord, type Line } from '@/lib/chordpro';

interface Props {
  chordpro: string;
  transpose: number;
  showChords: boolean;
  fontSize: number;
  activeSection?: string | null;
}

function LyricLine({ line, transpose, showChords }: { line: Line; transpose: number; showChords: boolean }) {
  if (line.type === 'empty') return <div className="h-3" />;
  if (line.type === 'comment')
    return <p className="my-1 italic text-ink-500 dark:text-ink-400">{line.text}</p>;
  const hasChords = showChords && line.segments.some((s) => s.chord);
  if (!hasChords) return <p className="leading-snug">{line.segments.map((s) => s.lyric).join('')}</p>;
  return (
    <div className="flex flex-wrap items-end">
      {line.segments.map((s, i) => (
        <span key={i} className="inline-flex flex-col">
          <span className="min-h-[1.2em] pr-1 font-mono text-[0.8em] font-bold text-gold-600 dark:text-gold-400">
            {s.chord ? transposeChord(s.chord, transpose) : '\u00a0'}
          </span>
          <span className="whitespace-pre leading-snug">{s.lyric || '\u00a0'}</span>
        </span>
      ))}
    </div>
  );
}

export function ChordSheet({ chordpro, transpose, showChords, fontSize, activeSection }: Props) {
  const song = useMemo(() => parseChordPro(chordpro), [chordpro]);
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!activeSection) return;
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeSection]);

  return (
    <div style={{ fontSize: `${fontSize}px` }} className="space-y-5">
      {song.sections.map((section, i) => {
        const active = !!activeSection && section.label === activeSection;
        return (
          <section
            key={i}
            ref={active ? (el) => { activeRef.current = el; } : undefined}
            className={`rounded-xl p-3 transition ${
              active ? 'bg-gold-100 ring-1 ring-gold-500 dark:bg-gold-900/30' : ''
            } ${section.kind === 'chorus' ? 'border-l-2 border-gold-500 pl-4' : ''}`}
          >
            <h4 className="mb-1 text-[0.65em] font-semibold uppercase tracking-[0.2em] text-gold-600 dark:text-gold-400">
              {section.label}
              {active && <span className="ml-2 normal-case tracking-normal text-ink-700 dark:text-ink-200">● singing now</span>}
            </h4>
            {section.lines.map((line, j) => (
              <LyricLine key={j} line={line} transpose={transpose} showChords={showChords} />
            ))}
          </section>
        );
      })}
    </div>
  );
}
