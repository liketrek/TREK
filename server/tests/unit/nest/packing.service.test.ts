/**
 * Unit tests for the DI-native PackingService — PACK-SVC-001 through
 * PACK-SVC-049 moved from the legacy tests/unit/services/packingService.test.ts
 * (real in-memory SQLite so the SQL logic is exercised faithfully), plus the
 * wrapper-helper cases (canEdit, the #858 broadcast scoping, getItemPrivacy,
 * notifyTagged) carried over from the old delegation suite — now running
 * against real SQL — PACK-SVC-050 pinning the packing.bridge delegation, and
 * PACK-SVC-051..053 pinning the post-migration fixes over the legacy quirks
 * ('Other' category default, bodyKeys-gated weight_limit_grams, quantity clamp).
 *
 * The trailing "Admin template CRUD" blocks carry ADMIN-SVC-031..044 and
 * ADMIN-SVC-056..064 over from tests/unit/services/adminService.test.ts with
 * their IDs preserved — those functions moved into PackingService with the
 * 2026-08 admin fold, since this service already owned all three template
 * tables.
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
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

const checkPermission = vi.fn(() => true);
const permissionsStub = { checkPermission } as unknown as PermissionsService;

const { send } = vi.hoisted(() => ({ send: vi.fn(() => Promise.resolve()) }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, createTrip, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { PackingService } from '../../../src/nest/packing/packing.service';
// Was packing.bridge, deleted with the other three that had no consumer outside the
// container. The assertions stayed; they point at the service now.
const bridgeListItems = (tripId: string | number, viewerId?: number) => svc.listItems(tripId, viewerId);
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { notificationsStub } from '../../helpers/notifications';

const svc = new PackingService(new DatabaseService(testDb), permissionsStub, new RealtimeService(), notificationsStub(send));

// ── Lifecycle ─────────────────────────────────────────────────────────────────

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  vi.clearAllMocks();
});

afterAll(() => {
  testDb.close();
});

// ── saveAsTemplate ────────────────────────────────────────────────────────────

describe('saveAsTemplate', () => {
  it('PACK-SVC-001: saves packing items as a template with correct categories and item count', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Shirt', 'Clothes', 0);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Shorts', 'Clothes', 1);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Toothbrush', 'Toiletries', 2);

    const result = svc.saveAsTemplate(trip.id, user.id, 'My Template');

    expect(result).not.toBeNull();
    expect(result!.name).toBe('My Template');
    expect(result!.categoryCount).toBe(2);
    expect(result!.itemCount).toBe(3);

    const template = testDb.prepare('SELECT * FROM packing_templates WHERE id = ?').get(result!.id) as any;
    expect(template).toBeDefined();
    expect(template.name).toBe('My Template');
    expect(template.created_by).toBe(user.id);
  });

  it('PACK-SVC-002: returns null when trip has no packing items', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = svc.saveAsTemplate(trip.id, user.id, 'Empty');

    expect(result).toBeNull();
  });
});

// ── listTemplates ───────────────────────────────────────────────────────────────

describe('listTemplates', () => {
  it('PACK-SVC-LIST-001: returns templates with id, name and item_count', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Shirt', 'Clothes', 0);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Toothbrush', 'Toiletries', 1);
    const saved = svc.saveAsTemplate(trip.id, user.id, 'Weekend');

    const templates = svc.listTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({ id: saved!.id, name: 'Weekend', item_count: 2 });
  });

  it('PACK-SVC-LIST-002: returns an empty array when no templates exist', () => {
    expect(svc.listTemplates()).toEqual([]);
  });
});

// ── applyTemplate ─────────────────────────────────────────────────────────────

/** A one-category template with the given item names. Returns its id. */
function seedTemplate(userId: number, itemNames: string[]): number {
  const templateId = testDb.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)').run('Camping', userId).lastInsertRowid as number;
  const catId = testDb.prepare('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, ?)').run(templateId, 'Gear', 0).lastInsertRowid as number;
  itemNames.forEach((name, i) => {
    testDb.prepare('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)').run(catId, name, i);
  });
  return templateId;
}

