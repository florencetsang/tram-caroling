import type { ParticipantInput } from '@/lib/types';

type Cell = string | number | boolean | Date | null | undefined;

const FIELDS = {
  timestamp: (h: string) => h.startsWith('timestamp'),
  display_name: (h: string) => h.includes('your name'),
  gender: (h: string) => h.startsWith('gender'),
  day_off: (h: string) => h.includes('ideal day off'),
  mbti: (h: string) => h.includes('mbti'),
  conversation_starter: (h: string) => h.includes('conversation starter'),
  prayer_request: (h: string) => h.includes('pray for you'),
} as const;
type Field = keyof typeof FIELDS;

const normalizeHeader = (h: Cell) =>
  String(h ?? '')
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

const pad = (n: number) => String(n).padStart(2, '0');

/** Wall-clock "YYYY-MM-DD HH:MM:SS", so .xlsx and .csv exports of the same response match. */
function timestampKey(value: Cell): string {
  if (value instanceof Date) {
    // read-excel-file reads spreadsheet date-times as UTC wall-clock values.
    const d = new Date(Math.round(value.getTime() / 1000) * 1000);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(
      d.getUTCMinutes(),
    )}:${pad(d.getUTCSeconds())}`;
  }
  const s = String(value ?? '').trim();
  const m = s.match(/^(\d{1,4})[/.-](\d{1,2})[/.-](\d{1,4})[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return s;
  const [a, b, c] = [m[1], m[2], m[3]].map(Number);
  let y: number, mo: number, d: number;
  if (m[1].length === 4) [y, mo, d] = [a, b, c];
  else if (b > 12) [y, mo, d] = [c, a, b]; // month/day/year
  else [y, mo, d] = [c, b, a]; // day/month/year (Hong Kong default)
  return `${y}-${pad(mo)}-${pad(d)} ${pad(Number(m[4]))}:${m[5]}:${pad(Number(m[6] ?? 0))}`;
}

const text = (v: Cell) => {
  if (v === null || v === undefined) return null;
  const s = (v instanceof Date ? v.toISOString() : String(v)).trim();
  return s || null;
};

/** Turn spreadsheet rows (header first) into participants. Unrelated form columns are ignored. */
export function rowsToParticipants(rows: Cell[][]): ParticipantInput[] {
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const col = {} as Record<Field, number>;
  (Object.keys(FIELDS) as Field[]).forEach((f) => {
    col[f] = headers.findIndex(FIELDS[f]);
  });
  if (col.display_name < 0) throw new Error('Could not find the “Your name” column in this file.');
  const get = (row: Cell[], f: Field) => (col[f] >= 0 ? row[col[f]] : null);

  return rows
    .slice(1)
    .map((row) => {
      const display_name = text(get(row, 'display_name'))?.replace(/\s+/g, ' ') ?? '';
      const ts = col.timestamp >= 0 ? timestampKey(get(row, 'timestamp')) : '';
      return {
        form_key: display_name ? `${ts}|${display_name.toLowerCase()}` : null,
        display_name,
        gender: text(get(row, 'gender')),
        day_off: text(get(row, 'day_off')),
        mbti: text(get(row, 'mbti')),
        conversation_starter: text(get(row, 'conversation_starter')),
        prayer_request: text(get(row, 'prayer_request')),
      };
    })
    .filter((p) => p.display_name);
}

export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const s = input.replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/** Read the form's “Responses” export (.xlsx or .csv). */
export async function readResponsesFile(file: File): Promise<ParticipantInput[]> {
  if (/\.csv$/i.test(file.name) || file.type === 'text/csv') {
    return rowsToParticipants(parseCsv(await file.text()));
  }
  const { readSheet } = await import('read-excel-file/browser');
  return rowsToParticipants((await readSheet(file)) as Cell[][]);
}

/** "ABCDEFGH" → "ABCD-EFGH" */
export const formatCode = (code: string) => (code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code);
