import { describe, expect, it, vi } from 'vitest';
import type { Day, Trip } from '../types';

vi.mock('./platform', () => ({ isNativeIos: vi.fn(() => true), isNativeApp: vi.fn(() => true) }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn(() => true) }));
vi.mock('./reportFailure', () => ({ reportNativeFailure: vi.fn() }));
vi.mock('./trekShell', () => ({
  TrekShell: {
    setWidgetSnapshot: vi.fn(async () => {}),
    syncTripDay: vi.fn(async () => ({ running: true })),
    endTripDay: vi.fn(async () => {}),
  },
}));

import { TrekShell } from './trekShell';
import {
  buildSnapshot,
  pickTrip,
  publishWidgets,
  todayOf,
  tripDayState,
  widgetTripChoices,
  withBookings,
} from './widgets';

const trip = (id: number, start: string | null, end: string | null, archived = 0) =>
  ({ id, title: `Trip ${id}`, start_date: start, end_date: end, is_archived: archived }) as unknown as Trip;

const day = (id: number, n: number, date: string, places: { name: string; time?: string }[]) =>
  ({
    id,
    trip_id: 1,
    day_number: n,
    date,
    assignments: places.map((p, i) => ({
      id: id * 10 + i,
      order_index: i,
      place: { name: p.name, place_time: p.time ?? null },
    })),
  }) as unknown as Day;

const labels = {
  nextTrip: 'Next',
  today: 'Today',
  noTrip: 'None',
  inDays: 'in {n} days',
  tomorrow: 'Tomorrow',
  nothingPlanned: '-',
};

describe('pickTrip', () => {
  it('prefers the running trip, then the next upcoming one', () => {
    const trips = [
      trip(1, '2026-12-01', '2026-12-05'),
      trip(2, '2026-11-20', '2026-11-25'),
      trip(3, '2026-11-01', '2026-11-10'),
    ];
    expect(pickTrip(trips, '2026-11-06')?.id).toBe(3);
    expect(pickTrip(trips, '2026-11-12')?.id).toBe(2);
  });

  it('of several running trips takes the dashboard hero: the one that started first', () => {
    const trips = [
      trip(1, '2026-11-02', '2026-11-06'),
      trip(2, '2026-10-20', '2026-11-18'),
      trip(3, '2026-11-04', '2026-11-12'),
    ];
    expect(pickTrip(trips, '2026-11-06')?.id).toBe(2);
  });

  it('skips undated, archived and finished trips', () => {
    expect(
      pickTrip(
        [trip(1, null, null), trip(2, '2026-12-01', '2026-12-02', 1), trip(3, '2026-01-01', '2026-01-02')],
        '2026-11-06'
      )
    ).toBeNull();
  });
});

describe('todayOf and tripDayState', () => {
  const days = [
    day(2, 2, '2026-11-07', []),
    day(1, 1, '2026-11-06', [{ name: 'Museum', time: '09:00' }, { name: 'Walk' }, { name: 'Dinner', time: '19:30' }]),
  ];

  it('finds today in day order and keeps the plan order', () => {
    const today = todayOf(
      trip(1, '2026-11-06', '2026-11-07'),
      days,
      '2026-11-06',
      (n, m) => `${n}/${m}`,
      (t) => `T${t}`
    );
    expect(today?.dayLabel).toBe('1/2');
    expect(today?.stops.map((s) => s.name)).toEqual(['Museum', 'Walk', 'Dinner']);
    expect(today?.stops[0]).toMatchObject({ time: 'T09:00', minutes: 540 });
  });

  it('is null on a day outside the trip', () => {
    expect(
      todayOf(
        trip(1, '2026-11-06', '2026-11-07'),
        days,
        '2026-11-09',
        () => '',
        (t) => t
      )
    ).toBeNull();
  });

  it('names the next timed stop and counts the ones behind', () => {
    const today = todayOf(
      trip(1, '2026-11-06', '2026-11-07'),
      days,
      '2026-11-06',
      () => 'D',
      (t) => t
    );
    if (!today) throw new Error('the trip runs today');
    expect(tripDayState(today, 8 * 60, 'done')).toMatchObject({ nextName: 'Museum', done: 0, total: 2 });
    expect(tripDayState(today, 12 * 60, 'done')).toMatchObject({ nextName: 'Dinner', nextTime: '19:30', done: 1 });
    expect(tripDayState(today, 22 * 60, 'done')).toMatchObject({ nextName: 'done', done: 2, nextTime: undefined });
  });

  it('gives the Android Live Update the next stop in minutes and one colour per timed stop', () => {
    const state = tripDayState(
      {
        tripTitle: 'T',
        path: '/trips/1',
        dayLabel: 'D',
        stops: [
          { name: 'Museum', time: '10:00', minutes: 600, color: '#D6273B' },
          { name: 'Walk', time: null, minutes: null },
          { name: 'Dinner', time: '19:30', minutes: 1170, color: null },
        ],
      },
      12 * 60,
      'done'
    );
    expect(state).toMatchObject({
      nextName: 'Dinner',
      nextMinutes: 1170,
      colors: ['#D6273B', null],
      done: 1,
      total: 2,
    });
    expect(
      tripDayState({ tripTitle: 'T', path: '/', dayLabel: 'D', stops: [] }, 0, 'done').nextMinutes
    ).toBeUndefined();
  });
});