describe('applyTemplate', () => {
  it('PACK-SVC-003: adds template items to a trip packing list', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Insert a template with one category and two items directly
    const templateResult = testDb.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)').run('Camping', user.id);
    const templateId = templateResult.lastInsertRowid as number;

    const catResult = testDb.prepare('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, ?)').run(templateId, 'Gear', 0);
    const catId = catResult.lastInsertRowid as number;

    testDb.prepare('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)').run(catId, 'Tent', 0);
    testDb.prepare('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, ?)').run(catId, 'Sleeping Bag', 1);

    const result = svc.applyTemplate(trip.id, templateId);

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect((result as any[]).length).toBe(2);

    const items = testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(trip.id) as any[];
    expect(items.length).toBe(2);
    expect(items.map((i: any) => i.name)).toContain('Tent');
    expect(items.map((i: any) => i.name)).toContain('Sleeping Bag');
  });

  it('PACK-SVC-004: returns null when template has no items', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const templateResult = testDb.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, ?)').run('Empty Template', user.id);
    const templateId = templateResult.lastInsertRowid as number;

    const result = svc.applyTemplate(trip.id, templateId);

    expect(result).toBeNull();
  });

  // #1565: the applied items must land in the view the user is on, not always Common.
  it('PACK-SVC-046: applies into the personal list when visibility is personal', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    const result = svc.applyTemplate(trip.id, templateId, 'personal', user.id) as any[];

    expect(result[0].is_private).toBe(1);
    expect(result[0].owner_id).toBe(user.id);
    expect(svc.listItems(trip.id, user.id).filter((i: any) => i.is_private)).toHaveLength(1);
  });

  it('PACK-SVC-047: a personally applied template stays hidden from other members', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(trip.id, other.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    svc.applyTemplate(trip.id, templateId, 'personal', user.id);

    expect(svc.listItems(trip.id, other.id)).toHaveLength(0);
  });

  it('PACK-SVC-048: applies into the common pool by default, leaving items unowned', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    const result = svc.applyTemplate(trip.id, templateId, 'common', user.id) as any[];

    expect(result[0].is_private).toBe(0);
    // Unowned, so any member may still re-share it (setItemSharing claims a null owner).
    expect(result[0].owner_id).toBeNull();
  });

  it('PACK-SVC-049: falls back to common when no owner is given, so items stay visible', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    // A private item with no owner would be invisible to everyone.
    const result = svc.applyTemplate(trip.id, templateId, 'personal') as any[];

    expect(result[0].is_private).toBe(0);
    expect(svc.listItems(trip.id, user.id)).toHaveLength(1);
  });
});

// ── createBag / deleteBag ─────────────────────────────────────────────────────

describe('createBag / deleteBag', () => {
  it('PACK-SVC-005: createBag inserts a bag and returns it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = svc.createBag(trip.id, { name: 'Carry-On', color: '#ff0000' }) as any;

    expect(result).not.toBeNull();
    expect(result.name).toBe('Carry-On');
    expect(result.color).toBe('#ff0000');
    expect(result.trip_id).toBe(trip.id);

    const bag = testDb.prepare('SELECT * FROM packing_bags WHERE id = ?').get(result.id) as any;
    expect(bag).toBeDefined();
    expect(bag.name).toBe('Carry-On');
  });

  it('PACK-SVC-006: deleteBag removes the bag and returns true', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const bag = svc.createBag(trip.id, { name: 'Checked Bag' }) as any;
    expect(bag).not.toBeNull();

    const deleted = svc.deleteBag(trip.id, bag.id);

    expect(deleted).toBe(true);

    const row = testDb.prepare('SELECT * FROM packing_bags WHERE id = ?').get(bag.id);
    expect(row).toBeUndefined();
  });

  it('PACK-SVC-007: deleteBag returns false for non-existent bag', () => {
    const result = svc.deleteBag(1, 99999);

    expect(result).toBe(false);
  });
});

// ── setBagMembers ─────────────────────────────────────────────────────────────

describe('setBagMembers', () => {
  it('PACK-SVC-008: sets bag members (replaces existing)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bag = svc.createBag(trip.id, { name: 'Main Bag' }) as any;

    const result = svc.setBagMembers(trip.id, bag.id, [user.id]) as any[];

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].user_id).toBe(user.id);
  });

  it('PACK-SVC-009: setBagMembers with empty array clears all members', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bag = svc.createBag(trip.id, { name: 'Main Bag' }) as any;

    // First add a member
    svc.setBagMembers(trip.id, bag.id, [user.id]);

    // Then clear
    const result = svc.setBagMembers(trip.id, bag.id, []) as any[];

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('PACK-SVC-010: setBagMembers returns null for non-existent bag', () => {
    const result = svc.setBagMembers(1, 99999, []);

    expect(result).toBeNull();
  });

  it('PACK-SVC-010a: setBagMembers drops a user who is not on the trip roster', () => {
    const { user } = createUser(testDb);
    const outsider = createUser(testDb).user;
    const trip = createTrip(testDb, user.id);
    const bag = svc.createBag(trip.id, { name: 'Main Bag' }) as any;

    // owner is on the roster; the outsider (not owner, not a member) must be filtered out
    const result = svc.setBagMembers(trip.id, bag.id, [user.id, outsider.id]) as any[];

    const ids = result.map((m) => m.user_id);
    expect(ids).toContain(user.id);
    expect(ids).not.toContain(outsider.id);
  });

  it('PACK-SVC-010b: updateBag ignores an off-roster user_id, leaving the bag unassigned', () => {
    const { user } = createUser(testDb);
    const outsider = createUser(testDb).user;
    const trip = createTrip(testDb, user.id);
    const bag = svc.createBag(trip.id, { name: 'Main Bag' }) as any;

    // assigning to an outsider must not stick — the CASE keeps user_id null
    svc.updateBag(trip.id, bag.id, { user_id: outsider.id }, ['user_id']);
    const stored = testDb.prepare('SELECT user_id FROM packing_bags WHERE id = ?').get(bag.id) as { user_id: number | null };
    expect(stored.user_id).toBeNull();

    // assigning to the owner (on the roster) does stick
    svc.updateBag(trip.id, bag.id, { user_id: user.id }, ['user_id']);
    const stored2 = testDb.prepare('SELECT user_id FROM packing_bags WHERE id = ?').get(bag.id) as { user_id: number | null };
    expect(stored2.user_id).toBe(user.id);
  });
});

