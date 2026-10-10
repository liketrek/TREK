import type { Day, Reservation, ReservationEndpoint } from '../../../types'
import { formatPriceText, formatTime, splitReservationDateTime } from '../../../utils/formatters'
import { getFlightLegs, getTrainLegs, usesStationRoute } from '../../../utils/flightLegs'
import { safeExternalHref } from '../../../utils/safeUrl'
import { daySpan, parseMeta, type AssignmentLookupEntry } from './bookingsModel'

export interface FactsContext {
  t: (key: string, params?: Record<string, string | number>) => string
  locale: string
  timeFormat: string
  days: Day[]
  assignmentLookup: Record<number, AssignmentLookupEntry>
  tripCurrency?: string | null
  /** Whether an expense is linked; then the mirrored meta price is not shown a second time. */
  hasLinkedCost: boolean
}

export interface BookingFacts {
  /** The day or day range, e.g. "Day 2 → Day 7", with the calendar date beside it. */
  day: { label: string; date: string | null; range: boolean } | null
  /** Start and end time, or null without either. */
  time: string | null
  startTime: string | null
  endTime: string | null
  startDate: string | null
  endDate: string | null
  cells: { label: string; value: string }[]
  endpoints: ReservationEndpoint[]
  legCodes: { route: string; code: string }[]
  place: string | null
  accommodation: string | null
  linked: string | null
  url: { href: string | null; text: string } | null
  isHotel: boolean
}

const fmtDate = (date: string, locale: string, weekday = true) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString(locale, { ...(weekday ? { weekday: 'short' } : {}), day: 'numeric', month: 'short', timeZone: 'UTC' })

export function formatDay(date: string, locale: string, weekday = true): string {
  return fmtDate(date, locale, weekday)
}

/** Everything a card, a row and the detail pane print about one booking, formatted once. */
export function bookingFacts(r: Reservation, c: FactsContext): BookingFacts {
  const { t, locale, timeFormat } = c
  const meta = parseMeta(r)
  const isHotel = r.type === 'hotel'
  const span = daySpan(r, c.days)
  const startDt = splitReservationDateTime(r.reservation_time)
  const endDt = splitReservationDateTime(r.reservation_end_time)
  const dayName = (d: Day) => d.title || t('dayplan.dayN', { n: d.day_number })

  let day: BookingFacts['day'] = null
  if (span.start) {
    const range = !!span.end && span.end.id !== span.start.id
    const label = range ? `${dayName(span.start)} → ${dayName(span.end!)}` : dayName(span.start)
    const dates = [span.start.date, range ? span.end!.date : null].filter(Boolean) as string[]
    day = { label, date: dates.length ? dates.map(d => fmtDate(d, locale, dates.length === 1)).join(' → ') : null, range }
  } else if (startDt.date) {
    const range = !!endDt.date && endDt.date !== startDt.date
    const label = range ? `${fmtDate(startDt.date, locale)} → ${fmtDate(endDt.date!, locale)}` : fmtDate(startDt.date, locale)
    day = { label, date: null, range }
  }

  const eps = (r.endpoints || []).slice().sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
  const from = eps.find(e => e.role === 'from')
  const to = eps.find(e => e.role === 'to')
  const startTime = startDt.time || from?.local_time || null
  const endTime = endDt.time || to?.local_time || null
  // A stay backed by an accommodation says its times as check-in and check-out;
  // the time stamped on the booking itself is not what the traveller goes by.
  const stayBacked = isHotel && !!(r.accommodation_start_day_id || r.accommodation_end_day_id)
  const time = !stayBacked && (startTime || endTime)
    ? `${startTime ? formatTime(startTime, locale, timeFormat) : ''}${endTime ? ` → ${formatTime(endTime, locale, timeFormat)}` : ''}`.trim()
    : null

  const hasEndpoints = !!from && !!to
  const cells: BookingFacts['cells'] = []
  if (meta.airline) cells.push({ label: t('reservations.meta.airline'), value: meta.airline })
  if (meta.flight_number) cells.push({ label: t('reservations.meta.flightNumber'), value: meta.flight_number })
  if (!hasEndpoints && meta.departure_airport) cells.push({ label: t('reservations.meta.from'), value: meta.departure_airport })
  if (!hasEndpoints && meta.arrival_airport) cells.push({ label: t('reservations.meta.to'), value: meta.arrival_airport })
  if (meta.train_number) cells.push({ label: t('reservations.meta.trainNumber'), value: meta.train_number })
  if (meta.platform) cells.push({ label: t('reservations.meta.platform'), value: meta.platform })
  if (meta.seat) cells.push({ label: t('reservations.meta.seat'), value: meta.class ? `${meta.seat}, ${meta.class}` : meta.seat })
  if (!c.hasLinkedCost && meta.price != null && meta.price !== '') {
    cells.push({ label: t('reservations.price'), value: formatPriceText(meta.price, meta.priceCurrency, c.tripCurrency, locale) })
  }
  if (meta.check_in_time) {
    cells.push({ label: t('reservations.meta.checkIn'), value: formatTime(meta.check_in_time, locale, timeFormat) + (meta.check_in_end_time ? ` → ${formatTime(meta.check_in_end_time, locale, timeFormat)}` : '') })
  }
  if (meta.check_out_time) cells.push({ label: t('reservations.meta.checkOut'), value: formatTime(meta.check_out_time, locale, timeFormat) })

  // Per-segment codes (#1943), only on a real stopover booking.
  const legs = r.type === 'flight' ? getFlightLegs(r) : usesStationRoute(r.type) ? getTrainLegs(r) : []
  const legCodes = legs.length > 1
    ? legs.filter(l => l.confirmation_number).map(l => ({ route: [l.from, l.to].filter(Boolean).join(' → '), code: l.confirmation_number as string }))
    : []

  const linkedEntry = r.assignment_id ? c.assignmentLookup[r.assignment_id] : null
  const linked = linkedEntry
    ? [linkedEntry.dayTitle || t('dayplan.dayN', { n: linkedEntry.dayNumber }), linkedEntry.placeName, linkedEntry.startTime ? `${linkedEntry.startTime}${linkedEntry.endTime ? ` → ${linkedEntry.endTime}` : ''}` : null].filter(Boolean).join(', ')
    : null

  return {
    day, time, startTime, endTime,
    startDate: startDt.date || from?.local_date || span.start?.date || null,
    endDate: endDt.date || to?.local_date || span.end?.date || null,
    cells, endpoints: eps.length >= 2 ? eps : [], legCodes,
    place: r.location || r.place_name || null,
    accommodation: r.accommodation_name || null,
    linked,
    url: r.url ? { href: safeExternalHref(r.url), text: r.url } : null,
    isHotel,
  }
}
