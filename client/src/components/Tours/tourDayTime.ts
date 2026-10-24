import { clockOf, minutesOf, type TourListItem } from '@trek/shared';
import type { Assignment } from '../../types';
import { getDisplayTimeForDay, parseTimeToMinutes, type MergedItem } from '../../utils/dayMerge';
import { tourDayMinutes, tourPlannedTimes } from './tourPresentation';

/**
 * TIME-02: a tour in the day's timeline, the way a place sits there. Its
 * start and end that day are the times of its day entry, the same fields a
 * place's visit keeps, so every tour type, a city walk among them, has one
 * model. With a start and a known total (the planned total, else the
 * estimate of an import, TIME-01) the end follows as the start plus that
 * total and is marked as worked out; an end typed by hand wins over it.
 * Nothing here is saved: a changed total moves the end the next time it is read.
 */

const DAY_MINUTES = 24 * 60;

/** The times a day holds a tour by, as its entry carries them. */
export interface TourDayEntry {
  start: string | null | undefined;
  end: string | null | undefined;
  /** MDT-02: the stage of a multi-day tour the day holds; the tour's total is not that stage's time. */
  stageKey?: string | null;
}

/** When a tour starts and ends on a day. */
export interface TourDayTime {
  /** `HH:MM` it starts. */
  start: string;
  /** `HH:MM` it ends; null where no end is typed and none can be worked out. */
  end: string | null;
  /** The end in minutes after that day's midnight, past 1440 when it ends on the next day. */
  endMinutes: number | null;
  /** The end is the start plus the total, not a time somebody typed. */
  workedOut: boolean;
  /** The total it was worked out with is an estimate (TIME-01). */
  estimated: boolean;
  /** The total leaves out a stay nobody entered yet, so it ends then at the earliest. */
  atLeast: boolean;
  /** It ends after midnight. */
  nextDay: boolean;
  /** The total the end was worked out with, in minutes; null for a typed end or none. */
  totalMinutes: number | null;
}

/** The times of a day entry as the plan shows them: the entry's own before the place's. */
export function tourDayEntryOf(
  assignment: Pick<Assignment, 'assignment_time' | 'assignment_end_time' | 'place' | 'tour_stage_key'>
): TourDayEntry {
  return {
    start: assignment.assignment_time ?? assignment.place?.place_time,
    end: assignment.assignment_end_time ?? assignment.place?.end_time,
    stageKey: assignment.tour_stage_key ?? null,
  };
}

/**
 * When a tour starts and ends on a day, or null without a start. A typed end
 * before the start runs into the next day. A stage of a multi-day tour gets
 * no worked-out end: the tour's total is the whole route's, not the stage's.
 */
export function tourDayTimeOf(entry: TourDayEntry, tour: TourListItem): TourDayTime | null {
  const start = minutesOf(entry.start);
  if (start === null) return null;
  const at = (end: number | null, total: { minutes: number; estimated: boolean; atLeast: boolean } | null) => ({
    start: clockOf(start),
    end: end === null ? null : clockOf(end),
    endMinutes: end,
    workedOut: total !== null,
    estimated: total?.estimated ?? false,
    atLeast: total?.atLeast ?? false,
    nextDay: end !== null && end >= DAY_MINUTES,
    totalMinutes: total?.minutes ?? null,
  });
  const typed = minutesOf(entry.end);
  if (typed !== null) return at(typed < start ? typed + DAY_MINUTES : typed, null);
  const total = entry.stageKey ? null : tourDayMinutes(tourPlannedTimes(tour));
  return total ? at(start + total.minutes, total) : at(null, null);
}

/** The next timed item of the day a tour runs into: its name, the `HH:MM` it starts and the `HH:MM` the tour ends. */
export interface TourOverrun {
  name: string;
  time: string;
  end: string;
}

/** When an item of the day starts, in minutes after midnight, as the timeline orders it; null without a time. */
function itemStartOf(item: MergedItem, dayId: number): number | null {
  if (item.type === 'place') return parseTimeToMinutes(item.data?.place?.place_time);
  if (item.type === 'note') return parseTimeToMinutes(item.data?.time);
  return parseTimeToMinutes(getDisplayTimeForDay(item.data, dayId));
}

function itemNameOf(item: MergedItem): string {
  if (item.type === 'place') return item.data?.place?.name ?? '';
  if (item.type === 'note') return item.data?.text ?? '';
  return item.data?.title ?? '';
}

/**
 * TIME-02: the next timed item of the day when the tour's end runs past its
 * start, or null. Only the next item with a time counts, the way the plan
 * reads a day: items without one lie between and are passed over. An end
 * after midnight runs past every later start of that day. Said while the plan
 * is looked at and never written, as a late connection is (CW-08).
 */
export function tourOverrunOf(
  following: readonly MergedItem[],
  dayId: number,
  time: Pick<TourDayTime, 'endMinutes'> | null
): TourOverrun | null {
  const end = time?.endMinutes;
  if (end == null) return null;
  for (const item of following) {
    const start = itemStartOf(item, dayId);
    if (start === null) continue;
    return end > start ? { name: itemNameOf(item), time: clockOf(start), end: clockOf(end) } : null;
  }
  return null;
}

/**
 * TIME-02: the overrun of the tour a day's item is, read off the items after
 * it, or null for an item that is no tour, a tour without a start and one
 * that ends in time. `tourOf` names the tour a place is, as the trip's tour
 * list knows it.
 */
export function dayItemOverrun(
  items: readonly MergedItem[],
  index: number,
  dayId: number,
  tourOf: (placeId: number) => TourListItem | undefined
): TourOverrun | null {
  const item = items[index];
  if (item?.type !== 'place') return null;
  const assignment: Assignment = item.data;
  // By the trip's tours alone, as the rows are: an entry added a moment ago carries no tour_place_id yet.
  const tour = tourOf(assignment.place_id);
  if (!tour) return null;
  return tourOverrunOf(items.slice(index + 1), dayId, tourDayTimeOf(tourDayEntryOf(assignment), tour));
}
