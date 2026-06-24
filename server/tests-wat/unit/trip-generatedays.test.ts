// tripService.generateDays: date window → day rows.
import { generateDays } from '../../src/services/tripService';
import { db } from '../helpers/db-singleton';
import { resetDb, createUser, createTrip, type TestTrip } from '../helpers/factories';

jest.mock('../../src/db/database', () => require('../helpers/db-singleton').dbMock);
jest.mock('../../src/config', () => require('../helpers/config-mock').CONFIG_MOCK);
jest.mock('../../src/websocket', () => ({ broadcast: jest.fn(), broadcastToUser: jest.fn() }));

let trip: TestTrip;

beforeEach(() => {
  resetDb();
  const owner = createUser();
  trip = createTrip(owner.id);
});

const daysOf = (tripId: number) =>
  db.prepare('SELECT day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as {
    day_number: number;
    date: string | null;
  }[];

describe('generateDays with a dated range', () => {
  it('creates one dated, sequentially numbered day per calendar day', () => {
    generateDays(trip.id, '2026-06-01', '2026-06-05');

    const days = daysOf(trip.id);
    expect(days).toHaveLength(5);
    expect(days.map((d) => d.day_number)).toEqual([1, 2, 3, 4, 5]);
    expect(days.map((d) => d.date)).toEqual(['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']);
  });

  it('treats a single-day trip (start === end) as exactly one day', () => {
    generateDays(trip.id, '2026-06-10', '2026-06-10');

    const days = daysOf(trip.id);
    expect(days).toHaveLength(1);
    expect(days[0]).toEqual({ day_number: 1, date: '2026-06-10' });
  });

  it('caps the generated days at maxDays', () => {
    generateDays(trip.id, '2026-06-01', '2026-06-10', 4); // 10-day window, capped to 4

    const days = daysOf(trip.id);
    expect(days).toHaveLength(4);
    expect(days[days.length - 1].date).toBe('2026-06-04');
  });
});

describe('generateDays with an open (dateless) plan', () => {
  it('creates day_count placeholder days with no dates', () => {
    generateDays(trip.id, null, null, undefined, 3);

    const days = daysOf(trip.id);
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.day_number)).toEqual([1, 2, 3]);
    expect(days.every((d) => d.date === null)).toBe(true);
  });

  it('re-dates an existing dateless plan when a window is added later', () => {
    generateDays(trip.id, null, null, undefined, 2);
    generateDays(trip.id, '2026-07-01', '2026-07-03');

    const days = daysOf(trip.id);
    expect(days).toHaveLength(3);
    expect(days.map((d) => d.date)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });
});
