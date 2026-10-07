/**
 * `HiddenRegionsRepository.listForUser` — Plan 4 Task 8b-2 item 3 (3f L6
 * carry): AT22 (`getHiddenRegions`) had no repository-level
 * `toEqual(<legacy raw>)` parity test.
 */
import { HiddenRegions } from '../../../../src/db/entities/HiddenRegions.entity';
import type { HiddenRegionsRepository } from '../../../../src/db/repositories/HiddenRegions.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: HiddenRegionsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(HiddenRegions);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('HiddenRegionsRepository.listForUser (AT22)', () => {
  it('HIDDENREGREPO-001: matches SELECT region_code FROM hidden_regions WHERE user_id = ? run raw, scoped to the user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    testDb
      .prepare('INSERT INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)')
      .run(user.id, 'DE-BY', 'DE');
    testDb
      .prepare('INSERT INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)')
      .run(user.id, 'DE-BE', 'DE');
    testDb
      .prepare('INSERT INTO hidden_regions (user_id, region_code, country_code) VALUES (?, ?, ?)')
      .run(other.id, 'FR-IDF', 'FR');

    const legacy = testDb.prepare('SELECT region_code FROM hidden_regions WHERE user_id = ?').all(user.id);
    const codes = await repo.listForUser(user.id);

    expect(codes).toEqual(legacy.map((r) => (r as { region_code: string }).region_code));
    expect(codes.sort()).toEqual(['DE-BE', 'DE-BY']);
  });

  it('HIDDENREGREPO-002: empty array for a user with nothing hidden', async () => {
    const { user } = createUser(testDb);
    expect(await repo.listForUser(user.id)).toEqual([]);
  });
});
