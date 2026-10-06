import { BucketList } from '../../../../src/db/entities/BucketList.entity';
import type { BucketListIdentity } from '../../../../src/db/repositories/BucketList.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * AT31 (`AtlasService#findDuplicateBucketItem`, #1898) parity — Plan 3f
 * Task 1. The legacy fragment this harness proves parity against
 * (`atlas.service.ts` at HEAD, `:872-883`), kept byte-identical to the
 * source text as this test's own oracle, the `reservation-travelers-owns
 * .parity.test.ts` precedent. Every one of the four nullable comparisons
 * (`country_code`/`target_date`/`lat`/`lng`) is a bound-parameter `IS`
 * in the legacy statement — proven here on BOTH an all-NULL and an
 * all-SET fixture row, not assumed from a generic `.select()`/`.where()`
 * translation.
 */
const LEGACY_FIND_DUPLICATE = `SELECT id FROM bucket_list
     WHERE user_id = ?
       AND lower(trim(name)) = lower(trim(?))
       AND country_code IS ?
       AND target_date IS ?
       AND lat IS ?
       AND lng IS ?
       AND id IS NOT ?
     LIMIT 1`;

const testDb = createSnapshotTestDb();
let t: TestOrm;

beforeAll(async () => {
  t = await createTestOrm(testDb);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function insertBucketItem(
  userId: number,
  row: Partial<BucketListIdentity> & { name: string; notes?: string | null },
): number {
  const result = testDb
    .prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng, country_code, notes, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(
      userId,
      row.name,
      row.lat ?? null,
      row.lng ?? null,
      row.country_code ?? null,
      row.notes ?? null,
      row.target_date ?? null,
    );
  return Number(result.lastInsertRowid);
}

function legacyFindDuplicate(userId: number, key: BucketListIdentity, excludeId: number | null): number | null {
  const row = testDb
    .prepare(LEGACY_FIND_DUPLICATE)
    .get(userId, key.name, key.country_code, key.target_date, key.lat, key.lng, excludeId) as
    { id: number } | undefined;
  return row?.id ?? null;
}

async function repoFindDuplicate(
  userId: number,
  key: BucketListIdentity,
  excludeId: number | null,
): Promise<number | null> {
  return t.repo(BucketList).findDuplicate(userId, key, excludeId);
}

describe('BucketListRepository.findDuplicate parity (AT31, #1898)', () => {
  it('BLDUP-001: an all-NULL fixture row matches an all-NULL key (NULL-safe IS, not NULL = NULL)', async () => {
    const { user } = createUser(testDb);
    const id = insertBucketItem(user.id, {
      name: 'Someday Idea',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    });
    const key: BucketListIdentity = {
      name: 'Someday Idea',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    };

    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(id);
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-002: an all-SET fixture row matches an identical all-SET key', async () => {
    const { user } = createUser(testDb);
    const id = insertBucketItem(user.id, {
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      country_code: 'FR',
      target_date: '2026-06-01',
    });
    const key: BucketListIdentity = {
      name: 'Eiffel Tower',
      lat: 48.8584,
      lng: 2.2945,
      country_code: 'FR',
      target_date: '2026-06-01',
    };

    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(id);
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-003: name matches case- and whitespace-insensitively (lower(trim()) on both sides)', async () => {
    const { user } = createUser(testDb);
    const id = insertBucketItem(user.id, {
      name: 'Eiffel Tower',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    });
    const key: BucketListIdentity = {
      name: '  eiffel TOWER  ',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    };

    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(id);
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-004: an all-NULL row does NOT match an all-SET key with the same name (mixed NULL/non-NULL, every column checked)', async () => {
    const { user } = createUser(testDb);
    insertBucketItem(user.id, { name: 'Tower', lat: null, lng: null, country_code: null, target_date: null });
    const key: BucketListIdentity = {
      name: 'Tower',
      lat: 48.8584,
      lng: 2.2945,
      country_code: 'FR',
      target_date: '2026-06-01',
    };

    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBeNull();
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-005: excludeId excludes the row itself (the update-against-self no-op path) — a bound NULL excludeId (create) never excludes anything', async () => {
    const { user } = createUser(testDb);
    const id = insertBucketItem(user.id, {
      name: 'Colosseum',
      lat: 41.8902,
      lng: 12.4922,
      country_code: 'IT',
      target_date: null,
    });
    const key: BucketListIdentity = {
      name: 'Colosseum',
      lat: 41.8902,
      lng: 12.4922,
      country_code: 'IT',
      target_date: null,
    };

    // update-against-self: excluding the row's own id finds nothing.
    expect(legacyFindDuplicate(user.id, key, id)).toBeNull();
    expect(await repoFindDuplicate(user.id, key, id)).toBeNull();

    // create path: excludeId is null (bound NULL, "IS NOT NULL" — always true since id is
    // never null), so the existing row is still found as a duplicate.
    expect(legacyFindDuplicate(user.id, key, null)).toBe(id);
    expect(await repoFindDuplicate(user.id, key, null)).toBe(id);
  });

  it('BLDUP-006: two rows differing ONLY in coordinates are distinct wishes — every nullable column is load-bearing, not just name', async () => {
    // Mutation-sensitive (per this task's brief, and see BLDUP-007/008 for the other two
    // columns): manually dropping the `lat`/`lng` comparisons from `BucketListRepository
    // .findDuplicate`'s filter object and re-running this suite made this exact test go
    // red — a coordinate-less "Tower" idea and a pinned "Tower" place (same user, name,
    // country and target date; different lat/lng only) collapsed into "the same wish",
    // which is precisely the false-409 regression #1898/ATLAS-SVC-042 guards against.
    // Restored immediately after observing the failure; `findDuplicate` itself is
    // unchanged in this commit — see this task's report for the per-column results.
    const { user } = createUser(testDb);
    const genericIdea = insertBucketItem(user.id, {
      name: 'Tower',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    });
    const pinnedPlace = insertBucketItem(user.id, {
      name: 'Tower',
      lat: 48.8584,
      lng: 2.2945,
      country_code: null,
      target_date: null,
    });

    const key: BucketListIdentity = { name: 'Tower', lat: 48.8584, lng: 2.2945, country_code: null, target_date: null };
    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(pinnedPlace);
    expect(legacy).not.toBe(genericIdea);
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-007 (mutation-sensitive, country_code): two rows differing ONLY in country are distinct wishes', async () => {
    // Manually dropping `country_code: key.country_code` from `findDuplicate`'s filter
    // object and re-running this suite made this test go red (`ideaAnywhere` was returned
    // in place of `franceIdea`). Restored immediately; `findDuplicate` unchanged.
    const { user } = createUser(testDb);
    const ideaAnywhere = insertBucketItem(user.id, {
      name: 'Castle',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    });
    const franceIdea = insertBucketItem(user.id, {
      name: 'Castle',
      lat: null,
      lng: null,
      country_code: 'FR',
      target_date: null,
    });

    const key: BucketListIdentity = { name: 'Castle', lat: null, lng: null, country_code: 'FR', target_date: null };
    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(franceIdea);
    expect(legacy).not.toBe(ideaAnywhere);
    expect(repo).toEqual(legacy);
  });

  it('BLDUP-008 (mutation-sensitive, target_date): two rows differing ONLY in target date are distinct wishes', async () => {
    // Manually dropping `target_date: key.target_date` from `findDuplicate`'s filter
    // object and re-running this suite made this test go red (`undated` was returned in
    // place of `dated`). Restored immediately; `findDuplicate` unchanged.
    const { user } = createUser(testDb);
    const undated = insertBucketItem(user.id, {
      name: 'Museum',
      lat: null,
      lng: null,
      country_code: null,
      target_date: null,
    });
    const dated = insertBucketItem(user.id, {
      name: 'Museum',
      lat: null,
      lng: null,
      country_code: null,
      target_date: '2026-09-01',
    });

    const key: BucketListIdentity = {
      name: 'Museum',
      lat: null,
      lng: null,
      country_code: null,
      target_date: '2026-09-01',
    };
    const legacy = legacyFindDuplicate(user.id, key, null);
    const repo = await repoFindDuplicate(user.id, key, null);

    expect(legacy).toBe(dated);
    expect(legacy).not.toBe(undated);
    expect(repo).toEqual(legacy);
  });
});
