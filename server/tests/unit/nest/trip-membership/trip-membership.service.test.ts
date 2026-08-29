/**
 * Unit tests for TripMembershipService.joinTripAsMember — TRIP-JOIN-001..004.
 * The shared add-by-id helper behind trip invite links (#1143) and trip-bound
 * admin invites (#1402): idempotent, owner-safe, missing-trip-safe.
 */
import { runMigrations } from '../../../../src/db/migrations';
import { createTables } from '../../../../src/db/schema';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { TripMembershipService } from '../../../../src/nest/trip-membership/trip-membership.service';
import { createUser, createTrip } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db } };
});
vi.mock('../../../../src/db/database', () => dbMock);

const joinTripAsMember = (tripId: number, userId: number, invitedBy: number | null) =>
  new TripMembershipService(new DatabaseService(testDb)).joinTripAsMember(tripId, userId, invitedBy);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});
beforeEach(() => resetTestDb(testDb));
afterAll(() => testDb.close());

function memberRow(tripId: number, userId: number) {
  return testDb.prepare('SELECT * FROM trip_members WHERE trip_id = ? AND user_id = ?').get(tripId, userId);
}

describe('joinTripAsMember', () => {
  it('TRIP-JOIN-001: adds a non-member and reports joined', () => {
    const { user: owner } = createUser(testDb);
    const { user: joiner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const r = joinTripAsMember(trip.id, joiner.id, null);
    expect(r).toEqual({ joined: true, tripId: trip.id });
    expect(memberRow(trip.id, joiner.id)).toBeTruthy();
  });

  it('TRIP-JOIN-002: never adds the trip owner as a member', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const r = joinTripAsMember(trip.id, owner.id, null);
    expect(r.joined).toBe(false);
    expect(memberRow(trip.id, owner.id)).toBeUndefined();
  });

  it('TRIP-JOIN-003: is idempotent for an existing member (no duplicate row)', () => {
    const { user: owner } = createUser(testDb);
    const { user: joiner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    expect(joinTripAsMember(trip.id, joiner.id, owner.id).joined).toBe(true);
    expect(joinTripAsMember(trip.id, joiner.id, owner.id).joined).toBe(false);
    const count = testDb
      .prepare('SELECT COUNT(*) as n FROM trip_members WHERE trip_id = ? AND user_id = ?')
      .get(trip.id, joiner.id) as { n: number };
    expect(count.n).toBe(1);
  });

  it('TRIP-JOIN-004: no-ops for a missing trip', () => {
    const { user: joiner } = createUser(testDb);
    const r = joinTripAsMember(999999, joiner.id, null);
    expect(r.joined).toBe(false);
  });
});

// The leaf reads that replaced trips.bridge for BudgetMcp/CostsRpc — see the
// service docblock for why they live on this dependency-free module.
describe('leaf membership reads', () => {
  const svc = () => new TripMembershipService(new DatabaseService(testDb));

  it('TRIP-READ-001: getOwnerId answers the owner and null for a missing trip', () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    expect(svc().getOwnerId(trip.id)).toBe(owner.id);
    expect(svc().getOwnerId(999999)).toBeNull();
  });

  it('TRIP-READ-002: listMemberUserIds excludes the owner and follows added_at order', () => {
    const { user: owner } = createUser(testDb);
    const { user: m1 } = createUser(testDb);
    const { user: m2 } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    testDb
      .prepare("INSERT INTO trip_members (trip_id, user_id, added_at) VALUES (?, ?, '2026-01-02')")
      .run(trip.id, m2.id);
    testDb
      .prepare("INSERT INTO trip_members (trip_id, user_id, added_at) VALUES (?, ?, '2026-01-01')")
      .run(trip.id, m1.id);
    expect(svc().listMemberUserIds(trip.id)).toEqual([m1.id, m2.id]);
    expect(svc().listMemberUserIds(999999)).toEqual([]);
  });

  it('TRIP-READ-003: listAccessibleTripIds unions owned and member trips, newest first', () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const owned = createTrip(testDb, user.id);
    const memberOf = createTrip(testDb, other.id);
    const foreign = createTrip(testDb, other.id);
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(memberOf.id, user.id);
    // Distinct created_at so the ORDER BY is actually asserted, not assumed.
    testDb.prepare("UPDATE trips SET created_at = '2026-01-01' WHERE id = ?").run(owned.id);
    testDb.prepare("UPDATE trips SET created_at = '2026-01-02' WHERE id = ?").run(memberOf.id);
    const ids = svc().listAccessibleTripIds(user.id);
    expect(ids).toEqual([memberOf.id, owned.id]);
    expect(ids).not.toContain(foreign.id);
  });
});
