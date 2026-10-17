import { Places } from '../../db/entities/Places.entity';
import { TourObstacleReviews } from '../../db/entities/TourObstacleReviews.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TOUR_OBSTACLE_SNAPSHOT, TOUR_TRACK_MARKS } from '../../db/json-columns';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import type {
  TourObstacleReviewRow,
  TourObstacleReviewsRepository,
  TourObstacleReviewWrite,
} from '../../db/repositories/TourObstacleReviews.repository';
import type { TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { dbNow } from '../../db/types';
import { decodeJson, encodeJson } from '../../utils/json-column';
import { logWarn } from '../audit/audit-log.logger';
import { DomainError } from '../common/domain-error';
import { toRowId } from '../common/row-id';
import { UnitOfWork } from '../database/unit-of-work';
import type { PaddleCheckEvaluation } from './tour-paddle-check.cache';
import { PaddleDataUnavailableError, storedReviewOf, TourPaddleCheckService } from './tour-paddle-check.service';
import { ToursService } from './tours.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  obstacleEntriesOf,
  obstacleSnapshotOf,
  type PaddleBoatType,
  type TourDetailResponse,
  type TourObstacleReviewsRequest,
} from '@trek/shared';

export const NOT_A_PADDLE_TOUR_MESSAGE = 'Only a paddle tour has an obstacle checklist';
export const PADDLE_DATA_UNAVAILABLE_MESSAGE = 'Obstacle data unavailable';

/**
 * PAD-06: saving what the paddlers decided about the obstacles of a tour.
 * Each decision is stored against the basis the user saw (the route near the
 * obstacle and its data, as the shown entry carried them), so one made on a
 * stale view or offline reads as one to check again rather than holding for
 * a line or data it was never made on. A save never fails over the data: an
 * obstacle no longer among the candidates is skipped, and data that cannot be
 * read is a 503 the client's queue retries. Several changes, and the members
 * of one lock, land in one transaction.
 */
@Injectable()
export class TourObstacleReviewsService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly tours: ToursService,
    private readonly paddleChecks: TourPaddleCheckService,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(TourObstacleReviews) private readonly reviewsRepo: TourObstacleReviewsRepository,
  ) {}

  async save(
    tripId: string,
    placeId: string,
    input: TourObstacleReviewsRequest,
    userId: number,
    socketId?: string,
  ): Promise<TourDetailResponse> {
    const tid = toRowId(tripId);
    const pid = toRowId(placeId);
    if (tid === null || pid === null) throw new NotFoundException('Tour not found');
    const row = await this.toursRepo.findInTrip(tid, pid);
    if (!row) throw new NotFoundException('Tour not found');
    if (row.tour_type !== 'kayak') {
      throw new DomainError(400, NOT_A_PADDLE_TOUR_MESSAGE, {
        code: 'not_a_paddle_tour',
        details: { code: 'not_a_paddle_tour' },
      });
    }
    const evaluation = await this.evaluate(tid, pid, row);

    await this.uow.transactional(async () => {
      const existing = await this.reviewsRepo.listForPlace(pid);
      const { writes, deletes } = this.changesOf(input, existing, evaluation, userId);
      if (writes.length > 0) await this.reviewsRepo.writeMany(pid, writes);
      if (deletes.length > 0) await this.reviewsRepo.deleteKeys(pid, deletes);
    });

    const result = await this.tours.getTour(tripId, placeId);
    this.tours.broadcastToursChanged(tripId, [pid], socketId);
    return result;
  }

  /** The tour's line read against the obstacle data; a tour without a line has nothing to decide about. */
  private async evaluate(
    tid: number,
    pid: number,
    row: { has_waypoints: number; track_marks: string | null; boat_type: string | null },
  ): Promise<PaddleCheckEvaluation | null> {
    const [waypoints, place] = await Promise.all([
      this.waypointsRepo.listForPlace(pid),
      this.placesRepo.findInTrip(pid, tid),
    ]);
    const line = this.paddleChecks.lineOf(
      { has_waypoints: Boolean(row.has_waypoints), track_marks: decodeJson(TOUR_TRACK_MARKS, row.track_marks, 'tour') },
      waypoints,
      place?.route_geometry ?? null,
    );
    if (!line) return null;
    try {
      return await this.paddleChecks.evaluate(line, row.boat_type as PaddleBoatType | null);
    } catch (err) {
      if (!(err instanceof PaddleDataUnavailableError)) throw err;
      logWarn(`[Paddle] obstacle decisions of tour ${pid} wait: ${err.message}`);
      throw new DomainError(503, PADDLE_DATA_UNAVAILABLE_MESSAGE, {
        code: 'paddle_data_unavailable',
        details: { code: 'paddle_data_unavailable' },
      });
    }
  }

  /** What the ops change of the stored decisions: the rows to write and the keys to remove. */
  private changesOf(
    input: TourObstacleReviewsRequest,
    existing: readonly TourObstacleReviewRow[],
    evaluation: PaddleCheckEvaluation | null,
    userId: number,
  ): { writes: TourObstacleReviewWrite[]; deletes: string[] } {
    const stored = new Map(existing.map((row) => [row.obstacle_key, row]));
    const candidates = new Map((evaluation?.candidates ?? []).map((candidate) => [candidate.key, candidate]));
    const entries = evaluation
      ? obstacleEntriesOf({ ...evaluation, reviews: existing.flatMap((row) => storedReviewOf(row) ?? []) })
      : [];
    const writes: TourObstacleReviewWrite[] = [];
    const deletes: string[] = [];
    for (const op of input.ops) {
      const row = stored.get(op.key);
      if (op.op === 'decide') {
        const candidate = candidates.get(op.key);
        if (!candidate || !op.decision || !op.basis) {
          logWarn(`[Paddle] decision about ${op.key} skipped: not on this tour's checklist now`);
          continue;
        }
        const note = op.note || null;
        const same =
          row?.decision === op.decision &&
          row.note === note &&
          row.route_fingerprint === op.basis.route &&
          row.source_fingerprint === op.basis.source;
        if (same) continue;
        writes.push({
          obstacle_key: op.key,
          decision: op.decision,
          note,
          route_fingerprint: op.basis.route,
          source_fingerprint: op.basis.source,
          obstacle_snapshot: encodeJson(TOUR_OBSTACLE_SNAPSHOT, obstacleSnapshotOf(candidate)),
          decided_at: dbNow(),
          decided_by: userId,
        });
      } else if (op.op === 'note') {
        // A note changes neither the decision nor when it was made.
        if (row) writes.push({ ...withoutPlace(row), note: op.note || null });
      } else if (op.op === 'clear') {
        if (row) deletes.push(op.key);
      } else if (row && entries.some((entry) => entry.key === op.key && entry.status === 'gone')) {
        // Kept on purpose although the data no longer holds the object: it reads as kept, not as to check.
        writes.push({ ...withoutPlace(row), source_fingerprint: 'gone', decided_at: dbNow(), decided_by: userId });
      }
    }
    return { writes, deletes };
  }
}

function withoutPlace(row: TourObstacleReviewRow): TourObstacleReviewWrite {
  const { place_id: _place, ...write } = row;
  return write;
}
