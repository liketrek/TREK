/**
 * McpToolGuardsService — the injectable fold of the impure _shared.ts helpers.
 * A real in-memory SQLite backs hasTripPermission/isAdminUser so the SQL stays
 * byte-faithful to the module functions it replaces; broadcast flows through
 * the vi.mock'd src/websocket, exactly like every .mcp.ts consumer expects.
 */
import { db as testDb } from '../../../src/db/database';
import { McpSharedModule } from '../../../src/nest/mcp-shared/mcp-shared.module';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser } from '../../helpers/factories';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestTripsRepo,
  createTestUsersRepo,
} from '../../helpers/test-uow';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {} };
});
const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

let svc: McpToolGuardsService;
beforeAll(async () => {
  // Plan 4 Task 1 constructor-ripple: the trip `user_id` and user `role`
  // reads moved off `DatabaseService` onto `TripsRepository`/`UsersRepository`.
  svc = new McpToolGuardsService(
    await createTestTripsRepo(testDb),
    await createTestUsersRepo(testDb),
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
  );
});

function createTrip(ownerId: number): number {
  const r = testDb.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'T')").run(ownerId);
  return Number(r.lastInsertRowid);
}

beforeEach(() => {
  vi.clearAllMocks();
  testDb.prepare('DELETE FROM trip_members').run();
  testDb.prepare('DELETE FROM trips').run();
  testDb.prepare('DELETE FROM users').run();
});

describe('hasTripPermission', () => {
  it('GRD-001: false for a missing trip', async () => {
    const { user } = createUser(testDb);
    expect(await svc.hasTripPermission('trip_edit', 99999, user.id)).toBe(false);
  });

  it('GRD-002: the owner passes owner-level actions; a stranger does not', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const tripId = createTrip(owner.id);
    expect(await svc.hasTripPermission('trip_delete', tripId, owner.id)).toBe(true);
    expect(await svc.hasTripPermission('trip_delete', tripId, stranger.id)).toBe(false);
  });

  it('GRD-003: an unknown user falls back to the plain user role', async () => {
    const { user: owner } = createUser(testDb);
    const tripId = createTrip(owner.id);
    expect(await svc.hasTripPermission('trip_delete', tripId, 424242)).toBe(false);
  });

  it('GRD-004: a global admin passes regardless of membership', async () => {
    const { user: owner } = createUser(testDb);
    const { user: admin } = createUser(testDb);
    testDb.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(admin.id);
    const tripId = createTrip(owner.id);
    expect(await svc.hasTripPermission('trip_delete', tripId, admin.id)).toBe(true);
  });
});

describe('isAdminUser', () => {
  it('GRD-010: reflects the users.role column and is false for unknown ids', async () => {
    const { user } = createUser(testDb);
    expect(await svc.isAdminUser(user.id)).toBe(false);
    testDb.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    expect(await svc.isAdminUser(user.id)).toBe(true);
    expect(await svc.isAdminUser(424242)).toBe(false);
  });
});

describe('safeBroadcast', () => {
  it('GRD-020: stamps _source: mcp and flows through the mocked websocket seam', () => {
    svc.safeBroadcast(7, 'todo:created', { item: { id: 1 } });
    expect(broadcastMock).toHaveBeenCalledWith(7, 'todo:created', { item: { id: 1 }, _source: 'mcp' });
  });

  it('GRD-021: swallows broadcast failures so a tool result is never lost to a ws error', () => {
    broadcastMock.mockImplementationOnce(() => {
      throw new Error('ws down');
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => svc.safeBroadcast(7, 'todo:created', {})).not.toThrow();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});

describe('McpSharedModule', () => {
  it('GRD-030: provides and exports the guards over the permissions domain', () => {
    expect(Reflect.getMetadata('providers', McpSharedModule)).toEqual([McpToolGuardsService]);
    expect(Reflect.getMetadata('exports', McpSharedModule)).toEqual([McpToolGuardsService]);
  });
});
