/**
 * Unit tests for CategoriesService — CAT-SVC-001 through CAT-SVC-015.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully. The
 * service is constructed directly (new CategoriesService(repo)) over a
 * CategoriesRepository resolved from the suite's own ORM (Plan 3a Task 3;
 * `createTestCategoriesRepo`/`sharedTestOrm` from tests/helpers/test-uow.ts,
 * same pattern as audit.service.test.ts) — no Nest container needed.
 * (CAT-SVC-016 covered the deleted categories.bridge; the plugin RPC host
 * now injects CategoriesService directly.)
 */
import { CategoriesService } from '../../../src/nest/categories/categories.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import type { TestOrm } from '../../helpers/test-orm';
import { createTestCategoriesRepo, sharedTestOrm } from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const testDb = createSnapshotTestDb();

let t: TestOrm;
let svc: CategoriesService;

beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  svc = new CategoriesService(await createTestCategoriesRepo(testDb));
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('CAT-SVC-001 — returns an array (seeded defaults are present after migrations)', async () => {
    // Migrations seed default categories, so the list is never empty in a fully initialized DB
    const cats = await svc.list();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
  });

  it('CAT-SVC-002 — results are ordered by name ascending (custom categories sort correctly)', async () => {
    const { user } = createUser(testDb);
    await svc.create(user.id, 'Zoo');
    await svc.create(user.id, 'Aquarium');
    // Migrations seed default categories; verify ordering by checking our custom ones appear in sorted order
    const names = (await svc.list()).map((c) => c.name);
    const aquariumIdx = names.indexOf('Aquarium');
    const zooIdx = names.indexOf('Zoo');
    expect(aquariumIdx).toBeGreaterThanOrEqual(0);
    expect(zooIdx).toBeGreaterThanOrEqual(0);
    expect(aquariumIdx).toBeLessThan(zooIdx);
  });

  it('CAT-SVC-003 — returns categories from all users (including seeded defaults)', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const before = (await svc.list()).length;
    await svc.create(a.id, 'Cat-A');
    await svc.create(b.id, 'Cat-B');
    expect(await svc.list()).toHaveLength(before + 2);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('CAT-SVC-004 — creates a category with name, color, and icon', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'Restaurant', '#ff5500', '🍽️');
    expect(cat.name).toBe('Restaurant');
    expect(cat.color).toBe('#ff5500');
    expect(cat.icon).toBe('🍽️');
    expect(cat.user_id).toBe(user.id);
  });

  it('CAT-SVC-005 — defaults color to #6366f1 when not provided', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'Default Color');
    expect(cat.color).toBe('#6366f1');
  });

  it('CAT-SVC-006 — defaults icon to 📍 when not provided', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'Default Icon');
    expect(cat.icon).toBe('📍');
  });

  it('CAT-SVC-007 — returns the inserted row with an id', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'WithId');
    expect(typeof cat.id).toBe('number');
    expect(cat.id).toBeGreaterThan(0);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe('getById', () => {
  it('CAT-SVC-008 — returns category for a valid id', async () => {
    const { user } = createUser(testDb);
    const created = await svc.create(user.id, 'Find Me');
    const found = await svc.getById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Find Me');
  });

  it('CAT-SVC-009 — returns undefined for non-existent id', async () => {
    expect(await svc.getById(99999)).toBeUndefined();
  });

  it('CAT-SVC-010 — accepts string id (coerced by SQLite)', async () => {
    const { user } = createUser(testDb);
    const created = await svc.create(user.id, 'StringId');
    const found = await svc.getById(String(created.id));
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('CAT-SVC-011 — updates name, color, and icon', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'Old', '#aaaaaa', '❓');
    const updated = await svc.update(cat.id, 'New', '#bbbbbb', '✅');
    expect(updated.name).toBe('New');
    expect(updated.color).toBe('#bbbbbb');
    expect(updated.icon).toBe('✅');
  });

  it('CAT-SVC-012 — COALESCE: omitting name preserves existing name', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'KeepName', '#aaaaaa', '⭐');
    const updated = await svc.update(cat.id, undefined, '#cccccc', '🔥');
    expect(updated.name).toBe('KeepName');
    expect(updated.color).toBe('#cccccc');
  });

  it('CAT-SVC-013 — COALESCE: omitting color preserves existing color', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'KeepColor', '#dddddd', '⭐');
    const updated = await svc.update(cat.id, 'NewName', undefined, '🌟');
    expect(updated.name).toBe('NewName');
    expect(updated.color).toBe('#dddddd');
  });

  // Coverage: B-H1 Class C (Plan 3b Task 7 review). The route's own getById
  // pre-check 404s a non-numeric id before update()/remove() are ever
  // reached in production — this calls the service method directly,
  // bypassing that pre-check, to exercise the toRowId guard's own no-op
  // branch (the race-condition path the pre-check doesn't cover).
  it('CAT-SVC-013b — update with a non-numeric id no-ops (toRowId guard, called directly)', async () => {
    const updated = await svc.update('abc', 'ShouldNotApply', '#000000', '🚫');
    expect(updated).toBeUndefined();
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('CAT-SVC-014 — deletes the category from the database', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'ToDelete');
    await svc.remove(cat.id);
    expect(await svc.getById(cat.id)).toBeUndefined();
  });

  it('CAT-SVC-015 — deleting a non-existent category does not throw', async () => {
    await expect(svc.remove(99999)).resolves.not.toThrow();
  });

  // Coverage: B-H1 Class C, see CAT-SVC-013b's comment.
  it('CAT-SVC-015b — remove with a non-numeric id no-ops (toRowId guard, called directly)', async () => {
    const { user } = createUser(testDb);
    const cat = await svc.create(user.id, 'Untouched');
    await expect(svc.remove('abc')).resolves.not.toThrow();
    expect(await svc.getById(cat.id)).toBeDefined();
  });
});
