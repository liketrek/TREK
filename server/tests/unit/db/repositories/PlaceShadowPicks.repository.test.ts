/**
 * PlaceShadowPicksRepository (Plan 3c Task 1, PS2–PS8): every statement
 * `PlaceShadowService` used to issue raw, on real rows. `place_shadow_picks`
 * has no other repository test file before this one.
 */
import { PlaceShadowPicks } from '../../../../src/db/entities/PlaceShadowPicks.entity';
import type {
  PlaceShadowPicksRepository,
  NewPlaceShadowPickRow,
} from '../../../../src/db/repositories/PlaceShadowPicks.repository';
import { dbNow } from '../../../../src/db/types';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { findRow, findRows, updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let picks: PlaceShadowPicksRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  picks = t.repo(PlaceShadowPicks);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function row(overrides: Partial<NewPlaceShadowPickRow> = {}): NewPlaceShadowPickRow {
  return {
    query: 'louvre',
    lang: null,
    bias_lat: null,
    bias_lng: null,
    source: 'nominatim',
    live_rank: 0,
    live_count: 5,
    picked_name: 'Louvre Museum',
    picked_lat: 48.8606,
    picked_lng: 2.3376,
    picked_place_id: null,
    ...overrides,
  };
}

function rawRow(id: number) {
  return findRow(t, PlaceShadowPicks, { id });
}

/** Every stored pick, oldest first. */
function storedPicks() {
  return findRows(t, PlaceShadowPicks, {}, { id: 'asc' });
}

/** `created_at` as `datetime('now', '-N seconds')` would write it. */
const secondsAgo = (seconds: number): string => dbNow(new Date(Date.now() - seconds * 1000));

describe('PlaceShadowPicksRepository.insertPick', () => {
  it('PSPICKREPO-001: inserts exactly the given columns, nullable ones included', async () => {
    await picks.insertPick(row());
    const [stored] = await storedPicks();
    expect(await rawRow(stored.id)).toMatchObject({
      query: 'louvre',
      source: 'nominatim',
      live_rank: 0,
      live_count: 5,
      lang: null,
    });
  });
});

describe('PlaceShadowPicksRepository.page', () => {
  it('PSPICKREPO-002: pages by id, oldest first, fetching size + 1 rows for the probe', async () => {
    await picks.insertPick(row({ query: 'a' }));
    await picks.insertPick(row({ query: 'b' }));
    await picks.insertPick(row({ query: 'c' }));

    const page = await picks.page(0, 2);
    expect(page).toHaveLength(3); // size + 1 probe row
    expect(page.map((r) => r.query)).toEqual(['a', 'b', 'c']);
  });

  it('PSPICKREPO-003: after excludes everything at or below that id', async () => {
    await picks.insertPick(row({ query: 'a' }));
    const firstId = (await storedPicks())[0].id;
    await picks.insertPick(row({ query: 'b' }));
    const page = await picks.page(firstId, 5);
    expect(page.map((r) => r.query)).toEqual(['b']);
  });
});

describe('PlaceShadowPicksRepository.totals / countBySource / countByLiveRank', () => {
  it('PSPICKREPO-004: totals on an empty table reports 0/null/null', async () => {
    expect(await picks.totals()).toEqual({ total: 0, oldest: null, newest: null });
  });

  it('PSPICKREPO-005: totals reports COUNT/MIN/MAX across every row', async () => {
    await picks.insertPick(row());
    await picks.insertPick(row());
    const stored = await storedPicks();
    await updateRows(t, PlaceShadowPicks, { id: stored[0].id }, { created_at: '2026-01-01 00:00:00' });
    await updateRows(t, PlaceShadowPicks, { id: stored[stored.length - 1].id }, { created_at: '2026-06-01 00:00:00' });
    const totals = await picks.totals();
    expect(totals).toEqual({ total: 2, oldest: '2026-01-01 00:00:00', newest: '2026-06-01 00:00:00' });
  });

  it('PSPICKREPO-006: countBySource groups and orders by count DESC', async () => {
    await picks.insertPick(row({ source: 'nominatim' }));
    await picks.insertPick(row({ source: 'nominatim' }));
    await picks.insertPick(row({ source: 'google' }));
    expect(await picks.countBySource()).toEqual([
      { source: 'nominatim', count: 2 },
      { source: 'google', count: 1 },
    ]);
  });

  // Task 1 fix review M1: `GROUP BY source` hands rows to JS in ASCENDING
  // source order (SQLite's GROUP BY temp b-tree); a stable JS
  // `Array.prototype.sort((a, b) => b.count - a.count)` therefore leaves ties
  // ascending by source, but SQLite's own (non-stable) `ORDER BY count DESC`
  // sorter emits ties in DESCENDING source order on the same data — two
  // different final row orders. `countBySource` orders in SQL, by the
  // `COUNT(*)` expression, so it reproduces the legacy statement's tie order
  // exactly instead of merely matching it on the (untied) case above.
  it('PSPICKREPO-006b: countBySource orders ties the same way the legacy ORDER BY count DESC statement does', async () => {
    for (const source of ['zeta', 'zeta', 'alpha', 'alpha', 'omega', 'omega', 'mid', 'beta']) {
      await picks.insertPick(row({ source }));
    }
    const rows = await picks.countBySource();
    const legacy = testDb
      // test-sql-allow: the legacy statement is the oracle the repository read is held to.
      .prepare('SELECT source, COUNT(*) AS count FROM place_shadow_picks GROUP BY source ORDER BY count DESC')
      .all();
    expect(rows).toEqual(legacy);
    expect(rows).toEqual([
      { source: 'zeta', count: 2 },
      { source: 'omega', count: 2 },
      { source: 'alpha', count: 2 },
      { source: 'mid', count: 1 },
      { source: 'beta', count: 1 },
    ]);
  });

  it('PSPICKREPO-007: countByLiveRank groups with no ORDER BY (caller buckets)', async () => {
    await picks.insertPick(row({ live_rank: 0 }));
    await picks.insertPick(row({ live_rank: 0 }));
    await picks.insertPick(row({ live_rank: 3 }));
    const rows = await picks.countByLiveRank();
    expect(rows).toEqual(
      expect.arrayContaining([
        { live_rank: 0, count: 2 },
        { live_rank: 3, count: 1 },
      ]),
    );
    expect(rows).toHaveLength(2);
  });
});

describe('PlaceShadowPicksRepository.deleteAll / purgeOlderThan', () => {
  it('PSPICKREPO-008: deleteAll wipes every row and returns the affected count', async () => {
    await picks.insertPick(row());
    await picks.insertPick(row());
    expect(await picks.deleteAll()).toBe(2);
    expect(await picks.totals()).toEqual({ total: 0, oldest: null, newest: null });
  });

  it('PSPICKREPO-009: purgeOlderThan removes exactly the rows older than the cutoff, proving the deleted set on a seeded table', async () => {
    await picks.insertPick(row({ query: 'old' }));
    await picks.insertPick(row({ query: 'new' }));
    const [oldRow, newRow] = await storedPicks();
    await updateRows(t, PlaceShadowPicks, { id: oldRow.id }, { created_at: secondsAgo(200 * 86_400) });
    await updateRows(t, PlaceShadowPicks, { id: newRow.id }, { created_at: secondsAgo(86_400) });

    const removed = await picks.purgeOlderThan(180);
    expect(removed).toBe(1);
    const survivors = await storedPicks();
    expect(survivors.map((r) => r.query)).toEqual(['new']);
  });

  it('PSPICKREPO-010: purgeOlderThan(0) removes rows created before right now, leaving nothing newer than the boundary', async () => {
    await picks.insertPick(row());
    const [{ id }] = await storedPicks();
    await updateRows(t, PlaceShadowPicks, { id }, { created_at: secondsAgo(1) });
    expect(await picks.purgeOlderThan(0)).toBe(1);
  });
});

// Task 9 fix wave (B-M3): relabelled. `page`/`totals`/`countBySource`/
// `countByLiveRank` all go through `find`/`qb().execute()`; `TrekRepository`
// applies `disableIdentityMap: true` to every read by default, so `page()`
// never has a live identity-map entry to bypass in the first place — this
// proves a DB round-trip (a row inserted after an unrelated wider read is
// visible), not an identity-map bypass.
describe('PlaceShadowPicksRepository — fresh after a raw UPDATE', () => {
  it('PSPICKREPO-011 (fresh after a raw UPDATE, not D-shape): a row inserted after an unrelated identity-map read is visible in the FIRST wider projection (page)', async () => {
    await picks.insertPick(row({ query: 'seed' }));
    // rule 20: the FIRST, wider setup read passes `disableIdentityMap: false`
    // explicitly and carries the column the later write targets (`query`) —
    // `find({})` with the base default merged in populates nothing.
    await t.repo(PlaceShadowPicks).find({}, { disableIdentityMap: false });
    await picks.insertPick(row({ query: 'fresh' }));
    const page = await picks.page(0, 10);
    expect(page.map((r) => r.query)).toEqual(['seed', 'fresh']);
  });
});