// ── bulkImport with bag field ─────────────────────────────────────────────────

describe('bulkImport with bag field', () => {
  it('PACK-SVC-011: bulk import with bag field creates the bag if it does not exist', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = svc.bulkImport(trip.id, [{ name: 'Shirt', bag: 'Carry-On' }]);

    expect(result).toHaveLength(1);
    expect(result[0]).toBeDefined();

    const bags = testDb.prepare('SELECT * FROM packing_bags WHERE trip_id = ? AND name = ?').all(trip.id, 'Carry-On') as any[];
    expect(bags).toHaveLength(1);

    const items = testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(trip.id) as any[];
    expect(items).toHaveLength(1);
    expect(items[0].bag_id).toBe(bags[0].id);
  });

  it('PACK-SVC-012: bulk import with same bag name reuses existing bag', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = svc.bulkImport(trip.id, [
      { name: 'Shirt', bag: 'Carry-On' },
      { name: 'Pants', bag: 'Carry-On' },
    ]);

    expect(result).toHaveLength(2);

    const bags = testDb.prepare('SELECT * FROM packing_bags WHERE trip_id = ? AND name = ?').all(trip.id, 'Carry-On') as any[];
    expect(bags).toHaveLength(1);

    const items = testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(trip.id) as any[];
    expect(items).toHaveLength(2);
    expect(items[0].bag_id).toBe(bags[0].id);
    expect(items[1].bag_id).toBe(bags[0].id);
  });
});

// ── bulkImport with quantity field ────────────────────────────────────────────

describe('bulkImport with quantity field', () => {
  it('PACK-SVC-013: bulk import respects per-item quantity, defaults to 1, and clamps out-of-range', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    svc.bulkImport(trip.id, [
      { name: 'Socks', quantity: 5 },
      { name: 'Toothbrush' },
      { name: 'Batteries', quantity: 9999 },
      { name: 'Charger', quantity: 0 },
    ]);

    const byName = (n: string) =>
      testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ? AND name = ?').get(trip.id, n) as any;

    expect(byName('Socks').quantity).toBe(5);
    expect(byName('Toothbrush').quantity).toBe(1);
    expect(byName('Batteries').quantity).toBe(999);
    expect(byName('Charger').quantity).toBe(1);
  });
});

// ── Private items (#858) ──────────────────────────────────────────────────────

describe('private items (#858)', () => {
  it('PACK-SVC-014: createItem stamps the owner and is_private flag', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const shared = svc.createItem(trip.id, { name: 'Tent' }, user.id) as any;
    const secret = svc.createItem(trip.id, { name: 'Gift', is_private: true }, user.id) as any;

    expect(shared.is_private).toBe(0);
    expect(shared.owner_id).toBe(user.id);
    expect(secret.is_private).toBe(1);
    expect(secret.owner_id).toBe(user.id);
  });

  it('PACK-SVC-015: listItems hides another member\'s private items but shows the owner theirs', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    svc.createItem(trip.id, { name: 'Shared' }, owner.id);
    svc.createItem(trip.id, { name: 'Private', is_private: true }, owner.id);

    const ownerView = svc.listItems(trip.id, owner.id) as any[];
    const otherView = svc.listItems(trip.id, other.id) as any[];
    const unscoped = svc.listItems(trip.id) as any[];

    expect(ownerView.map(i => i.name).sort()).toEqual(['Private', 'Shared']);
    expect(otherView.map(i => i.name)).toEqual(['Shared']);
    // Without a viewer (internal callers) nothing is filtered.
    expect(unscoped).toHaveLength(2);
  });

  it('PACK-SVC-016: updateItem toggles privacy and claims an unowned item for the actor', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Legacy-style row with no owner.
    const id = Number((testDb.prepare('INSERT INTO packing_items (trip_id, name, checked, sort_order) VALUES (?, ?, 0, 0)').run(trip.id, 'Legacy') as any).lastInsertRowid);

    const updated = svc.updateItem(trip.id, id, { is_private: true }, ['is_private'], undefined, user.id) as any;
    expect(updated.is_private).toBe(1);
    expect(updated.owner_id).toBe(user.id);

    const back = svc.updateItem(trip.id, id, { is_private: false }, ['is_private'], undefined, user.id) as any;
    expect(back.is_private).toBe(0);
    // Ownership is retained once claimed.
    expect(back.owner_id).toBe(user.id);
  });

  it('PACK-SVC-017: deleteItem returns the removed row (with privacy fields)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = svc.createItem(trip.id, { name: 'Private', is_private: true }, user.id) as any;

    const deleted = svc.deleteItem(trip.id, item.id, user.id) as any;
    expect(deleted).not.toBeNull();
    expect(deleted.is_private).toBe(1);
    expect(deleted.owner_id).toBe(user.id);
    expect(svc.deleteItem(trip.id, item.id, user.id)).toBeNull();
  });

  it('PACK-SVC-018: bulkImport stamps the owner on every item', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    svc.bulkImport(trip.id, [{ name: 'A' }, { name: 'B', is_private: true }], user.id);
    const rows = testDb.prepare('SELECT * FROM packing_items WHERE trip_id = ? ORDER BY name').all(trip.id) as any[];
    expect(rows.every(r => r.owner_id === user.id)).toBe(true);
    expect(rows.find(r => r.name === 'B').is_private).toBe(1);
    expect(rows.find(r => r.name === 'A').is_private).toBe(0);
  });
});

