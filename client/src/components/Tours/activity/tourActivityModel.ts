import {
  TOUR_ACTIVITY_REFUSALS,
  type TourActivity,
  type TourActivityRefusal,
  type TourGpxImportFields,
  type TourListItem,
} from '@trek/shared';
import type { AssignmentsMap, Day } from '../../../types';
import { formatDate } from '../../../utils/formatters';
import { analyzeRouteGeometry, type RouteGeometryAnalysis } from '../../../utils/routeGeometry';

/**
 * ACT-01, the pure half of a tour's recorded tracks: the executions a
 * recording can belong to (the days the tour is on, or none), the recordings
 * of the trip that can be assigned, and what one of them measures.
 */

/** One execution of a tour: a day it is on, through its day assignment; `null` assignment for none. */
export interface TourExecution {
  assignmentId: number | null;
  day: Day | null;
  /** The day's position in the trip, so `index + 1` is the number the plan shows; -1 without a day. */
  index: number;
}

/** Every day the tour is on, in the order of the trip, each with its assignment. */
export function executionsOf(placeId: number, days: readonly Day[], assignments: AssignmentsMap): TourExecution[] {
  return days.flatMap((day, index) => {
    const assignment = (assignments[String(day.id)] ?? []).find((item) => item.place_id === placeId);
    return assignment ? [{ assignmentId: assignment.id, day, index }] : [];
  });
}

/** The execution an assignment stands for; one whose day is gone reads as none. */
export function executionOf(executions: readonly TourExecution[], assignmentId: number | null): TourExecution {
  return (
    executions.find((execution) => execution.assignmentId === assignmentId) ?? {
      assignmentId: null,
      day: null,
      index: -1,
    }
  );
}

/** The recordings in the order of the days they belong to, the ones without a day last. */
export function inDayOrder(activities: readonly TourActivity[], executions: readonly TourExecution[]): TourActivity[] {
  const position = (activity: TourActivity) => {
    const index = executionOf(executions, activity.assignment_id).index;
    return index < 0 ? Number.MAX_SAFE_INTEGER : index;
  };
  return [...activities].sort((a, b) => position(a) - position(b) || a.id - b.id);
}

/** A tour of the trip that still is the line it was recorded with: an import nobody planned over. */
export function isRecording(tour: Pick<TourListItem, 'origin' | 'has_waypoints'>): boolean {
  return tour.origin !== undefined && tour.origin !== 'trek' && !tour.has_waypoints;
}

/**
 * What can be offered for this tour: every recording of the trip but the tour
 * itself and the ones with recordings of their own. One that documents another
 * tour stays in the list, dimmed, with that tour's name, so the user sees why
 * it cannot be picked rather than missing it.
 */
export interface TrackCandidate {
  tour: TourListItem;
  /** The other tour this recording documents already; null while it is free or this tour's own. */
  takenBy: string | null;
}

export function trackCandidates(tours: readonly TourListItem[], placeId: number): TrackCandidate[] {
  const names = new Map(tours.map((tour) => [tour.place_id, tour.name]));
  return tours
    .filter((tour) => tour.place_id !== placeId && isRecording(tour) && !tour.activity_tracks?.length)
    .map((tour) => {
      const owner = tour.activity_of ?? null;
      return { tour, takenBy: owner !== null && owner !== placeId ? (names.get(owner) ?? '') : null };
    });
}

/**
 * The type a recording of this tour is imported as, preset in the GPX
 * preview: the tour's own, with its bike or run profile, its boat and water,
 * or its ski discipline and technique where it has them. A type the import
 * does not offer, and a ski tour without a discipline (which the import
 * refuses for ski), starts as a hike, as the preview always did.
 */
export function importFieldsFor(
  tour: Pick<TourListItem, 'tour_type' | 'bike_profile' | 'boat_type' | 'water_context'> &
    Partial<Pick<TourListItem, 'run_profile' | 'ski_discipline' | 'ski_technique'>>
): TourGpxImportFields {
  switch (tour.tour_type) {
    case 'ski':
      if (!tour.ski_discipline) return { tour_type: 'hike' };
      return {
        tour_type: 'ski',
        ski_discipline: tour.ski_discipline,
        // Only cross-country is done in a technique; unknown when the travellers did not know it.
        ...(tour.ski_discipline === 'cross_country' ? { ski_technique: tour.ski_technique ?? 'unknown' } : {}),
      };
    case 'bike':
      return { tour_type: 'bike', bike_profile: tour.bike_profile ?? 'touring' };
    case 'run':
      return { tour_type: 'run', run_profile: tour.run_profile ?? 'running' };
    case 'horse':
      return { tour_type: 'horse' };
    case 'kayak':
      return {
        tour_type: 'kayak',
        ...(tour.boat_type ? { boat_type: tour.boat_type } : {}),
        ...(tour.water_context ? { water_context: tour.water_context } : {}),
      };
    case 'walk':
      return { tour_type: 'walk' };
    default:
      return { tour_type: 'hike' };
  }
}

/** A recording's line analysed the way the plan's is, so both read alike. */
export function analysisOfLine(geometry: TourActivity['geometry']): RouteGeometryAnalysis | null {
  return geometry.length >= 2 ? analyzeRouteGeometry(JSON.stringify(geometry)) : null;
}

/** Minutes from a track's first to its last time, pauses included; null unless both are there and in order. */
export function recordedMinutes(startedAt?: string | null, endedAt?: string | null): number | null {
  const start = startedAt ? Date.parse(startedAt) : Number.NaN;
  const end = endedAt ? Date.parse(endedAt) : Number.NaN;
  return Number.isFinite(start) && Number.isFinite(end) && end > start ? Math.round((end - start) / 60_000) : null;
}

/**
 * The day a track was recorded on, as the viewer's calendar reads its first
 * time stamp: a hike started at 07:00 in Tokyo is that morning, not the UTC
 * evening before. `timeZone` is only there for tests; null without a time.
 */
export function recordedDay(startedAt: string | null | undefined, locale: string, timeZone?: string): string | null {
  const instant = startedAt ? new Date(startedAt) : null;
  if (!instant || Number.isNaN(instant.getTime())) return null;
  // en-CA writes the calendar day as YYYY-MM-DD, the form formatDate reads.
  const day = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    instant
  );
  return formatDate(day, locale);
}

/** Why the server refused an assignment, when it named a reason this build knows; null for anything else. */
export function refusalOf(error: unknown): TourActivityRefusal | null {
  const code = (error as { response?: { data?: { code?: unknown } } } | null)?.response?.data?.code;
  return TOUR_ACTIVITY_REFUSALS.find((known) => known === code) ?? null;
}
