/**
 * Minimal ChordPro parser / transposer covering the directives used for carols:
 * title, subtitle/artist, key, comment, start/end_of_verse|chorus|bridge and
 * inline [Chord] markers.
 */

export interface Segment {
  chord: string | null;
  lyric: string;
}

export type Line =
  | { type: 'lyrics'; segments: Segment[] }
  | { type: 'comment'; text: string }
  | { type: 'empty' };

export type SectionKind = 'verse' | 'chorus' | 'bridge' | 'other';

export interface Section {
  label: string;
  kind: SectionKind;
  lines: Line[];
}

export interface ParsedSong {
  title: string | null;
  subtitle: string | null;
  key: string | null;
  sections: Section[];
}

const DIRECTIVE = /^\{\s*([a-z_]+)\s*(?::\s*(.*?))?\s*\}$/i;

const START: Record<string, SectionKind> = {
  start_of_verse: 'verse',
  sov: 'verse',
  start_of_chorus: 'chorus',
  soc: 'chorus',
  start_of_bridge: 'bridge',
  sob: 'bridge',
};
const END = new Set(['end_of_verse', 'eov', 'end_of_chorus', 'eoc', 'end_of_bridge', 'eob']);

function parseLyricLine(line: string): Line {
  const segments: Segment[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let chord: string | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const text = line.slice(last, m.index);
    if (text || chord) segments.push({ chord, lyric: text });
    chord = m[1].trim();
    last = m.index + m[0].length;
  }
  const rest = line.slice(last);
  if (rest || chord) segments.push({ chord, lyric: rest });
  return { type: 'lyrics', segments };
}

export function parseChordPro(source: string): ParsedSong {
  const song: ParsedSong = { title: null, subtitle: null, key: null, sections: [] };
  const counters: Record<SectionKind, number> = { verse: 0, chorus: 0, bridge: 0, other: 0 };
  let current: Section | null = null;
  let inExplicit = false;

  const open = (kind: SectionKind, label?: string | null): Section => {
    counters[kind] += 1;
    const fallback =
      kind === 'verse'
        ? `Verse ${counters.verse}`
        : kind === 'chorus'
          ? 'Chorus'
          : kind === 'bridge'
            ? 'Bridge'
            : `Part ${counters.other}`;
    const section: Section = { label: label?.trim() || fallback, kind, lines: [] };
    song.sections.push(section);
    return section;
  };

  for (const raw of source.replace(/\r\n?/g, '\n').split('\n')) {
    const line = raw.trimEnd();
    if (line.startsWith('#')) continue;
    const d = line.trim().match(DIRECTIVE);
    if (d) {
      const name = d[1].toLowerCase();
      const value = d[2] ?? null;
      if (name === 'title' || name === 't') song.title = value;
      else if (name === 'subtitle' || name === 'st' || name === 'artist') song.subtitle = value;
      else if (name === 'key') song.key = value;
      else if (name in START) {
        current = open(START[name], value);
        inExplicit = true;
      } else if (END.has(name)) {
        current = null;
        inExplicit = false;
      } else if (name === 'comment' || name === 'c' || name === 'ci') {
        if (!current) current = open('other');
        current.lines.push({ type: 'comment', text: value ?? '' });
      }
      continue;
    }
    if (!line.trim()) {
      if (current && !inExplicit) current = null;
      else if (current) current.lines.push({ type: 'empty' });
      continue;
    }
    if (!current) current = open('other');
    current.lines.push(parseLyricLine(line));
  }
  return song;
}

const SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE_INDEX: Record<string, number> = {};
SHARPS.forEach((n, i) => (NOTE_INDEX[n] = i));
FLATS.forEach((n, i) => (NOTE_INDEX[n] = i));
NOTE_INDEX['Cb'] = 11;
NOTE_INDEX['Fb'] = 4;
NOTE_INDEX['E#'] = 5;
NOTE_INDEX['B#'] = 0;

function transposeNote(note: string, semitones: number, preferFlats: boolean): string {
  const idx = NOTE_INDEX[note];
  if (idx === undefined) return note;
  const next = (((idx + semitones) % 12) + 12) % 12;
  return (preferFlats ? FLATS : SHARPS)[next];
}

export function transposeChord(chord: string, semitones: number): string {
  if (!semitones) return chord;
  const m = chord.match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
  if (!m) return chord;
  const [, root, quality, bass] = m;
  // Flat-friendly keys read better with flats (F, Bb, Eb, Ab, Db).
  const target = transposeNote(root, semitones, false);
  const preferFlats = ['F', 'A#', 'D#', 'G#', 'C#'].includes(target) || root.includes('b');
  const newRoot = transposeNote(root, semitones, preferFlats);
  return newRoot + quality + (bass ? '/' + transposeNote(bass, semitones, preferFlats) : '');
}

export function transposeKey(key: string | null, semitones: number): string | null {
  if (!key) return key;
  return transposeChord(key, semitones);
}

export function sectionLabels(chordpro: string): string[] {
  return parseChordPro(chordpro).sections.map((s) => s.label);
}
