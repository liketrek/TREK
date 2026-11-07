const WALL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

// A formatter per zone: the day list reads every booking's zone on each render.
const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

/** How far the wall clock in `timeZone` runs ahead of UTC at `utcMs`, in milliseconds. */
function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const parts = formatterFor(timeZone).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes): number => Number(parts.find((p) => p.type === type)?.value);
  const wall = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return wall - Math.floor(utcMs / 1000) * 1000;
}

/**
 * The instant a wall-clock time `YYYY-MM-DDTHH:MM` names in an IANA time zone, as epoch
 * milliseconds. Null when the time carries no date, or the zone is empty or unknown: a
 * clock time alone names no instant, so the caller keeps reading it as a clock time.
 *
 * Read twice because the zone's offset depends on the instant itself; the second read
 * settles a time near a daylight-saving switch.
 */
export function zonedInstant(wallTime: string | null | undefined, timeZone: string | null | undefined): number | null {
  if (!wallTime || !timeZone) return null;
  const m = WALL_TIME.exec(wallTime);
  if (!m) return null;
  const asUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  if (Number.isNaN(asUtc)) return null;
  try {
    const first = asUtc - zoneOffsetMs(asUtc, timeZone);
    return asUtc - zoneOffsetMs(first, timeZone);
  } catch {
    // An unknown zone name: Intl throws a RangeError. The time stays a plain clock time.
    return null;
  }
}
