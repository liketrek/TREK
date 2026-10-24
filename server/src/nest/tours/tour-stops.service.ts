import { badRequest } from '../common/domain-error';
import { HikePlanService } from './hike-plan.service';
import { proposalIdOf } from './tour-change-proposal';
import { TourChangeSaveService } from './tour-change-save.service';
import { tourRevisionConflict } from './tour-revision';
import {
  afterPointOf,
  hikePointsWithStop,
  hikePointsWithout,
  keyBefore,
  keyNear,
  removalRefusal,
  stopPointsOf,
  type StopPoint,
} from './tour-stops.helpers';
import { ToursService } from './tours.service';
import { Injectable } from '@nestjs/common';
import {
  TOUR_STOP_TYPES,
  type HikeStop,
  type TourChange,
  type TourDetailResponse,
  type TourStopInsertRequest,
  type TourStopInsertResult,
  type TourStopRemoveRequest,
  type TourStopRemoveResult,
} from '@trek/shared';

type StopTourType = (typeof TOUR_STOP_TYPES)[number];

/** The tour as an answer names it, from the tour as saved now. */
function tourOf(detail: TourDetailResponse, tourType: StopTourType): TourStopInsertResult['tour'] {
  const { tour } = detail;
  return {
    place_id: tour.place_id,
    name: tour.name,
    tour_type: tourType,
    revision: tour.revision ?? 1,
    distance_km: tour.distance ?? null,
    minutes: tour.duration ?? null,
    route_pending: tour.route_pending === true,
  };
}

/** The type of a tour a stop is taken in or out of here; any other is refused with where to change it. */
function stopTypeOf(detail: TourDetailResponse): StopTourType {
  const type = detail.tour.tour_type;
  if (type === 'hike' || type === 'walk') {
    if (detail.tour.has_waypoints !== true) {
      throw badRequest(
        'This tour is a recorded track without points of its own: a stop would plan it over. Plan it in the planner first.',
      );
    }
    return type;
  }
  throw badRequest('Only a hike or a city walk takes a stop here: change any other tour in the planner.');
}

/**
 * P6: a place taken into a saved hike or city walk as one stop, and the same
 * stop taken out again, which is how the assistant's insert is undone. Where
 * the stop goes is the planner's own rule for a found place (poi-insertion.ts
 * in @trek/shared): after the point named or after the last one before it
 * along the route, never into a leg drawn by hand or a fixed line.
 *
 * Nothing here writes on its own: a hike is saved through update_tour's path
 * (HikePlanService.update: its way planned anew through the points, its
 * stages and the links of its points kept), a city walk through
 * save_tour_change's (TourChangeSaveService.save: one recorded step, the
 * visits of the other stations kept). Both refuse a tour changed since the
 * revision it was read at, and both tell the trip about the change.
 */
@Injectable()
export class TourStopsService {
  constructor(
    private readonly tours: ToursService,
    private readonly hikes: HikePlanService,
    private readonly walkChanges: TourChangeSaveService,
  ) {}

  /** The tour as saved, of a type that takes a stop here, at the revision the request read it at. */
  private async current(tripId: number, placeId: number, expected: number) {
    const detail = await this.tours.getTour(String(tripId), String(placeId));
    const type = stopTypeOf(detail);
    const revision = detail.tour.revision ?? null;
    if (revision !== expected) throw tourRevisionConflict(revision);
    return { detail, type, points: stopPointsOf(detail.waypoints) };
  }

  async insert(userId: number, tripId: number, request: TourStopInsertRequest): Promise<TourStopInsertResult> {
    const { placeId, stop } = request;
    const { detail, type, points } = await this.current(tripId, placeId, request.expected_revision);
    const line = await this.tours.savedLine(tripId, placeId);
    const after = afterPointOf(points, line, stop, request.after_key);
    if (typeof after === 'string') throw badRequest(after);
    const saved =
      type === 'hike'
        ? await this.saveHike(
            userId,
            tripId,
            placeId,
            request.expected_revision,
            hikePointsWithStop(points, after.id, stop),
          )
        : await this.saveWalk(userId, tripId, placeId, request.expected_revision, {
            op: 'add',
            after_key: this.walkKeyOf(after),
            station: {
              lat: stop.lat,
              lng: stop.lng,
              ...(stop.name ? { name: stop.name } : {}),
              ...(stop.opening_hours ? { opening_hours: stop.opening_hours } : {}),
            },
          });
    return {
      tour: tourOf(saved, type),
      stop: {
        key: keyNear(saved.waypoints, stop),
        lat: stop.lat,
        lng: stop.lng,
        name: stop.name ?? null,
        poi_category: stop.poi_category ?? null,
        after_key: after.saved.key ?? null,
        after_name: after.saved.name ?? null,
      },
      before: { distance_km: detail.tour.distance ?? null, minutes: detail.tour.duration ?? null },
    };
  }

  async remove(userId: number, tripId: number, request: TourStopRemoveRequest): Promise<TourStopRemoveResult> {
    const { placeId, key } = request;
    const { type, points } = await this.current(tripId, placeId, request.expected_revision);
    const refusal = removalRefusal(points, key);
    const gone = points.find((point) => point.id === key);
    if (refusal || !gone) throw badRequest(refusal ?? 'This stop is not on the tour.');
    const saved =
      type === 'hike'
        ? await this.saveHike(userId, tripId, placeId, request.expected_revision, hikePointsWithout(points, key))
        : await this.saveWalk(userId, tripId, placeId, request.expected_revision, { op: 'remove', key });
    return {
      tour: tourOf(saved, type),
      removed: {
        key,
        lat: gone.lat,
        lng: gone.lng,
        name: gone.saved.name ?? null,
        poi_category: gone.saved.poi_category ?? null,
        after_key: keyBefore(points, key),
      },
    };
  }

  /** A city walk names the station a stop comes after by its key; a station without one is not named yet. */
  private walkKeyOf(point: StopPoint): string {
    if (!point.saved.key)
      throw badRequest('The stations of this walk have no keys yet: open and save it in the planner.');
    return point.saved.key;
  }

  /** A hike saved through new points, its way planned anew as update_tour plans it. */
  private async saveHike(
    userId: number,
    tripId: number,
    placeId: number,
    expectedRevision: number,
    waypoints: HikeStop[] | null,
  ): Promise<TourDetailResponse> {
    if (!waypoints) throw badRequest('The stop cannot go in there: name another point of the tour.');
    return this.hikes.update(userId, tripId, { placeId, expected_revision: expectedRevision, waypoints });
  }

  /** A city walk saved through one change, as save_tour_change saves a confirmed proposal, then read as it is now. */
  private async saveWalk(
    userId: number,
    tripId: number,
    placeId: number,
    expectedRevision: number,
    change: TourChange,
  ): Promise<TourDetailResponse> {
    const changes = [change];
    const proposalId = proposalIdOf({ tripId, placeId, revision: expectedRevision, changes });
    await this.walkChanges.save(tripId, placeId, userId, {
      changes,
      expected_revision: expectedRevision,
      proposal_id: proposalId,
      confirmed: true,
    });
    return this.tours.getTour(String(tripId), String(placeId));
  }
}
