import { Places } from '../../db/entities/Places.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TOUR_TRACK_MARKS } from '../../db/json-columns';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { encodeJson } from '../../utils/json-column';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import { PlacesService } from '../places/places.service';
import { advanceTourRevision } from './tour-revision';
import { computeTourMetrics, parseRouteGeometry } from './tours.helpers';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  estimatePaddleTime,
  paddleLayoutOfTrack,
  paddleMovingSeconds,
  recommendedPaddleSpeedKmh,
  type PaddleBoatType,
  type TourDetailResponse,
  type TourPaddlePlanRequest,
} from '@trek/shared';

/** A mark may sit this far past the end of the track it was laid on, for rounding along the line. */
const TRACK_END_TOLERANCE_M = 1;

/**
 * PAD-03 and PAD-07 for a recorded track: a GPX import keeps the line it was
 * recorded with, so its portages and locks are laid onto it as distances
 * rather than drawn into it, and nothing redraws the track. A planned tour
 * carries the same plan in its legs and control points and saves it with its
 * route; this service is for the tracks only.
 *
 * The moving time the plan makes is stored as the tour's duration, reckoned
 * with the one estimate the planner and the detail view show.
 */
@Injectable()
export class TourPaddlePlanService {
  private readonly logger = new Logger(TourPaddlePlanService.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly places: PlacesService,
    private readonly tours: ToursService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
  ) {}

  async update(
    tripId: string,
    placeId: string,
    input: TourPaddlePlanRequest,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');

    await this.uow.transactional(async () => {
      const row = await this.toursRepo.findInTrip(tid, pid);
      if (!row) throw new NotFoundException('Tour not found');
      if (row.tour_type !== 'kayak') {
        throw new DomainError(400, 'Only a paddle tour has a paddle plan', {
          code: 'not_a_paddle_tour',
          details: { code: 'not_a_paddle_tour' },
        });
      }
      if (row.has_waypoints) {
        throw new DomainError(400, 'A planned tour saves its portages and locks with its route', {
          code: 'planned_tour',
          details: { code: 'planned_tour' },
        });
      }
      const place = await this.placesRepo.findInTrip(pid, tid);
      const totalM = computeTourMetrics(parseRouteGeometry(place?.route_geometry)).distanceKm * 1000;
      const marks = input.track_marks;
      const beyond = [...marks.portages.map((mark) => mark.to_m), ...marks.locks.map((lock) => lock.at_m)].some(
        (at) => at > totalM + TRACK_END_TOLERANCE_M,
      );
      if (beyond)
        throw new DomainError(400, 'A mark lies beyond the end of the track', {
          code: 'mark_beyond_track',
          details: { code: 'mark_beyond_track' },
        });

      const estimate = estimatePaddleTime(paddleLayoutOfTrack(totalM, marks), {
        paddleSpeedKmh: input.paddle_speed_kmh ?? recommendedPaddleSpeedKmh(row.boat_type as PaddleBoatType | null),
        portageSpeedKmh: input.portage_speed_kmh,
        breakMinutes: null,
      });
      const moving = paddleMovingSeconds(estimate);
      const empty = marks.portages.length === 0 && marks.locks.length === 0;
      await advanceTourRevision(this.toursRepo, pid, input.expected_revision);
      await this.toursRepo.updatePaddlePlanInTrip(tid, pid, {
        paddle_speed_kmh: input.paddle_speed_kmh,
        portage_speed_kmh: input.portage_speed_kmh,
        track_marks: empty ? null : encodeJson(TOUR_TRACK_MARKS, marks),
        duration: moving === null ? null : Math.round(moving / 60),
      });
    });

    const result = await this.tours.getTour(tripId, placeId);
    try {
      this.places.broadcast(tripId, 'tours:changed', { placeIds: [pid] }, socketId);
    } catch {
      this.logger.warn(`Committed paddle plan of tour ${placeId}: realtime invalidation failed`);
    }
    return result;
  }
}
