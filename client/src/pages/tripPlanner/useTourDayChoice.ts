import type { TourListItem } from '@trek/shared';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  isEmptyReanchoring,
  reanchorAfterInsert,
  reanchorAfterRemove,
  type Reanchoring,
} from '../../components/Roadtrip/roadtripModel';
import type { RoadtripVias } from '../../components/Roadtrip/useRoadtripVias';
import {
  planStageSpread,
  stageKeysOfTour,
  stagesThatFit,
  type SpreadStep,
  type StageSpread,
  type TourDayHow,
  type TourDayQuestion,
} from '../../components/Tours/stages/stageSpread';
import { isTourOnDay } from '../../components/Tours/useTourDayAssignment';
import { useTripStore } from '../../store/tripStore';
import type { Day, Place } from '../../types';
import { roadtripStopList } from '../../utils/dayRouteVias';
import { restoreVisit, visitOf } from './placeUndo';
import type { RoadtripFeed } from './useRoadtripFeed';

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface TourDayChoiceOptions {
  tripId: number;
  days: Day[];
  tours: readonly TourListItem[];
  selectedDayId: number | null;
  t: Translate;
  toast: {
    success: (message: string) => unknown;
    warning: (message: string) => unknown;
    error: (message: string) => unknown;
  };
  pushUndo: (label: string, undoFn: () => Promise<void> | void, dayIds?: number[], placeIds?: number[]) => void;
  /** The plan's one way of putting a place on a day, which puts a tour there whole. */
  assignWhole: (placeId: number, dayId?: number, position?: number) => Promise<boolean>;
  updateRouteForDay: (dayId: number) => Promise<unknown> | void;
  onToursChanged: () => Promise<unknown> | void;
  /** The road trip's vias, which every write that shifts the stops of a day carries along. */
  roadtripVias: Pick<RoadtripVias, 'byDay' | 'reanchor'>;
  viaLiesBefore: RoadtripFeed['viaLiesBefore'];
}

type ViaFeed = Pick<TourDayChoiceOptions, 'roadtripVias' | 'viaLiesBefore'>;
type Located = Pick<Place, 'lat' | 'lng'> | null | undefined;

/**
 * Keeps a day's road on the legs it was drawn on while a spread, or its undo,
 * takes stops off days and puts them back, the way the plan's own writes do
 * (useDayPlanEdits). A via is anchored by `after_order_index`, a POSITION among
 * the day's stops, and a tour with a start counts as one: a stop taken off the
 * middle of a road-trip day shifts every via behind it onto the wrong leg. One
 * run of writes can touch a day twice (the undo takes a stage off a day and
 * puts the whole tour back on it) faster than the plan renders, so the stops
 * are read from the store as each write goes out, and the vias are kept as the
 * last correction left them.
 */
function viaKeeper(feed: ViaFeed, onError: (err: unknown) => void) {
  const known = new Map<number, ViaFeed['roadtripVias']['byDay'][number]>();
  const viasOf = (dayId: number) => known.get(dayId) ?? feed.roadtripVias.byDay[dayId] ?? [];
  const rowsOf = (dayId: number) =>
    (useTripStore.getState().assignments[String(dayId)] ?? [])
      .slice()
      .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));

  const correct = async (dayId: number, plan: Reanchoring | null) => {
    if (!plan || isEmptyReanchoring(plan)) return;
    try {
      await feed.roadtripVias.reanchor(dayId, plan);
      const moved = new Map(plan.vias.map((via) => [via.id, via.after_order_index] as const));
      known.set(
        dayId,
        viasOf(dayId)
          .filter((via) => !plan.remove.includes(via.id))
          .map((via) => ({ ...via, after_order_index: moved.get(via.id) ?? via.after_order_index }))
      );
    } catch (err: unknown) {
      // The stop is where it was put all the same; only the road kept its old anchors.
      onError(err);
    }
  };

  return {
    /** Takes a stop off a day through `write`, the vias behind it moving up a leg. */
    async takeOff(dayId: number, assignmentId: number, write: () => Promise<void>) {
      const stops = roadtripStopList(rowsOf(dayId));
      const at = stops.findIndex((stop) => stop.id === assignmentId);
      const plan = at < 0 ? null : reanchorAfterRemove(viasOf(dayId), at, stops.length);
      await write();
      await correct(dayId, plan);
    },
    /** Puts a stop on a day at row `position` through `write`, the vias behind it moving down a leg. */
    async putOn<T>(dayId: number, position: number, place: Located, write: () => Promise<T>): Promise<T> {
      const rows = rowsOf(dayId);
      const stopCount = roadtripStopList(rows).length;
      const insertAt = roadtripStopList(rows.slice(0, Math.max(0, position))).length;
      const lat = place?.lat;
      const lng = place?.lng;
      const plan =
        insertAt >= stopCount || typeof lat !== 'number' || typeof lng !== 'number'
          ? null
          : reanchorAfterInsert(viasOf(dayId), insertAt, feed.viaLiesBefore(dayId, { lat, lng }));
      const result = await write();
      await correct(dayId, plan);
      return result;
    },
  };
}

