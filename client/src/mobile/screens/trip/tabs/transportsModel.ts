import { formatTime, splitReservationDateTime } from '../../../../utils/formatters'
import type { Day, Reservation, TranslationFn } from '../../../../types'

/**
 * Transport view-model — the real-data counterpart to the demo's `trsSecs`
 * (spec 03 §1.4). The sections, their order and the type colours come from the
 * desktop bookings model (groupTransports, TRANSPORT_TYPE_COLOR) so both surfaces
 * agree; what is left here is the phone cards' own reading of a booking.
 */

export interface TransitLeg {
  mode?: string
  line?: string | null
  from?: { name?: string; time?: string | null }
  to?: { name?: string; time?: string | null }
}

export interface TransportMeta {
  airline?: string
  flight_number?: string
  train_number?: string
  seat?: string
  class?: string
  platform?: string
  price?: string | number
  priceCurrency?: string
  departure_airport?: string
  arrival_airport?: string
  check_in_time?: string
  check_in_end_time?: string
  check_out_time?: string
  transit?: { legs?: TransitLeg[] }
}

/** Parse the reservation's JSON metadata blob, tolerant of string or object. */
export function parseTransportMeta(res: Reservation): TransportMeta {
  try {
    return (typeof res.metadata === 'string'
      ? JSON.parse(res.metadata || '{}')
      : res.metadata || {}) as TransportMeta
  } catch {
    return {}
  }
}

/**
 * The date and time cells of a phone booking or transport card: the day (or day
 * range) the booking sits on, else its own date, and its time or time range. A
 * dash stands in for whichever is missing.
 */
export function cardWhen(
  res: Reservation,
  startDay: Day | undefined,
  endDay: Day | undefined,
  t: TranslationFn,
  locale: string,
  timeFormat: string,
): { dayValue: string; timeValue: string } {
  const startDt = splitReservationDateTime(res.reservation_time)
  const endDt = splitReservationDateTime(res.reservation_end_time)
  const fmtDate = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const dayLabel = (day: Day) => day.title || t('dayplan.dayN', { n: day.day_number })
  const timeValue = startDt.time
    ? `${formatTime(startDt.time, locale, timeFormat)}${endDt.time ? ` – ${formatTime(endDt.time, locale, timeFormat)}` : ''}`
    : '—'
  const dayValue = startDay
    ? `${dayLabel(startDay)}${endDay && endDay.id !== startDay.id ? ` – ${dayLabel(endDay)}` : ''}`
    : startDt.date
      ? fmtDate(startDt.date)
      : '—'
  return { dayValue, timeValue }
}
