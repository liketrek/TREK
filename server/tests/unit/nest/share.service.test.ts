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

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  // Trip access reads through TripsRepository now; the module only hands out the handle.
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

const checkPermission = vi.fn();
const permissionsStub = { checkPermission } as unknown as PermissionsService;

// Injected stub since the photo-cache fold (was a path mock of the module).
const serveKey = vi.fn();
const photoCacheStub = { serveKey } as unknown as PlacePhotoCacheService;

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import {
  createUser, createTrip, addTripMember, createDay, createPlace, createDayAssignment,
  createDayAccommodation, createDayNote, createReservation,
} from '../../helpers/factories';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { ShareService, publicReservationMetadata } from '../../../src/nest/share/share.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import type { User } from '../../../src/types';
import { sharedTestOrm, createTestUnitOfWork, createTestAppSettingsRepo, createTestSettingsRepo, createTestTagsRepo, createTestPlaceRatingsRepo, createTestAssignmentParticipantsRepo } from '../../helpers/test-uow';
import { shareServiceRepoArgs } from '../../helpers/share-repos';
import type { TestOrm } from '../../helpers/test-orm';
import type { EntityData, RequiredEntityData } from '@mikro-orm/core';
import { deleteRows, findRow, insertRow, updateRows } from '../../helpers/factories/rows';
import { setAppSetting, setUserSetting } from '../../helpers/factories/settings';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { CollabMessages } from '../../../src/db/entities/CollabMessages.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { PackingItems } from '../../../src/db/entities/PackingItems.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { ReservationDayPositions } from '../../../src/db/entities/ReservationDayPositions.entity';
import { ReservationEndpoints } from '../../../src/db/entities/ReservationEndpoints.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { ShareTokens } from '../../../src/db/entities/ShareTokens.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';

let svc: ShareService;
let t: TestOrm;

// `t`, `uow` and the settings repositories all derive from the SAME
// `sharedTestOrm(testDb)` (task-2-review.md I2) — see settings.service.test.ts's
// own comment on this pattern.
beforeAll(async () => {
  t = await sharedTestOrm(testDb);
  svc = new ShareService(
    new SettingsService(await createTestUnitOfWork(testDb), await createTestAppSettingsRepo(testDb), await createTestSettingsRepo(testDb)),
    permissionsStub,
    new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
    photoCacheStub,
    await createTestUnitOfWork(testDb),
    ...(await shareServiceRepoArgs(testDb)),
  );
});

beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
  checkPermission.mockReset();
  serveKey.mockReset();
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

function shareRow(tripId: number | string) {
  return findRow(t, ShareTokens, { trip: Number(tripId) });
}

/** A reservation on the trip with exactly the given columns; returns its id. */
function addReservation(tripId: number, columns: EntityData<Reservations>): Promise<number> {
  return insertRow(t, Reservations, { trip: tripId, ...columns } as RequiredEntityData<Reservations>);
}

/** Owner + trip + a share link with all five flags on unless overridden. */
async function seedSharedTrip(flags: Record<string, boolean> = {}) {
  const { user } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  const { token } = await svc.createOrUpdate(String(trip.id), user.id, {
    share_map: true, share_bookings: true, share_packing: true, share_budget: true, share_collab: true,
    ...flags,
  });
  return { user, trip, token };
}

// ── verifyTripAccess / canManage ──────────────────────────────────────────────

describe('verifyTripAccess and canManage', () => {
  it('SHARE-SVC-001: verifyTripAccess returns the trip for owner and member, nothing for a stranger', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    expect((await svc.verifyTripAccess(String(trip.id), owner.id))?.id).toBe(trip.id);
    expect(await svc.verifyTripAccess(String(trip.id), member.id)).toBeDefined();
    expect(await svc.verifyTripAccess(String(trip.id), stranger.id)).toBeFalsy();
  });

  it('SHARE-SVC-002: canManage forwards the share_manage check with the ownership flag', async () => {
    checkPermission.mockReturnValue(true);
    const trip = { id: 5, user_id: 1 } as any;
    const owner = { id: 1, role: 'user' } as User;
    const member = { id: 2, role: 'user' } as User;
    expect(await svc.canManage(trip, owner)).toBe(true);
    expect(checkPermission).toHaveBeenLastCalledWith('share_manage', 'user', 1, 1, false);
    await svc.canManage(trip, member);
    expect(checkPermission).toHaveBeenLastCalledWith('share_manage', 'user', 1, 2, true);
  });
});

