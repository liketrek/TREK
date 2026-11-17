import { describe, expect, it, vi } from 'vitest';
import type { Day, PackingItem, Place, Reservation, TodoItem, Trip } from '../types';

vi.mock('./platform', () => ({ isNativeIos: vi.fn(() => true) }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn((feature: string) => feature === 'watch') }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: {
    setWatchSnapshot: vi.fn(async () => {}),
    takeWatchActions: vi.fn(async () => ({ actions: [] as unknown[] })),
  },
}));

import { hasNativeFeature } from './capabilities';
import { reportNativeFailure } from './reportFailure';
import { TrekShell } from './trekShell';
import {
  applyWatchActions,
  buildWatchSnapshot,
  fitWatchSnapshot,
  parseWatchActions,
  publishWatch,
  takeWatchActions,
  watchBooking,
  watchDays,
  watchPacking,
  watchTodos,
  type WatchSnapshot,
} from './watch';
import { upcomingReservations } from './widgetExtras';

const trip = { id: 7, title: 'Autumn in Kyoto', start_date: '2026-11-17', end_date: '2026-11-25' } as unknown as Trip;

const day = (id: number, n: number, date: string | null, stops: Record<string, unknown>[]) =>
  ({
    id,
    trip_id: 7,
    day_number: n,
    date,
    assignments: stops.map((place, i) => ({ id: id * 10 + i, order_index: i, place })),
  }) as unknown as Day;

const reservation = (fields: Partial<Reservation> & { id: number; title: string; type: string }): Reservation =>
  ({ trip_id: 7, status: 'confirmed', ...fields }) as Reservation;

const flight = reservation({
  id: 1,
  title: 'LH 716',
  type: 'flight',
  reservation_time: '2026-11-17T13:05',
  reservation_end_time: '2026-11-18T08:50',
  confirmation_number: ' K7Q2XD ',
  metadata: JSON.stringify({ airline: 'Lufthansa', flight_number: 'LH 716', seat: '42A' }),
  endpoints: [
    {
      role: 'to',
      sequence: 1,
      name: 'Tokyo Haneda',
      code: 'HND',
      lat: 35.5494,
      lng: 139.7798,
      timezone: 'Asia/Tokyo',
      local_time: null,
      local_date: null,
    },
    {
      role: 'from',
      sequence: 0,
      name: 'Frankfurt',
      code: 'FRA',
      lat: 50.0379,
      lng: 8.5622,
      timezone: 'Europe/Berlin',
      local_time: null,
      local_date: null,
    },
  ],
});

const hotel = reservation({
  id: 2,
  title: 'Hotel Kanra Kyoto',
  type: 'hotel',
  day_id: 2,
  end_day_id: 3,
  accommodation_place_id: 50,
  accommodation_name: 'Hotel Kanra Kyoto',
  metadata: JSON.stringify({ check_in_time: '15:00', check_out_time: '11:00' }),
});

const places = [{ id: 50, lat: 34.99, lng: 135.76, address: 'Kyoto' }] as unknown as Place[];

const days = [
  day(1, 1, '2026-11-17', []),
  day(2, 2, '2026-11-18', [
    {
      name: 'Fushimi Inari',
      place_time: '08:30',
      end_time: '10:30',
      lat: 34.967146,
      lng: 135.772673,
      address: '68 Fukakusa',
      category: { color: '#D6273B', icon: 'Landmark' },
    },
    { name: 'Nishiki Market', place_time: null, lat: null, lng: null },
  ]),
  day(3, 3, '2026-11-19', []),
];

describe('watchDays', () => {
  it('lists the days in order with their stops, coordinates and the timed bookings of their date', () => {
    const bookings = [
      watchBooking(flight, { day: '2026-11-17', time: '13:05' }, { dayDates: new Map(), places: new Map() }),
    ];
    const out = watchDays([days[2], days[0], days[1]], bookings);
    expect(out.map((d) => d.number)).toEqual([1, 2, 3]);
    expect(out[0].stops).toEqual([
      {
        name: 'LH 716',
        minutes: 785,
        symbol: 'airplane',
        booking: 'flight',
        address: 'Frankfurt',
        lat: 50.0379,
        lng: 8.5622,
      },
    ]);
    expect(out[1].stops[0]).toEqual({
      name: 'Fushimi Inari',
      minutes: 510,
      endMinutes: 630,
      symbol: 'building.columns.fill',
      color: '#D6273B',
      address: '68 Fukakusa',
      lat: 34.96715,
      lng: 135.77267,
    });
    expect(out[1].stops[1]).toEqual({ name: 'Nishiki Market' });
  });

  it('prefers the stop time set on the day over the place time', () => {
    const custom = day(4, 1, '2026-11-20', []);
    custom.assignments = [
      { id: 1, order_index: 0, assignment_time: '09:15', place: { name: 'Gion', place_time: '18:00' } },
    ] as unknown as Day['assignments'];
    expect(watchDays([custom], [])[0].stops[0].minutes).toBe(555);
  });
});

