/**
 * `VisitedRegionsRepository` — Plan 4 Task 8b-2 item 3 (3f L6 carry): AT21
 * (`listForUser`), AT24 (`listRegionCodesForCountry`) and AT25
 * (`findCountryCode`) had no repository-level `toEqual(<legacy raw>)`
 * parity test. AT25's JS fallback (`countryCodeFromRegionCode`, exercised
 * when no row matches) is a service concern, not this repository's — this
 * file pins only the raw statement's own `undefined` shape on a miss.
 */
import { VisitedRegions } from '../../../../src/db/entities/VisitedRegions.entity';
import type { VisitedRegionsRepository } from '../../../../src/db/repositories/VisitedRegions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { insertRow } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VisitedRegionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VisitedRegions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('VisitedRegionsRepository.listForUser (AT21)', () => {
  it('VISREGREPO-001: matches SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC run raw', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    await insertRow(t, VisitedRegions, {
      user: user.id,
      region_code: 'DE-BY',
      region_name: 'Bavaria',
      country_code: 'DE',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    await insertRow(t, VisitedRegions, {
      user: user.id,
      region_code: 'DE-BE',
      region_name: 'Berlin',
      country_code: 'DE',
      created_at: '2026-02-01T00:00:00.000Z',
    });
    await insertRow(t, VisitedRegions, {
      user: other.id,
      region_code: 'FR-IDF',
      region_name: 'Ile-de-France',
      country_code: 'FR',
      created_at: '2026-03-01T00:00:00.000Z',
    });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare(
        'SELECT region_code, region_name, country_code FROM visited_regions WHERE user_id = ? ORDER BY created_at DESC',
      )
      .all(user.id);
    const rows = await repo.listForUser(user.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.region_code)).toEqual(['DE-BE', 'DE-BY']);
  });

  it('VISREGREPO-002: empty array for a user with nothing visited', async () => {
    const { user } = createUser(testDb);
    expect(await repo.listForUser(user.id)).toEqual([]);
  });
});

describe('VisitedRegionsRepository.listRegionCodesForCountry (AT24)', () => {
  it('VISREGREPO-003: matches SELECT region_code FROM visited_regions WHERE user_id = ? AND country_code = ? run raw', async () => {
    const { user } = createUser(testDb);
    await insertRow(t, VisitedRegions, {
      user: user.id,
      region_code: 'DE-BY',
      region_name: 'Bavaria',
      country_code: 'DE',
    });
    await insertRow(t, VisitedRegions, {
      user: user.id,
      region_code: 'FR-IDF',
      region_name: 'Ile-de-France',
      country_code: 'FR',
    });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare('SELECT region_code FROM visited_regions WHERE user_id = ? AND country_code = ?')
      .all(user.id, 'DE');
    const codes = await repo.listRegionCodesForCountry(user.id, 'DE');

    expect(codes).toEqual(legacy.map((r) => (r as { region_code: string }).region_code));
    expect(codes).toEqual(['DE-BY']);
  });

  it('VISREGREPO-004: empty array for a country with nothing visited', async () => {
    const { user } = createUser(testDb);
    expect(await repo.listRegionCodesForCountry(user.id, 'DE')).toEqual([]);
  });
});

describe('VisitedRegionsRepository.findCountryCode (AT25)', () => {
  it('VISREGREPO-005: matches SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ? run raw', async () => {
    const { user } = createUser(testDb);
    await insertRow(t, VisitedRegions, {
      user: user.id,
      region_code: 'DE-BY',
      region_name: 'Bavaria',
      country_code: 'DE',
    });

    // test-sql-allow: the legacy statement is the oracle the repository read is held to.
    const legacy = testDb
      .prepare('SELECT country_code FROM visited_regions WHERE user_id = ? AND region_code = ?')
      .get(user.id, 'DE-BY') as { country_code: string };
    expect(await repo.findCountryCode(user.id, 'DE-BY')).toEqual(legacy.country_code);
  });

  it("VISREGREPO-006: undefined for an unmarked region — the JS fallback is the service's concern, not this repository's", async () => {
    const { user } = createUser(testDb);
    expect(await repo.findCountryCode(user.id, 'DE-BY')).toBeUndefined();
  });
});
