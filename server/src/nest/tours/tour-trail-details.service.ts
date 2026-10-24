import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { RoadtripRouterService, type TracedWay } from '../roadtrip/roadtrip-router.service';
import { gradableWayIds } from './hike-routing.helpers';
import { trailDetailsOf, type TrailDetails } from './tour-trail-details.helpers';
import { TourTrailGradeService } from './tour-trail-grade.service';
import { computeTourMetrics } from './tours.helpers';
import { ToursService } from './tours.service';
import { Injectable } from '@nestjs/common';
import { TOUR_TRAIL_GRADE_MAX_WAYS, type TourTrailGrade } from '@trek/shared';

/** The refusal of a tour without a saved line to read the ways under. */
const TOUR_TRAIL_NO_LINE = 'tour_trail_no_line';
/** The refusal while the router or the OpenStreetMap data cannot be asked. */
const TOUR_TRAIL_UNAVAILABLE = 'tour_trail_unavailable';

/** What get_tour_trail_details answers: the tour it read, and what its ways carry. */
interface TourTrailDetailsAnswer extends TrailDetails {
  place_id: number;
  tour_type: string;
  /** Ways the data could not be asked about this time: their values are unknown, not absent. */
  ways_unanswered: number;
  /** The line ran over more ways than one question names; the rest were not read. */
  truncated: boolean;
}

function reasonOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * BIK-05, MAP-03 and MAP-04 for a saved tour: the ways under its saved line,
 * as the router describes it (the planner's own description of a draft), and
 * what OpenStreetMap records for them, through the trail grades the planner's
 * POST /api/trips/:tripId/tours/trail-grades reads. A read: nothing about
 * the tour changes. A tour saved with its points only has no line to read.
 */
@Injectable()
export class TourTrailDetailsService {
  constructor(
    private readonly tours: ToursService,
    private readonly router: RoadtripRouterService,
    private readonly trailGrades: TourTrailGradeService,
  ) {}

  async details(userId: number, tripId: number, placeId: number): Promise<TourTrailDetailsAnswer> {
    const { tour } = await this.tours.getTour(String(tripId), String(placeId));
    const line = await this.tours.savedLine(tripId, placeId);
    if (line.length < 2) {
      throw new DomainError(422, 'This tour has no saved line yet: open it in the planner to plan its way first.', {
        code: TOUR_TRAIL_NO_LINE,
      });
    }
    const flat = line.map(([lat, lng]): [number, number] => [lat, lng]);
    let ways: TracedWay[];
    try {
      ways = await this.router.wayIds(userId, flat);
    } catch (err: unknown) {
      logWarn(`[Tours] no ways under tour ${placeId}: ${reasonOf(err)}`);
      throw new DomainError(503, 'The ways under this tour cannot be read right now: ask again later.', {
        code: TOUR_TRAIL_UNAVAILABLE,
      });
    }
    const ids = gradableWayIds(ways, TOUR_TRAIL_GRADE_MAX_WAYS);
    const answer = ids.length > 0 ? await this.trailGrades.grades({ way_ids: ids }) : { ways: [], unanswered: [] };
    const grades = new Map<number, TourTrailGrade>(answer.ways.map((way) => [way.id, way]));
    const lengthM = computeTourMetrics(line).distanceKm * 1000;
    const distinct = new Set(ways.flatMap((way) => (way.wayId === null ? [] : [way.wayId])));
    return {
      place_id: tour.place_id,
      tour_type: tour.tour_type,
      ...trailDetailsOf(ways, grades, lengthM),
      ways_unanswered: answer.unanswered.length,
      truncated: distinct.size > ids.length,
    };
  }
}