// ── Three-tier sharing (#858 follow-up) ───────────────────────────────────────

describe('three-tier packing sharing (#858)', () => {
  const names = (rows: any[]) => rows.map(r => r.name).sort();

  it('PACK-SVC-040: existing/common items are visible to everyone (non-breaking)', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    // A legacy-style row written directly (is_private defaults 0) = Common.
    testDb.prepare('INSERT INTO packing_items (trip_id, name, checked, sort_order) VALUES (?, ?, 0, 0)').run(trip.id, 'Tent');
    svc.createItem(trip.id, { name: 'Stove', visibility: 'common' }, owner.id);

    expect(names(svc.listItems(trip.id, owner.id) as any[])).toEqual(['Stove', 'Tent']);
    expect(names(svc.listItems(trip.id, other.id) as any[])).toEqual(['Stove', 'Tent']);
  });

  it('PACK-SVC-041: a Shared item is visible to its owner + recipients only, marked with the bringer', () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);

    const item = svc.createItem(trip.id, { name: 'Power bank', visibility: 'shared', recipient_ids: [friend.id] }, owner.id) as any;
    expect(item.is_private).toBe(1);
    expect(item.owner_username).toBe(owner.username);
    expect(item.recipients.map((r: any) => r.user_id)).toEqual([friend.id]);

    expect(names(svc.listItems(trip.id, owner.id) as any[])).toEqual(['Power bank']);   // bringer
    expect(names(svc.listItems(trip.id, friend.id) as any[])).toEqual(['Power bank']);  // covered person
    expect(names(svc.listItems(trip.id, stranger.id) as any[])).toEqual([]);            // nobody else
  });

  it('PACK-SVC-042: a Personal item is visible only to its owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    svc.createItem(trip.id, { name: 'Diary', visibility: 'personal' }, owner.id);
    expect(names(svc.listItems(trip.id, owner.id) as any[])).toEqual(['Diary']);
    expect(names(svc.listItems(trip.id, other.id) as any[])).toEqual([]);
  });

  it('PACK-SVC-043: setItemSharing changes the tier + recipients; only the owner may', () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    const item = svc.createItem(trip.id, { name: 'First aid', visibility: 'personal' }, owner.id) as any;

    // A non-owner who cannot see the item at all gets the missing-item answer, so
    // the route cannot be used to confirm that the id exists (GHSA-vh2h-288v-ggch).
    expect(svc.setItemSharing(trip.id, item.id, friend.id, 'shared', [friend.id])).toBeNull();

    const updated = svc.setItemSharing(trip.id, item.id, owner.id, 'shared', [friend.id]) as any;
    expect(updated.recipients.map((r: any) => r.user_id)).toEqual([friend.id]);
    expect(names(svc.listItems(trip.id, friend.id) as any[])).toEqual(['First aid']);

    // Back to common → visible to everyone, recipients cleared.
    svc.setItemSharing(trip.id, item.id, owner.id, 'common', []);
    const { user: stranger } = createUser(testDb);
    expect(names(svc.listItems(trip.id, stranger.id) as any[])).toEqual(['First aid']);
  });

  it('PACK-SVC-044: contributors ("I can bring that too") only attach to Common items', () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const common = svc.createItem(trip.id, { name: 'Sunscreen', visibility: 'common' }, owner.id) as any;
    const personal = svc.createItem(trip.id, { name: 'Meds', visibility: 'personal' }, owner.id) as any;

    const withHelper = svc.addContributor(trip.id, common.id, helper.id) as any;
    expect(withHelper.contributors.map((c: any) => c.user_id)).toEqual([helper.id]);
    // The bringer can't co-contribute to their own item, and personal items have no pool.
    expect(svc.addContributor(trip.id, common.id, owner.id)).toBeNull();
    expect(svc.addContributor(trip.id, personal.id, helper.id)).toBeNull();

    const cleared = svc.removeContributor(trip.id, common.id, helper.id) as any;
    expect(cleared.contributors).toEqual([]);
  });

  it('PACK-SVC-045: cloneItem copies an item onto the cloner\'s personal list', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const common = svc.createItem(trip.id, { name: 'Travel adapter', category: 'Electronics', visibility: 'common' }, owner.id) as any;

    const clone = svc.cloneItem(trip.id, common.id, cloner.id) as any;
    expect(clone.name).toBe('Travel adapter');
    expect(clone.category).toBe('Electronics');
    expect(clone.is_private).toBe(1);
    expect(clone.owner_id).toBe(cloner.id);
    // The clone is the cloner's alone.
    expect(names(svc.listItems(trip.id, owner.id) as any[])).toEqual(['Travel adapter']);     // owner sees only the common one
    expect(names(svc.listItems(trip.id, cloner.id) as any[])).toEqual(['Travel adapter', 'Travel adapter']); // common + own clone
  });

  // #207: "one person curates the list, everyone copies it" meant re-entering every
  // weight by hand, because a copy arrived empty.
  it('PACK-SVC-073: cloneItem carries the weight over', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const common = svc.createItem(trip.id, { name: 'Tent', visibility: 'common', weight_grams: 2400, quantity: 2 }, owner.id) as any;

    const clone = svc.cloneItem(trip.id, common.id, cloner.id) as any;

    expect(clone.weight_grams).toBe(2400);
    expect(clone.quantity).toBe(2);
  });

  it('PACK-SVC-074: cloneItem keeps a bag nobody owns', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const bag = svc.createBag(trip.id, { name: 'Car boot' }) as any;
    const common = svc.createItem(trip.id, { name: 'Cool box', visibility: 'common', weight_grams: 3000, bag_id: bag.id }, owner.id) as any;

    const clone = svc.cloneItem(trip.id, common.id, cloner.id) as any;

    expect(clone.bag_id).toBe(bag.id);
  });

  it('PACK-SVC-075: cloneItem drops a bag that belongs to someone else', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, cloner.id);
    const bag = svc.createBag(trip.id, { name: 'Owner backpack' }) as any;
    svc.setBagMembers(trip.id, bag.id, [owner.id]);
    const common = svc.createItem(trip.id, { name: 'Rope', visibility: 'common', weight_grams: 900, bag_id: bag.id }, owner.id) as any;

    const clone = svc.cloneItem(trip.id, common.id, cloner.id) as any;

    // Weight still comes along — only the foreign bag is dropped, so the copy cannot
    // land in someone else's luggage and inflate their total.
    expect(clone.weight_grams).toBe(900);
    expect(clone.bag_id).toBeNull();
  });

  it('PACK-SVC-076: cloneItem keeps a bag the cloner is a member of', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, cloner.id);
    const bag = svc.createBag(trip.id, { name: 'Shared duffel' }) as any;
    svc.setBagMembers(trip.id, bag.id, [owner.id, cloner.id]);
    const common = svc.createItem(trip.id, { name: 'Stove', visibility: 'common', bag_id: bag.id }, owner.id) as any;

    expect((svc.cloneItem(trip.id, common.id, cloner.id) as any).bag_id).toBe(bag.id);
  });
});

