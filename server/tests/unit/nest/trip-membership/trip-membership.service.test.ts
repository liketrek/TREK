/**
 * Unit tests for TripMembershipService.joinTripAsMember — TRIP-JOIN-001..004.
 * The shared add-by-id helper behind trip invite links (#1143) and trip-bound
 * admin invites (#1402): idempotent, owner-safe, missing-trip-safe.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db } };
});
vi.mock('../../../../src/db/database', () => dbMock);

import { createTables } from '../../../../src/db/schema';
import { runMigrations } from '../../../../src/db/migrations';
import { resetTestDb } from '../../../helpers/test-db';
import { createUser, createTrip } from '../../../helpers/factories';
import { DatabaseService } from '../../../../src/nest/database/database.service';
import { TripMembershipService } from '../../../../src/nest/trip-membership/trip-membership.service';

const joinTripAsMember = (tripId: number, userId: number, invitedBy: number | null) =>
  new TripMembershipService(new DatabaseService(testDb)).joinTripAsMember(tripId, userId, invitedBy);

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
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
    const count = testDb.prepare('SELECT COUNT(*) as n FROM trip_members WHERE trip_id = ? AND user_id = ?').get(trip.id, joiner.id) as { n: number };
    expect(count.n).toBe(1);
  });

  it('TRIP-JOIN-004: no-ops for a missing trip', () => {
    const { user: joiner } = createUser(testDb);
    const r = joinTripAsMember(999999, joiner.id, null);
    expect(r.joined).toBe(false);
  });
});
