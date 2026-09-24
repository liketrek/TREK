import { BedDouble, BedSingle, CalendarCheck, CalendarClock, CalendarMinus, CalendarPlus, MapPin, StickyNote, Ticket, Type } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Day } from '../types'
import type { DayContent, DayDeleteImpact, StayImpact } from './dayDeleteImpact'
import type { TripRangeImpact } from './tripRangeImpact'

type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * How loud a line is. `danger` is money: a stay cancelled with its booking and
 * expense. `warning` is dates that move. `muted` is the reassurance that nothing
 * is lost at all.
 */
export type ImpactTone = 'neutral' | 'muted' | 'warning' | 'danger'

/** One row of a warning list, ready for either shell to render. */
export interface ImpactLine {
  key: string
  icon: LucideIcon
  text: string
  hint?: string
  tone: ImpactTone
}

/**
 * The delete question while it is open. The reorder dialog asks it in place of
 * its day list: which day, the title and the list, and the two ways out.
 */
export interface DayDeleteQuestion {
  dayId: number
  title: string
  lines: ImpactLine[]
  onCancel: () => void
  onConfirm: () => void
}

/**
 * The question the list answers. Deleting a day cancels a stay cleanly, with
 * its booking and expense. Shortening a trip removes the stay through the day
 * rows instead and leaves its booking behind. So the hints are looked up per
 * variant while the rows themselves stay the same.
 */
export type ImpactVariant = 'deleteDay' | 'shrinkTrip'

/** How bookings follow new dates, as the trip dialog lets the traveller choose. */
export type ShiftMode = 'keep_bookings' | 'shift_all'

interface StayHints {
  bookings: string
  /** A stay without a booking. */
  stay: string
  /** A stay with a booking and no expense on it. */
  stayBooking: string
  /** A stay with a booking and an expense whose sum is not known. */
  stayBooked: string
  /** A stay with a booking and an expense, sum named. Only where the expense is lost. */
  stayPaid?: string
}

const HINTS: Record<ImpactVariant, StayHints> = {
  deleteDay: {
    bookings: 'dayplan.deleteDayBookingsHint',
    stay: 'dayplan.deleteDayStayHint',
    stayBooking: 'dayplan.deleteDayStayBookingHint',
    stayBooked: 'dayplan.deleteDayStayBookedHint',
    stayPaid: 'dayplan.deleteDayStayPaidHint',
  },
  // A shortened trip leaves the booking and its expense where they are, so the
  // sum is no loss worth naming.
  shrinkTrip: {
    bookings: 'dashboard.shrinkBookingsHint',
    stay: 'dashboard.shrinkStayHint',
    stayBooking: 'dashboard.shrinkStayBookingHint',
    stayBooked: 'dashboard.shrinkStayBookedHint',
  },
}

/**
 * What goes with a stay: its booking by name, with the count of any further
 * ones, and the expense, by its sum where the variant loses it.
 */
function stayHint(stay: StayImpact, hints: StayHints, t: Translate): string {
  if (!stay.booking) return t(hints.stay)
  const booking = stay.moreBookings > 0
    ? `${stay.booking} ${t('dashboard.shrinkMoreDays', { count: stay.moreBookings })}`
    : stay.booking
  if (!stay.expense) return t(hints.stayBooking, { booking })
  if (stay.expense.amount && hints.stayPaid) return t(hints.stayPaid, { booking, amount: stay.expense.amount })
  return t(hints.stayBooked, { booking })
}

/**
 * The rows for what sits on the days that go: stays first, because they cost
 * money, then places, notes, day texts and bookings. Kinds with nothing in them
 * are left out.
 */
export function impactLines(
  content: DayContent,
  t: Translate,
  variant: ImpactVariant,
  options: { shiftMode?: ShiftMode } = {},
): ImpactLine[] {
  // With "shift everything" a booking stays glued to its day row, so one on a
  // removed day keeps no day at all; the default puts it back by its date.
  const hints = variant === 'shrinkTrip' && options.shiftMode === 'shift_all'
    ? { ...HINTS.shrinkTrip, bookings: 'dashboard.shrinkBookingsShiftHint' }
    : HINTS[variant]
  const lines: ImpactLine[] = content.stays.map(stay => ({
    key: `stay-${stay.id}`,
    icon: BedDouble,
    tone: 'danger',
    text: t('dayplan.impactStay', { name: stay.name }),
    hint: stayHint(stay, hints, t),
  }))
  if (content.places > 0) {
    lines.push({ key: 'places', icon: MapPin, tone: 'neutral', text: t('dayplan.impactPlaces', { count: content.places }), hint: t('dayplan.impactPlacesHint') })
  }
  if (content.notes > 0) {
    lines.push({ key: 'notes', icon: StickyNote, tone: 'neutral', text: t('dayplan.impactNotes', { count: content.notes }), hint: t('dayplan.impactDeletedHint') })
  }
  if (content.texts > 0) {
    lines.push({ key: 'texts', icon: Type, tone: 'neutral', text: t('dayplan.impactTexts', { count: content.texts }), hint: t('dayplan.impactDeletedHint') })
  }
  if (content.bookings > 0) {
    lines.push({ key: 'bookings', icon: Ticket, tone: 'neutral', text: t('dayplan.impactBookings', { count: content.bookings }), hint: t(hints.bookings) })
  }
  return lines
}

