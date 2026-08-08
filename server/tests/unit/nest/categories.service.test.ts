/**
 * Unit tests for CategoriesService — CAT-SVC-001 through CAT-SVC-015.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 * The service is constructed directly (new CategoriesService(new DatabaseService(db)))
 * — no Nest container needed. (CAT-SVC-016 covered the deleted
 * categories.bridge; the plugin RPC host now injects CategoriesService directly.)
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
import { CategoriesService } from '../../../src/nest/categories/categories.service';

const svc = new CategoriesService(new DatabaseService(testDb));

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
  it('CAT-SVC-001 — returns an array (seeded defaults are present after migrations)', () => {
    // Migrations seed default categories, so the list is never empty in a fully initialized DB
    const cats = svc.list();
    expect(Array.isArray(cats)).toBe(true);
    expect(cats.length).toBeGreaterThan(0);
  });

  it('CAT-SVC-002 — results are ordered by name ascending (custom categories sort correctly)', () => {
    const { user } = createUser(testDb);
    svc.create(user.id, 'Zoo');
    svc.create(user.id, 'Aquarium');
    // Migrations seed default categories; verify ordering by checking our custom ones appear in sorted order
    const names = svc.list().map((c) => c.name);
    const aquariumIdx = names.indexOf('Aquarium');
    const zooIdx = names.indexOf('Zoo');
    expect(aquariumIdx).toBeGreaterThanOrEqual(0);
    expect(zooIdx).toBeGreaterThanOrEqual(0);
    expect(aquariumIdx).toBeLessThan(zooIdx);
  });

  it('CAT-SVC-003 — returns categories from all users (including seeded defaults)', () => {
    const { user: a } = createUser(testDb);
    const { user: b } = createUser(testDb);
    const before = svc.list().length;
    svc.create(a.id, 'Cat-A');
    svc.create(b.id, 'Cat-B');
    expect(svc.list()).toHaveLength(before + 2);
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('CAT-SVC-004 — creates a category with name, color, and icon', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'Restaurant', '#ff5500', '🍽️');
    expect(cat.name).toBe('Restaurant');
    expect(cat.color).toBe('#ff5500');
    expect(cat.icon).toBe('🍽️');
    expect(cat.user_id).toBe(user.id);
  });

  it('CAT-SVC-005 — defaults color to #6366f1 when not provided', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'Default Color');
    expect(cat.color).toBe('#6366f1');
  });

  it('CAT-SVC-006 — defaults icon to 📍 when not provided', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'Default Icon');
    expect(cat.icon).toBe('📍');
  });

  it('CAT-SVC-007 — returns the inserted row with an id', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'WithId');
    expect(typeof cat.id).toBe('number');
    expect(cat.id).toBeGreaterThan(0);
  });
});

// ── getById ───────────────────────────────────────────────────────────────────

describe('getById', () => {
  it('CAT-SVC-008 — returns category for a valid id', () => {
    const { user } = createUser(testDb);
    const created = svc.create(user.id, 'Find Me');
    const found = svc.getById(created.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Find Me');
  });

  it('CAT-SVC-009 — returns undefined for non-existent id', () => {
    expect(svc.getById(99999)).toBeUndefined();
  });

  it('CAT-SVC-010 — accepts string id (coerced by SQLite)', () => {
    const { user } = createUser(testDb);
    const created = svc.create(user.id, 'StringId');
    const found = svc.getById(String(created.id));
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('CAT-SVC-011 — updates name, color, and icon', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'Old', '#aaaaaa', '❓');
    const updated = svc.update(cat.id, 'New', '#bbbbbb', '✅');
    expect(updated.name).toBe('New');
    expect(updated.color).toBe('#bbbbbb');
    expect(updated.icon).toBe('✅');
  });

  it('CAT-SVC-012 — COALESCE: omitting name preserves existing name', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'KeepName', '#aaaaaa', '⭐');
    const updated = svc.update(cat.id, undefined, '#cccccc', '🔥');
    expect(updated.name).toBe('KeepName');
    expect(updated.color).toBe('#cccccc');
  });

  it('CAT-SVC-013 — COALESCE: omitting color preserves existing color', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'KeepColor', '#dddddd', '⭐');
    const updated = svc.update(cat.id, 'NewName', undefined, '🌟');
    expect(updated.name).toBe('NewName');
    expect(updated.color).toBe('#dddddd');
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('CAT-SVC-014 — deletes the category from the database', () => {
    const { user } = createUser(testDb);
    const cat = svc.create(user.id, 'ToDelete');
    svc.remove(cat.id);
    expect(svc.getById(cat.id)).toBeUndefined();
  });

  it('CAT-SVC-015 — deleting a non-existent category does not throw', () => {
    expect(() => svc.remove(99999)).not.toThrow();
  });
});