type ViaKeeper = ReturnType<typeof viaKeeper>;
/** Takes one write back, the vias kept by the one keeper of the whole undo. */
type Undo = (road: ViaKeeper) => Promise<void>;

/**
 * Sends one write of a spread through the store, the plan's offline way, and
 * returns what takes it back. A stage moved or put on a day goes on at its end,
 * where no via lies behind it; a stop taken off a day or put back in the
 * middle of one carries the day's vias along (`viaKeeper`). The undo runs
 * later, and is handed the keeper of its own run.
 */
async function runStep(tripId: number, placeId: number, step: SpreadStep, road: ViaKeeper): Promise<Undo> {
  const store = useTripStore.getState();
  if (step.kind === 'move') {
    await road.takeOff(step.fromDayId, step.assignmentId, () =>
      store.moveAssignment(tripId, step.assignmentId, step.fromDayId, step.toDayId)
    );
    return (back) =>
      back.takeOff(step.toDayId, step.assignmentId, () =>
        useTripStore.getState().moveAssignment(tripId, step.assignmentId, step.toDayId, step.fromDayId)
      );
  }
  if (step.kind === 'create') {
    const created = await store.assignPlaceToDay(tripId, step.dayId, placeId, null, step.key);
    return async (back) => {
      const id = created?.id;
      if (!id) return;
      await back.takeOff(step.dayId, id, () => useTripStore.getState().removeAssignment(tripId, step.dayId, id));
    };
  }
  const item = (store.assignments[String(step.dayId)] ?? []).find((entry) => entry.id === step.assignmentId);
  await road.takeOff(step.dayId, step.assignmentId, () =>
    store.removeAssignment(tripId, step.dayId, step.assignmentId)
  );
  return async (back) => {
    if (!item?.place) return;
    // Back where it was, whole or as its stage, with the times, note and travellers it had.
    const visit = visitOf(step.dayId, item);
    const actions = useTripStore.getState();
    const key = item.tour_stage_key ?? undefined;
    const restored = await back.putOn(step.dayId, visit.orderIndex, item.place, () =>
      actions.assignPlaceToDay(tripId, step.dayId, placeId, visit.orderIndex, key)
    );
    if (restored?.id) await restoreVisit(tripId, actions, visit, restored.id);
  };
}

/** The days a write acts on. */
const daysOf = (step: SpreadStep): number[] => (step.kind === 'move' ? [step.fromDayId, step.toDayId] : [step.dayId]);

/** What a spread did, in a sentence or three: from which day, what found no day, what the stages replaced. */
function spreadMessage(plan: StageSpread, days: readonly Day[], t: Translate): string {
  const numberOf = (dayId: number) => days.findIndex((day) => day.id === dayId) + 1;
  const parts = [t('tours.stages.placed', { from: numberOf(plan.placed[0].dayId) })];
  if (plan.unplaced > 0) parts.push(t('tours.stages.placeStagesShort', { last: plan.placed.length }));
  if (plan.wholeOff.length > 0) {
    const off = plan.wholeOff.map(numberOf).sort((a, b) => a - b);
    // A tour can sit whole on several days, once on each; the sentence then names them all.
    const list = off.join(', ');
    parts.push(
      off.length > 1 ? t('tours.stages.placedReplacedMany', { list }) : t('tours.stages.placedReplaced', { list })
    );
  }
  return parts.join(' ');
}

/**
 * MDT-02: putting a multi-day tour on a day, for the desktop and the phone
 * alike. Every way the plan puts a place on a day ends here; a tour with
 * stages asks first whether it goes on the day whole or a stage a day from
 * there on, unless the menu it came from has asked already (`how`). Put on
 * a day each, the stages go through the plan's one write path in order
 * (store, repo, mutation queue), so they work offline and show at once, and
 * one undo takes them all back. With fewer days left in the trip than stages
 * it says so and leaves the rest on no day.
 */
