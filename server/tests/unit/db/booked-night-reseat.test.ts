/**
 * The step that seats every booked night where its check-in says.
 *
 * A night's stop used to go last on its check-in day unless a stop pinned to a later
 * hour pulled it forward, and the backfill for older bookings appended it as well. The
 * night leads its day now (night-seat.ts, the rule AccommodationsService applies), and
 * this step brings the trips planned under the old rule along, drawn roads included.
 *
 * The rules live in reseat-booked-nights.ts and are tested there directly on a fully
 * migrated database: the columns the step reads (assignment_time, accommodation_id)
 * and the vias table come from migrations, so seeding before runMigrations is not an
 * option, and rewinding schema_version would tie this file to the tail of the
 * append-only array.
 */
import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { reseatBookedNights } from '../../../src/db/reseat-booked-nights';

function freshDb() {
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  createTables(db);
  runMigrations(db);
  db.prepare("INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'u', 'u@test.local', 'x', 'user')").run();
  db.prepare("INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')").run();
  db.prepare("INSERT INTO days (id, trip_id, day_number, date) VALUES (1, 1, 1, '2026-10-02')").run();
  return db;
}

let nextPlace = 1;
function place(db: Database.Database, name: string, time: string | null = null, located = true) {
  const id = nextPlace++;
  db.prepare('INSERT INTO places (id, trip_id, name, lat, lng, place_time) VALUES (?, 1, ?, ?, ?, ?)')
    .run(id, name, located ? 50 + id / 100 : null, located ? 10 : null, time);
  return id;
}

let nextStop = 1;
function stop(db: Database.Database, placeId: number, orderIndex: number, time: string | null = null, accommodationId: number | null = null) {
  const id = nextStop++;
  db.prepare('INSERT INTO day_assignments (id, day_id, place_id, order_index, assignment_time, accommodation_id) VALUES (?, 1, ?, ?, ?, ?)')
    .run(id, placeId, orderIndex, time, accommodationId);
  return id;
}

function night(db: Database.Database, placeId: number, checkIn: string | null) {
  return Number(db.prepare('INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in) VALUES (1, ?, 1, 1, ?)')
    .run(placeId, checkIn).lastInsertRowid);
}

const order = (db: Database.Database) =>
  (db.prepare('SELECT place_id FROM day_assignments WHERE day_id = 1 ORDER BY order_index').all() as { place_id: number }[]).map((r) => r.place_id);
const indexes = (db: Database.Database) =>
  (db.prepare('SELECT order_index FROM day_assignments WHERE day_id = 1 ORDER BY order_index').all() as { order_index: number }[]).map((r) => r.order_index);
const vias = (db: Database.Database) =>
  db.prepare('SELECT id, after_order_index, sequence FROM roadtrip_vias WHERE day_id = 1 ORDER BY after_order_index, sequence, id').all() as
    { id: number; after_order_index: number; sequence: number }[];
const via = (db: Database.Database, afterOrderIndex: number, sequence = 0) =>
  Number(db.prepare('INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (1, ?, ?, 50, 10)').run(afterOrderIndex, sequence).lastInsertRowid);

