/**
 * registration-invites.service.test.ts
 *
 * DB-centric unit tests for RegistrationInvitesService against a real in-memory
 * SQLite database. The cases moved here with the methods, out of
 * admin.service.test.ts; the ADMIN-SVC-* case IDs are preserved so the history
 * stays greppable. Constructed directly (no TestingModule, repo convention).
 */

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => undefined, isOwner: () => false };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin, createTrip, createInviteToken } from '../../helpers/factories';
import { RegistrationInvitesService } from '../../../src/nest/auth/registration-invites.service';
import { DatabaseService } from '../../../src/nest/database/database.service';

const svc = new RegistrationInvitesService(new DatabaseService(testDb));

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => { resetTestDb(testDb); vi.clearAllMocks(); });
afterAll(() => { testDb.close(); });

// ── Invites ───────────────────────────────────────────────────────────────────

describe('Invites', () => {
  it('ADMIN-SVC-024 — createInvite returns invite with token', () => {
    const { user: admin } = createAdmin(testDb);
    const result = svc.createInvite(admin.id, { max_uses: 5 }) as any;
    expect(result.invite.token).toBeDefined();
    expect(result.invite.max_uses).toBe(5);
  });

  it('ADMIN-SVC-025 — createInvite defaults to 1 use', () => {
    const { user: admin } = createAdmin(testDb);
    const result = svc.createInvite(admin.id, {}) as any;
    expect(result.uses).toBe(1);
  });

  it('ADMIN-SVC-026 — listInvites returns array', () => {
    const { user: admin } = createAdmin(testDb);
    svc.createInvite(admin.id, {});
    const invites = svc.listInvites() as any[];
    expect(invites.length).toBeGreaterThanOrEqual(1);
  });

  it('ADMIN-SVC-027 — deleteInvite removes invite', () => {
    const { user: admin } = createAdmin(testDb);
    const invite = createInviteToken(testDb, { created_by: admin.id }) as any;
    const result = svc.deleteInvite(String(invite.id)) as any;
    expect(result.error).toBeUndefined();
    const check = testDb.prepare('SELECT id FROM invite_tokens WHERE id = ?').get(invite.id);
    expect(check).toBeUndefined();
  });

  it('ADMIN-SVC-028 — deleteInvite returns 404 for non-existent invite', () => {
    const result = svc.deleteInvite('99999') as any;
    expect(result.status).toBe(404);
  });
});

describe('Invites — trip binding', () => {
  it('ADMIN-SVC-073 — createInvite 404s on a trip_id that does not resolve', () => {
    const { user: admin } = createAdmin(testDb);
    expect(svc.createInvite(admin.id, { trip_id: 99999 }) as any).toMatchObject({ status: 404, error: 'Trip not found' });
    expect(svc.createInvite(admin.id, { trip_id: 'not-a-number' }) as any).toMatchObject({ status: 404 });
    expect(testDb.prepare('SELECT COUNT(*) as c FROM invite_tokens').get()).toEqual({ c: 0 });
    // An absent/blank binding is still a plain registration invite.
    expect((svc.createInvite(admin.id, {}) as any).tripId).toBeNull();
  });
});
