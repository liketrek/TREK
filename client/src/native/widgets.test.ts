import { describe, expect, it, vi } from 'vitest';
import type { Day, Trip } from '../types';

vi.mock('./platform', () => ({ isNativeIos: vi.fn(() => true) }));
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
import { buildSnapshot, pickTrip, publishWidgets, todayOf, tripDayState } from './widgets';

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