// ── Post-migration fixes over the legacy quirks ───────────────────────────────

describe('legacy-quirk fixes', () => {
  it('PACK-SVC-051: createItem defaults the category to "Other" (unified with bulkImport)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = svc.createItem(trip.id, { name: 'Socks' }, user.id) as any;
    expect(item.category).toBe('Other');
  });

  it('PACK-SVC-052: updateBag gates weight_limit_grams on bodyKeys — omitted keeps, explicit null clears', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bag = svc.createBag(trip.id, { name: 'Duffel' }) as any;

    const limited = svc.updateBag(trip.id, bag.id, { weight_limit_grams: 8000 }, ['weight_limit_grams']) as any;
    expect(limited.weight_limit_grams).toBe(8000);

    // A rename without the key must not touch the limit.
    const kept = svc.updateBag(trip.id, bag.id, { name: 'Duffel XL' }, ['name']) as any;
    expect(kept.weight_limit_grams).toBe(8000);

    // An explicit null clears it.
    const cleared = svc.updateBag(trip.id, bag.id, { weight_limit_grams: null }, ['weight_limit_grams']) as any;
    expect(cleared.weight_limit_grams).toBeNull();
  });

  it('PACK-SVC-053: updateItem clamps a provided quantity into 1..999', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = svc.createItem(trip.id, { name: 'Socks', quantity: 5 }, user.id) as any;

    expect((svc.updateItem(trip.id, item.id, { quantity: 0 }, ['quantity'], undefined, user.id) as any).quantity).toBe(1);
    expect((svc.updateItem(trip.id, item.id, { quantity: 9999 }, ['quantity'], undefined, user.id) as any).quantity).toBe(999);
    // Omitted key leaves the quantity unchanged.
    expect((svc.updateItem(trip.id, item.id, { name: 'Wool socks' }, ['name'], undefined, user.id) as any).quantity).toBe(999);
  });
});

// ── Wrapper helpers (carried over from the old delegation suite) ──────────────

describe('canEdit', () => {
  it('delegates to checkPermission with packing_edit', () => {
    svc.canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never);
    expect(checkPermission).toHaveBeenCalledWith('packing_edit', 'user', 2, 1, true);
  });
});

describe('broadcast helpers (#858 scoping)', () => {
  it('broadcast forwards to the websocket helper', () => {
    svc.broadcast('5', 'packing:created', { item: 1 }, 'sock');
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock');
  });

  it('broadcastItem broadcasts a shared item to the whole room (no onlyUserId)', () => {
    svc.broadcastItem('5', 'packing:created', { item: 1 }, { is_private: 0, owner_id: 7 }, 'sock');
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock', undefined);
  });

  it('broadcastItem scopes a private item to its owner', () => {
    svc.broadcastItem('5', 'packing:created', { item: 1 }, { is_private: 1, owner_id: 7 }, 'sock');
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock', 7);
  });

  it('broadcastItem falls back to a room broadcast when the private item has no owner', () => {
    svc.broadcastItem('5', 'packing:created', { item: 1 }, { is_private: 1, owner_id: null }, 'sock');
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock', undefined);
  });

  it('viewersOf: Common → null (whole room); restricted → owner + recipients', () => {
    expect(svc.viewersOf({ is_private: 0, owner_id: 1 })).toBeNull();
    expect(svc.viewersOf(null)).toBeNull();
    expect(svc.viewersOf({ is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }, { user_id: 3 }] })).toEqual([1, 2, 3]);
  });

  it('broadcastToViewers delivers to each viewer (deduped) via onlyUserId', () => {
    svc.broadcastToViewers('5', 'packing:created', { item: 1 }, [1, 2, 2], 'sock');
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock', 1);
    expect(broadcastMock).toHaveBeenCalledWith('5', 'packing:created', { item: 1 }, 'sock', 2);
    expect(broadcastMock).toHaveBeenCalledTimes(2);
  });
});

