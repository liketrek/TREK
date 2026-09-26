/**
 * Unit tests for AccommodationsService. DAY-SVC-016..026, 029 and 035 moved here
 * 1:1 with the SQL they cover when accommodations became their own domain; the
 * case ids are unchanged so the diff reads as a move. Real in-memory SQLite.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      // Real enough for the stop-type stamp a stay write makes: it announces the
      // place it typed, and a null here would hide that the write happened at all.
      getPlaceWithTags: (id: number | string) => db.prepare('SELECT * FROM places WHERE id = ?').get(id) ?? null,
      canAccessTrip: (tripId: any, userId: number) =>
        db.prepare(`
          SELECT t.id, t.user_id FROM trips t
          LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
          WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
        `).get(userId, tripId, userId),
      isOwner: (tripId: any, userId: number) =>
        !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAccommodation, createDayAssignment, addTripMember } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { AccommodationsService } from '../../../src/nest/accommodations/accommodations.service';
import { makeAccommodationsService } from '../../helpers/accommodations-service';
import { AccommodationsModule } from '../../../src/nest/accommodations/accommodations.module';
import { AccommodationsDomainModule } from '../../../src/nest/accommodations/accommodations-domain.module';
import { AccommodationsController } from '../../../src/nest/accommodations/accommodations.controller';
import { expectRegisteredProvider, expectRegisteredController } from '../../helpers/module-providers';

// Named `svc` so the moved cases read exactly as they did on DaysService.
const svc = makeAccommodationsService(testDb);

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('validateAccommodationRefs', () => {
  it('DAY-SVC-016 — returns no errors when all refs are valid', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const errors = svc.validateAccommodationRefs(trip.id, place.id, day.id, day.id);
    expect(errors).toHaveLength(0);
  });

  it('DAY-SVC-017 — returns error when place does not exist in trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const errors = svc.validateAccommodationRefs(trip.id, 99999, day.id, day.id);
    expect(errors.some((e: any) => e.field === 'place_id')).toBe(true);
  });

  it('DAY-SVC-018 — returns error when start_day_id is invalid', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const errors = svc.validateAccommodationRefs(trip.id, place.id, 99999, day.id);
    expect(errors.some((e: any) => e.field === 'start_day_id')).toBe(true);
  });

  it('ACC-003 — reports every bad ref, end_day_id included', () => {
    // The controller only surfaces errors[0], so an unchecked end_day_id would let a
    // stay point at a day from another trip and never be reported.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const errors = svc.validateAccommodationRefs(trip.id, 99999, 99998, 99997);
    expect(errors.map((e: any) => e.field)).toEqual(['place_id', 'start_day_id', 'end_day_id']);
  });

  it('ACC-004 — skips the refs the caller left undefined', () => {
    // The plugin update path (accommodations.rpc) passes only the fields it changes.
    // If an absent ref were validated, every partial update would 403 "Place not found".
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.validateAccommodationRefs(trip.id)).toHaveLength(0);
    expect(svc.validateAccommodationRefs(trip.id, undefined, undefined, undefined)).toHaveLength(0);
  });
});

describe('createAccommodation', () => {
  it('DAY-SVC-019 — creates accommodation and returns it with place info', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Grand Hotel' }) as any;

    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id,
      start_day_id: day.id,
      end_day_id: day.id,
      check_in: '15:00',
      check_out: '11:00',
    }) as any;

    expect(accom).toBeDefined();
    expect(accom.place_name).toBe('Grand Hotel');
  });

  it('DAY-SVC-020 — auto-creates a linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'City Hotel' }) as any;

    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const reservation = testDb.prepare('SELECT * FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation).toBeDefined();
    expect(reservation.type).toBe('hotel');
    expect(reservation.status).toBe('confirmed');
  });

  it('ACC-005 — titles the partner reservation "Hotel" when the stay has no place', () => {
    // day_accommodations.place_id is nullable (ON DELETE SET NULL) while
    // reservations.title is NOT NULL: without the fallback the reservation insert
    // fails and takes the whole transaction — and the stay — down with it.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;

    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: null as unknown as number, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    expect(accom.place_name).toBeNull();
    const reservation = testDb.prepare('SELECT title FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation.title).toBe('Hotel');
  });
});

describe('getAccommodation', () => {
  it('DAY-SVC-021 — returns accommodation for valid id and trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;
    const found = svc.getAccommodation(accom.id, trip.id) as any;
    expect(found).toBeDefined();
    expect(found.id).toBe(accom.id);
  });

  it('DAY-SVC-022 — returns undefined for non-existent accommodation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.getAccommodation(99999, trip.id)).toBeUndefined();
  });
});

describe('updateAccommodation', () => {
  it('DAY-SVC-023 — updates check-in and check-out times', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    const { accommodation: updated } = svc.updateAccommodation(accom.id, existing as any, { check_in: '16:00', check_out: '12:00' }) as any;
    expect(updated).toBeDefined();

    // Verify linked reservation metadata was synced
    const reservation = testDb.prepare('SELECT * FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation).toBeDefined();
    const meta = JSON.parse(reservation.metadata || '{}');
    expect(meta.check_in_time).toBe('16:00');
    expect(meta.check_out_time).toBe('12:00');
  });

  it('DAY-SVC-024 — preserves existing fields when not updated', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
      confirmation: 'ABC123',
    }) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    svc.updateAccommodation(accom.id, existing as any, { check_in: '14:00' });

    const row = svc.getAccommodation(accom.id, trip.id) as any;
    expect(row.confirmation).toBe('ABC123');
  });

  it('ACC-006 — updates a stay that has no linked reservation', () => {
    // Stays imported before the auto-reservation existed have no partner row. The sync
    // block must be skipped for them, not throw on a missing reservation.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    // The factory writes the stay row directly, without the partner reservation.
    const accom = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    const { accommodation: updated } = svc.updateAccommodation(accom.id, existing as any, { check_in: '15:00' }) as any;

    expect(updated.check_in).toBe('15:00');
    expect(testDb.prepare('SELECT COUNT(*) as n FROM reservations WHERE accommodation_id = ?').get(accom.id)).toMatchObject({ n: 0 });
  });

  it('ACC-007 — merges into the reservation metadata instead of replacing it', () => {
    // The stay is created with a check-in, so the reservation already carries metadata.
    // An update that only moves the check-out must parse and extend that object —
    // writing a fresh one would silently drop the check-in window.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id, check_in: '15:00',
    }) as any;

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    svc.updateAccommodation(accom.id, existing as any, { check_in_end: '20:00', check_out: '11:00' });

    const reservation = testDb.prepare('SELECT metadata FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(JSON.parse(reservation.metadata)).toEqual({
      check_in_time: '15:00', check_in_end_time: '20:00', check_out_time: '11:00',
    });
  });

  it('ACC-008 — leaves the reservation confirmation number alone when the stay has none', () => {
    // COALESCE(?, confirmation_number): a stay without a confirmation must not null out
    // a number that was typed on the reservation itself.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;
    testDb.prepare('UPDATE reservations SET confirmation_number = ? WHERE accommodation_id = ?').run('RES-9', accom.id);

    const existing = svc.getAccommodation(accom.id, trip.id)!;
    svc.updateAccommodation(accom.id, existing as any, { check_in: '15:00' });

    const reservation = testDb.prepare('SELECT confirmation_number FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(reservation.confirmation_number).toBe('RES-9');
  });
});

describe('deleteAccommodation', () => {
  it('DAY-SVC-025 — deletes accommodation and its linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;

    const result = svc.deleteAccommodation(accom.id);
    expect(result.linkedReservationId).toBe(reservation.id);

    // Accommodation is gone
    expect(svc.getAccommodation(accom.id, trip.id)).toBeUndefined();

    // Reservation is gone
    const deletedRes = testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservation.id);
    expect(deletedRes).toBeUndefined();
  });

  it('DAY-SVC-026 — returns null linkedReservationId when no reservation was linked', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const accom = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;

    // Remove the auto-created reservation so there's no linked one
    testDb.prepare('DELETE FROM reservations WHERE accommodation_id = ?').run(accom.id);

    const result = svc.deleteAccommodation(accom.id);
    expect(result.linkedReservationId).toBeNull();
  });

  it('ACC-009 — also deletes the budget item that hangs off the linked reservation', () => {
    // The cost row references the reservation, not the stay, so the delete has to
    // cascade twice. Skipping the second hop strands a budget line whose reservation
    // is gone, and the costs view can no longer reach it to remove it.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    const budgetItemId = testDb.prepare(
      'INSERT INTO budget_items (trip_id, name, category, total_price, reservation_id) VALUES (?, ?, ?, ?, ?)'
    ).run(trip.id, 'Hotel stay', 'Accommodation', 240, reservation.id).lastInsertRowid as number;

    const result = svc.deleteAccommodation(accom.id);

    expect(result).toEqual({
      linkedReservationId: reservation.id,
      deletedBudgetItemId: budgetItemId,
      linkedReservationIds: [reservation.id],
      deletedBudgetItemIds: [budgetItemId],
      mirror: { created: null, moved: null, updated: [], removed: [{ id: expect.any(Number), dayId: day.id }], stamped: null },
    });
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(budgetItemId)).toBeUndefined();
  });

  it('ACC-035 — every expense on every linked booking goes with the stay (#2084)', () => {
    // A booking can carry several expenses now; taking only the first stranded the
    // rest on a reservation id that no longer exists.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;
    const first = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    const second = testDb.prepare(
      'INSERT INTO reservations (trip_id, type, title, accommodation_id) VALUES (?, ?, ?, ?)'
    ).run(trip.id, 'hotel', 'Second booking', accom.id).lastInsertRowid as number;
    const expense = (reservationId: number | null, name: string) => testDb.prepare(
      'INSERT INTO budget_items (trip_id, name, category, total_price, reservation_id) VALUES (?, ?, ?, ?, ?)'
    ).run(trip.id, name, 'accommodation', 50, reservationId).lastInsertRowid as number;
    const room = expense(first.id, 'Room');
    const breakfast = expense(first.id, 'Breakfast');
    const parking = expense(second, 'Parking');
    const unrelated = expense(null, 'Coffee');

    const result = svc.deleteAccommodation(accom.id);

    expect(result.deletedBudgetItemIds).toEqual([room, breakfast, parking]);
    expect(result.deletedBudgetItemId).toBe(room);
    expect(testDb.prepare('SELECT id FROM budget_items WHERE trip_id = ?').all(trip.id)).toEqual([{ id: unrelated }]);
  });

  it('ACC-010 — a second booking pointed at the same stay goes too, instead of being orphaned', () => {
    // reservations.accommodation_id carries no foreign key and no unique constraint,
    // and the booking form lets a hotel booking pick an existing stay. Deleting only
    // the first left the second behind, referencing a stay that no longer exists.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;

    const first = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    const second = testDb.prepare(
      'INSERT INTO reservations (trip_id, type, title, accommodation_id) VALUES (?, ?, ?, ?)'
    ).run(trip.id, 'hotel', 'Second booking', accom.id).lastInsertRowid as number;

    const result = svc.deleteAccommodation(accom.id);

    expect(result.linkedReservationIds).toEqual([first.id, second]);
    expect(result.linkedReservationId).toBe(first.id);
    expect(testDb.prepare('SELECT COUNT(*) as n FROM reservations WHERE accommodation_id = ?').get(accom.id)).toMatchObject({ n: 0 });
  });

  it('ACC-011 — updating the stay syncs the times onto every linked booking', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as any;
    testDb.prepare(
      'INSERT INTO reservations (trip_id, type, title, accommodation_id) VALUES (?, ?, ?, ?)'
    ).run(trip.id, 'hotel', 'Second booking', accom.id);

    const existing = testDb.prepare('SELECT * FROM day_accommodations WHERE id = ?').get(accom.id) as any;
    svc.updateAccommodation(accom.id, existing, { check_in: '15:00', check_out: '11:00' });

    const rows = testDb.prepare('SELECT metadata FROM reservations WHERE accommodation_id = ?').all(accom.id) as Array<{ metadata: string | null }>;
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(JSON.parse(row.metadata || '{}')).toMatchObject({ check_in_time: '15:00', check_out_time: '11:00' });
    }
  });
});

describe('listAccommodations', () => {
  it('DAY-SVC-029 — listAccommodations returns the hydrated stays', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Ryokan' });
    createDayAccommodation(testDb, trip.id, place.id, day.id, day.id);
    const rows = svc.listAccommodations(trip.id) as { place_name: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].place_name).toBe('Ryokan');
  });
});

describe('quirk fixes', () => {
  it('DAY-SVC-035 — deleteAccommodation is atomic: a failed stay delete keeps the linked reservation', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel' });
    const { accommodation: accom } = svc.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    }) as { accommodation: { id: number } };
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON day_accommodations BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      expect(() => svc.deleteAccommodation(accom.id)).toThrow();
      // The earlier reservation delete inside the transaction rolled back.
      expect(testDb.prepare('SELECT COUNT(*) as n FROM reservations WHERE accommodation_id = ?').get(accom.id)).toMatchObject({ n: 1 });
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }
  });
});

describe('route-facing delegators', () => {
  // list/validateRefs/get/create/update/remove are what the controller, the plugin RPC
  // and trip-read-model call; the MCP tools call the long names. Both sets have to land
  // on the same SQL, and the short ones get raw route params — strings where the long
  // ones get numbers.

  it('ACC-010 — list() returns what listAccommodations() returns, for a string and a number trip id', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Pension Alpen' }) as any;
    createDayAccommodation(testDb, trip.id, place.id, day.id, day.id);

    expect(svc.list(String(trip.id))).toEqual(svc.listAccommodations(trip.id));
    expect((svc.list(trip.id) as any[])[0].place_name).toBe('Pension Alpen');
  });

  it('ACC-011 — validateRefs() returns the same errors validateAccommodationRefs() does', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;

    expect(svc.validateRefs(trip.id, place.id, day.id, day.id)).toHaveLength(0);
    // The controller 404s with errors[0].message, so the shape matters, not just the count.
    expect(svc.validateRefs(trip.id, 99999, day.id, day.id)).toEqual([{ field: 'place_id', message: 'Place not found' }]);
  });

  it('ACC-012 — create() writes the stay, get() reads it back trip-scoped', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;

    // Both ids arrive from the route as strings.
    const { accommodation: created } = svc.create(String(trip.id), {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id, confirmation: 'XY-1',
    }) as any;

    expect(svc.get(String(created.id), String(trip.id))).toMatchObject({ id: created.id, confirmation: 'XY-1' });
    // Trip-scoped: a stay must not be readable through another trip's URL.
    expect(svc.get(created.id, otherTrip.id)).toBeUndefined();
  });

  it('ACC-013 — update() syncs the partner reservation even when the id is a string', () => {
    // updateAccommodation looks the reservation up with Number(id); if that coercion
    // regresses, the REST path silently stops syncing check-in times.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.create(trip.id, { place_id: place.id, start_day_id: day.id, end_day_id: day.id }) as any;

    const existing = svc.get(accom.id, trip.id)!;
    const { accommodation: updated } = svc.update(String(accom.id), existing as any, { check_in: '16:00', notes: 'late arrival' }) as any;

    expect(updated).toMatchObject({ check_in: '16:00', notes: 'late arrival' });
    const reservation = testDb.prepare('SELECT metadata FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;
    expect(JSON.parse(reservation.metadata).check_in_time).toBe('16:00');
  });

  it('ACC-014 — remove() reports the partner reservation it took with it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const place = createPlace(testDb, trip.id, { name: 'Hotel' }) as any;
    const { accommodation: accom } = svc.create(trip.id, { place_id: place.id, start_day_id: day.id, end_day_id: day.id }) as any;
    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accom.id) as any;

    // The controller broadcasts reservation:deleted off this return value.
    expect(svc.remove(String(accom.id))).toEqual({
      linkedReservationId: reservation.id,
      deletedBudgetItemId: null,
      linkedReservationIds: [reservation.id],
      deletedBudgetItemIds: [],
      mirror: { created: null, moved: null, updated: [], removed: [{ id: expect.any(Number), dayId: day.id }], stamped: null },
    });
    expect(svc.get(accom.id, trip.id)).toBeUndefined();
  });
});

describe('trip access and edit permission', () => {
  it('ACC-015 — verifyTripAccess resolves the trip from a string id and from a number', () => {
    // The REST path hands over the raw :tripId param, the MCP tools the parsed number.
    // Without the Number() coercion one of the two callers stops finding its trip.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    expect(svc.verifyTripAccess(String(trip.id), user.id)).toMatchObject({ id: trip.id, user_id: user.id });
    expect(svc.verifyTripAccess(trip.id, user.id)).toMatchObject({ id: trip.id, user_id: user.id });
  });

  it('ACC-016 — verifyTripAccess returns nothing for a user who is neither owner nor member', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    expect(svc.verifyTripAccess(trip.id, stranger.id)).toBeUndefined();
  });

  it('ACC-017 — canEdit lets the owner through on the default day_edit level', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const access = svc.verifyTripAccess(trip.id, user.id)!;

    expect(svc.canEdit(access, user as any)).toBe(true);
  });

  it('ACC-018 — canEdit lets a member through: it derives isMember from the trip owner id', () => {
    // day_edit defaults to trip_member. canEdit passes `trip.user_id !== user.id` as the
    // isMember flag, so inverting that comparison would lock every invited traveller out
    // of the day plan while the owner still edits fine.
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const access = svc.verifyTripAccess(trip.id, member.id)!;

    expect(svc.canEdit(access, member as any)).toBe(true);
  });

  it('ACC-019 — canEdit denies a member once day_edit is raised to trip_owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const permissions = new PermissionsService(new DatabaseService(testDb));

    try {
      permissions.savePermissions({ day_edit: 'trip_owner' });
      expect(svc.canEdit(svc.verifyTripAccess(trip.id, member.id)!, member as any)).toBe(false);
      // The owner keeps the right, otherwise the setting would lock out the whole trip.
      expect(svc.canEdit(svc.verifyTripAccess(trip.id, owner.id)!, owner as any)).toBe(true);
    } finally {
      // The permission cache is module-scoped and outlives resetTestDb — drop the row and
      // the cache together, or every later case in this file inherits the raised level.
      testDb.prepare("DELETE FROM app_settings WHERE key = 'perm_day_edit'").run();
      permissions.invalidatePermissionsCache();
    }
  });

  it('ACC-020 — broadcast forwards the socket id so the originating client is not echoed', () => {
    // The X-Socket-Id contract: the facade must pass the id straight through as the
    // fourth argument. Dropping it makes the sender apply its own change twice.
    broadcast.mockClear();

    svc.broadcast('5', 'accommodation:deleted', { accommodationId: 9 }, 'sock-1');
    expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:deleted', { accommodationId: 9 }, 'sock-1');

    svc.broadcast('5', 'accommodation:updated', { accommodation: { id: 9 } }, undefined);
    expect(broadcast).toHaveBeenLastCalledWith('5', 'accommodation:updated', { accommodation: { id: 9 } }, undefined);
  });
});

/**
 * Booking a night also puts its place on the check-in day, because that stop is what
 * the road trip routes and the map draws. Reported from Discord: a hotel entered in
 * the day planner never reached the road-trip view, so the same place had to be
 * entered a second time as an ordinary stop.
 */
