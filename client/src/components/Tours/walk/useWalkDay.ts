import { clockOf } from '@trek/shared';
import { useMemo, useState } from 'react';
import type { AssignmentsMap, Day } from '../../../types';
import { walkStartOf } from './walkSchedule';

/** A day the walk is on, with its place in the trip and the walk's start that day. */
export interface WalkDayOption {
  day: Day;
  /** The day's position in the trip, so `index + 1` is the number the plan shows. */
  index: number;
  /** `HH:MM` the walk starts that day; null when none is set or it cannot be read. */
  start: string | null;
}

/**
 * CW-02: the days a walk is on, in the order of the trip, each with its start
 * on that day (`walkStartOf`). A time that cannot be read is no start.
 */
function walkDayOptions(placeId: number, days: readonly Day[], assignments: AssignmentsMap): WalkDayOption[] {
  return days.flatMap((day, index) => {
    const assignment = (assignments[String(day.id)] ?? []).find((entry) => entry.place_id === placeId);
    if (!assignment) return [];
    const minutes = walkStartOf(assignment);
    return [{ day, index, start: minutes === null ? null : clockOf(minutes) }];
  });
}

/** The day the times are worked out for, and how it is picked. */
export interface WalkDayChoice {
  options: WalkDayOption[];
  day: WalkDayOption | null;
  /** Opened from one of the walk's days: that day holds and cannot be switched. */
  fixed: boolean;
  choose: (dayId: number) => void;
}

/**
 * CW-02, CW-04: the day a walk's arrivals and opening hours are shown for.
 * Opened from one of its days, that day holds, with or without a time, and is
 * gone rather than replaced once the walk leaves it: another day never takes
 * over its time quietly. Otherwise the day picked here, or the first with a
 * start time, else the first. The choice is only what is looked at, never
 * saved, and starts over for another walk.
 */
export function useWalkDay(
  placeId: number | null,
  days: readonly Day[],
  assignments: AssignmentsMap,
  fixedDayId: number | null
): WalkDayChoice {
  const [chosen, setChosen] = useState<{ placeId: number; dayId: number } | null>(null);
  const options = useMemo(
    () => (placeId === null ? [] : walkDayOptions(placeId, days, assignments)),
    [assignments, days, placeId]
  );
  const choose = (dayId: number) => {
    if (placeId !== null) setChosen({ placeId, dayId });
  };
  if (fixedDayId !== null) {
    return { options, day: options.find((option) => option.day.id === fixedDayId) ?? null, fixed: true, choose };
  }
  const picked = chosen?.placeId === placeId ? options.find((option) => option.day.id === chosen.dayId) : undefined;
  const day = picked ?? options.find((option) => option.start !== null) ?? options[0] ?? null;
  return { options, day, fixed: false, choose };
}
