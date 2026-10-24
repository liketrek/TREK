import type { TourListItem } from '@trek/shared';
import { CalendarDays, CalendarRange } from 'lucide-react';
import type { useTranslation } from '../../../i18n';
import type { AssignmentsMap, Day } from '../../../types';
import type { useContextMenu } from '../../shared/ContextMenu';
import { dayMenuLabel } from '../tourDays';
import type { TourDayAssignment } from '../useTourDayAssignment';

type Translate = ReturnType<typeof useTranslation>['t'];

/** How a multi-day tour goes on a day: the whole tour there, or a stage a day from there on. */
export type TourDayHow = 'whole' | 'stages';

/**
 * The keys a tour's stages go on days by, in route order: those of the stops
 * each stage starts at, the last stop starting none. Empty for a day tour.
 */
export function stageKeysOfTour(tour: Pick<TourListItem, 'stage_stops'> | null | undefined): string[] {
  return (tour?.stage_stops ?? []).slice(0, -1).map((stop) => stop.key);
}

/** How many of `count` stages fit from a day on, one a day up to the trip's last day; 0 for a day the trip has not. */
export function stagesThatFit(days: readonly Pick<Day, 'id'>[], dayId: number, count: number): number {
  const at = days.findIndex((day) => day.id === dayId);
  return at < 0 ? 0 : Math.min(count, days.length - at);
}

/** One write of a spread, in the order it is sent. */
export type SpreadStep =
  | { kind: 'remove'; dayId: number; assignmentId: number }
  | { kind: 'move'; assignmentId: number; fromDayId: number; toDayId: number }
  | { kind: 'create'; dayId: number; key: string };

export interface StageSpread {
  steps: SpreadStep[];
  /** The stages that get a day, in route order. */
  placed: Array<{ key: string; dayId: number }>;
  /** The stages the trip has no day left for; they end up on none. */
  unplaced: number;
  /** The days the whole tour comes off, its stages taking its place. */
  wholeOff: number[];
}

interface SpreadInput {
  placeId: number;
  keys: readonly string[];
  days: readonly Pick<Day, 'id'>[];
  assignments: AssignmentsMap;
  dayId: number;
}

/**
 * The stages of the tour on a day that keep a day, by their key; and the
 * writes that take off the rest first: the whole tour, a stage the route no
 * longer has, and a stage the trip has no day left for.
 */
function heldStagesOf(placeId: number, want: ReadonlyMap<string, number | null>, assignments: AssignmentsMap) {
  const own = new Map<string, { assignmentId: number; dayId: number }>();
  const steps: SpreadStep[] = [];
  const wholeOff: number[] = [];
  for (const [dayKey, items] of Object.entries(assignments)) {
    for (const item of items.filter((entry) => entry.place_id === placeId)) {
      const day = Number(dayKey);
      const key = item.tour_stage_key;
      if (key && want.get(key) != null) own.set(key, { assignmentId: item.id, dayId: day });
      else steps.push({ kind: 'remove', dayId: day, assignmentId: item.id });
      if (!key) wholeOff.push(day);
    }
  }
  return { own, steps, wholeOff };
}

/**
 * The writes that put the stages of a multi-day tour on the trip's days from
 * one day on: stage 1 on that day, stage 2 on the next, and so on (MDT-02
 * holds a stage on one day at most, and a day holds the tour once). A stage
 * already on its day stays, one on another day moves, one on none is put on
 * its day. The whole tour comes off the days it is on, since the stages take
 * its place; so does a stage the route no longer has. Stages past the trip's
 * last day are on no day afterwards, never on a day made up for them. The
 * writes are ordered so that each lands on a day nothing else of the tour
 * holds at that moment: a stage whose day another stage still holds waits
 * until that one has moved, and of stages that would swap days one comes off
 * first and goes on again like a new one.
 */