describe('booked night reseat', () => {
  it('RESEAT-001: a night appended behind stops without an hour leads the day', () => {
    const db = freshDb();
    const [fuel, farm, hotel] = [place(db, 'Aral'), place(db, 'Karls'), place(db, 'Rostock')];
    stop(db, fuel, 0);
    stop(db, farm, 1);
    stop(db, hotel, 2, null, night(db, hotel, '10:00'));

    expect(reseatBookedNights(db)).toBe(1);

    expect(order(db)).toEqual([hotel, fuel, farm]);
    expect(indexes(db)).toEqual([0, 1, 2]);
  });

  it('RESEAT-002: a night without a check-in leads the day too', () => {
    const db = freshDb();
    const [museum, hotel] = [place(db, 'Museum'), place(db, 'Adlon')];
    stop(db, museum, 0);
    stop(db, hotel, 1, null, night(db, hotel, null));

    reseatBookedNights(db);

    expect(order(db)).toEqual([hotel, museum]);
  });

  it('RESEAT-003: a stop with its own hour at or before the check-in stays ahead', () => {
    const db = freshDb();
    const [early, loose, late, hotel] = [place(db, 'Aral'), place(db, 'Hafen'), place(db, 'Museum'), place(db, 'Rostock')];
    stop(db, early, 0, '08:00');
    stop(db, loose, 1);
    // The place's own hour counts as much as the visit's.
    stop(db, late, 2, null);
    db.prepare("UPDATE places SET place_time = '14:00' WHERE id = ?").run(late);
    stop(db, hotel, 3, null, night(db, hotel, '10:00'));

    reseatBookedNights(db);

    expect(order(db)).toEqual([early, hotel, loose, late]);
  });

  it('RESEAT-004: a night already in its seat, and a stop the traveller placed, are left alone', () => {
    const db = freshDb();
    const [hotel, museum, own] = [place(db, 'Adlon'), place(db, 'Museum'), place(db, 'Campsite')];
    stop(db, hotel, 0, null, night(db, hotel, '15:00'));
    stop(db, museum, 1);
    // Booked in road trip mode: the stop is the traveller's, the booking owns no row.
    night(db, own, '18:00');
    stop(db, own, 2);

    expect(reseatBookedNights(db)).toBe(0);

    expect(order(db)).toEqual([hotel, museum, own]);
  });

  it('RESEAT-005: the drawn roads follow the stops they were drawn after', () => {
    const db = freshDb();
    const [a, b, hotel] = [place(db, 'Harbour'), place(db, 'Mercure'), place(db, 'Rostock')];
    stop(db, a, 0);
    stop(db, b, 1);
    stop(db, hotel, 2, null, night(db, hotel, '10:00'));
    const afterA = via(db, 0);
    const afterB = via(db, 1);
    const afterHotel = via(db, 2);

    reseatBookedNights(db);

    // The rules the service applies when it moves a night: a via follows the stop
    // it was drawn after, so A's road is on leg one now; B is last now and has no leg
    // to keep a via on, so its road goes. The hotel's road was the drive into the next
    // day, behind the last stop, and goes too now that the hotel leads the day: on the
    // leg out of the hotel it would bend the drive to A through a point on that road.
    expect(order(db)).toEqual([hotel, a, b]);
    expect(vias(db)).toEqual([{ id: afterA, after_order_index: 1, sequence: 0 }]);
    expect(vias(db).map((v) => v.id)).not.toContain(afterB);
    expect(vias(db).map((v) => v.id)).not.toContain(afterHotel);
  });

  it('RESEAT-006: a road behind the last stop stays with it, and the roads ahead follow their stops', () => {
    // The hotel moves from the middle to the front. C is last before and after, so the
    // drive into the next day stays behind it; the hotel's road follows the hotel to
    // leg zero and A's follows A to leg one. Nothing merges in a pure reorder.
    const db = freshDb();
    const [a, hotel, c] = [place(db, 'Harbour'), place(db, 'Rostock'), place(db, 'Museum')];
    stop(db, a, 0);
    stop(db, hotel, 1, null, night(db, hotel, '10:00'));
    stop(db, c, 2);
    const afterHotel = via(db, 1);
    const afterA = via(db, 0);
    const intoTomorrow = via(db, 2);

    reseatBookedNights(db);

    expect(order(db)).toEqual([hotel, a, c]);
    expect(vias(db)).toEqual([
      { id: afterHotel, after_order_index: 0, sequence: 0 },
      { id: afterA, after_order_index: 1, sequence: 0 },
      { id: intoTomorrow, after_order_index: 2, sequence: 0 },
    ]);
  });

  it('RESEAT-007: a stop without coordinates is not counted among the positions the roads are pinned to', () => {
    const db = freshDb();
    const [a, ghost, hotel] = [place(db, 'Harbour'), place(db, 'No map', null, false), place(db, 'Rostock')];
    stop(db, a, 0);
    stop(db, ghost, 1);
    stop(db, hotel, 2, null, night(db, hotel, '10:00'));
    const afterA = via(db, 0);

    reseatBookedNights(db);

    expect(order(db)).toEqual([hotel, a, ghost]);
    // Located stops went [A, hotel] to [hotel, A]: A is last now, so its road has
    // no leg left.
    expect(vias(db).map((v) => v.id)).not.toContain(afterA);
  });

  it('RESEAT-010: two nights on one day settle by their check-ins', () => {
    const db = freshDb();
    const [later, earlier] = [place(db, 'Rue de Paris'), place(db, 'Brandenburger Tor')];
    stop(db, later, 0, null, night(db, later, '12:00'));
    stop(db, earlier, 1, null, night(db, earlier, '10:00'));

    reseatBookedNights(db);

    expect(order(db)).toEqual([earlier, later]);
    expect(reseatBookedNights(db)).toBe(0);
  });

  it('RESEAT-011: two nights with the same check-in, booked in that order, stay put with their roads', () => {
    // Each used to count the other as "at or before" its check-in, so the step reported
    // two moves it never made and the reanchor dropped the road between them.
    const db = freshDb();
    const [first, second] = [place(db, 'Adlon'), place(db, 'Mercure')];
    stop(db, first, 0, null, night(db, first, '15:00'));
    stop(db, second, 1, null, night(db, second, '15:00'));
    const between = via(db, 0);
    const intoTomorrow = via(db, 1);

    expect(reseatBookedNights(db)).toBe(0);

    expect(order(db)).toEqual([first, second]);
    expect(vias(db)).toEqual([
      { id: between, after_order_index: 0, sequence: 0 },
      { id: intoTomorrow, after_order_index: 1, sequence: 0 },
    ]);
    expect(reseatBookedNights(db)).toBe(0);
  });

  it('RESEAT-012: two nights with the same check-in settle by their booking, and only once', () => {
    const db = freshDb();
    const [fuel, first, second] = [place(db, 'Aral'), place(db, 'Adlon'), place(db, 'Mercure')];
    const firstNight = night(db, first, '15:00');
    const secondNight = night(db, second, '15:00');
    stop(db, fuel, 0);
    stop(db, second, 1, null, secondNight);
    stop(db, first, 2, null, firstNight);

    expect(reseatBookedNights(db)).toBe(2);

    expect(order(db)).toEqual([first, second, fuel]);
    expect(indexes(db)).toEqual([0, 1, 2]);
    expect(reseatBookedNights(db)).toBe(0);
    expect(order(db)).toEqual([first, second, fuel]);
  });

  it('RESEAT-013: two nights without a check-in settle by their booking too', () => {
    // Both used to want the front, and every pass swapped them.
    const db = freshDb();
    const [first, second] = [place(db, 'Adlon'), place(db, 'Mercure')];
    const firstNight = night(db, first, null);
    const secondNight = night(db, second, null);
    stop(db, second, 0, null, secondNight);
    stop(db, first, 1, null, firstNight);

    expect(reseatBookedNights(db)).toBe(1);

    expect(order(db)).toEqual([first, second]);
    expect(reseatBookedNights(db)).toBe(0);
    expect(order(db)).toEqual([first, second]);
  });

  it('RESEAT-014: a night without a check-in leads one with a clock', () => {
    const db = freshDb();
    const [fuel, clocked, open] = [place(db, 'Aral'), place(db, 'Adlon'), place(db, 'Mercure')];
    stop(db, fuel, 0);
    stop(db, clocked, 1, null, night(db, clocked, '15:00'));
    stop(db, open, 2, null, night(db, open, null));

    reseatBookedNights(db);

    expect(order(db)).toEqual([open, clocked, fuel]);
    expect(reseatBookedNights(db)).toBe(0);
    expect(order(db)).toEqual([open, clocked, fuel]);
  });

  it('RESEAT-015: an hour pinned on a night own stop is not what the other nights read it by', () => {
    // The stop carries eight, the booking carries three, and a night seats itself by
    // its check-in. Read the pinned hour off the row instead and the two of them
    // answer the same question differently: each counts the other as ahead, the step
    // reports two moves on every run for ever, and the swap in between drops the road.
    const db = freshDb();
    const [first, second] = [place(db, 'Adlon'), place(db, 'Mercure')];
    const firstNight = night(db, first, '15:00');
    const secondNight = night(db, second, '15:00');
    stop(db, first, 0, null, firstNight);
    stop(db, second, 1, '08:00', secondNight);
    const between = via(db, 0);

    expect(reseatBookedNights(db)).toBe(0);

    expect(order(db)).toEqual([first, second]);
    expect(vias(db)).toEqual([{ id: between, after_order_index: 0, sequence: 0 }]);
    expect(reseatBookedNights(db)).toBe(0);
  });

  it('RESEAT-016: a night without a check-in leads on its booking, whatever hour its place carries', () => {
    const db = freshDb();
    const [first, second] = [place(db, 'Adlon', '09:00'), place(db, 'Mercure')];
    const firstNight = night(db, first, null);
    const secondNight = night(db, second, null);
    stop(db, second, 0, null, secondNight);
    stop(db, first, 1, null, firstNight);

    expect(reseatBookedNights(db)).toBe(1);

    expect(order(db)).toEqual([first, second]);
    expect(reseatBookedNights(db)).toBe(0);
    expect(order(db)).toEqual([first, second]);
  });

  it('RESEAT-008: runs again without moving anything', () => {
    const db = freshDb();
    const [fuel, hotel] = [place(db, 'Aral'), place(db, 'Rostock')];
    stop(db, fuel, 0);
    stop(db, hotel, 1, null, night(db, hotel, '10:00'));
    reseatBookedNights(db);
    const once = order(db);

    expect(reseatBookedNights(db)).toBe(0);
    expect(order(db)).toEqual(once);
  });

  it('RESEAT-009: the migration runs the step on a database being upgraded', () => {
    // Seeded through the tables the base schema has, so the step fires on its normal
    // pass: the backfill for older bookings appends the night last first, then the
    // reseat brings it to the front.
    const db = new Database(':memory:');
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA foreign_keys = ON');
    createTables(db);
    db.prepare("INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'u', 'u@test.local', 'x', 'user')").run();
    db.prepare("INSERT INTO trips (id, user_id, title) VALUES (1, 1, 'T')").run();
    db.prepare("INSERT INTO days (id, trip_id, day_number, date) VALUES (1, 1, 1, '2026-10-02')").run();
    db.prepare("INSERT INTO places (id, trip_id, name, lat, lng) VALUES (901, 1, 'Aral', 50.1, 10), (902, 1, 'Rostock', 50.2, 10)").run();
    db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (1, 901, 0)').run();
    db.prepare("INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in) VALUES (1, 902, 1, 1, '10:00')").run();

    runMigrations(db);

    expect(order(db)).toEqual([902, 901]);
  });
});
