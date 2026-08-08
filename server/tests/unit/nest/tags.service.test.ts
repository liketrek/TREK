/**
 * Unit tests for TagsService — TAG-SVC-001 through TAG-SVC-015.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 * The service is constructed directly (new TagsService(new DatabaseService(db)))
 * — no Nest container needed. (TAG-SVC-016..020 covered the deleted
 * tags.bridge; the plugin RPC host now injects TagsService directly.)
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { TagsService } from '../../../src/nest/tags/tags.service';

const svc = new TagsService(new DatabaseService(testDb));

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('TAG-SVC-001 — returns empty array when user has no tags', () => {
    const { user } = createUser(testDb);
    expect(svc.list(user.id)).toEqual([]);
  });

  it('TAG-SVC-002 — returns only tags belonging to the user', () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    svc.create(a.id, 'A-Tag');
    svc.create(b.id, 'B-Tag');
    const tags = svc.list(a.id);
    expect(tags).toHaveLength(1);
    expect(tags[0].name).toBe('A-Tag');
  });

  it('TAG-SVC-003 — results are ordered by name ascending', () => {
    const { user } = createUser(testDb);
    svc.create(user.id, 'Zebra');
    svc.create(user.id, 'Apple');
    svc.create(user.id, 'Mango');
    const names = svc.list(user.id).map((t) => t.name);
    expect(names).toEqual(['Apple', 'Mango', 'Zebra']);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('TAG-SVC-004 — creates a tag with provided name and color', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'Beach', '#ff0000');
    expect(tag.name).toBe('Beach');
    expect(tag.color).toBe('#ff0000');
    expect(tag.user_id).toBe(user.id);
  });

  it('TAG-SVC-005 — defaults to #10b981 when no color provided', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'Default');
    expect(tag.color).toBe('#10b981');
  });

  it('TAG-SVC-006 — returns the inserted row with an id', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'WithId');
    expect(typeof tag.id).toBe('number');
    expect(tag.id).toBeGreaterThan(0);
  });
});

// ── getByIdAndUser ────────────────────────────────────────────────────────────

describe('getByIdAndUser', () => {
  it('TAG-SVC-007 — returns the tag when id and user_id match', () => {
    const { user } = createUser(testDb);
    const created = svc.create(user.id, 'Find Me');
    const found = svc.getByIdAndUser(created.id, user.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Find Me');
  });

  it('TAG-SVC-008 — returns undefined when tag belongs to different user', () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const tag = svc.create(a.id, 'Private');
    expect(svc.getByIdAndUser(tag.id, b.id)).toBeUndefined();
  });

  it('TAG-SVC-009 — returns undefined for non-existent tag id', () => {
    const { user } = createUser(testDb);
    expect(svc.getByIdAndUser(99999, user.id)).toBeUndefined();
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('TAG-SVC-010 — updates both name and color', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'Old', '#aaaaaa');
    const updated = svc.update(tag.id, 'New', '#bbbbbb');
    expect(updated.name).toBe('New');
    expect(updated.color).toBe('#bbbbbb');
  });

  it('TAG-SVC-011 — COALESCE: omitting name preserves existing name', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'KeepMe', '#aaaaaa');
    const updated = svc.update(tag.id, undefined, '#cccccc');
    expect(updated.name).toBe('KeepMe');
    expect(updated.color).toBe('#cccccc');
  });

  it('TAG-SVC-012 — COALESCE: omitting color preserves existing color', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'ColorKeep', '#dddddd');
    const updated = svc.update(tag.id, 'NewName', undefined);
    expect(updated.name).toBe('NewName');
    expect(updated.color).toBe('#dddddd');
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('TAG-SVC-013 — deletes the tag from the database', () => {
    const { user } = createUser(testDb);
    const tag = svc.create(user.id, 'ToDelete');
    svc.remove(tag.id);
    expect(svc.getByIdAndUser(tag.id, user.id)).toBeUndefined();
  });

  it('TAG-SVC-014 — deleting a non-existent tag does not throw', () => {
    expect(() => svc.remove(99999)).not.toThrow();
  });

  it('TAG-SVC-015 — deleting one tag does not affect other tags', () => {
    const { user } = createUser(testDb);
    const t1 = svc.create(user.id, 'Keep');
    const t2 = svc.create(user.id, 'Remove');
    svc.remove(t2.id);
    const remaining = svc.list(user.id);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(t1.id);
  });
});