describe('the day stop a booking implies', () => {
  const stopsOn = (dayId: number) =>
    testDb.prepare('SELECT id, place_id, order_index, accommodation_id FROM day_assignments WHERE day_id = ? ORDER BY order_index').all(dayId) as
      { id: number; place_id: number; order_index: number; accommodation_id: number | null }[];

  const book = (tripId: number, placeId: number | null, startDayId: number, endDayId: number) =>
    svc.createAccommodation(tripId, { place_id: placeId as number, start_day_id: startDayId, end_day_id: endDayId }) as any;

  it('ACC-021 the booked night puts its place on the check-in day and marks the stop as its own', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });

    const { accommodation, mirror } = book(trip.id, place.id, day.id, day.id);

    const stops = stopsOn(day.id);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({ place_id: place.id, accommodation_id: accommodation.id });
    expect(mirror.created).toMatchObject({ id: stops[0].id, day_id: day.id, place_id: place.id });
    // On the answer, not only in the table. This copy is what the client that booked
    // the night puts in its store, and accommodation_id is the only thing telling the
    // day list this row is the booking it already shows in the header. Without it the
    // hotel appears a second time among the day's places until the next reload.
    expect(mirror.created.accommodation_id).toBe(accommodation.id);
  });

  it('ACC-022 the stop lands first: the hotel is where the day is based', () => {
    // It used to go last, and a night booked for the morning sat behind a whole day
    // of unpinned stops. The stops the traveller placed without an hour follow the
    // hotel; only a clock of their own can put one ahead of it (ACC-022c).
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const museum = createPlace(testDb, trip.id, { name: 'Pergamon' });
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    createDayAssignment(testDb, day.id, museum.id);

    book(trip.id, hotel.id, day.id, day.id);

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, museum.id]);
    expect(stopsOn(day.id).map(a => a.order_index)).toEqual([0, 1]);
  });

  it('ACC-022b a check-in puts the night before whatever is pinned to a later hour', () => {
    // A stop pinned to the afternoon cannot stand ahead of a check-in at eleven.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const afternoon = createPlace(testDb, trip.id, { name: 'Mercure' });
    const hotel = createPlace(testDb, trip.id, { name: 'Billstedt' });
    const pinned = createDayAssignment(testDb, day.id, afternoon.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '16:00' WHERE id = ?").run(pinned.id);

    svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' });

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, afternoon.id]);
  });

  it('ACC-022c a stop pinned to an earlier hour stays ahead of the check-in', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const morning = createPlace(testDb, trip.id, { name: 'Museum' });
    const hotel = createPlace(testDb, trip.id, { name: 'Billstedt' });
    const pinned = createDayAssignment(testDb, day.id, morning.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '09:00' WHERE id = ?").run(pinned.id);

    svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '18:00' });

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([morning.id, hotel.id]);
  });

  it('ACC-022d a stop without an hour of its own follows the night, whatever the check-in', () => {
    // A stop with no clock is planned from the hotel, not the other way round. This
    // is the day from Discord: two unpinned stops and a night booked for ten in the
    // morning, which the drive used to reach at a quarter past twelve.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const fuel = createPlace(testDb, trip.id, { name: 'Aral' });
    const farm = createPlace(testDb, trip.id, { name: 'Karls Erdbeerhof' });
    const hotel = createPlace(testDb, trip.id, { name: 'Rostock' });
    createDayAssignment(testDb, day.id, fuel.id);
    createDayAssignment(testDb, day.id, farm.id);

    svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '10:00' });

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, fuel.id, farm.id]);
  });

  it('ACC-022f the night goes behind the last stop whose own hour is at or before the check-in', () => {
    // Pinned eight, unpinned, pinned two: a check-in at ten sits behind the eight and
    // ahead of everything else, the unpinned stop included.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [early, loose, late, hotel] = ['Aral', 'Hafen', 'Museum', 'Rostock'].map(name => createPlace(testDb, trip.id, { name }));
    const first = createDayAssignment(testDb, day.id, early.id);
    createDayAssignment(testDb, day.id, loose.id);
    const third = createDayAssignment(testDb, day.id, late.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '08:00' WHERE id = ?").run(first.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '14:00' WHERE id = ?").run(third.id);

    svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '10:00' });

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([early.id, hotel.id, loose.id, late.id]);
  });

  it('ACC-022g a new check-in seats the night afresh, a change of notes leaves a dragged night alone', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [harbour, market, hotel] = ['Hafen', 'Markt', 'Rostock'].map(name => createPlace(testDb, trip.id, { name }));
    createDayAssignment(testDb, day.id, harbour.id);
    createDayAssignment(testDb, day.id, market.id);
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id }) as any;
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, harbour.id, market.id]);

    // Dragged to the end of the day by hand.
    const own = stopsOn(day.id).find(a => a.place_id === hotel.id)!;
    testDb.prepare('UPDATE day_assignments SET order_index = order_index - 1 WHERE day_id = ? AND order_index > ?').run(day.id, own.order_index);
    testDb.prepare('UPDATE day_assignments SET order_index = 2 WHERE id = ?').run(own.id);
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([harbour.id, market.id, hotel.id]);

    let existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const quiet = svc.updateAccommodation(accommodation.id, existing, { notes: 'late arrival' }) as any;
    expect(quiet.mirror.moved).toBeNull();
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([harbour.id, market.id, hotel.id]);

    existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const reseated = svc.updateAccommodation(accommodation.id, existing, { check_in: '10:00' }) as any;
    expect(reseated.mirror.moved).toMatchObject({ oldDayId: day.id, assignment: { id: own.id } });
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, harbour.id, market.id]);
  });

  it('ACC-022e moving the check-in later re-seats the night', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const afternoon = createPlace(testDb, trip.id, { name: 'Mercure' });
    const hotel = createPlace(testDb, trip.id, { name: 'Billstedt' });
    const pinned = createDayAssignment(testDb, day.id, afternoon.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '16:00' WHERE id = ?").run(pinned.id);
    const { accommodation } = svc.createAccommodation(trip.id, {
      place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00',
    }) as any;
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, afternoon.id]);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    svc.updateAccommodation(accommodation.id, existing, { check_in: '20:00' });

    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([afternoon.id, hotel.id]);
  });

  it('ACC-022i a second night on the day counts by its check-in', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [noon, morning] = ['Rue de Paris', 'Brandenburger Tor'].map(name => createPlace(testDb, trip.id, { name }));
    svc.createAccommodation(trip.id, { place_id: noon.id, start_day_id: day.id, end_day_id: day.id, check_in: '12:00' });
    svc.createAccommodation(trip.id, { place_id: morning.id, start_day_id: day.id, end_day_id: day.id, check_in: '10:00' });
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([morning.id, noon.id]);

    const evening = createPlace(testDb, trip.id, { name: 'Late' });
    svc.createAccommodation(trip.id, { place_id: evening.id, start_day_id: day.id, end_day_id: day.id, check_in: '18:00' });
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([morning.id, noon.id, evening.id]);
  });

  it('ACC-022h an edit that leaves the check-in alone still corrects a night the clocks contradict', () => {
    // Dragged behind a stop pinned to the afternoon, with a check-in at ten: a change of
    // notes puts it back ahead of that stop, because a night sitting after an afternoon it
    // was booked before is the plan reading back wrong. Dragged behind a stop without an
    // hour, the same edit leaves it where the traveller put it.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [harbour, museum, hotel] = ['Hafen', 'Museum', 'Rostock'].map(name => createPlace(testDb, trip.id, { name }));
    createDayAssignment(testDb, day.id, harbour.id);
    const pinned = createDayAssignment(testDb, day.id, museum.id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '14:00' WHERE id = ?").run(pinned.id);
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '10:00' }) as any;
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, harbour.id, museum.id]);
    const own = stopsOn(day.id).find(a => a.place_id === hotel.id)!;

    // Behind the harbour only: allowed, and left alone.
    testDb.prepare('UPDATE day_assignments SET order_index = 0 WHERE day_id = ? AND place_id = ?').run(day.id, harbour.id);
    testDb.prepare('UPDATE day_assignments SET order_index = 1 WHERE id = ?').run(own.id);
    let existing = svc.getAccommodation(accommodation.id, trip.id)!;
    expect((svc.updateAccommodation(accommodation.id, existing, { notes: 'late' }) as any).mirror.moved).toBeNull();
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([harbour.id, hotel.id, museum.id]);

    // Behind the afternoon: contradicted by the clocks, and seated afresh, which is
    // the front, ahead of the harbour that has no hour of its own.
    testDb.prepare('UPDATE day_assignments SET order_index = 1 WHERE day_id = ? AND place_id = ?').run(day.id, museum.id);
    testDb.prepare('UPDATE day_assignments SET order_index = 2 WHERE id = ?').run(own.id);
    existing = svc.getAccommodation(accommodation.id, trip.id)!;
    expect((svc.updateAccommodation(accommodation.id, existing, { notes: 'later' }) as any).mirror.moved).not.toBeNull();
    expect(stopsOn(day.id).map(a => a.place_id)).toEqual([hotel.id, harbour.id, museum.id]);
  });

  it('ACC-022j two nights with the same check-in settle by their booking and stay settled through a change of notes', () => {
    // Each used to read the other as "at or before" its own check-in, so a notes edit on
    // the front one moved it behind the other, took the road between them with it, and
    // a notes edit on the other swapped them back.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [first, second] = ['Adlon', 'Mercure'].map(name => createPlace(testDb, trip.id, { name }));
    const a = svc.createAccommodation(trip.id, { place_id: first.id, start_day_id: day.id, end_day_id: day.id, check_in: '15:00' }) as any;
    const b = svc.createAccommodation(trip.id, { place_id: second.id, start_day_id: day.id, end_day_id: day.id, check_in: '15:00' }) as any;
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([first.id, second.id]);
    const between = Number(testDb.prepare('INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, 0, 0, 52.5, 13.4)')
      .run(day.id).lastInsertRowid);

    for (const booked of [a, b]) {
      const existing = svc.getAccommodation(booked.accommodation.id, trip.id)!;
      const quiet = svc.updateAccommodation(booked.accommodation.id, existing, { notes: 'late arrival' }) as any;
      expect(quiet.mirror.moved).toBeNull();
      expect(quiet.mirror.vias).toBeUndefined();
    }
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([first.id, second.id]);
    expect(testDb.prepare('SELECT after_order_index FROM roadtrip_vias WHERE id = ?').get(between)).toEqual({ after_order_index: 0 });

    // Dragged the other way round on purpose: an equal clock is no contradiction.
    testDb.prepare('UPDATE day_assignments SET order_index = CASE place_id WHEN ? THEN 1 ELSE 0 END WHERE day_id = ?').run(first.id, day.id);
    for (const booked of [a, b]) {
      const existing = svc.getAccommodation(booked.accommodation.id, trip.id)!;
      expect((svc.updateAccommodation(booked.accommodation.id, existing, { notes: 'later' }) as any).mirror.moved).toBeNull();
    }
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([second.id, first.id]);
  });

  it('ACC-022k two nights without a check-in: the earlier booking leads', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [museum, first, second] = ['Pergamon', 'Adlon', 'Mercure'].map(name => createPlace(testDb, trip.id, { name }));
    createDayAssignment(testDb, day.id, museum.id);
    svc.createAccommodation(trip.id, { place_id: first.id, start_day_id: day.id, end_day_id: day.id });
    const b = svc.createAccommodation(trip.id, { place_id: second.id, start_day_id: day.id, end_day_id: day.id }) as any;

    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([first.id, second.id, museum.id]);
    const existing = svc.getAccommodation(b.accommodation.id, trip.id)!;
    expect((svc.updateAccommodation(b.accommodation.id, existing, { notes: 'late' }) as any).mirror.moved).toBeNull();
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([first.id, second.id, museum.id]);
  });

  it('ACC-022l a night on a day dragged out of clock order is settled where a fresh seat puts it', () => {
    // Pinned two, then pinned eight, on purpose. A check-in at ten goes behind the eight,
    // and nothing else satisfies both clocks; a change of notes used to relocate it to
    // the very same seat and report a move for it.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [late, early, hotel] = ['Museum', 'Aral', 'Rostock'].map(name => createPlace(testDb, trip.id, { name }));
    testDb.prepare("UPDATE day_assignments SET assignment_time = '14:00' WHERE id = ?").run(createDayAssignment(testDb, day.id, late.id).id);
    testDb.prepare("UPDATE day_assignments SET assignment_time = '08:00' WHERE id = ?").run(createDayAssignment(testDb, day.id, early.id).id);
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '10:00' }) as any;
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([late.id, early.id, hotel.id]);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const quiet = svc.updateAccommodation(accommodation.id, existing, { notes: 'late arrival' }) as any;

    expect(quiet.mirror.moved).toBeNull();
    expect(stopsOn(day.id).map(s => s.place_id)).toEqual([late.id, early.id, hotel.id]);
  });

  it('ACC-023 the place is typed as lodging, so the rail draws it as a service stop', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });

    const { mirror } = book(trip.id, place.id, day.id, day.id);

    expect(testDb.prepare('SELECT stop_type FROM places WHERE id = ?').get(place.id)).toMatchObject({ stop_type: 'hotel' });
    // Announced, or the places list keeps the stale null until a reload.
    expect(mirror.stamped).toMatchObject({ id: place.id, stop_type: 'hotel' });
    // And the stop carries it, so the rail does not number it.
    expect(mirror.created.place.stop_type).toBe('hotel');
  });

  it('ACC-024 a stop type the traveller picked is never overwritten', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Camping Isar' });
    testDb.prepare("UPDATE places SET stop_type = 'campsite' WHERE id = ?").run(place.id);

    const { mirror } = book(trip.id, place.id, day.id, day.id);

    expect(testDb.prepare('SELECT stop_type FROM places WHERE id = ?').get(place.id)).toMatchObject({ stop_type: 'campsite' });
    expect(mirror.stamped).toBeNull();
  });

  it('ACC-025 a place already planned for that day gets no second stop, and the booking claims neither', () => {
    // This is the road-trip flow: it assigns the place to the day and only then books
    // the night. A second stop would draw the hotel twice, and claiming the existing
    // one would let cancelling the booking delete a stop the traveller placed.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const own = createDayAssignment(testDb, day.id, place.id);

    const { mirror } = book(trip.id, place.id, day.id, day.id);

    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ id: own.id, accommodation_id: null })]);
    expect(mirror.created).toBeNull();
  });

  it('ACC-026 only the check-in day, not every night of a long stay', () => {
    // You drive there once. The later nights ride on the stay row, which is where the
    // rail reads check-out from.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const arrive = createDay(testDb, trip.id);
    const middle = createDay(testDb, trip.id);
    const leave = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });

    book(trip.id, place.id, arrive.id, leave.id);

    expect(stopsOn(arrive.id)).toHaveLength(1);
    expect(stopsOn(middle.id)).toHaveLength(0);
    expect(stopsOn(leave.id)).toHaveLength(0);
  });

  it('ACC-027 a stay with no place writes no stop instead of throwing', () => {
    // day_accommodations.place_id is nullable (ON DELETE SET NULL) and the booking form
    // writes stays that never had one.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    const { mirror } = book(trip.id, null, day.id, day.id);

    expect(mirror).toEqual({ created: null, moved: null, updated: [], removed: [], stamped: null });
    expect(stopsOn(day.id)).toHaveLength(0);
  });

  it('ACC-028 moving the booking to another day moves its stop with it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day1.id, day1.id);
    const before = stopsOn(day1.id)[0];

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id }) as any;

    expect(stopsOn(day1.id)).toHaveLength(0);
    // The same row, carried over. Not a delete and a fresh insert: everything the
    // traveller hung on this stop is keyed by its id.
    expect(stopsOn(day2.id)).toEqual([expect.objectContaining({ id: before.id, place_id: place.id, accommodation_id: accommodation.id })]);
    expect(mirror.removed).toEqual([]);
    expect(mirror.created).toBeNull();
    expect(mirror.moved).toMatchObject({ oldDayId: day1.id, assignment: { id: before.id, day_id: day2.id } });
  });

  it('ACC-028b moving the booking keeps the note, the hour and the end-of-day flag on the stop', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day1.id, day1.id);
    const stop = stopsOn(day1.id)[0];
    testDb.prepare('UPDATE day_assignments SET notes = ?, assignment_time = ?, end_day = 1 WHERE id = ?')
      .run('ask for the quiet side', '15:30', stop.id);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id });

    const after = testDb.prepare('SELECT * FROM day_assignments WHERE id = ?').get(stop.id) as Record<string, unknown>;
    expect(after).toMatchObject({ day_id: day2.id, notes: 'ask for the quiet side', assignment_time: '15:30', end_day: 1 });
  });

  it('ACC-028c moving the booking keeps the people assigned to the stop', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day1.id, day1.id);
    const stop = stopsOn(day1.id)[0];
    // assignment_participants.assignment_id is ON DELETE CASCADE, so a delete and
    // re-insert would take these with it without a word.
    testDb.prepare('INSERT INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)').run(stop.id, user.id);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id });

    const kept = testDb.prepare('SELECT user_id FROM assignment_participants WHERE assignment_id = ?').all(stop.id);
    expect(kept).toEqual([{ user_id: user.id }]);
  });

  it('ACC-028d a move onto a day that already holds the place by hand drops the booking stop instead of doubling it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day1.id, day1.id);
    const own = stopsOn(day1.id)[0];
    const byHand = createDayAssignment(testDb, day2.id, place.id) as { id: number };

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id }) as any;

    expect(stopsOn(day1.id)).toHaveLength(0);
    expect(stopsOn(day2.id).map((row: { id: number }) => row.id)).toEqual([byHand.id]);
    expect(mirror.removed).toEqual([{ id: own.id, dayId: day1.id }]);
    expect(mirror.moved).toBeNull();
  });

  it('ACC-028e the day the stop left closes the gap it made in the order', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const museum = createPlace(testDb, trip.id, { name: 'Pergamon' });
    const { accommodation } = book(trip.id, hotel.id, day1.id, day1.id);
    createDayAssignment(testDb, day1.id, museum.id);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id });

    expect(stopsOn(day1.id).map((row: { order_index: number }) => row.order_index)).toEqual([0]);
  });

  it('ACC-029 editing an unrelated field leaves the stop exactly where it is', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day.id, day.id);
    const before = stopsOn(day.id);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { check_in: '16:00' }) as any;

    expect(stopsOn(day.id)).toEqual(before);
    expect(mirror).toEqual({ created: null, moved: null, updated: [], removed: [], stamped: null });
  });

  it('ACC-029b a night sitting behind a later afternoon is re-seated, keeping its row', () => {
    // The state the migration backfill leaves: every pre-existing stay's stop was
    // appended last, whatever its check-in says. Giving the booking an hour has to
    // move it ahead of the evening it was booked around.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const dinner = createPlace(testDb, trip.id, { name: 'Osteria' });
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    testDb.prepare("UPDATE places SET place_time = '19:00' WHERE id = ?").run(dinner.id);
    createDayAssignment(testDb, day.id, dinner.id);
    const { accommodation } = book(trip.id, hotel.id, day.id, day.id);
    const stop = stopsOn(day.id).find((row: { place_id: number }) => row.place_id === hotel.id)!;
    // The backfill's placement, written by hand: the night behind the dinner.
    testDb.prepare('UPDATE day_assignments SET order_index = 0 WHERE day_id = ? AND place_id = ?').run(day.id, dinner.id);
    testDb.prepare('UPDATE day_assignments SET order_index = 1 WHERE id = ?').run(stop.id);
    expect(stopsOn(day.id).map((row: { place_id: number }) => row.place_id)).toEqual([dinner.id, hotel.id]);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { check_in: '15:00' }) as any;

    expect(stopsOn(day.id).map((row: { place_id: number }) => row.place_id)).toEqual([hotel.id, dinner.id]);
    // Re-seated, not rebuilt: the same row, one place further forward.
    expect(mirror.moved).toMatchObject({ oldDayId: day.id, assignment: { id: stop.id } });
    expect(mirror.removed).toEqual([]);
  });

  it('ACC-030 a stay whose stop belongs to the traveller does not get a second one', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const second = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    // The road trip books a night on a place it put on the day first, so the stop is
    // the traveller's and the booking owns nothing.
    createDayAssignment(testDb, day.id, place.id);
    const stay = createDayAccommodation(testDb, trip.id, place.id, day.id, day.id) as any;

    const existing = svc.getAccommodation(stay.id, trip.id)!;
    svc.updateAccommodation(stay.id, existing, { start_day_id: second.id, end_day_id: second.id });

    expect(stopsOn(second.id)).toEqual([]);
    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ place_id: place.id, accommodation_id: null })]);
  });

  it('ACC-031 cancelling a booking takes back its own stop and leaves the other one', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const museum = createPlace(testDb, trip.id, { name: 'Pergamon' });
    const own = createDayAssignment(testDb, day.id, museum.id);
    const { accommodation } = book(trip.id, hotel.id, day.id, day.id);
    const mirrored = stopsOn(day.id).find(a => a.place_id === hotel.id)!;

    const { mirror } = svc.deleteAccommodation(accommodation.id);

    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ id: own.id })]);
    expect(mirror.removed).toEqual([{ id: mirrored.id, dayId: day.id }]);
  });

  it('ACC-032 cancelling a night booked in the road trip keeps the stop standing', () => {
    // The rail turns a night back into a pause by deleting the stay alone; the stop is
    // the thing being edited there and has to survive.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const own = createDayAssignment(testDb, day.id, place.id);
    const { accommodation } = book(trip.id, place.id, day.id, day.id);

    const { mirror } = svc.deleteAccommodation(accommodation.id);

    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ id: own.id })]);
    expect(mirror.removed).toEqual([]);
  });

  it('ACC-032b keepStop hands the mirrored stop to the traveller instead of taking it away', () => {
    // The road trip popup switching a night back to an ordinary pause: the booking is
    // what was cancelled, not the place, and the stop sits mid-drive where re-adding it
    // would land it at the end of the day instead.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day.id, day.id);
    const mirrored = stopsOn(day.id)[0];

    const { mirror } = svc.deleteAccommodation(accommodation.id, { keepStop: true });

    // Still there, and now unmarked: nothing may move or delete it on the next edit.
    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ id: mirrored.id, place_id: place.id, accommodation_id: null })]);
    // Nothing to announce either — no session has to take a stop off its day plan.
    expect(mirror.removed).toEqual([]);
    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toBeUndefined();
  });

  it('ACC-032c remove() forwards keepStop, which is the only door the REST route uses', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day.id, day.id);

    svc.remove(accommodation.id, { keepStop: true });

    expect(stopsOn(day.id)).toEqual([expect.objectContaining({ place_id: place.id, accommodation_id: null })]);
  });

  it('ACC-033 announceMirror sends the removal before the arrival', () => {
    // Order matters on a move: the day plan would briefly hold the place twice if the
    // arrival went first.
    const sent: string[] = [];
    svc.announceMirror(5, {
      created: { id: 78, day_id: 11 } as never,
      moved: null,
      updated: [],
      removed: [{ id: 77, dayId: 10 }],
      stamped: { id: 3 } as never,
    }, event => { sent.push(event); });
    // The two days whose order changed follow, arrival first (see touchedDays).
    expect(sent).toEqual([
      'assignment:deleted', 'assignment:created', 'place:updated',
      'assignment:reordered', 'assignment:reordered',
    ]);
  });

  it('ACC-033b announceMirror reports a move as one event, not a delete and a create', () => {
    const sent: Array<{ event: string; payload: unknown }> = [];
    svc.announceMirror(5, {
      created: null,
      moved: { assignment: { id: 78, day_id: 11 } as never, oldDayId: 10 },
      updated: [],
      removed: [],
      stamped: null,
    }, (event, payload) => { sent.push({ event, payload }); });
    expect(sent.map(e => e.event)).toEqual(['assignment:moved', 'assignment:reordered', 'assignment:reordered']);
    expect(sent[0].payload).toMatchObject({ oldDayId: 10, newDayId: 11 });
  });

  it('ACC-033c a kept stop is announced as updated, so the day list stops hiding it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = book(trip.id, place.id, day.id, day.id);
    const stop = stopsOn(day.id)[0];

    const { mirror } = svc.remove(accommodation.id, { keepStop: true }) as any;

    // Days hides a stop that carries an accommodation_id, so a client still holding
    // the old row keeps the place invisible on a day it is standing on.
    expect(mirror.updated).toEqual([expect.objectContaining({ id: stop.id, accommodation_id: null })]);
    const sent: string[] = [];
    svc.announceMirror(trip.id, mirror, event => { sent.push(event); });
    expect(sent).toContain('assignment:updated');
  });
});

