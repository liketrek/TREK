import { useCallback, useRef, useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import type { AssignmentsMap } from '../../types';

/** A tour fills its day, so a day holds it at most once; the server refuses a second time the same way. */
export function isTourOnDay(assignments: AssignmentsMap, placeId: number, dayId: number): boolean {
  return (assignments[String(dayId)] ?? []).some((assignment) => assignment.place_id === placeId);
}

/** The one write a tour goes onto a day through; `false` when it did not happen. */
export type AssignTourToDay = (
  placeId: number,
  dayId: number,
  position?: number
) => void | boolean | Promise<void | boolean>;

interface TourDayAssignmentOptions {
  /** Whether the user may change the days of the trip. */
  canAssign: boolean;
  onAssignToDay: AssignTourToDay;
}

/**
 * PR1-18: the rules every way of putting a tour on a day shares, the day menu
 * of a tour list, the tour's detail and the phone's action sheet alike: the
 * right to change the days, a day that already has the tour (from the store,
 * so a change shows at once), and a request still on its way, so a second
 * click cannot send it twice. The write itself is the plan's one assignment
 * path, which also says what happened.
 */
export function useTourDayAssignment({ canAssign, onAssignToDay }: TourDayAssignmentOptions) {
  const assignments = useTripStore((state) => state.assignments);
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());
  // Read before the state has rendered: two clicks in one frame still send once.
  const inFlight = useRef(new Set<string>());

  const isOnDay = useCallback(
    (placeId: number, dayId: number) => isTourOnDay(assignments ?? {}, placeId, dayId),
    [assignments]
  );
  const isPending = useCallback((placeId: number, dayId: number) => pending.has(`${placeId}:${dayId}`), [pending]);
  const isAvailable = useCallback(
    (placeId: number, dayId: number) => canAssign && !isOnDay(placeId, dayId) && !isPending(placeId, dayId),
    [canAssign, isOnDay, isPending]
  );

  const assign = useCallback(
    async (placeId: number, dayId: number): Promise<boolean> => {
      const key = `${placeId}:${dayId}`;
      if (!isAvailable(placeId, dayId) || inFlight.current.has(key)) return false;
      inFlight.current.add(key);
      setPending((current) => new Set(current).add(key));
      try {
        return (await onAssignToDay(placeId, dayId)) !== false;
      } finally {
        inFlight.current.delete(key);
        setPending((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    },
    [isAvailable, onAssignToDay]
  );

  return { canAssign, isOnDay, isPending, isAvailable, assign };
}

export type TourDayAssignment = ReturnType<typeof useTourDayAssignment>;
