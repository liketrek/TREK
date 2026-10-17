import { Tags } from '../../../../src/db/entities/Tags.entity';
import type { TagsRepository } from '../../../../src/db/repositories/Tags.repository';
import { withRequestContext } from '../../../../src/nest/database/request-context';
import { UnitOfWork } from '../../../../src/nest/database/unit-of-work';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createPlace, createTag, createTrip, createUser } from '../../../helpers/factories';
import { tagPlace } from '../../../helpers/factories/places';
import { findRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tags: TagsRepository;
let uow: UnitOfWork;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tags = t.repo(Tags);
  uow = new UnitOfWork(t.em);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawTag(id: number): unknown {
  // test-sql-allow: the raw full row is the parity oracle the repository's reads are compared against.
  return testDb.prepare('SELECT * FROM tags WHERE id = ?').get(id);
}

/** The ids of the tags on the place, through the place_tags pivot, in tag id order. */
async function placeTagIds(placeId: number): Promise<number[]> {
  return (await findRows(t, Tags, { place_tags_inverse: placeId }, { id: 'asc' })).map((tag) => tag.id);
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

describe('TagsRepository', () => {
  describe('listByUser', () => {
    it('TAGREPO-001: a row read through listByUser is the SELECT * row, key for key', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'RepoListRow' });
      const [row] = await tags.listByUser(user.id);
      expect(row).toStrictEqual(rawTag(created.id));
    });

    it('TAGREPO-002: ordered by name ascending', async () => {
      const { user } = createUser(testDb);
      createTag(testDb, user.id, { name: 'Zebra' });
      createTag(testDb, user.id, { name: 'Apple' });
      createTag(testDb, user.id, { name: 'Mango' });
      expect((await tags.listByUser(user.id)).map((r) => r.name)).toEqual(['Apple', 'Mango', 'Zebra']);
    });

    it("TAGREPO-003: owner visibility — excludes another user's tags entirely (tags has no globally-shared row, unlike categories)", async () => {
      const { user: a } = createUser(testDb);
      const { user: b } = createUser(testDb);
      createTag(testDb, a.id, { name: 'MineA' });
      createTag(testDb, b.id, { name: 'MineB' });
      const rows = await tags.listByUser(a.id);
      expect(rows).toHaveLength(1);
      expect(rows[0].name).toBe('MineA');
    });

    it('TAGREPO-004: an owner with no tags gets an empty list', async () => {
      const { user } = createUser(testDb);
      expect(await tags.listByUser(user.id)).toEqual([]);
    });
  });

  describe('findByIdAndUser', () => {
    it('TAGREPO-005: finds a row the given user owns', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'FindMe' });
      expect(await tags.findByIdAndUser(created.id, user.id)).toStrictEqual(rawTag(created.id));
    });

    it('TAGREPO-006: owner visibility — refuses a tag owned by a different user', async () => {
      const { user: owner } = createUser(testDb);
      const { user: stranger } = createUser(testDb);
      const created = createTag(testDb, owner.id, { name: 'Private' });
      expect(await tags.findByIdAndUser(created.id, stranger.id)).toBeNull();
    });

    it('TAGREPO-007: returns null for a non-existent id', async () => {
      const { user } = createUser(testDb);
      expect(await tags.findByIdAndUser(99999999, user.id)).toBeNull();
    });

    it('TAGREPO-008: the scalar user_id twin hydrates without loading the user relation', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'Twin' });
      const entity = await t.repo(Tags).findOne({ id: created.id, user: user.id });
      expect(entity?.user_id).toBe(user.id);
      expect(entity?.user.isInitialized()).toBe(false);
    });

    // Task 7 review, B-L3: this pins "one query, fresh value" — it does NOT
    // isolate the `disableIdentityMap: true` ruling from a plain `refresh:
    // true` re-query, and it should not claim to. `findByIdAndUser`'s
    // filter is `(id, user_id)`, not the bare PK (`owned-lookup.ts`'s
    // `findOwnedByUser`), so it is not PK-only and always re-queries either
    // way — the real D-shape (identity-map write-back) proof lives on
    // `WEBAUTHN-CRED-REPO-017`/`OAUTHCLIENTREPO-016`/`INVREPO-017`, which
    // mutation-prove `disableIdentityMap: true` specifically. Same honesty
    // `SETTINGSREPO-012`'s comment already carries for the same reason.
    it('TAGREPO-009: a raw UPDATE on the same row then findByIdAndUser reads the new value, in one query', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'Stale', color: '#111111' });
      expect((await tags.findByIdAndUser(created.id, user.id))?.color).toBe('#111111'); // populate the identity map
      // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
      testDb.prepare('UPDATE tags SET color = ? WHERE id = ?').run('#222222', created.id);
      const { value, queries } = await withQueryCount(() => tags.findByIdAndUser(created.id, user.id));
      expect(value?.color).toBe('#222222');
      expect(queries).toBe(1);
    });
  });

  describe('createTag', () => {
    it('TAGREPO-010: inserts and returns exactly the row the legacy re-select returned', async () => {
      const { user } = createUser(testDb);
      const row = await tags.createTag({ user_id: user.id, name: 'Beach', color: '#ff0000' });
      expect(row).toStrictEqual(rawTag(row.id));
      expect(row.name).toBe('Beach');
      expect(row.color).toBe('#ff0000');
      expect(row.user_id).toBe(user.id);
      expect(typeof row.created_at).toBe('string');
    });

    it('TAGREPO-011: writes exactly what it is given — no defaulting inside the repository', async () => {
      const { user } = createUser(testDb);
      const row = await tags.createTag({ user_id: user.id, name: 'NoDefault', color: 'literal-color' });
      expect(row.color).toBe('literal-color');
    });

    it('TAGREPO-011b: throws when the read-back after insert finds no row (coverage: the guard branch)', async () => {
      const { user } = createUser(testDb);
      const spy = vi.spyOn(tags, 'findOne').mockResolvedValueOnce(null);
      await expect(tags.createTag({ user_id: user.id, name: 'Ghost', color: '#000000' })).rejects.toThrow(
        'createTag: read-back after insert found no row',
      );
      spy.mockRestore();
    });
  });

  describe('patch', () => {
    it('TAGREPO-012: updates both name and color when both are given', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'Old', color: '#aaaaaa' });
      const updated = await tags.patch(created.id, { name: 'New', color: '#bbbbbb' });
      expect(updated).toStrictEqual(rawTag(created.id));
      expect(updated?.name).toBe('New');
      expect(updated?.color).toBe('#bbbbbb');
    });

    it('TAGREPO-013: an omitted key is left untouched — does not touch other columns', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'KeepName', color: '#cccccc' });
      const updated = await tags.patch(created.id, { color: '#dddddd' });
      expect(updated?.name).toBe('KeepName');
      expect(updated?.color).toBe('#dddddd');
    });

    it('TAGREPO-014: not scoped by user_id, matching the legacy statement exactly — patches a row regardless of which user owns it', async () => {
      const { user: owner } = createUser(testDb);
      const created = createTag(testDb, owner.id, { name: 'AnyonesToPatch' });
      const updated = await tags.patch(created.id, { name: 'Patched' });
      expect(updated?.name).toBe('Patched');
    });

    it('TAGREPO-015: returns null for a non-existent id', async () => {
      expect(await tags.patch(99999999, { name: 'Nope' })).toBeNull();
    });

    it('TAGREPO-015b: an empty changes object leaves every column untouched (coverage: the existence-check branch)', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'Unchanged', color: '#eeeeee' });
      const before = rawTag(created.id);
      const updated = await tags.patch(created.id, {});
      expect(updated).toStrictEqual(before);
    });

    it('TAGREPO-015c: an empty changes object against a non-existent id returns null via the existence-check branch (coverage)', async () => {
      expect(await tags.patch(99999999, {})).toBeNull();
    });

    it('TAGREPO-015d: the row vanishing between the update and the final re-read returns null (race-condition guard, coverage)', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'RaceTarget' });
      const spy = vi.spyOn(tags, 'findOne').mockResolvedValueOnce(null);
      expect(await tags.patch(created.id, { name: 'ShouldNotMatter' })).toBeNull();
      spy.mockRestore();
    });

    // Task 3 review, Important 1, consequence (a) — and Minor 1: the
    // identity map is populated through `listByUser()` here, not
    // `findByIdAndUser`, so this doubles as the "list → raw UPDATE →
    // patch" case the review asked for. Without `refresh: true` in
    // `patch`'s lookup, `name` would still read the pre-UPDATE 'OLD'
    // (verified: fails without the fix).
    it('TAGREPO-019: an untouched column reflects a raw UPDATE made after the identity map was populated by listByUser()', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'OLD', color: '#aaaaaa' });
      await tags.listByUser(user.id); // populate the identity map with name: 'OLD'
      // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
      testDb.prepare('UPDATE tags SET name = ? WHERE id = ?').run('NEW', created.id);
      const updated = await tags.patch(created.id, { color: '#bbbbbb' });
      expect(updated?.name).toBe('NEW');
    });

    // Task 3 review, Important 1, consequence (b): without `refresh: true`,
    // MikroORM diffs the patch against the stale in-memory snapshot; when
    // the concurrent raw write and the patch happen to agree on the value,
    // no changeset is produced and the UPDATE is silently dropped even
    // though the method reports success. The raw-row assertion is what
    // catches it — `updated?.color` alone would still read '#111111'
    // either way (verified: fails without the fix).
    it('TAGREPO-020: a patch matching a concurrent raw write is not silently dropped', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'RaceColor', color: '#111111' });
      await tags.findByIdAndUser(created.id, user.id); // populate the identity map with '#111111'
      // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
      testDb.prepare('UPDATE tags SET color = ? WHERE id = ?').run('#333333', created.id);
      const updated = await tags.patch(created.id, { color: '#111111' });
      expect(updated?.color).toBe('#111111');
      expect(rawTag(created.id)).toMatchObject({ color: '#111111' });
    });

    // Task 3 review, Important 1, consequence (c): `remove` uses
    // `nativeDelete`, which does not clear the identity map, so a stale
    // patch afterwards could fabricate a row for an id that no longer
    // exists instead of returning `null` (verified: fails without the fix).
    it('TAGREPO-021: patch after remove in the same request returns null, not a fabricated row', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'RaceDelete', color: '#444444' });
      await tags.findByIdAndUser(created.id, user.id); // populate the identity map
      await tags.remove(created.id);
      expect(await tags.patch(created.id, { color: '#555555' })).toBeNull();
    });
  });

  describe('remove', () => {
    it('TAGREPO-016: deletes the row and returns the affected count', async () => {
      const { user } = createUser(testDb);
      const created = createTag(testDb, user.id, { name: 'ToDelete' });
      expect(await tags.remove(created.id)).toBe(1);
      expect(await tags.findByIdAndUser(created.id, user.id)).toBeNull();
    });

    it('TAGREPO-017: removing a non-existent id returns 0 and does not throw', async () => {
      await expect(tags.remove(99999999)).resolves.toBe(0);
    });

    it('TAGREPO-018: removing one tag does not affect others', async () => {
      const { user } = createUser(testDb);
      const keep = createTag(testDb, user.id, { name: 'Keep' });
      const gone = createTag(testDb, user.id, { name: 'Gone' });
      await tags.remove(gone.id);
      const remaining = await tags.listByUser(user.id);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(keep.id);
    });
  });

  // Plan 3c Task 1 (QH1): the batch tag-by-place loader behind
  // `QueryHelpersService.loadTagsByPlaceIds`, moved off `query-helpers.service.ts`.
  describe('listForPlaces', () => {
    function attach(tagId: number, placeId: number): Promise<void> {
      return tagPlace(t, placeId, [tagId]);
    }

    it('LISTFORPLACESREPO-001: an empty placeIds array short-circuits to [] without querying', async () => {
      const { value, queries } = await withQueryCount(() => tags.listForPlaces([]));
      expect(value).toEqual([]);
      expect(queries).toBe(0);
    });

    it('LISTFORPLACESREPO-002: non-compact returns every tags column except the join key, plus place_id', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      const tag = createTag(testDb, user.id, { name: 'Beach', color: '#ff0000' });
      await attach(tag.id, place.id);

      const rows = await tags.listForPlaces([place.id]);
      expect(rows).toEqual([
        {
          id: tag.id,
          user_id: user.id,
          name: 'Beach',
          color: '#ff0000',
          created_at: (rawTag(tag.id) as { created_at: string }).created_at,
          place_id: place.id,
        },
      ]);
    });

    it('LISTFORPLACESREPO-003: compact returns {id, name, color, created_at, place_id} — no user_id', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      const tag = createTag(testDb, user.id, { name: 'Compact', color: '#00ff00' });
      await attach(tag.id, place.id);

      const rows = await tags.listForPlaces([place.id], { compact: true });
      expect(rows).toEqual([
        {
          id: tag.id,
          name: 'Compact',
          color: '#00ff00',
          created_at: (rawTag(tag.id) as { created_at: string }).created_at,
          place_id: place.id,
        },
      ]);
      expect(rows[0]).not.toHaveProperty('user_id');
    });

    it('LISTFORPLACESREPO-004: one row per (tag, place) pair — the same tag on two places yields two rows', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const placeA = createPlace(testDb, trip.id, { name: 'A' });
      const placeB = createPlace(testDb, trip.id, { name: 'B' });
      const tag = createTag(testDb, user.id);
      await attach(tag.id, placeA.id);
      await attach(tag.id, placeB.id);

      const rows = await tags.listForPlaces([placeA.id, placeB.id]);
      expect(rows.map((r) => r.place_id).sort()).toEqual([placeA.id, placeB.id].sort());
    });

    it('LISTFORPLACESREPO-005: a place with no tags contributes no rows', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      expect(await tags.listForPlaces([place.id])).toEqual([]);
    });

    // Task 9 fix wave (B-M3): relabelled. `listForPlaces` is a
    // `qb().execute('all', false)` projection, and the base default leaves
    // the identity map disabled for every read anyway — there is no live
    // identity-map entry here to bypass. This proves a DB round-trip, not an
    // identity-map bypass.
    it('LISTFORPLACESREPO-006 (fresh after a raw UPDATE, not D-shape): a tag written via place_tags is visible in the FIRST wider (non-compact) projection', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const place = createPlace(testDb, trip.id);
      const tag = createTag(testDb, user.id, { name: 'Fresh' });
      // rule 20: the FIRST, wider setup read passes `disableIdentityMap:
      // false` explicitly and carries the column the later write targets
      // (`name`) — `find({})` with the base default merged in populates
      // nothing.
      await t.repo(Tags).find({}, { disableIdentityMap: false });
      await attach(tag.id, place.id);
      // test-sql-allow: the out-of-band write this case is about has to bypass every EntityManager, the one under test included.
      testDb.prepare('UPDATE tags SET name = ? WHERE id = ?').run('Renamed', tag.id);
      const rows = await tags.listForPlaces([place.id]);
      expect(rows[0]?.name).toBe('Renamed');
    });
  });
});