describe('the drawn roads a booking moves', () => {
  // A via is pinned to a POSITION among the day's located stops, not to a row. A
  // night seated by its check-in ahead of the afternoon renumbers every stop behind
  // it, and every road drawn behind those stops has to move with them, or the
  // detour is driven on the wrong leg for everyone.
  const stopsOn = (dayId: number) =>
    (testDb.prepare('SELECT place_id FROM day_assignments WHERE day_id = ? ORDER BY order_index').all(dayId) as { place_id: number }[])
      .map(row => row.place_id);
  const addVia = (dayId: number, afterOrderIndex: number): number =>
    Number(testDb.prepare('INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, ?, 0, 48.1, 11.5)')
      .run(dayId, afterOrderIndex).lastInsertRowid);
  const viaAnchors = (dayId: number) =>
    testDb.prepare('SELECT id, after_order_index FROM roadtrip_vias WHERE day_id = ? ORDER BY id').all(dayId) as
      { id: number; after_order_index: number }[];
  /** The day's roads as the route reads them: leg by leg, and in order within a leg. */
  const legOrder = (dayId: number) =>
    testDb.prepare('SELECT id, after_order_index, sequence FROM roadtrip_vias WHERE day_id = ? ORDER BY after_order_index, sequence, id').all(dayId) as
      { id: number; after_order_index: number; sequence: number }[];
  const pin = (assignmentId: number, time: string) =>
    testDb.prepare('UPDATE day_assignments SET assignment_time = ? WHERE id = ?').run(time, assignmentId);

  /** A(0) pinned to nine, B(1) pinned to noon, C(2): the day a check-in at eleven lands in the middle of. */
  function afternoonDay() {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [a, b, c, hotel] = ['Harbour', 'Mercure', 'Museum', 'Billstedt'].map(name => createPlace(testDb, trip.id, { name }));
    pin(createDayAssignment(testDb, day.id, a.id).id, '09:00');
    pin(createDayAssignment(testDb, day.id, b.id).id, '12:00');
    createDayAssignment(testDb, day.id, c.id);
    return { trip, day, a, b, c, hotel };
  }

  it('ACC-034 a night seated ahead of the afternoon carries the roads behind it along', () => {
    const { trip, day, a, b, c, hotel } = afternoonDay();
    const afterA = addVia(day.id, 0);
    const afterB = addVia(day.id, 1);
    // Behind the last stop: the drive into the next day. It stays with C, which is
    // still last, rather than being dropped as a leg C never had.
    const intoTomorrow = addVia(day.id, 2);

    const { mirror } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' }) as any;

    expect(stopsOn(day.id)).toEqual([a.id, hotel.id, b.id, c.id]);
    expect(viaAnchors(day.id)).toEqual([
      { id: afterA, after_order_index: 0 },
      { id: afterB, after_order_index: 2 },
      { id: intoTomorrow, after_order_index: 3 },
    ]);
    // Reported on the mirror in the shape the road trip broadcasts, so every planner
    // routes the new anchors against the new order.
    expect(mirror.vias).toEqual([{
      dayId: day.id,
      vias: [
        expect.objectContaining({ id: afterA, day_id: day.id, after_order_index: 0 }),
        expect.objectContaining({ id: afterB, day_id: day.id, after_order_index: 2 }),
        expect.objectContaining({ id: intoTomorrow, day_id: day.id, after_order_index: 3 }),
      ],
    }]);
  });

  it('ACC-034b a night seated behind every drawn road moves none and reports none', () => {
    const { trip, day, a, b, c, hotel } = afternoonDay();
    const afterA = addVia(day.id, 0);
    const afterB = addVia(day.id, 1);

    const { mirror } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '18:00' }) as any;

    expect(stopsOn(day.id)).toEqual([a.id, b.id, hotel.id, c.id]);
    expect(viaAnchors(day.id)).toEqual([{ id: afterA, after_order_index: 0 }, { id: afterB, after_order_index: 1 }]);
    expect(mirror.vias).toBeUndefined();
  });

  it('ACC-034c re-seating the night by a later check-in re-pins the roads around it', () => {
    const { trip, day, a, b, c, hotel } = afternoonDay();
    // C pinned to the afternoon as well, so an evening check-in puts the night last.
    testDb.prepare("UPDATE day_assignments SET assignment_time = '15:00' WHERE day_id = ? AND place_id = ?").run(day.id, c.id);
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' }) as any;
    expect(stopsOn(day.id)).toEqual([a.id, hotel.id, b.id, c.id]);
    const afterA = addVia(day.id, 0);
    const afterHotel = addVia(day.id, 1);
    const afterB = addVia(day.id, 2);
    const afterC = addVia(day.id, 3);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { check_in: '20:00' }) as any;

    // The night is last now. The road out of it has no leg left and goes; the road
    // behind B follows it one number up. The one behind C was the drive into the next
    // day, which leaves from the hotel now, so it goes as well rather than bending the
    // drive from C to the hotel through a point on the road to tomorrow.
    expect(stopsOn(day.id)).toEqual([a.id, b.id, c.id, hotel.id]);
    expect(viaAnchors(day.id)).toEqual([
      { id: afterA, after_order_index: 0 },
      { id: afterB, after_order_index: 1 },
    ]);
    expect(viaAnchors(day.id).map(via => via.id)).not.toContain(afterHotel);
    expect(viaAnchors(day.id).map(via => via.id)).not.toContain(afterC);
    expect(mirror.moved).not.toBeNull();
    expect(mirror.vias).toEqual([{ dayId: day.id, vias: expect.arrayContaining([expect.objectContaining({ id: afterB, after_order_index: 1 })]) }]);
  });

  it('ACC-034d cancelling the booking takes its stop out and re-pins the roads behind it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const [a, b, hotel] = ['Harbour', 'Mercure', 'Billstedt'].map(name => createPlace(testDb, trip.id, { name }));
    pin(createDayAssignment(testDb, day.id, a.id).id, '09:00');
    pin(createDayAssignment(testDb, day.id, b.id).id, '12:00');
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' }) as any;
    expect(stopsOn(day.id)).toEqual([a.id, hotel.id, b.id]);
    // The road out of the hotel is drawn first: by id alone it would lead the leg
    // it ends up sharing with A's road.
    const afterHotel = addVia(day.id, 1);
    const afterA = addVia(day.id, 0);
    const intoTomorrow = addVia(day.id, 2);

    const { mirror } = svc.deleteAccommodation(accommodation.id);

    expect(stopsOn(day.id)).toEqual([a.id, b.id]);
    // The two legs around the hotel are one leg now, A to B, and the road out of the
    // hotel joins A's road on it, behind it: the drive runs A's point first, then the
    // hotel's, then B. The drive into the next day stays behind B, which is still last.
    expect(legOrder(day.id)).toEqual([
      { id: afterA, after_order_index: 0, sequence: 0 },
      { id: afterHotel, after_order_index: 0, sequence: 1 },
      { id: intoTomorrow, after_order_index: 1, sequence: 0 },
    ]);
    expect(mirror.vias).toEqual([{ dayId: day.id, vias: [
      expect.objectContaining({ id: afterA, after_order_index: 0, sequence: 0 }),
      expect.objectContaining({ id: afterHotel, after_order_index: 0, sequence: 1 }),
      expect.objectContaining({ id: intoTomorrow, after_order_index: 1 }),
    ] }]);
  });

  it('ACC-034e moving the booking to another day re-pins the roads on both days', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const [a, b, c, hotel] = ['Harbour', 'Mercure', 'Museum', 'Billstedt'].map(name => createPlace(testDb, trip.id, { name }));
    pin(createDayAssignment(testDb, day1.id, a.id).id, '09:00');
    pin(createDayAssignment(testDb, day1.id, b.id).id, '12:00');
    pin(createDayAssignment(testDb, day2.id, c.id).id, '14:00');
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day1.id, end_day_id: day1.id, check_in: '11:00' }) as any;
    expect(stopsOn(day1.id)).toEqual([a.id, hotel.id, b.id]);
    const afterA = addVia(day1.id, 0);
    const afterHotel = addVia(day1.id, 1);
    const outOfC = addVia(day2.id, 0);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { start_day_id: day2.id, end_day_id: day2.id }) as any;

    expect(stopsOn(day1.id)).toEqual([a.id, b.id]);
    expect(stopsOn(day2.id)).toEqual([hotel.id, c.id]);
    // The hotel's road on day one joins A's on the leg that is left, behind it.
    expect(legOrder(day1.id)).toEqual([
      { id: afterA, after_order_index: 0, sequence: 0 },
      { id: afterHotel, after_order_index: 0, sequence: 1 },
    ]);
    // C is still the last stop of its day, one number further on.
    expect(viaAnchors(day2.id)).toEqual([{ id: outOfC, after_order_index: 1 }]);
    expect(mirror.vias.map((day: { dayId: number }) => day.dayId).sort()).toEqual([day1.id, day2.id].sort());
  });

  it('ACC-034f a stop the booking hands to the traveller moves no road', () => {
    const { trip, day, hotel } = afternoonDay();
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' }) as any;
    const afterB = addVia(day.id, 2);

    const { mirror } = svc.deleteAccommodation(accommodation.id, { keepStop: true });

    expect(viaAnchors(day.id)).toEqual([{ id: afterB, after_order_index: 2 }]);
    expect(mirror.vias).toBeUndefined();
  });

  it('ACC-034h a booking rebuilt from two stops reports its day once, as it stands at the end', () => {
    // A stay that owns two stops on one day cannot be carried across, so both go and
    // one comes back, and the day's roads are re-pinned at each step. What the mirror
    // reports is the state that was left behind, not both steps.
    const { trip, day, a, b, c, hotel } = afternoonDay();
    const { accommodation } = svc.createAccommodation(trip.id, { place_id: hotel.id, start_day_id: day.id, end_day_id: day.id, check_in: '11:00' }) as any;
    testDb.prepare('INSERT INTO day_assignments (day_id, place_id, order_index, accommodation_id) VALUES (?, ?, 4, ?)').run(day.id, hotel.id, accommodation.id);
    const afterA = addVia(day.id, 0);
    const afterHotel = addVia(day.id, 1);
    const afterB = addVia(day.id, 2);
    addVia(day.id, 3);

    const existing = svc.getAccommodation(accommodation.id, trip.id)!;
    const { mirror } = svc.updateAccommodation(accommodation.id, existing, { notes: 'late arrival' }) as any;

    expect(stopsOn(day.id)).toEqual([a.id, hotel.id, b.id, c.id]);
    expect(mirror.removed).toHaveLength(2);
    expect(mirror.created).not.toBeNull();
    // Both stops went, so the hotel's road joined A's; then the night came back
    // behind A, and B's road moved up with B. C's road was the last stop's leg
    // once the second stop was gone, and stayed gone.
    expect(mirror.vias).toEqual([{ dayId: day.id, vias: [
      expect.objectContaining({ id: afterA, after_order_index: 0, sequence: 0 }),
      expect.objectContaining({ id: afterHotel, after_order_index: 0, sequence: 1 }),
      expect.objectContaining({ id: afterB, after_order_index: 2 }),
    ] }]);
  });

  it('ACC-034g announceMirror sends the re-pinned roads behind the day order', () => {
    const sent: Array<{ event: string; payload: unknown }> = [];
    svc.announceMirror(5, {
      created: { id: 78, day_id: 11 } as never,
      moved: null,
      updated: [],
      removed: [],
      stamped: null,
      vias: [{ dayId: 11, vias: [] }],
    }, (event, payload) => { sent.push({ event, payload }); });
    expect(sent.map(e => e.event)).toEqual(['assignment:created', 'assignment:reordered', 'roadtripVia:changed']);
    expect(sent[2].payload).toEqual({ dayId: 11, vias: [] });
  });
});

