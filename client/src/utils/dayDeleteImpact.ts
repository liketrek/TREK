import { formatMoneySum } from './formatters'
import type { Accommodation, AssignmentsMap, BudgetItem, Day, DayNotesMap, Place, Reservation, Trip } from '../types'

/**
 * The trip's expenses, for what the booking of a stay has cost. With a currency
 * and a locale the amount is named; without them only whether there is one.
 */
export interface DayContentBudget {
  items: BudgetItem[]
  /** The trip currency, which an expense without a currency of its own is in. */
  currency?: string
  locale?: string
}

/** What the trip holds on its days, as the store and the planner have it. */
export interface DayContentData {
  assignments: AssignmentsMap
  dayNotes: DayNotesMap
  reservations: Reservation[]
  accommodations: Accommodation[]
  places?: Place[]
  /** Left out when the expenses could not be read. */
  budget?: DayContentBudget
}

/** A stay that goes with the days: checked in or out on one of them. */
export interface StayImpact {
  id: number
  name: string
  /** Title of the booking that goes with it, or null when none is linked. */
  booking: string | null
  /** Further bookings linked to the same stay. The server takes all of them along. */
  moreBookings: number
  /**
   * The expense written against those bookings, or null when there is none.
   * Its amount is null when the expenses were not read or name no sum.
   */
  expense: { amount: string | null } | null
}

/** A stay that only runs across the deleted day: it stays, one night shorter. */
export interface ShortenedStay {
  id: number
  name: string
  /** The date its check-out day takes, or null on a day without a date. */
  checkOut: string | null
}

/** The first day without a date, which takes over the last date of the trip. */
export interface DatedSpare {
  day: Day
  /** Its place in the day list now, for "Day n". */
  index: number
  date: string
}

/** What sits on a set of days and would go with them. */
export interface DayContent {
  /** Distinct places planned there. The places themselves stay on the trip. */
  places: number
  notes: number
  /** Day titles and day descriptions. */
  texts: number
  /** Bookings on the days, the ones a cancelled stay takes along left out. */
  bookings: number
  stays: StayImpact[]
}

/** Deleting one day: its content, and what the dates of the other days do. */
export interface DayDeleteImpact extends DayContent {
  /** Later dated days that take another date. */
  shiftedDays: number
  /** Bookings on those days whose date is re-stamped with them. */
  shiftedBookings: number
  /** The trip's new last date when the delete takes the last date along. */
  newEndDate: string | null
  /** Stays that run across the day, which keep standing with one night less. */
  shortenedStays: ShortenedStay[]
  /** The day without a date that gets one, when a dated day goes. */
  datedSpare: DatedSpare | null
  isLastDay: boolean
}

const byNumber = (a: Day, b: Day): number => (a.day_number ?? 0) - (b.day_number ?? 0)

/** A reservation's link to a stay, which the wire carries as a number or a string. */
const stayOf = (r: Reservation): number | null => (r.accommodation_id == null ? null : Number(r.accommodation_id))

/**
 * Each stay once. The stays list joins in the bookings, so a stay with two of
 * them comes over the wire twice; the warning names it once all the same, and
 * counts its bookings through describeStay.
 */
function distinctStays(stays: Accommodation[]): Accommodation[] {
  const seen = new Set<number>()
  return stays.filter(stay => !seen.has(stay.id) && seen.add(stay.id))
}

/** The bookings linked to a stay, its first booking title, and the name the list gives it. */
function describeStay(stay: Accommodation, data: DayContentData) {
  const linked = data.reservations.filter(r => stayOf(r) === stay.id)
  const booking = linked[0]?.title ?? stay.reservation_title ?? null
  const name = stay.place_name ?? data.places?.find(p => p.id === stay.place_id)?.name ?? booking ?? ''
  return { linked, booking, name }
}

/**
 * What the bookings of a cancelled stay have cost: the expenses the server
 * deletes with them (budget_items.reservation_id). Unread expenses count as one
 * without a sum, so the warning says too much rather than too little.
 */
function stayExpense(linked: Reservation[], budget: DayContentBudget | undefined): StayImpact['expense'] {
  if (linked.length === 0) return null
  if (!budget) return { amount: null }
  const ids = new Set(linked.map(r => r.id))
  const items = budget.items.filter(item => item.reservation_id != null && ids.has(item.reservation_id))
  if (items.length === 0) return null
  if (!budget.currency || !budget.locale) return { amount: null }
  const base = budget.currency
  const entries = items.map(item => ({ amount: item.total_price, currency: item.currency || base }))
  return { amount: formatMoneySum(entries, base, budget.locale) }
}

