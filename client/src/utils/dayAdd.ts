import { MAX_TRIP_DAYS, planDatedAppend } from '@trek/shared'
import type { Day, Trip } from '../types'

type Translate = (key: string, params?: Record<string, string | number>) => string

/**
 * What the reorder dialog and the phone's day sheet need to offer adding a day:
 * one button for a day without a date, and on a trip with dates a second one for
 * the next calendar day. The planner computes it once for both shells.
 */
export interface DayAddControls {
  /** The date "Add with date" gives the new day (ISO), or null on a trip without dates, which keeps the single button. */
  nextDate: string | null
  /** Why no day can be added right now (no connection), or null. */
  blocked: string | null
  /** Why the dated day in particular cannot be added (the trip is at the day limit), or null. */
  datedBlocked: string | null
  /** A day is on its way; both buttons wait for it, so a double click adds one day, not two. */
  busy: boolean
  onAddDated: () => void
}

/**
 * The dated half of adding a day: the date the new day would get, and the reason
 * it cannot be added when the trip is already at the day limit. The rule is the
 * server's own (planDatedAppend), so the button never promises a date the server
 * would not give, and never offers a day the server would refuse.
 */
export function datedDayOption(
  trip: Pick<Trip, 'start_date' | 'end_date'> | null | undefined,
  days: readonly Pick<Day, 'date'>[],
  t: Translate,
): Pick<DayAddControls, 'nextDate' | 'datedBlocked'> {
  const plan = trip ? planDatedAppend(trip, days.map(d => d.date)) : null
  if (!plan) return { nextDate: null, datedBlocked: null }
  return { nextDate: plan.date, datedBlocked: plan.fits ? null : t('dashboard.tripTooLong', { days: MAX_TRIP_DAYS }) }
}