describe('AccommodationsService wiring', () => {
  it('ACC-001: the module carries the controller and the RPC surface, and re-exports the service', () => {
    expectRegisteredController(AccommodationsModule, AccommodationsController);
    // The service itself lives in the domain module now, so places can delete the
    // nights booked at a place without the surfaces coming along and closing a loop
    // back through PlacesModule. Still exported from here: everything that imported
    // AccommodationsModule for the service keeps working.
    expectRegisteredProvider(AccommodationsDomainModule, AccommodationsService);
    const imports = Reflect.getMetadata('imports', AccommodationsModule) as unknown[];
    expect(imports).toEqual(expect.arrayContaining([AccommodationsDomainModule]));
    // The MODULE is re-exported, not the provider: Nest refuses to export a provider
    // belonging to an imported module, and a boot that fails on that only shows up when
    // the container is actually built.
    const exports = Reflect.getMetadata('exports', AccommodationsModule) as unknown[];
    expect(Array.isArray(exports)).toBe(true);
    expect(exports).toEqual(expect.arrayContaining([AccommodationsDomainModule]));
  });

  it('ACC-001b: the domain module reaches neither places nor the surfaces', () => {
    // The whole point of the split: PlacesModule imports this one, so a path back to
    // places from here would be the loop it exists to avoid.
    const imports = (Reflect.getMetadata('imports', AccommodationsDomainModule) as { name?: string }[]) ?? [];
    expect(imports.map(m => m?.name)).not.toContain('PlacesModule');
  });

  it('ACC-002: it does not import the days or reservations modules', () => {
    const imports = (Reflect.getMetadata('imports', AccommodationsModule) as { name?: string }[]) ?? [];
    expect(Array.isArray(imports)).toBe(true);
    const names = imports.map((m) => m?.name);
    expect(names).not.toContain('DaysModule');
    expect(names).not.toContain('ReservationsModule');
  });
});
