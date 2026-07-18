/**
 * Unit tests for packingService.ts — uncovered functions.
 * Covers PACK-SVC-001 to PACK-SVC-012.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB mock setup (vi.hoisted so it is available before vi.mock calls) ────────

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
import { createUser, createTrip } from '../../helpers/factories';
import {
  saveAsTemplate,
  applyTemplate,
  listTemplates,
  setBagMembers,
  createBag,
  updateBag,
  deleteBag,
  bulkImport,
  createItem,
  updateItem,
  deleteItem,
  listItems,
  setItemSharing,
  addContributor,
  removeContributor,
  cloneItem,
} from '../../../src/services/packingService';

// ── Lifecycle ─────────────────────────────────────────────────────────────────

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

// ── saveAsTemplate ────────────────────────────────────────────────────────────

describe('saveAsTemplate', () => {
  it('PACK-SVC-001: saves packing items as a template with correct categories and item count', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Shirt', 'Clothes', 0);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Shorts', 'Clothes', 1);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, category, checked, sort_order) VALUES (?, ?, ?, 0, ?)').run(trip.id, 'Toothbrush', 'Toiletries', 2);

    const result = saveAsTemplate(trip.id, user.id, 'My Template');

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

    const result = saveAsTemplate(trip.id, user.id, 'Empty');

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
    const saved = saveAsTemplate(trip.id, user.id, 'Weekend');

    const templates = listTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0]).toMatchObject({ id: saved!.id, name: 'Weekend', item_count: 2 });
  });

  it('PACK-SVC-LIST-002: returns an empty array when no templates exist', () => {
    expect(listTemplates()).toEqual([]);
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

    const result = applyTemplate(trip.id, templateId);

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

    const result = applyTemplate(trip.id, templateId);

    expect(result).toBeNull();
  });

  // #1565: the applied items must land in the view the user is on, not always Common.
  it('PACK-SVC-046: applies into the personal list when visibility is personal', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    const result = applyTemplate(trip.id, templateId, 'personal', user.id) as any[];

    expect(result[0].is_private).toBe(1);
    expect(result[0].owner_id).toBe(user.id);
    expect(listItems(trip.id, user.id).filter((i: any) => i.is_private)).toHaveLength(1);
  });

  it('PACK-SVC-047: a personally applied template stays hidden from other members', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb, { username: 'other' });
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(trip.id, other.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    applyTemplate(trip.id, templateId, 'personal', user.id);

    expect(listItems(trip.id, other.id)).toHaveLength(0);
  });

  it('PACK-SVC-048: applies into the common pool by default, leaving items unowned', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    const result = applyTemplate(trip.id, templateId, 'common', user.id) as any[];

    expect(result[0].is_private).toBe(0);
    // Unowned, so any member may still re-share it (setItemSharing claims a null owner).
    expect(result[0].owner_id).toBeNull();
  });

  it('PACK-SVC-049: falls back to common when no owner is given, so items stay visible', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const templateId = seedTemplate(user.id, ['Tent']);

    // A private item with no owner would be invisible to everyone.
    const result = applyTemplate(trip.id, templateId, 'personal') as any[];

    expect(result[0].is_private).toBe(0);
    expect(listItems(trip.id, user.id)).toHaveLength(1);
  });
});

// ── createBag / deleteBag ─────────────────────────────────────────────────────

describe('createBag / deleteBag', () => {
  it('PACK-SVC-005: createBag inserts a bag and returns it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = createBag(trip.id, { name: 'Carry-On', color: '#ff0000' }) as any;

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

    const bag = createBag(trip.id, { name: 'Checked Bag' }) as any;
    expect(bag).not.toBeNull();

    const deleted = deleteBag(trip.id, bag.id);

    expect(deleted).toBe(true);

    const row = testDb.prepare('SELECT * FROM packing_bags WHERE id = ?').get(bag.id);
    expect(row).toBeUndefined();
  });

  it('PACK-SVC-007: deleteBag returns false for non-existent bag', () => {
    const result = deleteBag(1, 99999);

    expect(result).toBe(false);
  });
});

// ── setBagMembers ─────────────────────────────────────────────────────────────

describe('setBagMembers', () => {
  it('PACK-SVC-008: sets bag members (replaces existing)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bag = createBag(trip.id, { name: 'Main Bag' }) as any;

    const result = setBagMembers(trip.id, bag.id, [user.id]) as any[];

    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].user_id).toBe(user.id);
  });

  it('PACK-SVC-009: setBagMembers with empty array clears all members', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bag = createBag(trip.id, { name: 'Main Bag' }) as any;

    // First add a member
    setBagMembers(trip.id, bag.id, [user.id]);

    // Then clear
    const result = setBagMembers(trip.id, bag.id, []) as any[];

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it('PACK-SVC-010: setBagMembers returns null for non-existent bag', () => {
    const result = setBagMembers(1, 99999, []);

    expect(result).toBeNull();
  });

  it('PACK-SVC-010a: setBagMembers drops a user who is not on the trip roster', () => {
    const { user } = createUser(testDb);
    const outsider = createUser(testDb).user;
    const trip = createTrip(testDb, user.id);
    const bag = createBag(trip.id, { name: 'Main Bag' }) as any;

    // owner is on the roster; the outsider (not owner, not a member) must be filtered out
    const result = setBagMembers(trip.id, bag.id, [user.id, outsider.id]) as any[];

    const ids = result.map((m) => m.user_id);
    expect(ids).toContain(user.id);
    expect(ids).not.toContain(outsider.id);
  });

  it('PACK-SVC-010b: updateBag ignores an off-roster user_id, leaving the bag unassigned', () => {
    const { user } = createUser(testDb);
    const outsider = createUser(testDb).user;
    const trip = createTrip(testDb, user.id);
    const bag = createBag(trip.id, { name: 'Main Bag' }) as any;

    // assigning to an outsider must not stick — the CASE keeps user_id null
    updateBag(trip.id, bag.id, { user_id: outsider.id }, ['user_id']);
    const stored = testDb.prepare('SELECT user_id FROM packing_bags WHERE id = ?').get(bag.id) as { user_id: number | null };
    expect(stored.user_id).toBeNull();

    // assigning to the owner (on the roster) does stick
    updateBag(trip.id, bag.id, { user_id: user.id }, ['user_id']);
    const stored2 = testDb.prepare('SELECT user_id FROM packing_bags WHERE id = ?').get(bag.id) as { user_id: number | null };
    expect(stored2.user_id).toBe(user.id);
  });
});

// ── bulkImport with bag field ─────────────────────────────────────────────────

describe('bulkImport with bag field', () => {
  it('PACK-SVC-011: bulk import with bag field creates the bag if it does not exist', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const result = bulkImport(trip.id, [{ name: 'Shirt', bag: 'Carry-On' }]);

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

    const result = bulkImport(trip.id, [
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

    bulkImport(trip.id, [
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

    const shared = createItem(trip.id, { name: 'Tent' }, user.id) as any;
    const secret = createItem(trip.id, { name: 'Gift', is_private: true }, user.id) as any;

    expect(shared.is_private).toBe(0);
    expect(shared.owner_id).toBe(user.id);
    expect(secret.is_private).toBe(1);
    expect(secret.owner_id).toBe(user.id);
  });

  it('PACK-SVC-015: listItems hides another member\'s private items but shows the owner theirs', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    createItem(trip.id, { name: 'Shared' }, owner.id);
    createItem(trip.id, { name: 'Private', is_private: true }, owner.id);

    const ownerView = listItems(trip.id, owner.id) as any[];
    const otherView = listItems(trip.id, other.id) as any[];
    const unscoped = listItems(trip.id) as any[];

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

    const updated = updateItem(trip.id, id, { is_private: true }, ['is_private'], undefined, user.id) as any;
    expect(updated.is_private).toBe(1);
    expect(updated.owner_id).toBe(user.id);

    const back = updateItem(trip.id, id, { is_private: false }, ['is_private'], undefined, user.id) as any;
    expect(back.is_private).toBe(0);
    // Ownership is retained once claimed.
    expect(back.owner_id).toBe(user.id);
  });

  it('PACK-SVC-017: deleteItem returns the removed row (with privacy fields)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createItem(trip.id, { name: 'Private', is_private: true }, user.id) as any;

    const deleted = deleteItem(trip.id, item.id) as any;
    expect(deleted).not.toBeNull();
    expect(deleted.is_private).toBe(1);
    expect(deleted.owner_id).toBe(user.id);
    expect(deleteItem(trip.id, item.id)).toBeNull();
  });

  it('PACK-SVC-018: bulkImport stamps the owner on every item', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    bulkImport(trip.id, [{ name: 'A' }, { name: 'B', is_private: true }], user.id);
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
    createItem(trip.id, { name: 'Stove', visibility: 'common' }, owner.id);

    expect(names(listItems(trip.id, owner.id) as any[])).toEqual(['Stove', 'Tent']);
    expect(names(listItems(trip.id, other.id) as any[])).toEqual(['Stove', 'Tent']);
  });

  it('PACK-SVC-041: a Shared item is visible to its owner + recipients only, marked with the bringer', () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const item = createItem(trip.id, { name: 'Power bank', visibility: 'shared', recipient_ids: [friend.id] }, owner.id) as any;
    expect(item.is_private).toBe(1);
    expect(item.owner_username).toBe(owner.username);
    expect(item.recipients.map((r: any) => r.user_id)).toEqual([friend.id]);

    expect(names(listItems(trip.id, owner.id) as any[])).toEqual(['Power bank']);   // bringer
    expect(names(listItems(trip.id, friend.id) as any[])).toEqual(['Power bank']);  // covered person
    expect(names(listItems(trip.id, stranger.id) as any[])).toEqual([]);            // nobody else
  });

  it('PACK-SVC-042: a Personal item is visible only to its owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    createItem(trip.id, { name: 'Diary', visibility: 'personal' }, owner.id);
    expect(names(listItems(trip.id, owner.id) as any[])).toEqual(['Diary']);
    expect(names(listItems(trip.id, other.id) as any[])).toEqual([]);
  });

  it('PACK-SVC-043: setItemSharing changes the tier + recipients; only the owner may', () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const item = createItem(trip.id, { name: 'First aid', visibility: 'personal' }, owner.id) as any;

    // A non-owner is rejected.
    expect((setItemSharing(trip.id, item.id, friend.id, 'shared', [friend.id]) as any).forbidden).toBe(true);

    const updated = setItemSharing(trip.id, item.id, owner.id, 'shared', [friend.id]) as any;
    expect(updated.recipients.map((r: any) => r.user_id)).toEqual([friend.id]);
    expect(names(listItems(trip.id, friend.id) as any[])).toEqual(['First aid']);

    // Back to common → visible to everyone, recipients cleared.
    setItemSharing(trip.id, item.id, owner.id, 'common', []);
    const { user: stranger } = createUser(testDb);
    expect(names(listItems(trip.id, stranger.id) as any[])).toEqual(['First aid']);
  });

  it('PACK-SVC-044: contributors ("I can bring that too") only attach to Common items', () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const common = createItem(trip.id, { name: 'Sunscreen', visibility: 'common' }, owner.id) as any;
    const personal = createItem(trip.id, { name: 'Meds', visibility: 'personal' }, owner.id) as any;

    const withHelper = addContributor(trip.id, common.id, helper.id) as any;
    expect(withHelper.contributors.map((c: any) => c.user_id)).toEqual([helper.id]);
    // The bringer can't co-contribute to their own item, and personal items have no pool.
    expect(addContributor(trip.id, common.id, owner.id)).toBeNull();
    expect(addContributor(trip.id, personal.id, helper.id)).toBeNull();

    const cleared = removeContributor(trip.id, common.id, helper.id) as any;
    expect(cleared.contributors).toEqual([]);
  });

  it('PACK-SVC-045: cloneItem copies an item onto the cloner\'s personal list', () => {
    const { user: owner } = createUser(testDb);
    const { user: cloner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    const common = createItem(trip.id, { name: 'Travel adapter', category: 'Electronics', visibility: 'common' }, owner.id) as any;

    const clone = cloneItem(trip.id, common.id, cloner.id) as any;
    expect(clone.name).toBe('Travel adapter');
    expect(clone.category).toBe('Electronics');
    expect(clone.is_private).toBe(1);
    expect(clone.owner_id).toBe(cloner.id);
    // The clone is the cloner's alone.
    expect(names(listItems(trip.id, owner.id) as any[])).toEqual(['Travel adapter']);     // owner sees only the common one
    expect(names(listItems(trip.id, cloner.id) as any[])).toEqual(['Travel adapter', 'Travel adapter']); // common + own clone
  });
});
