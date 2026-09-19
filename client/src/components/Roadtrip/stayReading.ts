import { formatClock, parseClock, type ScheduleEntry } from './roadtripModel'
import type { RoadtripDay, RoadtripStop } from '@trek/shared/roadtrip'
import type { StayDraft } from './RoadtripStayModal'
import type { RoadtripStayControl } from './VisitControls'

/**
 * How long a stop is stood at, the way a stay badge shows it.
 *
 * For most stops that is the stay the place carries. A stop with a time set to leave it
 * is stood at from whenever the drive gets there until that time, so its stay is what
 * the schedule made of it and `until` says when it ends. The number is read here and
 * never written back to the place: the stay belongs to the place, the end time to one
 * visit of it, and a stored copy would be wrong the moment the arrival moved.
 */
export interface StayReading {
  minutes: number | null
  /** The time the stop is left at as it was set, or null for a stop that takes its stay. */
  until: string | null
  /**
   * The daily travel hours close before `until` comes. The stop is where that day ends and
   * the drive goes on the next morning, so it is left neither at that time nor at the one
   * the row shows, and no length measured against either would be true.
   */
  dayEndsFirst?: boolean
}

export function readStay(
  stop: Pick<RoadtripStop, 'dwellMinutes' | 'leaveAt'>,
  entry: { arrival?: string | null; departure?: string | null } | null | undefined,
): StayReading {
  const leave = parseClock(stop.leaveAt)
  if (leave === null) return { minutes: stop.dwellMinutes, until: null }
  const until = formatClock(leave)
  const arrival = parseClock(entry?.arrival)
  const departure = parseClock(entry?.departure)
  if (arrival === null || departure === null) return { minutes: null, until }
  // A schedule leaves such a stop at the time, or on arrival when it got there too late
  // for it. Any other departure is the window shutting first.
  if (departure !== leave && departure !== arrival) return { minutes: null, until, dayEndsFirst: true }
  return {
    // Round the clock once: reached before midnight and left the morning after, the
    // departure reads as the smaller of the two.
    minutes: (departure - arrival + 1440) % 1440,
    until,
  }
}

/** How late the drive gets to a stop for the time it is set to be left at, or null. */
export function missedLeaveOf(day: Pick<RoadtripDay, 'schedule'>, index: number): number | null {
  return day.schedule.warnings.find(w => w.index === index && w.code === 'missedLeave')?.minutes ?? null
}

/**
 * The length a stay badge prints, or null for none.
 *
 * No stay on an ordinary stop is nothing to show. On a stop left at a set time a zero is
 * an answer: it is left the moment the drive gets there.
 */
export function shownStay(stay: StayReading): number | null {
  return stay.until ? stay.minutes : stay.minutes || null
}

/** One visit on the routed days, with the entry of the card that draws it. */
export interface LocatedStop {
  day: RoadtripDay
  index: number
  stop: RoadtripStop
  entry: ScheduleEntry | undefined
}

/**
 * Finds a visit across the routed days.
 *
 * A stop reached after a night drive is drawn on the card of the day it is reached on,
 * not the one it is stored on, so `preferDayId` is only where the search starts.
 */
export function locateStop(
  days: readonly RoadtripDay[],
  assignmentId: number,
  preferDayId?: number | null,
): LocatedStop | null {
  const preferred = days.find(d => d.dayId === preferDayId)
  for (const day of preferred ? [preferred, ...days.filter(d => d !== preferred)] : days) {
    const index = day.stops.findIndex(s => s.assignmentId === assignmentId && !s.automaticNight)
    if (index >= 0) return { day, index, stop: day.stops[index], entry: day.schedule.entries[index] }
  }
  return null
}

/**
 * What the stay dialog opens on for one stop of a card.
 *
 * `missedBy` is the card's own finding, carried rather than worked out again from the two
 * clocks: which day a leave time falls on is the schedule's call, and a second reading of
 * it here is a second answer.
 */
export function stayDraftOf(stop: RoadtripStop, entry: ScheduleEntry | undefined, missedBy: number | null = null): StayDraft {
  return {
    placeId: stop.placeId,
    name: stop.name,
    minutes: stop.dwellMinutes,
    arrival: entry?.arrival ?? null,
    departure: entry?.departure ?? null,
    leaveAt: stop.leaveAt ?? null,
    missedBy,
    assignmentId: stop.assignmentId,
    dayId: stop.ownerDayId,
  }
}

/**
 * The place inspector's Stay tile.
 *
 * With the visit on the drive it reads the same as the rail does. A place selected
 * without one it can be pinned to (planned twice, say) falls back to the stay it carries.
 */
export function inspectorStay(
  days: readonly RoadtripDay[],
  stop: RoadtripStop | undefined,
  place: { id: number; name: string; duration_minutes?: number | null },
  onEdit?: (draft: StayDraft) => void,
): RoadtripStayControl {
  const located = stop ? locateStop(days, stop.assignmentId, stop.ownerDayId) : null
  const draft: StayDraft = located
    ? stayDraftOf(located.stop, located.entry, missedLeaveOf(located.day, located.index))
    : { placeId: place.id, name: place.name, minutes: place.duration_minutes ?? null, arrival: null }
  const reading = located
    ? readStay(located.stop, located.entry)
    : { minutes: stop ? stop.dwellMinutes : place.duration_minutes ?? null, until: null }
  return { ...reading, onEdit: onEdit ? () => onEdit(draft) : undefined }
}