describe('watchBooking', () => {
  it('carries the reference, seat, carrier, both airports and the departure zone', () => {
    const b = watchBooking(flight, { day: '2026-11-17', time: '13:05' }, { dayDates: new Map(), places: new Map() });
    expect(b).toMatchObject({
      id: 1,
      kind: 'flight',
      confirmed: true,
      date: '2026-11-17',
      time: '13:05',
      endDate: '2026-11-18',
      endTime: '08:50',
      zone: 'Europe/Berlin',
      endZone: 'Asia/Tokyo',
      code: 'K7Q2XD',
      carrier: 'Lufthansa LH 716',
      seat: '42A',
      from: { name: 'Frankfurt', code: 'FRA' },
      to: { name: 'Tokyo Haneda', code: 'HND' },
    });
  });

  it('gives a stay its check-in, check-out, dates from its days and the hotel as the place to go', () => {
    const dayDates = new Map([
      [2, '2026-11-18'],
      [3, '2026-11-19'],
    ]);
    const b = watchBooking(hotel, { day: '2026-11-18', time: null }, { dayDates, places: new Map([[50, places[0]]]) });
    expect(b).toMatchObject({
      kind: 'hotel',
      time: '15:00',
      endDate: '2026-11-19',
      endTime: '11:00',
      checkIn: '15:00',
      checkOut: '11:00',
      location: 'Hotel Kanra Kyoto',
      lat: 34.99,
      lng: 135.76,
    });
  });
});

describe('upcomingReservations', () => {
  it('keeps a stay that is running when asked to', () => {
    const dayDates = new Map([
      [2, '2026-11-18'],
      [3, '2026-11-19'],
    ]);
    expect(upcomingReservations([hotel], { dayDates, today: '2026-11-19' })).toEqual([]);
    expect(upcomingReservations([hotel], { dayDates, today: '2026-11-19', running: true })).toHaveLength(1);
  });
});

describe('the arrival zone', () => {
  it('falls back to the arrival timezone in the metadata and is left out without one', () => {
    const noEndpoints = reservation({
      id: 9,
      title: 'LH 717',
      type: 'flight',
      reservation_time: '2026-11-25T10:00',
      metadata: JSON.stringify({ departure_timezone: 'Asia/Tokyo', arrival_timezone: 'Europe/Berlin' }),
    });
    const b = watchBooking(
      noEndpoints,
      { day: '2026-11-25', time: '10:00' },
      { dayDates: new Map(), places: new Map() }
    );
    expect(b).toMatchObject({ zone: 'Asia/Tokyo', endZone: 'Europe/Berlin' });
    const plain = watchBooking(hotel, { day: '2026-11-18', time: null }, { dayDates: new Map(), places: new Map() });
    expect(plain).not.toHaveProperty('endZone');
  });
});

describe('the lists', () => {
  it('puts the packing still to do first and counts what is packed', () => {
    const items = [
      { id: 1, name: 'Passport', checked: 1, category: 'Documents', sort_order: 0 },
      { id: 2, name: 'Rain jacket', checked: 0, category: 'Clothes', sort_order: 1 },
    ] as PackingItem[];
    expect(watchPacking(items)).toEqual({
      items: [
        { id: 2, name: 'Rain jacket', done: false, group: 'Clothes' },
        { id: 1, name: 'Passport', done: true, group: 'Documents' },
      ],
      packed: 1,
      total: 2,
    });
    expect(watchPacking([])).toBeUndefined();
  });

  it('orders the to-dos by done, due date, then priority', () => {
    const todo = (id: number, fields: Partial<TodoItem>) =>
      ({
        id,
        name: `T${id}`,
        checked: 0,
        due_date: null,
        priority: 0,
        sort_order: id,
        category: null,
        ...fields,
      }) as TodoItem;
    const out = watchTodos([
      todo(1, { checked: 1 }),
      todo(2, {}),
      todo(3, { due_date: '2026-11-15', priority: 1 }),
      todo(4, { priority: 3 }),
      todo(5, { due_date: '2026-11-10' }),
    ]);
    expect(out?.items.map((i) => i.id)).toEqual([5, 3, 4, 2, 1]);
    expect(out?.items[1]).toEqual({ id: 3, name: 'T3', done: false, due: '2026-11-15', priority: 1 });
    expect(out?.open).toBe(4);
  });
});

