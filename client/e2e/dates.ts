/**
 * The run's calendar.
 *
 * The seeded trip ends on the day the pictures are taken, and every other
 * date the seed, the fixtures and the guides use is an offset from that day.
 * So a run on any date meets a trip that is running, with a last day that is
 * today: the boarding pass, What's Next and the forecast all have something
 * to show, and nobody has to bump dates in three files every few weeks.
 *
 * The day is `E2E_PICTURE_DAY` (YYYY-MM-DD), set once by `e2e/help/run.mjs`
 * and `playwright.config.ts` so the seed project and every worker agree even
 * when the run crosses midnight; without it, today in the machine's zone.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

function localToday(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const fromEnv = process.env.E2E_PICTURE_DAY
if (fromEnv && !ISO_DAY.test(fromEnv)) throw new Error(`E2E_PICTURE_DAY must be YYYY-MM-DD, got "${fromEnv}"`)

/** The picture day as YYYY-MM-DD: the trip's last day. */
export const PICTURE_DAY_ISO: string = fromEnv || localToday()

/** Noon UTC on the picture day, a safe anchor for calendar arithmetic. */
function anchor(offset: number): Date {
  const d = new Date(`${PICTURE_DAY_ISO}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d
}

/** `YYYY-MM-DD` of the picture day plus `offset` days. */
export function day(offset: number): string {
  return anchor(offset).toISOString().slice(0, 10)
}

/** `YYYY-MM-DDTHH:mm:00`, the shape reservations and expenses take. */
export function at(offset: number, hhmm: string): string {
  return `${day(offset)}T${hhmm}:00`
}

/** The calendar year of the picture day plus `years`. */
export function year(years = 0): number {
  return anchor(0).getUTCFullYear() + years
}

/** A day `months` months after the picture day, on the given day of the month. */
export function monthsAhead(months: number, dayOfMonth: number): string {
  const d = anchor(0)
  d.setUTCDate(1)
  d.setUTCMonth(d.getUTCMonth() + months)
  d.setUTCDate(dayOfMonth)
  return d.toISOString().slice(0, 10)
}

const en = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...opts })

// The labels the English UI prints for a date, for the guides that have to
// find a button by its calendar text.

/** `Sat, Sep 12`, the day filter's chip. */
export function short(offset: number): string {
  return en({ weekday: 'short', month: 'short', day: 'numeric' }).format(anchor(offset))
}

/** `Saturday, September 12`, the day filter's long form. */
export function long(offset: number): string {
  return en({ weekday: 'long', month: 'long', day: 'numeric' }).format(anchor(offset))
}

/** `September 25, 2026`, a date picker's cell label. */
export function pickerLabel(offset: number): string {
  return pickerLabelOn(day(offset))
}

/** The same label for any `YYYY-MM-DD`, e.g. one from `monthsAhead`. */
export function pickerLabelOn(iso: string): string {
  return en({ month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${iso}T12:00:00Z`))
}

/** `October`: the English name of the month `months` months after the picture day's. */
export function monthName(months: number): string {
  return en({ month: 'long' }).format(new Date(`${monthsAhead(months, 1)}T12:00:00Z`))
}

/** `19.09.2026`, what a date input takes when typed. */
export function dotted(offset: number): string {
  const [y, m, d] = day(offset).split('-')
  return `${d}.${m}.${y}`
}

/** `13th`, for prose that names a day of the month. */
export function ordinal(offset: number): string {
  const n = anchor(offset).getUTCDate()
  const suffix = n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'
  return `${n}${suffix}`
}

/** `Wednesday 16 September 2026`, the date line of a booking mail. */
export function emlDate(offset: number): string {
  return en({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(anchor(offset)).replace(/,/g, '')
}

/** `Tue, 1 Sep 2026 09:12:00 +0900`, an RFC 2822 mail header for a fixed offset. */
export function mailHeaderDate(offset: number, hhmm: string, tz: string): string {
  const d = anchor(offset)
  const weekday = en({ weekday: 'short' }).format(d)
  const month = en({ month: 'short' }).format(d)
  return `${weekday}, ${d.getUTCDate()} ${month} ${d.getUTCFullYear()} ${hhmm}:00 ${tz}`
}
