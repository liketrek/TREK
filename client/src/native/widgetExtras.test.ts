import { describe, expect, it } from 'vitest';
import type { PackingItem, Reservation, TodoItem } from '../types';
import { bookingsAhead, packingSummary, stopLook, temperature, todosSummary, tripPlace } from './widgetExtras';

const reservation = (over: Partial<Reservation>): Reservation =>
  ({ id: 1, trip_id: 1, title: 'Booking', status: 'confirmed', type: 'other', ...over }) as Reservation;

const todo = (over: Partial<TodoItem>): TodoItem =>
  ({
    id: 1,
    trip_id: 1,
    name: 'Task',
    category: null,
    checked: 0,
    sort_order: 0,
    due_date: null,
    description: null,
    assigned_user_id: null,
    priority: 0,
    ...over,
  }) as TodoItem;

describe('bookingsAhead', () => {
  const days = new Map([[7, '2026-11-09']]);
  const time = (t: string) => `T${t}`;

  it('lists the bookings from today on, soonest first, with their kind, legs and status', () => {
    const list = bookingsAhead(
      [
        reservation({ id: 1, title: 'Old', reservation_time: '2026-11-01T10:00' }),
        reservation({
          id: 2,
          title: 'Dinner',
          type: 'restaurant',
          reservation_time: '2026-11-08T19:30',
          status: 'pending',
          location: 'Pontocho',
        }),
        reservation({
          id: 3,
          title: 'LH 716',
          type: 'flight',
          reservation_time: '2026-11-08T13:05',
          endpoints: [
            {
              role: 'to',
              sequence: 1,
              name: 'Tokyo Haneda',
              code: 'HND',
              lat: 0,
              lng: 0,
              timezone: null,
              local_time: null,
              local_date: null,
            },
            {
              role: 'from',
              sequence: 0,
              name: 'Frankfurt',
              code: 'FRA',
              lat: 0,
              lng: 0,
              timezone: null,
              local_time: null,
              local_date: null,
            },
          ],
        }),
        reservation({ id: 4, title: 'Museum', type: 'activity', day_id: 7 }),
        reservation({ id: 5, title: 'Undated' }),
        reservation({ id: 6, title: 'Cancelled', reservation_time: '2026-11-08T08:00', status: 'cancelled' }),
        reservation({ id: 7, title: 'Staged', reservation_time: '2026-11-08T08:00', ingest_state: 'staged' }),
      ],
      { dayDates: days, today: '2026-11-06', tripPath: '/trips/1', formatTime: time }
    );
    expect(list.map((b) => b.title)).toEqual(['LH 716', 'Dinner', 'Museum', 'Undated']);
    expect(list[0]).toEqual({
      title: 'LH 716',
      kind: 'flight',
      date: '2026-11-08',
      time: 'T13:05',
      detail: 'FRA → HND',
      confirmed: true,
      path: '/trips/1?tab=transports',
    });
    expect(list[1]).toMatchObject({
      kind: 'restaurant',
      detail: 'Pontocho',
      confirmed: false,
      path: '/trips/1?tab=buchungen',
    });
    expect(list[2]).toMatchObject({ kind: 'tour', date: '2026-11-09', time: null });
    expect(list[3]).toMatchObject({ kind: 'other', date: null });
  });

  it('stops at the limit', () => {
    const many = Array.from({ length: 8 }, (_, i) => reservation({ id: i, reservation_time: `2026-11-1${i}T10:00` }));
    expect(
      bookingsAhead(many, { dayDates: new Map(), today: '2026-11-06', tripPath: '/trips/1', formatTime: (t) => t })
    ).toHaveLength(5);
  });
});

describe('todosSummary', () => {
  it('counts the open ones and orders them by due date, then priority', () => {
    const summary = todosSummary(
      [
        todo({ id: 1, name: 'Done', checked: 1 }),
        todo({ id: 2, name: 'Someday', priority: 3 }),
        todo({ id: 3, name: 'Soon', due_date: '2026-11-08' }),
        todo({ id: 4, name: 'First', due_date: '2026-11-07T00:00:00' }),
        todo({ id: 5, name: 'Low', priority: 1 }),
      ],
      '/trips/1?tab=listen'
    );
    expect(summary.open).toBe(4);
    expect(summary.total).toBe(5);
    expect(summary.items.map((i) => i.name)).toEqual(['First', 'Soon', 'Someday', 'Low']);
    expect(summary.items[0]).toEqual({ name: 'First', due: '2026-11-07', priority: 0 });
  });
});

describe('packingSummary', () => {
  it('counts packed against all, and is null without a list', () => {
    const items = [{ checked: 1 }, { checked: 0 }, { checked: 1 }] as PackingItem[];
    expect(packingSummary(items, '/p')).toEqual({ packed: 2, total: 3, path: '/p' });
    expect(packingSummary([], '/p')).toBeNull();
  });
});

describe('tripPlace', () => {
  it('names the town and country most places share, without postcodes', () => {
    expect(
      tripPlace([
        { address: '68 Fukakusa Yabunouchicho, Fushimi Ward, 612-0882 Kyoto, Japan' },
        { address: 'Nakagyo Ward, 604-8054 Kyoto, Japan' },
        { address: '1-1 Chiyoda, 100-8111 Tokyo, Japan' },
        { address: null },
        { address: 'Nowhere' },
      ])
    ).toBe('Kyoto, Japan');
  });

  it('is null without usable addresses', () => {
    expect(tripPlace([{ address: 'Main Street' }, { address: '' }])).toBeNull();
  });
});

describe('stopLook and temperature', () => {
  it('maps a category to a colour and an SF Symbol, ignoring what it cannot use', () => {
    expect(stopLook({ color: '#E8A13A', icon: 'Coffee' })).toEqual({ color: '#E8A13A', symbol: 'cup.and.saucer.fill' });
    expect(stopLook({ color: 'red', icon: 'Unknown' })).toEqual({ color: null, symbol: null });
    expect(stopLook(null)).toEqual({ color: null, symbol: null });
  });

  it('converts to Fahrenheit only when asked, rounded', () => {
    expect(temperature(18.4, 'celsius')).toBe(18);
    expect(temperature(20, 'fahrenheit')).toBe(68);
    expect(temperature(-0.6, undefined)).toBe(-1);
  });
});
