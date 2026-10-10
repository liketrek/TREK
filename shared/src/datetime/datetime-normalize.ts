/**
 * Twelve-hour clock handling for imported booking documents (#2094).
 *
 * A confirmation mail prints "01:11 pm". Every downstream consumer in TREK
 * expects a naive 24-hour local string, and the mapper used to reach it by
 * slicing: `'2026-06-11T02:30 PM'.slice(11, 16)` yields '02:30'. The hour
 * survives, the half of the day does not, and the booking silently lands
 * twelve hours early. Because the arrival then sorts before the departure, the
 * router also rolls it onto the next day, so a three-hour domestic flight is
 * rendered as an overnight.
 *
 * The client has carried the same fix since #1725 (client/src/utils/formatters.ts);
 * this is the server half, which was never pulled across. The regex here is
 * deliberately looser than the client's: the server also sees 'HH:MM:SS AM' and
 * 'a.m.' straight out of a PDF.
 *
 * Everything here is total: a value that cannot be read comes back unchanged
 * rather than becoming null, so no format that works today can start failing.
 */

const MERIDIEM_CLOCK = /^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([ap])\.?\s?m\.?$/i;
const LEADING_DATE = /^(\d{4}-\d{2}-\d{2})/;

/**
 * '3:00 PM' / '02:30:00 pm' / '3 PM' → '15:00'.
 * Returns null when there is no meridiem to resolve, so callers can tell
 * "not my format" from "midnight".
 */
export function parseMeridiemClock(value: string | null | undefined): string | null {
  const m = MERIDIEM_CLOCK.exec((value || '').trim());
  const rawHour = m?.[1];
  const half = m?.[3];
  if (!rawHour || !half) return null;

  let hour = Number.parseInt(rawHour, 10);
  const minute = Number.parseInt(m?.[2] ?? '0', 10);
  if (!Number.isFinite(hour) || hour > 12) return null;

  const isPm = half.toLowerCase() === 'p';
  // 12 AM is midnight and 12 PM is noon: the hour does not shift at 12.
  if (hour === 12) hour = isPm ? 12 : 0;
  else if (isPm) hour += 12;

  return `${String(hour).padStart(2, '0')}:${String(Math.min(59, minute)).padStart(2, '0')}`;
}

/** The part after a leading `YYYY-MM-DD`, with its `T` or space removed. */
function clockPart(value: string): string {
  return value
    .slice(10)
    .replace(/^[T\s]/, '')
    .trim();
}

/** Split a naive date-time string into its date and its 24-hour clock. */
export function splitLocalDateTime(value: string | null | undefined): { date: string | null; time: string | null } {
  const raw = (value || '').trim();
  const date = LEADING_DATE.exec(raw)?.[1];
  if (!date) return { date: null, time: null };

  const rest = clockPart(raw);
  if (!rest) return { date, time: null };

  const meridiem = parseMeridiemClock(rest);
  if (meridiem) return { date, time: meridiem };

  return { date, time: /^(\d{2}:\d{2})/.exec(rest)?.[1] ?? null };
}

/**
 * Return the same naive date-time with a 24-hour clock. Anything the parser
 * cannot read comes back byte for byte, which is what keeps this additive:
 * a value that is already correct is never rewritten.
 */
export function normalizeLocalDateTime(value: string): string {
  if (!value) return value;
  const trimmed = value.trim();
  const date = LEADING_DATE.exec(trimmed)?.[1];
  if (!date) return value;

  // Only a printed 12-hour clock is rewritten. Everything else comes back
  // untouched, which is what makes this safe to drop into the middle of the
  // mapper: a value carrying a UTC offset, a date-only value, or a shape this
  // does not know keeps whatever it meant before.
  const rest = clockPart(trimmed);
  const clock = parseMeridiemClock(rest);
  if (!clock) return value;

  const seconds = /^\d{1,2}:\d{2}:(\d{2})/.exec(rest)?.[1] ?? '00';
  return `${date}T${clock}:${seconds}`;
}
