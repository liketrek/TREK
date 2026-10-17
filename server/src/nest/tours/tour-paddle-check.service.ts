import { TourObstacleReviews, TourObstacleReviewsDecision } from '../../db/entities/TourObstacleReviews.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TOUR_OBSTACLE_SNAPSHOT } from '../../db/json-columns';
import type {
  TourObstacleReviewRow,
  TourObstacleReviewsRepository,
} from '../../db/repositories/TourObstacleReviews.repository';
import type { TourWaypointRow, TourWaypointsRepository } from '../../db/repositories/TourWaypoints.repository';
import type { ToursRepository } from '../../db/repositories/Tours.repository';
import { utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { logWarn } from '../audit/audit-log.logger';
import { PaddleObstaclesService } from '../paddle-obstacles/paddle-obstacles.service';
import { PaddleCheckCache, type PaddleCheckEvaluation } from './tour-paddle-check.cache';
import { parseRouteGeometry, shortHash } from './tours.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import {
  compareCodeUnits,
  obstacleCandidatesOf,
  obstacleEntriesOf,
  ownEntriesOf,
  PADDLE_CHECK_MAX_ENTRIES,
  PADDLE_CHECK_MAX_OWN,
  PADDLE_CHECK_VERSION,
  paddleCheckLineOfPoints,
  paddleCheckLineOfTrack,
  paddleCheckSummaryOf,
  paddleObstacleKeyOf,
  type PaddleBoatType,
  type PaddleCheck,
  type PaddleCheckLine,
  type StoredObstacleReview,
  type TourListItem,
  type TourObstacleCheck,
  type TourObstacleEntry,
} from '@trek/shared';