describe('buildWatchSnapshot', () => {
  const src = {
    trip,
    days,
    places,
    reservations: [
      flight,
      hotel,
      reservation({ id: 3, title: 'Old', type: 'tour', reservation_time: '2026-11-01T10:00' }),
    ],
    packing: [],
    todos: [],
    today: '2026-11-07',
    hour12: false,
    place: 'Kyoto, Japan',
    applied: ['a1'],
    now: new Date('2026-11-07T10:00:00Z'),
  };

  it('carries the trip, its days, the bookings ahead and the applied ticks', () => {
    const snapshot = buildWatchSnapshot(src);
    expect(snapshot.v).toBe(1);
    expect(snapshot.generatedAt).toBe('2026-11-07T10:00:00.000Z');
    expect(snapshot.trip).toEqual({
      id: 7,
      title: 'Autumn in Kyoto',
      start: '2026-11-17',
      end: '2026-11-25',
      place: 'Kyoto, Japan',
    });
    expect(snapshot.bookings.map((b) => b.id)).toEqual([1, 2]);
    expect(snapshot.days).toHaveLength(3);
    expect(snapshot.applied).toEqual(['a1']);
    expect(snapshot).not.toHaveProperty('packing');
  });

  it('is an empty snapshot without a trip', () => {
    expect(buildWatchSnapshot({ ...src, trip: null })).toMatchObject({ trip: null, days: [], bookings: [] });
  });
});

describe('fitWatchSnapshot', () => {
  const big = (): WatchSnapshot => ({
    v: 1,
    generatedAt: '',
    hour12: false,
    trip: { id: 1, title: 'T', start: '', end: '', cover: 'x'.repeat(20_000) },
    days: [],
    bookings: [],
    packing: {
      items: Array.from({ length: 400 }, (_, i) => ({
        id: i,
        name: `Item number ${i} with a long name`,
        done: i % 2 === 0,
      })),
      packed: 200,
      total: 400,
    },
    applied: [],
  });

  it('leaves a small snapshot alone', () => {
    const small = { ...big(), packing: undefined, trip: null };
    expect(fitWatchSnapshot(small)).toBe(small);
  });

  it('drops the cover, then the done items, then halves the lists until it fits', () => {
    const fitted = fitWatchSnapshot(big(), 6_000);
    expect(fitted.trip?.cover).toBeUndefined();
    expect(fitted.packing?.items.every((i) => !i.done)).toBe(true);
    expect(JSON.stringify(fitted).length).toBeLessThanOrEqual(6_000);
    expect(fitted.packing?.total).toBe(400);
  });
});

describe('the watch actions', () => {
  it('keeps only well-formed ticks', () => {
    const good = { id: 'u1', tripId: 7, list: 'packing', itemId: 3, done: true };
    expect(
      parseWatchActions([good, { ...good, list: 'budget' }, { ...good, itemId: '3' }, null, 'x', { ...good, id: '' }])
    ).toEqual([good]);
    expect(parseWatchActions({})).toEqual([]);
  });

  it('applies them in order through the toggles and answers their ids, failed ones included', async () => {
    const calls: string[] = [];
    const toggles = {
      packing: vi.fn(async (trip: number, id: number, done: boolean) => {
        calls.push(`p${trip}:${id}:${done}`);
      }),
      todo: vi.fn(async () => {
        calls.push('t');
        throw new Error('offline');
      }),
    };
    const ids = await applyWatchActions(
      [
        { id: 'a', tripId: 7, list: 'packing', itemId: 1, done: true },
        { id: 'b', tripId: 7, list: 'todo', itemId: 2, done: false },
      ],
      toggles
    );
    expect(calls).toEqual(['p7:1:true', 't']);
    expect(ids).toEqual(['a', 'b']);
    expect(reportNativeFailure).toHaveBeenCalled();
  });

  it('takes them from the app, and nothing on a binary without the watch', async () => {
    vi.mocked(TrekShell.takeWatchActions).mockResolvedValueOnce({
      actions: [{ id: 'z', tripId: 1, list: 'todo', itemId: 9, done: true }, { bad: 1 }],
    });
    expect(await takeWatchActions()).toEqual([{ id: 'z', tripId: 1, list: 'todo', itemId: 9, done: true }]);
    vi.mocked(hasNativeFeature).mockReturnValueOnce(false);
    expect(await takeWatchActions()).toEqual([]);
  });
});

describe('publishWatch', () => {
  it('hands the fitted snapshot to the app', async () => {
    const snapshot = buildWatchSnapshot({
      trip: null,
      days: [],
      places: [],
      reservations: [],
      packing: [],
      todos: [],
      today: '2026-11-07',
      hour12: true,
      now: new Date('2026-11-07T10:00:00Z'),
    });
    await publishWatch(snapshot);
    expect(TrekShell.setWatchSnapshot).toHaveBeenCalledWith({ json: JSON.stringify(snapshot) });
  });
});
