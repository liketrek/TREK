/**
 * PAD-06 and PAD-09 on the server, from the container over a snapshot db: a
 * paddle tour's checklist in its detail and its check bench in the tours
 * list, the cached reading of the obstacle data, the checklist while the data
 * cannot be read, and saving decisions bound to the basis the user saw.
 */
import { PaddleFeatures } from '../../../src/db/entities/PaddleFeatures.entity';
import { PaddleRegions } from '../../../src/db/entities/PaddleRegions.entity';
import { TourObstacleReviews } from '../../../src/db/entities/TourObstacleReviews.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { PaddleObstaclesService } from '../../../src/nest/paddle-obstacles/paddle-obstacles.service';
import {
  NOT_A_PADDLE_TOUR_MESSAGE,
  PADDLE_DATA_UNAVAILABLE_MESSAGE,
  TourObstacleReviewsService,
} from '../../../src/nest/tours/tour-obstacle-reviews.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { deleteRows, findRow, findRows, insertRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  PADDLE_CHECK_MAX_ENTRIES,
  tourDetailResponseSchema,
  tourListItemSchema,
  type ObstacleDecision,
  type ObstacleReviewOp,
  type TourDetailResponse,
  type TourObstacleEntry,
} from '@trek/shared';

import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const log = vi.hoisted(() => ({ logInfo: vi.fn(), logWarn: vi.fn(), logError: vi.fn(), logDebug: vi.fn() }));
vi.mock('../../../src/nest/audit/audit-log.logger', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/nest/audit/audit-log.logger')>()),
  ...log,
}));

const db = createSnapshotTestDb();
let t: TestModule | undefined;
let tours: ToursService;
let reviews: TourObstacleReviewsService;
let obstacles: PaddleObstaclesService;
const orm = () => {
  if (!t) throw new Error('No container booted');
  return t.get(MikroORM);
};