describe('publishWidgets', () => {
  it('writes the snapshot without the internal minutes and ends the activity on a day without times', async () => {
    const snapshot = buildSnapshot(
      trip(1, '2026-11-06', '2026-11-07'),
      { tripTitle: 'Trip 1', path: '/trips/1', dayLabel: 'D', stops: [{ name: 'Walk', time: null, minutes: null }] },
      labels
    );
    expect(snapshot.today?.stops[0]).toEqual({ name: 'Walk', time: null });
    await publishWidgets(snapshot, {
      tripTitle: 'Trip 1',
      path: '/trips/1',
      dayLabel: 'D',
      nextName: 'x',
      nextTime: undefined,
      done: 0,
      total: 0,
    });
    expect(JSON.parse(vi.mocked(TrekShell.setWidgetSnapshot).mock.calls[0][0].json).trip.path).toBe('/trips/1');
    expect(TrekShell.endTripDay).toHaveBeenCalled();
    expect(TrekShell.syncTripDay).not.toHaveBeenCalled();
  });
});

describe('the richer snapshot', () => {
  it('puts the timed bookings of the day between the stops and gives the day its place in the trip', () => {
    const days = [
      day(1, 1, '2026-11-06', [{ name: 'Museum', time: '09:00' }, { name: 'Walk' }, { name: 'Dinner', time: '19:30' }]),
      day(2, 2, '2026-11-07', []),
    ];
    const plain = todayOf(
      trip(1, '2026-11-06', '2026-11-07'),
      days,
      '2026-11-06',
      () => 'D',
      (t) => t
    );
    if (!plain) throw new Error('the trip runs today');
    const today = withBookings(
      plain,
      [
        { id: 1, trip_id: 1, title: 'Train', type: 'train', status: 'confirmed', reservation_time: '2026-11-06T12:15' },
        {
          id: 2,
          trip_id: 1,
          title: 'Tomorrow',
          type: 'flight',
          status: 'confirmed',
          reservation_time: '2026-11-07T08:00',
        },
        { id: 3, trip_id: 1, title: 'Gone', type: 'event', status: 'cancelled', reservation_time: '2026-11-06T10:00' },
      ] as never,
      '2026-11-06',
      (t) => t
    );
    expect(today.stops.map((s) => s.name)).toEqual(['Museum', 'Walk', 'Train', 'Dinner']);
    expect(today.stops[2]).toMatchObject({ time: '12:15', minutes: 735, symbol: 'tram.fill' });
    expect(today).toMatchObject({ index: 1, total: 2 });
    expect(withBookings(plain, [], '2026-11-06', (t) => t)).toBe(plain);
  });

  it('makes a stop of every leg of a flight with a stopover, and keeps a flight in the air ahead until it lands', () => {
    const plain = todayOf(trip(1, '2026-11-09', '2026-11-10'), [day(5, 1, '2026-11-09', []), day(6, 2, '2026-11-10', [])], '2026-11-09', () => 'D', (t) => t);
    if (!plain) throw new Error('the trip runs today');
    const legs = [
      { from: 'SNA', to: 'ATL', dep_day_id: 5, dep_time: '14:00', arr_day_id: 5, arr_time: '21:11' },
      { from: 'ATL', to: 'ORF', dep_day_id: 5, dep_time: '22:40', arr_day_id: 6, arr_time: '00:31' },
    ];
    const today = withBookings(
      plain,
      [
        { id: 1, trip_id: 1, title: 'Car', type: 'car', status: 'confirmed', reservation_time: '2026-11-09T13:00' },
        {
          id: 2,
          trip_id: 1,
          title: 'SNA → ATL → ORF',
          type: 'flight',
          status: 'confirmed',
          reservation_time: '2026-11-09T14:00',
          metadata: JSON.stringify({ legs }),
        },
      ] as never,
      '2026-11-09',
      (t) => t
    );
    expect(today.stops.map((s) => s.name)).toEqual(['Car', 'SNA → ATL', 'ATL → ORF']);
    // In the air on the first leg, between the legs, and on the second leg past midnight.
    expect(tripDayState(today, 16 * 60 + 22, 'done')).toMatchObject({ nextName: 'SNA → ATL', done: 1, total: 3 });
    expect(tripDayState(today, 21 * 60 + 30, 'done')).toMatchObject({ nextName: 'ATL → ORF', done: 2 });
    expect(tripDayState(today, 23 * 60 + 30, 'done')).toMatchObject({ nextName: 'ATL → ORF', done: 2 });
  });

  it('counts a booking with an end time as under way until it ends', () => {
    const plain = todayOf(trip(1, '2026-11-09', '2026-11-09'), [day(5, 1, '2026-11-09', [])], '2026-11-09', () => 'D', (t) => t);
    if (!plain) throw new Error('the trip runs today');
    const today = withBookings(
      plain,
      [
        {
          id: 1,
          trip_id: 1,
          title: 'Tour',
          type: 'tour',
          status: 'confirmed',
          reservation_time: '2026-11-09T10:00',
          reservation_end_time: '2026-11-09T13:00',
        },
      ] as never,
      '2026-11-09',
      (t) => t
    );
    expect(tripDayState(today, 11 * 60, 'done')).toMatchObject({ nextName: 'Tour', done: 0 });
    expect(tripDayState(today, 13 * 60 + 1, 'done')).toMatchObject({ nextName: 'done', done: 1 });
  });

  it('carries the extras and leaves out what is empty', () => {
    const snapshot = buildSnapshot(
      { ...trip(1, '2026-11-06', '2026-11-07'), day_count: 2 } as Trip,
      {
        tripTitle: 'Trip 1',
        path: '/trips/1',
        dayLabel: 'D',
        index: 1,
        total: 2,
        stops: [{ name: 'Tea', time: '10:00', minutes: 600, color: '#2FA37A', symbol: 'leaf.fill' }],
      },
      labels,
      {
        place: 'Kyoto, Japan',
        cover: null,
        placeCount: 12,
        memberCount: 0,
        weather: { temp: 18, main: 'Clear', label: 'Sunny' },
        bookings: [],
        todos: { open: 1, total: 2, items: [], path: '/trips/1?tab=listen' },
        packing: null,
      }
    );
    expect(snapshot.trip).toEqual({
      title: 'Trip 1',
      start: '2026-11-06',
      end: '2026-11-07',
      path: '/trips/1',
      place: 'Kyoto, Japan',
      dayCount: 2,
      placeCount: 12,
    });
    expect(snapshot.today).toEqual({
      dayLabel: 'D',
      index: 1,
      total: 2,
      stops: [{ name: 'Tea', time: '10:00', minutes: 600, color: '#2FA37A', symbol: 'leaf.fill' }],
    });
    expect(snapshot.weather).toEqual({ temp: 18, main: 'Clear', label: 'Sunny' });
    expect(snapshot.bookings).toEqual([]);
    expect(snapshot.todos?.open).toBe(1);
    expect(snapshot).not.toHaveProperty('packing');
  });
});

