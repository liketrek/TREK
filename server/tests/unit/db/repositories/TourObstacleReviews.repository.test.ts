/**
 * `TourObstacleReviewsRepository` (PAD-06) and the Tours repository's reads
 * and copies for the paddle checklist: decisions written and replaced per
 * obstacle, read per tour and per trip, removed by key, the lines of a
 * trip's paddle tours, and a copy taking its decisions along.
 */
import { TourObstacleReviews } from '../../../../src/db/entities/TourObstacleReviews.entity';
import { TourSources } from '../../../../src/db/entities/TourSources.entity';
import { Tours } from '../../../../src/db/entities/Tours.entity';
import type {
  TourObstacleReviewsRepository,
  TourObstacleReviewWrite,
} from '../../../../src/db/repositories/TourObstacleReviews.repository';
import type { ToursRepository } from '../../../../src/db/repositories/Tours.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makePlace } from '../../../helpers/factories/places';
import { findRows, insertRow } from '../../../helpers/factories/rows';
import { makeTour } from '../../../helpers/factories/tours';
import { makeTrip } from '../../../helpers/factories/trips';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let reviews: TourObstacleReviewsRepository;
let tours: ToursRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  reviews = t.repo(TourObstacleReviews);
  tours = t.repo(Tours);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function review(key: string, overrides: Partial<TourObstacleReviewWrite> = {}): TourObstacleReviewWrite {
  return {
    obstacle_key: key,
    decision: 'pass',
    note: null,
    route_fingerprint: 'p1:o:_',
    source_fingerprint: 's1:0123456789abcdef:4920000,1200500',
    obstacle_snapshot: '{"v":1}',
    decided_at: '2026-10-03 10:00:00',
    decided_by: null,
    ...overrides,
  };
}

async function fixture() {
  const { user } = await makeUser(t);
  const trip = await makeTrip(t, user.id);
  const other = await makeTrip(t, user.id);
  const regen = await makePlace(t, trip.id, { name: 'Regen', route_geometry: '[[49.2,12],[49.2,12.01]]' });
  await makeTour(t, regen.id, { tourTypeRef: 'kayak' });
  const naab = await makePlace(t, trip.id, { name: 'Naab' });
  await makeTour(t, naab.id, { tourTypeRef: 'kayak' });
  const ridge = await makePlace(t, trip.id, { name: 'Ridge', route_geometry: '[[47,11],[47.1,11.1]]' });
  await makeTour(t, ridge.id);
  const foreign = await makePlace(t, other.id, { name: 'Foreign' });
  await makeTour(t, foreign.id, { tourTypeRef: 'kayak' });
  return { user, trip, other, regen, naab, ridge, foreign };
}

describe('TourObstacleReviewsRepository', () => {
  it('TOREV-001: writes decisions and replaces the one stored for an obstacle, read back by key', async () => {
    const { user, regen } = await fixture();
    await reviews.writeMany(regen.id, [review('way/7'), review('node/1', { decided_by: user.id })]);
    await reviews.writeMany(regen.id, [
      review('node/1', { decision: 'portage', note: 'Links', decided_at: '2026-10-04 08:00:00' }),
    ]);

    expect(await reviews.listForPlace(regen.id)).toEqual([
      {
        place_id: regen.id,
        ...review('node/1', { decision: 'portage', note: 'Links', decided_at: '2026-10-04 08:00:00' }),
      },
      { place_id: regen.id, ...review('way/7') },
    ]);
  });

  it("TOREV-002: reads the decisions of a trip's tours, never another trip's", async () => {
    const { trip, regen, naab, foreign } = await fixture();
    await reviews.writeMany(naab.id, [review('node/2')]);
    await reviews.writeMany(regen.id, [review('node/1')]);
    await reviews.writeMany(foreign.id, [review('node/3')]);

    expect((await reviews.listForTrip(trip.id)).map((row) => [row.place_id, row.obstacle_key])).toEqual([
      [regen.id, 'node/1'],
      [naab.id, 'node/2'],
    ]);
  });

  it('TOREV-003: removes the decisions about the given obstacles and says how many went', async () => {
    const { regen, naab } = await fixture();
    await reviews.writeMany(regen.id, [review('node/1'), review('node/2'), review('lock:way/5')]);
    await reviews.writeMany(naab.id, [review('node/1')]);

    expect(await reviews.deleteKeys(regen.id, ['node/1', 'lock:way/5', 'node/9'])).toBe(2);
    expect((await reviews.listForPlace(regen.id)).map((row) => row.obstacle_key)).toEqual(['node/2']);
    expect(await reviews.listForPlace(naab.id)).toHaveLength(1);
  });
});

describe('ToursRepository for the paddle checklist', () => {
  it("TOREV-004: lists the line of every paddle tour of a trip, hikes and other trips' tours left out", async () => {
    const { trip, regen, naab } = await fixture();
    expect(await tours.listPaddleLinesForTrip(trip.id)).toEqual([
      { place_id: regen.id, route_geometry: '[[49.2,12],[49.2,12.01]]' },
      { place_id: naab.id, route_geometry: null },
    ]);
  });

  it('TOREV-005: a copy takes the decisions along, beside the source record a trip copy takes', async () => {
    const { user, trip, regen } = await fixture();
    await reviews.writeMany(regen.id, [review('node/1', { decided_by: user.id, note: 'Rechts' })]);
    await insertRow(t, TourSources, {
      place: regen.id,
      provider: 'wanderer',
      instance: 'https://wanderer.example',
      external_id: 'trail-1',
      content_hash: 'a.b.c',
      local_hash: 'l',
      imported_at: '2026-10-01 10:00:00',
    });
    const copy = await makePlace(t, trip.id, { name: 'Regen copy' });
    await makeTour(t, copy.id, { tourTypeRef: 'kayak' });
    await tours.copyObstacleReviews(regen.id, copy.id);
    expect(await reviews.listForPlace(copy.id)).toEqual([
      { place_id: copy.id, ...review('node/1', { decided_by: user.id, note: 'Rechts' }) },
    ]);

    const tripCopy = await makePlace(t, trip.id, { name: 'Regen in the copied trip' });
    await makeTour(t, tripCopy.id, { tourTypeRef: 'kayak' });
    await Promise.all([tours.copySource(regen.id, tripCopy.id), tours.copyObstacleReviews(regen.id, tripCopy.id)]);
    expect(await reviews.listForPlace(tripCopy.id)).toHaveLength(1);
    expect(await findRows(t, TourSources, { place: tripCopy.id })).toEqual([
      expect.objectContaining({ external_id: 'trail-1' }),
    ]);
  });
});
