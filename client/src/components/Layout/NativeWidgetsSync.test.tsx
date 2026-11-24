import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '../../../tests/helpers/render';
import { offlineDb } from '../../db/offlineDb';
import type { Day, Trip } from '../../types';

const published = vi.hoisted(() => ({ calls: [] as unknown[][] }));

vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(async () => ({ remove: vi.fn() })) } }));
vi.mock('../../native/capabilities', () => ({ useNativeCapabilities: () => ({ caps: {} }) }));
vi.mock('../../native/watch', () => ({
  applyWatchActions: vi.fn(async () => []),
  buildWatchSnapshot: vi.fn(),
  publishWatch: vi.fn(async () => {}),
  takeWatchActions: vi.fn(async () => []),
  watchActive: () => false,
}));
vi.mock('../../native/widgetMedia', () => ({
  widgetCover: vi.fn(async () => null),
  widgetWeather: vi.fn(async () => null),
}));
vi.mock('../../native/widgetOnline', () => ({
  atlasSummary: vi.fn(async () => null),
  collabSummary: vi.fn(async () => null),
  packingDetail: vi.fn(async () => null),
}));
vi.mock('../../native/widgets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../native/widgets')>();
  return {
    ...actual,
    widgetsActive: () => true,
    publishWidgets: vi.fn(async (...args: unknown[]) => {
      published.calls.push(args);
    }),
  };
});

import { collabSummary, packingDetail } from '../../native/widgetOnline';
import NativeWidgetsSync from './NativeWidgetsSync';

const trip = {
  id: 7,
  title: 'Lisbon',
  start_date: '2026-11-06',
  end_date: '2026-11-08',
  is_archived: 0,
} as unknown as Trip;
const day = (id: number, n: number, date: string, name: string) =>
  ({
    id,
    trip_id: 7,
    day_number: n,
    date,
    assignments: [{ id: id * 10, order_index: 0, place: { name, place_time: '10:00' } }],
  }) as unknown as Day;

describe('NativeWidgetsSync', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 7, 9, 0));
    published.calls = [];
    await offlineDb.trips.put(trip as never);
    await offlineDb.days.bulkPut([
      day(1, 1, '2026-11-06', 'Castle'),
      day(2, 2, '2026-11-07', 'Harbour'),
      day(3, 3, '2026-11-08', 'Market'),
    ] as never);
  });

  afterEach(async () => {
    vi.useRealTimers();
    await offlineDb.trips.clear();
    await offlineDb.days.clear();
    await offlineDb.todoItems.clear();
    await offlineDb.tripAddons.clear();
  });

  it('FE-NATIVE-WSYNC-001: writes today and every day ahead, so the widgets turn the day without the app', async () => {
    render(<NativeWidgetsSync />);
    await waitFor(() => expect(published.calls.length).toBeGreaterThan(0));
    const snapshot = published.calls[0][0] as {
      today: { date: string; stops: { name: string }[] } | null;
      days: { date: string; stops: { name: string }[] }[];
    };
    expect(snapshot.today).toMatchObject({ date: '2026-11-07', stops: [{ name: 'Harbour' }] });
    expect(snapshot.days.map((d) => [d.date, d.stops[0]?.name])).toEqual([
      ['2026-11-07', 'Harbour'],
      ['2026-11-08', 'Market'],
    ]);
  });

  it('FE-NATIVE-WSYNC-002: a trip with Lists and Collab switched off shows neither its todos nor its chat', async () => {
    await offlineDb.todoItems.put({ id: 70, trip_id: 7, name: 'Book ferry', checked: 0 } as never);
    const off = (id: string) => ({ id, name: id, icon: null, enabled: false, instanceEnabled: true, overridden: true });
    await offlineDb.tripAddons.put({ tripId: 7, addons: [off('packing'), off('collab')] });
    vi.mocked(packingDetail).mockClear();
    vi.mocked(collabSummary).mockClear();

    render(<NativeWidgetsSync />);
    await waitFor(() => expect(published.calls.length).toBeGreaterThan(0));
    const snapshot = published.calls[0][0] as { todos?: unknown; collab?: unknown };
    expect(snapshot.todos).toBeUndefined();
    expect(snapshot.collab).toBeUndefined();
    expect(vi.mocked(packingDetail)).not.toHaveBeenCalled();
    expect(vi.mocked(collabSummary)).not.toHaveBeenCalled();
  });

  it('FE-NATIVE-WSYNC-003: a trip the device never read the addons of shows its todos, as before', async () => {
    await offlineDb.todoItems.put({ id: 71, trip_id: 7, name: 'Book ferry', checked: 0 } as never);

    render(<NativeWidgetsSync />);
    await waitFor(() => expect(published.calls.length).toBeGreaterThan(0));
    const snapshot = published.calls[0][0] as { todos?: { items?: unknown[] } };
    expect(snapshot.todos).toBeDefined();
  });
});
