/**
 * PlaceRatingsRepository.listForPlaces (Plan 3c Task 1, QH2): the batch
 * ratings-by-place loader behind `QueryHelpersService.loadRatingsByPlaceIds`,
 * moved off `query-helpers.service.ts`. `place_ratings` is a Plan 3c-owned
 * table (inventory §14.6) with no repository test file before this one.
 */
import { PlaceRatings } from '../../../../src/db/entities/PlaceRatings.entity';
import type { PlaceRatingsRepository } from '../../../../src/db/repositories/PlaceRatings.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let placeRatings: PlaceRatingsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  placeRatings = t.repo(PlaceRatings);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rate(placeId: number, userId: number, rating: number, createdAt: string): void {
  testDb
    .prepare('INSERT INTO place_ratings (place_id, user_id, rating, created_at) VALUES (?, ?, ?, ?)')
    .run(placeId, userId, rating, createdAt);
}

async function withQueryCount<T>(fn: () => Promise<T>): Promise<{ value: T; queries: number }> {
  const connection = t.orm.em.getConnection();
  const spy = vi.spyOn(connection, 'execute');
  try {
    const value = await fn();
    return { value, queries: spy.mock.calls.length };
  } finally {
    spy.mockRestore();
  }
}

describe('PlaceRatingsRepository.listForPlaces', () => {
  it('PLACERATINGSREPO-001: an empty placeIds array short-circuits to [] without querying', async () => {
    const { value, queries } = await withQueryCount(() => placeRatings.listForPlaces([]));
    expect(value).toEqual([]);
    expect(queries).toBe(0);
  });

  it("PLACERATINGSREPO-002: joins the voter's username/avatar, ordered by created_at", async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'alpha' });
    const { user: voterB } = createUser(testDb, { username: 'beta' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    rate(place.id, voterA.id, 4, '2026-01-01 00:00:00');
    rate(place.id, voterB.id, 2, '2026-01-02 00:00:00');

    const rows = await placeRatings.listForPlaces([place.id]);
    expect(rows).toEqual([
      { place_id: place.id, user_id: voterA.id, username: 'alpha', avatar: null, rating: 4 },
      { place_id: place.id, user_id: voterB.id, username: 'beta', avatar: null, rating: 2 },
    ]);
  });

  it('PLACERATINGSREPO-003: batches across several places, indexed by place_id in the caller', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const placeA = createPlace(testDb, trip.id, { name: 'A' });
    const placeB = createPlace(testDb, trip.id, { name: 'B' });
    rate(placeA.id, voter.id, 5, '2026-01-01 00:00:00');
    rate(placeB.id, voter.id, 1, '2026-01-01 00:00:00');

    const rows = await placeRatings.listForPlaces([placeA.id, placeB.id]);
    expect(rows.map((r) => r.place_id).sort()).toEqual([placeA.id, placeB.id].sort());
  });

  it('PLACERATINGSREPO-004: a place with no ratings contributes no rows', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    expect(await placeRatings.listForPlaces([place.id])).toEqual([]);
  });

  // Task 9 fix wave (B-M3): relabelled. `listForPlaces` is a
  // `qb().execute('all', false)` projection, which never hydrates an entity
  // into the identity map by construction (unlike `find`/`findOne`), and the
  // base default leaves the identity map disabled for every read anyway —
  // there is no live identity-map entry here to bypass. This proves a DB
  // round-trip, not an identity-map bypass.
  it('PLACERATINGSREPO-005 (fresh after a raw UPDATE, not D-shape): a rating written after an unrelated identity-map read is visible in the FIRST wider projection', async () => {
    const { user: owner } = createUser(testDb);
    const { user: seedVoter } = createUser(testDb, { username: 'seed-voter' });
    const { user: voter } = createUser(testDb, { username: 'fresh-voter' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    rate(place.id, seedVoter.id, 1, '2026-01-01 00:00:00');
    // rule 20: the FIRST, wider setup read passes `disableIdentityMap: false`
    // explicitly and carries the column the later write targets (`rating`) —
    // `find({})` with the base default merged in populates nothing.
    await t.repo(PlaceRatings).find({}, { disableIdentityMap: false });
    rate(place.id, voter.id, 3, '2026-01-02 00:00:00');
    const rows = await placeRatings.listForPlaces([place.id]);
    expect(rows).toEqual([
      { place_id: place.id, user_id: seedVoter.id, username: 'seed-voter', avatar: null, rating: 1 },
      { place_id: place.id, user_id: voter.id, username: 'fresh-voter', avatar: null, rating: 3 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 4 — upsertRating (PL51) / deleteRating (PL50).
// ---------------------------------------------------------------------------

describe('PlaceRatingsRepository.upsertRating (PL51)', () => {
  it('UPSERTRATINGREPO-001: inserts a new vote, then a re-vote replaces the rating via ON CONFLICT DO UPDATE', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb, { username: 'voter1' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);

    await placeRatings.upsertRating(place.id, voter.id, 5);
    let rows = testDb
      .prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?')
      .all(place.id, voter.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 5 }]);

    await placeRatings.upsertRating(place.id, voter.id, 2);
    rows = testDb
      .prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?')
      .all(place.id, voter.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 2 }]);
    // Exactly one row for the (place, user) pair — the composite unique key held, not a duplicate insert.
    const count = testDb
      .prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ? AND user_id = ?')
      .get(place.id, voter.id) as { n: number };
    expect(count.n).toBe(1);
  });

  it("UPSERTRATINGREPO-002 (PL51 ruling): a re-vote never touches places.updated_at — a vote must not 409 another member's If-Match", async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb, { username: 'voter2' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare("UPDATE places SET updated_at = datetime('now', '-1 hour') WHERE id = ?").run(place.id);
    const before = (
      testDb.prepare('SELECT updated_at FROM places WHERE id = ?').get(place.id) as { updated_at: string }
    ).updated_at;

    await placeRatings.upsertRating(place.id, voter.id, 4);
    await placeRatings.upsertRating(place.id, voter.id, 1); // the conflict path

    const after = (testDb.prepare('SELECT updated_at FROM places WHERE id = ?').get(place.id) as { updated_at: string })
      .updated_at;
    expect(after).toBe(before);
  });

  it('UPSERTRATINGREPO-003: two different voters on the same place both keep their own rating', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'va' });
    const { user: voterB } = createUser(testDb, { username: 'vb' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    await placeRatings.upsertRating(place.id, voterA.id, 5);
    await placeRatings.upsertRating(place.id, voterB.id, 1);
    const rows = testDb
      .prepare('SELECT user_id, rating FROM place_ratings WHERE place_id = ? ORDER BY user_id')
      .all(place.id);
    expect(rows).toEqual([
      { user_id: Math.min(voterA.id, voterB.id), rating: voterA.id < voterB.id ? 5 : 1 },
      { user_id: Math.max(voterA.id, voterB.id), rating: voterA.id < voterB.id ? 1 : 5 },
    ]);
  });
});

describe('PlaceRatingsRepository.deleteRating (PL50)', () => {
  it("DELETERATINGREPO-001: removes exactly the (place, user) row, leaving another voter's row alone", async () => {
    const { user: owner } = createUser(testDb);
    const { user: voterA } = createUser(testDb, { username: 'da' });
    const { user: voterB } = createUser(testDb, { username: 'db' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    await placeRatings.upsertRating(place.id, voterA.id, 5);
    await placeRatings.upsertRating(place.id, voterB.id, 3);
    await placeRatings.deleteRating(place.id, voterA.id);
    expect(testDb.prepare('SELECT user_id FROM place_ratings WHERE place_id = ?').all(place.id)).toEqual([
      { user_id: voterB.id },
    ]);
  });

  it('DELETERATINGREPO-002: deleting a vote that does not exist is a no-op, not a throw', async () => {
    const { user: owner } = createUser(testDb);
    const { user: voter } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id);
    await expect(placeRatings.deleteRating(place.id, voter.id)).resolves.toBeUndefined();
  });
});
