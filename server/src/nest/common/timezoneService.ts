import { readEnv } from '../../app-config';

import tzlookup from 'tz-lookup';

/** Local calendar date and clock time for an instant in an IANA timezone. */
export function localParts(iso: string | null, timezone: string | null): { date: string | null; time: string | null } {
  if (!iso) return { date: null, time: null };
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return { date: null, time: null };
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
    const localDate = `${value('year')}-${value('month')}-${value('day')}`;
    const localTime = `${value('hour')}:${value('minute')}`;
    return /^\d{4}-\d{2}-\d{2}$/.test(localDate) ? { date: localDate, time: localTime } : { date: null, time: null };
  } catch {
    return { date: null, time: null };
  }
}

export function resolveTimeZone(lat: unknown, lng: unknown): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  try {
    return tzlookup(lat, lng);
  } catch {
    return null;
  }
}

// One formatter per zone: the calendar's transition scan asks it about once a
// day across its span, and every booking card asks it for both ends of a leg.
const offsetFormatters = new Map<string, Intl.DateTimeFormat>();
function offsetFormatter(zone: string): Intl.DateTimeFormat {
  let f = offsetFormatters.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' });
    if (offsetFormatters.size >= 1000) offsetFormatters.clear();
    offsetFormatters.set(zone, f);
  }
  return f;
}

/** The zone's UTC offset at instant `ms`, in minutes east of UTC. Throws a RangeError on an unknown zone. */
export function offsetMinutesAt(zone: string, ms: number): number {
  const raw =
    offsetFormatter(zone)
      .formatToParts(new Date(ms))
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const m = raw.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0; // "GMT" (UTC) has no offset digits
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

/**
 * The instant a wall clock (`YYYY-MM-DD`, `HH:MM`) reads in an IANA zone, in
 * ms since the epoch; null for a malformed or impossible date, a malformed time
 * or an unknown zone. A clock a spring-forward skips lands an hour later, as a
 * clock set by hand would.
 */
export function wallClockInstant(date: string, time: string, zone: string): number | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!d || !t) return null;
  const asUtc = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]));
  // A day the month does not have (31 February) rolls over into the next month; refuse it instead.
  if (Number.isNaN(asUtc) || new Date(asUtc).toISOString().slice(0, 10) !== date) return null;
  try {
    const first = asUtc - offsetMinutesAt(zone, asUtc) * 60_000;
    // The offset in force at the first guess can differ from the one at the
    // instant itself across a change of offset; one more step settles it.
    return asUtc - offsetMinutesAt(zone, first) * 60_000;
  } catch {
    return null;
  }
}

/**
 * Today's date and the clock time where the instance runs, in the TZ the crons
 * are scheduled in (CronRegistrarService). A UTC "today" disagreed with the
 * schedule: east of Greenwich a 09:00 job saw the previous date.
 */
export function appClock(now: Date = new Date()): { date: string; time: string } {
  const { date, time } = localParts(now.toISOString(), readEnv().app.tz || null);
  return { date: date ?? now.toISOString().slice(0, 10), time: time ?? now.toISOString().slice(11, 16) };
}
