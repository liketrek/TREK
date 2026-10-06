/**
 * Unit tests for the DI-native TodoService — TODO-SVC-001 through TODO-SVC-020
 * (moved 1:1 from the legacy tests/unit/services/todoService.test.ts; the
 * 021–024 bridge-delegation cases died with todo.bridge when the legacy trips
 * registrar migrated). Uses a real in-memory SQLite DB so SQL logic is
 * exercised faithfully.
 */
import { db as testDb } from '../../../src/db/database';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TodoService } from '../../../src/nest/todo/todo.service';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestTripsRepo,
  createTestTripMembersRepo,
} from '../../helpers/test-uow';
import { createTestTodoItemsRepo, createTestTodoCategoryAssigneesRepo } from '../../helpers/todo-repos';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

// ── DB setup ──────────────────────────────────────────────────────────────────

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: any, userId: number) =>
      db
        .prepare(
          `
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `,
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return mock;
});

vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

let svc: TodoService;
let todoItemsRepoDirect: Awaited<ReturnType<typeof createTestTodoItemsRepo>>;
beforeAll(async () => {
  const uow = await createTestUnitOfWork(testDb);
  todoItemsRepoDirect = await createTestTodoItemsRepo(testDb);
  svc = new TodoService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), uow),
    new RealtimeService(),
    uow,
    todoItemsRepoDirect,
    await createTestTodoCategoryAssigneesRepo(testDb),
    // Plan 4 Task 2 — TodoService's own canAccessTrip delegate is now
    // TripsRepository.findAccessible, a new trailing constructor param.
    await createTestTripsRepo(testDb),
    // Plan 4 Task 3 — DatabaseService.rosterUserIds inlined onto
    // TripMembersRepository.rosterUserIds directly.
    await createTestTripMembersRepo(testDb),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── verifyTripAccess ──────────────────────────────────────────────────────────

describe('verifyTripAccess', () => {
  it('TODO-SVC-001: returns trip for owner', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await svc.verifyTripAccess(trip.id, user.id);
    expect(result).toBeDefined();
    expect(result?.id).toBe(trip.id);
  });

  it('TODO-SVC-002: returns null for non-member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(await svc.verifyTripAccess(trip.id, stranger.id)).toBeFalsy();
  });

  it('TODO-SVC-003: returns trip for member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const result = await svc.verifyTripAccess(trip.id, member.id);
    expect(result).toBeDefined();
  });
});

// ── listItems / createItem ────────────────────────────────────────────────────

describe('listItems and createItem', () => {
  it('TODO-SVC-004: listItems returns empty array for new trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.listItems(trip.id)).toEqual([]);
  });

  it('TODO-SVC-005: createItem inserts a todo with name only', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Buy snacks' })) as any;
    expect(item).toBeDefined();
    expect(item.name).toBe('Buy snacks');
    expect(item.checked).toBe(0);
    expect(item.trip_id).toBe(trip.id);
    expect(item.sort_order).toBe(0);
  });

  it('TODO-SVC-006: createItem assigns incrementing sort_order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = (await svc.createItem(trip.id, { name: 'A' })) as any;
    const b = (await svc.createItem(trip.id, { name: 'B' })) as any;
    expect(b.sort_order).toBe(a.sort_order + 1);
  });

  it('TODO-SVC-007: createItem stores optional fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, {
      name: 'Pack bag',
      category: 'Prep',
      description: 'All the gear',
      priority: 3,
    })) as any;
    expect(item.category).toBe('Prep');
    expect(item.description).toBe('All the gear');
    expect(item.priority).toBe(3);
  });

  it('TODO-SVC-008: listItems returns items ordered by sort_order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await svc.createItem(trip.id, { name: 'First' });
    await svc.createItem(trip.id, { name: 'Second' });
    await svc.createItem(trip.id, { name: 'Third' });
    const items = (await svc.listItems(trip.id)) as any[];
    expect(items).toHaveLength(3);
    expect(items[0].sort_order).toBeLessThanOrEqual(items[1].sort_order);
    expect(items[1].sort_order).toBeLessThanOrEqual(items[2].sort_order);
  });
});

// ── updateItem ────────────────────────────────────────────────────────────────