describe('widgets set to a trip', () => {
  it('offers the trips running or ahead, in the dashboard order, at most six', () => {
    const trips = [
      trip(1, '2026-01-01', '2026-01-05'),
      trip(2, '2026-12-01', '2026-12-05'),
      trip(3, '2026-11-04', '2026-11-12'),
      trip(4, '2026-11-20', '2026-11-22', 1),
      trip(5, null, null),
      ...[6, 7, 8, 9, 10, 11].map((id) => trip(id, `2027-0${id - 5}-01`, `2027-0${id - 5}-03`)),
    ];
    expect(widgetTripChoices(trips, '2026-11-06').map((t) => t.id)).toEqual([3, 2, 6, 7, 8, 9]);
  });

  it('writes each trip under its own key and the list to pick from', async () => {
    vi.mocked(TrekShell.setWidgetSnapshot).mockClear();
    const snapshot = buildSnapshot(trip(2, '2026-12-01', '2026-12-05'), null, labels);
    await publishWidgets(snapshot, null, [
      { id: 2, title: 'Trip 2', start: '2026-12-01', end: '2026-12-05', snapshot },
    ]);
    const calls = vi.mocked(TrekShell.setWidgetSnapshot).mock.calls.map(([options]) => options);
    expect(calls.map((c) => c.key)).toEqual([undefined, 'trip.2', 'trips']);
    expect(JSON.parse(calls[2].json)).toEqual([{ id: 2, title: 'Trip 2', start: '2026-12-01', end: '2026-12-05' }]);
  });
});
