/**
 * The time-zone half of the trip calendar: which zones an event may name, and
 * the VTIMEZONE block each named zone gets. Pure functions, kept apart from
 * CalendarService so the service stays about which events a trip has.
 */
import { offsetMinutesAt } from '../common/timezoneService';

// ── ICS time-zone helpers ────────────────────────────────────────────────────
// Timed events must carry an explicit IANA zone; a bare "YYYYMMDDTHHMMSS" is an
// RFC 5545 "floating" time that clients render in the *subscriber's* zone (#1453).

// A stored/plugin-provided timezone (e.g. a transport endpoint's `timezone`) is a
// free string that need not be a real IANA zone. Intl.DateTimeFormat throws a
// RangeError on an unknown zone, which (via buildVTimezone and offsetMinutesAt)
// would crash the whole ICS export (and drop the trip from the all-trips feed).
// Validate once so an invalid zone degrades to a floating local time instead.
// Module-scoped on purpose (like the permissions/FX caches): the bridge instance
// and the DI singleton share one cache.
const _tzValidCache = new Map<string, boolean>();
export function isValidTimeZone(zone: string): boolean {
  const cached = _tzValidCache.get(zone);
  if (cached !== undefined) return cached;
  let ok = false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    ok = true;
  } catch {
    // Unknown/invalid zone → ok stays false.
  }
  // Bound the cache: the key is a free-form (plugin/importer-written) zone string,
  // so cap distinct entries rather than growing for the process lifetime.
  if (_tzValidCache.size >= 1000) _tzValidCache.clear();
  _tzValidCache.set(zone, ok);
  return ok;
}

/** An offset in minutes as iCalendar writes it: "+0200", "-0330". */
function formatOffset(minutes: number): string {
  const abs = Math.abs(minutes);
  return `${minutes < 0 ? '-' : '+'}${String(Math.floor(abs / 60)).padStart(2, '0')}${String(abs % 60).padStart(2, '0')}`;
}

/** Midnight UTC of a YYYYMMDD date, or NaN when it is no date. */
function utcDay(yyyymmdd: string): number {
  return Date.parse(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T00:00:00Z`);
}

interface ZoneTransition {
  /** The instant the new offset starts, ms since the epoch. */
  at: number;
  from: number;
  to: number;
}

const DAY_MS = 86_400_000;

/** Ten years at most: a span longer than that is a typo, not a trip. */
const MAX_SCAN_DAYS = 3660;

/** Every offset change in [startMs, endMs), to the minute. */
function zoneTransitions(zone: string, startMs: number, endMs: number): ZoneTransition[] {
  const found: ZoneTransition[] = [];
  const stop = Math.min(endMs, startMs + MAX_SCAN_DAYS * DAY_MS);
  let before = offsetMinutesAt(zone, startMs);
  for (let t = startMs; t < stop; t += DAY_MS) {
    const after = offsetMinutesAt(zone, t + DAY_MS);
    if (after === before) continue;
    let lo = t;
    let hi = t + DAY_MS;
    while (hi - lo > 60_000) {
      const mid = lo + Math.floor((hi - lo) / 120_000) * 60_000;
      if (offsetMinutesAt(zone, mid) === before) lo = mid;
      else hi = mid;
    }
    found.push({ at: hi, from: before, to: after });
    before = after;
  }
  return found;
}

/** A local wall-clock time as iCalendar writes it, from an instant and the offset in force. */
function localStamp(ms: number, offsetMinutes: number): string {
  return new Date(ms + offsetMinutes * 60_000).toISOString().slice(0, 19).replace(/[-:]/g, '');
}

function observance(kind: 'STANDARD' | 'DAYLIGHT', dtstart: string, from: number, to: number, zone: string): string {
  return (
    `BEGIN:${kind}\r\n` +
    `DTSTART:${dtstart}\r\n` +
    `TZOFFSETFROM:${formatOffset(from)}\r\n` +
    `TZOFFSETTO:${formatOffset(to)}\r\n` +
    `TZNAME:${zone}\r\n` +
    `END:${kind}\r\n`
  );
}

/**
 * The zone's VTIMEZONE for the dates its events fall on (YYYYMMDD, inclusive).
 *
 * Smart clients replace it with their own IANA rules, but a client that reads
 * it literally shows every event at the offset written here. One fixed offset
 * put a June flight in Paris an hour off once the trip crossed the change to
 * summer time, so each change inside the span is written out as its own
 * observance, with the offset that held before it as the first one. A zone
 * without changes in the span, or a span with no readable date, keeps the one
 * fixed offset it always had.
 */
export function buildVTimezone(zone: string, firstDay: string, lastDay: string): string {
  const start = utcDay(firstDay);
  const end = utcDay(lastDay);
  let body: string;
  if (Number.isNaN(start)) {
    body = observance('STANDARD', '19700101T000000', 0, 0, zone);
  } else {
    // Whole calendar years around the events, so a client that expands the
    // rules a little past the last event still finds the offset in force.
    const from = Date.UTC(new Date(start).getUTCFullYear(), 0, 1);
    const to = Date.UTC(new Date(Number.isNaN(end) ? start : Math.max(start, end)).getUTCFullYear() + 1, 0, 1);
    const changes = zoneTransitions(zone, from, to);
    const initial = offsetMinutesAt(zone, from);
    if (changes.length === 0) {
      const at = offsetMinutesAt(zone, start + DAY_MS / 2);
      body = observance('STANDARD', '19700101T000000', at, at, zone);
    } else {
      const firstIsSummer = changes[0].to < changes[0].from;
      body = observance(firstIsSummer ? 'DAYLIGHT' : 'STANDARD', '19700101T000000', initial, initial, zone);
      for (const c of changes) {
        body += observance(c.to > c.from ? 'DAYLIGHT' : 'STANDARD', localStamp(c.at, c.from), c.from, c.to, zone);
      }
    }
  }
  return `BEGIN:VTIMEZONE\r\nTZID:${zone}\r\n${body}END:VTIMEZONE\r\n`;
}
