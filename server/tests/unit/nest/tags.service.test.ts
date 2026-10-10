/**
 * Unit tests for TagsService — TAG-SVC-001 through TAG-SVC-015.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully. The
 * service is constructed directly (new TagsService(repo)) over a
 * TagsRepository resolved from the suite's own ORM (Plan 3a Task 3;
 * `createTestTagsRepo`/`sharedTestOrm` from tests/helpers/test-uow.ts, same
 * pattern as audit.service.test.ts) — no Nest container needed.
 * (TAG-SVC-016..020 covered the deleted tags.bridge; the plugin RPC host now
 * injects TagsService directly.)
 */
import { TagsService } from '../../../src/nest/tags/tags.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import type { TestOrm } from '../../helpers/test-orm';
import { createTestTagsRepo, sharedTestOrm } from '../../helpers/test-uow';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const testDb = createSnapshotTestDb();

let t: TestOrm;
let svc: TagsService;

beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  svc = new TagsService(await createTestTagsRepo(testDb));
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
  it('TAG-SVC-001 — returns empty array when user has no tags', async () => {
    const { user } = createUser(testDb);
    expect(await svc.list(user.id)).toEqual([]);
  });

  it('TAG-SVC-002 — returns only tags belonging to the user', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    await svc.create(a.id, 'A-Tag');
    await svc.create(b.id, 'B-Tag');
    const tags = await svc.list(a.id);
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('A-Tag');
  });

  it('TAG-SVC-003 — results are ordered by name ascending', async () => {
    const { user } = createUser(testDb);
    await svc.create(user.id, 'Zebra');
    await svc.create(user.id, 'Apple');
    await svc.create(user.id, 'Mango');
    const names = (await svc.list(user.id)).map((t) => t.name);
    expect(names).toEqual(['Apple', 'Mango', 'Zebra']);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('TAG-SVC-004 — creates a tag with provided name and color', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'Beach', '#ff0000');
    expect(tag.name).toBe('Beach');
    expect(tag.color).toBe('#ff0000');
    expect(tag.user_id).toBe(user.id);
  });

  it('TAG-SVC-005 — defaults to #10b981 when no color provided', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'Default');
    expect(tag.color).toBe('#10b981');
  });

  it('TAG-SVC-006 — returns the inserted row with an id', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'WithId');
    expect(typeof tag.id).toBe('number');
    expect(tag.id).toBeGreaterThan(0);
  });
});

// ── getByIdAndUser ────────────────────────────────────────────────────────────

describe('getByIdAndUser', () => {
  it('TAG-SVC-007 — returns the tag when id and user_id match', async () => {
    const { user } = createUser(testDb);
    const created = await svc.create(user.id, 'Find Me');
    const found = await svc.getByIdAndUser(created.id, user.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Find Me');
  });

  it('TAG-SVC-008 — returns undefined when tag belongs to different user', async () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const tag = await svc.create(a.id, 'Private');
    expect(await svc.getByIdAndUser(tag.id, b.id)).toBeUndefined();
  });

  it('TAG-SVC-009 — returns undefined for non-existent tag id', async () => {
    const { user } = createUser(testDb);
    expect(await svc.getByIdAndUser(99999, user.id)).toBeUndefined();
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('TAG-SVC-010 — updates both name and color', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'Old', '#aaaaaa');
    const updated = await svc.update(tag.id, 'New', '#bbbbbb');
    expect(updated.name).toBe('New');
    expect(updated.color).toBe('#bbbbbb');
  });

  it('TAG-SVC-011 — COALESCE: omitting name preserves existing name', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'KeepMe', '#aaaaaa');
    const updated = await svc.update(tag.id, undefined, '#cccccc');
    expect(updated.name).toBe('KeepMe');
    expect(updated.color).toBe('#cccccc');
  });

  it('TAG-SVC-012 — COALESCE: omitting color preserves existing color', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'ColorKeep', '#dddddd');
    const updated = await svc.update(tag.id, 'NewName', undefined);
    expect(updated.name).toBe('NewName');
    expect(updated.color).toBe('#dddddd');
  });

  // Coverage: B-H1 Class C (Plan 3b Task 7 review). The route's own
  // getByIdAndUser pre-check 404s a non-numeric id before update()/remove()
  // are ever reached in production — these call the service methods
  // directly, bypassing that pre-check, to exercise the toRowId guard's own
  // no-op branch (the race-condition path the pre-check doesn't cover).
  it('TAG-SVC-012b — update with a non-numeric id no-ops (toRowId guard, called directly)', async () => {
    const updated = await svc.update('abc', 'ShouldNotApply', '#000000');
    expect(updated).toBeUndefined();
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('TAG-SVC-013 — deletes the tag from the database', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'ToDelete');
    await svc.remove(tag.id);
    expect(await svc.getByIdAndUser(tag.id, user.id)).toBeUndefined();
  });

  it('TAG-SVC-014 — deleting a non-existent tag does not throw', async () => {
    await expect(svc.remove(99999)).resolves.not.toThrow();
  });

  it('TAG-SVC-015 — deleting one tag does not affect other tags', async () => {
    const { user } = createUser(testDb);
    const t1 = await svc.create(user.id, 'Keep');
    const t2 = await svc.create(user.id, 'Remove');
    await svc.remove(t2.id);
    const remaining = await svc.list(user.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(t1.id);
  });

  // Coverage: B-H1 Class C (Plan 3b Task 7 review), see TAG-SVC-012b's comment.
  it('TAG-SVC-015b — remove with a non-numeric id no-ops (toRowId guard, called directly)', async () => {
    const { user } = createUser(testDb);
    const tag = await svc.create(user.id, 'Untouched');
    await expect(svc.remove('abc')).resolves.not.toThrow();
    expect(await svc.getByIdAndUser(tag.id, user.id)).toBeDefined();
  });
});