// ── createOrUpdate ────────────────────────────────────────────────────────────

describe('createOrUpdate', () => {
  it('SHARE-SVC-003: creates a link with default flags (map/bookings on, rest off) and a 90-day expiry', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const before = Date.now();
    const result = await svc.createOrUpdate(String(trip.id), user.id, {});
    expect(result.created).toBe(true);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/); // base64url
    const row = (await shareRow(trip.id))!;
    expect(row.token).toBe(result.token);
    expect(row.created_by).toBe(user.id);
    expect([row.share_map, row.share_bookings, row.share_packing, row.share_budget, row.share_collab])
      .toEqual([1, 1, 0, 0, 0]);
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;
    const expires = new Date(row.expires_at).getTime();
    expect(expires).toBeGreaterThanOrEqual(before + ninetyDays - 5000);
    expect(expires).toBeLessThanOrEqual(Date.now() + ninetyDays + 5000);
  });

  it('SHARE-SVC-004: explicit flags override the defaults in both directions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await svc.createOrUpdate(String(trip.id), user.id, {
      share_map: false, share_bookings: false, share_packing: true, share_budget: true, share_collab: true,
    });
    const row = (await shareRow(trip.id))!;
    expect([row.share_map, row.share_bookings, row.share_packing, row.share_budget, row.share_collab])
      .toEqual([0, 0, 1, 1, 1]);
  });

  it('SHARE-SVC-005: a second call updates the flags, keeps the token, and reports created:false', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const first = await svc.createOrUpdate(String(trip.id), user.id, {});
    const second = await svc.createOrUpdate(String(trip.id), user.id, { share_budget: true });
    expect(second).toEqual({ token: first.token, created: false });
    expect((await shareRow(trip.id))!.share_budget).toBe(1);
  });

  it('SHARE-SVC-006: the update path re-applies the defaults for omitted flags and renews the 90-day expiry', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await svc.createOrUpdate(String(trip.id), user.id, { share_packing: true });
    // Simulate a legacy pre-TTL row (NULL expiry): an explicit update moves it
    // onto the 90-day clock.
    await updateRows(t, ShareTokens, { trip: trip.id }, { expires_at: null });
    const before = Date.now();
    await svc.createOrUpdate(String(trip.id), user.id, {});
    const row = (await shareRow(trip.id))!;
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
  it('SHARE-SVC-007: get returns null when no link exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.get(String(trip.id))).toBeNull();
  });

  it('SHARE-SVC-008: get returns the token with the flags coerced to booleans', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const { token } = await svc.createOrUpdate(String(trip.id), user.id, { share_packing: true });
    const info = await svc.get(String(trip.id));
    expect(info).toEqual({
      token,
      created_at: expect.any(String),
      share_map: true,
      share_bookings: true,
      share_packing: true,
      share_budget: false,
      share_collab: false,
      share_travel_only: false,
      share_hide_images: false,
    });
  });

  it('SHARE-SVC-009: remove deletes the link and is a no-op when none exists', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await svc.createOrUpdate(String(trip.id), user.id, {});
    await svc.remove(String(trip.id));
    expect(await shareRow(trip.id)).toBeNull();
    await expect(svc.remove(String(trip.id))).resolves.toBeUndefined();
  });
});

// ── getSharedTripData ─────────────────────────────────────────────────────────

