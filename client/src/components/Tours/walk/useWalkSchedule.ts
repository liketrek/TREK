import { walkStationsOf, type WalkFerryLeg } from '@trek/shared';
import { useCallback, useMemo } from 'react';
import { useTripStore } from '../../../store/tripStore';
import type { AssignmentsMap, Day, Place } from '../../../types';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useWalkDay, type WalkDayChoice } from './useWalkDay';
import { ferryLegsOfCrossings } from './walkFerry';
import { walkScheduleOf, type LinkedPlaceOf, type WalkSchedule, type WalkScheduleInput } from './walkSchedule';

const NO_PLACES: Place[] = [];
const NO_DAYS: Day[] = [];
const NO_ASSIGNMENTS: AssignmentsMap = {};
const NO_STATIONS: TourPlannerWaypoint[] = [];
const NO_FERRIES: WalkFerryLeg[] = [];

/** PR1-10: the trip place a point stands for, while the trip still has it. */
export function useLinkedPlaceOf(): (point: Pick<TourPlannerWaypoint, 'linkedPlaceId'>) => Place | null {
  const places = useTripStore((state) => state.places) ?? NO_PLACES;
  const byId = useMemo(() => new Map(places.map((place) => [place.id, place])), [places]);
  return useCallback(
    (point: Pick<TourPlannerWaypoint, 'linkedPlaceId'>) =>
      point.linkedPlaceId ? (byId.get(point.linkedPlaceId) ?? null) : null,
    [byId]
  );
}

/** CW-04: `walkScheduleOf`, worked out again only when one of its parts changes. */
export function useWalkSchedule({
  stations,
  route,
  walkingMinutes,
  day,
  placeOf,
  ferries = NO_FERRIES,
}: WalkScheduleInput): WalkSchedule {
  return useMemo(
    () => walkScheduleOf({ stations, route, walkingMinutes, day, placeOf, ferries }),
    [day, ferries, placeOf, route, stations, walkingMinutes]
  );
}

/** A walk's times in the planner: whether it is one, the day they are for, the schedule and how many stations. */
export interface PlannerWalkSchedule {
  enabled: boolean;
  choice: WalkDayChoice;
  schedule: WalkSchedule;
  stationCount: number;
}

/**
 * CW-02, CW-04: the planner's walk against the days it is on. The day is the
 * one picked here, else the first with a start time; nothing of it is saved.
 * Only a route that belongs to the stations as they are now counts, so a stop
 * moved since the last routing shows no arrival until the route is planned again.
 */
export function usePlannerWalkSchedule(
  planner: Pick<
    TourPlannerController,
    'tourType' | 'editingPlaceId' | 'waypoints' | 'route' | 'routeCurrent' | 'walkingDurationMinutes' | 'walkFerries'
  >,
  placeOf: LinkedPlaceOf
): PlannerWalkSchedule {
  const days = useTripStore((state) => state.days) ?? NO_DAYS;
  const assignments = useTripStore((state) => state.assignments) ?? NO_ASSIGNMENTS;
  const { tourType, editingPlaceId, waypoints, route, routeCurrent, walkingDurationMinutes, walkFerries } = planner;
  const enabled = tourType === 'walk';
  const choice = useWalkDay(enabled ? (editingPlaceId ?? null) : null, days, assignments, null);
  const stations = useMemo(() => (enabled ? walkStationsOf(waypoints) : NO_STATIONS), [enabled, waypoints]);
  const ferries = useMemo(() => ferryLegsOfCrossings(walkFerries.crossings), [walkFerries.crossings]);
  const schedule = useWalkSchedule({
    stations,
    route: routeCurrent ? (route ?? null) : null,
    walkingMinutes: walkingDurationMinutes ?? null,
    day: choice.day,
    placeOf,
    ferries,
  });
  return { enabled, choice, schedule, stationCount: stations.length };
}