// ---------------------------------------------------------------------------
// Plan 3c Task 4 — findByIds (PL2) and the place_tags pivot writes (PL5/PL12/PL13).
// ---------------------------------------------------------------------------

describe('TagsRepository.findByIds (PL2)', () => {
  it('FINDBYIDSREPO-001: returns id + user_id for the matching ids, empty input short-circuits', async () => {
    const { user: ownerA } = createUser(testDb);
    const { user: ownerB } = createUser(testDb, { username: 'owner_b' });
    const tagA = createTag(testDb, ownerA.id, { name: 'A' });
    const tagB = createTag(testDb, ownerB.id, { name: 'B' });
    const rows = await tags.findByIds([tagA.id, tagB.id, 999999]);
    expect(rows.map((r) => ({ id: r.id, user_id: r.user_id })).sort((a, b) => a.id - b.id)).toEqual(
      [
        { id: tagA.id, user_id: ownerA.id },
        { id: tagB.id, user_id: ownerB.id },
      ].sort((a, b) => a.id - b.id),
    );
    expect(await tags.findByIds([])).toEqual([]);
  });
});

describe('TagsRepository.insertIgnore / deleteForPlace (PL5/PL12/PL13 — place_tags pivot)', () => {
  it('PLACETAGSREPO-001: insertIgnore attaches every listed tag, ignoring a duplicate pair', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tagA = createTag(testDb, user.id, { name: 'A' });
    const tagB = createTag(testDb, user.id, { name: 'B' });
    await tags.insertIgnore(place.id, [tagA.id, tagB.id]);
    // Re-run with an overlapping id — the pre-existing pair must not error or duplicate.
    await tags.insertIgnore(place.id, [tagA.id]);
    const rows = await placeTagIds(place.id);
    expect([...rows].sort((a, b) => a - b)).toEqual([tagA.id, tagB.id].sort((a, b) => a - b));
  });

  it('PLACETAGSREPO-002: insertIgnore with an empty array is a no-op', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    await tags.insertIgnore(place.id, []);
    const rows = await placeTagIds(place.id);
    expect(rows).toEqual([]);
  });

  it("PLACETAGSREPO-003: deleteForPlace removes every row for that place, leaving other places' tags alone", async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const other = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id, { name: 'Shared' });
    await tags.insertIgnore(place.id, [tag.id]);
    await tags.insertIgnore(other.id, [tag.id]);
    await tags.deleteForPlace(place.id);
    expect(await placeTagIds(place.id)).toEqual([]);
    expect(await placeTagIds(other.id)).toHaveLength(1);
  });

  // Task 9 fix wave (B-M5, the OAUTHTOKREPO-012/REANCHORDAY-003 rollback
  // shape): both Kysely pivot writes join the ambient `uow.transactional`
  // rather than autocommitting on their own — a thrown error after the
  // statement rolls the write back, and the raw read afterwards proves the
  // pre-transaction state.
  it('PLACETAGSREPO-006: insertIgnore inside a uow.transactional that then ROLLS BACK attaches nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id);

    let caught: unknown;
    try {
      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          await tags.insertIgnore(place.id, [tag.id]);
          throw new Error('force rollback');
        });
      });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('force rollback');

    expect(await placeTagIds(place.id)).toEqual([]);
  });

  it('PLACETAGSREPO-007: deleteForPlace inside a uow.transactional that then ROLLS BACK leaves the pairs in place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id);
    await tags.insertIgnore(place.id, [tag.id]);

    let caught: unknown;
    try {
      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          await tags.deleteForPlace(place.id);
          throw new Error('force rollback');
        });
      });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('force rollback');

    expect(await placeTagIds(place.id)).toHaveLength(1);
  });
});