/** The obstacle data could not be read: a checklist cannot be judged now, and a decision waits to be retried. */
export class PaddleDataUnavailableError extends Error {
  constructor(cause: unknown) {
    super(`Obstacle data unavailable: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = 'PaddleDataUnavailableError';
  }
}

const DECISIONS = new Set<string>(Object.values(TourObstacleReviewsDecision));

/** One stored row as the checklist reads it; a row whose decision or snapshot does not read is left out, and said so. */
export function storedReviewOf(row: TourObstacleReviewRow): StoredObstacleReview | null {
  const snapshot = decodeJson(TOUR_OBSTACLE_SNAPSHOT, row.obstacle_snapshot, `tour ${row.place_id}`);
  if (!snapshot || !DECISIONS.has(row.decision)) {
    logWarn(`[Paddle] obstacle decision ${row.place_id}/${row.obstacle_key} does not read; left out`);
    return null;
  }
  return {
    obstacle_key: row.obstacle_key,
    decision: row.decision,
    note: row.note,
    route_fingerprint: row.route_fingerprint,
    source_fingerprint: row.source_fingerprint,
    snapshot,
    decided_at: utcSuffix(row.decided_at) ?? row.decided_at,
    decided_by: row.decided_by,
  };
}

function oldest(values: ReadonlyArray<string | null>): string | null {
  return values.filter((value): value is string => !!value).sort(compareCodeUnits)[0] ?? null;
}

const UNAVAILABLE = { data: 'unavailable', data_as_of: null, read_at: null } as const;

/**
 * PAD-06 and PAD-09 on the server: a paddle tour's checklist and its check
 * bench, worked out of the obstacle data along its line and the decisions
 * stored for it. The tours list carries the bench of every paddle tour, the
 * detail the whole checklist. A hike costs nothing here; a paddle tour's
 * reading is cached under the line, the boat and the data's version.
 */
@Injectable()
export class TourPaddleCheckService {
  constructor(
    private readonly obstacles: PaddleObstaclesService,
    private readonly cache: PaddleCheckCache,
    @InjectRepository(Tours) private readonly toursRepo: ToursRepository,
    @InjectRepository(TourWaypoints) private readonly waypointsRepo: TourWaypointsRepository,
    @InjectRepository(TourObstacleReviews) private readonly reviewsRepo: TourObstacleReviewsRepository,
  ) {}

  /** A planned tour's line from its control points, a recorded track's from its line and the marks laid onto it. */
  lineOf(
    item: Pick<TourListItem, 'has_waypoints' | 'track_marks'>,
    waypoints: readonly TourWaypointRow[],
    routeGeometry: string | null,
  ): PaddleCheckLine | null {
    return item.has_waypoints
      ? paddleCheckLineOfPoints(waypoints)
      : paddleCheckLineOfTrack(parseRouteGeometry(routeGeometry), item.track_marks);
  }

  /**
   * The obstacle data along a line made into candidates and the paddler's own
   * entries. Throws PaddleDataUnavailableError when the data cannot be read.
   * A reading is kept only when the data's version is the same after the read
   * as before it, so a region import landing meanwhile is never cached.
   */
  async evaluate(line: PaddleCheckLine, boat: PaddleBoatType | null): Promise<PaddleCheckEvaluation> {
    try {
      const version = await this.obstacles.dataVersion();
      this.cache.atVersion(version);
      const key = `${PADDLE_CHECK_VERSION}|${shortHash(JSON.stringify([line.points, line.portages, line.locks]))}|${boat ?? ''}`;
      const hit = this.cache.get(key, line);
      if (hit) return hit;
      const along = await this.obstacles.readAlong(line.points);
      const candidates = obstacleCandidatesOf({
        line,
        features: along.features,
        regions: along.regions,
        boat,
        hash: shortHash,
      });
      const own = ownEntriesOf({ line, candidates, features: along.features, boat });
      const limited = along.truncated || candidates.length > PADDLE_CHECK_MAX_ENTRIES;
      const evaluation: PaddleCheckEvaluation = {
        line,
        candidates,
        own,
        dataKeys: new Set(along.features.map((feature) => paddleObstacleKeyOf(feature))),
        complete: along.coverage === 'covered' && !limited,
        data: {
          data: along.coverage === 'none' ? 'none' : limited ? 'limited' : along.coverage,
          data_as_of: oldest(along.regions.map((region) => region.source_timestamp)),
          read_at: oldest(along.regions.map((region) => region.imported_at)),
        },
      };
      if ((await this.obstacles.dataVersion()) === version) this.cache.set(key, evaluation);
      return evaluation;
    } catch (err) {
      throw new PaddleDataUnavailableError(err);
    }
  }

  /** The checklist of one line with its decisions laid over it, and the bench it sums up to. */
  async checkOf(
    line: PaddleCheckLine,
    boat: PaddleBoatType | null,
    reviews: readonly StoredObstacleReview[],
  ): Promise<{ entries: TourObstacleEntry[]; own: TourObstacleCheck['own']; check: PaddleCheck }> {
    let entries: TourObstacleEntry[];
    let own: TourObstacleCheck['own'];
    let data: Pick<PaddleCheck, 'data' | 'data_as_of' | 'read_at'>;
    try {
      const evaluation = await this.evaluate(line, boat);
      entries = obstacleEntriesOf({ ...evaluation, reviews });
      own = evaluation.own;
      data = evaluation.data;
    } catch (err) {
      logWarn(`[Paddle] checklist without data: ${err instanceof Error ? err.message : String(err)}`);
      // Without the data every decision stays visible, as one TREK cannot compare now.
      entries = obstacleEntriesOf({ candidates: [], reviews, dataKeys: new Set(), complete: false, line });
      own = [];
      data = UNAVAILABLE;
    }
    // The checklist carries as many entries and own portages and locks as its contract holds; a list cut
    // short says so, since what it left out (a ban, a vanished object) no longer counts on the bench.
    const cut = entries.length > PADDLE_CHECK_MAX_ENTRIES || own.length > PADDLE_CHECK_MAX_OWN;
    entries = entries.slice(0, PADDLE_CHECK_MAX_ENTRIES);
    own = own.slice(0, PADDLE_CHECK_MAX_OWN);
    if (cut && (data.data === 'covered' || data.data === 'partial')) data = { ...data, data: 'limited' };
    const summary = paddleCheckSummaryOf(entries, own, data);
    return { entries, own, check: { ...summary, revision: shortHash(JSON.stringify({ entries, own, data })) } };
  }

  /**
   * The tours list with the bench of every paddle tour; hikes go through
   * untouched, and a trip without paddle tours asks nothing. A tour whose
   * check fails reads as unavailable; the list itself never fails over it.
   */
  async forTrip(tripId: number, items: TourListItem[]): Promise<TourListItem[]> {
    if (!items.some((item) => item.tour_type === 'kayak')) return items;
    const [lines, waypoints, rows] = await Promise.all([
      this.toursRepo.listPaddleLinesForTrip(tripId),
      this.waypointsRepo.listForTrip(tripId),
      this.reviewsRepo.listForTrip(tripId),
    ]);
    const geometry = new Map(lines.map((line) => [line.place_id, line.route_geometry]));
    return await Promise.all(
      items.map(async (item) => {
        if (item.tour_type !== 'kayak') return item;
        const line = this.lineOf(
          item,
          waypoints.filter((point) => point.place_id === item.place_id),
          geometry.get(item.place_id) ?? null,
        );
        if (!line) return { ...item, paddle_check: null };
        const reviews = rows
          .filter((row) => row.place_id === item.place_id)
          .flatMap((row) => storedReviewOf(row) ?? []);
        const { check } = await this.checkOf(line, item.boat_type ?? null, reviews);
        return { ...item, paddle_check: check };
      }),
    );
  }

  /** One paddle tour with its bench and its whole checklist; any other tour as it is. */
  async forTour(
    item: TourListItem,
    waypoints: readonly TourWaypointRow[],
    routeGeometry: string | null,
  ): Promise<{ item: TourListItem; obstacle_check?: TourObstacleCheck }> {
    if (item.tour_type !== 'kayak') return { item };
    const line = this.lineOf(item, waypoints, routeGeometry);
    if (!line) return { item: { ...item, paddle_check: null } };
    const reviews = (await this.reviewsRepo.listForPlace(item.place_id)).flatMap((row) => storedReviewOf(row) ?? []);
    const { entries, own, check } = await this.checkOf(line, item.boat_type ?? null, reviews);
    return {
      item: { ...item, paddle_check: check },
      obstacle_check: { revision: check.revision, evaluated_at: new Date().toISOString(), entries, own },
    };
  }
}