export function useTourDayChoice(options: TourDayChoiceOptions) {
  const { tripId, days, tours, selectedDayId, t, toast } = options;
  const { pushUndo, assignWhole, updateRouteForDay, onToursChanged, roadtripVias, viaLiesBefore } = options;
  const [tourDayQuestion, setTourDayQuestion] = useState<TourDayQuestion | null>(null);
  const answer = useRef<((how: TourDayHow | null) => void) | null>(null);
  // The vias as the plan has them now: an undo runs long after the spread that pushed it.
  const viaFeed = useRef<ViaFeed>({ roadtripVias, viaLiesBefore });
  useLayoutEffect(() => {
    viaFeed.current = { roadtripVias, viaLiesBefore };
  }, [roadtripVias, viaLiesBefore]);

  const answerTourDay = useCallback((how: TourDayHow | null) => {
    const resolve = answer.current;
    answer.current = null;
    setTourDayQuestion(null);
    resolve?.(how);
  }, []);

  const ask = useCallback(
    (question: TourDayQuestion) =>
      new Promise<TourDayHow | null>((resolve) => {
        // A question still open is dropped, as if it had been closed.
        answer.current?.(null);
        answer.current = resolve;
        setTourDayQuestion(question);
      }),
    []
  );

  const spreadTourStages = useCallback(
    async (placeId: number, dayId: number): Promise<boolean> => {
      const keys = stageKeysOfTour(tours.find((tour) => tour.place_id === placeId));
      const plan = planStageSpread({ placeId, keys, days, assignments: useTripStore.getState().assignments, dayId });
      if (plan.placed.length === 0) return false;
      // Said once per run of writes, the way the plan says a road it could not keep.
      const keeper = () => {
        let said = false;
        return viaKeeper(viaFeed.current, (err) => {
          if (said) return;
          said = true;
          toast.error(err instanceof Error ? err.message : t('common.unknownError'));
        });
      };
      const road = keeper();
      const undos: Undo[] = [];
      let failed = false;
      for (const step of plan.steps) {
        try {
          undos.unshift(await runStep(tripId, placeId, step, road));
        } catch {
          // The store has put back the write that failed; what went before stays, and the undo takes it back.
          failed = true;
          break;
        }
      }
      const touched = [...new Set(plan.steps.flatMap(daysOf))];
      const redraw = () => {
        const selected = useTripStore.getState().selectedDayId;
        if (selected != null && touched.includes(selected)) void updateRouteForDay(selected);
      };
      redraw();
      await onToursChanged();
      if (undos.length > 0) {
        pushUndo(
          t('tours.stages.placeUndo'),
          async () => {
            const back = keeper();
            for (const undo of undos) await undo(back);
            await onToursChanged();
            redraw();
          },
          touched,
          [placeId]
        );
      }
      if (failed) {
        toast.error(t('tours.stages.placeFailed'));
        return false;
      }
      const message = spreadMessage(plan, days, t);
      if (plan.unplaced > 0) toast.warning(message);
      else toast.success(message);
      return true;
    },
    [days, onToursChanged, pushUndo, t, toast, tours, tripId, updateRouteForDay]
  );

  const handleAssignToDay = useCallback(
    async (placeId: number, dayId?: number, position?: number, how?: TourDayHow): Promise<boolean> => {
      const target = dayId || selectedDayId;
      const tour = tours.find((item) => item.place_id === placeId);
      const count = stageKeysOfTour(tour).length;
      const index = target ? days.findIndex((day) => day.id === target) : -1;
      if (!tour || !target || count < 2 || index < 0 || how === 'whole') return assignWhole(placeId, dayId, position);
      const question: TourDayQuestion = {
        placeId,
        dayId: target,
        day: index + 1,
        name: tour.name,
        count,
        fit: stagesThatFit(days, target, count),
        wholeFree: !isTourOnDay(useTripStore.getState().assignments, placeId, target),
      };
      const choice = how ?? (await ask(question));
      if (choice === 'stages') return spreadTourStages(placeId, target);
      return choice === 'whole' ? assignWhole(placeId, target, position) : false;
    },
    [ask, assignWhole, days, selectedDayId, spreadTourStages, tours]
  );

  return { tourDayQuestion, answerTourDay, handleAssignToDay };
}