export function planStageSpread({ placeId, keys, days, assignments, dayId }: SpreadInput): StageSpread {
  const at = days.findIndex((day) => day.id === dayId);
  const targets = at < 0 ? [] : days.slice(at).map((day) => day.id);
  const want = new Map(keys.map((key, index) => [key, targets[index] ?? null] as const));
  const { own, steps, wholeOff } = heldStagesOf(placeId, want, assignments);

  const holder = new Map([...own].map(([key, held]) => [held.dayId, key] as const));
  let open = keys.filter((key) => {
    const target = want.get(key);
    return target != null && own.get(key)?.dayId !== target;
  });
  while (open.length > 0) {
    const free = open.find((key) => !holder.has(want.get(key) as number));
    if (free === undefined) {
      // Every stage left waits for a day another of them holds: the one in the way comes off first.
      const blocker = holder.get(want.get(open[0]) as number) as string;
      const held = own.get(blocker);
      if (!held) break;
      steps.push({ kind: 'remove', dayId: held.dayId, assignmentId: held.assignmentId });
      holder.delete(held.dayId);
      own.delete(blocker);
      continue;
    }
    const target = want.get(free) as number;
    const held = own.get(free);
    if (held) {
      steps.push({ kind: 'move', assignmentId: held.assignmentId, fromDayId: held.dayId, toDayId: target });
      holder.delete(held.dayId);
    } else {
      steps.push({ kind: 'create', dayId: target, key: free });
    }
    holder.set(target, free);
    open = open.filter((key) => key !== free);
  }

  const placed = keys.flatMap((key) => {
    const target = want.get(key);
    return target == null ? [] : [{ key, dayId: target }];
  });
  return { steps, placed, unplaced: keys.length - placed.length, wholeOff };
}

/** What the choice between the two ways is asked about: the stages, how many fit, and whether the day is free. */
interface TourDayChoiceFacts {
  count: number;
  fit: number;
  /** Whether the whole tour can go on the day: not while the day holds the tour or a stage of it. */
  wholeFree: boolean;
}

/** The question the day plan asks when a multi-day tour is put on a day some way without a menu. */
export interface TourDayQuestion extends TourDayChoiceFacts {
  placeId: number;
  dayId: number;
  /** The day's number in the trip, as the plan shows it. */
  day: number;
  name: string;
}

interface TourDayChoice {
  how: TourDayHow;
  title: string;
  hint: string;
  disabled: boolean;
}

/**
 * The two ways a multi-day tour goes on a day, as every place that asks words
 * them: the menu of a tour list, the detail's button, the dialog and the
 * phone's sheet. The stages say up to which one fits when the trip ends
 * before the last of them.
 */
export function tourDayChoices({ count, fit, wholeFree }: TourDayChoiceFacts, t: Translate): TourDayChoice[] {
  const short = fit < count;
  return [
    {
      how: 'whole',
      title: t('tours.stages.placeWhole'),
      hint: wholeFree ? t('tours.stages.placeWholeHint') : t('tours.stages.placeWholeTaken'),
      disabled: !wholeFree,
    },
    {
      how: 'stages',
      title: short ? t('tours.stages.placeStagesFit', { last: fit }) : t('tours.stages.placeStages'),
      hint: short ? t('tours.stages.placeStagesShort', { last: fit }) : t('tours.stages.placeStagesHint'),
      disabled: fit === 0,
    },
  ];
}

type MenuItems = Parameters<ReturnType<typeof useContextMenu>['open']>[1];

export interface TourDayHowInput {
  placeId: number;
  dayId: number;
  days: Day[];
  /** The stages of the multi-day tour. */
  stageCount: number;
  assignment: TourDayAssignment;
}

/**
 * MDT-02: the two ways a multi-day tour goes on a day, as menu items: whole,
 * or a stage a day from it on, under the day they act on, so the step after
 * the day menu still says which day was picked. Whole is greyed out on a day
 * that holds the tour already, and says so; the stages say how many fit when
 * the trip ends before them.
 */
export function tourDayHowItems(input: TourDayHowInput, t: Translate, locale: string): MenuItems {
  const { placeId, dayId, days, stageCount, assignment } = input;
  const facts = {
    count: stageCount,
    fit: stagesThatFit(days, dayId, stageCount),
    wholeFree: !assignment.isOnDay(placeId, dayId),
  };
  const ways = tourDayChoices(facts, t).map((choice) => {
    const disabled = choice.disabled || !assignment.isAvailable(placeId, dayId, choice.how);
    return {
      label: choice.title,
      // Greyed out with no reason reads as broken; the reason goes right under it.
      hint: choice.disabled && choice.how === 'whole' ? choice.hint : undefined,
      icon: choice.how === 'whole' ? CalendarDays : CalendarRange,
      disabled,
      onClick: () => void assignment.assign(placeId, dayId, choice.how),
    };
  });
  const at = days.findIndex((day) => day.id === dayId);
  if (at < 0) return ways;
  return [{ label: dayMenuLabel(days[at], at, t, locale), heading: true }, ...ways];
}