describe('getSharedTripData', () => {
  it('SHARE-SVC-010: returns null for an unknown token', async () => {
    expect(await svc.getSharedTripData('nope')).toBeNull();
  });

  it('SHARE-SVC-011: returns null for an expired token but honours NULL expiry (legacy rows)', async () => {
    const { trip, token } = await seedSharedTrip();
    await updateRows(t, ShareTokens, { trip: trip.id }, { expires_at: '2020-01-01T00:00:00.000Z' });
    expect(await svc.getSharedTripData(token)).toBeNull();
    await updateRows(t, ShareTokens, { trip: trip.id }, { expires_at: null });
    expect(await svc.getSharedTripData(token)).not.toBeNull();
  });

  // R5's six-case matrix (valid, revoked, unknown, wrong-case, NUL-byte,
  // expired) — SHARE-SVC-010/011 above already pin unknown/expired; the
  // remaining four are named separately here, per the plan's "a failure in
  // one branch must not be masked by another's passing case" discipline.
  it('SHARE-SVC-039 (R5, valid): a freshly created token returns the shared payload', async () => {
    const { token } = await seedSharedTrip();
    expect(await svc.getSharedTripData(token)).not.toBeNull();
  });

  it('SHARE-SVC-040 (R5, revoked): a deleted token returns null — distinct from merely unknown', async () => {
    const { trip, token } = await seedSharedTrip();
    expect(await svc.getSharedTripData(token)).not.toBeNull();
    await deleteRows(t, ShareTokens, { trip: trip.id });
    expect(await svc.getSharedTripData(token)).toBeNull();
  });

  it('SHARE-SVC-041 (R5, wrong-case): a differently-cased token never matches — no case-folding introduced (mutation proof: a COLLATE NOCASE companion would flip this red)', async () => {
    const { token } = await seedSharedTrip();
    const flipped = token === token.toUpperCase() ? token.toLowerCase() : token.toUpperCase();
    expect(flipped).not.toBe(token);
    expect(await svc.getSharedTripData(flipped)).toBeNull();
  });

  it('SHARE-SVC-042 (R5, NUL-byte): a token with an embedded NUL byte never matches', async () => {
    const { token } = await seedSharedTrip();
    expect(await svc.getSharedTripData(`${token}\0x`)).toBeNull();
  });

  it('SHARE-SVC-012: returns null when the trip row is gone', async () => {
    const { trip, token } = await seedSharedTrip();
    // The token normally cascades away with its trip; orphan it deliberately
    // to pin the defensive `if (!trip) return null` branch.
    testDb.exec('PRAGMA foreign_keys = OFF');
    await deleteRows(t, Trips, { id: trip.id });
    testDb.exec('PRAGMA foreign_keys = ON');
    expect(await svc.getSharedTripData(token)).toBeNull();
  });

  it('SHARE-SVC-013: returns the trip projection, coerced permissions and grouped itinerary', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    createDayAssignment(testDb, day.id, place.id, { notes: 'go early' });
    const data = (await svc.getSharedTripData(token))!;
    expect(data).not.toBeNull();
    expect(data.trip).toEqual(expect.objectContaining({ id: trip.id, title: trip.title }));
    // Explicit column list — no owner id or internal fields on the trip row.
    expect(Object.keys(data.trip).sort()).toEqual(
      ['cover_image', 'currency', 'description', 'end_date', 'id', 'start_date', 'title'],
    );
    expect(data.permissions).toEqual({
      share_map: true, share_bookings: true, share_packing: true, share_budget: true, share_collab: true,
      share_travel_only: false, share_hide_images: false,
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

  it('SHARE-SVC-014: COALESCEs assignment times over place times', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    await updateRows(t, Places, { id: place.id }, { place_time: '09:00', end_time: '10:00' });
    const a = createDayAssignment(testDb, day.id, place.id);
    let entry = (await svc.getSharedTripData(token))!.assignments[day.id][0];
    expect(entry.place.place_time).toBe('09:00');
    expect(entry.place.end_time).toBe('10:00');
    await updateRows(t, DayAssignments, { id: a.id }, { assignment_time: '14:00', assignment_end_time: '15:00' });
    entry = (await svc.getSharedTripData(token))!.assignments[day.id][0];
    expect(entry.place.place_time).toBe('14:00');
    expect(entry.place.end_time).toBe('15:00');
  });

  it('SHARE-SVC-015: orders assignments by order_index, then created_at as tiebreaker', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const p1 = createPlace(testDb, trip.id, { name: 'First' });
    const p2 = createPlace(testDb, trip.id, { name: 'Second' });
    await insertRow(t, DayAssignments, { day: day.id, place: p2.id, order_index: 0, created_at: '2025-01-01T11:00:00' });
    await insertRow(t, DayAssignments, { day: day.id, place: p1.id, order_index: 0, created_at: '2025-01-01T10:00:00' });
    const entries = (await svc.getSharedTripData(token))!.assignments[day.id];
    expect(entries.map((e: any) => e.place.name)).toEqual(['First', 'Second']);
  });

  it('SHARE-SVC-016: attaches reservation day_positions, null when a reservation has none', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id);
    const r1 = await addReservation(trip.id, { title: 'Flight', type: 'flight' });
    const r2 = await addReservation(trip.id, { title: 'Hotel', type: 'hotel' });
    await insertRow(t, ReservationDayPositions, { reservation: r1, day: day.id, position: 3 });
    const reservations = (await svc.getSharedTripData(token))!.reservations;
    const flight = reservations.find((r: any) => r.id === r1);
    const hotel = reservations.find((r: any) => r.id === r2);
    expect(flight.day_positions).toEqual({ [day.id]: 3 });
    expect(hotel.day_positions).toBeNull();
  });

  it('SHARE-SVC-017: excludes private packing items from the public payload (#858)', async () => {
    const { user, trip, token } = await seedSharedTrip();
    await insertRow(t, PackingItems, { trip: trip.id, name: 'Common', is_private: 0, owner: user.id });
    await insertRow(t, PackingItems, { trip: trip.id, name: 'Secret', is_private: 1, owner: user.id });
    const packing = (await svc.getSharedTripData(token))!.packing;
    expect(packing.map((p: any) => p.name)).toEqual(['Common']);
  });

  it('SHARE-SVC-018: includes non-deleted collab messages only when share_collab is on', async () => {
    const { user, trip, token } = await seedSharedTrip();
    await insertRow(t, CollabMessages, { trip: trip.id, user: user.id, text: 'Hello', deleted: 0 });
    await insertRow(t, CollabMessages, { trip: trip.id, user: user.id, text: 'Gone', deleted: 1 });
    const collab = (await svc.getSharedTripData(token))!.collab;
    expect(collab).toHaveLength(1);
    expect(collab[0]).toEqual(expect.objectContaining({ text: 'Hello', username: user.username }));

    await svc.createOrUpdate(String(trip.id), user.id, { share_collab: false });
    expect((await svc.getSharedTripData(token))!.collab).toEqual([]);
  });

  it('SHARE-SVC-019: withholds each section when its flag is off', async () => {
    const { trip, token } = await seedSharedTrip({
      share_map: false, share_bookings: false, share_packing: false, share_budget: false, share_collab: false,
    });
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, day.id, place.id);
    await addReservation(trip.id, { title: 'Flight', type: 'flight' });
    await insertRow(t, PackingItems, { trip: trip.id, name: 'Socks' });
    await insertRow(t, BudgetItems, { trip: trip.id, name: 'Food', category: 'food', total_price: 10 });
    const data = (await svc.getSharedTripData(token))!;
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

  it('SHARE-SVC-019b: travel and stays only keeps transport, hotels and the stay stops (#1712)', async () => {
    const { trip, token } = await seedSharedTrip({ share_travel_only: true });
    const day = createDay(testDb, trip.id);
    const museum = createPlace(testDb, trip.id, { name: 'Museum' });
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, hotel.id, day.id, day.id);
    createDayAssignment(testDb, day.id, museum.id);
    const stayStop = createDayAssignment(testDb, day.id, hotel.id);
    await updateRows(t, DayAssignments, { id: stayStop.id }, { accommodation_id: stay.id });
    createDayNote(testDb, day.id, trip.id);
    for (const type of ['flight', 'hotel', 'restaurant', 'tour']) createReservation(testDb, trip.id, { type, title: type });

    const data = (await svc.getSharedTripData(token))!;
    expect(data.permissions.share_travel_only).toBe(true);
    expect(data.assignments[day.id].map((a: any) => a.place.name)).toEqual(['Hotel']);
    expect(data.dayNotes).toEqual({});
    expect(data.places.map((p: any) => p.name)).toEqual(['Hotel']);
    expect(data.reservations.map((r: any) => r.type).sort()).toEqual(['flight', 'hotel']);
  });

  it('SHARE-SVC-019c: without photos drops every place image and refuses the photo route (#1712)', async () => {
    const { trip, token } = await seedSharedTrip({ share_hide_images: true });
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await updateRows(t, Places, { id: place.id }, { image_url: '/api/maps/place-photo/abc/bytes' });
    createDayAssignment(testDb, day.id, place.id);

    const data = (await svc.getSharedTripData(token))!;
    expect(data.places[0].image_url).toBeNull();
    expect(data.assignments[day.id][0].place.image_url).toBeNull();
    serveKey.mockReturnValue('photos-google/abc');
    await expect(svc.getSharedPlacePhotoKey(token, 'abc')).resolves.toBeNull();
  });

  it('SHARE-SVC-020: baseCurrency falls back trip currency → EUR, with the owner default_currency winning (#1361)', async () => {
    const { user, trip, token } = await seedSharedTrip();
    expect((await svc.getSharedTripData(token))!.baseCurrency).toBe('EUR');
    await updateRows(t, Trips, { id: trip.id }, { currency: 'USD' });
    expect((await svc.getSharedTripData(token))!.baseCurrency).toBe('USD');
    await setUserSetting(t, user.id, 'default_currency', ' CHF ');
    expect((await svc.getSharedTripData(token))!.baseCurrency).toBe('CHF');
  });

  it('SHARE-SVC-021: rewrites place-photo proxy URLs to the token-scoped route, passing others through', async () => {
    const { trip, token } = await seedSharedTrip();
    const proxied = createPlace(testDb, trip.id, { name: 'Proxied' });
    const uploaded = createPlace(testDb, trip.id, { name: 'Uploaded' });
    createPlace(testDb, trip.id, { name: 'Bare' });
    await updateRows(t, Places, { id: proxied.id }, { image_url: '/api/maps/place-photo/ChIJabc/bytes' });
    await updateRows(t, Places, { id: uploaded.id }, { image_url: '/uploads/pic.jpg' });
    const byName = Object.fromEntries(
      (await svc.getSharedTripData(token))!.places.map((p: any) => [p.name, p.image_url]),
    );
    expect(byName['Proxied']).toBe(`/api/shared/${token}/place-photo/ChIJabc/bytes`);
    expect(byName['Uploaded']).toBe('/uploads/pic.jpg');
    expect(byName['Bare']).toBeNull();
  });

  it('SHARE-SVC-027: cartoApiKey resolves owner setting → admin instance default → empty (#2054)', async () => {
    const { user, token } = await seedSharedTrip();
    expect((await svc.getSharedTripData(token))!.cartoApiKey).toBe('');
    await setAppSetting(t, 'default_user_setting_carto_api_key', 'instance-key');
    expect((await svc.getSharedTripData(token))!.cartoApiKey).toBe('instance-key');
    await setUserSetting(t, user.id, 'carto_api_key', ' owner-key ');
    expect((await svc.getSharedTripData(token))!.cartoApiKey).toBe('owner-key');
  });

  it('SHARE-SVC-029: staged bookings stay out of the public payload, confirmation number included', async () => {
    const { trip, token } = await seedSharedTrip();
    await addReservation(trip.id, { title: 'Parked Flight', type: 'flight', status: 'confirmed', confirmation_number: 'SECRET1', ingest_state: 'staged' });
    await addReservation(trip.id, { title: 'Booked Flight', type: 'flight', status: 'confirmed', confirmation_number: 'OPEN1' });

    const data = (await svc.getSharedTripData(token))!;

    expect((data.reservations as any[]).map((r) => r.title)).toEqual(['Booked Flight']);
    // SELECT * hands out notes, url and metadata too, so check the whole payload.
    expect(JSON.stringify(data)).not.toContain('SECRET1');
  });

  it('SHARE-SVC-030: every booking that predates the column stays in the payload', async () => {
    const { trip, token } = await seedSharedTrip();
    for (let i = 0; i < 5; i++) {
      await addReservation(trip.id, { title: `Booking ${i}`, type: 'flight', status: 'confirmed' });
    }

    expect(((await svc.getSharedTripData(token))!.reservations as any[])).toHaveLength(5);
  });

  it('SHARE-SVC-031: accommodations backed only by a staged booking are withheld, unlinked ones are kept', async () => {
    const { trip, token } = await seedSharedTrip();
    const place = createPlace(testDb, trip.id, { name: 'Hotel Bellevue' });
    const day = createDay(testDb, trip.id, { date: '2026-09-01' });
    const stay = (): Promise<number> =>
      insertRow(t, DayAccommodations, { trip: trip.id, place: place.id, startDay: day.id, endDay: day.id });

    const stagedStay = await stay();
    await addReservation(trip.id, {
      title: 'Parked Hotel',
      type: 'hotel',
      status: 'confirmed',
      accommodation_id: String(stagedStay),
      ingest_state: 'staged',
    });
    const unlinkedStay = await stay();

    const rows = (await svc.getSharedTripData(token))!.accommodations as any[];

    expect(rows.map((a) => a.id)).toEqual([unlinkedStay]);
  });
});

