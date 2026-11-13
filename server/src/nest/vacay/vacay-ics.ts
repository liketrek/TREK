import { safeFetchFollow } from '../../utils/ssrfGuard';

export interface IcsEvent {
  start: string;
  end: string;
  title: string;
}
const DATE = /^\d{8}$/;
const iso = (v: string) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
const validDate = (value: string) => {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${iso(value)}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === iso(value);
};

function unescapeText(value: string): string {
  return value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Parse a deliberately small, safe ICS subset: explicit, all-day VEVENTs only. */
export function parseIcs(text: string): IcsEvent[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .replace(/\r?\n[ \t]/g, '')
    .split(/\r?\n/);
  const events: IcsEvent[] = [];
  let event: Record<string, string> | null = null;
  for (const line of lines) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') {
      event = {};
      continue;
    }
    if (line.toUpperCase() === 'END:VEVENT') {
      if (event) {
        const start = event.DTSTART ?? '';
        const end = event.DTEND ?? '';
        // Timed events and recurring events are intentionally skipped in v1;
        // mixed calendars can still contribute their explicit all-day events.
        if (!validDate(start) || !validDate(end) || event.RRULE) {
          event = null;
          continue;
        }
        const startIso = iso(start),
          endIso = iso(end);
        if (endIso <= startIso) throw new Error('ICS event has an invalid date range');
        const days = (Date.parse(`${endIso}T00:00:00Z`) - Date.parse(`${startIso}T00:00:00Z`)) / 86400000;
        if (days > 366) throw new Error('ICS event date range is too long');
        events.push({ start: startIso, end: endIso, title: event.SUMMARY || 'Holiday' });
        if (events.length > 10000) throw new Error('ICS calendar contains too many events');
      }
      event = null;
      continue;
    }
    if (!event) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).split(';')[0].toUpperCase();
    if (key === 'DTSTART' || key === 'DTEND' || key === 'SUMMARY' || key === 'RRULE') {
      const value = line.slice(colon + 1).trim();
      event[key] = key === 'SUMMARY' ? unescapeText(value) : value;
    }
  }
  return events;
}

export async function fetchIcs(url: string): Promise<IcsEvent[]> {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password) {
    throw new Error('Enter a public HTTP or HTTPS calendar URL');
  }
  const response = await safeFetchFollow(
    url,
    {
      method: 'GET',
      headers: { accept: 'text/calendar, text/plain;q=0.9, */*;q=0.1' },
      signal: AbortSignal.timeout(12000),
    },
    { maxBytes: 2 * 1024 * 1024, timeoutMs: 12000, bypassInternalIpAllowed: true },
  );
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Calendar server returned HTTP ${response.status}`);
  }
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('text/html')) {
    await response.body?.cancel();
    throw new Error('The URL did not return an ICS calendar');
  }
  const text = await response.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('The URL did not return a valid ICS calendar');
  return parseIcs(text);
}