beforeEach(async () => {
  resetTestDb(db);
  await t?.close();
  // A container per test: the readings it caches belong to the data of one test.
  t = await createTestModule({ db, imports: [ToursModule] });
  tours = t.get(ToursService);
  reviews = t.get(TourObstacleReviewsService);
  obstacles = t.get(PaddleObstaclesService);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

afterAll(async () => {
  await t?.close();
  db.close();
});

async function region(id = 'oberpfalz') {
  await insertRow(orm(), PaddleRegions, {
    id,
    name: 'Oberpfalz',
    boundary: null,
    min_lat: 48.9,
    min_lng: 11.5,
    max_lat: 50,
    max_lng: 13,
    status: 'ready',
    feature_count: 1,
    source_timestamp: '2026-10-01T00:00:00.000Z',
    imported_at: '2026-10-02 04:20:00',
  });
}

function weir(ref: string, lat: number, lng: number, tags: Record<string, string> = {}) {
  return {
    region: 'oberpfalz',
    osm_ref: ref,
    kind: 'weir',
    group_key: null,
    name: 'Wehr Regendorf',
    geometry: JSON.stringify({ type: 'Point', coordinates: [lng, lat] }),
    tags: JSON.stringify({ waterway: 'weir', name: 'Wehr Regendorf', ...tags }),
    tag_hash: `hash-${ref}`,
    min_lat: lat,
    min_lng: lng,
    max_lat: lat,
    max_lng: lng,
  };
}

/** A trip with a paddle tour east along 49.2 north, a weir in its middle, and a hike. */
async function fixture(options: { boat?: 'kayak' | 'sup' } = {}) {
  const { user } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const paddle = await makePlace(orm(), trip.id, {
    name: 'Regen',
    lat: 49.2,
    lng: 12,
    route_geometry: JSON.stringify([
      [49.2, 12.0],
      [49.2, 12.01],
    ]),
  });
  await makeTour(orm(), paddle.id, { tourTypeRef: 'kayak', boat_type: options.boat ?? 'kayak' });
  await addTourWaypoints(orm(), paddle.id, [
    { lat: 49.2, lng: 12.0 },
    { lat: 49.2, lng: 12.01 },
  ]);
  const hike = await makePlace(orm(), trip.id, { name: 'Ridge', lat: 47, lng: 11 });
  await makeTour(orm(), hike.id);
  await addTourWaypoints(orm(), hike.id, [
    { lat: 47, lng: 11 },
    { lat: 47.01, lng: 11.01 },
  ]);
  return { user, trip, paddle, hike };
}

async function detail(tripId: number, placeId: number): Promise<TourDetailResponse> {
  const read = await tours.getTour(String(tripId), String(placeId));
  expect(tourDetailResponseSchema.safeParse(read).success).toBe(true);
  return read;
}

function decide(entry: Pick<TourObstacleEntry, 'key' | 'basis'>, decision: ObstacleDecision): ObstacleReviewOp {
  return { key: entry.key, op: 'decide', decision, note: null, basis: entry.basis ?? null };
}

describe('TourPaddleCheckService: the checklist and the bench', () => {
  it('TPC-001: a paddle tour past a weir lists it as open, with the basis a decision would be bound to', async () => {
    const { trip, paddle } = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);

    const read = await detail(trip.id, paddle.id);
    expect(read.tour.paddle_check).toMatchObject({
      data: 'covered',
      data_as_of: '2026-10-01T00:00:00.000Z',
      entries: 1,
      open: 1,
      review: 0,
      decided: 0,
      bans: 0,
      own: 0,
    });
    expect(read.obstacle_check?.entries).toEqual([
      expect.objectContaining({
        key: 'node/1',
        kind: 'weir',
        name: 'Wehr Regendorf',
        relation: 'on_route',
        status: 'open',
        decision: null,
        basis: { route: expect.stringMatching(/^p1:o:/), source: expect.stringMatching(/^s1:/) },
      }),
    ]);
    expect(read.obstacle_check?.revision).toBe(read.tour.paddle_check?.revision);
  });

  it('TPC-002: the list carries the bench of every paddle tour and leaves hikes and lineless tours alone', async () => {
    const { trip, paddle, hike } = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);
    const lineless = await makePlace(orm(), trip.id, { name: 'No line' });
    await makeTour(orm(), lineless.id, { tourTypeRef: 'kayak' });

    const list = await tours.listTours(String(trip.id));
    for (const item of list) expect(tourListItemSchema.safeParse(item).success).toBe(true);
    const byId = new Map(list.map((item) => [item.place_id, item]));
    expect(byId.get(paddle.id)?.paddle_check).toMatchObject({ data: 'covered', open: 1 });
    expect(byId.get(hike.id)).not.toHaveProperty('paddle_check');
    expect(byId.get(lineless.id)?.paddle_check).toBeNull();
  });

  it('TPC-003: a trip without paddle tours reads no obstacle data at all', async () => {
    const { user } = await makeUser(orm());
    const trip = await makeTrip(orm(), user.id);
    const hike = await makePlace(orm(), trip.id, { name: 'Ridge' });
    await makeTour(orm(), hike.id);
    const along = vi.spyOn(obstacles, 'readAlong');
    const version = vi.spyOn(obstacles, 'dataVersion');

    expect(await tours.listTours(String(trip.id))).toHaveLength(1);
    expect(along).not.toHaveBeenCalled();
    expect(version).not.toHaveBeenCalled();
  });

  it('TPC-004: reads the data along a line once, and again once the data changed', async () => {
    const { trip, paddle } = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);
    const along = vi.spyOn(obstacles, 'readAlong');

    await detail(trip.id, paddle.id);
    await tours.listTours(String(trip.id));
    expect(along).toHaveBeenCalledTimes(1);

    await insertRows(orm(), PaddleFeatures, [weir('node/2', 49.2, 12.008)]);
    const read = await detail(trip.id, paddle.id);
    expect(along).toHaveBeenCalledTimes(2);
    expect(read.tour.paddle_check?.open).toBe(2);
  });

  it('TPC-005: a reading during which the data changed is not kept', async () => {
    const { trip, paddle } = await fixture();
    await region();
    const along = vi.spyOn(obstacles, 'readAlong');
    vi.spyOn(obstacles, 'dataVersion').mockResolvedValueOnce('before').mockResolvedValue('after');

    await detail(trip.id, paddle.id);
    await detail(trip.id, paddle.id);
    expect(along).toHaveBeenCalledTimes(2);
  });

  it('TPC-006: data the line leaves, or no data at all, reads as partly covered or not covered', async () => {
    const { trip, paddle } = await fixture();
    expect((await detail(trip.id, paddle.id)).tour.paddle_check).toMatchObject({ data: 'none', entries: 0 });

    await insertRow(orm(), PaddleRegions, {
      id: 'west',
      name: 'West',
      boundary: null,
      min_lat: 49,
      min_lng: 11.9,
      max_lat: 49.5,
      max_lng: 12.005,
      status: 'ready',
      feature_count: 0,
      source_timestamp: '2026-09-01T00:00:00.000Z',
      imported_at: '2026-09-02 04:20:00',
    });
    expect((await detail(trip.id, paddle.id)).tour.paddle_check).toMatchObject({
      data: 'partial',
      data_as_of: '2026-09-01T00:00:00.000Z',
    });
  });

  it('TPC-007: while the data cannot be read the checklist says so, and a stored decision stays as one it cannot compare', async () => {
    const { user, trip, paddle } = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);
    const [entry] = (await detail(trip.id, paddle.id)).obstacle_check?.entries ?? [];
    if (!entry) throw new Error('no entry');
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);

    vi.spyOn(obstacles, 'readAlong').mockRejectedValue(new Error('disk gone'));
    await insertRows(orm(), PaddleFeatures, [weir('node/2', 49.2, 12.008)]);
    const read = await detail(trip.id, paddle.id);
    expect(read.tour.paddle_check).toMatchObject({ data: 'unavailable', data_as_of: null, read_at: null, entries: 0 });
    expect(read.obstacle_check?.entries).toEqual([
      expect.objectContaining({ key: 'node/1', status: 'unknown', relation: null, basis: null }),
    ]);
    expect(log.logWarn).toHaveBeenCalledWith(expect.stringContaining('checklist without data'));
  });

  it('TPC-008: a stored decision that does not read is left out and said so', async () => {
    const { user, trip, paddle } = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);
    await insertRow(orm(), TourObstacleReviews, {
      place: paddle.id,
      obstacle_key: 'node/1',
      decision: 'pass',
      note: null,
      route_fingerprint: 'p1:o:_',
      source_fingerprint: 'gone',
      obstacle_snapshot: '{"broken":',
      decided_at: '2026-10-03 10:00:00',
      decided_by: user.id,
    });

    const read = await detail(trip.id, paddle.id);
    expect(read.obstacle_check?.entries).toEqual([expect.objectContaining({ key: 'node/1', status: 'open' })]);
    expect(log.logWarn).toHaveBeenCalledWith(expect.stringContaining(`${paddle.id}/node/1 does not read`));
  });

  it('TPC-009: a hike carries no checklist', async () => {
    const { trip, hike } = await fixture();
    const read = await detail(trip.id, hike.id);
    expect(read).not.toHaveProperty('obstacle_check');
    expect(read.tour).not.toHaveProperty('paddle_check');
  });

  it('TPC-010: an area holding more obstacles than a checklist carries reads as cut short', async () => {
    const { trip, paddle } = await fixture();
    await region();
    await insertRows(
      orm(),
      PaddleFeatures,
      Array.from({ length: PADDLE_CHECK_MAX_ENTRIES + 1 }, (_, i) =>
        weir(`node/${i + 1}`, 49.2, 12.0001 + i * 0.00003),
      ),
    );
    const read = await detail(trip.id, paddle.id);
    expect(read.tour.paddle_check).toMatchObject({ data: 'limited', entries: PADDLE_CHECK_MAX_ENTRIES });
    expect(read.obstacle_check?.entries).toHaveLength(PADDLE_CHECK_MAX_ENTRIES);
  });

  it('TPC-011: a checklist cut short by an earlier decision past its cap says so too', async () => {
    const { user, trip, paddle } = await fixture();
    await region();
    await insertRows(
      orm(),
      PaddleFeatures,
      Array.from({ length: PADDLE_CHECK_MAX_ENTRIES }, (_, i) => weir(`node/${i + 1}`, 49.2, 12.0001 + i * 0.00003)),
    );
    const snapshot = {
      v: 1,
      kind: 'weir',
      name: null,
      refs: ['node/999'],
      at: [49.2, 12.009],
      bounds: [
        [49.2, 12.009],
        [49.2, 12.009],
      ],
      relation: 'on_route',
      along_m: 650,
      region_id: 'oberpfalz',
      data_as_of: null,
    };
    await insertRow(orm(), TourObstacleReviews, {
      place: paddle.id,
      obstacle_key: 'node/999',
      decision: 'pass',
      note: null,
      route_fingerprint: 'p1:o:_',
      source_fingerprint: 's1:0123456789abcdef:4920000,1200900',
      obstacle_snapshot: JSON.stringify(snapshot),
      decided_at: '2026-10-03 10:00:00',
      decided_by: user.id,
    });
    const read = await detail(trip.id, paddle.id);
    expect(read.tour.paddle_check).toMatchObject({ data: 'limited' });
    expect(read.obstacle_check?.entries).toHaveLength(PADDLE_CHECK_MAX_ENTRIES);
  });
});