// ── #2320: what the public payload carries, and what it withholds ───────────

describe('getSharedTripData redaction (#2320)', () => {
  it('SHARE-SVC-032: a booking travels without its confirmation, import trail or travellers', async () => {
    const { trip, token } = await seedSharedTrip();
    await addReservation(trip.id, {
      title: 'Night train',
      type: 'train',
      status: 'confirmed',
      confirmation_number: 'PNR9XY',
      notes: 'Bring the tickets',
      url: 'https://bahn.example/booking/1',
      external_source: 'kitinerary',
      external_id: 'ext-42',
      sync_enabled: 1,
      needs_review: 0,
    });

    const [row] = (await svc.getSharedTripData(token))!.reservations as any[];

    expect(Object.keys(row).sort()).toEqual([
      'accommodation_id', 'created_at', 'day_id', 'day_positions', 'end_day_id', 'endpoints', 'id', 'location',
      'metadata', 'notes', 'place_id', 'reservation_end_time', 'reservation_time', 'status', 'title', 'trip_id', 'type', 'url',
    ]);
    expect(row.notes).toBe('Bring the tickets');
    expect(row.url).toBe('https://bahn.example/booking/1');
    expect(JSON.stringify(await svc.getSharedTripData(token))).not.toContain('PNR9XY');
    expect(JSON.stringify(await svc.getSharedTripData(token))).not.toContain('ext-42');
  });

  it('SHARE-SVC-033: booking metadata keeps the journey and drops the ticket', async () => {
    const { trip, token } = await seedSharedTrip();
    const metadata = JSON.stringify({
      airline: 'LH', flight_number: 'LH400', departure_airport: 'FRA', arrival_airport: 'JFK',
      seat: '14A', price: 812, passenger_name: 'Ada Lovelace', confirmation_number: 'LOC123',
      legs: [
        { from: 'FRA', to: 'BER', airline: 'LH', flight_number: 'LH170', dep_time: '08:00', arr_time: '09:05', confirmation_number: 'LEG1', seat: '3C' },
        { from: 'BER', to: 'JFK', airline: 'LH', flight_number: 'LH400', dep_time: '11:00', arr_time: '14:10', confirmation_number: 'LEG2' },
      ],
    });
    await addReservation(trip.id, { title: 'To New York', type: 'flight', status: 'confirmed', metadata });

    const data = (await svc.getSharedTripData(token))!;
    const [row] = data.reservations as any[];
    const meta = JSON.parse(row.metadata);

    expect(meta).toEqual({
      airline: 'LH', flight_number: 'LH400', departure_airport: 'FRA', arrival_airport: 'JFK',
      legs: [
        { from: 'FRA', to: 'BER', airline: 'LH', flight_number: 'LH170', dep_time: '08:00', arr_time: '09:05' },
        { from: 'BER', to: 'JFK', airline: 'LH', flight_number: 'LH400', dep_time: '11:00', arr_time: '14:10' },
      ],
    });
    const whole = JSON.stringify(data);
    for (const secret of ['14A', '812', 'Ada Lovelace', 'LOC123', 'LEG1', 'LEG2', '3C']) {
      expect(whole, secret).not.toContain(secret);
    }
  });

  it('SHARE-SVC-034: a booking carries its ordered stops', async () => {
    const { trip, token } = await seedSharedTrip();
    const id = await addReservation(trip.id, { title: 'Coach', type: 'bus', status: 'confirmed' });
    await insertRow(t, ReservationEndpoints, { reservation: id, role: 'to', sequence: 1, name: 'Lyon', code: null, lat: 45.76, lng: 4.84 });
    await insertRow(t, ReservationEndpoints, { reservation: id, role: 'from', sequence: 0, name: 'Paris', code: 'PAR', lat: 48.85, lng: 2.35 });

    const [row] = (await svc.getSharedTripData(token))!.reservations as any[];

    expect(row.endpoints.map((e: any) => [e.role, e.name])).toEqual([['from', 'Paris'], ['to', 'Lyon']]);
    expect(Object.keys(row.endpoints[0]).sort()).toEqual(
      ['code', 'lat', 'lng', 'local_date', 'local_time', 'name', 'role', 'sequence', 'timezone'],
    );
  });

  it('SHARE-SVC-035: only http(s) links reach the page, on bookings and places alike', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id, { date: '2026-09-01' });
    for (const [title, url] of [['ok', 'https://example.com/x'], ['js', 'javascript:alert(1)'], ['data', 'data:text/html,hi'], ['junk', 'not a url'], ['blank', '   ']]) {
      await addReservation(trip.id, { title, type: 'other', status: 'confirmed', url });
    }
    const place = createPlace(testDb, trip.id, { name: 'Museum' });
    await updateRows(t, Places, { id: place.id }, { website: 'javascript:alert(2)', phone: '+43 1 234' });
    createDayAssignment(testDb, day.id, place.id, {});

    const data = (await svc.getSharedTripData(token))!;
    const urls = Object.fromEntries((data.reservations as any[]).map((r) => [r.title, r.url]));
    expect(urls).toEqual({ ok: 'https://example.com/x', js: null, data: null, junk: null, blank: null });
    expect(data.assignments[day.id][0].place.website).toBeNull();
    expect(data.assignments[day.id][0].place.phone).toBe('+43 1 234');
    expect((data.places as any[])[0].website).toBeNull();
  });

  it('SHARE-SVC-036: an assignment carries the place notes, duration and contact, the pool carries no booking notes', async () => {
    const { trip, token } = await seedSharedTrip();
    const day = createDay(testDb, trip.id, { date: '2026-09-01' });
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await updateRows(t, Places, { id: place.id }, {
      description: 'Big museum',
      address: 'Rue de Rivoli',
      notes: 'Skip the pyramid queue',
      duration_minutes: 180,
      website: 'https://louvre.fr',
      phone: '+33 1',
      reservation_notes: 'Booked under Ada',
      google_place_id: 'ChIJ123',
    });
    createDayAssignment(testDb, day.id, place.id, { notes: 'go early' });

    const data = (await svc.getSharedTripData(token))!;
    const entry = data.assignments[day.id][0];
    expect(entry.notes).toBe('go early');
    expect(entry.place).toEqual(expect.objectContaining({
      description: 'Big museum', address: 'Rue de Rivoli', notes: 'Skip the pyramid queue',
      duration_minutes: 180, website: 'https://louvre.fr', phone: '+33 1',
    }));
    const pool = (data.places as any[])[0];
    expect(pool.notes).toBe('Skip the pyramid queue');
    expect(pool).not.toHaveProperty('reservation_notes');
    expect(pool).not.toHaveProperty('google_place_id');
    expect(JSON.stringify(data)).not.toContain('Booked under Ada');
    expect(JSON.stringify(data)).not.toContain('ChIJ123');
  });

  it('SHARE-SVC-046 (SH12 full-key parity): every allow-listed column of a fully-populated place reaches the public payload, nothing else does', async () => {
    const { trip, token } = await seedSharedTrip();
    const place = createPlace(testDb, trip.id, { name: 'Fully Populated' });
    await updateRows(t, Places, { id: place.id }, {
      description: 'A description', address: '1 Rue Test', price: 12.5, currency: 'EUR',
      place_time: '09:00', end_time: '10:00', duration_minutes: 60, notes: 'A public note',
      image_url: '/uploads/pic.jpg', website: 'https://example.com', phone: '+33 1 23',
      transport_mode: 'walk',
      reservation_status: 'confirmed', reservation_notes: 'Private booking note', reservation_datetime: '2026-01-01T09:00',
      google_place_id: 'ChIJ-private', google_ftid: 'ftid-private', osm_id: 'osm-private', amap_poi_id: 'amap-private',
      route_geometry: '{"type":"LineString"}', route_color: '#ff0000', stop_type: 'hotel', fill_percent: 42,
      source: 'import',
    });

    const data = (await svc.getSharedTripData(token))!;
    const pool = (data.places as any[])[0];

    // The full allow-list (20 `places` columns + the 3 flat category-join
    // columns), and nothing more.
    expect(Object.keys(pool).sort()).toEqual([
      'address', 'category_color', 'category_icon', 'category_id', 'category_name', 'created_at', 'currency',
      'description', 'duration_minutes', 'end_time', 'id', 'image_url', 'lat', 'lng', 'name', 'notes', 'phone',
      'place_time', 'price', 'transport_mode', 'trip_id', 'updated_at', 'website',
    ]);
    expect(pool.notes).toBe('A public note');
    expect(pool.address).toBe('1 Rue Test');
    expect(pool.duration_minutes).toBe(60);

    // Every non-allow-listed column, whole-payload-wide.
    const whole = JSON.stringify(data);
    for (const secret of [
      'Private booking note', '2026-01-01T09:00',
      'ChIJ-private', 'ftid-private', 'osm-private', 'amap-private',
      'LineString', '#ff0000',
    ]) {
      expect(whole, secret).not.toContain(secret);
    }
  });

  it('SHARE-SVC-037: a stay carries its desk times and note, not its confirmation', async () => {
    const { trip, token } = await seedSharedTrip();
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const day = createDay(testDb, trip.id, { date: '2026-09-01' });
    await insertRow(t, DayAccommodations, {
      trip: trip.id,
      place: place.id,
      startDay: day.id,
      endDay: day.id,
      check_in: '15:00',
      check_out: '11:00',
      confirmation: 'HOTEL-777',
      notes: 'Ask for a quiet room',
    });

    const data = (await svc.getSharedTripData(token))!;
    const [stay] = data.accommodations as any[];
    expect(stay).toEqual(expect.objectContaining({ check_in: '15:00', check_out: '11:00', notes: 'Ask for a quiet room', place_name: 'Hotel' }));
    expect(stay).not.toHaveProperty('confirmation');
    expect(JSON.stringify(data)).not.toContain('HOTEL-777');
  });

  it('SHARE-SVC-038: metadata that is not an object comes back as nothing', async () => {
    expect(publicReservationMetadata(null)).toBeNull();
    expect(publicReservationMetadata('not json')).toBeNull();
    expect(publicReservationMetadata('[1,2]')).toBeNull();
    expect(publicReservationMetadata('"str"')).toBeNull();
    expect(publicReservationMetadata({ airline: 'OS', legs: [null, 'x', { from: 'VIE', seat: '1A' }] }))
      .toBe(JSON.stringify({ airline: 'OS', legs: [{ from: 'VIE' }] }));
  });
});