describe('getItemPrivacy', () => {
  it('reads the privacy fields for an item (real SQL)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = svc.createItem(trip.id, { name: 'Gift', is_private: true }, user.id) as any;

    expect(svc.getItemPrivacy(trip.id, item.id)).toEqual({ is_private: 1, owner_id: user.id });
    expect(svc.getItemPrivacy(trip.id, 99999)).toBeUndefined();
  });
});

describe('notifyTagged', () => {
  it('does nothing when no users are tagged', async () => {
    svc.notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', []);
    svc.notifyTagged('5', { id: 1, email: 'a@b.c' } as never, 'Clothes', 'nope');
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).not.toHaveBeenCalled();
  });

  it('queries the trip title and dispatches the notification with the resolved title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const { title } = testDb.prepare('SELECT title FROM trips WHERE id = ?').get(trip.id) as { title: string };

    svc.notifyTagged(String(trip.id), { id: 1, email: 'a@b.c' } as never, 'Clothes', [2, 3]);
    // Flush the dynamic import().then microtask chain.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'packing_tagged',
        actorId: 1,
        scope: 'trip',
        targetId: trip.id,
        params: expect.objectContaining({ trip: title, actor: 'a@b.c', category: 'Clothes', tripId: String(trip.id) }),
      }),
    );
  });

  it('falls back to "Untitled" when the trip row is missing (?? / default branch)', async () => {
    svc.notifyTagged('999999', { id: 1, email: 'a@b.c' } as never, 'Clothes', [2]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ params: expect.objectContaining({ trip: 'Untitled' }) }),
    );
  });
});

// ── Bridge delegation ─────────────────────────────────────────────────────────

describe('PackingService — the surface the deleted bridge exposed', () => {
  it('PACK-SVC-050: listItems delegates to PackingService over the shared db Proxy', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    svc.createItem(trip.id, { name: 'Shared' }, owner.id);
    svc.createItem(trip.id, { name: 'Private', is_private: true }, owner.id);

    // Unscoped (internal callers) — unfiltered; viewer-scoped — #858 filtering applies.
    expect((bridgeListItems(trip.id) as { name: string }[]).map(i => i.name).sort()).toEqual(['Private', 'Shared']);
    expect((bridgeListItems(trip.id, other.id) as { name: string }[]).map(i => i.name)).toEqual(['Shared']);
  });
});

// ── Admin template CRUD (moved from adminService, IDs preserved) ──────────────

describe('Packing templates', () => {
  it('ADMIN-SVC-031 — createPackingTemplate returns template', () => {
    const { user: admin } = createAdmin(testDb);
    const result = svc.createPackingTemplate('Beach Trip', admin.id) as any;
    expect(result.template.name).toBe('Beach Trip');
  });

  it('ADMIN-SVC-032 — createPackingTemplate returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const result = svc.createPackingTemplate('', admin.id) as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-033 — listPackingTemplates returns array', () => {
    const { user: admin } = createAdmin(testDb);
    svc.createPackingTemplate('Template A', admin.id);
    const templates = svc.listPackingTemplates() as any[];
    expect(templates.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN-SVC-034 — updatePackingTemplate updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const created = svc.createPackingTemplate('Old Name', admin.id) as any;
    const result = svc.updatePackingTemplate(String(created.template.id), { name: 'New Name' }) as any;
    expect(result.template.name).toBe('New Name');
  });

  it('ADMIN-SVC-035 — updatePackingTemplate returns 404 for non-existent', () => {
    const result = svc.updatePackingTemplate('99999', { name: 'Ghost' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-036 — deletePackingTemplate removes template', () => {
    const { user: admin } = createAdmin(testDb);
    const created = svc.createPackingTemplate('To Delete', admin.id) as any;
    const result = svc.deletePackingTemplate(String(created.template.id)) as any;
    expect(result.name).toBe('To Delete');
  });

  it('ADMIN-SVC-037 — deletePackingTemplate returns 404 for non-existent', () => {
    const result = svc.deletePackingTemplate('99999') as any;
    expect(result.status).toBe(404);
  });
});

describe('Template categories', () => {
  it('ADMIN-SVC-038 — createTemplateCategory creates a category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const result = svc.createTemplateCategory(String(tpl.template.id), 'Clothing') as any;
    expect(result.category.name).toBe('Clothing');
  });

  it('ADMIN-SVC-039 — createTemplateCategory returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const result = svc.createTemplateCategory(String(tpl.template.id), '') as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-040 — createTemplateCategory returns 404 for missing template', () => {
    const result = svc.createTemplateCategory('99999', 'Clothing') as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-041 — updateTemplateCategory updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Old') as any;
    const result = svc.updateTemplateCategory(String(tpl.template.id), String(cat.category.id), { name: 'New' }) as any;
    expect(result.category.name).toBe('New');
  });

  it('ADMIN-SVC-042 — updateTemplateCategory returns 404 for missing category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const result = svc.updateTemplateCategory(String(tpl.template.id), '99999', { name: 'X' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-043 — deleteTemplateCategory removes category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Remove Me') as any;
    const result = svc.deleteTemplateCategory(String(tpl.template.id), String(cat.category.id)) as any;
    expect(result.error).toBeUndefined();
  });

  it('ADMIN-SVC-044 — deleteTemplateCategory returns 404 for missing', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const result = svc.deleteTemplateCategory(String(tpl.template.id), '99999') as any;
    expect(result.status).toBe(404);
  });
});

