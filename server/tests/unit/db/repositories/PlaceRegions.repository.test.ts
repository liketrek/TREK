/**
 * PlaceRegionsRepository — full-key parity (Plan 4 Task 8b-2, item 3: 3f
 * Task 7 review's L6 carry, "Atlas and vacay read models without a full-key
 * legacy-raw `toEqual`"). AT3, AT23, AT28, AT40, AT44 had no repository-level
 * test at all (the review's side-by-side HTTP run showed the rows are
 * identical to the legacy today, but nothing ratchets them). One seeded
 * world, `toEqual(<legacy raw>)` per method.
 */
import { PlaceRegions } from '../../../../src/db/entities/PlaceRegions.entity';
import type { PlaceRegionsRepository } from '../../../../src/db/repositories/PlaceRegions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTrip, createUser, addTripMember } from '../../../helpers/factories';
import { insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: PlaceRegionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(PlaceRegions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

async function insertPlaceRegion(
  placeId: number,
  countryCode: string,
  regionCode: string,
  regionName: string,
): Promise<void> {
  await insertRow(t, PlaceRegions, {
    place: placeId,
    country_code: countryCode,
    region_code: regionCode,
    region_name: regionName,
  });
}

describe('PlaceRegionsRepository.listCountryCodesForPlaceIds (AT3)', () => {
  it('PLACEREGREPO-001: matches SELECT place_id, country_code FROM place_regions WHERE place_id IN (...) run raw', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const p2 = createPlace(testDb, trip.id, { name: 'Louvre' });
    const p3 = createPlace(testDb, trip.id, { name: 'Not geocoded' });
    await insertPlaceRegion(p1.id, 'FR', 'FR-IDF', 'Île-de-France');
    await insertPlaceRegion(p2.id, 'FR', 'FR-IDF', 'Île-de-France');

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare(
        `SELECT place_id, country_code FROM place_regions WHERE place_id IN (${[p1.id, p2.id, p3.id].join(',')})`,
      )
      .all();
    const typed = await repo.listCountryCodesForPlaceIds([p1.id, p2.id, p3.id]);
    expect(typed).toEqual(legacy);
    expect(typed.map((r) => r.place_id).sort((a, b) => a - b)).toEqual([p1.id, p2.id].sort((a, b) => a - b));
  });

  it('PLACEREGREPO-002: an empty id array short-circuits to [] without a query', async () => {
    expect(await repo.listCountryCodesForPlaceIds([])).toEqual([]);
  });
});

describe('PlaceRegionsRepository.listForPlaceIds (AT28)', () => {
  it('PLACEREGREPO-003: matches SELECT * FROM place_regions WHERE place_id IN (...) run raw, every column', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id);
    const p2 = createPlace(testDb, trip.id);
    await insertPlaceRegion(p1.id, 'US', 'US-NY', 'New York');
    await insertPlaceRegion(p2.id, 'US', 'US-CA', 'California');

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb.prepare(`SELECT * FROM place_regions WHERE place_id IN (${[p1.id, p2.id].join(',')})`).all();
    const typed = await repo.listForPlaceIds([p1.id, p2.id]);
    expect(typed).toEqual(legacy);
  });

  it('PLACEREGREPO-004: an empty id array short-circuits to []', async () => {
    expect(await repo.listForPlaceIds([])).toEqual([]);
  });
});

describe('PlaceRegionsRepository.listDistinctRegionCodesForCountryAndPlaces (AT23)', () => {
  it('PLACEREGREPO-005: matches SELECT DISTINCT region_code ... run raw, deduped across places sharing the region', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id);
    const p2 = createPlace(testDb, trip.id);
    const p3 = createPlace(testDb, trip.id);
    await insertPlaceRegion(p1.id, 'FR', 'FR-IDF', 'Île-de-France');
    await insertPlaceRegion(p2.id, 'FR', 'FR-IDF', 'Île-de-France'); // same region, dedup target
    await insertPlaceRegion(p3.id, 'DE', 'DE-BY', 'Bavaria'); // different country, excluded

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare(
        `SELECT DISTINCT region_code FROM place_regions WHERE country_code = ? AND place_id IN (${[p1.id, p2.id, p3.id].join(',')})`,
      )
      .all('FR');
    const typed = await repo.listDistinctRegionCodesForCountryAndPlaces('FR', [p1.id, p2.id, p3.id]);
    expect(typed).toEqual(legacy.map((r: unknown) => (r as { region_code: string }).region_code));
    expect(typed).toEqual(['FR-IDF']);
  });

  it('PLACEREGREPO-006: an empty id array short-circuits to []', async () => {
    expect(await repo.listDistinctRegionCodesForCountryAndPlaces('FR', [])).toEqual([]);
  });
});

