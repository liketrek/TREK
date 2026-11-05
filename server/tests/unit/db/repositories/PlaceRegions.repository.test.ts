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

describe('PlaceRegionsRepository.listPlaceCountriesForTrip (AT40)', () => {
  it('PLACEREGREPO-007: every place of the trip with its cached country, null where none is cached, other trips left out', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const cached = createPlace(testDb, trip.id, { lat: 48.85, lng: 2.35 });
    const uncached = createPlace(testDb, trip.id, { lat: 41.9022, lng: 12.4539 });
    await insertPlaceRegion(cached.id, 'FR', 'FR-IDF', 'Île-de-France');
    const foreign = createPlace(testDb, other.id);
    await insertPlaceRegion(foreign.id, 'FR', 'FR-IDF', 'Île-de-France');

    expect(await repo.listPlaceCountriesForTrip(trip.id)).toEqual([
      { id: cached.id, lat: 48.85, lng: 2.35, address: null, country_code: 'FR' },
      { id: uncached.id, lat: 41.9022, lng: 12.4539, address: null, country_code: null },
    ]);
  });

  it('PLACEREGREPO-008: empty array for a trip without places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await repo.listPlaceCountriesForTrip(trip.id)).toEqual([]);
  });
});

describe('PlaceRegionsRepository.listStartedTripPlaceCountriesForUser (AT44)', () => {
  it('PLACEREGREPO-009: owner and member see the places of started trips once each, cached or not', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const started = createTrip(testDb, owner.id, { start_date: '2020-01-01', end_date: '2020-01-10' });
    const notStarted = createTrip(testDb, owner.id, { start_date: '2099-01-01', end_date: '2099-01-10' });
    const dateless = createTrip(testDb, owner.id);
    // Two members: the trip_members join must not repeat a place per member.
    addTripMember(testDb, started.id, member.id);
    addTripMember(testDb, started.id, other.id);

    const cached = createPlace(testDb, started.id, { lat: 48.85, lng: 2.35 });
    await insertPlaceRegion(cached.id, 'FR', 'FR-IDF', 'Île-de-France');
    const uncached = createPlace(testDb, started.id, { lat: 41.9022, lng: 12.4539 });
    const future = createPlace(testDb, notStarted.id);
    await insertPlaceRegion(future.id, 'DE', 'DE-BY', 'Bavaria');
    createPlace(testDb, dateless.id);

    const today = '2026-01-01';
    const expected = [
      { id: cached.id, lat: 48.85, lng: 2.35, address: null, country_code: 'FR' },
      { id: uncached.id, lat: 41.9022, lng: 12.4539, address: null, country_code: null },
    ];
    expect(await repo.listStartedTripPlaceCountriesForUser(owner.id, today)).toEqual(expected);
    expect(await repo.listStartedTripPlaceCountriesForUser(member.id, today)).toEqual(expected);
    expect(await repo.listStartedTripPlaceCountriesForUser(stranger.id, today)).toEqual([]);
  });
});