describe('getPackingTemplate', () => {
  it('ADMIN-SVC-056 — returns template with categories and items when template exists', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Full Template', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Clothing') as any;
    svc.createTemplateItem(String(tpl.template.id), String(cat.category.id), 'T-Shirt');

    const result = svc.getPackingTemplate(String(tpl.template.id)) as any;
    expect(result.template).toBeDefined();
    expect(result.template.name).toBe('Full Template');
    expect(Array.isArray(result.categories)).toBe(true);
    expect(result.categories.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThanOrEqual(1);
    expect(result.items[0].name).toBe('T-Shirt');
  });

  it('ADMIN-SVC-057 — returns 404 for non-existent template', () => {
    const result = svc.getPackingTemplate('99999') as any;
    expect(result.status).toBe(404);
    expect(result.error).toBeDefined();
  });
});

describe('Template items', () => {
  it('ADMIN-SVC-058 — createTemplateItem returns item with name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const result = svc.createTemplateItem(String(tpl.template.id), String(cat.category.id), 'Backpack') as any;
    expect(result.item).toBeDefined();
    expect(result.item.name).toBe('Backpack');
  });

  it('ADMIN-SVC-059 — createTemplateItem returns 400 for empty name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const result = svc.createTemplateItem(String(tpl.template.id), String(cat.category.id), '') as any;
    expect(result.status).toBe(400);
  });

  it('ADMIN-SVC-060 — createTemplateItem returns 404 for non-existent category', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const result = svc.createTemplateItem(String(tpl.template.id), '99999', 'Item') as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-061 — updateTemplateItem updates name', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const item = svc.createTemplateItem(String(tpl.template.id), String(cat.category.id), 'Old Item') as any;
    const result = svc.updateTemplateItem(String(tpl.template.id), String(item.item.id), { name: 'New Item' }) as any;
    expect(result.item.name).toBe('New Item');
  });

  it('ADMIN-SVC-062 — updateTemplateItem returns 404 for non-existent item', () => {
    const result = svc.updateTemplateItem('1', '99999', { name: 'Ghost' }) as any;
    expect(result.status).toBe(404);
  });

  it('ADMIN-SVC-063 — deleteTemplateItem removes item', () => {
    const { user: admin } = createAdmin(testDb);
    const tpl = svc.createPackingTemplate('Tpl', admin.id) as any;
    const cat = svc.createTemplateCategory(String(tpl.template.id), 'Gear') as any;
    const item = svc.createTemplateItem(String(tpl.template.id), String(cat.category.id), 'To Delete') as any;
    const result = svc.deleteTemplateItem(String(tpl.template.id), String(item.item.id)) as any;
    expect(result.error).toBeUndefined();
    const check = testDb.prepare('SELECT id FROM packing_template_items WHERE id = ?').get(item.item.id);
    expect(check).toBeUndefined();
  });

  it('ADMIN-SVC-064 — deleteTemplateItem returns 404 for non-existent item', () => {
    const result = svc.deleteTemplateItem('1', '99999') as any;
    expect(result.status).toBe(404);
  });
});

// ── Quirk fix landed after the 2026-08 admin fold ─────────────────────────────

describe('Template item scoping (post-fold quirk fix)', () => {
  it('ADMIN-SVC-076 — update/deleteTemplateItem honour :templateId instead of ignoring it', () => {
    const { user: admin } = createAdmin(testDb);
    const tplA = svc.createPackingTemplate('A', admin.id) as any;
    const tplB = svc.createPackingTemplate('B', admin.id) as any;
    const catA = svc.createTemplateCategory(String(tplA.template.id), 'Gear') as any;
    const item = svc.createTemplateItem(String(tplA.template.id), String(catA.category.id), 'Tent') as any;

    // Template B does not own the item — both routes must 404 rather than act.
    expect(svc.updateTemplateItem(String(tplB.template.id), String(item.item.id), { name: 'Hijacked' }) as any)
      .toMatchObject({ status: 404 });
    expect(svc.deleteTemplateItem(String(tplB.template.id), String(item.item.id)) as any)
      .toMatchObject({ status: 404 });
    expect((testDb.prepare('SELECT name FROM packing_template_items WHERE id = ?').get(item.item.id) as any).name)
      .toBe('Tent');

    // The owning template still works.
    expect((svc.updateTemplateItem(String(tplA.template.id), String(item.item.id), { name: 'Tarp' }) as any).item.name)
      .toBe('Tarp');
    expect(svc.deleteTemplateItem(String(tplA.template.id), String(item.item.id)) as any).toEqual({});
  });
});