describe('TourObstacleReviewsService.save', () => {
  async function decidedFixture() {
    const setup = await fixture();
    await region();
    await insertRows(orm(), PaddleFeatures, [weir('node/1', 49.2, 12.005)]);
    const [entry] = (await detail(setup.trip.id, setup.paddle.id)).obstacle_check?.entries ?? [];
    if (!entry) throw new Error('no entry');
    return { ...setup, entry };
  }

  const stored = (placeId: number) => findRow(orm(), TourObstacleReviews, { place: placeId, obstacle_key: 'node/1' });

  it('TOR-001: stores a decision with its basis and what it was about, and answers the detail with it', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    const read = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [decide(entry, 'pass')] },
      user.id,
      'sock',
    );

    expect(read.obstacle_check?.entries[0]).toMatchObject({
      key: 'node/1',
      status: 'decided',
      decision: { decision: 'pass', note: null, decided_by: user.id, decided_at: expect.stringMatching(/Z$/) },
    });
    expect(read.tour.paddle_check).toMatchObject({ open: 0, decided: 1 });
    const row = await stored(paddle.id);
    expect(row).toMatchObject({ route_fingerprint: entry.basis?.route, source_fingerprint: entry.basis?.source });
    expect(JSON.parse(String(row?.obstacle_snapshot))).toMatchObject({ v: 1, kind: 'weir', refs: ['node/1'] });
    expect(t?.realtime.broadcastMock).toHaveBeenCalledWith(
      String(trip.id),
      'tours:changed',
      { placeIds: [paddle.id] },
      'sock',
    );
  });

  it('TOR-002: a portage decided without a portage drawn stays to do, a reroute while the route still passes too', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    const portage = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [decide(entry, 'portage')] },
      user.id,
    );
    expect(portage.obstacle_check?.entries[0]?.status).toBe('todo');
    const reroute = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [decide(entry, 'reroute')] },
      user.id,
    );
    expect(reroute.obstacle_check?.entries[0]?.status).toBe('todo');
    expect(reroute.tour.paddle_check?.open).toBe(1);
  });

  it('TOR-003: the same decision again changes nothing, a note changes only the note, clear removes it', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);
    await updateRows(orm(), TourObstacleReviews, { place: paddle.id }, { decided_at: '2026-10-03 10:00:00' });

    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);
    expect((await stored(paddle.id))?.decided_at).toBe('2026-10-03 10:00:00');

    await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ key: 'node/1', op: 'note', decision: null, note: 'Rechts umtragen', basis: null }] },
      user.id,
    );
    expect(await stored(paddle.id)).toMatchObject({ note: 'Rechts umtragen', decided_at: '2026-10-03 10:00:00' });

    const cleared = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ key: 'node/1', op: 'clear', decision: null, note: null, basis: null }] },
      user.id,
    );
    expect(await stored(paddle.id)).toBeNull();
    expect(cleared.obstacle_check?.entries[0]?.status).toBe('open');
  });

  it('TOR-004: a decision made on another route near the obstacle reads as one to check again', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    const stale = { route: entry.basis?.route.replace(/^p1:o:/, 'p1:n:') ?? '', source: entry.basis?.source ?? '' };
    const read = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ key: 'node/1', op: 'decide', decision: 'pass', note: null, basis: stale }] },
      user.id,
    );
    expect(read.obstacle_check?.entries[0]).toMatchObject({ status: 'review', changed: ['route'] });
    expect(read.tour.paddle_check?.review).toBe(1);
  });

  it('TOR-005: a decision about an object not on the checklist now is skipped, and said so', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ ...decide(entry, 'pass'), key: 'node/99' }] },
      user.id,
    );
    expect(await findRows(orm(), TourObstacleReviews, { place: paddle.id })).toEqual([]);
    expect(log.logWarn).toHaveBeenCalledWith(expect.stringContaining('node/99 skipped'));
  });

  it('TOR-006: an object the complete data no longer holds reads as gone, and kept once the decision is kept', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);
    // The region read again: the weir has moved out of reach of the route.
    await deleteRows(orm(), PaddleFeatures, { osm_ref: 'node/1' });
    await insertRows(orm(), PaddleFeatures, [weir('node/2', 49.6, 12.005)]);
    await updateRows(orm(), PaddleRegions, { id: 'oberpfalz' }, { imported_at: '2026-10-05 04:20:00' });

    const gone = await detail(trip.id, paddle.id);
    expect(gone.obstacle_check?.entries).toEqual([expect.objectContaining({ key: 'node/1', status: 'gone' })]);
    expect(gone.tour.paddle_check).toMatchObject({ review: 1, entries: 0 });

    const kept = await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ key: 'node/1', op: 'keep', decision: null, note: null, basis: null }] },
      user.id,
    );
    expect(kept.obstacle_check?.entries).toEqual([expect.objectContaining({ key: 'node/1', status: 'kept' })]);
    expect((await stored(paddle.id))?.source_fingerprint).toBe('gone');
  });

  it('TOR-007: keeping a decision about an object still there changes nothing', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);
    await reviews.save(
      String(trip.id),
      String(paddle.id),
      { ops: [{ key: 'node/1', op: 'keep', decision: null, note: null, basis: null }] },
      user.id,
    );
    expect((await stored(paddle.id))?.source_fingerprint).toBe(entry.basis?.source);
  });

  it('TOR-008: a hike has no checklist to save to, an unknown tour is not found', async () => {
    const { user, trip, hike, entry } = await decidedFixture();
    const refusal = reviews.save(String(trip.id), String(hike.id), { ops: [decide(entry, 'pass')] }, user.id);
    await expect(refusal).rejects.toBeInstanceOf(DomainError);
    await expect(refusal).rejects.toMatchObject({ status: 400, message: NOT_A_PADDLE_TOUR_MESSAGE });
    await expect(reviews.save(String(trip.id), '999999', { ops: [decide(entry, 'pass')] }, user.id)).rejects.toThrow(
      'Tour not found',
    );
    await expect(reviews.save('x', String(hike.id), { ops: [decide(entry, 'pass')] }, user.id)).rejects.toThrow(
      'Tour not found',
    );
  });

  it('TOR-009: while the obstacle data cannot be read a decision waits with a 503 and nothing is stored', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await insertRows(orm(), PaddleFeatures, [weir('node/2', 49.2, 12.008)]);
    vi.spyOn(obstacles, 'readAlong').mockRejectedValue(new Error('disk gone'));
    await expect(
      reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id),
    ).rejects.toMatchObject({ status: 503, message: PADDLE_DATA_UNAVAILABLE_MESSAGE });
    expect(await stored(paddle.id)).toBeNull();
  });

  it('TOR-010: a paddle tour without a line skips a decision, it has nothing to decide about', async () => {
    const { user, trip, entry } = await decidedFixture();
    const lineless = await makePlace(orm(), trip.id, { name: 'No line' });
    await makeTour(orm(), lineless.id, { tourTypeRef: 'kayak' });
    const read = await reviews.save(String(trip.id), String(lineless.id), { ops: [decide(entry, 'pass')] }, user.id);
    expect(read.tour.paddle_check).toBeNull();
    expect(await findRows(orm(), TourObstacleReviews, { place: lineless.id })).toEqual([]);
  });

  it('TOR-012: a save failing part way stores none of its changes', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await insertRows(orm(), PaddleFeatures, [weir('node/2', 49.2, 12.008)]);
    const read = await detail(trip.id, paddle.id);
    const second = read.obstacle_check?.entries.find((candidate) => candidate.key === 'node/2');
    if (!second) throw new Error('no second entry');
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(second, 'pass')] }, user.id);
    const repo = orm().em.getRepository(TourObstacleReviews) as unknown as { deleteKeys: () => Promise<number> };
    vi.spyOn(repo, 'deleteKeys').mockRejectedValueOnce(new Error('disk full'));

    await expect(
      reviews.save(
        String(trip.id),
        String(paddle.id),
        {
          ops: [decide(entry, 'portage'), { key: 'node/2', op: 'clear', decision: null, note: null, basis: null }],
        },
        user.id,
      ),
    ).rejects.toThrow();
    expect(await stored(paddle.id)).toBeNull();
    expect(await findRows(orm(), TourObstacleReviews, { place: paddle.id })).toHaveLength(1);
  });

  it('TOR-011: a copied tour keeps its decisions, bound to what they were decided on', async () => {
    const { user, trip, paddle, entry } = await decidedFixture();
    await reviews.save(String(trip.id), String(paddle.id), { ops: [decide(entry, 'pass')] }, user.id);
    const copy = await tours.copyTour(String(trip.id), String(paddle.id), 'Regen again');
    expect(copy.obstacle_check?.entries[0]).toMatchObject({ key: 'node/1', status: 'decided' });
    expect(await findRows(orm(), TourObstacleReviews, { place: copy.tour.place_id })).toHaveLength(1);
  });
});
