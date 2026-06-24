// reservationService create/delete: day_id derivation and scoped delete.
import { createReservation, deleteReservation } from '../../src/services/reservationService';
import { db } from '../helpers/db-singleton';
import { resetDb, createUser, createTrip, type TestTrip } from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);

let trip: TestTrip;
let day1Id: number;
let day2Id: number;

beforeEach(() => {
  resetDb();
  const owner = createUser();
  trip = createTrip(owner.id, { start_date: '2026-08-01', end_date: '2026-08-02' });
  day1Id = Number(db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, 1, ?)').run(trip.id, '2026-08-01').lastInsertRowid);
  day2Id = Number(db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, 2, ?)').run(trip.id, '2026-08-02').lastInsertRowid);
});

describe('createReservation day_id derivation', () => {
  it('pins a non-hotel booking to the day matching its reservation_time date', () => {
    const { reservation } = createReservation(trip.id, {
      title: 'Walking tour',
      type: 'activity',
      reservation_time: '2026-08-02T10:00',
    });

    expect(reservation.day_id).toBe(day2Id);
    expect(day1Id).not.toBe(day2Id);
  });

  it('leaves day_id null when no day matches the reservation date', () => {
    const { reservation } = createReservation(trip.id, {
      title: 'Off-trip dinner',
      type: 'restaurant',
      reservation_time: '2026-09-15T19:00',
    });

    expect(reservation.day_id).toBeNull();
  });

  it('does not auto-derive a day for hotel reservations', () => {
    const { reservation, accommodationCreated } = createReservation(trip.id, {
      title: 'Grand Hotel',
      type: 'hotel',
      reservation_time: '2026-08-01T15:00',
    });

    expect(reservation.day_id).toBeNull();
    expect(accommodationCreated).toBe(false);
  });
});

describe('deleteReservation', () => {
  it('removes the reservation and returns the deleted row', () => {
    const { reservation } = createReservation(trip.id, { title: 'Museum', type: 'activity' });

    const result = deleteReservation(reservation.id, trip.id);

    expect(result.deleted).toMatchObject({ id: reservation.id, title: 'Museum' });
    expect(db.prepare('SELECT COUNT(*) AS n FROM reservations WHERE id = ?').get(reservation.id)).toEqual({ n: 0 });
  });

  it('returns undefined when the reservation is not in the trip', () => {
    const { reservation } = createReservation(trip.id, { title: 'Museum', type: 'activity' });
    const otherTrip = createTrip(createUser().id);

    const result = deleteReservation(reservation.id, otherTrip.id);

    expect(result.deleted).toBeUndefined();
  });
});
