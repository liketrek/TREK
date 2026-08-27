/**
 * Unit tests for the DI-native ShareService — SHARE-SVC-001 through
 * SHARE-SVC-025 (the SHARE-001..026 range belongs to the HTTP parity suite in
 * tests/integration/share.test.ts; these pin the service SQL directly; the
 * 026–028 bridge-delegation cases died with share.bridge when the legacy
 * share-link tools moved to share.mcp.ts). Uses a real in-memory SQLite DB so
 * SQL logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';

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
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`
        SELECT t.id, t.user_id FROM trips t
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
        WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
      `).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const checkPermission = vi.fn();
const permissionsStub = { checkPermission } as unknown as PermissionsService;

// Injected stub since the photo-cache fold (was a path mock of the module).
const serveKey = vi.fn();
const photoCacheStub = { serveKey } as unknown as PlacePhotoCacheService;

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import {
  createUser, createTrip, addTripMember, createDay, createPlace, createDayAssignment,
} from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { ShareService } from '../../../src/nest/share/share.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import type { User } from '../../../src/types';

const svc = new ShareService(new DatabaseService(testDb), new SettingsService(new DatabaseService(testDb)), permissionsStub, new QueryHelpersService(new DatabaseService(testDb)), photoCacheStub);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  checkPermission.mockReset();
  serveKey.mockReset();
});

afterAll(() => {
  testDb.close();
});

function shareRow(tripId: number | string) {
  return testDb.prepare('SELECT * FROM share_tokens WHERE trip_id = ?').get(tripId) as any;
}

/** Owner + trip + a share link with all five flags on unless overridden. */
function seedSharedTrip(flags: Record<string, boolean> = {}) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const { token } = svc.createOrUpdate(String(trip.id), user.id, {
    share_map: true, share_bookings: true, share_packing: true, share_budget: true, share_collab: true,
    ...flags,
  });
  return { user, trip, token };
}

// ── verifyTripAccess / canManage ──────────────────────────────────────────────

describe('verifyTripAccess and canManage', () => {
  it('SHARE-SVC-001: verifyTripAccess returns the trip for owner and member, nothing for a stranger', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect(svc.verifyTripAccess(String(trip.id), owner.id)?.id).toBe(trip.id);
    expect(svc.verifyTripAccess(String(trip.id), member.id)).toBeDefined();
    expect(svc.verifyTripAccess(String(trip.id), stranger.id)).toBeFalsy();
  });

  it('SHARE-SVC-002: canManage forwards the share_manage check with the ownership flag', () => {
    checkPermission.mockReturnValue(true);
    const trip = { id: 5, user_id: 1 } as any;
    const owner = { id: 1, role: 'user' } as User;
    const member = { id: 2, role: 'user' } as User;
    expect(svc.canManage(trip, owner)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('share_manage', 'user', 1, 1, false);
    svc.canManage(trip, member);
    expect(checkPermission).toHaveBeenLastCalledWith('share_manage', 'user', 1, 2, true);
  });
});

// ── createOrUpdate ────────────────────────────────────────────────────────────

describe('createOrUpdate', () => {
  it('SHARE-SVC-003: creates a link with default flags (map/bookings on, rest off) and a 90-day expiry', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const before = Date.now();
    const result = svc.createOrUpdate(String(trip.id), user.id, {});
    expect(result.created).toBe(true);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
    const row = shareRow(trip.id);
    expect(row.token).toBe(result.token);
    expect(row.created_by).toBe(user.id);
    expect([row.share_map, row.share_bookings, row.share_packing, row.share_budget, row.share_collab])
      .toEqual([1, 1, 0, 0, 0]);
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const expires = new Date(row.expires_at).getTime();
    expect(expires).toBeGreaterThanOrEqual(before + ninetyDays - 5000);
    expect(expires).toBeLessThanOrEqual(Date.now() + ninetyDays + 5000);
  });

  it('SHARE-SVC-004: explicit flags override the defaults in both directions', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    svc.createOrUpdate(String(trip.id), user.id, {
      share_map: false, share_bookings: false, share_packing: true, share_budget: true, share_collab: true,
    });
    const row = shareRow(trip.id);
    expect([row.share_map, row.share_bookings, row.share_packing, row.share_budget, row.share_collab])
      .toEqual([0, 0, 1, 1, 1]);
  });

  it('SHARE-SVC-005: a second call updates the flags, keeps the token, and reports created:false', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const first = svc.createOrUpdate(String(trip.id), user.id, {});
    const second = svc.createOrUpdate(String(trip.id), user.id, { share_budget: true });
    expect(second).toEqual({ token: first.token, created: false });
    expect(shareRow(trip.id).share_budget).toBe(1);
  });

  it('SHARE-SVC-006: the update path re-applies the defaults for omitted flags and renews the 90-day expiry', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    svc.createOrUpdate(String(trip.id), user.id, { share_packing: true });
    // Simulate a legacy pre-TTL row (NULL expiry): an explicit update moves it
    // onto the 90-day clock.
    testDb.prepare('UPDATE share_tokens SET expires_at = NULL WHERE trip_id = ?').run(trip.id);
    const before = Date.now();
    svc.createOrUpdate(String(trip.id), user.id, {});
    const row = shareRow(trip.id);
    // Omitted share_packing fell back to its default (off) — destructuring
    // defaults apply on every call, not only on create.
    expect(row.share_packing).toBe(0);
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const expires = new Date(row.expires_at).getTime();
    expect(expires).toBeGreaterThanOrEqual(before + ninetyDays - 5000);
    expect(expires).toBeLessThanOrEqual(Date.now() + ninetyDays + 5000);
  });
});

