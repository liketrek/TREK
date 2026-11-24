/**
 * A booking linked to a plan stop in the trip calendar (#3150). The booking and
 * the stop are one appointment: the booking takes its zone from the stop's place
 * when it has no place of its own, and where the booking has a clock the stop is
 * not exported a second time. The service comes out of the container over a
 * snapshot test db and is seeded through the ORM factories.
 */
import { CalendarModule } from '../../../src/nest/calendar/calendar.module';
import { CalendarService } from '../../../src/nest/calendar/calendar.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { makeReservation } from '../../helpers/factories/reservations';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [CalendarModule] });
  orm = await createTestOrm(db);
});

afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

const exportIcs = async (tripId: number) => (await t.get(CalendarService).exportICS(tripId)).ics.replace(/\r\n /g, '');
/** The VEVENT blocks; the VTIMEZONE observances before the first one are left out. */
const eventsOf = (ics: string) => ics.split('BEGIN:VEVENT').slice(1);
const lunchEvents = (ics: string) => eventsOf(ics).filter((ev) => ev.includes('SUMMARY:Restaurant X'));

/** A London trip with a lunch stop on the 9th of December, and a booking linked to it. */
async function lunch(
  stop: Parameters<typeof makeDayAssignment>[3],
  booking: Parameters<typeof makeReservation>[2],
  type = 'restaurant',
) {
  const { user } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id, { title: 'London' });
  const day = await makeDay(orm, trip.id, { date: '2026-12-09' });
  const place = await makePlace(orm, trip.id, {
    name: 'Restaurant X',
    lat: 51.5074,
    lng: -0.1278,
    address: '1 Strand',
  });
  const assignment = await makeDayAssignment(orm, day.id, place.id, stop);
  const reservation = await makeReservation(orm, trip.id, {
    title: 'Restaurant X',
    type,
    assignment: assignment.id,
    ...booking,
  });
  return { ics: await exportIcs(trip.id), assignment, reservation };
}

