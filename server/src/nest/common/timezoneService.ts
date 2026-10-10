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

/**
 * Today's date and the clock time where the instance runs, in the TZ the crons
 * are scheduled in (CronRegistrarService). A UTC "today" disagreed with the
 * schedule: east of Greenwich a 09:00 job saw the previous date.
 */
export function appClock(now: Date = new Date()): { date: string; time: string } {
  const { date, time } = localParts(now.toISOString(), readEnv().app.tz || null);
  return { date: date ?? now.toISOString().slice(0, 10), time: time ?? now.toISOString().slice(11, 16) };
}
