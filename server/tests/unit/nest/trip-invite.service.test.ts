/**
 * Unit tests for the DI-native TripInviteService — TRIP-INVITE-001..006
 * (moved 1:1 from the legacy tests/unit/services/tripInviteService.test.ts).
 * Per-trip invite links (#1143): one rotating token, optional expiry, resolve.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
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
    canAccessTrip: () => undefined,
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
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { TripMembershipService } from '../../../src/nest/trip-membership/trip-membership.service';
import { TripInviteService } from '../../../src/nest/trip-invite/trip-invite.service';

// One DatabaseService over the shared in-memory handle, so every collaborator
// reads and writes the same rows.
const dbs = new DatabaseService(testDb);
const svc = new TripInviteService(dbs, new PermissionsService(dbs), new TripMembershipService(dbs));

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

function setup() {
  const { user: owner } = createUser(testDb);
  const trip = createTrip(testDb, owner.id);
  return { owner, trip };
}

describe('TripInviteService', () => {
  it('TRIP-INVITE-001: no link exists initially', () => {
    const { trip } = setup();
    expect(svc.get(trip.id)).toBeNull();
  });

  it('TRIP-INVITE-002: create returns a token and get reads it back', () => {
    const { owner, trip } = setup();
    const info = svc.createOrRotate(trip.id, owner.id);
    expect(info.token).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    expect(svc.get(trip.id)?.token).toBe(info.token);
  });

  it('TRIP-INVITE-003: rotating replaces the token and keeps a single row', () => {
    const { owner, trip } = setup();
    const first = svc.createOrRotate(trip.id, owner.id);
    const second = svc.createOrRotate(trip.id, owner.id);
    expect(second.token).not.toBe(first.token);
    const count = testDb.prepare('SELECT COUNT(*) as n FROM trip_invite_tokens WHERE trip_id = ?').get(trip.id) as { n: number };
    expect(count.n).toBe(1);
    // The old token no longer resolves.
    expect(svc.resolve(first.token)).toBeNull();
  });

  it('TRIP-INVITE-004: resolve returns the trip for a valid token', () => {
    const { owner, trip } = setup();
    const info = svc.createOrRotate(trip.id, owner.id);
    expect(svc.resolve(info.token)).toEqual({ trip_id: trip.id, title: trip.title });
  });

  it('TRIP-INVITE-005: an expired token does not resolve (ISO expiry, incl. same-day)', () => {
    const { owner, trip } = setup();
    const info = svc.createOrRotate(trip.id, owner.id);
    // Use the exact ISO-8601 format the service writes, one hour in the past —
    // this catches the lexicographic-SQL-comparison bug where a same-UTC-day
    // expiry would otherwise still resolve.
    testDb.prepare('UPDATE trip_invite_tokens SET expires_at = ? WHERE trip_id = ?')
      .run(new Date(Date.now() - 3600_000).toISOString(), trip.id);
    expect(svc.resolve(info.token)).toBeNull();
  });

  it('TRIP-INVITE-005b: a not-yet-expired token still resolves', () => {
    const { owner, trip } = setup();
    const info = svc.createOrRotate(trip.id, owner.id);
    testDb.prepare('UPDATE trip_invite_tokens SET expires_at = ? WHERE trip_id = ?')
      .run(new Date(Date.now() + 3600_000).toISOString(), trip.id);
    expect(svc.resolve(info.token)).toEqual({ trip_id: trip.id, title: trip.title });
  });

  it('TRIP-INVITE-006: delete removes the link', () => {
    const { owner, trip } = setup();
    const info = svc.createOrRotate(trip.id, owner.id);
    svc.remove(trip.id);
    expect(svc.get(trip.id)).toBeNull();
    expect(svc.resolve(info.token)).toBeNull();
  });

  it('TRIP-INVITE-007: an expiry in days is written as an ISO timestamp; non-positive means none', () => {
    const { owner, trip } = setup();
    const bounded = svc.createOrRotate(trip.id, owner.id, 7);
    const expires = new Date(bounded.expires_at!).getTime();
    expect(expires).toBeGreaterThan(Date.now() + 6 * 86400000);
    expect(expires).toBeLessThan(Date.now() + 8 * 86400000);
    expect(svc.createOrRotate(trip.id, owner.id, 0).expires_at).toBeNull();
    expect(svc.createOrRotate(trip.id, owner.id, -3).expires_at).toBeNull();
  });
});