// ── Plan 3c Task 8 (`TripsService.copy`, TP46) — additive ───────────────────

describe('TagsRepository.listPlaceTagsForTrip (TP46)', () => {
  it('PLACETAGSREPO-004: every place_tags pair for every place of the trip, scoped via the places join', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const otherPlace = createPlace(testDb, other.id);
    const tagA = createTag(testDb, user.id, { name: 'A' });
    const tagB = createTag(testDb, user.id, { name: 'B' });
    await tags.insertIgnore(place.id, [tagA.id, tagB.id]);
    await tags.insertIgnore(otherPlace.id, [tagA.id]);

    const rows = await tags.listPlaceTagsForTrip(trip.id);
    expect(rows.map((r) => r.tag_id).sort((a, b) => a - b)).toEqual([tagA.id, tagB.id].sort((a, b) => a - b));
    expect(rows.every((r) => r.place_id === place.id)).toBe(true);
  });

  it('PLACETAGSREPO-005: a trip with no tagged places returns []', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id);
    expect(await tags.listPlaceTagsForTrip(trip.id)).toEqual([]);
  });

  // Task 9 fix wave (B-M5, the OAUTHTOKREPO-012 read shape): `listPlaceTagsForTrip`
  // is a Kysely read that joins the ambient `uow.transactional` rather than
  // opening its own connection — it sees an uncommitted write made earlier
  // in the SAME open transaction, and once that transaction rolls back the
  // pair is gone again, proven by a raw read afterwards.
  it('PLACETAGSREPO-008: sees an uncommitted insertIgnore inside the SAME open transaction; a ROLLBACK erases it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const tag = createTag(testDb, user.id);

    let caught: unknown;
    try {
      await withRequestContext(t.orm, async () => {
        await uow.transactional(async () => {
          await tags.insertIgnore(place.id, [tag.id]);
          const seenInTransaction = await tags.listPlaceTagsForTrip(trip.id);
          expect(seenInTransaction).toEqual([{ place_id: place.id, tag_id: tag.id }]);
          throw new Error('force rollback');
        });
      });
    } catch (e) {
      caught = e;
    }
    expect((caught as Error).message).toBe('force rollback');

    expect(await tags.listPlaceTagsForTrip(trip.id)).toEqual([]);
    expect(await placeTagIds(place.id)).toEqual([]);
  });
});