/**
 * Count what sits on the given days, the way the server treats it when they go.
 *
 * A stop a stay wrote is the stay, not a place of its own, so it is not counted
 * as one; a stay touching two of the days counts once, and the booking that came
 * with it is part of the stay rather than one of the bookings. Shared by the day
 * delete question and the warning before a trip is shortened.
 */
export function contentOnDays(days: Pick<Day, 'id' | 'title' | 'notes'>[], data: DayContentData): DayContent {
  const ids = new Set(days.map(d => d.id))
  const stays = distinctStays(data.accommodations).filter(stay => ids.has(stay.start_day_id) || ids.has(stay.end_day_id))
  const stayIds = new Set(stays.map(stay => stay.id))

  const placeIds = new Set<number>()
  let notes = 0
  let texts = 0
  for (const day of days) {
    for (const assignment of data.assignments[String(day.id)] ?? []) {
      if (assignment.accommodation_id == null) placeIds.add(assignment.place.id)
    }
    notes += (data.dayNotes[String(day.id)] ?? []).length
    if (day.title) texts += 1
    if (day.notes) texts += 1
  }

  const onDays = (r: Reservation) => (r.day_id != null && ids.has(r.day_id)) || (r.end_day_id != null && ids.has(r.end_day_id))
  const bookings = data.reservations.filter(r => onDays(r) && !stayIds.has(stayOf(r) ?? -1)).length

  return {
    places: placeIds.size,
    notes,
    texts,
    bookings,
    stays: stays.map(stay => {
      const { linked, booking, name } = describeStay(stay, data)
      return { id: stay.id, name, booking, moreBookings: Math.max(0, linked.length - 1), expense: stayExpense(linked, data.budget) }
    }),
  }
}

/**
 * What deleting one day does, as the server will do it (DayRemovalService): the
 * dates stay on their positions, so every later dated day takes the date one slot
 * earlier and the bookings on it are re-stamped along, and the first day without
 * a date takes the last date. When no day without a date is left to take it, the
 * last date goes and a dated trip ends a day earlier. A stay that only runs
 * across the day keeps standing; its check-out day moves up, so it loses a night.
 */
export function dayDeleteImpact(
  day: Day,
  days: Day[],
  data: DayContentData,
  trip: Pick<Trip, 'start_date' | 'end_date'> | null,
): DayDeleteImpact {
  const content = contentOnDays([day], data)
  const ordered = [...days].sort(byNumber)
  const position = new Map(ordered.map((d, i) => [d.id, i]))
  const at = position.get(day.id) ?? -1
  const remaining = ordered.filter(d => d.id !== day.id)
  const dates = ordered.map(d => d.date).filter((d): d is string => !!d).sort((a, b) => a.localeCompare(b))

  const moved = new Set<number>()
  let datedSpare: DatedSpare | null = null
  for (const [i, d] of remaining.entries()) {
    const next = dates[i]
    if (!next || next === d.date) continue
    if (d.date) moved.add(d.id)
    else datedSpare ??= { day: d, index: position.get(d.id) ?? i, date: next }
  }
  const cancelled = new Set(content.stays.map(stay => stay.id))
  const shiftedBookings = data.reservations.filter(r => {
    if (cancelled.has(stayOf(r) ?? -1)) return false
    const start = r.day_id != null && moved.has(r.day_id) && !!r.reservation_time
    const end = r.end_day_id != null && moved.has(r.end_day_id) && !!r.reservation_end_time
    return start || end
  }).length

  const shortenedStays = distinctStays(data.accommodations).flatMap((stay): ShortenedStay[] => {
    const from = position.get(stay.start_day_id)
    const to = position.get(stay.end_day_id)
    if (cancelled.has(stay.id) || from === undefined || to === undefined || from >= at || to <= at) return []
    // The check-out day moves up one place and takes the date of that place.
    return [{ id: stay.id, name: describeStay(stay, data).name, checkOut: dates[to - 1] ?? null }]
  })

  const dropsDate = remaining.length < dates.length
  const newEndDate = dropsDate && trip?.start_date && trip.end_date ? (dates[remaining.length - 1] ?? null) : null

  return {
    ...content,
    shiftedDays: moved.size,
    shiftedBookings,
    newEndDate,
    shortenedStays,
    datedSpare,
    isLastDay: days.length <= 1,
  }
}

/**
 * Why a day cannot be deleted right now, or null when it can. A trip keeps at
 * least one day, and the delete runs on the server only: the cascade behind it
 * (stays cancelled, bookings let go of, dates moved) is not something a queued
 * offline write could replay faithfully.
 */
export function deleteDayBlockedReason(dayCount: number, offline: boolean, t: (key: string) => string): string | null {
  if (dayCount <= 1) return t('dayplan.deleteDayLast')
  if (offline) return t('dayplan.daysOffline')
  return null
}
