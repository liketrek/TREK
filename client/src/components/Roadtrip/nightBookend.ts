import type { CSSProperties } from 'react'
import { BedDouble, type LucideIcon } from 'lucide-react'
import { formatClockTime } from '../../utils/formatters'
import { parseClock, serviceColor, type ScheduleEntry } from './roadtripModel'
import type { TranslationFn } from '../../types'
import type { BookendReading } from './roadtripRowModel'

/**
 * How a booked night at the edge of a day reads on the rail and in the phone chain, and
 * what a tap on it opens.
 *
 * One module for both shells, the way `carrierRide` is for a ride: the two would otherwise
 * carry the same sentence and the same decision each, and the duplication budget does not
 * stretch to that. What the row IS comes from the row model (`bookendReading`); this only
 * says it, and reads the hotel it stands for off the trip's places (`staysAtTheirPlaces`).
 */

/** The bed the day plan's stay chips wear, so the hotel looks like itself here too. */
export const BOOKEND_ICON: LucideIcon = BedDouble

/**
 * The disc the bed sits on: the hotel stop's own, in the road-signage colour its map pin
 * wears. On a plain grey disc the night at the day's edge read as a terminal, and the same
 * hotel wore two faces on one card, one where the day checks in and another where it
 * comes back to it.
 */
export const BOOKEND_DISC: CSSProperties = { background: serviceColor('hotel'), color: '#fff' } // theme-lint-disable: road-signage palette

/**
 * The badge under the hotel's name: which edge of the stay the day stands at, and the hour
 * that edge names, the latest the room is handed back or the earliest it is ready. Both are
 * labels, never the time the drive leaves or arrives at (#2357). A plan that sets out after
 * the check-out turns the badge itself to a warning rather than adding a line to the row.
 */
export interface BookendBadge {
  lead: string
  value: string | null
  warning: boolean
  hint: string | null
}

export function bookendBadge(
  reading: BookendReading,
  entry: Pick<ScheduleEntry, 'arrival' | 'dayOffset'> | undefined,
  t: TranslationFn,
  is12h: boolean,
): BookendBadge {
  const clock = reading.until ?? reading.from
  const value = clock ? formatClockTime(clock, is12h) : null
  const warning = leavesAfterCheckOut(reading, entry)
  return {
    lead: t(`roadtrip.bookend.${reading.variant}`),
    value,
    warning,
    hint: warning
      ? t('roadtrip.bookend.afterCheckOut')
      : reading.until && value ? t('roadtrip.stay.until', { time: value }) : null,
  }
}

/**
 * Whether the plan leaves the stay later than the room is handed back. The check-out hour
 * never moves the start of the day, so a day that sets out at 12:30 from a room given up
 * at 10:00 is a plan worth a second look, and the row says so instead of standing the two
 * clocks side by side without a word.
 */
export function leavesAfterCheckOut(
  reading: BookendReading,
  entry: Pick<ScheduleEntry, 'arrival' | 'dayOffset'> | undefined,
): boolean {
  const until = parseClock(reading.until)
  const leaves = parseClock(entry?.arrival)
  if (until === null || leaves === null) return false
  return leaves + (entry?.dayOffset ?? 0) * 24 * 60 > until
}

/** The fields of a trip place the hotel of a stay is read from. */
export interface HotelPlace {
  id: number
  name: string
  lat?: number | null
  lng?: number | null
}

/** The fields of a stay row that name its hotel and where it stands. */
export interface StayAtPlace {
  place_id?: number | null
  place_name?: string | null
  place_lat?: number | null
  place_lng?: number | null
}

/**
 * The stays with their hotel where the trip's places have it now.
 *
 * A stay row carries its place's name and position as they were when the stays were last
 * fetched, and the planner fetches them again on a stay's own edit only. A pin moved on the
 * hotel reaches its visits at once (`mergeAssignmentPlace`) and the stay row not at all, so a
 * bookend seated from the row stood at the old spot beside its own stop at the new one: the
 * day drove from the one to the other, and the server, which joins the place afresh, planned
 * another drive. The place wins; the row stands in only for a place the list does not hold.
 * Rows that need nothing come back as they were, and so does the list when none does.
 */
export function staysAtTheirPlaces<S extends StayAtPlace>(stays: readonly S[], places: readonly HotelPlace[]): readonly S[] {
  if (!stays.length || !places.length) return stays
  const byId = new Map(places.map(place => [place.id, place]))
  let changed = false
  const out = stays.map(stay => {
    const place = stay.place_id == null ? undefined : byId.get(stay.place_id)
    if (!place) return stay
    const lat = place.lat ?? null
    const lng = place.lng ?? null
    if (stay.place_lat === lat && stay.place_lng === lng && stay.place_name === place.name) return stay
    changed = true
    return { ...stay, place_lat: lat, place_lng: lng, place_name: place.name }
  })
  return changed ? out : stays
}

/**
 * The booking a tap on the row opens, or null when it opens the stay's place instead.
 *
 * The booking behind the night when there is one and this reader may open it: a hotel
 * booking has only its editor, the split `bookingOpens` makes for a chip. Otherwise the
 * place, which anybody may look at.
 */
export function bookendBooking(reading: BookendReading, canEditBookings: boolean): number | null {
  return canEditBookings ? reading.reservationId : null
}