// ── get / remove ──────────────────────────────────────────────────────────────

describe('get and remove', () => {
  it('SHARE-SVC-007: get returns null when no link exists', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.get(String(trip.id))).toBeNull();
  });

  it('SHARE-SVC-008: get returns the token with the flags coerced to booleans', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const { token } = svc.createOrUpdate(String(trip.id), user.id, { share_packing: true });
    const info = svc.get(String(trip.id));
    expect(info).toEqual({
      token,
      created_at: expect.any(String),
      share_map: true,
      share_bookings: true,
      share_packing: true,
      share_budget: false,
      share_collab: false,
    });
  });

  it('SHARE-SVC-009: remove deletes the link and is a no-op when none exists', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    svc.createOrUpdate(String(trip.id), user.id, {});
    svc.remove(String(trip.id));
    expect(shareRow(trip.id)).toBeUndefined();
    expect(() => svc.remove(String(trip.id))).not.toThrow();
  });
});

// ── getSharedTripData ─────────────────────────────────────────────────────────

describe('getSharedTripData', () => {
  it('SHARE-SVC-010: returns null for an unknown token', () => {
    expect(svc.getSharedTripData('nope')).toBeNull();
  });

  it('SHARE-SVC-011: returns null for an expired token but honours NULL expiry (legacy rows)', () => {
    const { trip, token } = seedSharedTrip();
    testDb.prepare('UPDATE share_tokens SET expires_at = ? WHERE trip_id = ?').run('2020-01-01T00:00:00.000Z', trip.id);
    expect(svc.getSharedTripData(token)).toBeNull();
    testDb.prepare('UPDATE share_tokens SET expires_at = NULL WHERE trip_id = ?').run(trip.id);
    expect(svc.getSharedTripData(token)).not.toBeNull();
  });

  it('SHARE-SVC-012: returns null when the trip row is gone', () => {
    const { trip, token } = seedSharedTrip();
    // The token normally cascades away with its trip; orphan it deliberately
    // to pin the defensive `if (!trip) return null` branch.
    testDb.exec('PRAGMA foreign_keys = OFF');
    testDb.prepare('DELETE FROM trips WHERE id = ?').run(trip.id);
    testDb.exec('PRAGMA foreign_keys = ON');
    expect(svc.getSharedTripData(token)).toBeNull();
  });

  it('SHARE-SVC-013: returns the trip projection, coerced permissions and grouped itinerary', () => {
    const { trip, token } = seedSharedTrip();
    const day = createDay(testDb, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    createDayAssignment(testDb, day.id, place.id, { notes: 'go early' });
    const data = svc.getSharedTripData(token)!;
    expect(data).not.toBeNull();
    expect(data.trip).toEqual(expect.objectContaining({ id: trip.id, title: trip.title }));
    // Explicit column list — no owner id or internal fields on the trip row.
    expect(Object.keys(data.trip).sort()).toEqual(
      ['cover_image', 'currency', 'description', 'end_date', 'id', 'start_date', 'title'],
    );
    expect(data.permissions).toEqual({
      share_map: true, share_bookings: true, share_packing: true, share_budget: true, share_collab: true,
    });
    expect(data.days).toHaveLength(1);
    const entries = data.assignments[day.id];
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual(expect.objectContaining({ day_id: day.id, notes: 'go early' }));
    expect(entries[0].place).toEqual(expect.objectContaining({
      id: place.id, name: 'Louvre', tags: [],
    }));
    expect(entries[0].place.category).toEqual(expect.objectContaining({ id: place.category_id }));
    expect(data.collab).toEqual([]);
  });

  it('SHARE-SVC-014: COALESCEs assignment times over place times', () => {
    const { trip, token } = seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET place_time = ?, end_time = ? WHERE id = ?').run('09:00', '10:00', place.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    let entry = svc.getSharedTripData(token)!.assignments[day.id][0];
    expect(entry.place.place_time).toBe('09:00');
    expect(entry.place.end_time).toBe('10:00');
    testDb.prepare('UPDATE day_assignments SET assignment_time = ?, assignment_end_time = ? WHERE id = ?').run('14:00', '15:00', a.id);
    entry = svc.getSharedTripData(token)!.assignments[day.id][0];
    expect(entry.place.place_time).toBe('14:00');
    expect(entry.place.end_time).toBe('15:00');
  });

  it('SHARE-SVC-015: orders assignments by order_index, then created_at as tiebreaker', () => {
    const { trip, token } = seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const p1 = createPlace(testDb, trip.id, { name: 'First' });
    const p2 = createPlace(testDb, trip.id, { name: 'Second' });
    testDb.prepare(
      "INSERT INTO day_assignments (day_id, place_id, order_index, created_at) VALUES (?, ?, 0, '2025-01-01T11:00:00')"
    ).run(day.id, p2.id);
    testDb.prepare(
      "INSERT INTO day_assignments (day_id, place_id, order_index, created_at) VALUES (?, ?, 0, '2025-01-01T10:00:00')"
    ).run(day.id, p1.id);
    const entries = svc.getSharedTripData(token)!.assignments[day.id];
    expect(entries.map((e: any) => e.place.name)).toEqual(['First', 'Second']);
  });

  it('SHARE-SVC-016: attaches reservation day_positions, null when a reservation has none', () => {
    const { trip, token } = seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const r1 = testDb.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Flight', 'flight')").run(trip.id);
    const r2 = testDb.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Hotel', 'hotel')").run(trip.id);
    testDb.prepare('INSERT INTO reservation_day_positions (reservation_id, day_id, position) VALUES (?, ?, 3)')
      .run(r1.lastInsertRowid, day.id);
    const reservations = svc.getSharedTripData(token)!.reservations;
    const flight = reservations.find((r: any) => r.id === r1.lastInsertRowid);
    const hotel = reservations.find((r: any) => r.id === r2.lastInsertRowid);
    expect(flight.day_positions).toEqual({ [day.id]: 3 });
    expect(hotel.day_positions).toBeNull();
  });

  it('SHARE-SVC-017: excludes private packing items from the public payload (#858)', () => {
    const { user, trip, token } = seedSharedTrip();
    testDb.prepare("INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, 'Common', 0, ?)").run(trip.id, user.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name, is_private, owner_id) VALUES (?, 'Secret', 1, ?)").run(trip.id, user.id);
    const packing = svc.getSharedTripData(token)!.packing;
    expect(packing.map((p: any) => p.name)).toEqual(['Common']);
  });

  it('SHARE-SVC-018: includes non-deleted collab messages only when share_collab is on', () => {
    const { user, trip, token } = seedSharedTrip();
    testDb.prepare("INSERT INTO collab_messages (trip_id, user_id, text, deleted) VALUES (?, ?, 'Hello', 0)").run(trip.id, user.id);
    testDb.prepare("INSERT INTO collab_messages (trip_id, user_id, text, deleted) VALUES (?, ?, 'Gone', 1)").run(trip.id, user.id);
    const collab = svc.getSharedTripData(token)!.collab;
    expect(collab).toHaveLength(1);
    expect(collab[0]).toEqual(expect.objectContaining({ text: 'Hello', username: user.username }));

    svc.createOrUpdate(String(trip.id), user.id, { share_collab: false });
    expect(svc.getSharedTripData(token)!.collab).toEqual([]);
  });

  it('SHARE-SVC-019: withholds each section when its flag is off', () => {
    const { trip, token } = seedSharedTrip({
      share_map: false, share_bookings: false, share_packing: false, share_budget: false, share_collab: false,
    });
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, day.id, place.id);
    testDb.prepare("INSERT INTO reservations (trip_id, title, type) VALUES (?, 'Flight', 'flight')").run(trip.id);
    testDb.prepare("INSERT INTO packing_items (trip_id, name) VALUES (?, 'Socks')").run(trip.id);
    testDb.prepare("INSERT INTO budget_items (trip_id, name, category, total_price) VALUES (?, 'Food', 'food', 10)").run(trip.id);
    const data = svc.getSharedTripData(token)!;
    expect(data.days).toEqual([]);
    expect(data.assignments).toEqual({});
    expect(data.dayNotes).toEqual({});
    expect(data.places).toEqual([]);
    expect(data.reservations).toEqual([]);
    expect(data.accommodations).toEqual([]);
    expect(data.packing).toEqual([]);
    expect(data.budget).toEqual([]);
    expect(data.collab).toEqual([]);
  });

  it('SHARE-SVC-020: baseCurrency falls back trip currency → EUR, with the owner default_currency winning (#1361)', () => {
    const { user, trip, token } = seedSharedTrip();
    expect(svc.getSharedTripData(token)!.baseCurrency).toBe('EUR');
    testDb.prepare('UPDATE trips SET currency = ? WHERE id = ?').run('USD', trip.id);
    expect(svc.getSharedTripData(token)!.baseCurrency).toBe('USD');
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'default_currency', ' CHF ')").run(user.id);
    expect(svc.getSharedTripData(token)!.baseCurrency).toBe('CHF');
  });

  it('SHARE-SVC-021: rewrites place-photo proxy URLs to the token-scoped route, passing others through', () => {
    const { trip, token } = seedSharedTrip();
    const proxied = createPlace(testDb, trip.id, { name: 'Proxied' });
    const uploaded = createPlace(testDb, trip.id, { name: 'Uploaded' });
    createPlace(testDb, trip.id, { name: 'Bare' });
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/api/maps/place-photo/ChIJabc/bytes', proxied.id);
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/pic.jpg', uploaded.id);
    const byName = Object.fromEntries(
      svc.getSharedTripData(token)!.places.map((p: any) => [p.name, p.image_url]),
    );
    expect(byName['Proxied']).toBe(`/api/shared/${token}/place-photo/ChIJabc/bytes`);
    expect(byName['Uploaded']).toBe('/uploads/pic.jpg');
    expect(byName['Bare']).toBeNull();
  });

  it('SHARE-SVC-027: cartoApiKey resolves owner setting → admin instance default → empty (#2054)', () => {
    const { user, token } = seedSharedTrip();
    expect(svc.getSharedTripData(token)!.cartoApiKey).toBe('');
    testDb.prepare("INSERT INTO app_settings (key, value) VALUES ('default_user_setting_carto_api_key', 'instance-key')").run();
    expect(svc.getSharedTripData(token)!.cartoApiKey).toBe('instance-key');
    testDb.prepare("INSERT INTO settings (user_id, key, value) VALUES (?, 'carto_api_key', ' owner-key ')").run(user.id);
    expect(svc.getSharedTripData(token)!.cartoApiKey).toBe('owner-key');
  });
});

