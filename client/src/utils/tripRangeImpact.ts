import type { DayGridPlan } from '@trek/shared'
import type { Day } from '../types'
import { contentOnDays, type DayContent, type DayContentData } from './dayDeleteImpact'

/** A day a save would remove, with its place in the day list (for "Day n"). */
export interface RemovedDay {
  day: Day
  index: number
}

/** What a new range takes away: the days, in list order, and what sits on them. */
export interface TripRangeImpact {
  removedDays: RemovedDay[]
  /**
   * The start moved while dated days fall off the end. Plans follow their
   * position, so it is the last days that go, not the first: worth saying,
   * because it is the opposite of what moving the start suggests.
   */
  startMoved: boolean
  content: DayContent
}

const byNumber = (a: Day, b: Day): number => (a.day_number ?? 0) - (b.day_number ?? 0)

/**
 * Read a planDayGrid plan as the trip dialog shows it: which of the current
 * days go and everything on them, counted the same way the delete day
 * question counts a single day.
 */
export function tripRangeImpact(
  plan: DayGridPlan,
  days: Day[],
  data: DayContentData,
  options: { startMoved: boolean },
): TripRangeImpact {
  const gone = new Set(plan.removed.map(r => r.id))
  const removedDays = [...days]
    .sort(byNumber)
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => gone.has(day.id))
  const dropsDatedDays = plan.removed.some(r => r.reason === 'overflow')
  return {
    removedDays,
    startMoved: options.startMoved && dropsDatedDays,
    content: contentOnDays(removedDays.map(r => r.day), data),
  }
}

/**
 * Whether the days that go hold anything a traveller would miss. Empty days
 * come and go with every change of dates; asking about them would teach people
 * to click the question away.
 */
export function hasVisibleContent(impact: TripRangeImpact): boolean {
  const { places, notes, texts, bookings, stays } = impact.content
  return places + notes + texts + bookings + stays.length > 0
}
