/**
 * RoadtripPlanService against the worker's real SQLite schema.
 *
 * The planning SELECT is the one place the server reads a visit's times for the road
 * trip, and the tests beside the MCP tools hand the service its rows by hand, so a
 * column the statement never selects would go unnoticed there. These run the statement.
 */
import { db } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RoadtripPlanService } from '../../../src/nest/roadtrip/roadtrip-plan.service';
import { createDay, createDayAssignment, createPlace, createTrip, createUser } from '../../helpers/factories';
import { resetTestDb } from '../../helpers/test-db';

import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Every leg an hour and 60 km, whatever it joins. */
function hourlyRouter() {
  return {
    profiles: () => ['driving'],
    route: vi.fn(async (_user: number, _trip: number, _day: number, points: { lat: number; lng: number }[]) => ({
      parts: points.slice(1).map(() => ({ distance: 60000, duration: 3600 })),
      avoidMissed: [],
      leg: {
        line: points.map((p) => [p.lat, p.lng]),
        vias: [],
        seg: {
          from: [points[0].lat, points[0].lng],
          to: [points[points.length - 1].lat, points[points.length - 1].lng],
          mid: [points[0].lat, points[0].lng],
          distance: 60000 * (points.length - 1),
          duration: 3600 * (points.length - 1),
          mode: 'driving',
          distanceText: '',
          drivingText: '',
          walkingText: '',
        },
      },
    })),
  };
}

function setup() {
  const { user } = createUser(db);
  const trip = createTrip(db, user.id);
  const day = createDay(db, trip.id);
  const visits = ['Hamburg', 'Lueneburg', 'Celle'].map((name, i) => {
    const place = createPlace(db, trip.id, { name, lat: 53 - i * 0.3, lng: 10 });
    db.prepare('UPDATE places SET duration_minutes = ? WHERE id = ?').run(i === 0 ? 0 : 30, place.id);
    return createDayAssignment(db, day.id, place.id);
  });
  db.prepare("UPDATE day_assignments SET assignment_time = '09:00' WHERE id = ?").run(visits[0].id);
  const plans = new RoadtripPlanService(
    new DatabaseService(db),
    { getUserSettings: () => ({}) } as never,
    { read: () => ({}) } as never,
    hourlyRouter() as never,
    { listForTrip: () => [], tracksForTrip: () => [] } as never,
    { list: () => [] } as never,
  );
  return { user, trip, visits, plans };
}

beforeEach(() => {
  resetTestDb(db);
});

describe('a visit end time on the road trip', () => {
  it('is read from the visit, and from the place when the visit has none', () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '14:00' WHERE id = ?").run(visits[1].id);
    db.prepare(
      "UPDATE places SET end_time = '18:00' WHERE id = (SELECT place_id FROM day_assignments WHERE id = ?)",
    ).run(visits[2].id);

    const context = plans.context(trip.id, user.id);

    expect(context.visits.map((v) => [v.name, v.end_time])).toEqual([
      ['Hamburg', null],
      ['Lueneburg', '14:00'],
      ['Celle', '18:00'],
    ]);
  });

  it('is when the drive leaves the stop, in place of its stay', async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '14:00' WHERE id = ?").run(visits[1].id);

    const { calculated } = await plans.calculate(trip.id, user.id);
    const day = calculated.days[0];

    expect(day.stops[1]).toMatchObject({ name: 'Lueneburg', leaveAt: '14:00' });
    expect(day.schedule.entries.map((e) => [e.arrival, e.departure])).toEqual([
      ['09:00', '09:00'],
      ['10:00', '14:00'],
      ['15:00', '15:30'],
    ]);
    expect(day.schedule.warnings).toEqual([]);
  });

  it('is reported when the drive gets there after it', async () => {
    const { user, trip, visits, plans } = setup();
    db.prepare("UPDATE day_assignments SET assignment_end_time = '09:30' WHERE id = ?").run(visits[1].id);

    const { calculated } = await plans.calculate(trip.id, user.id);

    expect(calculated.days[0].schedule.warnings).toEqual([{ index: 1, code: 'missedLeave', minutes: 30 }]);
    expect(calculated.days[0].schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '10:00' });
  });

  it('leaves a stop without one to its stay', async () => {
    const { user, trip, plans } = setup();

    const { calculated } = await plans.calculate(trip.id, user.id);

    expect(calculated.days[0].schedule.entries[1]).toMatchObject({ arrival: '10:00', departure: '10:30' });
    expect(calculated.days[0].stops[1].leaveAt).toBeNull();
  });
});
