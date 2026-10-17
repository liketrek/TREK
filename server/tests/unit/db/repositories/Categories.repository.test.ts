import { Categories } from '../../../../src/db/entities/Categories.entity';
import type { CategoriesRepository } from '../../../../src/db/repositories/Categories.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createCategory, createUser } from '../../../helpers/factories';
import { updateRows } from '../../../helpers/factories/rows';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let categories: CategoriesRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  categories = t.repo(Categories);
});
// `categories` is a KEEP_TABLES table (tests/helpers/test-db.ts): resetTestDb
// never clears it and re-seeds the ten defaults by name, so rows created by
// one `it` persist into the next within this file — every case below reads
// back by the id/name it just created rather than assuming a fresh table.
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

function rawCategory(id: number): unknown {
  // test-sql-allow: the row as SELECT * returns it is the oracle the repository's output is held to.
  return testDb.prepare('SELECT * FROM categories WHERE id = ?').get(id);
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

describe('CategoriesRepository', () => {
  describe('list', () => {
    it('CATREPO-001: a row read through list is the SELECT * row, key for key', async () => {
      const { user } = createUser(testDb);
      const created = createCategory(testDb, { name: 'RepoListRow', user_id: user.id });
      const rows = await categories.list();
      const row = rows.find((r) => r.id === created.id);
      expect(row).toStrictEqual(rawCategory(created.id));
    });

    it('CATREPO-002: ordered by name ascending', async () => {
      createCategory(testDb, { name: 'RepoZZZ' });
      createCategory(testDb, { name: 'RepoAAA' });
      const names = (await categories.list()).map((r) => r.name);
      expect(names.indexOf('RepoAAA')).toBeLessThan(names.indexOf('RepoZZZ'));
    });

    it('CATREPO-003: unfiltered — includes rows owned by any user and globally-shared (user_id NULL) rows alike', async () => {
      const { user: a } = createUser(testDb);
      const { user: b } = createUser(testDb);
      const before = (await categories.list()).length;
      createCategory(testDb, { name: 'RepoOwnedA', user_id: a.id });
      createCategory(testDb, { name: 'RepoOwnedB', user_id: b.id });
      createCategory(testDb, { name: 'RepoGlobal', user_id: null });
      expect(await categories.list()).toHaveLength(before + 3);
    });
  });

  describe('findById', () => {
    it('CATREPO-004: returns the row for a valid id', async () => {
      const created = createCategory(testDb, { name: 'RepoFindMe' });
      expect(await categories.findById(created.id)).toStrictEqual(rawCategory(created.id));
    });

    it('CATREPO-005: returns null for a non-existent id', async () => {
      expect(await categories.findById(99999999)).toBeNull();
    });

    it('CATREPO-006: no owner filter — a row owned by one user is found looked up plainly (no ownerId parameter exists on this method)', async () => {
      const { user } = createUser(testDb);
      const created = createCategory(testDb, { name: 'RepoAnyonesFind', user_id: user.id });
      expect((await categories.findById(created.id))?.id).toBe(created.id);
    });

    it('CATREPO-007: the scalar user_id twin hydrates without loading the user relation', async () => {
      const { user } = createUser(testDb);
      const created = createCategory(testDb, { name: 'RepoTwin', user_id: user.id });
      const entity = await t.repo(Categories).findOne({ id: created.id });
      expect(entity?.user_id).toBe(user.id);
      expect(entity?.user?.isInitialized()).toBe(false);
    });

    // Plan 3b Task 1 fix round (task-1-review.md B1): findById carries
    // `disableIdentityMap: true` — `{ id }` is exactly the primary key, so
    // without it this would risk being served from the identity map with
    // zero queries and the stale pre-UPDATE color. `queries === 1` proves
    // the real re-query happens.
    it('CATREPO-008: an UPDATE from another context on the same row then findById reads the new value, in one query', async () => {
      const created = createCategory(testDb, { name: 'RepoStale', color: '#111111' });
      expect((await categories.findById(created.id))?.color).toBe('#111111'); // populate the identity map
      await updateRows(t, Categories, { id: created.id }, { color: '#222222' });
      const { value, queries } = await withQueryCount(() => categories.findById(created.id));
      expect(value?.color).toBe('#222222');
      expect(queries).toBe(1);
    });
  });

  describe('createCategory', () => {
    it('CATREPO-009: inserts and returns exactly the row the legacy re-select returned', async () => {
      const { user } = createUser(testDb);
      const row = await categories.createCategory({
        name: 'RepoCreated',
        color: '#ff5500',
        icon: '🍽️',
        user_id: user.id,
      });
      expect(row).toStrictEqual(rawCategory(row.id));
      expect(row.name).toBe('RepoCreated');
      expect(row.color).toBe('#ff5500');
      expect(row.icon).toBe('🍽️');
      expect(row.user_id).toBe(user.id);
      expect(typeof row.created_at).toBe('string');
    });

    it('CATREPO-010: writes exactly what it is given — no defaulting inside the repository', async () => {
      const { user } = createUser(testDb);
      const row = await categories.createCategory({
        name: 'RepoNoDefault',
        color: 'literal-color',
        icon: 'literal-icon',
        user_id: user.id,
      });
      expect(row.color).toBe('literal-color');
      expect(row.icon).toBe('literal-icon');
    });

    it('CATREPO-010b: throws when the read-back after insert finds no row (coverage: the guard branch)', async () => {
      const { user } = createUser(testDb);
      const spy = vi.spyOn(categories, 'findById').mockResolvedValueOnce(null);
      await expect(
        categories.createCategory({ name: 'Ghost', color: '#000000', icon: '👻', user_id: user.id }),
      ).rejects.toThrow('createCategory: read-back after insert found no row');
      spy.mockRestore();
    });
  });

  describe('patch', () => {
    it('CATREPO-011: updates name, color, and icon when all three are given', async () => {
      const created = createCategory(testDb, { name: 'RepoOld', color: '#aaaaaa', icon: '❓' });
      const updated = await categories.patch(created.id, { name: 'RepoNew', color: '#bbbbbb', icon: '✅' });
      expect(updated).toStrictEqual(rawCategory(created.id));
      expect(updated?.name).toBe('RepoNew');
      expect(updated?.color).toBe('#bbbbbb');
      expect(updated?.icon).toBe('✅');
    });

    it('CATREPO-012: an omitted key is left untouched — does not touch other columns', async () => {
      const created = createCategory(testDb, { name: 'RepoKeepName', color: '#cccccc', icon: '⭐' });
      const updated = await categories.patch(created.id, { color: '#dddddd' });
      expect(updated?.name).toBe('RepoKeepName');
      expect(updated?.color).toBe('#dddddd');
      expect(updated?.icon).toBe('⭐');
    });

    it('CATREPO-013: an empty changes object leaves every column untouched', async () => {
      const created = createCategory(testDb, { name: 'RepoUnchanged', color: '#eeeeee', icon: '🔥' });
      const before = rawCategory(created.id);
      const updated = await categories.patch(created.id, {});
      expect(updated).toStrictEqual(before);
    });

    it('CATREPO-014: returns null for a non-existent id', async () => {
      expect(await categories.patch(99999999, { name: 'Nope' })).toBeNull();
    });

    it('CATREPO-014b: an empty changes object against a non-existent id returns null via the existence-check branch (coverage)', async () => {
      expect(await categories.patch(99999999, {})).toBeNull();
    });

    // Task 3 review, Important 1, consequence (a) — and Minor 1: the
    // identity map is populated through `list()` here, not `findById`, so
    // this doubles as the "list → raw UPDATE → patch" case the review
    // asked for. Without `refresh: true` in `patch`'s lookup, `icon` would
    // still read the pre-UPDATE 'OLD' (verified: fails without the fix).
    it('CATREPO-018: an untouched column reflects an UPDATE from another context made after the identity map was populated by list()', async () => {
      const created = createCategory(testDb, { name: 'RepoRaceIcon', color: '#aaaaaa', icon: 'OLD' });
      await categories.list(); // populate the identity map with icon: 'OLD'
      await updateRows(t, Categories, { id: created.id }, { icon: 'NEW' });
      const updated = await categories.patch(created.id, { color: '#bbbbbb' });
      expect(updated?.icon).toBe('NEW');
    });

    // Task 3 review, Important 1, consequence (b): without `refresh: true`,
    // MikroORM diffs the patch against the stale in-memory snapshot; when
    // the concurrent raw write and the patch happen to agree on the value,
    // no changeset is produced and the UPDATE is silently dropped even
    // though the method reports success. The raw-row assertion is what
    // catches it — `updated?.color` alone would still read '#111111'
    // either way (verified: fails without the fix).
    it('CATREPO-019: a patch matching a concurrent write from another context is not silently dropped', async () => {
      const created = createCategory(testDb, { name: 'RepoRaceColor', color: '#111111' });
      await categories.findById(created.id); // populate the identity map with '#111111'
      await updateRows(t, Categories, { id: created.id }, { color: '#333333' });
      const updated = await categories.patch(created.id, { color: '#111111' });
      expect(updated?.color).toBe('#111111');
      expect(rawCategory(created.id)).toMatchObject({ color: '#111111' });
    });

    // Task 3 review, Important 1, consequence (c): `remove` uses
    // `nativeDelete`, which does not clear the identity map, so a stale
    // patch afterwards could fabricate a row for an id that no longer
    // exists instead of returning `null` (verified: fails without the fix).
    it('CATREPO-020: patch after remove in the same request returns null, not a fabricated row', async () => {
      const created = createCategory(testDb, { name: 'RepoRaceDelete', color: '#444444' });
      await categories.findById(created.id); // populate the identity map
      await categories.remove(created.id);
      expect(await categories.patch(created.id, { color: '#555555' })).toBeNull();
    });
  });

  describe('remove', () => {
    it('CATREPO-015: deletes the row and returns the affected count', async () => {
      const created = createCategory(testDb, { name: 'RepoToDelete' });
      expect(await categories.remove(created.id)).toBe(1);
      expect(await categories.findById(created.id)).toBeNull();
    });

    it('CATREPO-016: removing a non-existent id returns 0 and does not throw', async () => {
      await expect(categories.remove(99999999)).resolves.toBe(0);
    });

    it('CATREPO-017: removing one row does not affect others', async () => {
      const keep = createCategory(testDb, { name: 'RepoKeep' });
      const gone = createCategory(testDb, { name: 'RepoGone' });
      await categories.remove(gone.id);
      expect(await categories.findById(keep.id)).not.toBeNull();
      expect(await categories.findById(gone.id)).toBeNull();
    });
  });

  describe("listIdName (Plan 3c Task 5, PL33 — PlacesService.importKmlPlaces' folder → category lookup)", () => {
    it('CATREPO-021: projects only id and name, no ORDER BY guaranteed, including a fresh row', async () => {
      const created = createCategory(testDb, { name: 'RepoIdName' });
      const rows = await categories.listIdName();
      const match = rows.find((r) => r.id === created.id);
      expect(match).toEqual({ id: created.id, name: 'RepoIdName' });
      // Only the two columns — no color/icon/user_id/created_at leaking through.
      expect(match ? Object.keys(match).sort() : []).toEqual(['id', 'name']);
    });

    it('CATREPO-022: includes every category row, seeded defaults and user-created alike', async () => {
      const before = await categories.listIdName();
      const created = createCategory(testDb, { name: 'RepoIdNameTwo' });
      const after = await categories.listIdName();
      expect(after.length).toBe(before.length + 1);
      expect(after.map((r) => r.id)).toContain(created.id);
    });
  });
});