// ── getSharedPlacePhotoKey ───────────────────────────────────────────────────

describe('getSharedPlacePhotoKey', () => {
  it('SHARE-SVC-022: returns null for an unknown or expired token', async () => {
    expect(await svc.getSharedPlacePhotoKey('nope', 'ChIJabc')).toBeNull();
    const { trip, token } = await seedSharedTrip();
    await updateRows(t, ShareTokens, { trip: trip.id }, { expires_at: '2020-01-01T00:00:00.000Z' });
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  // R5's six-case matrix, this method's own named cases (SHARE-SVC-022 above
  // already pins unknown/expired — same predicate, same {@link
  // ShareTokensRepository.findTripAndShareMapByToken}, proven separately here
  // since a regression in this method's own call site would not otherwise be
  // caught).
  it('SHARE-SVC-043 (R5, revoked): a deleted token returns null — distinct from merely unknown', async () => {
    const { trip, token } = await seedSharedTrip();
    const place = createPlace(testDb, trip.id);
    await updateRows(t, Places, { id: place.id }, { image_url: '/api/maps/place-photo/ChIJabc/bytes' });
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).not.toBeNull();
    await deleteRows(t, ShareTokens, { trip: trip.id });
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
  });

  it('SHARE-SVC-044 (R5, wrong-case): a differently-cased token never matches (mutation proof: a COLLATE NOCASE companion would flip this red)', async () => {
    const { token } = await seedSharedTrip();
    const flipped = token === token.toUpperCase() ? token.toLowerCase() : token.toUpperCase();
    expect(flipped).not.toBe(token);
    expect(await svc.getSharedPlacePhotoKey(flipped, 'ChIJabc')).toBeNull();
  });

  it('SHARE-SVC-045 (R5, NUL-byte): a token with an embedded NUL byte never matches', async () => {
    const { token } = await seedSharedTrip();
    expect(await svc.getSharedPlacePhotoKey(`${token}\0x`, 'ChIJabc')).toBeNull();
  });

  it('SHARE-SVC-023: returns null when the owner disabled the map section', async () => {
    const { trip, token } = await seedSharedTrip({ share_map: false });
    const place = createPlace(testDb, trip.id);
    await updateRows(t, Places, { id: place.id }, { image_url: '/api/maps/place-photo/ChIJabc/bytes' });
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  it('SHARE-SVC-024: returns null when no place in the trip carries the proxy URL', async () => {
    const { token } = await seedSharedTrip();
    expect(await svc.getSharedPlacePhotoKey(token, 'ChIJabc')).toBeNull();
    expect(serveKey).not.toHaveBeenCalled();
  });

  it('SHARE-SVC-025: resolves via serveKey when the encoded placeId matches the stored URL', async () => {
    const { trip, token } = await seedSharedTrip();
    const place = createPlace(testDb, trip.id);
    // Wikimedia pseudo-IDs contain characters that must round-trip encoded.
    const placeId = 'coords:48.8,2.3';
    await updateRows(t, Places, { id: place.id }, { image_url: `/api/maps/place-photo/${encodeURIComponent(placeId)}/bytes` });
    serveKey.mockReturnValue('abc.jpg');
    expect(await svc.getSharedPlacePhotoKey(token, placeId)).toBe('abc.jpg');
    expect(serveKey).toHaveBeenCalledWith(placeId);
  });
});

// SHARE-SVC-026..028 (share.bridge delegation) were deleted with the bridge —
// its last consumer, the legacy share-link tools in src/mcp/tools/trips.ts,
// moved to the DI-discovered share.mcp.ts.