describe('updateItem', () => {
  it('TODO-SVC-009: returns null for non-existent item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.updateItem(trip.id, 99999, { name: 'Ghost' }, ['name'])).toBeNull();
  });

  it('TODO-SVC-010: toggles checked status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Visit museum' })) as any;
    const updated = (await svc.updateItem(trip.id, item.id, { checked: 1 }, ['checked'])) as any;
    expect(updated.checked).toBe(1);
    const back = (await svc.updateItem(trip.id, item.id, { checked: 0 }, ['checked'])) as any;
    expect(back.checked).toBe(0);
  });

  it('TODO-SVC-011: updates name and category', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Old' })) as any;
    const updated = (await svc.updateItem(trip.id, item.id, { name: 'New', category: 'Misc' }, [
      'name',
      'category',
    ])) as any;
    expect(updated.name).toBe('New');
    expect(updated.category).toBe('Misc');
  });

  it('TODO-SVC-012: clears due_date when key is present with null value', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Task', due_date: '2026-06-01' })) as any;
    const updated = (await svc.updateItem(trip.id, item.id, { due_date: null }, ['due_date'])) as any;
    expect(updated.due_date).toBeNull();
  });

  it('M2-TODO-001: refuses to update an item from a different trip (TodoItems.findInTrip trip-scoping)', async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id);
    const tripB = createTrip(testDb, user.id);
    const itemB = (await svc.createItem(tripB.id, { name: 'Foreign task' }))!;

    expect(await svc.updateItem(tripA.id, itemB.id, { name: 'Hijacked' }, ['name'])).toBeNull();
    expect((await svc.listItems(tripB.id))[0].name).toBe('Foreign task');
  });

  it('M1: TodoItemsRepository.update no-ops on an empty write (presenceSet returns {})', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Untouched' }))!;
    await expect(todoItemsRepoDirect.update(item.id, {})).resolves.toBeUndefined();
    expect((await svc.listItems(trip.id))[0].name).toBe('Untouched');
  });
});

// ── deleteItem ────────────────────────────────────────────────────────────────

describe('deleteItem', () => {
  it('TODO-SVC-013: returns false for non-existent item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.deleteItem(trip.id, 99999)).toBe(false);
  });

  it('TODO-SVC-014: deletes item and returns true', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = (await svc.createItem(trip.id, { name: 'Gone' })) as any;
    expect(await svc.deleteItem(trip.id, item.id)).toBe(true);
    expect(await svc.listItems(trip.id)).toHaveLength(0);
  });
});

// ── reorderItems ──────────────────────────────────────────────────────────────

describe('reorderItems', () => {
  it('TODO-SVC-015: assigns sort_order matching orderedIds array position', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = (await svc.createItem(trip.id, { name: 'A' })) as any;
    const b = (await svc.createItem(trip.id, { name: 'B' })) as any;
    const c = (await svc.createItem(trip.id, { name: 'C' })) as any;

    await svc.reorderItems(trip.id, [c.id, a.id, b.id]);

    const rows = testDb
      .prepare('SELECT id, sort_order FROM todo_items WHERE trip_id = ? ORDER BY sort_order')
      .all(trip.id) as any[];
    expect(rows[0].id).toBe(c.id);
    expect(rows[1].id).toBe(a.id);
    expect(rows[2].id).toBe(b.id);
  });
});

// ── category assignees ────────────────────────────────────────────────────────

describe('getCategoryAssignees / updateCategoryAssignees', () => {
  it('TODO-SVC-016: returns empty object for new trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.getCategoryAssignees(trip.id)).toEqual({});
  });

  it('TODO-SVC-017: updateCategoryAssignees sets assignees for a category', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const rows = await svc.updateCategoryAssignees(trip.id, 'Packing', [owner.id, member.id]);
    expect(rows).toHaveLength(2);

    const assignees = await svc.getCategoryAssignees(trip.id);
    expect(assignees['Packing']).toHaveLength(2);
  });

  it('TODO-SVC-018: updateCategoryAssignees with empty array clears assignees', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    await svc.updateCategoryAssignees(trip.id, 'Packing', [owner.id]);
    const cleared = await svc.updateCategoryAssignees(trip.id, 'Packing', []);
    expect(cleared).toHaveLength(0);

    const assignees = await svc.getCategoryAssignees(trip.id);
    expect(assignees['Packing']).toBeUndefined();
  });

  it('TODO-SVC-019: getCategoryAssignees groups by category name', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    await svc.updateCategoryAssignees(trip.id, 'Shopping', [owner.id]);
    await svc.updateCategoryAssignees(trip.id, 'Logistics', [member.id]);

    const assignees = await svc.getCategoryAssignees(trip.id);
    expect(Object.keys(assignees)).toHaveLength(2);
    expect(assignees['Shopping']).toHaveLength(1);
    expect(assignees['Logistics']).toHaveLength(1);
  });

  // Holding todo_edit says you may edit this trip's list, not that any user id
  // you name belongs to it. The read-back joins users and hands the caller a
  // display name and an avatar, so an unfiltered id turns the endpoint into a
  // lookup for every account on the instance.
  it('TODO-SVC-017a: drops a user who is not on the trip, and says nothing about them', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const rows = (await svc.updateCategoryAssignees(trip.id, 'Packing', [owner.id, stranger.id, member.id])) as {
      user_id: number;
    }[];

    expect(rows.map((r) => r.user_id).sort()).toEqual([owner.id, member.id].sort());
    expect(JSON.stringify(rows)).not.toContain(stranger.username);
    expect(
      testDb.prepare('SELECT COUNT(*) AS n FROM todo_category_assignees WHERE user_id = ?').get(stranger.id),
    ).toEqual({ n: 0 });
  });

  it('TODO-SVC-017b: keeps a guest, who is a trip member like any other', async () => {
    const { user: owner } = createUser(testDb);
    const { user: guest } = createUser(testDb);
    testDb.prepare('UPDATE users SET is_guest = 1 WHERE id = ?').run(guest.id);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, guest.id);

    const rows = (await svc.updateCategoryAssignees(trip.id, 'Packing', [guest.id])) as { user_id: number }[];
    expect(rows.map((r) => r.user_id)).toEqual([guest.id]);
  });

  it('TODO-SVC-020: updateCategoryAssignees replaces existing assignees (not append)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    await svc.updateCategoryAssignees(trip.id, 'Food', [owner.id, member.id]);
    // Replace with just owner
    await svc.updateCategoryAssignees(trip.id, 'Food', [owner.id]);

    const assignees = await svc.getCategoryAssignees(trip.id);
    expect(assignees['Food']).toHaveLength(1);
    expect(assignees['Food'][0].user_id).toBe(owner.id);
  });
});