describe('bookings linked to a plan stop (#3150)', () => {
  it('CAL-3150a: the booking takes the zone of its stop and the stop is not exported a second time', async () => {
    const { ics, assignment, reservation } = await lunch(
      { assignment_time: '14:00', assignment_end_time: '15:30' },
      { reservation_time: '2026-12-09T14:00', reservation_end_time: '2026-12-09T15:30' },
    );

    const booking = eventsOf(ics).find((ev) => ev.includes(`UID:trek-res-${reservation.id}@trek`));
    expect(booking).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\n');
    expect(booking).toContain('DTEND;TZID=Europe/London:20261209T153000\r\n');
    // What the stop event said and the booking lacks moves over with it.
    expect(booking).toContain('LOCATION:1 Strand\r\n');
    expect(eventsOf(ics).join('')).not.toMatch(/DTSTART:\d{8}T/);
    expect(ics).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/London');
    expect(ics).not.toContain(`UID:trek-assign-${assignment.id}@trek`);
    expect(lunchEvents(ics)).toHaveLength(1);
  });

  it('CAL-3150b: a booking without an end keeps the length and notes of the stop it replaces', async () => {
    const { ics } = await lunch(
      { assignment_time: '14:00', assignment_end_time: '15:30', notes: 'Ask for the terrace' },
      { reservation_time: '2026-12-09T14:00', confirmation_number: 'R-1' },
    );

    expect(lunchEvents(ics)).toHaveLength(1);
    const [ev] = lunchEvents(ics);
    expect(ev).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\nDTEND;TZID=Europe/London:20261209T153000\r\n');
    expect(ev).toContain('DESCRIPTION:Type: restaurant\\nConfirmation: R-1\\nAsk for the terrace\r\n');
  });

  it('CAL-3150c: a booking at another time than its stop keeps its own, without borrowing the stop end', async () => {
    const { ics } = await lunch(
      { assignment_time: '13:00', assignment_end_time: '14:30' },
      { reservation_time: '2026-12-09T14:00' },
    );

    expect(lunchEvents(ics)).toHaveLength(1);
    const [ev] = lunchEvents(ics);
    expect(ev).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\n');
    expect(ev).not.toContain('DTEND');
  });

  it('CAL-3150d: an untimed stop leaves the day summary once its booking has a clock', async () => {
    const { ics } = await lunch({}, { reservation_time: '2026-12-09T14:00', reservation_end_time: '15:30' }, 'event');

    expect(ics).not.toContain('• Restaurant X');
    expect(ics).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\nDTEND;TZID=Europe/London:20261209T153000\r\n');
  });

  it('CAL-3150e: a booking without a clock leaves its stop as the timed event', async () => {
    const { ics, assignment } = await lunch({ assignment_time: '14:00' }, { reservation_time: '2026-12-09' });

    expect(ics).toContain(`UID:trek-assign-${assignment.id}@trek`);
    expect(ics).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261209\r\n');
  });

  it('CAL-3150f: a staged booking does not take the stop out of the calendar', async () => {
    const { ics, assignment } = await lunch(
      { assignment_time: '14:00' },
      { reservation_time: '2026-12-09T14:00', ingest_state: 'staged' },
    );

    expect(ics).toContain(`UID:trek-assign-${assignment.id}@trek`);
    expect(lunchEvents(ics)).toHaveLength(1);
  });

  it('CAL-3150g: a booking with a place of its own keeps that place zone', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Two Cities' });
    const day = await makeDay(orm, trip.id, { date: '2026-12-09' });
    const stopPlace = await makePlace(orm, trip.id, { name: 'Stop', lat: 51.5074, lng: -0.1278 });
    const ownPlace = await makePlace(orm, trip.id, { name: 'Own', lat: 48.8566, lng: 2.3522 });
    const assignment = await makeDayAssignment(orm, day.id, stopPlace.id, { assignment_time: '14:00' });
    await makeReservation(orm, trip.id, {
      title: 'Show',
      type: 'event',
      assignment: assignment.id,
      place: ownPlace.id,
      reservation_time: '2026-12-09T20:00',
    });

    const ics = await exportIcs(trip.id);

    expect(ics).toContain('DTSTART;TZID=Europe/Paris:20261209T200000\r\n');
    expect(ics).not.toContain(`UID:trek-assign-${assignment.id}@trek`);
  });

  it('CAL-3150h: a booking on a stop of an undated day still takes the zone of that stop', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Undated' });
    const day = await makeDay(orm, trip.id, { date: null });
    const place = await makePlace(orm, trip.id, { name: 'Tokyo Tower', lat: 35.6586, lng: 139.7454 });
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await makeReservation(orm, trip.id, {
      title: 'Observation deck',
      type: 'tour',
      assignment: assignment.id,
      reservation_time: '2026-12-09T10:00',
    });

    const ics = await exportIcs(trip.id);

    expect(ics).toContain('DTSTART;TZID=Asia/Tokyo:20261209T100000\r\n');
  });

  it('CAL-3150i: a booking on the day after its stop keeps both events', async () => {
    const { ics, assignment } = await lunch({ assignment_time: '14:00' }, { reservation_time: '2026-12-10T14:00' });

    expect(ics).toContain(`UID:trek-assign-${assignment.id}@trek`);
    expect(lunchEvents(ics)).toHaveLength(2);
    expect(ics).toContain('DTSTART;TZID=Europe/London:20261210T140000\r\n');
  });

  it('CAL-3150j: a stop whose place has no address hands the booking its name as the location', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'London' });
    const day = await makeDay(orm, trip.id, { date: '2026-12-09' });
    const place = await makePlace(orm, trip.id, { name: 'The Ivy', lat: 51.5074, lng: -0.1278, address: null });
    const assignment = await makeDayAssignment(orm, day.id, place.id, { assignment_time: '19:00' });
    await makeReservation(orm, trip.id, {
      title: 'Dinner',
      type: 'restaurant',
      assignment: assignment.id,
      reservation_time: '2026-12-09T19:00',
    });

    const ics = await exportIcs(trip.id);

    expect(ics).not.toContain(`UID:trek-assign-${assignment.id}@trek`);
    expect(ics).toContain('SUMMARY:Dinner\r\nDESCRIPTION:Type: restaurant\r\nLOCATION:The Ivy\r\n');
  });

  /** A London trip with one stop on the 9th of December and a booking that names no place and no stop. */
  async function unlinked(booking: Parameters<typeof makeReservation>[2]) {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'London' });
    const day = await makeDay(orm, trip.id, { date: '2026-12-09' });
    const place = await makePlace(orm, trip.id, { name: 'Museum', lat: 51.5194, lng: -0.127 });
    await makeDayAssignment(orm, day.id, place.id);
    await makeReservation(orm, trip.id, { title: 'Booked', ...booking });
    return exportIcs(trip.id);
  }

  it('CAL-3150k: a booking with no place and no stop takes the zone of the stops on its day', async () => {
    const ics = await unlinked({
      type: 'restaurant',
      reservation_time: '2026-12-09T14:00',
      reservation_end_time: '15:30',
    });

    expect(ics).toContain('DTSTART;TZID=Europe/London:20261209T140000\r\nDTEND;TZID=Europe/London:20261209T153000\r\n');
    expect(eventsOf(ics).join('')).not.toMatch(/DTSTART:\d{8}T/);
  });

  it('CAL-3150l: a transport with no endpoints is not given a zone guessed from the stops', async () => {
    const ics = await unlinked({ type: 'train', reservation_time: '2026-12-09T14:00' });

    expect(ics).toContain('DTSTART:20261209T140000\r\n');
  });
});
