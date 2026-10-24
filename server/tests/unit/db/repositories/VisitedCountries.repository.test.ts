/**
 * `VisitedCountriesRepository` — Plan 4 Task 8b-2 item 3 (3f L6 carry):
 * AT10 (`listForUser`) and AT5/AT7/AT43 (`listCodesForUser`) had no
 * repository-level `toEqual(<legacy raw>)` parity test. Every nullable
 * column (`created_at`, via the schema's `DEFAULT CURRENT_TIMESTAMP`) is
 * exercised through the ordinary insert path, matching
 * `ShareTokens.repository.test.ts`'s shape.
 */
import { VisitedCountries } from '../../../../src/db/entities/VisitedCountries.entity';
import type { VisitedCountriesRepository } from '../../../../src/db/repositories/VisitedCountries.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { findRow, insertRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: VisitedCountriesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(VisitedCountries);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('VisitedCountriesRepository.listForUser (AT10)', () => {
  it('VISCOUNTRYREPO-001: matches SELECT country_code, created_at, source FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC run raw, scoped to the user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    await insertRows(t, VisitedCountries, [
      { user: user.id, country_code: 'DE', source: 'manual', created_at: '2026-01-01T00:00:00.000Z' },
      { user: user.id, country_code: 'FR', source: 'dawarich', created_at: '2026-02-01T00:00:00.000Z' },
      { user: other.id, country_code: 'JP', source: 'manual', created_at: '2026-03-01T00:00:00.000Z' },
    ]);

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb
      .prepare(
        'SELECT country_code, created_at, source FROM visited_countries WHERE user_id = ? ORDER BY created_at DESC',
      )
      .all(user.id);
    const rows = await repo.listForUser(user.id);

    expect(rows).toEqual(legacy);
    expect(rows.map((r) => r.country_code)).toEqual(['FR', 'DE']);
  });

  it('VISCOUNTRYREPO-002: empty array for a user with nothing visited', async () => {
    const { user } = createUser(testDb);
    expect(await repo.listForUser(user.id)).toEqual([]);
  });
});

describe('VisitedCountriesRepository.listCodesForUser (AT5/AT7/AT43)', () => {
  it('VISCOUNTRYREPO-003: matches SELECT country_code FROM visited_countries WHERE user_id = ? run raw', async () => {
    const { user } = createUser(testDb);
    await insertRows(t, VisitedCountries, [
      { user: user.id, country_code: 'DE', source: 'manual' },
      { user: user.id, country_code: 'FR', source: 'manual' },
    ]);

    // test-sql-allow: the raw statement is the legacy oracle this parity test holds the repository to.
    const legacy = testDb.prepare('SELECT country_code FROM visited_countries WHERE user_id = ?').all(user.id);
    const codes = await repo.listCodesForUser(user.id);

    expect(codes).toEqual(legacy.map((r) => (r as { country_code: string }).country_code));
    expect(codes.sort()).toEqual(['DE', 'FR']);
  });

  it('VISCOUNTRYREPO-004: empty array for a user with nothing visited', async () => {
    const { user } = createUser(testDb);
    expect(await repo.listCodesForUser(user.id)).toEqual([]);
  });
});

describe('VisitedCountriesRepository: countries that came in through a region (#2597)', () => {
  it('VISCOUNTRYREPO-005: markFromRegion writes region, and the readers still answer manual', async () => {
    const { user } = createUser(testDb);
    await repo.markFromRegion(user.id, 'NO');

    expect((await findRow(t, VisitedCountries, { user: user.id, country_code: 'NO' }))?.source).toBe('region');
    expect(await repo.findSource(user.id, 'NO')).toEqual({ source: 'manual' });
    expect((await repo.listForUser(user.id)).map((r) => r.source)).toEqual(['manual']);
    expect(await repo.hasOwnMark(user.id, 'NO')).toBe(false);
  });

  it('VISCOUNTRYREPO-006: markFromRegion leaves a country the user marked itself as it was', async () => {
    const { user } = createUser(testDb);
    await repo.markVisited(user.id, 'NO', 'dawarich');
    await repo.markFromRegion(user.id, 'NO');

    expect(await repo.findSource(user.id, 'NO')).toEqual({ source: 'dawarich' });
    expect(await repo.hasOwnMark(user.id, 'NO')).toBe(true);
  });

  it('VISCOUNTRYREPO-007: promoteFromRegion turns a region row into the given mark and touches nothing else', async () => {
    const { user } = createUser(testDb);
    await repo.markFromRegion(user.id, 'NO');
    await repo.markVisited(user.id, 'SE', 'manual');

    await repo.promoteFromRegion(user.id, 'NO', 'dawarich');
    await repo.promoteFromRegion(user.id, 'SE', 'dawarich');

    expect(await repo.findSource(user.id, 'NO')).toEqual({ source: 'dawarich' });
    expect(await repo.findSource(user.id, 'SE')).toEqual({ source: 'manual' });
    expect(await repo.hasOwnMark(user.id, 'NO')).toBe(true);
  });

  it('VISCOUNTRYREPO-008: hasOwnMark is false without a row and scoped to the user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    await repo.markVisited(other.id, 'NO', 'manual');

    expect(await repo.hasOwnMark(user.id, 'NO')).toBe(false);
    expect(await repo.findSource(user.id, 'NO')).toBeUndefined();
  });
});
