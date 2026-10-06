import { TripInviteTokens } from '../../../../src/db/entities/TripInviteTokens.entity';
import type { TripInviteTokensRepository } from '../../../../src/db/repositories/TripInviteTokens.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { createTrip, createUser } from '../../../helpers/factories';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let tripInviteTokens: TripInviteTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  tripInviteTokens = t.repo(TripInviteTokens);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('TripInviteTokensRepository.findInfoByTrip / existsForTrip (Plan 4 Task 1)', () => {
  it('TIREPO-001: findInfoByTrip returns token/expires_at/created_at only, undefined when no row', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await tripInviteTokens.findInfoByTrip(trip.id)).toBeUndefined();
    expect(await tripInviteTokens.existsForTrip(trip.id)).toBe(false);

    testDb
      .prepare("INSERT INTO trip_invite_tokens (trip_id, token, created_by, expires_at) VALUES (?, 'tok', ?, NULL)")
      .run(trip.id, user.id);

    const legacy = testDb
      .prepare('SELECT token, expires_at, created_at FROM trip_invite_tokens WHERE trip_id = ?')
      .get(trip.id);
    expect(await tripInviteTokens.findInfoByTrip(trip.id)).toEqual(legacy);
    expect(await tripInviteTokens.existsForTrip(trip.id)).toBe(true);
  });
});

describe('TripInviteTokensRepository.insertForTrip / updateForTrip (Plan 4 Task 1)', () => {
  it('TIREPO-002: insertForTrip writes the 4-column set, created_at defaults', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await tripInviteTokens.insertForTrip({ trip_id: trip.id, token: 'abc', created_by: user.id, expires_at: null });

    const row = testDb
      .prepare('SELECT trip_id, token, created_by, expires_at FROM trip_invite_tokens WHERE trip_id = ?')
      .get(trip.id);
    expect(row).toEqual({ trip_id: trip.id, token: 'abc', created_by: user.id, expires_at: null });
    expect(
      (
        testDb.prepare('SELECT created_at FROM trip_invite_tokens WHERE trip_id = ?').get(trip.id) as {
          created_at: string;
        }
      ).created_at,
    ).toBeTruthy();
  });

  it('TIREPO-003: updateForTrip rewrites token/expires_at/created_by AND bumps created_at, on the SAME row (single row per trip)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: rotator } = createUser(testDb, { username: 'rotator' });
    const trip = createTrip(testDb, owner.id);
    await tripInviteTokens.insertForTrip({ trip_id: trip.id, token: 'first', created_by: owner.id, expires_at: null });
    const before = testDb.prepare('SELECT id, created_at FROM trip_invite_tokens WHERE trip_id = ?').get(trip.id) as {
      id: number;
      created_at: string;
    };

    await tripInviteTokens.updateForTrip(trip.id, {
      token: 'second',
      expires_at: '2030-01-01T00:00:00.000Z',
      created_by: rotator.id,
    });

    const after = testDb
      .prepare('SELECT id, token, expires_at, created_by, created_at FROM trip_invite_tokens WHERE trip_id = ?')
      .get(trip.id) as {
      id: number;
      token: string;
      expires_at: string;
      created_by: number;
      created_at: string;
    };
    expect(after.id).toBe(before.id); // same row, not a second insert
    expect(after.token).toBe('second');
    expect(after.expires_at).toBe('2030-01-01T00:00:00.000Z');
    expect(after.created_by).toBe(rotator.id);
    expect(testDb.prepare('SELECT COUNT(*) AS c FROM trip_invite_tokens WHERE trip_id = ?').get(trip.id)).toEqual({
      c: 1,
    });
  });
});

describe('TripInviteTokensRepository.deleteByTrip (Plan 4 Task 1)', () => {
  it("TIREPO-004: removes the trip's row and only that trip's row", async () => {
    const { user } = createUser(testDb);
    const tripA = createTrip(testDb, user.id);
    const tripB = createTrip(testDb, user.id);
    await tripInviteTokens.insertForTrip({ trip_id: tripA.id, token: 'a', created_by: user.id, expires_at: null });
    await tripInviteTokens.insertForTrip({ trip_id: tripB.id, token: 'b', created_by: user.id, expires_at: null });

    await tripInviteTokens.deleteByTrip(tripA.id);

    expect(await tripInviteTokens.existsForTrip(tripA.id)).toBe(false);
    expect(await tripInviteTokens.existsForTrip(tripB.id)).toBe(true);
  });

  it('TIREPO-005: deleting a trip with no row is a no-op', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await expect(tripInviteTokens.deleteByTrip(trip.id)).resolves.toBeUndefined();
  });
});

describe('TripInviteTokensRepository.resolveTokenToTrip (Plan 4 Task 1, mutation proof for token validation)', () => {
  it('TIREPO-006: resolves a valid token to its trip id/title/expires_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Kyoto Loop' });
    await tripInviteTokens.insertForTrip({
      trip_id: trip.id,
      token: 'real-token',
      created_by: user.id,
      expires_at: '2030-01-01T00:00:00.000Z',
    });

    expect(await tripInviteTokens.resolveTokenToTrip('real-token')).toEqual({
      trip_id: trip.id,
      title: 'Kyoto Loop',
      expires_at: '2030-01-01T00:00:00.000Z',
    });
  });

  it('TIREPO-007: an unknown token resolves to undefined — never a row from a different trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await tripInviteTokens.insertForTrip({
      trip_id: trip.id,
      token: 'real-token',
      created_by: user.id,
      expires_at: null,
    });

    expect(await tripInviteTokens.resolveTokenToTrip('forged-token')).toBeUndefined();
  });

  it("TIREPO-008: a token that used to resolve stops resolving once it's rotated away (mutation proof)", async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await tripInviteTokens.insertForTrip({
      trip_id: trip.id,
      token: 'old-token',
      created_by: user.id,
      expires_at: null,
    });
    await tripInviteTokens.updateForTrip(trip.id, { token: 'new-token', expires_at: null, created_by: user.id });

    expect(await tripInviteTokens.resolveTokenToTrip('old-token')).toBeUndefined();
    expect((await tripInviteTokens.resolveTokenToTrip('new-token'))?.trip_id).toBe(trip.id);
  });
});
