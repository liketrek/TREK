/**
 * ShareTokensRepository — full-key parity (rule 19) for SH1-SH6/SH17/UC6,
 * plan 4 Task 8b's 3h L4 carry ("3h L4 `ShareTokens` + the
 * `listPublicForShare` family full-key parity tests" — this file is the
 * `ShareTokens` half; the `listPublicForShare` family lives on its own
 * repositories). Every read below is checked against the legacy statement
 * run raw on the SAME better-sqlite3 connection the repository itself
 * reads through, with every nullable column seeded both null and set, per
 * the shape `InviteTokens.repository.test.ts` uses.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { createTrip, createUser } from '../../../helpers/factories';
import { ShareTokens } from '../../../../src/db/entities/ShareTokens.entity';
import type { ShareTokensRepository } from '../../../../src/db/repositories/ShareTokens.repository';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: ShareTokensRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = t.repo(ShareTokens);
});
beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

function rawShareToken(id: number): unknown {
  return testDb.prepare('SELECT * FROM share_tokens WHERE id = ?').get(id);
}

/** A raw `share_tokens` insert — no factory exists for this table yet. */
function insertShareToken(
  tripId: number,
  createdBy: number,
  overrides: Partial<{
    token: string;
    share_map: number | null;
    share_bookings: number | null;
    share_packing: number | null;
    share_budget: number | null;
    share_collab: number | null;
    expires_at: string | null;
  }> = {},
): number {
  const result = testDb.prepare(
    `INSERT INTO share_tokens
       (trip_id, token, created_by, share_map, share_bookings, share_packing, share_budget, share_collab, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    tripId,
    overrides.token ?? `token-${tripId}-${crypto.randomUUID().slice(0, 8)}`,
    createdBy,
    overrides.share_map === undefined ? 1 : overrides.share_map,
    overrides.share_bookings === undefined ? 1 : overrides.share_bookings,
    overrides.share_packing === undefined ? 0 : overrides.share_packing,
    overrides.share_budget === undefined ? 0 : overrides.share_budget,
    overrides.share_collab === undefined ? 0 : overrides.share_collab,
    overrides.expires_at === undefined ? null : overrides.expires_at,
  );
  return Number(result.lastInsertRowid);
}

describe('ShareTokensRepository', () => {
  describe('findRawByTrip (SH4) — full row, every nullable column both null and set', () => {
    it('SHTOKREPO-001: a share_tokens row with every nullable column NULL matches SELECT * run raw', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = insertShareToken(trip.id, user.id, {
        share_map: null, share_bookings: null, share_packing: null, share_budget: null, share_collab: null, expires_at: null,
      });

      const row = await repo.findRawByTrip(trip.id);

      expect(row).toEqual(rawShareToken(id));
    });

    it('SHTOKREPO-002: a share_tokens row with every nullable column SET matches SELECT * run raw', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = insertShareToken(trip.id, user.id, {
        share_map: 1, share_bookings: 0, share_packing: 1, share_budget: 0, share_collab: 1, expires_at: '2099-01-01 00:00:00',
      });

      const row = await repo.findRawByTrip(trip.id);

      expect(row).toEqual(rawShareToken(id));
    });

    it('SHTOKREPO-003: no row for the trip is undefined', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      expect(await repo.findRawByTrip(trip.id)).toBeUndefined();
    });
  });

  describe('findTokenByTrip (SH1)', () => {
    it('SHTOKREPO-004: matches SELECT token FROM share_tokens WHERE trip_id = ? run raw', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'find-me-by-trip' });

      const legacy = testDb.prepare('SELECT token FROM share_tokens WHERE trip_id = ?').get(trip.id);

      expect(await repo.findTokenByTrip(trip.id)).toEqual(legacy);
    });

    it('SHTOKREPO-005: no row for the trip is undefined', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      expect(await repo.findTokenByTrip(trip.id)).toBeUndefined();
    });
  });

  describe('findValidByToken (SH6) — the shared token/expiry predicate', () => {
    it('SHTOKREPO-006: a token with expires_at NULL (never expires) matches the full row run raw', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const id = insertShareToken(trip.id, user.id, { token: 'never-expires', expires_at: null });

      const legacy = testDb
        .prepare("SELECT * FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('never-expires');

      const row = await repo.findValidByToken('never-expires');
      expect(row).toEqual(legacy);
      expect(row).toEqual(rawShareToken(id));
    });

    it('SHTOKREPO-007: a token with a future expires_at still matches', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'future-expiry', expires_at: '2099-01-01 00:00:00' });

      const legacy = testDb
        .prepare("SELECT * FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('future-expiry');

      expect(await repo.findValidByToken('future-expiry')).toEqual(legacy);
    });

    it('SHTOKREPO-008: an EXPIRED token (past expires_at) matches neither the repository read nor the legacy predicate — both undefined', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'past-expiry', expires_at: '2020-01-01 00:00:00' });

      const legacy = testDb
        .prepare("SELECT * FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('past-expiry');

      expect(legacy).toBeUndefined();
      expect(await repo.findValidByToken('past-expiry')).toBeUndefined();
    });

    it('SHTOKREPO-009: an unknown token is undefined', async () => {
      expect(await repo.findValidByToken('does-not-exist')).toBeUndefined();
    });
  });

  describe('findTripAndShareMapByToken (SH17) — narrow projection, same valid-token predicate', () => {
    it('SHTOKREPO-010: matches the narrow legacy projection, share_map both set and NULL', async () => {
      const { user } = createUser(testDb);
      const tripA = createTrip(testDb, user.id);
      const tripB = createTrip(testDb, user.id);
      insertShareToken(tripA.id, user.id, { token: 'map-set', share_map: 1 });
      insertShareToken(tripB.id, user.id, { token: 'map-null', share_map: null });

      const legacySet = testDb
        .prepare("SELECT trip_id, share_map, share_hide_images FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('map-set');
      const legacyNull = testDb
        .prepare("SELECT trip_id, share_map, share_hide_images FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('map-null');

      expect(await repo.findTripAndShareMapByToken('map-set')).toEqual(legacySet);
      expect(await repo.findTripAndShareMapByToken('map-null')).toEqual(legacyNull);
    });

    it('SHTOKREPO-011: an expired token is undefined, same as the legacy predicate', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'expired-map', expires_at: '2020-01-01 00:00:00' });
      expect(await repo.findTripAndShareMapByToken('expired-map')).toBeUndefined();
    });
  });

  describe('findTripIdByToken (R1, platform.routes.ts pre-init fallback) — same valid-token predicate', () => {
    it('SHTOKREPO-012: matches the narrow legacy projection', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'trip-id-only' });

      const legacy = testDb
        .prepare("SELECT trip_id FROM share_tokens WHERE token = ? AND (expires_at IS NULL OR expires_at > datetime('now'))")
        .get('trip-id-only');

      expect(await repo.findTripIdByToken('trip-id-only')).toEqual(legacy);
    });

    it('SHTOKREPO-013: an expired token is undefined', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      insertShareToken(trip.id, user.id, { token: 'trip-id-expired', expires_at: '2020-01-01 00:00:00' });
      expect(await repo.findTripIdByToken('trip-id-expired')).toBeUndefined();
    });
  });

  describe('insertNew (SH3) / updateFlagsByTrip (SH2) / deleteByTrip (SH5) / deleteByCreator (UC6)', () => {
    it('SHTOKREPO-014: insertNew writes exactly the given columns, re-readable raw', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);

      await repo.insertNew({
        trip_id: trip.id, token: 'inserted-token', created_by: user.id,
        share_map: 1, share_bookings: 0, share_packing: 1, share_budget: 0, share_collab: 1,
        share_travel_only: 1, share_hide_images: 0, expires_at: '2099-06-01 00:00:00',
      });

      const raw = testDb.prepare('SELECT * FROM share_tokens WHERE token = ?').get('inserted-token') as Record<string, unknown>;
      expect(raw).toMatchObject({
        trip_id: trip.id, token: 'inserted-token', created_by: user.id,
        share_map: 1, share_bookings: 0, share_packing: 1, share_budget: 0, share_collab: 1,
        share_travel_only: 1, share_hide_images: 0, expires_at: '2099-06-01 00:00:00',
      });
    });

    it('SHTOKREPO-015: updateFlagsByTrip overwrites all eight flag columns for that trip only', async () => {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const other = createTrip(testDb, user.id);
      const id = insertShareToken(trip.id, user.id, { token: 'to-update' });
      const otherId = insertShareToken(other.id, user.id, { token: 'untouched' });

      await repo.updateFlagsByTrip(trip.id, {
        share_map: 0, share_bookings: 0, share_packing: 0, share_budget: 0, share_collab: 0,
        share_travel_only: 1, share_hide_images: 1, expires_at: '2099-12-31 00:00:00',
      });

      expect(rawShareToken(id)).toMatchObject({
        share_map: 0, share_bookings: 0, share_packing: 0, share_budget: 0, share_collab: 0,
        share_travel_only: 1, share_hide_images: 1, expires_at: '2099-12-31 00:00:00',
      });
      // The other trip's row is untouched — a different predicate, not a global update.
      expect(rawShareToken(otherId)).toMatchObject({ share_map: 1, share_bookings: 1, share_travel_only: 0, share_hide_images: 0 });
    });

    it('SHTOKREPO-016: deleteByTrip removes exactly that trip\'s row, leaving another trip\'s row alone', async () => {
      const { user } = createUser(testDb);
      const tripA = createTrip(testDb, user.id);
      const tripB = createTrip(testDb, user.id);
      insertShareToken(tripA.id, user.id, { token: 'delete-me' });
      const keepId = insertShareToken(tripB.id, user.id, { token: 'keep-me' });

      await repo.deleteByTrip(tripA.id);

      expect(await repo.findRawByTrip(tripA.id)).toBeUndefined();
      expect(rawShareToken(keepId)).toBeDefined();
    });

    it('SHTOKREPO-017: deleteByCreator removes every link that user created, across every trip, leaving another creator\'s links alone (DISTINCT from deleteByTrip)', async () => {
      const { user: creator } = createUser(testDb);
      const { user: otherCreator } = createUser(testDb);
      const tripA = createTrip(testDb, creator.id);
      const tripB = createTrip(testDb, creator.id);
      const tripC = createTrip(testDb, otherCreator.id);
      insertShareToken(tripA.id, creator.id, { token: 'creator-a' });
      insertShareToken(tripB.id, creator.id, { token: 'creator-b' });
      const otherId = insertShareToken(tripC.id, otherCreator.id, { token: 'other-creator' });

      await repo.deleteByCreator(creator.id);

      expect(await repo.findRawByTrip(tripA.id)).toBeUndefined();
      expect(await repo.findRawByTrip(tripB.id)).toBeUndefined();
      expect(rawShareToken(otherId)).toBeDefined();
    });
  });
});