// ── getSharedPlacePhotoKey ───────────────────────────────────────────────────

describe('getSharedPlacePhotoKey', () => {
  it('SHARE-SVC-022: returns null for an unknown or expired token', async () => {
    expect(await svc.getSharedPlacePhotoKey('nope', 'ChIJabc')).toBeNull();
    const { trip, token } = seedSharedTrip();
    testDb.prepare('UPDATE share_tokens SET expires_at = ? WHERE trip_id = ?').run('2020-01-01T00:00:00.000Z', trip.id);
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  it('SHARE-SVC-023: returns null when the owner disabled the map section', async () => {
    const { trip, token } = seedSharedTrip({ share_map: false });
    const place = createPlace(testDb, trip.id);
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/api/maps/place-photo/ChIJabc/bytes', place.id);
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  it('SHARE-SVC-024: returns null when no place in the trip carries the proxy URL', async () => {
    const { token } = seedSharedTrip();
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  it('SHARE-SVC-025: resolves via serveKey when the encoded placeId matches the stored URL', async () => {
    const { trip, token } = seedSharedTrip();
    const place = createPlace(testDb, trip.id);
    // Wikimedia pseudo-IDs contain characters that must round-trip encoded.
    const placeId = 'coords:48.8,2.3';
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?')
      .run(`/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes`, place.id);
    serveKey.mockReturnValue('abc.jpg');
    expect(await svc.getSharedPlacePhotoKey(token, placeId)).toBe('abc.jpg');
    expect(serveKey).toHaveBeenCalledWith(placeId);
  });
});

// SHARE-SVC-026..028 (share.bridge delegation) were deleted with the bridge —
// its last consumer, the legacy share-link tools in src/mcp/tools/trips.ts,
// moved to the DI-discovered share.mcp.ts.