/**
 * Object-level authorization on a single packing item (GHSA-vh2h-288v-ggch).
 *
 * listItems() always filtered by the three-tier rule, but every single-item path
 * resolved the row by trip id alone, so any member holding packing_edit could
 * reach another member's Personal or Shared item by id. The update response even
 * handed the enriched row back, which made the write a read as well.
 */
describe('packing item object-level authorization', () => {
  const restrictedTrip = () => {
    const { user: owner } = createUser(testDb);
    const { user: intruder } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    // The recipient is a fellow traveller; the intruder stays off the trip on purpose.
    addTripMember(testDb, trip.id, friend.id);
    const personal = svc.createItem(trip.id, { name: 'Diary', visibility: 'personal' }, owner.id) as any;
    const shared = svc.createItem(trip.id, { name: 'Power bank', visibility: 'shared', recipient_ids: [friend.id] }, owner.id) as any;
    const common = svc.createItem(trip.id, { name: 'Tent', visibility: 'common' }, owner.id) as any;
    return { owner, intruder, friend, trip, personal, shared, common };
  };

  it('PACK-SVC-101: a non-viewer cannot update someone else\'s Personal item', () => {
    const { trip, personal, intruder } = restrictedTrip();
    expect(svc.updateItem(trip.id, personal.id, { name: 'pwned' }, ['name'], undefined, intruder.id)).toBeNull();
    expect(testDb.prepare('SELECT name FROM packing_items WHERE id = ?').get(personal.id)).toEqual({ name: 'Diary' });
  });

  it('PACK-SVC-102: a non-recipient cannot update a Shared item', () => {
    const { trip, shared, intruder } = restrictedTrip();
    expect(svc.updateItem(trip.id, shared.id, { name: 'pwned' }, ['name'], undefined, intruder.id)).toBeNull();
  });

  it('PACK-SVC-103: a non-viewer cannot delete a restricted item', () => {
    const { trip, personal, intruder } = restrictedTrip();
    expect(svc.deleteItem(trip.id, personal.id, intruder.id)).toBeNull();
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM packing_items WHERE id = ?').get(personal.id)).toEqual({ n: 1 });
  });

  it('PACK-SVC-104: a non-viewer cannot clone a restricted item into their own list', () => {
    const { trip, personal, intruder } = restrictedTrip();
    expect(svc.cloneItem(trip.id, personal.id, intruder.id)).toBeNull();
  });

  it('PACK-SVC-105b: a visible item the caller does not own still reports forbidden, not missing', () => {
    const { trip, common, intruder } = restrictedTrip();
    expect((svc.setItemSharing(trip.id, common.id, intruder.id, 'personal', []) as any).forbidden).toBe(true);
  });

  it('PACK-SVC-105: a non-owner cannot re-share a restricted item they cannot see', () => {
    const { trip, personal, intruder } = restrictedTrip();
    expect(svc.setItemSharing(trip.id, personal.id, intruder.id, 'common', [])).toBeNull();
    expect(testDb.prepare('SELECT is_private FROM packing_items WHERE id = ?').get(personal.id)).toEqual({ is_private: 1 });
  });

  // Missing actor must deny rather than fall through unfiltered.
  it('PACK-SVC-106: an update with no actor at all is refused', () => {
    const { trip, personal } = restrictedTrip();
    expect(svc.updateItem(trip.id, personal.id, { name: 'pwned' }, ['name'])).toBeNull();
    expect(svc.deleteItem(trip.id, personal.id)).toBeNull();
  });

  it('PACK-SVC-107: the owner and the recipients keep working', () => {
    const { trip, personal, shared, common, owner, friend, intruder } = restrictedTrip();
    expect(svc.updateItem(trip.id, personal.id, { name: 'Diary v2' }, ['name'], undefined, owner.id)).toBeTruthy();
    expect(svc.updateItem(trip.id, shared.id, { checked: 1 }, ['checked'], undefined, friend.id)).toBeTruthy();
    expect(svc.updateItem(trip.id, common.id, { checked: 1 }, ['checked'], undefined, intruder.id)).toBeTruthy();
    expect(svc.cloneItem(trip.id, common.id, intruder.id)).toBeTruthy();
    expect(svc.deleteItem(trip.id, personal.id, owner.id)).toBeTruthy();
  });

  it('PACK-SVC-108: a template captures only the Common list and the actor\'s own items', () => {
    const { trip, intruder } = restrictedTrip();
    const templateId = (svc.saveAsTemplate(trip.id, intruder.id, 'Snapshot') as { id: number }).id;
    const rows = testDb.prepare(`
      SELECT i.name FROM packing_template_items i
      JOIN packing_template_categories c ON c.id = i.category_id
      WHERE c.template_id = ?
    `).all(templateId) as { name: string }[];
    expect(rows.map(r => r.name).sort()).toEqual(['Tent']);
  });
});
