import type { TourListItem } from '@trek/shared';
import { useTourVisitStore, type VisitsByStation } from '../../../store/tourVisitStore';

/** The day's status of each station of a walk, by its key; undefined before any is marked or without a day. */
export function useDayVisits(assignmentId: number | null | undefined): VisitsByStation | undefined {
  return useTourVisitStore((state) => (assignmentId == null ? undefined : state.byAssignment[assignmentId]));
}

/**
 * CW-03: how many of a walk's stations were visited on one day, out of all of
 * them, or null where there is nothing to say yet: not a walk, no stations, or
 * none marked on that day. A skip counts as marked but not as visited.
 */
export function walkProgressOf(
  tour: Pick<TourListItem, 'tour_type' | 'station_count'>,
  visits: VisitsByStation | undefined
): { visited: number; total: number } | null {
  const total = tour.station_count ?? 0;
  if (tour.tour_type !== 'walk' || total === 0 || !visits) return null;
  const statuses = Object.values(visits);
  if (statuses.length === 0) return null;
  const visited = statuses.filter((status) => status === 'visited').length;
  return { visited: Math.min(visited, total), total };
}

/** A walk's progress on the day its row stands for, shared by the day rows of the desktop and the phone. */
export function useWalkProgress(
  tour: Pick<TourListItem, 'tour_type' | 'station_count'>,
  assignmentId: number | null | undefined
): { visited: number; total: number } | null {
  return walkProgressOf(tour, useDayVisits(assignmentId));
}
