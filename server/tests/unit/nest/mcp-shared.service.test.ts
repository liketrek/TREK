/**
 * McpToolGuardsService — the injectable fold of the impure _shared.ts helpers.
 * A real in-memory SQLite backs hasTripPermission/isAdminUser so the SQL stays
 * byte-faithful to the module functions it replaces; broadcast flows through
 * the vi.mock'd src/websocket, exactly like every .mcp.ts consumer expects.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { McpSharedModule } from '../../../src/nest/mcp-shared/mcp-shared.module';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser } from '../../helpers/factories';

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

const { testDb, dbMock, broadcastMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} }, broadcastMock: vi.fn() };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

const dbs = new DatabaseService(testDb);
const svc = new McpToolGuardsService(dbs, new PermissionsService(dbs), new RealtimeService());

function createTrip(ownerId: number): number {
  const r = testDb.prepare("INSERT INTO trips (user_id, title) VALUES (?, 'T')").run(ownerId);
  return Number(r.lastInsertRowid);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  testDb.prepare('DELETE FROM trip_members').run();
  testDb.prepare('DELETE FROM trips').run();
  testDb.prepare('DELETE FROM users').run();
});

describe('hasTripPermission', () => {
  it('GRD-001: false for a missing trip', () => {
    const { user } = createUser(testDb);
    expect(svc.hasTripPermission('trip_edit', 99999, user.id)).toBe(false);
  });

  it('GRD-002: the owner passes owner-level actions; a stranger does not', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const tripId = createTrip(owner.id);
    expect(svc.hasTripPermission('trip_delete', tripId, owner.id)).toBe(true);
    expect(svc.hasTripPermission('trip_delete', tripId, stranger.id)).toBe(false);
  });

  it('GRD-003: an unknown user falls back to the plain user role', () => {
    const { user: owner } = createUser(testDb);
    const tripId = createTrip(owner.id);
    expect(svc.hasTripPermission('trip_delete', tripId, 424242)).toBe(false);
  });

  it('GRD-004: a global admin passes regardless of membership', () => {
    const { user: owner } = createUser(testDb);
    const { user: admin } = createUser(testDb);
    testDb.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(admin.id);
    const tripId = createTrip(owner.id);
    expect(svc.hasTripPermission('trip_delete', tripId, admin.id)).toBe(true);
  });
});

describe('isAdminUser', () => {
  it('GRD-010: reflects the users.role column and is false for unknown ids', () => {
    const { user } = createUser(testDb);
    expect(svc.isAdminUser(user.id)).toBe(false);
    testDb.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
    expect(svc.isAdminUser(user.id)).toBe(true);
    expect(svc.isAdminUser(424242)).toBe(false);
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