// ── Plan 3e Task 4 parity: converted read models byte-for-byte against the ──
// legacy statement text, run raw on the same seeded rows (TD1/TD14).

describe('TodoItemsRepository / TodoCategoryAssigneesRepository — parity', () => {
  it('TODO-REPO-001: listItems matches TD1 (`SELECT * FROM todo_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC`) run raw, with every nullable column both set and left null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const full = (await svc.createItem(trip.id, {
      name: 'Full item',
      category: 'Cat',
      due_date: '2026-06-01',
      description: 'Desc',
      assigned_user_id: user.id,
      priority: 5,
    })) as any;
    await svc.updateItem(trip.id, full.id, { checked: 1 }, ['checked']);

    // Every nullable column left at its default (null/0).
    await svc.createItem(trip.id, { name: 'Bare item' });

    const converted = await svc.listItems(trip.id);
    const legacy = testDb
      .prepare('SELECT * FROM todo_items WHERE trip_id = ? ORDER BY sort_order ASC, created_at ASC')
      .all(trip.id);
    expect(converted).toEqual(legacy);
    expect(converted).toHaveLength(2);
  });

  it("TODO-REPO-002: updateCategoryAssignees' TD14 re-select matches the legacy joined statement run raw, with an off-roster id present to prove the silent drop", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const converted = await svc.updateCategoryAssignees(trip.id, 'Packing', [owner.id, stranger.id, member.id]);

    const legacy = testDb
      .prepare(
        `
      SELECT tca.user_id, u.username, u.avatar
      FROM todo_category_assignees tca
      JOIN users u ON tca.user_id = u.id
      WHERE tca.trip_id = ? AND tca.category_name = ?
    `,
      )
      .all(trip.id, 'Packing');

    expect(converted).toEqual(legacy);
    expect((converted as { user_id: number }[]).map((r) => r.user_id).sort()).toEqual([owner.id, member.id].sort());
  });
});

// TODO-SVC-021..024 (todo.bridge delegation) were deleted with the bridge —
// its last consumer, the legacy get_trip_summary registrar in
// src/mcp/tools/trips.ts, moved to the DI-discovered trips.mcp.ts.

/**
 * canEdit is MCP-only now: the HTTP path checks the same right through
 * TripAccessGuard's @RequirePermission('packing_edit'), so nothing in a controller test
 * reaches this method any more. It stays because the *.mcp.ts tools never pass through
 * an HTTP guard, and it is tested directly here for the same reason.
 */
describe('TodoService.canEdit', () => {
  it('TODO-SVC-090 asks for packing_edit and flags a non-owner as shared', async () => {
    const checkPermission = vi.fn(() => true);
    const permissions = { checkPermission } as unknown as PermissionsService;
    const withStub = new TodoService(
      permissions,
      new RealtimeService(),
      await createTestUnitOfWork(testDb),
      await createTestTodoItemsRepo(testDb),
      await createTestTodoCategoryAssigneesRepo(testDb),
      await createTestTripsRepo(testDb),
      await createTestTripMembersRepo(testDb),
    );
    const trip = { id: 1, user_id: 1 } as never;

    expect(await withStub.canEdit(trip, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('packing_edit', 'user', 1, 1, false);

    await withStub.canEdit(trip, { id: 2, role: 'user' } as never);
    // The shared flag is what the guard has to reproduce; getting it wrong would give a
    // member the owner's rights on somebody else's trip.
    expect(checkPermission).toHaveBeenLastCalledWith('packing_edit', 'user', 1, 2, true);

    checkPermission.mockReturnValue(false);
    expect(await withStub.canEdit(trip, { id: 2, role: 'user' } as never)).toBe(false);
  });
});