/**
 * The full list for the delete question: the cancelled stays, then the ones that
 * lose a night, the rest of the content, then what happens to the dates, and a
 * single quiet row for a day with nothing on it. `dayName` names a day the way
 * the day list beside the question does; without it a day is "Day n".
 */
export function deleteDayLines(
  impact: DayDeleteImpact,
  t: Translate,
  formatDate: (iso: string) => string,
  dayName: (day: Day, index: number) => string = (_, index) => t('dayplan.dayN', { n: index + 1 }),
): ImpactLine[] {
  const lines = impactLines(impact, t, 'deleteDay')
  // Right behind the cancelled stays: a stay is kept, but a night of it is gone.
  lines.splice(impact.stays.length, 0, ...impact.shortenedStays.map((stay): ImpactLine => ({
    key: `stay-short-${stay.id}`,
    icon: BedSingle,
    tone: 'warning',
    text: t('dayplan.impactStayShorter', { name: stay.name }),
    hint: stay.checkOut
      ? t('dayplan.deleteDayStayShorterHint', { date: formatDate(stay.checkOut) })
      : t('dayplan.deleteDayStayShorterUndatedHint'),
  })))
  if (impact.shiftedDays > 0) {
    lines.push({
      key: 'shift',
      icon: CalendarClock,
      tone: 'warning',
      text: t('dayplan.deleteDayShift', { count: impact.shiftedDays }),
      hint: impact.shiftedBookings > 0
        ? t('dayplan.deleteDayShiftBookingsHint', { count: impact.shiftedBookings })
        : t('dayplan.deleteDayShiftHint'),
    })
  }
  if (impact.datedSpare) {
    const { day, index, date } = impact.datedSpare
    lines.push({
      key: 'spare',
      icon: CalendarPlus,
      tone: 'warning',
      text: t('dayplan.deleteDaySpareDated', { day: dayName(day, index), date: formatDate(date) }),
      hint: t('dayplan.deleteDaySpareDatedHint'),
    })
  }
  if (impact.newEndDate) {
    lines.push({
      key: 'shrink',
      icon: CalendarMinus,
      tone: 'warning',
      text: t('dayplan.deleteDayShrink', { date: formatDate(impact.newEndDate) }),
      hint: t('dayplan.deleteDayShrinkHint'),
    })
  }
  if (lines.length === 0) {
    lines.push({ key: 'empty', icon: CalendarCheck, tone: 'muted', text: t('dayplan.deleteDayEmpty') })
  }
  return lines
}

/** Most day chips the list names before it sums up the rest. */
export const MAX_DAY_CHIPS = 6

/** The removed days as chip labels: the first few by name, the rest as "+n more". */
export function dayChips(labels: string[], t: Translate, max = MAX_DAY_CHIPS): string[] {
  if (labels.length <= max) return labels
  return [...labels.slice(0, max), t('dashboard.shrinkMoreDays', { count: labels.length - max })]
}

/**
 * The full list for the warning before a trip is shortened: what sits on the
 * days that go, with the booking hint following the chosen shift mode, and a
 * last row when a moved start still takes the last days.
 */
export function shrinkTripLines(impact: TripRangeImpact, t: Translate, shiftMode: ShiftMode = 'keep_bookings'): ImpactLine[] {
  const lines = impactLines(impact.content, t, 'shrinkTrip', { shiftMode })
  if (impact.startMoved) {
    lines.push({
      key: 'lastDays',
      icon: CalendarClock,
      tone: 'warning',
      text: t('dashboard.shrinkLastDays'),
      hint: t('dashboard.shrinkLastDaysHint'),
    })
  }
  return lines
}