describe('PlaceRegionsRepository.countPlacesByCountryForTrip (AT40)', () => {
  it('PLACEREGREPO-007: matches the legacy GROUP BY statement, ordered by count DESC then country ASC, NULL country excluded', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const fr1 = createPlace(testDb, trip.id);
    const fr2 = createPlace(testDb, trip.id);
    const de1 = createPlace(testDb, trip.id);
    const noRegion = createPlace(testDb, trip.id);
    await insertPlaceRegion(fr1.id, 'FR', 'FR-IDF', 'Île-de-France');
    await insertPlaceRegion(fr2.id, 'FR', 'FR-PAC', 'Provence');
    await insertPlaceRegion(de1.id, 'DE', 'DE-BY', 'Bavaria');
    // A different trip's place must not leak in.
    const foreign = createPlace(testDb, other.id);
    await insertPlaceRegion(foreign.id, 'FR', 'FR-IDF', 'Île-de-France');
    void noRegion;

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare(
        `
      SELECT pr.country_code, COUNT(DISTINCT p.id) AS places
      FROM place_regions pr JOIN places p ON p.id = pr.place_id
      WHERE p.trip_id = ? AND pr.country_code IS NOT NULL
      GROUP BY pr.country_code ORDER BY places DESC, pr.country_code ASC`,
      )
      .all(trip.id);
    const typed = await repo.countPlacesByCountryForTrip(trip.id);
    expect(typed).toEqual(legacy);
    expect(typed).toEqual([
      { country_code: 'FR', places: 2 },
      { country_code: 'DE', places: 1 },
    ]);
  });

  it('PLACEREGREPO-008: empty array for a trip with no geocoded places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await repo.countPlacesByCountryForTrip(trip.id)).toEqual([]);
  });
});

describe('PlaceRegionsRepository.listVisitedCountryCodesForUser (AT44)', () => {
  it('PLACEREGREPO-009: matches the legacy statement — owner and member trips count, only started trips, deduped, NULL country excluded', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const started = createTrip(testDb, owner.id, { start_date: '2020-01-01', end_date: '2020-01-10' });
    const notStarted = createTrip(testDb, owner.id, { start_date: '2099-01-01', end_date: '2099-01-10' });
    addTripMember(testDb, started.id, member.id);

    const startedPlace = createPlace(testDb, started.id);
    await insertPlaceRegion(startedPlace.id, 'FR', 'FR-IDF', 'Île-de-France');
    const startedPlace2 = createPlace(testDb, started.id);
    await insertPlaceRegion(startedPlace2.id, 'FR', 'FR-PAC', 'Provence'); // same country, dedup target
    const notStartedPlace = createPlace(testDb, notStarted.id);
    await insertPlaceRegion(notStartedPlace.id, 'DE', 'DE-BY', 'Bavaria'); // not started, excluded

    const today = '2026-01-01';
    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare(
        `
      SELECT DISTINCT pr.country_code
      FROM place_regions pr
      JOIN places p ON p.id = pr.place_id
      JOIN trips t ON p.trip_id = t.id
      LEFT JOIN trip_members tm ON t.id = tm.trip_id
      WHERE (t.user_id = ? OR tm.user_id = ?)
        AND pr.country_code IS NOT NULL
        AND COALESCE(t.start_date, t.end_date) IS NOT NULL
        AND COALESCE(t.start_date, t.end_date) <= ?`,
      )
      .all(owner.id, owner.id, today);

    const typedOwner = await repo.listVisitedCountryCodesForUser(owner.id, today);
    expect(typedOwner).toEqual(legacy.map((r: unknown) => (r as { country_code: string }).country_code));
    expect(typedOwner).toEqual(['FR']);

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacyMember = testDb
      .prepare(
        `
      SELECT DISTINCT pr.country_code
      FROM place_regions pr
      JOIN places p ON p.id = pr.place_id
      JOIN trips t ON p.trip_id = t.id
      LEFT JOIN trip_members tm ON t.id = tm.trip_id
      WHERE (t.user_id = ? OR tm.user_id = ?)
        AND pr.country_code IS NOT NULL
        AND COALESCE(t.start_date, t.end_date) IS NOT NULL
        AND COALESCE(t.start_date, t.end_date) <= ?`,
      )
      .all(member.id, member.id, today);
    const typedMember = await repo.listVisitedCountryCodesForUser(member.id, today);
    expect(typedMember).toEqual(legacyMember.map((r: unknown) => (r as { country_code: string }).country_code));
    expect(typedMember).toEqual(['FR']);

    expect(await repo.listVisitedCountryCodesForUser(stranger.id, today)).toEqual([]);
  });
});
