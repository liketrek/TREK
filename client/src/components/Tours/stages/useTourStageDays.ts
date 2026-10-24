import { useCallback, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../../../i18n';
import { useTripStore } from '../../../store/tripStore';
import type { AssignmentsMap } from '../../../types';
import { useToast } from '../../shared/Toast';

/** MDT-02: where a stage of a tour is: the assignment that holds it and its day. */
export interface StageDay {
  assignmentId: number;
  dayId: number;
}

/** The days the stages of one tour are on, by the key of the stop each starts at. */
export function stageDaysOf(placeId: number, assignments: AssignmentsMap): Map<string, StageDay> {
  const days = new Map<string, StageDay>();
  for (const [dayKey, items] of Object.entries(assignments)) {
    for (const item of items) {
      if (item.place_id === placeId && item.tour_stage_key) {
        days.set(item.tour_stage_key, { assignmentId: item.id, dayId: Number(dayKey) });
      }
    }
  }
  return days;
}

/**
 * Whether a day holds the tour already, whole or one of its stages, other than
 * the stage being placed: a day holds a tour once, as the server holds it to.
 */
export function dayHoldsTour(assignments: AssignmentsMap, placeId: number, dayId: number, own?: StageDay): boolean {
  return (assignments[String(dayId)] ?? []).some((item) => item.place_id === placeId && item.id !== own?.assignmentId);
}

interface StageDaysOptions {
  tripId: number | string | null | undefined;
  placeId: number;
  /** Whether the viewer may change the days of the trip. */
  canAssign: boolean;
}

/**
 * MDT-02: each stage of a multi-day tour on a day of its own, or on none yet.
 * Setting a day puts the stage there, moves it from the day it was on, or with
 * no day takes it off; all three go the plan's one way (store, repo, queue),
 * so they work offline and show at once. A day that already holds the tour or
 * another of its stages is not offered, and a stage still on its way cannot be
 * sent twice. Stages are found by the key of the stop each starts at, so the
 * days stay with their stages however the list groups them.
 */
export function useTourStageDays({ tripId, placeId, canAssign }: StageDaysOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const { assignments, assignPlaceToDay, moveAssignment, removeAssignment } = useTripStore(
    useShallow((state) => ({
      assignments: state.assignments,
      assignPlaceToDay: state.assignPlaceToDay,
      moveAssignment: state.moveAssignment,
      removeAssignment: state.removeAssignment,
    }))
  );
  const stageDays = useMemo(() => stageDaysOf(placeId, assignments ?? {}), [assignments, placeId]);
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  // Read before the state renders: two picks in one frame still send once.
  const inFlight = useRef(new Set<string>());

  const dayOf = useCallback((key: string) => stageDays.get(key)?.dayId ?? null, [stageDays]);
  const isPending = useCallback((key: string) => pending.has(key), [pending]);
  const canTake = useCallback(
    (key: string, dayId: number) =>
      canAssign && !pending.has(key) && !dayHoldsTour(assignments ?? {}, placeId, dayId, stageDays.get(key)),
    [assignments, canAssign, pending, placeId, stageDays]
  );

  const write = useCallback(
    async (key: string, dayId: number | null, own: StageDay | undefined) => {
      if (tripId == null) return;
      if (dayId === null && own) await removeAssignment(tripId, own.dayId, own.assignmentId);
      else if (dayId !== null && own) await moveAssignment(tripId, own.assignmentId, own.dayId, dayId);
      else if (dayId !== null) await assignPlaceToDay(tripId, dayId, placeId, null, key);
    },
    [assignPlaceToDay, moveAssignment, placeId, removeAssignment, tripId]
  );

  const setDay = useCallback(
    async (key: string, dayId: number | null): Promise<boolean> => {
      const own = stageDays.get(key);
      if (!canAssign || (own?.dayId ?? null) === dayId || inFlight.current.has(key)) return false;
      if (dayId !== null && dayHoldsTour(assignments ?? {}, placeId, dayId, own)) return false;
      inFlight.current.add(key);
      setPending((current) => new Set(current).add(key));
      try {
        await write(key, dayId, own);
        return true;
      } catch {
        // The store has put the day plan back as it was; say why nothing changed.
        toast.error(t('tours.stages.dayFailed'));
        return false;
      } finally {
        inFlight.current.delete(key);
        setPending((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [assignments, canAssign, placeId, stageDays, t, toast, write]
  );

  return { canAssign, dayOf, isPending, canTake, setDay };
}

export type TourStageDays = ReturnType<typeof useTourStageDays>;
